# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión vigente, 28/10/2026 UTC.** Una sola arquitectura, una sola fuente de trabajo y **27 hitos originales**. Este texto sustituye las cronologías antiguas y decisiones ya superadas; ninguna parte rechazada permanece como supuesto plan alternativo.

## LEER PRIMERO: continuidad exacta del Chat

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Documento de traspaso **actualizado y sustituido íntegramente** en el mismo lugar. Contiene TODAS las instrucciones ejecutivas y técnicas necesarias para iniciar otro chat: accesos, Chat, Administrador, imágenes, videos, HAVANA CLOUD, CI, enlaces, APK Android 0.0.6 publicada, protecciones y próximo paso. Es la **única continuidad válida**, no utilizar las versiones históricas.

> **Orden de reanudación:** APK 0.0.6 ya validada. M01/M02: integrar el backend V2 con las funciones **ya existentes** de HAVANA CLOUD, sin modificarla, después verificar originales, mensajes y Administrador. Sin enlaces ni despliegues experimentales de CLOUD.

## 1. Reglas fijas del propietario

1. **Proyecto limpio y único:** el trabajo se mantiene exclusivamente en la rama fuente `havana-nice-v2-foundation` de `Abnernoa97/havana-nice-pwa`. Sin parches paralelos, duplicación de lógica, múltiples Chats, versiones de prueba mezcladas o funciones viejas escondidas. Borrar de la fuente cualquier elemento descartado explícitamente, sin destruir funcionalidades válidas ni datos.
2. **No romper producción ni HAVANA CLOUD:** mantener intacta la app antigua en `main`, su infraestructura y las bibliotecas de archivos existentes. V2 usa Worker/D1/DO propios; HAVANA CLOUD conserva Worker y repositorio propios. No tocar sistemas ajenos por conveniencia.
3. **Chat nativo Android 100 % React Native**; **iPhone Chat PWA**; **Administrador PWA único**. Otros módulos Android pueden tener PWA visual, no el Chat. Las tres superficies usan **una sola autorización y una sola base de mensajes**.
4. **Construcción coordinada por módulo:** fuente de datos/backend → interfaz y funciones PWA → nativo Android → Admin → QA; donde haya cambios nativos, acumular mejoras y distribuir una actualización segura. Prioridad funcionalidad y estabilidad, estética después.
5. **Actualización Android siempre encima**, con paquete `com.havananice.v2`, firma continua y versionCode creciente. Nunca desinstalar, borrar caché, cerrar sesiones ajenas ni perder borradores para actualizar.
6. **Acceso simplificado ya cerrado:** músico únicamente por **nombre autorizado manualmente en Admin**, primera instalación queda vinculada, segundo dispositivo con el mismo nombre bloqueado y alerta de duplicado. No contraseñas de músico, aprobaciones de teléfonos, seguridad bancaria, huellas inventadas ni migración de cuentas antiguas. El Admin se autentica por separado.
7. **Administrador → Chat general**: muestra todas las burbujas con autor y reacciones, tiempo real, sin escribir. Puede borrar de forma definitiva el mensaje. **No** conservar burbujas «Mensaje eliminado» ni borrado lógico; mantener el servicio canónico `message-removal.js`.
8. **Media actual: solo Fotos y Video.** HAVANA CLOUD es una **dependencia externa EXISTENTE Y CONGELADA**: NO modificar su código, Worker, PWA, galería, credenciales, permisos ni despliegues, ni siquiera preparar versiones alternativas para adaptar el Chat. Sus fotos/videos personales y su caché quedan intactos. El backend de **HAVANA NICE V2** deberá utilizar únicamente interfaces ya publicadas de CLOUD, con autenticación segura exclusivamente del servidor: nunca entregar credenciales de CLOUD o tokens Google a músicos. Está permitido que originales del Chat aparezcan en la galería habitual de CLOUD; el propietario organizará manualmente la carpeta **HAVANA NICE APP**. El Perfil de CLOUD mantiene sus estadísticas existentes, sin nueva galería. **Hasta 5 archivos EN TOTAL por envío** (fotos, videos o mezcla); fotos originales hasta 100 MiB, videos hasta 10 GiB, fragmentos de 4 MiB. **El almacenamiento real no está conectado todavía.** M01/M02 solo se cierran tras pruebas reales.
9. **Interfaz WhatsApp aprobada**: en una misma barra emoji funcional, campo Mensaje, clip, icono cámara y círculo de micrófono informativo/enviar. El clip abre **solamente dos filas verticales «Fotos» y «Video»**, nunca «Galería»/«Cámara» ni una cuadrícula de cuatro botones. «Fotos» permite seleccionar varias fotos y «Video» varios videos, acumulándolos en la misma cola de hasta cinco; la cámara separada abre cámara real y agrega una captura a la cola. Vista previa local con quitar; envío por fragmentos preparado en la fuente, todavía no publicado ni habilitado. La PWA fue aprobada físicamente. Android ya tiene el código y **la APK 0.0.6 fue instalada y validada físicamente por el propietario el 27/10/2026**. No reconstruir la APK por cambios del bridge.
10. No cobrar, adquirir servicios, tocar cuentas Google ni elevar permisos sin autorización. Ejecutar auditoría, tests y despliegues verificables; no afirmar algo probado en teléfono sin captura/confirmación del propietario.

## 2. Tablero original — 27 hitos

### Fundación y Chat de texto

- [x] **B01 · Fundación V2 aislada.** GitHub V2, Cloudflare Worker/D1/DO, clientes y Administrador separados de producción antigua.
- [x] **B02 · Chat básico de texto.** Envío y recepción Android nativo ↔ iPhone PWA.
- [x] **B03 · Entrada por nombre persistente.** Nombre autorizado, sesión recordada y recuperación de acceso.
- [x] **B04 · Auditoría preventiva inicial.** Integridad, cache, arquitectura y CI.
- [x] **C01 · Menú contextual del Chat.** Pulsación prolongada, respuesta, reacción, editar/eliminar.
- [x] **C02 · Edición y borrado.** Permisos, sincronización y borrado total del registro; Admin modera desde una única ruta.
- [x] **C03 · Responder deslizando.** Gesto de respuesta sin romper scroll ni teclado.
- [x] **C04 · Offline y reconexión.** Borradores, cola de mensajes y restauración sin duplicados.
- [x] **C05 · Sincronización bidireccional.** Mensajes, reacciones, ediciones, lecturas y eliminaciones.

### Android, acceso y seguridad

- [x] **H01 · Preservar Android nativo.** Paquete/firma constante y actualización física anteriormente validada; APK 0.0.6 publicada con comparación criptográfica correcta y validada físicamente por el propietario; conservó las funciones existentes.
- [ ] **H02 · Módulos no-Chat mediante PWA.** Home, Calendario y Repertorio visuales en Android; Chat continúa nativo.
- [ ] **H03 · Navegación y sesión coordinadas.** Identidad compartida, Atrás, recuperación segura de borradores/reintentos y sesión intermodular.
- [ ] **H04 · PWA visual actualizable sin APK.** Verificación física de actualización de módulos no-Chat.
- [x] **S01 · Alta y retirada de músicos desde Admin.** Solo nombres autorizados. Ensayos de altas, ingreso, historial y expulsión realizados; cuentas antiguas fueron borradas después a petición del propietario.
- [x] **S02 · Una instalación por músico y alerta privada (ACEPTADO).** Primer dispositivo vinculado, duplicado rechazado con alerta Admin, comprobado físicamente y en D1; el propietario dio por cerrada la seguridad. Liberación manual no probada físicamente, no inventar ese ensayo.

### Multimedia (prioridad actual: fotos y videos)

- [ ] **M01 · Fotos privadas reales.** Selección aprobada con APK 0.0.6. Fuente de envío original por fragmentos, mensajes, lectura Chat/Admin y eliminación remota preparada; **falta desplegar/activar coordinadamente, miniatura eficiente y probar en teléfonos reales**.
- [ ] **M02 · Videos reales.** Contrato único hasta 10 GiB, subida de 4 MiB, lectura por rango y visor web/Admin preparados; **faltan despliegue, portada ligera, reproducción nativa dentro de app y pruebas reales**.
- [ ] **M03 · Audios.** APLAZADO: HAVANA CLOUD no tiene todavía infraestructura aprobada para ellos. El micrófono del compositor no graba y solo informa; no iniciar M03.
- [ ] **M04 · Visor multimedia.** Pantalla completa, zoom, gestos, videos y regreso a Chat sin perder lugar.
- [ ] **M05 · Notificaciones push.** Android/iPhone con app cerrada, Chat y alertas, sin confundir WebSocket en vivo con push.

### Otros módulos y calidad final

- [ ] **P01 · Home y ajustes.** UI y lógica única integradas con Admin.
- [ ] **P02 · Calendario.** Eventos, notas, vestuario, horario, destinatarios y repertorio vinculado.
- [ ] **P03 · Repertorio.** General y por evento, checklist, enlaces y Admin.
- [ ] **P04 · Administrador completo.** **Acceso a músicos y Chat general ya funcionan parcialmente como entregables**; faltan Repertorio, Calendario y Más, además de moderación multimedia.
- [ ] **P05 · Avisos y perfiles.** Lecturas, preferencias e información compartida.
- [ ] **Q01 · QA integral.** Pruebas físicas, offline, firma, cuotas, integridad, ausencia de regresiones y migraciones.
- [ ] **Q02 · Transición a producción.** Solo con autorización explícita y copias verificables; sin tocar la app original anticipadamente.

**Estado oficial: 12 completados / 15 pendientes (44,4 %).** No duplicar hitos ni marcar M01/M02 terminados por disponer solamente del selector.

## 3. Tecnología y recursos vivos

| Componente | Fuente única vigente |
|---|---|
| GitHub código V2 | `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation` |
| Android nativo | `v2/apps/android`; `com.havananice.v2`; actual paquete publicado `0.0.6`, versionCode 6 |
| iPhone PWA / Chat | https://havana-nice-v2-dev.pages.dev/ |
| Administrador PWA | https://havana-nice-v2-dev.pages.dev/admin.html |
| API V2 / DO | `havana-nice-v2-dev` Worker + `CHAT_ROOMS` |
| D1 V2 | `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5` |
| HAVANA CLOUD | `Abnernoa97/havana-nice-cloud` → `main`, Worker `havana-nice-cloud` |
| HAVANA CLOUD espacio | Perfil → Aplicaciones → HAVANA NICE APP; registro privado `havana-app:v1:media:` |
| Integración multimedia | **Solo código y pruebas de HAVANA NICE V2**, todavía sin conexión operativa a CLOUD; ninguna rama Cloud alternativa |
| CI nativo y distribución | `v2-android-apk.yml` + `v2-apk-direct-download.yml`; protección misma firma |

**Distribución firmada verificada 0.0.6:**
https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-828e0682815d.apk

- Fuente exacta APK: `828e0682815dfc0579e3197ed7a4c582372887ad`; CI base `40613744827`, build `40613744649`, distribución `40613744654`: **SUCCESS**.
- Certificado igual al APK anterior, comparado con `v2/scripts/apk-signature-gate.py`. SHA-256 APK `6f66111fa3f935c61788718fb4c220211f725f05f66e19ad603896d18f24e50e`. **Instalación y funcionamiento confirmados por el propietario el 27/10/2026 («Quedó perfecto»).**
- Última comprobación Cloudflare: Worker V2 `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`; Worker HAVANA CLOUD `a5165b9e-b952-42b3-9468-e86da0190a11`.
- Lectura D1 al redactar: **3 músicos, 3 sesiones, 3 dispositivos vinculados, 44 mensajes al control de las 03:xx UTC, 11 reacciones en la última auditoría, 0 multimedia y 0 marcadores de eliminado**. Estos conteos pueden variar por uso normal; nunca ejecutar borrados para volver a una cifra antigua.
- Las cuentas originales y el músico temporal de QA fueron retirados por indicación del propietario; nuevos nombres se crean exclusivamente en Admin y el historial anterior se preserva sin autorías falsas.

## 4. Estado real del almacenamiento y limpieza auditada (28/10/2026 UTC)

**HAVANA CLOUD no se toca.** Su `main`, Worker, PWA, galería, cuentas Google, archivos, caché y funciones normales se mantienen. El módulo ya existente Perfil → HAVANA NICE APP conserva sus métricas; no se crea ninguna galería nueva. En la rama GitHub `havana-nice-v2-cloud-bridge-lab` se **eliminó todo el puente experimental de su versión activa** mediante restitución exacta al commit de `main` `9e22460751a4de7e3b85aca8096752e1372eb14d`. Quedaron fuera ocho archivos adicionales, los tres cambios divergentes y el flujo de publicación versionada. Esa rama **ya no constituye otro código de CLOUD**. No desplegar nada en Cloud por HAVANA NICE V2.

**Aprovechar lo que ya existe:** en el `main` real de CLOUD se verificaron los endpoints autenticados `/api/google/upload/session`, `/api/google/upload/chunk` y otras opciones de subida. Usan cuentas Drive ya vinculadas, aceptan archivos normales y fragmentos de 4 MiB. **Advertencia:** están protegidos por la sesión de CLOUD; NO pueden ser llamados por los teléfonos de músicos con credenciales de propietario. La forma segura de enlazarlos **desde el backend de V2 y sin modificar CLOUD** todavía debe resolverse y comprobarse. Tampoco se debe afirmar que el directorio HAVANA NICE APP se rellena automáticamente.

**M01/M02 — integración codificada solo en V2 (28/10 UTC):** La ruta única `cloudflare/src/unified-media.js` se reconectó mediante `cloud-media-adapter.js` con los endpoints YA PUBLICADOS de HAVANA CLOUD: `/api/google/upload/session`, `/api/google/upload/chunk`, `/api/media/:key/content`, `/api/media/delete` y `/api/trash/delete`. El modelo interno experimental `/api/internal/havana-v2/...` fue reemplazado, no ocultado. El acceso administrador `cloud-link.js` obtiene un dispositivo autorizado de CLOUD tras que el propietario escriba su contraseña una sola vez **dentro del Administrador V2**; guarda token cifrado en D1 V2 y nunca lo muestra a músicos. `V2_CLOUD_LINK_ENABLED` y `V2_CLOUD_MEDIA_ENABLED` están **enabled en el código fuente V2 para su futuro despliegue**, pero **NO están activos en el Worker desplegado**. Sin vínculo autorizado no se aceptan subidas. Se corrigió el visor multimedia real en el Chat general del Administrador y se conserva el visor del Chat de músicos. La base D1 V2 ya tiene las migraciones aditivas 0014, 0015 y **0016_cloud_media_resumable.sql**, verificadas con **44 mensajes, 3 músicos, 0 multimedia, 0 sesiones multimedia**. La APK 0.0.6 permanece intacta. No se publicaron los cambios V2 ni se modificó HAVANA CLOUD.


**Resultado de M01/M02 en GitHub:** [CI 40640189944 SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40640189944), cobertura de emparejamiento y encriptación, inicio/fragmentación/reintento, lectura de originales con HTTP Range y borrado en la API publicada existente mediante simulación, PWA, Android y Admin. D1 V2 verificada después: **44 mensajes, 3 músicos, 0 fotos/videos, 0 subidas, 0 conexiones**. Worker V2 en vivo sigue `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`, CLOUD principal `a5165b9e-b952-42b3-9468-e86da0190a11`, ambos 100 %. **No se ha publicado la integración**. El impedimento no es el código multimedia sino una ruta de despliegue del Worker V2 que preserve todos los bindings/secretos DO/D1 y una autorización de CLOUD dentro de Admin posterior a la publicación.

**Seguridad del enlace V2 aprobada por CI:** [Foundation 40638280715 SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40638280715): acceso únicamente Administrador, cifrado del token de dispositivo y rechazo de músico, no envío de credenciales al navegador, vínculo apagado, compilación de PWA/Android y regresiones del Chat. La migración 0015 real de V2 fue aplicada aditivamente y comprobada. **No se ha desplegado el código nuevo, ni enlazado ninguna cuenta, ni activado M01/M02.** HAVANA CLOUD no se tocó.

**QA aprovechable:** [lotes de 5 mixtos V2, CI SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40633636899). Las pruebas viejas del laboratorio Cloud no representan un sistema que se vaya a desplegar y **no forman parte de la línea activa**. La APK nativa 0.0.6 permanece intacta. **Hitos oficiales: 12/27; M01/M02 pendientes.**

## 5. Secuencia inmediatamente siguiente

1. **V2-only: publicar de forma reversible el Worker `havana-nice-v2-dev`** completo, conservando exactamente los bindings, DO, D1, secretos de acceso y versión previa. **Bloqueo externo:** GitHub Actions no tiene `CLOUDFLARE_API_TOKEN` para `wrangler deploy`; compilar/dry-run SUCCESS no significa publicación. No publicar parcialmente ni reconfigurar Workers a ciegas.
2. Entrar como Administrador a **Chat → Almacenamiento del Chat → Vincular almacenamiento** y autorizar una sola vez HAVANA CLOUD mediante su contraseña; la maneja el formulario de V2 y no se guarda.
3. Confirmar foto original real desde la PWA, aparición en Google Drive, Chat y Administrador; reintentos y eliminación definitiva del original en Cloud bajo petición explícita. Después prueba de video real, rango y reproducción.
4. Solo tras QA real cerrar M01/M02; actualizar Android sobre 0.0.6 con el mismo certificado si requiere cambio nativo. Mantener 12/27 hasta entonces.
5. Continuar el tablero original con PWA, Android y Administrador sincronizados. **No modificar HAVANA CLOUD para conseguir el enlace.**

**Regla de documentación:** ante un nuevo resultado, actualizar **este mismo Plan Maestro y `CONTINUIDAD-EXACTA.md` sustituyendo estados superados**. No volver a anexar páginas cronológicas que contradicen el estado actual. No crear otro plan ni alterar el cuadro de 27 hitos.

**Estado de traspaso: listo para continuar desde el mismo proyecto y los mismos documentos.**
