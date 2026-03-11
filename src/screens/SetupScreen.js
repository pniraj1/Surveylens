import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { saveProject, setActiveProject } from '../utils/storageUtils';

export default function SetupScreen({ navigation, route }) {
  const isEdit = route?.params?.isEdit || false;
  const existing = route?.params?.project || null;

  const [projectName, setProjectName] = useState(existing?.name || '');
  const [folder, setFolder] = useState(existing?.folder || '');
  const [subfolder, setSubfolder] = useState(existing?.subfolder || '');
  const [description, setDescription] = useState(existing?.description || '');

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Required', 'Please enter a project name.');
      return;
    }
    const project = {
      id: existing?.id || Date.now().toString(),
      name: projectName.trim(),
      folder: folder.trim() || projectName.trim(),
      subfolder: subfolder.trim(),
      description: description.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await saveProject(project);
    await setActiveProject(project);

    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.replace('Camera');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>📐 SurveyLens</Text>
        <Text style={styles.title}>{isEdit ? 'Edit Project' : 'New Survey Project'}</Text>
        <Text style={styles.subtitle}>Set up your folder structure before capturing photos.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Highway 45 Survey"
            placeholderTextColor="#475569"
          />

          <Text style={styles.label}>Main Folder</Text>
          <TextInput
            style={styles.input}
            value={folder}
            onChangeText={setFolder}
            placeholder="e.g. SurveyPhotos"
            placeholderTextColor="#475569"
          />
          <Text style={styles.hint}>Photos saved to: /Pictures/[Folder]/[Subfolder]/</Text>

          <Text style={styles.label}>Subfolder (optional)</Text>
          <TextInput
            style={styles.input}
            value={subfolder}
            onChangeText={setSubfolder}
            placeholder="e.g. Site-A / 2024-03"
            placeholderTextColor="#475569"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Notes about this survey project..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
          />
        </View>

        {!isEdit && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Projects')}
          >
            <Text style={styles.secondaryBtnText}>Open Existing Project</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryBtnText}>
            {isEdit ? '✅ Save Changes' : '🚀 Start Capturing'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 24, paddingBottom: 40 },
  logo: { fontSize: 28, textAlign: 'center', marginBottom: 8, marginTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 8 },
  hint: { fontSize: 11, color: '#475569', marginTop: -4, marginBottom: 4 },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: { color: '#94a3b8', fontSize: 14 },
});
