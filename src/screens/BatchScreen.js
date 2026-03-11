import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, Alert, Share,
} from 'react-native';
import * as Sharing from 'expo-sharing';

export default function BatchScreen({ route, navigation }) {
  const { photos = [] } = route.params || {};
  const [selected, setSelected] = useState([]);
  const [renamePattern, setRenamePattern] = useState('{Project}_{Date}_{Seq}');

  const selectAll = () => setSelected(photos.map((p) => p.uri));
  const clearAll = () => setSelected([]);

  const toggleSelect = (uri) => {
    setSelected((prev) =>
      prev.includes(uri) ? prev.filter((u) => u !== uri) : [...prev, uri]
    );
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      Alert.alert('Nothing selected', 'Please select photos to export.');
      return;
    }
    try {
      // Share first selected (sharing multiple files requires native module)
      const uri = selected[0];
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Share.share({ url: uri });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not share photos.');
    }
  };

  const handleRename = () => {
    if (selected.length === 0) {
      Alert.alert('Nothing selected', 'Please select photos to rename.');
      return;
    }
    Alert.alert(
      'Rename Preview',
      `Pattern: ${renamePattern}\n\nExample output:\n` +
        selected.slice(0, 3).map((_, i) => {
          const photo = photos.find((p) => p.uri === selected[i]);
          if (!photo) return '';
          return renamePattern
            .replace('{Project}', photo.project || 'Survey')
            .replace('{Date}', new Date(photo.savedAt).toISOString().slice(0, 10))
            .replace('{GPS}', photo.gps ? `${photo.gps.latitude}_${photo.gps.longitude}` : 'NoGPS')
            .replace('{Seq}', String(i + 1).padStart(3, '0'));
        }).join('\n'),
      [{ text: 'OK' }]
    );
  };

  const PATTERNS = [
    '{Project}_{Date}_{Seq}',
    '{Date}_{GPS}_{Seq}',
    '{Project}_{GPS}_{Date}',
  ];

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item.uri);
    return (
      <TouchableOpacity
        style={[styles.thumb, isSelected && styles.thumbSelected]}
        onPress={() => toggleSelect(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbImg} />
        {isSelected && (
          <View style={styles.checkOverlay}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Operations</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Selection controls */}
      <View style={styles.selectBar}>
        <TouchableOpacity onPress={selectAll} style={styles.selBtn}>
          <Text style={styles.selBtnText}>Select All</Text>
        </TouchableOpacity>
        <Text style={styles.selCount}>{selected.length}/{photos.length} selected</Text>
        <TouchableOpacity onPress={clearAll} style={styles.selBtn}>
          <Text style={styles.selBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.savedAt}
        numColumns={3}
        contentContainerStyle={styles.grid}
        style={styles.grid}
      />

      {/* Rename Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Rename Pattern</Text>
        <TextInput
          style={styles.patternInput}
          value={renamePattern}
          onChangeText={setRenamePattern}
          placeholderTextColor="#475569"
        />
        <View style={styles.patternChips}>
          {PATTERNS.map((p) => (
            <TouchableOpacity key={p} style={styles.chip} onPress={() => setRenamePattern(p)}>
              <Text style={styles.chipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.patternHint}>
          Variables: {'{Project}'} {'{Date}'} {'{GPS}'} {'{Seq}'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleRename}>
            <Text style={styles.actionBtnText}>Preview Rename</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.exportBtn]} onPress={handleExport}>
            <Text style={styles.exportBtnText}>📤 Export Selected</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  selectBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 12, paddingHorizontal: 16,
    backgroundColor: '#1e293b',
  },
  selBtn: { padding: 6 },
  selBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  selCount: { color: '#94a3b8', fontSize: 13 },
  grid: { flex: 1, padding: 4 },
  thumb: {
    flex: 1, margin: 3, borderRadius: 8,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  thumbSelected: { borderColor: '#f59e0b' },
  thumbImg: { width: '100%', height: 100 },
  checkOverlay: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#f59e0b', width: 22, height: 22,
    borderRadius: 11, justifyContent: 'center', alignItems: 'center',
  },
  checkMark: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  panel: {
    backgroundColor: '#1e293b', padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#334155',
  },
  panelTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  patternInput: {
    backgroundColor: '#0f172a', color: '#f59e0b',
    borderRadius: 10, padding: 12, fontSize: 13,
    borderWidth: 1, borderColor: '#334155', fontFamily: 'monospace',
  },
  patternChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { color: '#64748b', fontSize: 11 },
  patternHint: { color: '#475569', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  actionBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  exportBtn: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  exportBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
});
