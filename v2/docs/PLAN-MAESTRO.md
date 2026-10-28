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

**V2, fuente y datos preservados:** el Chat PWA, Android nativo y Administrador conservan selectores/visores y lógica de lote de cinco originales. D1 V2 contiene la migración aditiva `0014_unified_chat_media.sql` (tabla `chat_media_assets` e índices): última lectura 44 mensajes, 3 músicos, 0 archivos multimedia; no borrar tablas heredadas de las que aún dependa el Worker vivo. La fuente V2 `unified-media.js` es **preparación no desplegada** de metadatos y subida, no un enlace utilizable: su contrato privado anterior deberá sustituirse por el acceso a las interfaces YA EXISTENTES de CLOUD, sin cambiar CLOUD. Se eliminó definitivamente el módulo experimental `havana-cloud-bridge-client.js`. **El acceso nuevo no requiere cambiar CLOUD:** V2 declara un Service Binding únicamente en su propio Wrangler hacia el Worker CLOUD *ya existente* y usa exclusivamente sus endpoints actuales `/api/auth/login`, `/api/auth/device`, `/api/google/upload/session` y `/api/google/upload/chunk`. El enlace está **apagado por defecto** (`V2_CLOUD_LINK_ENABLED=disabled`). En V2 se incorporaron `cloud-link.js`, su API únicamente administrativa y una interfaz que solo aparece si se habilita el servidor. El módulo cifra el token de dispositivo con una clave derivada de la credencial privada de Admin; no conserva la contraseña ni envía tokens a músicos. Migración `0015_cloud_link_credential.sql` **en fuente, aún no aplicada**; todavía faltan la actualización segura de `unified-media.js` al contrato existente, QA y despliegue únicamente de V2. **El Worker, PWA, despliegue y credenciales de HAVANA CLOUD no se han tocado.** Mantener el envío deshabilitado hasta un contrato real, seguro y probado.

**QA aprovechable:** [lotes de 5 mixtos V2, CI SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40633636899). Las pruebas viejas del laboratorio Cloud no representan un sistema que se vaya a desplegar y **no forman parte de la línea activa**. La APK nativa 0.0.6 permanece intacta. **Hitos oficiales: 12/27; M01/M02 pendientes.**

## 5. Secuencia inmediatamente siguiente

1. **Preservar lo aprobado:** APK 0.0.6, Chat texto, Admin, 44 mensajes, cuentas, permisos, caché y todo HAVANA CLOUD.
2. **M01:** terminar QA del enlace de dispositivo cifrado *solo en V2* (`cloud-link.js`, Admin Chat y migración 0015), sin desplegar ni modificar HAVANA CLOUD. El propietario podrá autorizarlo una sola vez en su propio Administrador cuando se habilite; su contraseña no se guarda. No activar hasta completar los controles de seguridad y la integración de transferencias.
3. Completar un solo circuito para **fotos y videos**, hasta 5 combinados por envío: subir originales, confirmar la transferencia, enlazar D1, visualizar Chat/Admin, reintentar y borrar sin duplicar. M02 se verifica con reproducción real y rango HTTP.
4. QA real de Chat/PWA/Android/Admin y de la galería habitual de CLOUD **sin modificar sus funciones**. Solo después actualizar Android sobre 0.0.6 con la misma firma y versión creciente.
5. Continuar el resto de los 27 hitos por prioridad, sin rutas paralelas, duplicaciones ni trabajo estético anticipado.

**Regla de documentación:** ante un nuevo resultado, actualizar **este mismo Plan Maestro y `CONTINUIDAD-EXACTA.md` sustituyendo estados superados**. No volver a anexar páginas cronológicas que contradicen el estado actual. No crear otro plan ni alterar el cuadro de 27 hitos.

**Estado de traspaso: listo para continuar desde el mismo proyecto y los mismos documentos.**
