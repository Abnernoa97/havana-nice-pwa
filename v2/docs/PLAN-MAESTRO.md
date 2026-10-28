# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión vigente, 28/10/2026 UTC.** Una sola arquitectura, una sola fuente de trabajo y **27 hitos originales**. Este texto sustituye las cronologías antiguas y decisiones ya superadas; ninguna parte rechazada permanece como supuesto plan alternativo.

## LEER PRIMERO: continuidad exacta del Chat

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Documento de traspaso **actualizado y sustituido íntegramente** en el mismo lugar. Contiene TODAS las instrucciones ejecutivas y técnicas necesarias para iniciar otro chat: accesos, Chat, Administrador, imágenes, videos, HAVANA CLOUD, CI, enlaces, APK Android 0.0.6 publicada, protecciones y próximo paso. Es la **única continuidad válida**, no utilizar las versiones históricas.

> **Orden de reanudación:** APK 0.0.6 y Chat de texto conservados. **Backend multimedia V2 y Administrador ya publicados y comprobados por CI en vivo.** M01/M02 esperan únicamente autorización del propietario desde Administrador y pruebas REALES de foto/video; HAVANA CLOUD no se modifica.

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
| Integración multimedia | **Worker V2 versión 31 publicado** con enlace seguro a API existente de HAVANA CLOUD, pero **sin autorización del propietario ni transferencias reales aún** |
| CI nativo y distribución | `v2-android-apk.yml` + `v2-apk-direct-download.yml`; protección misma firma |

**Distribución firmada verificada 0.0.6:**
https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-828e0682815d.apk

- Fuente exacta APK: `828e0682815dfc0579e3197ed7a4c582372887ad`; CI base `40613744827`, build `40613744649`, distribución `40613744654`: **SUCCESS**.
- Certificado igual al APK anterior, comparado con `v2/scripts/apk-signature-gate.py`. SHA-256 APK `6f66111fa3f935c61788718fb4c220211f725f05f66e19ad603896d18f24e50e`. **Instalación y funcionamiento confirmados por el propietario el 27/10/2026 («Quedó perfecto»).**
- Última comprobación Cloudflare: **V2 `6909dd0a-f555-4ffb-84a0-679e1d016c1f` (31, tráfico 100 %, nuevo)**, rollback listo `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`; **HAVANA CLOUD intacta** `a5165b9e-b952-42b3-9468-e86da0190a11` (100 %).
- Lectura D1 al redactar: **3 músicos, 3 sesiones, 3 dispositivos vinculados, 44 mensajes al control de las 03:xx UTC, 11 reacciones en la última auditoría, 0 multimedia y 0 marcadores de eliminado**. Estos conteos pueden variar por uso normal; nunca ejecutar borrados para volver a una cifra antigua.
- Las cuentas originales y el músico temporal de QA fueron retirados por indicación del propietario; nuevos nombres se crean exclusivamente en Admin y el historial anterior se preserva sin autorías falsas.

## 4. Estado REAL del multimedia (28/10/2026 UTC)

**HAVANA CLOUD, intocable y sin cambios.** Repositorio `Abnernoa97/havana-nice-cloud` en `main`, Worker de producción `havana-nice-cloud` 100 % versión `a5165b9e-b952-42b3-9468-e86da0190a11`. Cuentas Google Drive, galería normal, fotos/vídeos personales, credenciales y caché preservados. NO preparar versiones ni crear rutas/Workers de CLOUD. La carpeta HAVANA NICE APP será organizada manualmente por el propietario; no crear nueva galería.

**Backend V2 YA PUBLICADO:** Worker `havana-nice-v2-dev` **versión 31, `6909dd0a-f555-4ffb-84a0-679e1d016c1f`, 100 % de tráfico**. Compilación verificada por SHA256, creada como versión sin tráfico, comprobada frente a la versión 30 y desplegada con rollback identificado `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`. Se conservaron **exactamente** D1 `DB`, Durable Object `CHAT_ROOMS`, secreto `V2_ADMIN_LOGIN_SECRET`, permisos y compatibilidad. GitHub Actions [CI de prueba en vivo 40642331936 **SUCCESS**](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40642331936), incluidos Chat/WebSocket, API administrativa, API multimedia privada, CORS, PWA y exportación Android. La PWA Administrador también consta como **publicada correctamente** desde GitHub en Cloudflare Pages.

**ÚNICO camino técnico operativo, solo en V2:** `v2/cloudflare/src/unified-media.js` → `cloud-media-adapter.js` → `cloud-link.js` → Service Binding **en V2** a Worker CLOUD ya existente, utilizando SOLO los endpoints públicos actuales autenticados de CLOUD: `/api/auth/login`, `/api/auth/device`, `/api/google/upload/session`, `/api/google/upload/chunk`, `/api/media/:key/content`, `/api/media/delete` y `/api/trash/delete`. Cinco originales mixtos máximo por envío, fragmentos de 4 MiB, idempotencia, almacenamiento de metadatos en D1 V2 y visualización mediante `ChatMediaView` de Chat y Administrador. Un solo circuito, sin segundo puente ni modificaciones a CLOUD.

**ÚNICO paso de autorización que falta:** aún **no se ha vinculado HAVANA CLOUD**, porque se requiere su contraseña real de propietario, que el asistente no debe conocer ni solicitar por chat. El propietario entra en https://havana-nice-v2-dev.pages.dev/admin.html → **Chat → Almacenamiento del Chat → Vincular almacenamiento**, inicia sesión de Administrador y escribe allí la contraseña de HAVANA CLOUD **una sola vez**. La contraseña no se guarda: se sustituye por un token de dispositivo cifrado AES-GCM guardado solo en D1 V2. Los músicos jamás reciben la contraseña, token ni cookie de CLOUD. Las APIs se niegan si no hay vinculación.

**Estado D1 verificado tras publicar:** **44 mensajes, 3 músicos, 0 archivos multimedia, 0 sesiones de subida, 0 vínculos CLOUD**. Migraciones aditivas 0014, 0015, 0016 ya aplicadas en V2; datos previos sin pérdidas. **No afirmar que una fotografía/video real ya se subió o que el hito está cerrado.** APK Android 0.0.6 instalada permanece idéntica.

## 5. Siguientes acciones del Plan Maestro (sin desviaciones)

1. **Autorización del propietario UNA VEZ** dentro de Administrador (ruta anterior), sin compartir datos sensibles aquí.
2. Probar desde un músico autorizado **una fotografía original real**; confirmar en Chat, Administrador y galería habitual de HAVANA CLOUD, íntegra y con nombre correcto; verificar reintentos y borrado cuando el propietario lo solicite.
3. Probar un **video real** del mismo circuito, reproducción/rangos HTTP, carga y visualización Admin/PWA/Android.
4. Solo tras QA físico y remoto cerrar **M01** y **M02** y actualizar sus marcas en el tablero de 27 hitos (actualmente **12/27**). No instalar APK nueva ni borrar cachés sin necesidad.
5. Continuar los demás hitos con **PWA + Android + Administrador** sobre un solo backend, sin código paralelo y sin tocar HAVANA CLOUD.

**Regla de documentación:** ante un nuevo resultado, actualizar **este mismo Plan Maestro y `CONTINUIDAD-EXACTA.md` sustituyendo estados superados**. No volver a anexar páginas cronológicas que contradicen el estado actual. No crear otro plan ni alterar el cuadro de 27 hitos.

**Estado de traspaso: listo para continuar desde el mismo proyecto y los mismos documentos.**
