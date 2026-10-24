import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>HAVANA NICE</Text>
        <Text style={styles.title}>V2 · Android</Text>
        <Text style={styles.status}>FASE 0 · Fundación</Text>
        <Text style={styles.copy}>Cliente nativo aislado. Producción no está siendo modificada.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2EBDD', justifyContent: 'center', padding: 24 },
  card: { gap: 10 },
  eyebrow: { fontSize: 13, letterSpacing: 3, fontWeight: '700' },
  title: { fontSize: 36, fontWeight: '700' },
  status: { fontSize: 16, fontWeight: '600' },
  copy: { fontSize: 16, lineHeight: 23, maxWidth: 360 },
});
