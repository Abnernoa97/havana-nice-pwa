# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión vigente, 28/10/2026 UTC.** Una sola arquitectura, una sola fuente de trabajo y **27 hitos originales**. Este texto sustituye las cronologías antiguas y decisiones ya superadas; ninguna parte rechazada permanece como supuesto plan alternativo.

## LEER PRIMERO: continuidad exacta del Chat

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Documento de traspaso **actualizado y sustituido íntegramente** en el mismo lugar. Contiene TODAS las instrucciones ejecutivas y técnicas necesarias para iniciar otro chat: accesos, Chat, Administrador, imágenes, videos, HAVANA CLOUD, CI, enlaces, APK Android 0.0.6 publicada, protecciones y próximo paso. Es la **única continuidad válida**, no utilizar las versiones históricas.

> **Orden de reanudación:** leer continuidad + este tablero, verificar GitHub/Cloudflare en lectura, ofrecer la APK 0.0.6 ya publicada para actualizar sobre la app instalada y comprobar su comportamiento físico. Después conectar fotos privadas reales con HAVANA CLOUD, primero M01 y luego M02. No pedir de nuevo decisiones ya tomadas ni ejecutar una limpieza ciega.

## 1. Reglas fijas del propietario

1. **Proyecto limpio y único:** el trabajo se mantiene exclusivamente en la rama fuente `havana-nice-v2-foundation` de `Abnernoa97/havana-nice-pwa`. Sin parches paralelos, duplicación de lógica, múltiples Chats, versiones de prueba mezcladas o funciones viejas escondidas. Borrar de la fuente cualquier elemento descartado explícitamente, sin destruir funcionalidades válidas ni datos.
2. **No romper producción ni HAVANA CLOUD:** mantener intacta la app antigua en `main`, su infraestructura y las bibliotecas de archivos existentes. V2 usa Worker/D1/DO propios; HAVANA CLOUD conserva Worker y repositorio propios. No tocar sistemas ajenos por conveniencia.
3. **Chat nativo Android 100 % React Native**; **iPhone Chat PWA**; **Administrador PWA único**. Otros módulos Android pueden tener PWA visual, no el Chat. Las tres superficies usan **una sola autorización y una sola base de mensajes**.
4. **Construcción coordinada por módulo:** fuente de datos/backend → interfaz y funciones PWA → nativo Android → Admin → QA; donde haya cambios nativos, acumular mejoras y distribuir una actualización segura. Prioridad funcionalidad y estabilidad, estética después.
5. **Actualización Android siempre encima**, con paquete `com.havananice.v2`, firma continua y versionCode creciente. Nunca desinstalar, borrar caché, cerrar sesiones ajenas ni perder borradores para actualizar.
6. **Acceso simplificado ya cerrado:** músico únicamente por **nombre autorizado manualmente en Admin**, primera instalación queda vinculada, segundo dispositivo con el mismo nombre bloqueado y alerta de duplicado. No contraseñas de músico, aprobaciones de teléfonos, seguridad bancaria, huellas inventadas ni migración de cuentas antiguas. El Admin se autentica por separado.
7. **Administrador → Chat general**: muestra todas las burbujas con autor y reacciones, tiempo real, sin escribir. Puede borrar de forma definitiva el mensaje. **No** conservar burbujas «Mensaje eliminado» ni borrado lógico; mantener el servicio canónico `message-removal.js`.
8. **Media actual: solo Fotos y Video.** HAVANA CLOUD gestiona la infraestructura Drive existente; V2 solo se integra con nuestra nube mediante puente privado. No añadir Google OAuth para músicos, Drive directo desde clientes, R2, almacenamiento alternativo ni audios/documentos en esta fase. Nunca fingir subida: `CHAT_MEDIA_UPLOAD_ENABLED=false` hasta el circuito real.
9. **Interfaz WhatsApp aprobada**: en una misma barra emoji funcional, campo Mensaje, clip, icono cámara y círculo de micrófono informativo/enviar. El clip abre **solamente dos filas verticales «Fotos» y «Video»**, nunca «Galería»/«Cámara» ni una cuadrícula de cuatro botones. «Fotos» filtra fotos, «Video» videos; cámara separada abre cámara real. Vista previa local con quitar, sin enviar aún. La PWA fue aprobada físicamente. Android ya tiene el código y **la APK 0.0.6 ya se publicó**, pendiente prueba en dispositivo.
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

- [x] **H01 · Preservar Android nativo.** Paquete/firma constante y actualización física anteriormente validada; APK 0.0.6 nueva compilada y publicada con comparación criptográfica correcta, pendiente prueba física de instalación.
- [ ] **H02 · Módulos no-Chat mediante PWA.** Home, Calendario y Repertorio visuales en Android; Chat continúa nativo.
- [ ] **H03 · Navegación y sesión coordinadas.** Identidad compartida, Atrás, recuperación segura de borradores/reintentos y sesión intermodular.
- [ ] **H04 · PWA visual actualizable sin APK.** Verificación física de actualización de módulos no-Chat.
- [x] **S01 · Alta y retirada de músicos desde Admin.** Solo nombres autorizados. Ensayos de altas, ingreso, historial y expulsión realizados; cuentas antiguas fueron borradas después a petición del propietario.
- [x] **S02 · Una instalación por músico y alerta privada (ACEPTADO).** Primer dispositivo vinculado, duplicado rechazado con alerta Admin, comprobado físicamente y en D1; el propietario dio por cerrada la seguridad. Liberación manual no probada físicamente, no inventar ese ensayo.

### Multimedia (prioridad actual: fotos y videos)

- [ ] **M01 · Fotos privadas reales.** **Interfaz + menú Fotos/cámara aprobados en PWA y codificados en Android; APK 0.0.6 publicada.** Falta transferencia a HAVANA CLOUD, miniatura, progreso, lectura desde Chat PWA/nativo/Admin y borrado físico del archivo. **Siguiente hito activo.**
- [ ] **M02 · Videos reales.** **Menú Video y selector de videos listos**, sin envío aún. Falta carga por fragmentos/reanudación, poster, duración, reproducción en clientes/Admin y borrado remoto.
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
- Certificado igual al APK anterior, comparado con `v2/scripts/apk-signature-gate.py`. SHA-256 APK `6f66111fa3f935c61788718fb4c220211f725f05f66e19ad603896d18f24e50e`. **No se ha confirmado instalación en teléfono del propietario**.
- Última comprobación Cloudflare: Worker V2 `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`; Worker HAVANA CLOUD `a5165b9e-b952-42b3-9468-e86da0190a11`.
- Lectura D1 al redactar: **3 músicos, 3 sesiones, 3 dispositivos vinculados, 43 mensajes, 11 reacciones, 0 multimedia y 0 marcadores de eliminado**. Estos conteos pueden variar por uso normal; nunca ejecutar borrados para volver a una cifra antigua.
- Las cuentas originales y el músico temporal de QA fueron retirados por indicación del propietario; nuevos nombres se crean exclusivamente en Admin y el historial anterior se preserva sin autorías falsas.

## 4. Lo que ya existe en HAVANA CLOUD y lo que FALTA

**Construido:** HAVANA CLOUD administra cuentas Google Drive, cuotas, subidas por fragmentos y biblioteca privada; Perfil → HAVANA NICE APP está en producción con Fotos, Videos y contador seguro, más namespace aislado en el Durable Object existente y GET de estado protegido. V2 y su LAB tienen contrato de consulta/preflight privado **todavía sin subidas reales**. No confundir permisos Google almacenados con tokens necesariamente vigentes hoy: comprobar sin compartirlos.

**Pendiente:** enlace de transferencia privada Service Binding validado, autorización única, idempotencia, espacio por cuenta, fotos reales, comprobación de cuota, miniaturas, sesión/autor, lecturas autorizadas, reintentos, borrado remoto confiable, presencia en Admin y video por fragmentos. No añadir un segundo storage ni subir imágenes a D1. Primero cerrar M01 con prueba real en PWA/nativo/Admin y luego reutilizar mismo circuito para M02. Mantener aislamiento total de galería personal y seguridad sin ingeniería exagerada.

## 5. Secuencia inmediatamente siguiente

1. **Continuidad y pruebas físicas:** entregar al propietario la APK 0.0.6 ya publicada y verificar que se instale **encima**, sin borrar datos; probar selector Fotos, Video, cámara nativa, emoji y texto. PWA con esas funciones ya aprobada físicamente.
2. **Auditoría privada antes de activar:** verificar Worker, Service Binding de HAVANA CLOUD, validez efectiva de cuentas/espacio Drive, namespace `havana-app:v1:media:` y modelo D1. No mutar usuarios ni archivos personales.
3. **M01 fotografía real:** completar un solo protocolo de subida segura, creación de mensaje en D1, consulta en Chat PWA/nativo y lectura/moderación desde Chat general Admin; pruebas físicas. Borrado debe ser definitivo en ambos sistemas con reconciliación si falla una parte.
4. **M02 video real:** mismos endpoints de referencia/autorización, subida controlada y progresiva, reproducción, eliminación. No agregar audios.
5. Después completar M04; continuar resto del tablero por prioridades autorizadas, sin abandonar la sincronización Admin-PWA-nativo.

**Regla de documentación:** ante un nuevo resultado, actualizar **este mismo Plan Maestro y `CONTINUIDAD-EXACTA.md` sustituyendo estados superados**. No volver a anexar páginas cronológicas que contradicen el estado actual. No crear otro plan ni alterar el cuadro de 27 hitos.

**Estado de traspaso: listo para continuar desde el mismo proyecto y los mismos documentos.**
