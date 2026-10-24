# HAVANA NICE V2

Nueva generación de HAVANA NICE, construida desde cero y completamente separada de producción.

## Arquitectura oficial
- Android: app nativa con React Native / Expo.
- iPhone: PWA premium mientras el objetivo de costo siga siendo 0 MXN.
- Backend: Cloudflare.
- API: Cloudflare Worker.
- Datos persistentes: Cloudflare D1.
- Realtime de Chat: Durable Objects + WebSockets.
- Fotos, videos, audios y thumbnails: Cloudflare R2.
- Android push: FCM.
- iPhone PWA push: Web Push.
- Código: GitHub.
- Desarrollo: vertical, capacidad por capacidad, Android + PWA antes de avanzar.

## Estado
FASE 0 — FUNDACIÓN EN CURSO.

## Producción actual
La HAVANA NICE actual está totalmente fuera de alcance para V2:
- no modificar,
- no migrar,
- no reutilizar como backend de pruebas,
- no tocar datos ni despliegue,
- solo consultar arquitectura y comportamiento como referencia.

FAMILIA NOA también permanece independiente. Se pueden reutilizar patrones técnicos, nunca compartir Worker, D1, R2, datos o lógica de producción.

## Fuente única de verdad
Leer únicamente:

`v2/docs/PLAN-MAESTRO.md`

No crear documentos paralelos de continuidad, decisiones o planes alternativos.
