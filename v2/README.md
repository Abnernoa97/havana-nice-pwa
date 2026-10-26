# HAVANA NICE V2

Nueva aplicación privada HAVANA NICE, aislada de la aplicación oficial.

**Fuente única y obligatoria:** [PLAN MAESTRO V2](docs/PLAN-MAESTRO.md). Este README solo resume la arquitectura; los requisitos, prioridades, avances, auditorías y reglas completas viven en el Plan Maestro.

## Arquitectura oficial · 26 de octubre de 2026

- **Android: Chat 100 % nativo** mediante React Native/Expo. Todo el Chat Android —burbujas, escritura, teclado, gestos, historial, caché SQLite, cola offline y WebSockets— permanece nativo. No migrarlo a WebView ni eliminar su implementación funcional.
- **Android: pantallas NO-Chat visuales por PWA** dentro de una WebView controlada: Home, Calendario, Repertorio, avisos, perfiles, ajustes visuales y Administrador. Las modificaciones CSS, tipográficas y de estructura de estas pantallas se publican sin nueva APK.
- **Android: funciones del sistema nativas** donde aportan valor: FCM, almacenamiento seguro, archivos, cámara, multimedia, permisos, navegación, background y ciclo de vida.
- **iPhone:** PWA instalada desde Safari, con su propia interfaz de Chat web y las mismas pantallas PWA compartidas de los demás módulos. Sin app nativa iOS de pago.
- **Backend compartido:** Cloudflare Worker V2, D1 y Durable Objects/WebSockets. Las dos versiones del Chat comparten reglas, mensajes, permisos, eventos y almacenamiento remoto, aunque dibujen sus interfaces con tecnologías diferentes.
- **Media:** futuro puente privado HAVANA NICE V2 ↔ HAVANA CLOUD ↔ Google Drive, solo con aislamiento, autorización y presupuesto 0 MXN verificados; R2 descartado.
- **Producción protegida:** no modificar `main`, HAVANA NICE oficial, HAVANA CLOUD, FAMILIA NOA ni otros proyectos.

## Estado actual y continuidad

El Chat Android **ya está implementado en React Native** y se mantiene. El Chat PWA de iPhone está implementado, con validaciones y mejoras aún pendientes. La integración de la WebView Android para las otras pantallas está **aprobada, pero todavía no desarrollada**. Continuar primero con el menú de mensajes estilo WhatsApp, borrado, swipe para responder, reconexión y sincronización entre dispositivos.

La primera entrada por nombre autorizado funciona. Seguridad avanzada de dispositivos, fotografías, multimedia, push, Home, Calendario, Repertorio y Admin V2 todavía requieren desarrollo o validación.

- Rama V2: `havana-nice-v2-foundation`.
- APK publicadas: rama `havana-nice-v2-apk-downloads`.
- No generar APK por cambios exclusivos de PWA. Cambios en el Chat Android nativo o funciones del sistema pueden requerir actualizar la APK **sin desinstalar ni perder datos**.

**No crear planes paralelos.** Todas las decisiones deben corregirse y consolidarse directamente en [PLAN-MAESTRO.md](docs/PLAN-MAESTRO.md).
