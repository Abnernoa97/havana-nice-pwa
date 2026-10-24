import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fetchBackendHealth,
  type BackendHealth,
} from '@havana/shared';

export default function App() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBackendHealth()
      .then((next) => {
        setHealth(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Connection error');
      });
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>HAVANA NICE</Text>
        <Text style={styles.title}>V2 · Android</Text>
        <Text style={styles.status}>FASE 0 · Fundación</Text>

        <View style={styles.panel}>
          <Text style={styles.label}>API</Text>
          <Text style={styles.value}>
            {health?.ok ? 'CONECTADA' : error ? 'ERROR' : 'CONECTANDO…'}
          </Text>
          {health && (
            <>
              <Text style={styles.detail}>D1: {health.database}</Text>
              <Text style={styles.detail}>Schema: {health.schemaVersion ?? '—'}</Text>
              <Text style={styles.detail}>Realtime: {health.realtime}</Text>
              <Text style={styles.detail}>Media: {health.media}</Text>
            </>
          )}
          {error && <Text style={styles.detail}>{error}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2EBDD',
    justifyContent: 'center',
    padding: 24,
  },
  card: { gap: 10 },
  eyebrow: { fontSize: 13, letterSpacing: 3, fontWeight: '700' },
  title: { fontSize: 36, fontWeight: '700' },
  status: { fontSize: 16, fontWeight: '600' },
  panel: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#25251f',
    gap: 5,
  },
  label: { fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  value: { fontSize: 20, fontWeight: '700' },
  detail: { fontSize: 15, lineHeight: 21 },
});
