# Decisiones técnicas V2

## ADR-001 — Plataforma
- Android: nativo con Expo/React Native.
- iPhone: PWA premium mientras el costo total sea 0 MXN.
- No usar WebView como sustituto automático de pantallas nativas.

## ADR-002 — Backend
- Supabase como fuente de verdad.
- Postgres para persistencia.
- Broadcast/Presence para la ruta realtime rápida.
- Cloudflare solo si una medición demuestra una ventaja necesaria.

## ADR-003 — Desarrollo vertical
Cada feature: shared/backend -> Android -> PWA -> prueba cruzada -> cierre.

## ADR-004 — Producción
La HAVANA NICE actual no se modifica para experimentar con V2.

## ADR-005 — Dependencias
Las dependencias se fijan a versiones concretas. Supabase JS se añadirá junto con lockfile cuando exista el entorno DEVELOPMENT separado.
