import React, { useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Share,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import WatermarkOverlay from '../components/WatermarkOverlay';
import { formatGPS } from '../utils/gpsUtils';

export default function PreviewScreen({ route, navigation }) {
  const { photo } = route.params;
  const viewShotRef = useRef(null);

  const handleShare = async () => {
    try {
      await Share.share({ url: photo.uri, title: `Survey Photo - ${photo.project}` });
    } catch (e) {}
  };

  const meta = [
    { label: '📁 Project', value: photo.project || 'Unknown' },
    { label: '📍 GPS', value: photo.gps ? formatGPS(photo.gps) : 'Not available' },
    { label: '🕐 Time', value: photo.timestamp },
    { label: '🎚️ Quality', value: (photo.quality || 'high').toUpperCase() },
    { label: '📐 Size', value: `${photo.width} × ${photo.height}px` },
    { label: '📂 Folder', value: photo.subfolder ? `${photo.folder}/${photo.subfolder}` : photo.folder },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Camera')} style={styles.backBtn}>
          <Text style={styles.backText}>← Camera</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Preview</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo with watermark */}
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
            <WatermarkOverlay
              watermarks={photo.watermarks || {}}
              gps={photo.gps}
              timestamp={photo.timestamp}
              quality={photo.quality}
              projectName={photo.project}
            />
          </View>
        </ViewShot>

        {/* Metadata Card */}
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
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.primaryBtnText}>📷 Take Another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Gallery')}
          >
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
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 4 },
  backText: { color: '#f59e0b', fontSize: 15 },
  headerTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  shareBtn: { padding: 4 },
  shareText: { color: '#f59e0b', fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
  },
  image: { width: '100%', height: 320 },
  metaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
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
