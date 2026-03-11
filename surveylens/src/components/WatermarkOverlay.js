import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatGPS } from '../utils/gpsUtils';

export default function WatermarkOverlay({ watermarks, gps, timestamp, quality, fileSize, projectName }) {
  const lines = [];

  if (watermarks.projectName && projectName) lines.push(`📁 ${projectName}`);
  if (watermarks.gps && gps) lines.push(`📍 ${formatGPS(gps)}`);
  if (watermarks.timestamp && timestamp) lines.push(`🕐 ${timestamp}`);
  if (watermarks.resolution && quality) lines.push(`📷 ${quality.toUpperCase()}`);
  if (watermarks.fileSize && fileSize) lines.push(`💾 ${fileSize}`);

  if (lines.length === 0) return null;

  return (
    <View style={styles.overlay}>
      {lines.map((line, i) => (
        <Text key={i} style={styles.text}>{line}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    padding: 8,
    gap: 3,
  },
  text: {
    color: '#f8fafc',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
