import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Share, Alert, ActivityIndicator,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import WatermarkOverlay from '../components/WatermarkOverlay';
import { formatGPS } from '../utils/gpsUtils';
import { addPhotoToLog } from '../utils/storageUtils';

export default function PreviewScreen({ route, navigation }) {
  const { photo } = route.params;
  const viewShotRef = useRef(null);

  const [saveStatus, setSaveStatus] = useState('saving'); // saving | saved | error
  const [watermarkedUri, setWatermarkedUri] = useState(null);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    // Give ViewShot time to fully render before capturing
    const timer = setTimeout(() => {
      burnAndSave();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const burnAndSave = async () => {
    try {
      // Ensure media library permission
      let perm = mediaPermission;
      if (!perm?.granted) {
        perm = await requestMediaPermission();
        if (!perm?.granted) {
          setSaveStatus('error');
          Alert.alert('Permission needed', 'Media library access is required to save photos.');
          return;
        }
      }

      // Capture photo + watermark overlay as a single image
      const capturedUri = await viewShotRef.current.capture();
      setWatermarkedUri(capturedUri);

      // Save the watermarked image to the device gallery
      const folder = photo.subfolder
        ? `${photo.folder}/${photo.subfolder}`
        : photo.folder || 'SurveyLens';

      const asset = await MediaLibrary.createAssetAsync(capturedUri);
      await MediaLibrary.createAlbumAsync(folder, asset, false);

      // Save to app's photo log with the watermarked URI
      await addPhotoToLog({
        ...photo,
        uri: capturedUri,
        assetId: asset.id,
      });

      setSaveStatus('saved');
    } catch (e) {
      console.error('burnAndSave error:', e);
      setSaveStatus('error');
      // Still log the original even if watermark burn failed
      try {
        await addPhotoToLog(photo);
      } catch {}
    }
  };

  const handleShare = async () => {
    try {
      const shareUri = watermarkedUri || photo.uri;
      await Share.share({ url: shareUri, title: `Survey Photo - ${photo.project}` });
    } catch (e) {}
  };

  const handleRetake = () => {
    navigation.navigate('Camera');
  };

  const meta = [
    { label: '📁 Project', value: photo.project || 'Unknown' },
    { label: '📍 GPS', value: photo.gps ? formatGPS(photo.gps) : 'Not available' },
    { label: '🕐 Time', value: photo.timestamp },
    { label: '🎚️ Quality', value: (photo.quality || 'high').toUpperCase() },
    { label: '📐 Size', value: `${photo.width} × ${photo.height}px` },
    { label: '📂 Folder', value: photo.subfolder ? `${photo.folder}/${photo.subfolder}` : photo.folder },
  ];

  const statusConfig = {
    saving: { color: '#f59e0b', icon: '⏳', text: 'Burning watermarks & saving...' },
    saved:  { color: '#22c55e', icon: '✅', text: 'Saved to gallery with watermarks' },
    error:  { color: '#ef4444', icon: '⚠️', text: 'Save failed — photo may lack watermarks' },
  };
  const status = statusConfig[saveStatus];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
          <Text style={styles.backText}>← Camera</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Preview</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share ↗</Text>
        </TouchableOpacity>
      </View>

      {/* Save status banner */}
      <View style={[styles.statusBanner, { borderColor: status.color }]}>
        {saveStatus === 'saving'
          ? <ActivityIndicator size="small" color={status.color} style={{ marginRight: 8 }} />
          : <Text style={styles.statusIcon}>{status.icon}</Text>
        }
        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ViewShot captures photo + watermark overlay together */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.95 }}
          style={styles.imageContainer}
        >
          <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
          <WatermarkOverlay
            watermarks={photo.watermarks || {}}
            gps={photo.gps}
            timestamp={photo.timestamp}
            quality={photo.quality}
            projectName={photo.project}
          />
        </ViewShot>

        {/* Metadata card */}
        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Photo Metadata</Text>
          {meta.map((item) => (
            <View key={item.label} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{item.label}</Text>
              <Text style={styles.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRetake}>
            <Text style={styles.primaryBtnText}>📷 Take Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Gallery')}>
            <Text style={styles.secondaryBtnText}>🗂 View Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 4 },
  backText: { color: '#f59e0b', fontSize: 15 },
  headerTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  shareBtn: { padding: 4 },
  shareText: { color: '#f59e0b', fontSize: 15 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderLeftWidth: 3, borderBottomWidth: 0,
    borderRightWidth: 0, borderTopWidth: 0,
  },
  statusIcon: { fontSize: 16, marginRight: 8 },
  statusText: { fontSize: 13, fontWeight: '500' },

  scroll: { padding: 16, paddingBottom: 40 },

  imageContainer: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#000', marginBottom: 16,
    width: '100%', aspectRatio: 4 / 3,
  },
  image: { width: '100%', height: '100%' },

  metaCard: {
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 16, marginBottom: 20, gap: 10,
  },
  metaTitle: { color: '#f59e0b', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  metaLabel: { color: '#64748b', fontSize: 13, flex: 1 },
  metaValue: { color: '#f8fafc', fontSize: 13, flex: 2, textAlign: 'right' },

  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#f59e0b', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  secondaryBtnText: { color: '#94a3b8', fontSize: 15 },
});
