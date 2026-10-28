# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión vigente, 28/10/2026 UTC.** Una sola arquitectura, una sola fuente de trabajo y **27 hitos originales**. Este texto sustituye las cronologías antiguas y decisiones ya superadas; ninguna parte rechazada permanece como supuesto plan alternativo.

## LEER PRIMERO: continuidad exacta del Chat

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Documento de traspaso **actualizado y sustituido íntegramente** en el mismo lugar. Contiene TODAS las instrucciones ejecutivas y técnicas necesarias para iniciar otro chat: accesos, Chat, Administrador, imágenes, videos, HAVANA CLOUD, CI, enlaces, APK Android 0.0.6 publicada, protecciones y próximo paso. Es la **única continuidad válida**, no utilizar las versiones históricas.

> **Orden de reanudación:** APK 0.0.6 ya validada. Verificar la ruta unificada de foto/video, migración D1, Service Binding, mensajes y Administrador antes de habilitar el envío; no repetir decisiones.

## 1. Reglas fijas del propietario

1. **Proyecto limpio y único:** el trabajo se mantiene exclusivamente en la rama fuente `havana-nice-v2-foundation` de `Abnernoa97/havana-nice-pwa`. Sin parches paralelos, duplicación de lógica, múltiples Chats, versiones de prueba mezcladas o funciones viejas escondidas. Borrar de la fuente cualquier elemento descartado explícitamente, sin destruir funcionalidades válidas ni datos.
2. **No romper producción ni HAVANA CLOUD:** mantener intacta la app antigua en `main`, su infraestructura y las bibliotecas de archivos existentes. V2 usa Worker/D1/DO propios; HAVANA CLOUD conserva Worker y repositorio propios. No tocar sistemas ajenos por conveniencia.
3. **Chat nativo Android 100 % React Native**; **iPhone Chat PWA**; **Administrador PWA único**. Otros módulos Android pueden tener PWA visual, no el Chat. Las tres superficies usan **una sola autorización y una sola base de mensajes**.
4. **Construcción coordinada por módulo:** fuente de datos/backend → interfaz y funciones PWA → nativo Android → Admin → QA; donde haya cambios nativos, acumular mejoras y distribuir una actualización segura. Prioridad funcionalidad y estabilidad, estética después.
5. **Actualización Android siempre encima**, con paquete `com.havananice.v2`, firma continua y versionCode creciente. Nunca desinstalar, borrar caché, cerrar sesiones ajenas ni perder borradores para actualizar.
6. **Acceso simplificado ya cerrado:** músico únicamente por **nombre autorizado manualmente en Admin**, primera instalación queda vinculada, segundo dispositivo con el mismo nombre bloqueado y alerta de duplicado. No contraseñas de músico, aprobaciones de teléfonos, seguridad bancaria, huellas inventadas ni migración de cuentas antiguas. El Admin se autentica por separado.
7. **Administrador → Chat general**: muestra todas las burbujas con autor y reacciones, tiempo real, sin escribir. Puede borrar de forma definitiva el mensaje. **No** conservar burbujas «Mensaje eliminado» ni borrado lógico; mantener el servicio canónico `message-removal.js`.
8. **Media actual: solo Fotos y Video.** Un protocolo V2 → Service Binding privado → HAVANA CLOUD → Google Drive existente. **CLOUD solo almacena; Chat V2 y su Administrador visualizan.** El perfil HAVANA NICE APP en CLOUD muestra exclusivamente sus datos de capacidad/consumo, como hoy, sin fotos/videos visibles. **Máximo 5 archivos EN TOTAL por envío** (CI de selección múltiple y lote: [SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40628869932)) (5 fotos, 5 videos, o cualquier mezcla de ambos que sume 5 o menos), con una sola acción de Enviar; el backend también impone cinco posiciones únicas por lote. Originales hasta **100 MiB por foto** y **10 GiB por video**, fragmentos de 4 MiB. Sin OAuth de músicos, R2, audio, documentos ni rutas paralelas. Solo habilitar al cerrar la verificación real.
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
| Puente experimental | Rama preexistente `havana-nice-v2-cloud-bridge-lab` (solo fotos/videos, sin subida activa) |
| CI nativo y distribución | `v2-android-apk.yml` + `v2-apk-direct-download.yml`; protección misma firma |

**Distribución firmada verificada 0.0.6:**
https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-828e0682815d.apk

- Fuente exacta APK: `828e0682815dfc0579e3197ed7a4c582372887ad`; CI base `40613744827`, build `40613744649`, distribución `40613744654`: **SUCCESS**.
- Certificado igual al APK anterior, comparado con `v2/scripts/apk-signature-gate.py`. SHA-256 APK `6f66111fa3f935c61788718fb4c220211f725f05f66e19ad603896d18f24e50e`. **Instalación y funcionamiento confirmados por el propietario el 27/10/2026 («Quedó perfecto»).**
- Última comprobación Cloudflare: Worker V2 `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`; Worker HAVANA CLOUD `a5165b9e-b952-42b3-9468-e86da0190a11`.
- Lectura D1 al redactar: **3 músicos, 3 sesiones, 3 dispositivos vinculados, 44 mensajes al control de las 03:xx UTC, 11 reacciones en la última auditoría, 0 multimedia y 0 marcadores de eliminado**. Estos conteos pueden variar por uso normal; nunca ejecutar borrados para volver a una cifra antigua.
- Las cuentas originales y el músico temporal de QA fueron retirados por indicación del propietario; nuevos nombres se crean exclusivamente en Admin y el historial anterior se preserva sin autorías falsas.

## 4. Lo que ya existe en HAVANA CLOUD y lo que FALTA

**Construido:** HAVANA CLOUD administra cuentas Google Drive, cuotas, subidas por fragmentos y biblioteca privada; Perfil → HAVANA NICE APP está en producción con Fotos, Videos y contador seguro, más namespace aislado en el Durable Object existente y GET de estado protegido. V2 y su LAB tienen contrato de consulta/preflight privado **todavía sin subidas reales**. No confundir permisos Google almacenados con tokens necesariamente vigentes hoy: comprobar sin compartirlos.

**Auditoría y limpieza (28/10/2026 UTC):** comprobación de D1 confirma **0 archivos y 0 bytes del sistema independiente obsoleto**, con 44 mensajes Chat preservados. Código viejo `drive-media.js`, pruebas propias, bootstrap `0005_v2_drive_media.sql`, importaciones y rutas **borrados físicamente en la rama fuente**. Nueva migración `0014_unified_chat_media.sql` retira `v2_media_assets`/`v2_media_quota` solamente si están vacías y crea `chat_media_assets`; **migración todavía no aplicada al D1 vivo**, para no romper el Worker desplegado. No se modifica la biblioteca ni las credenciales de HAVANA CLOUD.

**Ruta única foto/video en fuente (sin desplegar):** V2 usa `cloudflare/src/unified-media.js` (inicio/chunks/finalización atómica, mensajes autorizados, URL temporal de lectura y borrado definitivo ligado a CLOUD), `apps/pwa/src/media-upload.ts` y `apps/android/media-upload.ts` (originales, 4 MiB). PWA Chat, Android Chat y Chat general del Administrador tienen visores; **HAVANA CLOUD es únicamente el almacenamiento**. CLOUD LAB contiene `worker/havana-v2-unified-transfer.ts`, reutiliza Google Drive OAuth y el mismo Durable Object con namespaces separados; los prototipos foto-only de memoria completa también se borraron. Limites: **100 MiB foto / 10 GiB video**. Pruebas automáticas: CLOUD LAB <https://github.com/Abnernoa97/havana-nice-cloud/actions/runs/40625998575> SUCCESS; V2 <https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40627272992> SUCCESS, pendientes las verificaciones finales tras cambios de borrado.

**Bloqueo real pendiente:** Cloud Worker productivo sigue en su código original sin esta ruta, V2 no tiene Service Binding ni banderas de media, y D1 no ha migrado. Los originales y la visibilidad **no están funcionando en producción todavía**. Antes de habilitar deben probarse las cuentas Drive reales, reanudación tras fallos/caídas, cupones de acceso temporal, miniaturas ligeras, el flujo de borrado y la coexistencia de Workers; solo después distribuir APK nativa actualizada con la misma firma. El Plan Maestro **permanece en 12/27**.


## 5. Secuencia inmediatamente siguiente

1. **Continuidad (HECHO):** APK 0.0.6 aprobada. No desinstalarla ni generar otra APK provisional innecesaria.
2. **Auditoría privada antes de activar:** verificar Worker, Service Binding de HAVANA CLOUD, validez efectiva de cuentas/espacio Drive, namespace `havana-app:v1:media:` y modelo D1. No mutar usuarios ni archivos personales.
3. **M01/M02, un solo circuito:** cerrar Service Binding y migración, verificar archivo original en Drive, mensaje y visor Admin, borrado/recuperación y transferencia real desde PWA/Android antes de cerrar cada hito.
4. **Interfaz única:** almacenamiento en HAVANA CLOUD, visualización exclusivamente en Chat V2 y Administrador. No abrir otra galería en CLOUD ni habilitar audios.
5. Después completar M04; continuar resto del tablero por prioridades autorizadas, sin abandonar la sincronización Admin-PWA-nativo.

**Regla de documentación:** ante un nuevo resultado, actualizar **este mismo Plan Maestro y `CONTINUIDAD-EXACTA.md` sustituyendo estados superados**. No volver a anexar páginas cronológicas que contradicen el estado actual. No crear otro plan ni alterar el cuadro de 27 hitos.

**Estado de traspaso: listo para continuar desde el mismo proyecto y los mismos documentos.**
