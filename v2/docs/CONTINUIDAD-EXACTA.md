# HAVANA NICE V2 — CONTINUIDAD EXACTA Y ÚNICA

**Continuidad única vigente — 28 de octubre de 2026, QA físico Android 0.0.8 y APK correctiva 0.0.9.** Este documento **REEMPLAZA POR COMPLETO** el contenido anterior, en la misma ubicación y rama, sin otra copia ni anexos históricos. Documento compañero único: [PLAN-MAESTRO.md](./PLAN-MAESTRO.md), que conserva el tablero original de 27 hitos y también ha sido sustituido, no duplicado.

> **LEER PRIMERO EN EL PRÓXIMO CHAT:** proyecto HAVANA NICE V2, **M04 visor multimedia es la prioridad actual**. Fotos y videos YA SE SUBEN a HAVANA CLOUD REAL y se ven en Chat PWA y Administrador; no volver a construir puente, no pedir revincular CLOUD, no decir que están deshabilitados. El usuario pidió fotos/videos **a tamaño natural solo el contenido visual**, sin rótulos «Foto»/«Video», nombres ni MB; videos en **Android nativo dentro del Chat**, fotos ampliadas **completas de una sola vez desde caché privada**, no abrir navegador ni recargar la foto por partes. La APK 0.0.8 fue probada por el propietario: **fotografías correctas (NO TOCAR)**, videos con controles pero **imagen negra** y error `Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported` al subir archivos. La APK **0.0.9 FIRMADA Y DISTRIBUIDA** corrige la fuente de ambos fallos; requiere QA real antes de afirmar solución física. Mantener 12/27 hasta QA real. **HAVANA CLOUD intocable.** En este turno se confirmó de nuevo la publicación de APK, Worker y Pages y la integridad de D1; **ninguna prueba física nueva del teléfono** se ha reportado.

## 1. Forma de trabajo obligatoria

- Solo escriben el propietario y su pareja. Ejecutar directamente las tareas técnicas disponibles mediante GitHub/Cloudflare, sin delegar programación manual. Preguntar únicamente por una prueba física indispensable; ya hay muchas evidencias de funcionamiento.
- **Una sola fuente y plan:** `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`; documentos `v2/docs/PLAN-MAESTRO.md` y `v2/docs/CONTINUIDAD-EXACTA.md`. Al editar, **sustituir el contenido superado**, no esconderlo, moverlo a otra carpeta ni agregar parches, cronologías o estrategias paralelas.
- **Proteger lo existente:** no borrar conversaciones, cuentas, sesiones, fotos, videos ni cachés de teléfonos; no desinstalar APK para actualizar. App antigua `main` y todos los proyectos ajenos intactos.
- **HAVANA CLOUD absolutamente independiente:** **NO editar** repositorio `Abnernoa97/havana-nice-cloud`, Worker `havana-nice-cloud`, PWA, Drive/Google OAuth, galería, credenciales, Workers experimentales, caché o archivos. No reabrir puentes privados descartados ni construir una segunda nube. Usar **solo API publicada de CLOUD** desde Worker V2.
- **Funcionalidad > estética**; PWA, Android y Admin evolucionan juntos usando datos únicos. Chat Android 100 % React Native; Chat PWA para iPhone; Admin PWA. Home/Calendario/Repertorio futuros podrán tener parte visual PWA.
- **Android siempre sobreescrito en sitio** con mismo paquete/firma y versionCode más alto. Nunca desinstalar ni pedir limpiar caché como solución a una actualización.
- Dar estado exacto: diferenciar fuente, CI, PWA publicada, APK firmada, instalación física y prueba real. No afirmar que una simulación prueba velocidad real o reproducción nativa en teléfono.

## 2. Fuente viva, URLs, servidores y seguridad

| Componente | Fuente / situación verificada |
|---|---|
| GitHub fuente única | `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation` |
| Plan único | `v2/docs/PLAN-MAESTRO.md` |
| Continuidad única | `v2/docs/CONTINUIDAD-EXACTA.md` |
| Chat PWA / iPhone | https://havana-nice-v2-dev.pages.dev/ |
| Administrador único | https://havana-nice-v2-dev.pages.dev/admin.html |
| Worker V2 | `havana-nice-v2-dev` versión **32**, `49f78986-096b-4bc7-b4cd-b30ee945357f`, **100 % tráfico** |
| Worker V2 rollback | versión 31 `6909dd0a-f555-4ffb-84a0-679e1d016c1f` |
| D1 de V2 | `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5`, binding `DB` |
| Tiempo real | Durable Object `CHAT_ROOMS`, preservar namespace y sesiones |
| CLOUD independiente | Repo `Abnernoa97/havana-nice-cloud` en `main`, Worker `havana-nice-cloud` versión `a5165b9e-b952-42b3-9468-e86da0190a11` al **100 %** (sin modificar) |
| Enlace a CLOUD | `HAVANA_CLOUD_BRIDGE` Service Binding **solo declarado en Worker V2**, token cifrado en D1 V2; **ya hay 1 vínculo autorizado** |
| Android | paquete `com.havananice.v2`, certificado anterior conservado, **0.0.9/versionCode 9 DISPONIBLE**, pendiente QA físico |
| Último control de D1 (lectura 28/10) | **58 mensajes, 10 fotos + 4 videos ready, 14/14 con archivo remoto confirmado y mensaje asociado, 1 vínculo CLOUD, 0 subidas activas**. Tres músicos en control previo; valores dinámicos |

**Verificación 28/10:** Worker `havana-nice-v2-dev` conservaba versión 32 con 100 % del tráfico; Pages `havana-nice-v2-dev` desplegó correctamente la rama V2 (commit documental `d0115e1e4a16515d44cee9a781015a62ff58a560`). **Advertencia importante:** la PWA se publica automáticamente desde GitHub/Cloudflare Pages, pero ello NO significa que Android nativo se actualice solo. El Worker V2 actual 32 es real, está publicado y tiene rollback; no publicar un Worker nuevo para solucionar detalles de presentación si no cambia su backend. El Worker de CLOUD permanece separado e intocable.

## 3. Estado real y cerrado: Chat, Administrador y acceso

**12 de 27 hitos cerrados; 15 abiertos:** terminados `B01 B02 B03 B04 C01 C02 C03 C04 C05 H01 S01 S02`. No reabrirlos porque se corrija el visor multimedia.

- **Chat único** con mensajes y autor, reacciones, respuestas, editar/borrar, respuesta por deslizamiento, leído, WebSocket, borradores/offline/reconexión, Android nativo ↔ PWA. D1 es fuente canónica; Admin ve los mismos mensajes, no replica datos.
- **Acceso músicos:** solo nombres habilitados manualmente en Admin; primera instalación vinculada; otro teléfono con el mismo nombre recibe rechazo y Admin alerta. S02 aceptado como cerrado. No volver a exigir comprobación en segundo dispositivo ni inventar más mecanismos.
- **Administrador:** acceso separado, menú Acceso a músicos y Chat general en vivo, con autor y hora. Admin no escribe como músico; puede borrar mensajes, reacciones y archivos del Chat vía lógica canónica de borrado `v2/cloudflare/src/message-removal.js`. No volver a mostrar «Mensaje eliminado» ni crear segundo chat.
- No recrear músicos históricos ni cuentas de prueba que el propietario retiró, ni borrar mensajes existentes para cuadrar conteos viejos.
- **Compositor aprobado:** emoji, campo Mensaje, clip, cámara separada, micrófono informativo. Clip contiene solo **Fotos** arriba y **Video** abajo; selector múltiple y mezcla de hasta **5 archivos en total**. Cámara hace captura real, no menú de cuatro opciones. Audios `M03` aplazados, micrófono no graba.
- **Límites originales:** fotos hasta 100 MiB, videos hasta 10 GiB, fragmentos de 4 MiB, nombre/MIME/bytes conservados en CLOUD. El Chat muestra la multimedia solo tras confirmación de Drive + D1. No guardar fotos/videos originales también en otro servicio.

## 4. M01/M02 — conexión real a HAVANA CLOUD YA FUNCIONANDO

**Evidencia proporcionada en este chat:** capturas del usuario muestran cola y subida de cuatro fotos desde Chat, reproducción de videos en vista de Chat PWA, fotos de Chat general en Administrador y los originales en la galería normal de HAVANA CLOUD. Después mostró video/foto real en nativo, aunque con problemas de visor. D1 confirmó primero 5 fotos + 2 videos completos y después creció a **14 registros multimedia**. **El vínculo de CLOUD ya existe**; NO pedir contraseñas ni revincularla.

**Ruta única ya operativa:** `v2/cloudflare/src/unified-media.js` → `v2/cloudflare/src/cloud-media-adapter.js` → `v2/cloudflare/src/cloud-link.js` → Service Binding del Worker **V2**, que usa las rutas **YA EXISTENTES** de CLOUD: `/api/auth/login` y `/api/auth/device` para autorización servidor, `/api/google/upload/session`, `/api/google/upload/chunk`, `/api/media/:key/content` y las rutas existentes de eliminación. La cuenta Google y los originales viven en CLOUD. D1 V2 contiene `chat_media_assets`, `chat_cloud_uploads` y `chat_cloud_link`. Contraseña del propietario no persistida; token de dispositivo cifrado solo en V2 y jamás expuesto a músicos.

**Optimización de velocidad publicada en V2 versión 32:** antes, el Worker pedía una sesión Cloud nueva por cada fragmento de 4 MiB, y clientes enviaban archivos uno por uno. El Worker ahora reutiliza la autorización de CLOUD en memoria privada **2 minutos** y agrupa autorizaciones simultáneas; renueva ante 401. PWA y Android permiten **hasta dos originales distintos al mismo tiempo**, cada uno con fragmentos en orden y reintentos que conservan identidad. CLOUD no se modificó. **Comparativa D1 (creación→confirmación; NO medición controlada de red):** antes de versión 32, 5 fotos de 1.63 MiB promedio tardaron 12.3 s y 2 videos de 20.92 MiB 39 s; después de versión 32, otras 5 fotos de 1.63 MiB promedio tardaron 17.0 s y 2 videos de 18.44 MiB 34.5 s. **Fotos no aceleradas según esa muestra; video con intervalo menor pero de menor tamaño.** La velocidad real en la misma red/teléfono, sobre todo fotos, permanece pendiente; no prometer envío instantáneo.

**Pruebas servidor e integridad verificadas 28/10 en lectura:** D1 tiene 14 multimedia `ready` (10 fotos, 4 videos); las 14 tienen `chat_cloud_uploads.stage='ready'`, clave remota y `message_seq` válido, 0 huérfanas, 0 subidas pendientes. Foundation CI `40718800489` SUCCESS y simulaciones de autenticación, fragmentos, Range e idempotencia; el QA de reproducción Range en teléfono sigue pendiente. Mismo D1, DO, secreto Admin y Cloud binding; rollback V2 a 31. No reconstruir backend que ya funciona ni tocar CLOUD.

## 5. M04 — correcciones solicitadas, implementadas en FUENTE

**Solicitud literal y evidencia:** el propietario mostró Android con foto pequeña en rectángulo gris, texto `1000356219.jpg · 4.6 MB` y videos como botón «▶ Reproducir video» que abría Chrome. En Chrome, foto grande se presentaba por partes con un área gris. Quiere **foto/video a tamaño normal**, sin números ni letras del archivo, y que al ampliar se vea la **foto completa de una vez** usando caché/precarga. Mantener nombre del músico y hora como datos del mensaje; la prohibición de «letras» se refiere a las etiquetas de archivos, no a toda la interfaz. Nombres y metadatos deben seguir preservados en D1 y CLOUD.

**Cambios hechos en la MISMA rama fuente:**

- `v2/apps/android/NativeChatMediaView.tsx`: se **eliminó** el antiguo `Linking.openURL` y el video ya tiene `expo-video`, `useVideoPlayer` y `VideoView` con controles dentro del Chat nativo. No sustituirlo por WebView ni abrir el navegador.
- Fotos Android: `expo-file-system`, `File.downloadFileAsync` a caché privada. Descarga original completo y verifica `sizeBytes` antes de mostrar; archivo temporal no se abre. Reutiliza el mismo archivo local para la burbuja proporcional y un `Modal` a pantalla completa; aperturas siguientes desde caché sin nuevo grant/descarga si el archivo completo existe. Nombre de archivo de caché incluye ID y tamaño, extensión compatible con MIME, pero **NO se presenta al usuario**.
- `v2/apps/pwa/src/ChatMediaView.tsx` compartido con Admin: precarga foto completa con `await image.blob()`, usa `URL.createObjectURL` para vista del Chat y la ampliada, sin hacer segunda descarga tras tocar. Precarga al entrar el elemento en pantalla, no guardar tokens. La PWA usa caché del Blob durante el montaje, no asegurar persistencia offline equivalente a Android.
- CSS `v2/apps/pwa/src/styles.css` sin proporción 4:5 impuesta ni altura máxima artificial para la foto; respeta proporciones, no barras grises creadas por imagen fija.
- `v2/apps/android/App.tsx`, `v2/apps/pwa/src/App.tsx` y `v2/apps/pwa/src/AdminChatGeneral.tsx` ya no muestran «Foto»/«Video» como texto de burbuja multimedia. El visor nativo dejó de mostrar nombre y MB. Autor, hora, respuestas, reacciones y moderación siguen vigentes.
- `v2/tests/chat-media-ui.test.mjs` protege media-only bubbles, caché original completa, video nativo, Modal y ausencia de `Linking.openURL`. `expo-video` 58.0.12 está en dependencia y lock; no añadir otro reproductor ni otra estrategia.

**Comprobaciones de código:** [Foundation CI 40725322822 SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40725322822) y [Foundation CI del release 0.0.8 40725644879 SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40725644879), cubriendo TypeScript, PWA, export Android y guardas. **NO equivalen a prueba física del visor en Android.**

**QA físico ya recibido (Android 0.0.8):** fotos proporcionales y completas aceptadas; videos negros pese a controles; error de subida Blob desde ArrayBuffer. **QA pendiente (0.0.9):** video con fotogramas/sonido/pausa/búsqueda dentro del Chat, enviar una foto y video reales, retorno a la conversación y persistencia de caché. No asegurar que la corrección funciona físicamente por pasar CI.

## 6. Android 0.0.9 — APK vigente firmada y publicada; QA físico pendiente

**APK 0.0.9, versionCode 9, lista para instalar ENCIMA de 0.0.8.** La firma X.509 y paquete `com.havananice.v2` fueron verificados contra la APK anterior por el distribuidor de GitHub. **No desinstalar ni borrar caché/datos/sesión.**

- **Enlace directo verificado HTTP 200:** https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-5f0cc631af2c.apk
- Nombre: `HAVANA-NICE-V2-ANDROID-5f0cc631af2c.apk`; **77,006,359 bytes**.
- SHA-256: `8513c412faa2cb764a748b6dfad7b79f6820e1f29b1c2e9dd09686823016a05b`.
- Commit fuente: `5f0cc631af2c98db724a39de51f0fa13b9030675`.
- [Foundation CI 40730744345](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40730744345) **SUCCESS**, [APK 40730744349](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40730744349) **SUCCESS**, [distribución 40730744330](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40730744330) **SUCCESS**.
- Paquete `com.havananice.v2`, versionName 0.0.9, versionCode 8→9. Fingerprint X.509 histórico `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- **Motivo:** video negro en Android 0.0.8 (controles sí cargaban) y fallo nativo de subida con `new Blob([piece])` / `ArrayBuffer`. Fuente 0.0.9 cambió video a `surfaceView` y añadió reintento; upload `File.slice(offset,...)` + `expo/fetch` sin copiar archivos completos a JS. Hasta 2 archivos en paralelo, fragmentos 4 MiB por archivo, reintentos e idempotencia conservados.
- **Fotos: NO TOCAR.** El usuario las validó en 0.0.8; código de fotografías, PWA/Admin, Worker y HAVANA CLOUD no se modificaron.

**Instalación física y funcionamiento 0.0.9 NO probados aún.** No cerrar M01/M02/M04 hasta que el propietario confirme video visible/con audio y nuevo envío de fotos/videos. La APK anterior 0.0.8 fue la versión que mostró los defectos; no reinstalarla para resolverlos.

**Workflows originales:** `.github/workflows/v2-android-apk.yml` y `.github/workflows/v2-apk-direct-download.yml`, sin crear rutas paralelas.

## 7. Tablero vigente y prioridad ejecutiva

**Estado oficial: 12/27 = 44,4 %**, no se altera sin QA real. **Cerrados:** `B01, B02, B03, B04, C01, C02, C03, C04, C05, H01, S01, S02`. **Abiertos:** `H02, H03, H04, M01, M02, M03, M04, M05, P01, P02, P03, P04, P05, Q01, Q02`. Ver detalles y casillas en el único [Plan Maestro](./PLAN-MAESTRO.md).

**M01 fotos:** 10 archivos originales confirmados, visor aceptado en 0.0.8; envío nuevo falló en nativo, corregido en código de 0.0.9, QA pendiente. **M02 videos:** 4 MP4 originales confirmados, video negro en nativo 0.0.8, código 0.0.9 corregido, QA pendiente. Ambos abiertos. **M04 visor** es prioridad actual, aunque su fuente/CI sean exitosos. **M03 audio** aplazado. **P04 Admin** tiene Acceso a músicos y Chat General funcionales; falta calendario, repertorio y más. Resto del plan sin cambio de alcance.

## 8. Acciones EXACTAS del siguiente chat (no distraerse)

1. **Empezar desde HAVANA NICE V2 / M04**, con [Plan Maestro](./PLAN-MAESTRO.md) y este documento. No pedir relato anterior, requisitos de diseño, contraseña de CLOUD, ni pruebas antiguas de acceso de músicos.
2. **Entregar APK 0.0.9 verificada** (enlace de §6), instalar encima de 0.0.8 preservando sesión, datos y caché. No pedir desinstalación ni reinstalar la 0.0.8.
3. **QA físico real 0.0.9:** (a) fotos se mantienen intactas; (b) video MP4 muestra **imagen y sonido** dentro del Chat, controles y regreso sin Chrome; (c) envío de una foto y un video originales desde nativo **sin error Blob**, confirmación Chat/Admin/CLOUD; (d) después red, expiración, Range y gestos/zoom. Si algo falla, corregir solo código V2, CLOUD intocable.
4. Si hay defecto, **corregir la única fuente V2** (sobre todo `NativeChatMediaView.tsx` / `ChatMediaView.tsx` y estilos); pasar CI y publicar APK de nuevo solo cuando haya cambios nativos, con misma firma y versionCode siguiente, sin crear otras apps. **No tocar HAVANA CLOUD para acelerar una imagen.**
5. **D1 ya auditada en lectura:** 14/14 originales y mensajes confirmados, 0 subidas activas. Repetir en el mismo teléfono/red la subida de 2 fotos + 1 video y medir tiempo extremo a extremo; contrastar con la muestra D1 posterior al Worker 32 (fotos 17.0 s, videos 34.5 s, tamaños diferentes), revisar aparición Chat/Admin/CLOUD, Range y reintentos sin duplicados. **No borrar datos**.
6. Marcar M01/M02/M04 solo después de pruebas físicas y guardar resultado **reemplazando estados en estos mismos dos documentos**; continuar resto de 27 hitos, manteniendo PWA, Android y Administrador coordinados.

## 9. Prohibiciones y QA que NO deben perderse

- No modificar CLOUD ni revivir los experimentos de otro Worker, galería privada alternativa o autenticación propia de CLOUD.
- No borrar por error la colección de fotos/videos y mensajes ahora existentes; el propietario solicitó que todo cambio descartado sea **borrado de código**, NO de datos válidos.
- No enviar contraseñas, tokens, cookies ni credenciales en enlaces o en el Chat; el músico nunca recibe la autorización de CLOUD.
- No eliminar autor/hora del mensaje cuando el usuario dice «solo imagen»; quitar **etiquetas/números de archivo**, preservar funciones del Chat.
- No reutilizar datos antiguos de D1 como estado actual; los conteos son un punto de auditoría y crecen.
- No afirmar mejora cuantitativa de velocidad ni eficacia del cache/visor en equipo físico hasta medirlo.
- PWA no es Android nativo; UI actualizada en Cloudflare Pages no sustituye una APK.
- No decir «mientras» o dejar otro documento de traspaso: la continuidad está **aquí**, completa, coherente y única.

**FIN DE LA CONTINUIDAD VIGENTE. INICIAR EL PRÓXIMO CHAT DESDE M04 CON APK ANDROID 0.0.8 PUBLICADA, SIN TOCAR HAVANA CLOUD.**
