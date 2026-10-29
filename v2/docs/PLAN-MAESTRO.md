# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Vigente: 29 de octubre de 2026.** Fuente: repositorio `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`. Único documento compañero: [CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md). **12/27 hitos terminados y 15 pendientes.**

## Decisión del propietario: limpiar la multimedia experimental antes de R2

- **RETIRADA TOTAL AUTORIZADA EN V2:** borrar el puente experimental de almacenamiento externo, el código específico que lo implementa, su pantalla de autorización, configuración, Service Binding, pruebas y sus datos de laboratorio; sin conservar caminos activos antiguos ni múltiples adaptadores.
- **SIN MIGRACIÓN:** las 11 fotos y 4 videos confirmados y sus mensajes multimedia de laboratorio NO necesitan copiarse al próximo proveedor; cuatro transferencias inacabadas también se descartan.
- **LÍMITE ESTRICTO:** no modificar ni borrar recursos de la aplicación independiente HAVANA CLOUD, la aplicación antigua, ramas distintas de V2, datos Google Drive ni otras aplicaciones. Los originales que existan fuera de V2 no pueden prometerse eliminados sin actuar sobre el sistema independiente.
- **PRESERVAR EN V2:** texto, historial de texto, músicos, sesiones y acceso de un único teléfono por músico, Administrador, WebSocket, Durable Object, D1 de Chat, PWA/iPhone, Android nativo y el aspecto del visor de fotografías aprobado. No desinstalar ni borrar la caché de todo el teléfono.
- **DESPUÉS DE LIMPIAR:** desarrollar desde cero el almacenamiento de originales **Cloudflare R2 Standard privado** con subida directa de fotos y multipart reanudable para videos, integrado en el MISMO Chat Android/PWA/Admin. El propietario hará la activación del servicio R2 gratuito. Aún respondió `403/10042` por falta de activación; no existe bucket configurado.
- **SITUACIÓN REAL DE EJECUCIÓN:** esta decisión NO significa que el puente esté eliminado. La escritura de archivos de código GitHub y las acciones Cloudflare fueron bloqueadas por controles de seguridad de las herramientas en el turno de limpieza. **NO SE EJECUTÓ borrado D1, despliegue Worker, retiro del Service Binding ni limpieza de los archivos fuente.** Es incorrecto afirmar que ya estamos limpios o empezar R2 antes de confirmar esos cambios.

### Inventario de laboratorio V2 previo a la limpieza

Última lectura autorizada del 29/10: **59 mensajes Chat**, 15 multimedia confirmadas (11 fotos y 4 videos), **107,875,051 bytes** confirmados, 4 fotografías en estados de transferencia no completada; **19 registros de multimedia**, 19 registros en `chat_cloud_uploads`, una autorización en `chat_cloud_link`; tabla antigua `v2_media_assets` con 0 filas, `v2_media_quota` con 1. 15 mensajes contienen multimedia. Valores dinámicos; consultar nuevamente antes de borrar.

### Dependencias actuales exactas que deben retirarse SOLO de V2

- Fuente Worker: `v2/cloudflare/src/cloud-link.js`, `cloud-media-adapter.js`, `unified-media.js`; referencias en `index.ts`, `message-removal.js`, `admin-chat.js`, `member-admin.js`.
- Cloudflare Worker: configuración `v2/cloudflare/wrangler.jsonc`, Service Binding `HAVANA_CLOUD_BRIDGE` y flags `V2_CLOUD_LINK_ENABLED` y `V2_CLOUD_MEDIA_ENABLED`.
- UI Administrador: `AdminCloudConnection.tsx`, import en `AdminChatAccess.tsx`, llamadas de `admin-api.ts`.
- UI multimedia: retirar los mensajes y referencias específicas del proveedor en `App.tsx` de PWA y Android, sin cambiar el visor/fotos ya aceptados; no habilitar subida hasta que R2 exista.
- Datos SQL V2: mensajes multimedia identificados por `chat_media_assets.message_seq`, reacciones asociadas y referencias `reply_to_seq`; tablas `chat_cloud_uploads`, `chat_cloud_link`, `chat_media_assets`. Revisar dependencias antes de retirar las tablas antiguas `v2_media_assets`/`v2_media_quota`.
- Tests y documentación antiguos dependientes del puente: sustituirlos por verificaciones sin referencias activas al proveedor; retirar archivos que dejen de tener uso, no dejarlos apartados.
- En GitHub, los commits históricos siguen existiendo normalmente después de borrar archivos del HEAD. En Cloudflare pueden persistir versiones anteriores como historial de rollback. No prometer borrado de historia de proveedores sin un proceso aparte que podría afectar seguridad y recuperación.

### Secuencia obligatoria para una limpieza real sin romper Chat

1. Retirar las dependencias del código V2 y actualizar pruebas y rutas de Chat para **almacenamiento no configurado**, pero mantener autenticación para cualquier endpoint y el borrado de mensajes de texto.
2. Superar CI de Worker, PWA, Android, Chat, Administrador y sesiones. Publicar el nuevo Worker V2 SIN Service Binding y verificar configuración en Cloudflare; publicar PWA. APK nueva solo si hay cambios nativos, misma firma/paquete y versionCode creciente.
3. Eliminar de D1 V2 solo las 15 burbujas multimedia y 4 intentos, desvincular respuestas/reacciones relacionadas, eliminar los registros y tablas exclusivos. **No borrar mensajes de texto ni miembros.** Verificar recuentos 0 y funcionamiento de Chat/Admin.
4. Verificar que el Worker V2 desplegado ya no contiene ninguna ruta de conexión, autorización ni llamada al sistema antiguo; no modificar el Worker de CLOUD.
5. Una vez limpios repositorio V2, Worker desplegado y D1, activar R2 gratuito y construir nuevo contrato de subida, lectura, reproducción y borrado original en tres superficies.

## Tablero maestro — 27 hitos

### Cerrados: 12

- [x] **B01** Base de arquitectura única V2.
- [x] **B02** Entornos y estructura de fuentes.
- [x] **B03** Worker y D1 principales.
- [x] **B04** PWA y Android base.
- [x] **C01** Chat visual y menú contextual.
- [x] **C02** Edición y persistencia de borradores.
- [x] **C03** Chat en tiempo real.
- [x] **C04** Conexión/presencia.
- [x] **C05** Historial/buscador de Chat.
- [x] **H01** Android firmado actualizable sin desinstalar.
- [x] **S01** Autorización de músicos desde Administrador.
- [x] **S02** Un solo dispositivo por músico y alerta de duplicados.

### Abiertos: 15

- [ ] **H02** Integración y QA Android completo.
- [ ] **H03** Instalación/actualización segura y validación entre teléfonos.
- [ ] **H04** iPhone PWA y sus pruebas.
- [ ] **M01** Fotos originales privadas (reiniciar implementación de almacenamiento en R2).
- [ ] **M02** Videos originales privados (reiniciar implementación de almacenamiento en R2).
- [ ] **M03** Audios (aplazados).
- [ ] **M04** Visor multimedia completo; conservar fotografías ya aprobadas y resolver videos con R2.
- [ ] **M05** Push con la app cerrada.
- [ ] **P01** Home y configuración.
- [ ] **P02** Calendario.
- [ ] **P03** Repertorio.
- [ ] **P04** Administrador completo.
- [ ] **P05** Avisos y perfiles.
- [ ] **Q01** QA integral Android/PWA/Admin.
- [ ] **Q02** Migración a producción autorizada.

**Regla:** no cerrar hitos por código sin prueba real. **R2 no está iniciado.** Mantener actualizada la [Continuidad Exacta](./CONTINUIDAD-EXACTA.md).
