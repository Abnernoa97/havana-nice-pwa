# HAVANA NICE V2

Nueva generación privada de HAVANA NICE, desarrollada en aislamiento respecto a la aplicación de producción.

**Documento único y obligatorio:** [Plan Maestro V2](docs/PLAN-MAESTRO.md). Todas las decisiones, responsabilidades, estado real, seguridad, costos, auditorías y orden de implementación se mantienen únicamente allí.

## Arquitectura vigente desde el 26 de octubre de 2026

- **Una sola UI visual:** PWA React/Vite/TypeScript para Android (WebView) y iPhone (PWA instalada), **incluido Chat, Home, Calendario, Repertorio y Administrador**.
- **Android genuinamente nativo:** APK Expo/React Native como contenedor WebView y plataforma para FCM, almacenamiento protegido, cámara/archivos, permisos, servicios, teclado y navegación cuando se necesiten. La interfaz visual del producto no se duplica en React Native.
- **iPhone:** la misma PWA, sin publicación en App Store.
- **Backend común:** Worker Cloudflare V2, D1 y Durable Objects/WebSockets.
- **Multimedia:** almacenamiento privado por puente de servicios a Google Drive existente de HAVANA CLOUD, únicamente después de aprobación y pruebas. R2 descartado por política estricta de cero costos adicionales.
- **Producción:** rama `main`, HAVANA NICE actual, HAVANA CLOUD, FAMILIA NOA y otros proyectos quedan intactos.

## Estado actual

La decisión híbrida está **aprobada pero pendiente de implementación**. Actualmente el Chat Android sigue renderizado en React Native; debe migrarse a WebView con una sola UI React antes de desarrollar el resto de pantallas. Se conserva el funcionamiento actual hasta comprobar instalación sobre APK anterior, migración segura de sesión/cola, reconexión, teclado, gestos y rendimiento. Fotos, audio, video, push y Administrador V2 aún no se han completado.

Rama de desarrollo: `havana-nice-v2-foundation`. APK V2 directa: rama `havana-nice-v2-apk-downloads`.

**No crear planes o documentos de decisiones paralelos; editar solo [el Plan Maestro](docs/PLAN-MAESTRO.md).**
