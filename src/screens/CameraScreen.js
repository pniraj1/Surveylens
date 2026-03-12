import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentLocation, requestLocationPermission, formatGPS } from '../utils/gpsUtils';
import { getSettings, getActiveProject, QUALITY_MAP, saveSettings } from '../utils/storageUtils';
import { trackPhotoTaken } from '../utils/adManager';

const QUALITIES = ['low', 'medium', 'high', 'raw'];
const QUALITY_LABELS = { low: 'Low', medium: 'Med', high: 'High', raw: 'RAW' };

export default function CameraScreen({ navigation }) {
  const gpsIntervalRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [project, setProject] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('searching');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    loadData();
    startGPS();
    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const loadData = useCallback(async () => {
    const s = await getSettings();
    const p = await getActiveProject();
    setSettings(s);
    setProject(p);
    if (!p) navigation.replace('Setup');
  }, [navigation]);

  const startGPS = async () => {
    const granted = await requestLocationPermission();
    if (!granted) { setGpsStatus('unavailable'); return; }

    const loc = await getCurrentLocation();
    if (loc) { setGps(loc); setGpsStatus('ok'); }
    else { setGpsStatus('unavailable'); }

    gpsIntervalRef.current = setInterval(async () => {
      const updated = await getCurrentLocation();
      if (updated) { setGps(updated); setGpsStatus('ok'); }
    }, 10000);
  };

  const getTimestamp = () => {
    if (settings?.useCustomDateTime && settings?.customDateTime) {
      return new Date(settings.customDateTime).toLocaleString();
    }
    return new Date().toLocaleString();
  };

  const handleQualityChange = useCallback(async (q) => {
    const updated = { ...settings, quality: q };
    await saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  const takePicture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      // Request camera permission via ImagePicker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        setCapturing(false);
        return;
      }

      const quality = QUALITY_MAP[settings?.quality || 'high'];

      // Launch the system camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
        exif: true,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) {
        setCapturing(false);
        return;
      }

      const asset = result.assets[0];

      // Snapshot GPS at moment of capture (try fresh fix, fall back to last known)
      const captureGps = (await getCurrentLocation()) ?? gps;

      const sanitize = (str) => (str || '').replace(/[\/\\:*?"<>|]/g, '_').trim();

      const photoData = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        gps: captureGps,
        timestamp: getTimestamp(),
        quality: settings?.quality || 'high',
        project: project?.name,
        projectId: project?.id,
        folder: sanitize(project?.folder) || 'SurveyLens',
        subfolder: sanitize(project?.subfolder),
        savedAt: new Date().toISOString(),
        watermarks: settings?.watermarks,
      };

      // NOTE: We do NOT save to media library here.
      // PreviewScreen burns watermarks via ViewShot and saves the watermarked version.
      trackPhotoTaken();
      navigation.navigate('Preview', { photo: photoData });

    } catch (e) {
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
      console.error('takePicture error:', e);
      setCapturing(false);
    }
    // Don't reset capturing here — navigating away handles it naturally
  };

  if (!settings) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#f59e0b" size="large" />
      </View>
    );
  }

  const currentQuality = settings?.quality || 'high';
  const gpsColor = gpsStatus === 'ok' ? '#22c55e' : gpsStatus === 'searching' ? '#f59e0b' : '#ef4444';
  const gpsIcon = gpsStatus === 'ok' ? '📍' : gpsStatus === 'searching' ? '🔍' : '⚠️';
  const gpsText = gpsStatus === 'ok'
    ? formatGPS(gps)
    : gpsStatus === 'searching' ? 'Acquiring GPS...' : 'GPS unavailable';

  const activeWatermarks = settings?.watermarks
    ? Object.entries(settings.watermarks).filter(([, v]) => v)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Projects')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>📁</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.projectBadge}
          onPress={() => navigation.navigate('Setup', { isEdit: true, project })}
        >
          <Text style={styles.projectBadgeText} numberOfLines={1} ellipsizeMode="tail">
            {project?.name || 'No Project'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* GPS bar */}
      <View style={styles.gpsBar}>
        <Text style={styles.gpsIcon}>{gpsIcon}</Text>
        <Text style={[styles.gpsText, { color: gpsColor }]} numberOfLines={1}>{gpsText}</Text>
        {gpsStatus === 'searching' && (
          <ActivityIndicator size="small" color="#f59e0b" style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Main area */}
      <View style={styles.body}>

        {/* Watermark preview card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Will be watermarked on photo</Text>
          {activeWatermarks.length > 0 ? (
            <View style={styles.tagRow}>
              {settings.watermarks.projectName && project?.name && (
                <View style={styles.tag}><Text style={styles.tagText}>📁 {project.name}</Text></View>
              )}
              {settings.watermarks.gps && (
                <View style={styles.tag}><Text style={styles.tagText}>📍 GPS coords</Text></View>
              )}
              {settings.watermarks.timestamp && (
                <View style={styles.tag}><Text style={styles.tagText}>🕐 Timestamp</Text></View>
              )}
              {settings.watermarks.resolution && (
                <View style={styles.tag}><Text style={styles.tagText}>📷 Quality</Text></View>
              )}
            </View>
          ) : (
            <Text style={styles.noWatermark}>No watermarks — enable in Settings ⚙️</Text>
          )}
        </View>

        {/* Capture button */}
        <TouchableOpacity
          style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
          onPress={takePicture}
          disabled={capturing}
          activeOpacity={0.85}
        >
          {capturing
            ? <ActivityIndicator color="#0f172a" size="large" />
            : <>
                <Text style={styles.captureBtnIcon}>📷</Text>
                <Text style={styles.captureBtnText}>CAPTURE</Text>
              </>
          }
        </TouchableOpacity>
        <Text style={styles.hint}>Opens system camera</Text>
      </View>

      {/* Quality selector — always visible, no floating panel */}
      <View style={styles.qualitySection}>
        <Text style={styles.qualityLabel}>Photo Quality</Text>
        <View style={styles.qualityRow}>
          {QUALITIES.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.qualityBtn, currentQuality === q && styles.qualityBtnActive]}
              onPress={() => handleQualityChange(q)}
            >
              <Text style={[styles.qualityBtnText, currentQuality === q && styles.qualityBtnTextActive]}>
                {q.toUpperCase()}
              </Text>
              <Text style={[styles.qualitySubText, currentQuality === q && styles.qualityBtnTextActive]}>
                {QUALITY_LABELS[q]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Gallery')}>
          <Text style={styles.navIcon}>🗂</Text>
          <Text style={styles.navText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Batch')}>
          <Text style={styles.navIcon}>📦</Text>
          <Text style={styles.navText}>Batch</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 24 },
  projectBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, maxWidth: 200,
  },
  projectBadgeText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },

  gpsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#0f172a',
  },
  gpsIcon: { fontSize: 15, marginRight: 8 },
  gpsText: { fontSize: 12, fontFamily: 'monospace', flex: 1 },

  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  card: {
    width: '100%', backgroundColor: '#1e293b',
    borderRadius: 14, padding: 16, marginBottom: 32,
  },
  cardLabel: { color: '#475569', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { color: '#f59e0b', fontSize: 12 },
  noWatermark: { color: '#475569', fontSize: 13, fontStyle: 'italic' },

  captureBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnIcon: { fontSize: 40, marginBottom: 4 },
  captureBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: 2 },
  hint: { color: '#334155', fontSize: 12, marginTop: 12 },

  qualitySection: {
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  qualityLabel: { color: '#475569', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  qualityRow: { flexDirection: 'row', gap: 8 },
  qualityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#334155',
    alignItems: 'center', backgroundColor: '#1e293b',
  },
  qualityBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  qualityBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  qualityBtnTextActive: { color: '#0f172a' },
  qualitySubText: { color: '#475569', fontSize: 10, marginTop: 2 },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  navBtn: { alignItems: 'center', padding: 8 },
  navIcon: { fontSize: 22 },
  navText: { color: '#64748b', fontSize: 11, marginTop: 3 },
});
