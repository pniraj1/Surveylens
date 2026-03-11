import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// [FIX R4] Global error boundary — catches any unhandled render crash
// Without this, a single crash kills the entire app
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App Error Boundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0f172a',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  message: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 16, paddingHorizontal: 36 },
  btnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
});
