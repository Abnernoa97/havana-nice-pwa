import { useEffect, useState } from 'react';
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
    <main className="screen">
      <section className="card">
        <div className="eyebrow">HAVANA NICE</div>
        <h1>V2 · iPhone PWA</h1>
        <strong>FASE 0 · Fundación</strong>

        <div className="health">
          <span className="health-label">API</span>
          <b>{health?.ok ? 'CONECTADA' : error ? 'ERROR' : 'CONECTANDO…'}</b>
          {health && (
            <>
              <span>D1: {health.database}</span>
              <span>Schema: {health.schemaVersion ?? '—'}</span>
              <span>Realtime: {health.realtime}</span>
              <span>Media: {health.media}</span>
            </>
          )}
          {error && <span>{error}</span>}
        </div>
      </section>
    </main>
  );
}
