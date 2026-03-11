import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { getCurrentLocation, requestLocationPermission } from '../utils/gpsUtils';
import { getSettings, getActiveProject, QUALITY_MAP, addPhotoToLog } from '../utils/storageUtils';
import { trackPhotoTaken } from '../utils/adManager';
import WatermarkOverlay from '../components/WatermarkOverlay';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [project, setProject] = useState(null);
  const [gps, setGps] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');

  useEffect(() => {
    loadData();
    startGPS();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const s = await getSettings();
    const p = await getActiveProject();
    setSettings(s);
    setProject(p);
    if (!p) navigation.replace('Setup');
  };

  const startGPS = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      const loc = await getCurrentLocation();
      setGps(loc);
      setInterval(async () => {
        const updated = await getCurrentLocation();
        setGps(updated);
      }, 10000);
    }
  };

  const getTimestamp = () => {
    if (settings?.useCustomDateTime && settings?.customDateTime) {
      return new Date(settings.customDateTime).toLocaleString();
    }
    return new Date().toLocaleString();
  };

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const quality = QUALITY_MAP[settings?.quality || 'high'];
      const photo = await cameraRef.current.takePictureAsync({ quality, skipProcessing: false });

      const photoData = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        gps,
        timestamp: getTimestamp(),
        quality: settings?.quality || 'high',
        project: project?.name,
        projectId: project?.id,
        folder: project?.folder,
        subfolder: project?.subfolder,
        savedAt: new Date().toISOString(),
        watermarks: settings?.watermarks,
      };

      // Save to media library
      if (mediaPermission?.granted) {
        const album = project?.subfolder
          ? `${project.folder}/${project.subfolder}`
          : project?.folder || 'SurveyLens';
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        await MediaLibrary.createAlbumAsync(album, asset, false);
        photoData.assetId = asset.id;
      }

      await addPhotoToLog(photoData);
      trackPhotoTaken();

      navigation.navigate('Preview', { photo: photoData });
    } catch (e) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) return <View style={styles.loading}><ActivityIndicator color="#f59e0b" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📷 Camera access needed</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qualities = ['low', 'medium', 'high', 'raw'];

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Projects')} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>📁</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.projectBadge} onPress={() => navigation.navigate('Setup', { isEdit: true, project })}>
            <Text style={styles.projectBadgeText} numberOfLines={1}>
              {project?.name || 'No Project'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Watermark */}
        {settings && (
          <WatermarkOverlay
            watermarks={settings.watermarks}
            gps={gps}
            timestamp={getTimestamp()}
            quality={settings.quality}
            projectName={project?.name}
          />
        )}

        {/* Quality Panel */}
        {showQualityPanel && settings && (
          <View style={styles.qualityPanel}>
            <Text style={styles.qualityTitle}>Photo Quality</Text>
            <View style={styles.qualityRow}>
              {qualities.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityBtn, settings.quality === q && styles.qualityBtnActive]}
                  onPress={async () => {
                    const { saveSettings } = await import('../utils/storageUtils');
                    const updated = { ...settings, quality: q };
                    await saveSettings(updated);
                    setSettings(updated);
                    setShowQualityPanel(false);
                  }}
                >
                  <Text style={[styles.qualityBtnText, settings.quality === q && styles.qualityBtnTextActive]}>
                    {q.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          <View style={styles.controlRow}>
            {/* Flash */}
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => setFlash(flash === 'off' ? 'on' : flash === 'on' ? 'auto' : 'off')}
            >
              <Text style={styles.sideBtnText}>
                {flash === 'off' ? '⚡' : flash === 'on' ? '💡' : '🌟'}
              </Text>
              <Text style={styles.sideBtnLabel}>{flash}</Text>
            </TouchableOpacity>

            {/* Shutter */}
            <TouchableOpacity
              style={[styles.shutter, capturing && styles.shutterCapturing]}
              onPress={takePicture}
              disabled={capturing}
            >
              {capturing
                ? <ActivityIndicator color="#0f172a" size="large" />
                : <View style={styles.shutterInner} />
              }
            </TouchableOpacity>

            {/* Flip + Quality */}
            <View style={styles.rightBtns}>
              <TouchableOpacity
                style={styles.sideBtn}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <Text style={styles.sideBtnText}>🔄</Text>
                <Text style={styles.sideBtnLabel}>flip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sideBtn}
                onPress={() => setShowQualityPanel(!showQualityPanel)}
              >
                <Text style={styles.sideBtnText}>🎚️</Text>
                <Text style={styles.sideBtnLabel}>{settings?.quality || 'high'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gallery shortcut */}
          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Text style={styles.galleryBtnText}>🗂 View Gallery</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  permissionText: { color: '#f8fafc', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  permissionBtn: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 16, paddingHorizontal: 32 },
  permissionBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iconBtn: { padding: 8 },
  iconBtnText: { fontSize: 24 },
  projectBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    maxWidth: 200,
  },
  projectBadgeText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  qualityPanel: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
  },
  qualityTitle: { color: '#94a3b8', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  qualityRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  qualityBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
  },
  qualityBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  qualityBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  qualityBtnTextActive: { color: '#0f172a' },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingBottom: 32,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shutter: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f59e0b',
  },
  shutterCapturing: { backgroundColor: '#f59e0b' },
  shutterInner: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  sideBtn: { alignItems: 'center', width: 60 },
  sideBtnText: { fontSize: 26 },
  sideBtnLabel: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  rightBtns: { gap: 12, alignItems: 'center' },
  galleryBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  galleryBtnText: { color: '#94a3b8', fontSize: 13 },
});
