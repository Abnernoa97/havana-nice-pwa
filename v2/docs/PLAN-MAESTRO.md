# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Continuidad vigente: 29 de octubre de 2026 — decisión R2 para M01/M02 y QA pendiente de Android 0.0.9/M04.** Este documento **sustituye íntegramente el Plan Maestro anterior** en su misma ubicación, sin segundo plan ni anexos contradictorios. Mantener los **27 hitos originales**. La descripción técnica operativa para el siguiente chat está en [CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md), también sustituida en el mismo lugar.

## LEER PRIMERO — Punto exacto de continuidad

**DECISIÓN 29/10 — almacenamiento futuro: Cloudflare R2 Standard privado para HAVANA NICE V2, en la MISMA rama y arquitectura.** El usuario eligió R2 para fotos y videos originales; **es una decisión de migración, NO una migración ejecutada**. Auditoría de solo lectura: R2 de la cuenta Cloudflare V2 respondió `403 / 10042: Please enable R2 through the Cloudflare Dashboard`; primero requiere activación de la suscripción R2 por el propietario. Ningún bucket, token, objeto, enlace o Worker R2 creado aún. **Prohibido desconectar HAVANA CLOUD o desactivar su Service Binding hasta migrar y verificar archivos anteriores.** CLOUD independiente sigue absolutamente intocable.

**Corte D1 leído el 29/10:** 15 multimedia `ready` (11 fotos, 4 videos) = **107,875,051 bytes**, todas vinculadas al Chat y a una clave remota; 4 fotos en intento `uploading` (2 `starting`, 1 `uploading`, 1 `failed`) no se deben considerar originales confirmados. `v2_media_assets` legado tiene 0 filas y `v2_media_quota` 1; NO borrar tablas ni intentos sin comprobación de dependencias. El conteo anterior de 14 confirmados corresponde al 28/10, no al corte nuevo.

**Migración R2 acordada (sin ejecutarla):** conservar D1, DO, Admin, autores, permisos, 5 archivos mixtos, originales sin compresión, visor de fotos ya aprobado y reproducción en Chat; sustituir únicamente adaptador de almacenamiento, autorización Cloud/Google y sistema de subida por acceso R2 privado. Para velocidad se requieren subidas DIRECTAS a R2 con URL firmada temporal (pequeños) y multipart (video grande) con partes >=5 MiB; validar servidor por tamaño/propiedad antes de confirmar la burbuja. Copiar primero los 15 originales a R2 y comprobar íntegro cada uno; luego cortar lecturas, borrado y subidas de CLOUD, retirar autenticación/binding/controles/archivos de código obsoletos y limpiar SOLO después de QA. No borrar fotos de CLOUD, mensajes, credenciales en uso, caché ni ramas históricas. Sin cambios de producción durante auditoría.

**Proyecto:** HAVANA NICE V2, app privada de músicos, Chat 100 % nativo Android, Chat PWA para iPhone y Administrador PWA único. **Estado: 12/27 hitos cerrados; 15 abiertos.**

**Lo que YA FUNCIONA:** texto, usuarios autorizados desde Admin, un dispositivo por músico, WebSocket/Chat, envío original de hasta **5 fotos y videos mezclados** a HAVANA CLOUD por la API existente, visualización de fotos/videos en Chat PWA, Admin y galería habitual de CLOUD. La vinculación de CLOUD **YA ESTÁ HECHA**. No volver a solicitar contraseña ni iniciar otro puente. D1 consultada nuevamente el 28/10: **58 mensajes, 10 fotos y 4 videos confirmados, 3 músicos según el control previo, 1 vínculo CLOUD, 0 subidas activas** (conteos dinámicos). Las **14 multimedia** tienen confirmación de almacenamiento en CLOUD y vínculo de mensaje válido; cero mensajes multimedia huérfanos.

**PRIORIDAD ACTUAL: M04 — terminar y probar visor multimedia.** El usuario mostró: Android nativo con botón «Reproducir video» que salía al navegador, fotos demasiado pequeñas con barras grises y nombres/MB; foto grande en navegador cargándose por partes. El objetivo exacto: **solo imagen o video en la burbuja**, tamaño normal proporcional, sin «Foto»/«Video», nombres ni MB; autor y hora permanecen como información del Chat. Video **dentro de Android nativo**, foto **completa precargada en caché privada** y pantalla completa inmediata dentro de la app. Los originales y nombres en CLOUD siguen intactos. Código de corrección ya escrito en rama V2, PWA publicada y CI de código aprobado. **0.0.8 fue probada físicamente y expuso video negro y falla de envío Blob; fotografías satisfactorias. La APK 0.0.9 firmada/distribuida está lista para QA, pendiente de instalar en el teléfono.**

**Orden de trabajo vigente:** además de la migración R2 decidida y pendiente de activación, propietario probó la **APK Android 0.0.8** y compartió capturas: **fotografías correctas (NO TOCAR)**; reproductor nativo dibuja controles pero **video negro**; nuevas fotos/videos no suben porque el cliente lanza `Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported`. Se corrigió código **solo Android V2**: transferir `File.slice(...)` mediante `expo/fetch`, sin `new Blob([piece])`; cambiar video a `surfaceView` y ofrecer reintento. Foundation CI del commit 0.0.9 SUCCESS; APK firmada, firma preservada y publicación directa GitHub confirmadas. Instalar 0.0.9 encima de 0.0.8 y probar los dos fallos, PWA/Admin y rendimiento. Se auditó D1 sin alterar datos. El QA físico es indispensable antes de cerrar M04/M01/M02. **No rehacer código terminado ni volver a trabajar en HAVANA CLOUD.**

## 1. Reglas innegociables del propietario

1. **Una sola fuente y una sola arquitectura:** repositorio `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`. Actualizar directamente este Plan Maestro y `v2/docs/CONTINUIDAD-EXACTA.md`; **borrar/sustituir** lo obsoleto, nunca apartarlo o agregar una cronología confusa. No abrir múltiples soluciones ni parches escondidos.
2. **HAVANA CLOUD es una app totalmente independiente e INTOCABLE.** No cambiar su repositorio, Worker, Pages, galería, Google OAuth, Drive, contraseñas, archivos, cachés, sesiones ni despliegues. V2 utiliza **solo endpoints ya existentes** de CLOUD. El propietario administra manualmente la carpeta «HAVANA NICE APP» dentro de su galería habitual; no crear segunda galería.
3. **Preservar lo que ya funciona:** Chat de texto, mensajes, permisos, autores, reacciones, borrados, sesiones, base D1, Durable Objects, Admin, archivos originales, Android instalada. Nunca limpiar caché, desinstalar ni restablecer teléfonos para actualizar. No borrar datos de producción durante auditorías.
4. **Android Chat 100 % nativo React Native**, no WebView de Chat; PWA Chat para iPhone; Admin PWA. Otros módulos podrán usar UI PWA en Android. Construir backend/PWA/Android/Admin de forma coordinada por funcionalidad, pero una sola base y un solo contrato.
5. **APK:** mismo paquete `com.havananice.v2`, certificado anterior, versionCode creciente. Firmar, auditar e instalar **encima** de la anterior; no distribuir hasta completar CI/firma y comprobar ruta. Para problemas visuales de PWA no prometer que Android nativo se actualiza solo.
6. **Músicos:** solo ingresan por nombre habilitado manualmente en Admin; primer teléfono vinculado, duplicado rechazado y alerta Admin. No rehacer S01/S02, no contraseñas de músico ni cuentas históricas resembradas. Administrador autentica aparte y puede moderar sin enviar mensajes como músico.
7. **Compositor aprobado:** misma barra emoji, Mensaje, clip, cámara real separada, micrófono informativo. Clip muestra solo **Fotos** y **Video** en filas verticales. Hasta **cinco archivos combinados** por envío, no 5+5. Cámara captura de verdad. No revivir menú «Galería/Cámara», cuadrícula de cuatro botones ni botón «+».
8. **Archivos:** foto original hasta 100 MiB, video original hasta 10 GiB, transferencia reanudable de 4 MiB por fragmento, sin compresión deliberada, nombre/MIME/bytes conservados en almacenamiento; mensaje solo confirmado cuando Drive y D1 lo confirman. **Dos originales diferentes en paralelo** en la versión optimizada, cada uno con fragmentos ordenados. Mensajes multimedia muestran **solo el contenido visual**, con autor y hora del Chat; no nombres/MB ni «Foto/Video» en burbujas.
9. **M04:** fotos verticales y horizontales naturales sin recortar ni barras grises artificiales; vista ampliada desde fotografía completa ya descargada/caché; videos reproducidos en la app; regresar al Chat sin pérdida de posición. Mantener metadatos y moderación del mensaje. **Gestos de zoom y QA físicos aún pendientes.** No afirmar terminación de M04 por pasar CI.
10. **Seguridad y transparencia:** nada de accesos secretos ni tokens a músicos, no contraseñas en conversaciones; no anunciar pruebas físicas que no se hicieron ni archivos o APK ficticios. Preferir verificación con GitHub y Cloudflare conectados y trabajo ejecutado directamente, sin tareas manuales para el propietario salvo instalación/QA en teléfono.

## 2. Tablero MAESTRO — 27 hitos, estado único

### Fundación y Chat: 9 cerrados

- [x] **B01** — Fundación V2 aislada con su repositorio/Worker/D1/DO/clientes.
- [x] **B02** — Chat básico de texto Android ↔ PWA.
- [x] **B03** — Nombre autorizado y sesión persistente.
- [x] **B04** — Auditoría preventiva, estabilidad y CI.
- [x] **C01** — Menú contextual, reacción y acciones.
- [x] **C02** — Edición y eliminación canónica de mensajes.
- [x] **C03** — Responder deslizando.
- [x] **C04** — Offline, borradores y reconexión.
- [x] **C05** — Sincronización bidireccional del Chat.

### Android y seguridad: 3 cerrados, 3 abiertos

- [x] **H01** — Línea base Android nativa, firma e instalación sin desinstalar.
- [ ] **H02** — Módulos no-Chat con PWA visual en Android.
- [ ] **H03** — Navegación, sesión y persistencia intermodular.
- [ ] **H04** — Actualización PWA visual sin reinstalar Android.
- [x] **S01** — Altas y bajas de músicos solo desde Admin.
- [x] **S02** — Una instalación por nombre y alerta ante duplicado (alcance aprobado).

### Multimedia: 5 abiertos, con avances reales

- [ ] **M01** — Fotos originales privadas en Chat/Administrador/CLOUD. **10 originales confirmados en D1/CLOUD; visor de fotos Android 0.0.8 aprobado visualmente por el usuario, NO TOCAR. La subida NUEVA desde Android 0.0.8 falla por Blob; corrección nativa 0.0.9 pendiente de QA físico.**
- [ ] **M02** — Videos originales en Chat/Administrador/CLOUD. **4 MP4 originales confirmados en D1/CLOUD; en Android 0.0.8 hay controles nativos pero fotograma NEGRO; fuente 0.0.9 usa `surfaceView` y reintento. Pendientes QA de imagen/audio, Range y nueva subida nativa.**
- [ ] **M03** — Audios. **Aplazado**; micrófono solo informativo.
- [ ] **M04** — Visor multimedia completo. **PRIORIDAD:** fotos correctas en Android 0.0.8 según captura (no tocar); video negro con `textureView` → corrección `surfaceView` en código 0.0.9; aguarda QA físico de reproducción y gesto/retorno. No cerrar aún.
- [ ] **M05** — Push con app cerrada; no confundir con WebSocket.

### Otros módulos y QA: 7 abiertos

- [ ] **P01** — Home y configuración.
- [ ] **P02** — Calendario con eventos/horarios/vestuario.
- [ ] **P03** — Repertorio general y por evento.
- [ ] **P04** — Administrador completo (Acceso a músicos y Chat general YA funcionan).
- [ ] **P05** — Avisos y perfiles.
- [ ] **Q01** — QA integral Android/PWA/Admin/red/reintentos/caché.
- [ ] **Q02** — Migración a producción con autorización expresa.

**Total 12/27 completados (44,4 %).** M01/M02 superaron comprobación de integridad D1 (14/14 originales con estado remoto y mensaje); siguen abiertos junto con M04 hasta QA físico, video Range y medidas reales. Se cierran tras las verificaciones reales aprobadas.

## 3. Fuentes y estado de producción verificado

| Elemento | Valor vigente |
|---|---|
| Código único | `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation` |
| Documentación única | `v2/docs/PLAN-MAESTRO.md` + `v2/docs/CONTINUIDAD-EXACTA.md` |
| Chat PWA | https://havana-nice-v2-dev.pages.dev/ |
| Administrador | https://havana-nice-v2-dev.pages.dev/admin.html |
| Worker Chat V2 | `havana-nice-v2-dev` versión **32** `49f78986-096b-4bc7-b4cd-b30ee945357f`, 100 % |
| Rollback Worker V2 | Versión 31 `6909dd0a-f555-4ffb-84a0-679e1d016c1f` |
| D1 Chat V2 | `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5`, binding `DB` |
| Chat en vivo | Durable Object `CHAT_ROOMS`; conservar namespace/sesiones |
| HAVANA CLOUD | Repo separado `Abnernoa97/havana-nice-cloud`, Worker `havana-nice-cloud` versión `a5165b9e-b952-42b3-9468-e86da0190a11`, 100 %, **intocado** |
| Enlace V2 → CLOUD | Service Binding `HAVANA_CLOUD_BRIDGE` declarado **solo en V2** |
| Android paquete | `com.havananice.v2`; **0.0.9/versionCode 9 firmada y distribuida**, pendiente de QA físico |
| Estado D1 leído 28/10 | **58 mensajes, 10 fotos + 4 videos listos, 14/14 respaldados y vinculados, 1 vínculo CLOUD, 0 subidas activas** (conteos dinámicos) |

**APK VIGENTE 0.0.9 / versionCode 9 FIRMADA Y DISTRIBUIDA (NO PROBADA AÚN EN TELÉFONO):** fuente `5f0cc631af2c98db724a39de51f0fa13b9030675`; Foundation CI `40730744345` SUCCESS, build Android `40730744349` SUCCESS, distribución `40730744330` SUCCESS. **Enlace verificado:** https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-5f0cc631af2c.apk . **SHA-256:** `8513c412faa2cb764a748b6dfad7b79f6820e1f29b1c2e9dd09686823016a05b`; tamaño **77,006,359 bytes**. Paquete `com.havananice.v2`; proceso GitHub verificó firma X.509 igual a 0.0.8 y aumento versionCode 8→9. **Instalar ENCIMA de 0.0.8 sin desinstalar, borrar caché ni datos.** Corregidos únicamente fuente nativa de subidas con `File.slice`/`expo/fetch` y el video con `surfaceView`/reintento; no se editó la lógica de fotografías, PWA, Administrador, Worker V2 ni HAVANA CLOUD.

**Resultado físico 0.0.8:** fotos correctas (no tocar), video mostraba controles sobre pantalla negra y envío de multimedia fallaba con error de Blob desde ArrayBuffer. 0.0.9 requiere prueba física de ambos problemas antes de cerrar M01/M02/M04.

## 4. Integración multimedia y optimización que ya funciona

- **Real:** el propietario mostró Chat subiendo fotos/videos, Chat mostrando archivos, Admin mostrando fotos y galería HAVANA CLOUD recibiendo originales. La D1 verificó archivos listos y un vínculo autorizado. No se necesita revincular.
- **Backend único:** `v2/cloudflare/src/unified-media.js` → `cloud-media-adapter.js` → `cloud-link.js`; endpoints actuales de CLOUD `/api/google/upload/session`, `/api/google/upload/chunk`, `/api/media/:key/content`, y eliminación con rutas existentes. D1 `chat_media_assets` y `chat_cloud_uploads`; el propietario autorizó CLOUD desde Admin, token de dispositivo cifrado solo en D1 V2. Ninguna modificación en CLOUD.
- **Medición D1 por grupos (intervalo creación→confirmación, no cronómetro del teléfono):** antes del Worker 32, 5 fotos de media 1.63 MiB / 12.3 s y 2 videos de media 20.92 MiB / 39 s; después, 5 fotos de media 1.63 MiB / **17.0 s** y 2 videos de media 18.44 MiB / **34.5 s**. Estas muestras no se hicieron en red controlada: fotos sin mejora confirmada y videos algo más rápidos con menor tamaño medio. No afirmar rapidez instantánea ni optimización global; medir en el mismo teléfono/red.
- **Worker V2 versión 32** publicada: sesión privada de CLOUD reutilizada máximo 2 minutos en memoria del Worker, con renovación protegida; no autorizar por cada fragmento. PWA/Android soportan hasta 2 originales en paralelo, manteniendo fragmentos secuenciales por archivo y reintentos. 4 MiB del contrato de CLOUD no se alteran.
- **Último objetivo M04:** `NativeChatMediaView.tsx` usa `expo-video` / `VideoView` y `expo-file-system`: primero descarga foto íntegra a la caché de la app, comprueba tamaño, la muestra proporcional y usa el mismo archivo en Modal completo sin enlace externo. Antes usaba `Linking.openURL` y dimensiones fijas 240×220. `ChatMediaView.tsx` PWA/Admin utiliza Blob completo antes del toque y pantalla completa in-app; CSS sin aspect-ratio ni altura forzada. En `App.tsx` y `AdminChatGeneral.tsx` se quitaron los rótulos y nombres/MB visibles; **solo en interfaz, no en originales**.
- **Cuidado técnico:** la caché nativa es privada y reutilizable, pero falta medir memoria/ocupación, archivos muy grandes, offline, HEIC y vencimiento de URLs de video. No declarar reproducción física aprobada aún.

## 5. Reanudación exacta — próximo chat

**Nueva prioridad del propietario:** R2 fue elegido para sustituir las dependencias V2 de HAVANA CLOUD. Activación R2 aún bloqueada por cuenta, y la APK 0.0.9 sigue pendiente de comprobación física. No modificar CLOUD ni cortar fuentes de archivos antes del nuevo backend y migración validados.

1. Mantener **este documento y Continuidad Exacta** sincronizados en la rama existente. Android 0.0.9 fuente/CI/build/distribución SUCCESS; Worker V2 sigue en versión 32, CLOUD intocable, PWA/Admin sin cambios funcionales.
2. **Instalar APK 0.0.9 verificada** (enlace y hash en §3) ENCIMA de 0.0.8: mantener sesión/caché/datos. Comprobar video MP4 visible con sonido y controles en Chat nativo; enviar 1 foto y 1 video sin error de Blob. Fotos aceptadas no se retocan.
3. Comprobar en el teléfono que los videos se reproducen dentro del Chat, las fotos verticales/horizontales se ven a tamaño normal y fullscreen aparece completa desde caché, sin navegador/partes; Chat PWA y Admin iguales visualmente. Verificar al volver al Chat, zoom/gestos y permisos. **No afirmar realizado sin evidencia física**.
4. Integridad backend comprobada por D1: 14/14 originales confirmados y asociados, sin subidas activas. Pendiente repetir en **la misma red** subida de 2 fotos y 1 video y cronómetro de usuario, consultar originales en CLOUD sin modificarlo, revisar reintentos, Range de video y ausencia de duplicados.
5. Corregir cualquier fallo **solo en la fuente V2** con QA automático, actualizar directamente documentos, no versiones paralelas. Cerrar M01/M02/M04 únicamente cuando corresponda y continuar H02/H03/P02/P03 con el mismo esquema PWA+Android+Admin.

**Regla documental:** ante hechos nuevos, sustituir el estado viejo **dentro de estos mismos dos archivos**. No reintroducir una continuidad de etapa anterior, no duplicar decisiones, no tocar HAVANA CLOUD.
