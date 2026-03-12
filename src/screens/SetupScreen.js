import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { saveProject, setActiveProject } from '../utils/storageUtils';

export default function SetupScreen({ navigation, route }) {
  const isEdit = route?.params?.isEdit || false;
  const existing = route?.params?.project || null;

  // No separate "Project Name" — folder IS the identifier
  const [folder, setFolder] = useState(existing?.folder || '');
  const [subfolder, setSubfolder] = useState(existing?.subfolder || '');
  const [description, setDescription] = useState(existing?.description || '');

  const handleSave = async () => {
    if (!folder.trim()) {
      Alert.alert('Required', 'Please enter a folder name.');
      return;
    }
    const project = {
      id: existing?.id || Date.now().toString(),
      name: folder.trim(),           // name = folder for backward compat with all other screens
      folder: folder.trim(),
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

  const displayTitle = folder.trim()
    ? subfolder.trim()
      ? `📂 ${folder.trim()} / ${subfolder.trim()}`
      : `📂 ${folder.trim()}`
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>📐 SurveyLens</Text>
        <Text style={styles.title}>{isEdit ? 'Edit Survey' : 'New Survey'}</Text>
        <Text style={styles.subtitle}>
          Set the folder where photos will be saved.{'\n'}
          Works for property, motor, or any survey type.
        </Text>

        {displayTitle && (
          <View style={styles.previewBadge}>
            <Text style={styles.previewText}>{displayTitle}</Text>
          </View>
        )}

        <View style={styles.card}>

          {/* Folder — primary required field */}
          <Text style={styles.label}>Folder *</Text>
          <Text style={styles.fieldHint}>
            Main category — e.g. claim number, vehicle reg, site name
          </Text>
          <TextInput
            style={styles.input}
            value={folder}
            onChangeText={setFolder}
            placeholder="e.g. CLM-20240312 or ABC-123"
            placeholderTextColor="#475569"
            autoCapitalize="words"
          />

          {/* Subfolder — optional */}
          <Text style={styles.label}>Subfolder (optional)</Text>
          <Text style={styles.fieldHint}>
            Sub-category — e.g. Front Damage, Rear, Interior, Site-A
          </Text>
          <TextInput
            style={styles.input}
            value={subfolder}
            onChangeText={setSubfolder}
            placeholder="e.g. Front Damage"
            placeholderTextColor="#475569"
            autoCapitalize="words"
          />

          <Text style={styles.pathPreview}>
            💾 Photos saved to: /Pictures/{folder.trim() || 'Folder'}/{subfolder.trim() || ''}
          </Text>

          {/* Description */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Any notes about this survey..."
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
            <Text style={styles.secondaryBtnText}>📋 Open Existing Survey</Text>
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
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 20 },

  previewBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: '#f59e0b',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    alignSelf: 'center', marginBottom: 16,
  },
  previewText: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 6,
  },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 10 },
  fieldHint: { fontSize: 11, color: '#475569', marginBottom: 4 },
  pathPreview: {
    fontSize: 11, color: '#334155',
    backgroundColor: '#0f172a', borderRadius: 8,
    padding: 10, marginTop: 4, fontFamily: 'monospace',
  },
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
    borderRadius: 14, padding: 18,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  secondaryBtnText: { color: '#94a3b8', fontSize: 14 },
});
