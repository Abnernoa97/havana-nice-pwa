# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión del plan:** 2026-10-26 · arquitectura híbrida con Chat Android 100 % nativo  
**Estado:** Fundación cerrada; Chat Android React Native conservado como módulo 100 % nativo; Chat iPhone en PWA; integración de pantallas visuales PWA dentro de Android pendiente; seguridad, multimedia, push y módulos restantes por completar.  
**Rama de trabajo:** `havana-nice-v2-foundation` del repositorio `Abnernoa97/havana-nice-pwa`.  
**Producción protegida:** `main`, HAVANA NICE oficial, sus usuarios y Supabase, HAVANA CLOUD y los demás proyectos permanecen intactos.  
**Presupuesto obligatorio:** 0 MXN de costo adicional, sin productos de facturación automática.  
**Documento rector:** este es el único plan de arquitectura, tareas, estado y auditoría de V2. La historia de cambios se conserva en Git.

> **DECISIÓN ARQUITECTÓNICA DEFINITIVA — 26/10/2026:** **Chat Android es y seguirá siendo 100 % nativo (React Native/Expo)**: interfaz, escritura, teclado, burbujas, gestos, historial local, cola offline, WebSocket y multimedia cuando corresponda. **Chat en iPhone continúa como PWA**, porque no se distribuirá app iOS nativa de pago. **Home, Calendario, Repertorio, avisos, perfiles, ajustes visuales y Administrador** utilizan una sola **interfaz PWA React**, compartida entre iPhone y una WebView integrada en Android. El Android nativo conserva también permisos, notificaciones FCM, almacenamiento seguro, archivos, cámara, ciclo de vida y puente de integración. No transformar el Chat Android en WebView ni rehacer su código operativo. Se comparte la API, el backend y los contratos del Chat, no obligatoriamente sus componentes visuales. Los cambios puramente visuales de las pantallas PWA se publican sin APK; los cambios estructurales del Chat nativo requieren APK.

---

# 0. TABLERO DE AVANCE — CHECKLIST VIVA

**Actualizado:** 26 de octubre de 2026. **Avance certificado: 5 de 27 hitos**; los otros 22 requieren implementación y/o validación. Este conteo representa hitos cerrados, **no porcentaje de funciones o tiempo restante**. La prioridad de trabajo actual está en **C02–C05: terminar y probar el Chat Android nativo ↔ Chat iPhone PWA**.

**Cómo se usa:** `[x]` y texto tachado = terminado y confirmado; `[ ]` = todavía abierto. `EN REVISIÓN` significa que existe código o alguna prueba pero **no** está cerrado físicamente. Cuando el propietario confirme «ya quedó» y exista evidencia aplicable (CI, pruebas reales y control de regresión), cambiar **solo** la tarea correspondiente a `[x] ~~...~~` en este tablero, actualizar su evidencia y continuar. No marcar toda una fase por aprobar una captura aislada. Este tablero es la **lista única de progreso** y las secciones siguientes explican sus requisitos, sin crear planes paralelos.

## A. Base ya confirmada — 4/4

- [x] ~~**B01 · Fundación V2 aislada** — Android, iPhone PWA, Worker, D1 y WebSocket; se corrigió arranque Android sin Metro.~~ Confirmación del propietario el 24/10 y CI posteriores.
- [x] ~~**B02 · Chat básico de texto** — envío/recepción Android ↔ PWA, mensajes en vivo, teclado Android usable.~~ Confirmación física inicial el 25/10. No implica cierre del Chat avanzado.
- [x] ~~**B03 · Entrada por nombre persistente** — Orly, Andy, Jali, Rafa, Noa y Fer, sin distinguir mayúsculas; reapertura sin clave temporal.~~ Usuario confirmó «Ya quedó» el 26/10. **La aprobación segura de nuevos dispositivos sigue pendiente en S01.**
- [x] ~~**B04 · Auditoría preventiva #1** — corrección de caché PWA, limpieza de 18 sesiones vencidas, índice redundante D1 y controles de CI.~~ Ver sección 19. Auditorías futuras seguirán periódicamente.

## B. PRIORIDAD ACTUAL — Chat completo y estable — 1/5

- [x] ~~**C01 · Menú de interacción estilo WhatsApp** — pulsación prolongada junto a la burbuja, reacciones 👍 ❤️ 😂, Responder y botones Editar/Borrar con permisos; sin botón `+` inerte, sin franja duplicada, búsqueda plegable y teclado Android visible sobre la barra de escritura.~~ **Confirmado físicamente el 26/10/2026 a las 12:21 (CDMX):** capturas de ambos Chat muestran las tres acciones en mensajes propios recientes; APK Android `HAVANA-NICE-V2-ANDROID-b633676db5e1.apk` instalada sobre la existente y captura con `Escribe un mensaje` + `Enviar` sobre el teclado Android 16; el propietario confirmó «Ya quedó, seguimos». CI Android `40374961989` SUCCESS; distribución `40374961969` SUCCESS y enlace HTTP 200. **Nota:** C02 exige probar que las operaciones de edición/borrado realmente se apliquen y sincronicen entre ambos clientes; la aparición de botones no certifica C02.
- [ ] **C02 · Borrar y editar mensajes.** **EN DESARROLLO / QA FÍSICA PENDIENTE (26/10):** servidor ya exige autor real, ventanas de 15 minutos para editar y 48 horas para borrar, tombstone y evento realtime `chat.updated`. **Corrección integrada en commit `c9751d69`** en un único cambio atómico para Chat Android React Native + Chat iPhone PWA + guard de regresión: texto de edición y borrador previo preservados, bloqueo temporal de `Guardar` durante envío, confirmación de edición únicamente después del `chat.updated` servidor, error recuperable al perder conexión/expirar confirmación, prevención de reenvío mientras está pendiente y preview correcto `Mensaje eliminado` en replies. El botón Borrar conserva confirmación previa y rechazo desde servidor si mensaje ajeno/caducado. **No cerrar hasta** CI correcto, probar editar y borrar mensajes propios en Android y PWA con sincronización cruzada, mensajes de terceros sin controles indebidos, respuestas a borrados, recuperación de conexión y preservación de texto cuando falle el envío. No modificar Worker ni D1 sin nueva evidencia. **QA física 26/10 12:35 (capturas + «Todo perfecto»):** el borrado queda **confirmado visualmente en ambos clientes**: tombstones «Mensaje eliminado» para mensajes de distintos remitentes, con historial y hora preservados; el compositor y la vista previa de respuesta siguen visibles en Android con el teclado abierto. La respuesta del propietario es favorable. **No inferir de las capturas que Editar quedó sincronizado en ambos sentidos ni que la nueva APK de `c9751d69` ya esté instalada**: requieren prueba específica tras la publicación. C02 continúa abierto hasta esa comprobación. 
- [ ] **C03 · Deslizar para responder.** **EN REVISIÓN:** gesto derecho implementado en los dos clientes; probar respuesta, preview, teclado, conflicto con scroll vertical y llegada al otro dispositivo.
- [ ] **C04 · Reconexión y offline.** **EN REVISIÓN:** reconexión y colas implementadas; probar pantalla bloqueada, salir/regresar, cierre forzoso, modo avión, alternar Wi-Fi/datos, guardar borrador, FIFO sin duplicados.
- [ ] **C05 · Sincronización bidireccional completa.** **EN REVISIÓN:** confirmar presencialmente Android nativo ↔ iPhone PWA con envío simultáneo, reacciones, edición, borrado, orden, recibos y sesiones restauradas.

**Puerta para tachar C01–C05:** CI y backend válidos cuando aplique **más prueba física específica**. No cerrar por existir código o APK publicada. Agrupar cambios de Chat Android y entregar una sola APK verificada, sin desinstalar la anterior.

## C. Android nativo + interfaz PWA para lo demás — 0/4

- [ ] **H01 · Proteger y congelar línea base del Chat Android 100 % nativo.** Registrar identidad/firma de APK, SQLite, sesión, cola y rendimiento; no perder datos ni duplicar motores. **Auditoría preventiva 26/10:** el workflow `.github/workflows/v2-android-apk.yml` verifica firma, bundle JS y paquete `com.havananice.v2`, pero no compara el certificado con la APK anterior ni fija expresamente un `versionCode` ascendente en `app.json`. La actualización conservando datos requiere cotejar certificados, identificador y versiones de la APK previa y nueva; **nunca desinstalar ni borrar caché** para resolver incompatibilidades. **Pendiente de prueba, sin cambiar 4/27.** **Auditoría 26/10 de APK `b35c173a`:** el pipeline automatizado puede publicar una APK solo al aprobar el build y su SHA, pero la validación `apksigner verify` no comprueba que el certificado de la nueva APK coincida con el de la instalada. Antes de instalar sobre la app, conservar el package, comparar firmas cuando sea posible y no desinstalar si Android rechaza una actualización.
- [ ] **H02 · WebView de secciones NO-Chat.** Android abre Home/Calendario/Repertorio/Admin como PWA; al pulsar Chat cambia al **Chat React Native**, sin Chat PWA oculto en Android.
- [ ] **H03 · Navegación y sesión coordinadas.** Compartir identidad de forma protegida, sin segundo login, botón Atrás por nivel, sin pantallas blancas offline ni sesiones duplicadas.
- [ ] **H04 · Cambios visuales PWA sin APK.** Confirmar con prueba real que texto/color/estructura de Home/Repertorio/Admin se actualizan en Android WebView e iPhone PWA sin reinstalar.

## D. Seguridad y Administración de accesos — 0/2

- [ ] **S01 · Alta y aprobación de nombres/dispositivos desde Administrador.** El músico ingresa solo su nombre la primera vez, pero un teléfono nuevo necesita autorización segura; permitir dar/quitar acceso.
- [ ] **S02 · Revocación efectiva y sesiones seguras.** Bloquear token y WebSockets, registrar dispositivos, renovar credenciales sin exigir ingreso frecuente y proteger almacenamiento nativo.

## E. Chat multimedia y avisos del sistema — 0/5

- [ ] **M01 · Fotografías privadas.** Selector, compresión, miniatura, progreso y envío cruzado; puente HAVANA CLOUD→Drive con separación absoluta de galería y costo 0 MXN probado. **Aún apagado.**
- [ ] **M02 · Video.** Subida controlada, poster/duración, reproducción fluida y vuelta al Chat; cuota gratuita verificada.
- [ ] **M03 · Audio.** Grabación, envío y reproducción Android nativo ↔ iPhone PWA.
- [ ] **M04 · Visor multimedia.** Foto/video fullscreen, zoom, gestos, Atrás y conservación de posición del Chat.
- [ ] **M05 · Push real.** Android FCM nativo e iPhone Web Push, con app cerrada/bloqueada y navegación al Chat correcto.

## F. Pantallas PWA compartidas — 0/5

- [ ] **P01 · Home, navegación y Ajustes visuales.** PWA única dentro de Android WebView y PWA iPhone.
- [ ] **P02 · Calendario.** Eventos, destinatarios, horario de texto libre, Llegar/Vestuario/Notas/Llamadas/Show y repertorio dentro de tarjeta de evento.
- [ ] **P03 · Repertorio.** General + por evento, checklist, contador, enlaces, canciones nuevas, selección múltiple y reordenación Admin.
- [ ] **P04 · Administrador completo.** Dashboard, músicos/dispositivos, calendario, repertorios y notificaciones; permisos en Worker.
- [ ] **P05 · Avisos, perfiles y módulos de información.** Leído/no leído, enlaces, preferencias e integración sin duplicar pantallas.

## G. Cierre de proyecto — 0/2

- [ ] **Q01 · QA integral / auditoría final.** Seguridad, costo 0, rendimiento, pruebas multiusuario, actualizaciones APK sobre instalada, offline, no duplicados y respaldo; sin regresiones Android/iPhone.
- [ ] **Q02 · Transición gradual desde HAVANA NICE actual.** Únicamente con aprobación expresa y backups, sin romper producción ni perder datos del equipo.

**Reglas de mantenimiento del tablero:** cada confirmación se tacha aquí con fecha/evidencia, se revisan contadores de hitos, y se conserva §main§/producción y HAVANA CLOUD. No eliminar tareas porque aún no estén implementadas; se tachan al cerrarlas o se sustituyen solo por una decisión explícita. Prioridad inmediata: **C02 → C03 → C04 → C05**, sin migrar el Chat Android a WebView.

---

# 1. PROPÓSITO Y EXPERIENCIA FINAL

HAVANA NICE V2 es una aplicación privada de HAVANA NICE para músicos y administrador: Chat, calendario, repertorio de eventos, repertorio general, avisos, perfiles, ajustes y gestión de accesos. Debe sentirse rápida, profesional y sencilla en Android y iPhone, manteniendo estrictamente separados V2 y la aplicación oficial actual.

**Distribución por plataforma:**

- **Android:** APK nativa Expo/React Native. El **Chat completo es 100 % nativo**: render de mensajes, escritura, gestos, scroll, cola offline, conexión, multimedia cuando se implemente e integración con el teléfono. Para **las otras pantallas visuales** se integra la única PWA V2 dentro de una WebView segura.
- **iPhone:** PWA instalada desde Safari. Chat y demás pantallas se muestran en la PWA; toda la lógica de permisos, eventos y datos queda compartida en el servidor.
- **Diseño coherente, no código visual idéntico en Chat:** las interfaces del Chat Android e iPhone respetan el mismo lenguaje visual y mismas capacidades, aunque una esté dibujada por React Native y otra por React/CSS.
- **Cambios frecuentes sin APK:** colores, tipografías, textos y distribución de Home, Calendario, Repertorio, Admin y otras pantallas PWA se actualizan mediante Pages. Un cambio de la **interfaz nativa del Chat** requiere nueva compilación APK.
- **Local-first y realtime:** arranque rápido con caché, cola de mensajes, reconexión, cero duplicados y sincronización con D1/Durable Objects.
- **Cero costo adicional:** no activar productos con cobro por uso, R2, suscripciones ni pagos automáticos. Adecuar funciones al plan Free.
- **Preservación de datos:** ninguna actualización Android debe requerir desinstalación ni pérdida de sesión, mensajes locales, caché o borradores.

# 2. ARQUITECTURA OFICIAL — CHAT NATIVO Y PWA VISUAL

```text
                      HAVANA NICE V2
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
     ANDROID — APK                        iPHONE — PWA
     Expo / React Native                  React + Vite
           │                                   │
     ┌─────┴─────────────┐                     │
     │                   │                     │
 CHAT 100 % NATIVO   WebView de PWA       CHAT PWA
 React Native        Home / Calendario    Home / Calendario
 Texto / gestos      Repertorio / Admin   Repertorio / Admin
 WebSocket/SQLite    Interfaces visuales  IndexedDB / Web Push
 Multimedia futuro   actualizables
     │                   │                     │
     └──────────┬────────┴─────────────────────┘
                │
       CLOUDFLARE WORKER V2
   identidad · sesiones · autorización · API
                │
           ┌────┴───────────┐
           │                │
         D1 SQLite     Durable Objects
        historial      WebSockets/realtime
                │
         Multimedia privada
       puente backend autorizado
       HAVANA CLOUD → Google Drive
       (solo cuando sea seguro y 0 MXN)
```

**La frontera es explícita:** Chat Android **no entra en WebView**. La PWA Android sirve a Home, Calendario, Repertorio, Admin y pantallas de información/ajustes; iPhone muestra esos mismos módulos más su implementación web del Chat. Todas las operaciones persistentes pasan por el mismo servidor y siguen las mismas reglas.

## 2.1 Chat Android: 100 % React Native

`v2/apps/android/` mantiene el módulo de Chat ya construido. En Android, el Chat se dibuja mediante componentes nativos React Native y administra su propio ciclo de vida:

- entrada por nombre autorizado y recuperación automática de sesión;
- historial y mensajes de caché desde SQLite, borradores y cola offline;
- teclado, scroll, long-press WhatsApp-like, barra flotante de emojis, acciones Editar/Borrar y swipe derecho para responder;
- recepción y envío WebSocket, búsqueda, paginación, estado de entrega, reacciones y presencia;
- multimedia y viewers cuando el almacenamiento privado esté autorizado; FCM y archivos con módulos nativos.

**No eliminar ni sustituir `App.tsx` / `SwipeableBubble.tsx` de Android por vistas HTML.** Podrán refactorizarse para separar el módulo Chat, navegación y WebView de otros módulos, conservando comportamiento y estado.

Una pantalla nativa de Chat se mantiene justificadamente porque priorizamos fluidez de gestos, teclado, escritura y multimedia. Esto no garantiza por sí solo superioridad de rendimiento; se comprueba en teléfono real.

## 2.2 PWA: capa visual reutilizable para los demás módulos

`v2/apps/pwa/` es el origen visual para **Home, Calendario, Repertorio general y por evento, Notificaciones internas, Perfiles, Ajustes visuales y Administrador**.

- **iPhone:** la PWA también implementa el Chat web usando los mismos contratos y backend.
- **Android:** la misma PWA se carga en una WebView únicamente al visitar las pantallas no-Chat. El botón Chat regresa al módulo nativo React Native, sin abrir la versión web del Chat dentro de Android.
- Los componentes y estilos web de las secciones comunes se comparten literalmente. La UI Android nativa del Chat persigue equivalencia visual mediante guías de diseño, sin duplicar toda la lógica de negocio.
- El Chat PWA debe permanecer funcional para iPhone. No retirarlo ni deshabilitarlo en la PWA por ser nativo en Android.

**Actualizaciones sin APK:** cambiar textos, paletas, tarjetas, menús, tipografía o disposición de un módulo PWA se publica en Cloudflare Pages. Puede requerir cerrar/reabrir la vista para cargar versión nueva. **Cambiar Chat Android** (incluso estructura de burbujas o estilos nativos) normalmente requiere una APK nueva.

## 2.3 Núcleo Android y navegación

Mantener identificador `com.havananice.v2`, firma, caché y permisos. La aplicación Android será **nativa con navegación combinada**: una ruta o pestaña Chat nativa y secciones PWA en WebView. El proyecto nativo administra:

- ciclo de vida, conectividad, reanudación y notificaciones;
- FCM y permisos, servicios del sistema, archivos/cámara, haptics, multimedia y caché/almacenamiento protegido;
- botón Atrás un nivel, cierre de overlays, regreso de PWA a Chat sin expulsar al usuario al menú principal;
- apertura de ruta concreta al pulsar una notificación;
- puente mínimo WebView↔Android para funciones del SO que la web necesite.

No crear **una segunda instancia Android del Chat en WebView**, ni duplicar conexiones de Chat en Android mientras el Chat nativo ya está activo. El módulo PWA embebido no debe lanzar auto-sync ni WebSocket de Chat si el usuario navega por Home/Calendario.

## 2.4 iPhone, compatibilidad y diseño

iPhone se distribuye como PWA instalada desde Safari, sin App Store. Soporta Chat web, Home, Calendario, repertorio y Admin según permisos, usando IndexedDB, Service Worker y Web Push cuando el sistema lo permite. No afirmar que las notificaciones iOS o servicios en segundo plano funcionan en todas las condiciones sin pruebas físicas.

El lenguaje visual es coherente en ambas plataformas: colores, iconografía, jerarquías, nombres, tarjetas y comportamiento de mensajes. Para el Chat, se valida **paridad funcional** mediante tests de React Native Android ↔ React PWA iPhone; no se exige compartir el código que dibuja burbujas.

# 3. ESTRUCTURA DE CÓDIGO Y FUENTE ÚNICA DE VERDAD

**Repositorio:** `Abnernoa97/havana-nice-pwa`. Desarrollo V2 exclusivamente en rama `havana-nice-v2-foundation` y directorio `v2/`. Rama `main` es producción de la app actual y queda estrictamente en modo **solo lectura**. Los binarios Android V2 se distribuyen desde `havana-nice-v2-apk-downloads`.

```text
v2/
├─ apps/
│  ├─ android/            Chat 100 % React Native + navegación + WebView de módulos PWA
│  └─ pwa/                UI web de iPhone y secciones visuales compartidas
│                         iPhone mantiene también su Chat PWA
├─ packages/shared/       Contratos Chat/API, DTOs, validación y helpers
├─ cloudflare/
│  ├─ src/                Worker V2, ChatRoom, integración media apagada
│  ├─ migrations/         D1 versionada
│  └─ tests/              QA de backend, permisos y media
├─ tests/cross-platform/  Casos Android Chat nativo ↔ iPhone Chat PWA
├─ scripts/               Auditoría y regresiones
└─ docs/PLAN-MAESTRO.md   ÚNICO DOCUMENTO RECTOR
```

**Reutilización correcta:** ambos Chat comparten mensajes, contratos, políticas, API, deduplicación, permisos, reacciones, reglas de borrado y estado de servidor, no la UI dibujada. El Chat Android puede mantener SQLite nativo y WebSocket propio; el Chat iPhone usa IndexedDB y WebSocket del navegador. Solo existe una fuente de verdad backend, no dos sistemas de mensajes.

La PWA de las pantallas no-Chat es única y reutilizable entre Android/iPhone. No copiar sus componentes a React Native. La integración WebView no modifica el Chat Android que el usuario ya instaló.

**Mantenimiento:** no acumular `fix2`, `final`, motores duplicados, APIs paralelas o dependencias muertas. Hacer pruebas y auditorías preventivas; no refactorizar partes estables únicamente por estética.

# 4. WEBVIEW DE SECCIONES NO-CHAT Y PUENTE NATIVO

La WebView Android es un componente **de navegación para pantallas PWA**, no un reemplazo del Chat nativo.

## 4.1 Seguridad y rutas

- Montar `react-native-webview` solo en las secciones PWA autorizadas: Home, Calendario, Repertorio, notificaciones internas, perfiles, Admin y ajustes visuales.
- Restringir origen a la PWA V2; abrir enlaces externos de manera controlada. Validar toda orden que cruce el puente WebView↔Android: origen, tipos, versión, autorización y parámetros.
- No insertar secretos Cloudflare, OAuth, Google Drive, tokens de servicio ni credenciales del administrador dentro del HTML ni del bundle PWA.
- Toda operación privilegiada sigue verificándose en el Worker; una WebView no se convierte en “admin” solo porque la APK sea nativa.
- Proteger historial y sesión al cambiar entre Chat nativo y secciones web; minimizar duplicaciones de credenciales.

## 4.2 Contrato del puente

Comandos según necesidad: `getNativeCapabilities`, `requestNotificationPermission`, `registerPushToken`, `pickMedia`, `openExternalLink`, `hapticFeedback`, `setStatusBar`, `navigateBack`. También se requiere una orden restringida `openNativeChat` desde las pantallas PWA: cambia a la **ruta React Native del Chat**, sin abrir un segundo socket WebView ni recrear la pantalla en HTML.

Una acción del puente especifica resultado, error y fallback cuando se ejecuta la PWA directamente en Safari. La UI web nunca ejecuta código nativo arbitrario.

## 4.3 Teclado, caché y Atrás

- Los módulos PWA comunes disponen de shell/cache local para mostrar información cuando no exista red; ningún fallo de WebView bloquea el acceso al Chat nativo.
- Al pulsar Chat desde PWA Android, mantener el estado del Chat React Native, incluidos posición de scroll y borrador.
- Al salir de Chat nativo hacia WebView, se conserva sesión/caché y el motor del Chat no debe duplicarse en otra vista; la política de WebSocket en background seguirá siendo responsable de reconectar al regreso.
- Android Back: primero cerrar menú/modal/visor, luego subir un nivel; al pasar del módulo PWA a Chat no salir a Home de forma inesperada.
- Medir la carga WebView y los módulos web, **sin comprometer el arranque ni la fluidez del Chat Android nativo**.

# 5. SERVIDOR Y DATOS — CLOUDFLARE AISLADO

Recursos existentes de V2:

- Cloudflare Worker de desarrollo: **`havana-nice-v2-dev`**.
- API de desarrollo: **https://havana-nice-v2-dev.soloaplicaciones97.workers.dev/**.
- Cloudflare Pages PWA: **https://havana-nice-v2-dev.pages.dev/**.
- D1 aislada: `havana-nice-v2-dev`, UUID `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5`.
- Durable Object: clase `ChatRoom` con estado SQLite y WebSockets.
- Configuración: `v2/cloudflare/wrangler.jsonc`. No hay R2 activado.

## 5.1 Worker/API

Única puerta de entrada para autenticación, autorización, Chat, reglas, acceso a D1, medios, notificaciones y futuras operaciones Admin. Ningún cliente accede directamente a D1. Rutas existentes incluyen `/health`, `/realtime/health`, `/api/chat/session`, `/api/chat/messages`, `/api/chat/media/*` (deshabilitadas para uploads reales) y `/ws`.

Las futuras rutas para Calendar, Repertoire, Notifications, Family y Admin pertenecen al **mismo servicio lógico** y requieren validaciones centralizadas. No crear backend separado para iPhone, Android o Administrador.

## 5.2 D1

Fuente persistente de usuarios, miembros, sesiones, dispositivos futuros, eventos, permisos, mensajes, replies, reacciones, recibos de lectura, calendario, repertorio, notificaciones y metadatos de multimedia. Nunca almacenar videos u originales grandes en D1.

Esquemas reproducibles mediante migraciones existentes `0001` a `0008`. Las tablas de Chat incluyen `chat_messages`, `chat_reactions`, `chat_read_receipts`, `chat_sessions` y `chat_members`. Existen tablas `v2_media_assets`/`v2_media_quota` preparadas pero la subida de fotografías NO está activada.

Preservar IDs, orden de secuencia, unicidad de `sender_id + client_message_id` y tombstones del borrado. Los índices se revisan por consulta real; no duplicar B-trees sobre columnas que ya son clave primaria.

## 5.3 Durable Objects / WebSockets

Chat es realtime por WebSocket sobre Durable Objects; D1 almacena el estado confirmado. Orden correcto, ACK tras persistencia, idempotencia, difusión, presencia y typing efímero. Los clientes muestran mensajes locales en cola y los reconcilian tras confirmación del servidor.

No interpretar “enviado” como “leído”. “Enviado” significa aceptado/persistido por backend según contrato; recibos de lectura pertenecen a otra señal. Si un mensaje llega repetido, el identificador del cliente permite deduplicación.

## 5.4 Sincronización entre Android y iPhone

No hay una “versión Android de los datos” y otra “versión iPhone”. Los dos dispositivos consultan el mismo Worker y comparten historial y validaciones; la presentación PWA también es común.

Probar Chat Android↔iPhone con mensajes simultáneos, cambio de red, app minimizada, volver tras cierre, historial paginado, edición, borrado, reacciones y orden. Las pruebas sintéticas de WebSocket no prueban por sí mismas teclado, gestos, permisos ni reconexión real de ambos sistemas.

# 6. IDENTIDAD, PRIMER ACCESO Y ADMINISTRACIÓN DE DISPOSITIVOS

El acceso de músico será deliberadamente sencillo y coherente con el funcionamiento anterior de HAVANA NICE:

1. El músico autorizado escribe **solo su nombre** en su primer acceso al dispositivo.
2. No distinguen mayúsculas ni minúsculas: `ORLY`, `orly` y `Orly` son la misma identidad.
3. Si está autorizado, el servidor emite una credencial aleatoria del dispositivo y la sesión se recuerda.
4. En siguientes aperturas entra directamente a la aplicación sin repetir nombre ni contraseña.
5. El administrador podrá dar de alta, permitir y retirar el acceso de nombres/dispositivos, con comprobación **en servidor** y revocación efectiva aunque la app continúe instalada.

Lista inicial V2 ya autorizada: **Orly, Andy, Jali, Rafa, Noa y Fer**. Otros nombres se darán de alta únicamente desde Admin V2 cuando exista ese módulo. No hardcodear una lista abierta dentro del frontend.

El acceso temporal de laboratorio mediante clave adicional ha sido retirado del flujo vigente. El backend ahora consulta `chat_members` y verifica `active` al emitir/restaurar sesión. La aplicación Android y la PWA recuerdan el último acceso local y consultan al servidor para restaurarlo.

**Riesgo de seguridad que debe resolverse antes de distribución al equipo completo:** escribir un nombre conocido todavía permite que otro dispositivo intente registrarse como esa persona. El módulo Admin V2 debe introducir **aprobación inicial del dispositivo**, inventario, bloqueo, reemplazo y revocación. La experiencia de músico seguirá siendo “escribir nombre una vez y entrar”; la complejidad queda del lado del administrador. No habilitar identidades no aprobadas por comodidad.

La caducidad técnica larga que actualmente evita reingresos no sustituye un sistema maduro. Sustituir por credencial de dispositivo revocable y renovación transparente, con registro de dispositivo y fecha de último uso. En Android guardar material sensible con protección del SO; en PWA aplicar modelo web seguro. No almacenar secretos de Google/Cloudflare en cliente.

Roles:

- **Administrador:** autoriza nombres y dispositivos, revoca permisos, administra eventos, repertorios, avisos y configuración.
- **Músico:** Chat, calendario y repertorio que le correspondan, notificaciones, su perfil y ajustes habilitados.
- **Inactivo o revocado:** sin acceso a API, WebSocket, multimedia ni recursos protegidos; si tenía app instalada no recupera permisos.

# 7. CHAT — PRIMER MÓDULO Y PRIORIDAD DE CALIDAD

**Chat Android es 100 % nativo React Native/Expo y permanece así. Chat iPhone se presenta mediante React PWA.** Ambos comparten Worker, D1, WebSockets, contratos, permisos y sincronización, pero no la implementación de sus globos o gestos. Ningún cambio en otras pantallas PWA sustituirá el Chat nativo de Android.

## 7.1 Chat de texto y comportamiento

- Mensajes en la conversación privada grupal del equipo, timestamp de servidor, nombre del remitente, orden estable e historial paginado.
- Texto local inmediato; estado `en cola`, `enviando`, `enviado`, `error`, reintento con el mismo ID.
- Cola offline persistente, reconciliación FIFO, deduplicación; no perder borradores al cambiar de sección, suspender app ni actualizar estilos.
- Respuesta a mensaje original con preview, incluso cuando original haya sido eliminado; navegación al mensaje si existe.
- Edición y borrado de mensaje propio con permisos en Worker, sincronizados a los dos equipos; tombstone mantiene secuencia y referencias.
- Reacciones actuales **❤️ 😂 👍**, con posibilidad de ampliar solo tras adaptar contrato y base de datos.
- Presencia (sockets) y “escribiendo” efímeros; separar del estado de recepción del push.
- Búsqueda en historial, scroll consistente, botón volver al final, lectura/no leído.
- Reconexión automática al retornar de background, cambiar Wi-Fi/datos o volver a abrir. No depender de “Reconectar” como requisito habitual.

## 7.2 Interfaz del Chat

- **Pulsación prolongada:** barra contextual de emojis junto a la burbuja, con acciones textuales **Borrar** y **Editar** donde correspondan. No mostrar botones fijos bajo cada mensaje.
- **Deslizar hacia la derecha:** responder al mensaje, con gesto fluido y sin conflicto con scroll vertical.
- Burbujas claras, buena tipografía, menú que se ajusta a bordes, teclado que no tapa el campo de entrada, sin saltos de cursor.
- El overlay se ancla a la burbuja en pantalla; no dejarlo flotando en el centro por aproximación.
- Video/foto/audio y visualizador se desarrollan en sus fases; permitir regresar desde fullscreen al Chat correcto con historial y scroll preservados.

## 7.3 CHAT 1–11: secuencia de producto

1. **CHAT 1 · Texto:** envío/recepción, orden, D1, WebSocket y ambos dispositivos. Base aprobada por el usuario durante pruebas previas; mantener regresiones.
2. **CHAT 2 · Estados y reconexión:** cola offline, reintento, persistencia y vuelta automática. Implementado; completar pruebas de proceso forzado y red.
3. **CHAT 3 · Respuestas:** preview, gesto, referencia al original y mensajes borrados. Implementado; validar el gesto por separado en Chat Android nativo y Chat PWA iPhone.
4. **CHAT 4 · Reacciones, edición y borrado:** backend y UI inicial operativos; cerrar overlay WhatsApp-like, límites de permisos, sincronización y QA física.
5. **CHAT 5 · Presencia y typing:** existe funcionalidad; validar condiciones con pantalla bloqueada y no confundir conexión con notificación.
6. **CHAT 6 · Fotografías:** almacenamiento privado con límite real cero pesos, selector, compresión, miniaturas, viewer, progreso, retry y confidencialidad. No está disponible para envío real.
7. **CHAT 7 · Videos:** poster, duración, selector, reproducción, red lenta, subida controlada, fullscreen y volver al punto anterior. No disponible.
8. **CHAT 8 · Audio:** grabación, duración, envío, pausa/reproducir, subida y retry. No disponible.
9. **CHAT 9 · Viewer y gestos multimedia:** foto/video fullscreen, zoom pellizco, swipe, navegación y retorno fiable. No cerrado.
10. **CHAT 10 · Push:** FCM Android, Web Push iPhone, rutas profundas, permisos, duplicados y app cerrada/bloqueada. No implementado de extremo a extremo.
11. **CHAT 11 · Pulido final:** animaciones, agrupación, scroll, grandes historiales, tiempos y accesibilidad. Solo al finalizar estabilidad.

**Puerta de cierre:** la fase no está concluida por compilar o por un simulador. Requiere Chat **React Native en Android** y Chat **PWA en iPhone**, sincronizados y confirmados físicamente cuando aplique. La WebView Android se reserva exclusivamente para pantallas no-Chat.

# 8. ARCHIVOS Y MULTIMEDIA — COSTO CERO

**Cloudflare R2 permanece DESCARTADO** mientras implique suscripción, alta de facturación, tarjeta o cobros automáticos por excedentes.

## 8.1 Arquitectura de almacenamiento elegida

Para fotos privadas del Chat, la arquitectura final seleccionada es:

```text
PWA de Chat (Android/iPhone)
        ↓
Worker HAVANA NICE V2 autentica usuario y mensaje
        ↓
Binding privado y servicio backend-a-backend
        ↓
HAVANA CLOUD delega acceso a Google Drive existente
        ↓
Carpeta/área EXCLUSIVA de archivos de CHAT V2
        ↓
Metadatos, permisos, cuotas y referencias en D1 V2
```

Solo HAVANA CLOUD administra Google OAuth y sus tokens existentes; V2 no expone ni copia refresh tokens, cookies ni contraseñas. El Chat debe quedar completamente separado del catálogo y galería de HAVANA CLOUD: ni indexación de sus originales ni inclusión accidental de archivos de Chat en la galería. No se modifica la nube de producción sin autorización explícita para una integración probada y aislada.

El laboratorio del puente en el repositorio de HAVANA CLOUD existe como trabajo experimental, deshabilitado y sin subida de archivos. El cliente V2 `havana-cloud-bridge-client.js` es preparación, no función activa. El antiguo adaptador independiente `drive-media.js` permanece **apagado y congelado** hasta reemplazarse ordenadamente por el bridge privado; no instalar dos rutas de Google OAuth.

Para fotos: compresión local, validación de MIME real, control de tamaño, thumbnails, cuota por usuario/total, cancelación, acceso solo autenticado, rechazo seguro al llegar al límite gratuito, limpieza de archivos huérfanos. El límite de prototipo documentado es **640 KiB por imagen y 64 MiB de biblioteca**, sujeto a revisar cuando exista integración real; no prometer ilimitado.

Para video/audio: no usar D1 como almacén de originales grandes; evaluar streaming y cuotas, y si el sistema no puede garantizar cero cobros, mantener esa capacidad cerrada hasta encontrar una solución adecuada.

## 8.2 Estado real

- D1 V2 tiene las tablas de media y el código de preparación.
- Los endpoints de media sin credenciales responden 401; no hay subida privada habilitada.
- No existen permisos, bindings ni autorización final del bridge que permitan subir fotos desde V2.
- No afirmar que CHAT 6 funciona por la presencia de archivos o tablas.
- HAVANA CLOUD original, sus cuentas, fotos y catálogos permanecen fuera de alcance de las limpiezas de V2.

# 9. NOTIFICACIONES Y SERVICIOS DE SEGUNDO PLANO

- **Android:** FCM y componentes nativos para permisos/canales, recepción de notificaciones, apertura de ruta, Chat nativo, cola/cache de Chat, multimedia y servicios fuera de WebView. El push al Chat abre directamente el módulo React Native y preserva navegación.
- **iPhone PWA:** Web Push donde el SO lo permite, particularmente con la PWA instalada según requisitos del sistema. Abrir la ruta correcta al tocar notificación.
- **Servidor:** un evento de negocio y una sola decisión de quién debe recibir push; no duplicar por cada cliente. No mandar push duplicado cuando la conversación ya está activa cuando pueda verificarse.
- **Estado actual:** push no validado ni desplegado integralmente en V2; jamás declarar que funciona con app cerrada antes de medirlo en teléfonos reales.
- Una WebView **no sustituye automáticamente** un servicio nativo de background: permisos, ejecución y restricciones de batería siguen siendo responsabilidad Android.

# 10. RESTO DE LA APP — MISMA PWA VISUAL

**Excepto el Chat**, los módulos de esta sección comparten la misma interfaz visual PWA en Android WebView y en iPhone. Android no duplica su UI en React Native. Todas las operaciones de negocio siguen compartiendo Worker/D1.

## 10.1 Home y navegación

Inicio inmediato desde shell/caché local, actualizaciones silenciosas, navegación interna por rutas, volver un nivel, estado de sesiones y prioridades por rol. Interfaz minimalista, clara y rápida.

## 10.2 Calendario de músicos

Eventos sincronizados en tiempo real, tarjetas legibles y detalles de llegar/vestuario/notas/llamadas/show/horario. El **horario es texto completamente libre**: admite `por definir`, símbolos o texto en lugar de imponer únicamente un reloj.

El repertorio propio de un evento aparece **dentro de su tarjeta de Calendario**, solo si fue generado. Abrir/cerrar acordeón, checklist y enlaces correspondientes. Los cambios de Admin llegan al músico sin instalación de APK.

## 10.3 Repertorio

Repertorio general y listas de evento, categorías visibles **ENGLISH** y **ESPAÑOL**, enlaces a videos junto a canciones cuando existan, búsqueda, sincronización, lectura offline razonable y estado de selección. No limitar artificialmente la cantidad de canciones por evento.

Para Admin: checklist con contador **hechas/total**, marcar, desmarcar, selección múltiple, canciones añadidas fuera del catálogo y reordenación drag-and-drop. Las listas por evento se crean automáticamente desde eventos o a solicitud; si no existen, no aparecen.

## 10.4 Notificaciones de información

Feed, tarjetas, texto/imagen/enlaces, leídas/no leídas, filtros y conexión con push. Las secciones Admin “Crear nueva notificación” y “Añadir evento” se presentan como paneles plegables en PWA.

## 10.5 Perfil y Familia HAVANA NICE

Perfil, imagen, portada e información de integrantes solamente cuando esté aprobado el alcance; no conectar ni mezclar datos con el proyecto **FAMILIA NOA**.

## 10.6 Ajustes

Cuenta, nombre, dispositivos aprobados, preferencias, permisos, diagnóstico, versión web/nativa, políticas de datos y cierre de sesión. Los ajustes visuales se publican en la PWA; acciones del SO se invocan por el puente.

# 11. ADMINISTRADOR V2

Administrador utiliza la **misma arquitectura** visual PWA y el mismo Worker, con rutas y permisos propios. No compartir una sesión de Admin con una sesión de músico sin autorización explícita.

Responsabilidades:

1. Crear/autorizar/desactivar nombres; gestionar dispositivos pendientes, activos, bloqueados y revocados.
2. Administración de calendario, destinatarios, shows, horarios y edición flexible.
3. Administración del repertorio general y repertorios por evento; sincronizar en vivo con las tarjetas de músico.
4. Crear notificaciones, gestionar Chat, contenidos y preferencias permitidas.
5. Consultar actividad, errores, diagnósticos, sincronización y cuotas sin revelar tokens.
6. Registro auditable de cambios sensibles y revocaciones.

**Prioridad de seguridad antes de invitar a todo el equipo:** aprobación de dispositivo, revocación de tokens y sockets, listado de dispositivos y permisos por rol. Los nombres sencillos continúan siendo la UX oficial, pero no se consideran por sí solos prueba fuerte de identidad.

# 12. CACHÉ, OFFLINE Y SINCRONIZACIÓN LOCAL

- **PWA iPhone y secciones WebView Android:** Service Worker cachea solo shell y assets públicos del mismo origen; nunca respuestas autenticadas ni APIs. IndexedDB almacena datos locales permitidos de los módulos PWA y el Chat web de iPhone. No borrar caché útil por cambiar colores.
- **Chat Android 100 % nativo:** SQLite/almacenamiento seguro, historial, borrador y cola offline; WebSocket React Native. El bridge coordina navegación y acceso a secciones PWA, sin iniciar un segundo motor de Chat Android ni duplicar datos.
- **Actualización PWA:** network-first para recursos cuando haya red, versión estable anterior como fallback, cache versionada, migraciones IndexedDB compatibles. No aplicar cambio que borre cola o reemplace pantalla mientras el músico escribe.
- **Chat offline en dos implementaciones:** Android Chat nativo y iPhone Chat PWA conservan el mismo ID de mensaje durante reintentos, FIFO, confirmación, deduplicación y errores. Cada plataforma usa almacenamiento apropiado, sin dos Chat simultáneos en un Android.
- **Conectividad:** sin internet se visualiza lo que se tiene; recuperación automática al volver la red; toda operación bloqueada por permisos se explica y nunca se reintenta indefinidamente.
- **Desinstalación:** sí destruye la caché y pendientes locales, incluso si los mensajes confirmados persisten en D1. **Evitar desinstalación** como método de actualización.

# 13. SEGURIDAD Y PRIVACIDAD

- Validación de permisos y propiedad de mensajes siempre en el Worker; SQL parametrizado.
- Credenciales impredecibles y revocables; identidad de músico validada contra allowlist y dispositivo aprobado.
- Un WebView remoto tiene superficie de riesgo: puente JS↔nativo con lista de operaciones y origen verificado, sin JavaScript arbitrario con privilegios.
- No guardar secretos de nube, OAuth, tokens administrativos o Cloudflare en assets, logs de CI, repositorio ni páginas.
- Exponer en iPhone y Android solamente los datos autorizados por rol.
- No permitir que cambiar un texto HTML desbloquee funciones nativas o permisos de servidor.
- Cifrado/almacenamiento protegido para sesiones Android; seguridad web equivalente razonable en PWA.
- No activar enlaces de multimedia públicos por conveniencia.
- Medir y limitar solicitudes de login, dispositivos y media; registrar acciones sensibles sin contenido privado innecesario.
- Separar infraestructura V2 de producción en todo momento.

# 14. COSTO Y LÍMITES

**0 MXN adicionales, sin excepción automática.** Antes de activar integraciones, verificar costos reales y límites actuales: Cloudflare Worker/CPU, D1 lecturas/escrituras/bytes, Durable Objects/WebSockets, Pages/Builds, notificaciones, Google Drive/cuotas y herramientas de CI.

- Sin R2 ni checkout habilitado para V2.
- Sin Workers Paid ni facturación variable.
- Sin cuentas Apple Developer de pago para esta etapa; iPhone usa PWA.
- Sin prometer fotografías/video sin límite ni disponibilidad garantizada sobre tiers gratis.
- Si se alcanza el máximo de cuota, mostrar error claro, suspender subidas nuevas y preservar los datos existentes.
- Cero gasto nuevo prevalece sobre características aspiracionales o rendimiento marginal.
- Optimizar compilaciones y duración de artefactos GitHub Actions; no generar APK por cada edición CSS.

# 15. CALIDAD, RENDIMIENTO Y PRUEBAS

Las medidas deben basarse en teléfonos reales. El usuario valora apertura rápida, escritura fluida y disponibilidad sin interrupciones.

**Indicadores a observar:** tiempo desde tocar icono hasta primera interfaz utilizable, tiempo hasta primer mensaje de caché, FPS/fluidez de scroll y gesto, latencia de escritura/teclado, latencia de ACK y recepción cruzada, recuperación tras cambio de red, uso de memoria, comportamiento con 100+ mensajes y consumo de datos.

Pruebas obligatorias por funcionalidad:

- Android WebView y iPhone PWA muestran las **mismas pantallas visuales de Home/Calendario/Repertorio/Admin**. El Chat Android debe ser **nativo** y tener paridad de funciones/estilo con el Chat web del iPhone.
- Android→iPhone e iPhone→Android; mensajes simultáneos y ausencia de duplicados.
- Cierre/reapertura, pantalla bloqueada, Wi-Fi↔datos, conexión lenta, modo avión, proceso Android reiniciado.
- Borradores y cola preservados al cambiar del Chat Android nativo a PWA WebView y viceversa; en iPhone preservados durante actualizaciones PWA.
- Long-press y swipe realmente funcionan en ambas plataformas; overlay contextual junto a la burbuja.
- Teclado Android e iPhone sin saltos ni tapar el composer; botón Atrás correcto.
- Reacciones/edición/borrado presentes tras sincronización y resync.
- Revocación de un usuario desde servidor impide leer y escribir, incluso si conserva la app.
- Push con app abierta, cerrada y bloqueada únicamente cuando su módulo exista.
- Media segura sin fuga a catálogo HAVANA CLOUD únicamente cuando se habilite.
- Actualización APK sobre una instalación existente preserva datos **con misma firma**; no forzar reinstalación.

Checks automáticos actuales: `v2-foundation-check.yml`, `audit:guard`, pruebas de media cerrado y protección de Service Worker, build PWA, export Android, tests de sesión/Worker y health. Complementarlos con pruebas de navegación Android nativa↔WebView, E2E de Chat Android React Native↔iPhone PWA y checks de versionado. **CI verde no equivale a prueba física completa.**

# 16. INTEGRACIÓN PROGRESIVA PWA VISUAL SIN TOCAR CHAT NATIVO

**Se conserva definitivamente el Chat Android en React Native.** No existe migración prevista de su interfaz a WebView. La evolución híbrida consiste únicamente en introducir pantallas PWA para el resto de los módulos, con navegación desde la APK existente.

### Etapa H1 — Conservar Chat Android y línea base

1. Verificar `com.havananice.v2`, firma, almacenamiento SQLite, sesión, cola y borradores de la APK que ya funciona.
2. Establecer prueba de regresión del Chat Android: escritura, botones, long-press, swipe reply, borrado, edición, WebSocket, reconexión, scroll y persistencia.
3. Preservar el Chat React Native; si se modulariza `App.tsx`, el cambio debe ser funcionalmente idéntico y reversible.
4. Confirmar en iPhone la paridad con Chat PWA y el mismo historial D1.

### Etapa H2 — Navegación híbrida y pantallas PWA

1. Incorporar componente WebView al Android Expo **manteniendo package ID, firma y datos**.
2. Crear ruta Chat nativa y rutas WebView para **Home, Calendario, Repertorio, Admin y demás vistas**, sin renderizar Chat PWA en Android.
3. Establecer navegación compartida: entrar desde Home a Chat abre React Native; regresar desde Chat devuelve a la sección correcta.
4. Incluir fallback local para módulos WebView sin internet; un fallo de red no debe impedir abrir el Chat nativo.
5. Validar seguridad de origen, permisos, actualización de diseño sin APK y botón Atrás.

### Etapa H3 — Identidad, sesión y bridge

1. Evitar que la PWA WebView vuelva a pedir nombre cuando Android ya recuerda una sesión válida. Diseñar sesión/autorización compartida de forma segura entre secciones, minimizando exposición de tokens y sin crear credenciales ocultas.
2. Mantener cola, SQLite y WebSocket del Chat React Native como instancia única de Chat en Android.
3. Usar el bridge exclusivamente para navegación, acciones del SO y contexto controlado; no usarlo para duplicar toda la API del Chat.
4. Probar revocación, reconexión y cambios de red con Chat y módulos WebView abiertos en secuencia.

### Etapa H4 — Interfaz PWA compartida de los demás módulos

1. Construir Home, Calendario, Repertorio, avisos, perfiles, Admin y ajustes visuales en `v2/apps/pwa/`.
2. La misma UI React se publica una sola vez para iPhone y WebView Android, sin repetir componentes en RN.
3. Comprobar actualizaciones visuales inmediatas al volver a abrir una pantalla y sin generar APK.
4. El Chat React Native Android y Chat PWA iPhone continúan como dos interfaces justificadas; medir rendimiento y compatibilidad continuamente.
5. Cuando esas vistas estén probadas, retirar **solo pantallas no-Chat RN obsoletas**. Nunca eliminar el Chat nativo ni sus módulos de gestos/almacenamiento.

### Etapa H5 — Servicios Android realmente nativos

FCM, notificaciones con app cerrada, almacenamiento protegido, cámara/archivos, multimedia, servicios y permisos se incorporan cuando se necesiten. Estos cambios sí requieren APK nuevas, agrupadas en actualizaciones planificadas. Cambios PWA de textos, colores o distribución de las otras vistas no requieren APK.

**Condición de finalización:** una APK Android con Chat 100 % nativo más el resto de pantallas PWA integradas; iPhone PWA con Chat propio y pantallas comunes; ambos usan la misma API/identidad, con cambios de interfaz web no disruptivos.

# 17. PLAN DE IMPLEMENTACIÓN DE MÓDULOS

La arquitectura decidida conserva el Chat Android nativo y permite incorporar pantallas PWA visuales sin duplicación:

1. **Fundación V2** — cerrada.
2. **Chat Android 100 % React Native y Chat iPhone PWA** — seguir corrigiendo y probando gestos, borrado, respuesta, reconexión y sincronización. No migrar Chat Android a WebView.
3. **H1 · Protección del Chat existente** — registrar firma, SQLite, sesión, borradores y cola; cerrar las regresiones pendientes.
4. **H2–H4 · Integrar WebView solo para módulos no-Chat** — navegación nativa↔PWA, diseño compartido Home/Calendario/Repertorio/Admin, sesión y permisos correctos.
5. **Control de acceso y Admin de dispositivos** — alta, aprobación, retirada, sesiones, revocación; servidor primero y pantalla Admin PWA después.
6. **Chat fotografías** — integrar desde Chat nativo Android y Chat PWA iPhone cuando exista almacenamiento privado 0 MXN.
7. **Chat video/audio/viewers** — capacidades nativas Android, web iPhone, servidor y cuotas compartidos.
8. **Notificaciones push** — FCM nativo Android y Web Push iPhone; sin duplicados.
9. **Home/Ajustes/Calendario/Repertorio/Notificaciones internas/Admin** — una única UI PWA compartida.
10. **QA y auditorías** — revisar seguridad, UI, rendimiento, ramas, compilaciones, limpieza y costo.
11. **Migración gradual desde HAVANA NICE actual**, únicamente después de aprobación física y respaldos, sin tocar producción.

Cada fase se valida Android→iPhone e iPhone→Android cuando aplica. **No se hace APK por un retoque de pantalla PWA**; las modificaciones propias del Chat Android o del sistema nativo sí requieren una actualización nativa.

# 18. ESTADO REAL VERIFICADO — 26 DE OCTUBRE DE 2026

## 18.1 Código y plataformas

- **Arquitectura elegida:** Chat Android 100 % React Native y Chat iPhone PWA; Home/Calendario/Repertorio/Admin y demás pantallas visuales PWA compartidas en Android WebView + iPhone. **La WebView de los módulos no-Chat aún no está integrada**; el Chat Android actual se conserva.
- Android hoy usa `v2/apps/android/App.tsx`, `SwipeableBubble.tsx` y `expo-sqlite/kv-store` para su Chat nativo. No eliminar, migrar a HTML ni desinstalar esta APK.
- iPhone usa `v2/apps/pwa/src/App.tsx` como Chat PWA; para módulos visuales futuros ese mismo proyecto React se reutilizará en Android WebView.
- El usuario confirmó el 26/10/2026 que la entrada por nombre quedó funcionando; seis nombres iniciales. El módulo Admin de dispositivos aún está pendiente.
- Chat texto, WebSockets, replies, reacciones, edición/borrado, búsqueda e historial existen en ambas implementaciones; long-press WhatsApp-like, swipe reply, reconexión y sincronización bidireccional requieren cierre de QA real.
- Fundación cerrada; problemas iniciales de Metro y handshake WebSocket ya corregidos. No volver a generar una APK debug que dependa de Metro.
- Fotos, video/audio, push, Home avanzado, Calendario, Repertorio y Admin de V2 permanecen pendientes de implementación completa. En Android Chat sigue nativo también cuando se añada multimedia.

## 18.2 Servidor

- Worker `havana-nice-v2-dev`, D1 V2 y Durable Object `ChatRoom` desplegados. El Worker controla autenticación, operaciones de Chat y sincronización; Pages PWA se publica en `havana-nice-v2-dev.pages.dev`.
- Migraciones D1 `0001`–`0008`; primera auditoría retiró un índice duplicado y 18 sesiones caducadas del laboratorio. En ese corte se conservaron 20 mensajes y seis miembros.
- Media: código y tablas preparadas pero upload apagado; sin R2 y sin bridge productivo HAVANA CLOUD.
- Registro de sesión por nombre con validación case-insensitive y revocación de token en backend probado por CI, **aprobación nueva de dispositivo pendiente**.

## 18.3 Última comprobación de compilaciones

- CI de Fundación/auditoría en SHA `7c29a4f900b8dc2955e9fb97d3e5bc74e9066e3a`: GitHub Actions `40284736856` **SUCCESS**.
- Build Android en ese mismo SHA: `40284736888` **SUCCESS**.
- Distribuidor de APK en ese mismo SHA: `40284736854` **SUCCESS**.
- PWA V2 se había desplegado correctamente en Cloudflare Pages. Git HEAD cambia al actualizar este documento; el estado de ejecución futuro debe verificarse nuevamente, no asumirse.
- Para las instalaciones Android existentes, conservar como versión de referencia confirmada por el usuario la APK de **acceso por nombre**, publicada en la rama binaria V2. Una APK posterior debe tener evidencia de firma, nombre, commit, SHA-256, disponibilidad HTTP 200 y prueba de actualización sin pérdida de datos.

## 18.4 Entrega de APK

Cuando un cambio nativo obligue a producir APK:

- Compilar `assembleRelease` con bundle JavaScript incorporado; verificar `apksigner`, identificador `com.havananice.v2`, versionCode, firma estable y contenido APK.
- Publicar exclusivamente en `havana-nice-v2-apk-downloads`, nunca en `main`.
- Entregar enlace externo directo HTTPS verificado, con texto **[Descarga directa alternativa]** y archivo APK real (sin navegación intermedia GitHub ni ZIP temporal).
- No desinstalar ni borrar datos para probar una nueva versión. Si hay incompatibilidad de firma, diagnosticar antes de recomendar acciones sobre el teléfono.
- Los cambios solo de la interfaz **PWA de módulos no-Chat** se publican por Pages y **no ejecutan un build nativo**. Cambios del Chat Android React Native necesitan una APK verificada.

# 19. AUDITORÍAS PREVENTIVAS Y LIMPIEZA DEL PROYECTO

La deuda técnica se combate desde el desarrollo. Revisión rápida semanal y auditoría profunda cada cuatro semanas o antes de cambiar de arquitectura/módulo principal.

### Auditoría 1 — 26/10/2026

Hallazgos y acciones documentados:

- Fuente V2 inicial: 45 archivos y ~0.83 MB en `v2/`; sin clon completo de producción dentro de esa carpeta. Los archivos añadidos posteriormente son pruebas, scripts de auditoría y migración.
- Repositorio compartido: muchas ramas históricas pertenecen a la aplicación actual. **No borrarlas** durante una limpieza V2.
- Rama de descargas: nueve APK iniciales (~617 MiB) antes de nuevas entregas. No borrar enlaces previamente dados; decidir una política de versiones/retención que no invalide respaldos.
- PWA: Service Worker corregido para **no cachear APIs ni respuestas de usuario**; cinco pruebas de regresión añadidas.
- D1: **18 sesiones vencidas eliminadas** y **índice extra en `chat_messages.seq` retirado**. Mensajes y miembros preservados.
- GitHub Actions: retención de artefactos Android reducida a **1 día**; distribuidor de APK validado por commit exacto y firma; nuevas compilaciones solo cuando cambia código que lo requiere. El historial de Git y binarios distribuidos no se borran sin una estrategia segura.
- README de V2 actualizado para indicar multimedia apagada, R2 descartado y push pendiente.
- Añadido `v2/scripts/audit-guard.mjs` a CI para evitar reintroducir clave temporal, caché privada, R2 y distribuidor con APK fija.
- Deuda pendiente: el Worker principal tiene un `// @ts-nocheck`; revisar tipos al refactorizar; modularizar lógica de clientes; añadir E2E WebView y dispositivos físicos; endurecer aprobaciones y credenciales.
- El prototipo OAuth independiente `drive-media.js` y el cliente del bridge HAVANA CLOUD quedan congelados hasta que una única integración sea segura. No borrar los esquemas sin analizar dependencias.

### Procedimiento permanente

1. Leer este plan y el HEAD de `havana-nice-v2-foundation`.
2. Identificar cambios desde la auditoría previa, pruebas verdes/rojas, errores y deuda acumulada.
3. Medir consumo, sesiones caducadas, índices duplicados, rutas/módulos obsoletos, llamadas redundantes, dependencias y tamaño de APK.
4. Confirmar por referencias/imports/uso real que un archivo o dato sobra antes de eliminarlo.
5. Mantener un punto de restauración y comprobar compatibilidad con PWA/Android existentes.
6. Depurar solo en V2, ejecutar regresiones, verificar Worker/Pages/APK y actualizar directamente esta sección.
7. No eliminar conversaciones, identidades, datos del personal, respaldos o descargas públicas sin autorización y prueba de que ya no se necesitan.

# 20. MODO DE TRABAJO Y LÍMITES DE ACTUACIÓN

**Modelo de entrega llave en mano:** el propietario pide el resultado y ChatGPT realiza, mediante las herramientas conectadas disponibles, diseño, edición del repositorio, tests, Cloudflare V2, diagnósticos y publicaciones permitidas. No enviar al propietario a editar código, SQL, Actions o DNS si puede realizarse directamente.

Solo se requiere intervención humana para instalación física, aprobación de OAuth/permisos personales y comprobaciones reales de dispositivos que las herramientas no puedan ejecutar. Nunca afirmar acciones hechas si no se verificaron.

Cada trabajo:

0. Distinguir siempre **Chat Android React Native**, **Chat iPhone PWA** y **módulos web compartidos**; no presentar la WebView como reemplazo del Chat Android.
1. Leer este Plan Maestro único y comprobar estado real en GitHub/Cloudflare.
2. Elegir una capacidad pequeña y vertical; preservar producción.
3. Preparar migraciones retrocompatibles si cambian esquemas/almacenamiento.
4. Implementar una sola solución reutilizable; verificar seguridad y 0 MXN.
5. Ejecutar pruebas de código, endpoint, PWA y, cuando corresponda, APK/bridge Android.
6. Actualizar una versión sin perder sesión, cola, historial ni formato de datos.
7. Obtener confirmación física de Android/iPhone cuando sea indispensable.
8. Consolidar los resultados **editando este mismo documento**, sin notas contradictorias, “planes alternos”, listas paralelas de decisiones ni anexos duplicados.

## Trabajo reciente de C01 (26/10/2026)

- Menú centrado: reemplazado por medición de posición real del globo en Android (`measureInWindow` en `SwipeableBubble.tsx`) y del elemento DOM de iPhone (`getBoundingClientRect` en `SwipeMessage.tsx`).
- Menú contextual muestra solo reacciones soportadas actualmente por backend y acciones reales. Eliminado el botón visual `+` que no enviaba ninguna operación; respuesta contextual disponible para mensajes propios/ajenos; Editar/Borrar visibles solo si autor y plazo/estado lo permiten.
- CSS corregido: el bloque `@media(max-width:380px)` estaba mal cerrado y encerraba reglas generales. La corrección aplica menú/gestos también a pantallas anchas.
- `audit:guard` actualizado para exigir posicionamiento contextual en ambos clientes y no reintroducir el botón sin función. Acepta tanto la descripción “R2 descartado” como “R2 desactivado”, evitando el falso fallo de CI.
- **Comprobado:** Foundation CI `40362440346`, build Android `40362440340` y distribución `40362440634` **SUCCESS** en SHA `d81267fe1219e271f15f31c2f40e3da42d410d5b`; binario `/HAVANA-NICE-V2-ANDROID-d81267fe1219.apk` disponible en `havana-nice-v2-apk-downloads`, directo HTTP 200. **Pendiente humano:** instalar encima SIN desinstalar, probar gestos en teléfono Android y Safari iPhone, confirmar conservación del acceso y borradores. Ningún cambio en `main`.

## Punto de continuación actual

**Continuamos con el Chat Android 100 % nativo y el Chat iPhone PWA**: terminar el menú WhatsApp-like, borrado, respuesta por gesto, reconexión automática y sincronización bidireccional. Paralelamente, preparar H1 y H2 para introducir **únicamente las pantallas no-Chat** como PWA dentro de la APK, conservando `com.havananice.v2`, firma y datos. Seguridad de nombres/dispositivos sigue como siguiente prioridad transversal.

**Regla inequívoca:** la PWA en Android proporciona Home, Calendario, Repertorio, Administrador y demás pantallas visuales; **no sustituye nunca el Chat React Native de Android**. La PWA de iPhone sí mantiene su propio Chat. Las decisiones previas contradictorias —Chat Android dentro de WebView, R2, clave temporal de laboratorio y APK para ajustes CSS— dejan de ser instrucciones vigentes; su historial puede consultarse en commits de Git.
