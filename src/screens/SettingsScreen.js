import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Platform, Alert,
} from 'react-native';
import { getSettings, saveSettings, QUALITY_LABELS } from '../utils/storageUtils';
import { showRewardedAd, rewardedLoaded } from '../utils/adManager';
import AdBanner from '../components/AdBanner';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
    if (s.customDateTime) setTempDate(new Date(s.customDateTime));
  };

  const update = async (patch) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveSettings(updated);
  };

  const updateWatermark = async (key, value) => {
    const updated = {
      ...settings,
      watermarks: { ...settings.watermarks, [key]: value },
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const watchAdToRemove = () => {
    if (!rewardedLoaded) {
      Alert.alert('Ad Not Ready', 'Rewarded ad is loading, try again in a moment.');
      return;
    }
    showRewardedAd(async () => {
      await update({ removeAds: true });
      Alert.alert('Ads Removed!', 'Ads have been removed for this session. Thank you!');
    });
  };

  if (!settings) return null;

  const qualities = ['low', 'medium', 'high', 'raw'];
  const watermarkItems = [
    { key: 'projectName', label: 'Folder Name', icon: '📂' },
    { key: 'gps', label: 'GPS Coordinates', icon: '📍' },
    { key: 'timestamp', label: 'Date & Time', icon: '🕐' },
    { key: 'resolution', label: 'Quality/Resolution', icon: '📷' },
    { key: 'fileSize', label: 'File Size', icon: '💾' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Photo Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Default Photo Quality</Text>
          {qualities.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.optionRow, settings.quality === q && styles.optionRowActive]}
              onPress={() => update({ quality: q })}
            >
              <View>
                <Text style={styles.optionLabel}>{q.toUpperCase()}</Text>
                <Text style={styles.optionSub}>{QUALITY_LABELS[q]}</Text>
              </View>
              {settings.quality === q && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Watermarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖼 Photo Watermarks</Text>
          <Text style={styles.sectionSub}>Choose what appears on captured photos</Text>
          {watermarkItems.map(({ key, label, icon }) => (
            <View key={key} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{icon} {label}</Text>
              <Switch
                value={!!settings.watermarks[key]}
                onValueChange={(v) => updateWatermark(key, v)}
                trackColor={{ false: '#334155', true: '#f59e0b' }}
                thumbColor={settings.watermarks[key] ? '#fff' : '#64748b'}
              />
            </View>
          ))}
        </View>

        {/* Custom Date/Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Manual Date & Time</Text>
          <Text style={styles.sectionSub}>Override device clock for photo timestamps</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Use Custom Date/Time</Text>
            <Switch
              value={settings.useCustomDateTime}
              onValueChange={(v) => update({ useCustomDateTime: v })}
              trackColor={{ false: '#334155', true: '#f59e0b' }}
              thumbColor={settings.useCustomDateTime ? '#fff' : '#64748b'}
            />
          </View>
          {settings.useCustomDateTime && (
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateBtnText}>📅 {tempDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.dateBtnText}>⏰ {tempDate.toLocaleTimeString()}</Text>
              </TouchableOpacity>
            </View>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) {
                  const d = new Date(date);
                  d.setHours(tempDate.getHours(), tempDate.getMinutes());
                  setTempDate(d);
                  update({ customDateTime: d.toISOString() });
                }
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={tempDate}
              mode="time"
              onChange={(_, time) => {
                setShowTimePicker(false);
                if (time) {
                  const d = new Date(tempDate);
                  d.setHours(time.getHours(), time.getMinutes());
                  setTempDate(d);
                  update({ customDateTime: d.toISOString() });
                }
              }}
            />
          )}
        </View>

        {/* Ads */}
        {!settings.removeAds && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Remove Ads</Text>
            <Text style={styles.sectionSub}>Watch a short video to remove ads for this session</Text>
            <TouchableOpacity style={styles.rewardBtn} onPress={watchAdToRemove}>
              <Text style={styles.rewardBtnText}>▶️ Watch Ad to Remove Ads</Text>
            </TouchableOpacity>
          </View>
        )}
        {settings.removeAds && (
          <View style={styles.section}>
            <Text style={styles.sectionSub}>✅ Ads removed for this session</Text>
          </View>
        )}

      </ScrollView>

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
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16, padding: 16, gap: 12,
  },
  sectionTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  sectionSub: { color: '#64748b', fontSize: 12, marginTop: -6 },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#334155',
  },
  optionRowActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  optionLabel: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  optionSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  checkmark: { color: '#f59e0b', fontSize: 20, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  switchLabel: { color: '#cbd5e1', fontSize: 14, flex: 1 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBtn: {
    flex: 1, backgroundColor: '#0f172a',
    borderRadius: 10, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  dateBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  rewardBtn: {
    backgroundColor: '#22c55e', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  rewardBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
