# HAVANA NICE V2

Nueva generación de HAVANA NICE, construida desde cero y completamente separada de producción.

## Arquitectura oficial
- Android: app nativa con React Native / Expo.
- iPhone: PWA premium mientras el objetivo de costo siga siendo 0 MXN.
- Backend: Cloudflare.
- API: Cloudflare Worker.
- Datos persistentes: Cloudflare D1.
- Realtime de Chat: Durable Objects + WebSockets.
- Fotos y miniaturas: módulo CHAT 6 pendiente. R2 desactivado por política de costo cero; se evalúa puente privado de HAVANA CLOUD con autorización y cuotas propias de V2. No activar OAuth paralelo ni duplicar catálogos.
- Android push: FCM, pendiente de implementación y pruebas físicas.
- iPhone PWA push: Web Push, pendiente de implementación y pruebas físicas.
- Código: GitHub.
- Desarrollo: vertical, capacidad por capacidad, Android + PWA antes de avanzar.

## Estado
FASE 0 — FUNDACIÓN COMPLETADA. CHAT 1–5 en validación por etapas; chat de texto, respuestas, reacciones, edición, borrado y acceso por nombre implementados en Android y PWA de desarrollo. CHAT 6 multimedia y notificaciones push NO están activos. No declarar finalizado el chat sin prueba física simultánea Android ↔ iPhone.

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

## Auditorías técnicas
Revisiones periódicas y decisiones de conservación, corrección o eliminación se registran exclusivamente en `v2/docs/PLAN-MAESTRO.md`, bajo «AUDITORÍAS PREVENTIVAS». Los archivos de seguridad y pruebas jamás deben eliminarse solo por parecer inactivos.
