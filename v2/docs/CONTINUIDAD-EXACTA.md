# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Fecha: 29 de octubre de 2026.** Documento único complementario al [PLAN-MAESTRO.md](./PLAN-MAESTRO.md). Repositorio `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`. **12/27 hitos cerrados, 15 abiertos.**

## Estado de arquitectura y retirada terminada

La integración multimedia externa anterior ha sido retirada **solo de HAVANA NICE V2**. Los proyectos independientes no fueron alterados. No existe una migración de fotos/videos antiguos a R2.

**Fuente V2:** se eliminaron físicamente módulos de enlace, credenciales remotas, adaptador, transferencias por fragmentos, pantalla de autorización, sus pruebas dedicadas y migraciones específicas. El Worker V2 se actualizó para eliminar las rutas de vinculación, conservar el Chat de texto y responder `media: 'not-configured'` en `/health`. `/api/chat/media/status` solo responde a músicos autorizados, con `enabled:false`. No guardar archivos en otro servicio durante esta etapa.

**Worker publicado:** `havana-nice-v2-dev` desplegó versión `db55ac36-137c-4bbc-bb21-de3d633287b3` al **100 %**, despliegue `8b6ba679-cd1f-4b40-8978-5a1e2e3f3245`. Configuración verificada directamente: existen exactamente cinco bindings: `CHAT_ROOMS` (Durable Object), `DB` (D1), `HAVANA_ENV`, `V2_ADMIN_LOGIN_MODE`, `V2_ADMIN_LOGIN_SECRET`. Ningún Service Binding a almacenamiento externo, sin las dos variables de integración antiguas. El secreto del Administrador se conservó mediante herencia estricta.

**D1:** se borraron, con confirmación de cambios y lectura posterior, 15 mensajes multimedia de laboratorio; 19 filas de multimedia y transferencias; una autorización cifrada; cinco tablas (`chat_cloud_link`, `chat_cloud_uploads`, `chat_media_assets`, `v2_media_assets`, `v2_media_quota`). **44 mensajes de texto quedaron intactos.** No borrar los mensajes de texto, respuestas, cuentas, sesiones o permisos en cambios futuros. Los originales en servicios ajenos no se tocaron, por orden del propietario de limitarse exclusivamente a V2.

**PWA y Android:** las fuentes ya no contienen referencias al servicio multimedia anterior; se conservaron los selectores, superficies y visores para reutilizar al integrar R2. La función de enviar multimedia muestra «no configurado». La app nativa conserva `com.havananice.v2` y su firma; **no desinstalar**. Última APK firmada anterior: **0.0.9**, todavía sin QA físico definitivo de video. Si se publica una nueva APK, usar `versionCode` creciente y actualizar encima.

**QA:** la suite de GitHub Actions está ejecutándose tras actualizar pruebas que todavía exigían características retiradas. La publicación de Pages está en cola o en proceso de construcción. **No afirmar que ambas capas ya están publicadas hasta verificar explícitamente CI y Pages.** El nuevo Worker fue aceptado, validado y desplegado por Cloudflare.

## Principios obligatorios

- Todo se desarrolla **en este Chat y en una única rama V2**, usando las conexiones existentes de GitHub y Cloudflare; el propietario solo realiza acciones indispensables en su cuenta (como activar R2) o pruebas físicas.
- Un Chat: Android 100 % React Native nativo, PWA iPhone y Administrador conectado al mismo backend D1/DO. La PWA visual no sustituye el Chat nativo.
- Una sola fuente, sin parches ocultos, sin duplicar APIs, repositorios, archivos ni documentos.
- Proteger lo aprobado: menús del Chat, envío/edición/borrado de texto, reacciones, respuesta, sesión persistente, offline y borradores, control de instalación única y alertas Admin, credenciales y caché de APK.
- Multimedia no está activa actualmente. **No reactivar la integración anterior, no realizar migración de archivos ni conectar otro backend intermedio.**

## Próxima implementación: R2 nuevo, sin transición

1. Confirmar CI sobre la rama limpia, el despliegue de Pages y seguridad del Chat. Mantener 12/27 hasta QA.
2. Activación del nivel gratuito R2 Standard por el propietario en **la cuenta Cloudflare que aloja V2**. Al último intento previo, la API R2 respondió `403/10042` indicando servicio no habilitado. No suponer bucket creado, cuenta activada ni gratuidad ilimitada.
3. Crear bucket privado de HAVANA NICE V2; Worker autentica y autoriza, nunca entrega credenciales permanentes al cliente. Subida de originales pequeños directa a R2 con autorización temporal y multipart resumible para videos. R2 requiere partes de al menos 5 MiB excepto la última.
4. Confirmar existencia, tamaño, MIME y permisos antes de crear cada burbuja de Chat. Streaming de videos nativos con Range; precarga/caché de fotos y visualización amplia inmediata, sin texto técnico dentro de la burbuja.
5. Desarrollar a la par Android, PWA y Administrador. **No instalar una nueva app ni borrar datos locales.** Validar tiempos de transferencia reales antes de declarar «instantáneo».

**Prioridad: cerrar comprobaciones técnicas de la limpieza y, después de activar R2, M01/M02/M04. Documento Plan Maestro contiene los 27 hitos originales.**
