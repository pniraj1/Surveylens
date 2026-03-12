import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { getProjects, deleteProject, setActiveProject } from '../utils/storageUtils';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const list = await getProjects();
    setProjects(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const handleSelect = async (project) => {
    await setActiveProject(project);
    navigation.navigate('Camera');
  };

  const handleDelete = (project) => {
    const label = project.subfolder
      ? `${project.folder} / ${project.subfolder}`
      : project.folder || project.name;
    Alert.alert('Delete Survey', `Remove "${label}" from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (project?.id) { await deleteProject(project.id); loadProjects(); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const folderDisplay = item.folder || item.name || 'Unknown';
    const fullPath = item.subfolder
      ? `${folderDisplay} / ${item.subfolder}`
      : folderDisplay;

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>📂</Text>
        </View>
        <View style={styles.cardBody}>
          {/* Primary: folder / subfolder */}
          <Text style={styles.cardFolder}>{folderDisplay}</Text>
          {item.subfolder ? (
            <Text style={styles.cardSubfolder}>└ {item.subfolder}</Text>
          ) : null}
          <Text style={styles.cardPath}>💾 /Pictures/{fullPath}/</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surveys</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Setup')}>
          <Text style={styles.newText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No surveys yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Setup')}>
              <Text style={styles.emptyBtnText}>Create First Survey</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  newText: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardIconText: { fontSize: 22 },
  cardBody: { flex: 1, gap: 2 },
  cardFolder: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  cardSubfolder: { color: '#f59e0b', fontSize: 13 },
  cardPath: { color: '#475569', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  cardDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  cardDate: { color: '#475569', fontSize: 11 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#64748b', fontSize: 18 },
  emptyBtn: { backgroundColor: '#f59e0b', borderRadius: 12, padding: 14, paddingHorizontal: 28 },
  emptyBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
});
