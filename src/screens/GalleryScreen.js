import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { getPhotoLog, deletePhotosFromLog, getSettings } from '../utils/storageUtils';
import AdBanner from '../components/AdBanner';

export default function GalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState({ removeAds: false });

  const load = useCallback(async () => {
    const log = await getPhotoLog();
    const s = await getSettings();
    setSettings(s);
    setPhotos(log);
    const unique = [...new Set(log.map((p) => p.project).filter(Boolean))];
    setProjects(unique);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleSelect = (uri) => {
    setSelected((prev) =>
      prev.includes(uri) ? prev.filter((u) => u !== uri) : [...prev, uri]
    );
  };

  const deleteSelected = () => {
    Alert.alert('Delete Photos', `Delete ${selected.length} photo(s) from log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deletePhotosFromLog(selected);
          setSelected([]);
          load();
        },
      },
    ]);
  };

  const filtered = filter === 'all'
    ? photos
    : photos.filter((p) => p.project === filter);

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item.uri);
    return (
      <TouchableOpacity
        style={[styles.thumb, isSelected && styles.thumbSelected]}
        onPress={() => {
          if (selected.length > 0) { toggleSelect(item.uri); return; }
          navigation.navigate('Preview', { photo: item });
        }}
        onLongPress={() => toggleSelect(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isSelected && <View style={styles.checkOverlay}><Text style={styles.checkMark}>✓</Text></View>}
        <View style={styles.thumbMeta}>
          <Text style={styles.thumbTime} numberOfLines={1}>{item.timestamp}</Text>
          {item.gps?.latitude && <Text style={styles.thumbGPS} numberOfLines={1}>📍 {item.gps.latitude}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.backText}>← Camera</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery ({filtered.length})</Text>
        {selected.length > 0 ? (
          <TouchableOpacity onPress={deleteSelected}>
            <Text style={styles.deleteText}>🗑 Delete ({selected.length})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Batch', { photos: filtered })}>
            <Text style={styles.batchText}>Batch</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Project Filter */}
      <View style={styles.filterRow}>
        {['all', ...projects].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterChip, filter === p && styles.filterChipActive]}
            onPress={() => setFilter(p)}
          >
            <Text style={[styles.filterChipText, filter === p && styles.filterChipTextActive]}>
              {p === 'all' ? 'All Projects' : p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.savedAt}
        numColumns={2}
        contentContainerStyle={styles.grid}
        // [FIX P1, P2] Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No photos yet.</Text>
            <Text style={styles.emptySubtext}>Go capture some survey photos!</Text>
          </View>
        }
      />

      {!settings.removeAds && <AdBanner />}
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
  backText: { color: '#f59e0b', fontSize: 15 },
  headerTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  deleteText: { color: '#ef4444', fontSize: 14 },
  batchText: { color: '#f59e0b', fontSize: 15 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    paddingVertical: 10, gap: 8, flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  filterChipText: { color: '#64748b', fontSize: 12 },
  filterChipTextActive: { color: '#0f172a', fontWeight: '700' },
  grid: { padding: 8 },
  thumb: {
    flex: 1, margin: 6, borderRadius: 12,
    overflow: 'hidden', backgroundColor: '#1e293b',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbSelected: { borderColor: '#f59e0b' },
  thumbImg: { width: '100%', height: 160 },
  checkOverlay: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#f59e0b', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  checkMark: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  thumbMeta: { padding: 8 },
  thumbTime: { color: '#94a3b8', fontSize: 10 },
  thumbGPS: { color: '#475569', fontSize: 10 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#f8fafc', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#475569', fontSize: 14, marginTop: 6 },
});
