# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión del plan:** 2026-10-27 · arquitectura híbrida con Chat Android 100 % nativo  
**Estado:** Fundación cerrada; Chat Android React Native conservado como módulo 100 % nativo; Chat iPhone en PWA; integración de pantallas visuales PWA dentro de Android pendiente; seguridad, multimedia, push y módulos restantes por completar.  
**Rama de trabajo:** `havana-nice-v2-foundation` del repositorio `Abnernoa97/havana-nice-pwa`.  
**Producción protegida:** `main`, HAVANA NICE oficial, sus usuarios y Supabase, HAVANA CLOUD y los demás proyectos permanecen intactos.  
**Presupuesto obligatorio:** 0 MXN de costo adicional, sin productos de facturación automática.  
**Documento rector:** este es el único plan de arquitectura, tareas, estado y auditoría de V2. La historia de cambios se conserva en Git.

## ESTADO VIGENTE — AUDITORÍA CONTRA PLAN MAESTRO · 27/10/2026

**Una sola línea V2: fuente de código en `havana-nice-v2-foundation` dentro de `Abnernoa97/havana-nice-pwa`; `main` sigue siendo la aplicación ORIGINAL en producción y no debe recibir V2 por accidente.** No crear otro repositorio ni fusionar/desplegar V2 en `main` por iniciativa propia; para disponer algún día de un `main` exclusivo de V2 se necesitará una migración de repositorio/producción expresamente autorizada, con respaldo y verificación de las URLs. La rama `havana-nice-v2-apk-downloads` solo distribuye binarios, no desarrolla otra aplicación. Los checkpoints históricos no son versiones activas. Plan, datos y verificaciones usan una sola fuente de verdad.

**PRIORIDAD ACTUAL ORDENADA POR EL PROPIETARIO:** solamente **Administrador PWA → Acceso a músicos**. El Administrador crea y autoriza nombres en D1; el músico introduce únicamente uno de esos nombres y entra, sin que ningún nombre no registrado tenga acceso. Administrador también muestra la lista real, permite eliminar definitivamente con confirmación y abre el historial individual de accesos. **No desarrollar por ahora solicitudes/aprobaciones individuales de teléfonos, Chat administrativo, Calendario ni Repertorio**; mantener los futuros módulos visibles como estructura sin funciones activas. La mejora de identidad de dispositivo queda como seguridad posterior, sin confundirla con el primer control por nombres. **Conocer un nombre autorizado sigue permitiendo hacerse pasar por él en otro teléfono**: fase funcional inicial, NO seguridad de identidad completa, NO apta para distribución general al equipo sin aceptar ese riesgo.

**VERIFICADO POR EL PROPIETARIO:** capturas de Administrador autorizado y lista real; creación y eliminación del miembro de prueba `Pepe` confirmada por el propio Administrador, que vuelve a mostrar seis músicos. Los acordeones e iconos de papelera fueron publicados. La prueba física del historial de nuevos eventos, del cierre instantáneo en cada cliente conectado y del borrado integral en medios futuros aún está pendiente. **Android nativo 0.0.4 físicamente probado** sin pérdida de sesión/mensajes/reacciones; 0.0.5 compilado y distribuido pero NO probado físicamente. No reinstalar ni limpiar caché.

**INVENTARIO D1 (lectura directa 27/10/2026):** 6 músicos activos (Andy, Fer, Jali, Noa, Orly, Rafa); 10 sesiones de músicos vigentes; 45 mensajes, 9 reacciones, 6 confirmaciones de lectura; 2 solicitudes de dispositivo revocadas; 6 registros históricos `chat_pwa_first_claims`; 0 eventos de acceso registrados en `chat_access_events`; 0 archivos multimedia; **11 sesiones administrativas vigentes en el corte posterior** (antes eran 9; no son 11 administradores). La PWA incorpora el control para cerrar las otras sesiones bajo confirmación del propietario, pero **no se ha pulsado ni revocado ninguna por esta auditoría**. Anomalías de integridad/legado: **18 mensajes de autores sin miembro activo, 4 reacciones y 3 confirmaciones de lectura huérfanas**. Son candidatos a análisis/respaldo, NO órdenes de eliminación. Ninguna tabla de D1 ha sido eliminada en esta conciliación.

**DEPLOY VIGENTE:** Cloudflare Worker exclusivo `havana-nice-v2-dev` versión `54d761d5-2388-429a-b95c-1213f1651dac` al 100 %, rollback anterior `52a45179-b54f-42ae-9165-74453cc52e18`; mismo D1/DO, `HAVANA_ENV=development`, `V2_ADMIN_LOGIN_MODE=enabled` con secreto privado, `V2_DEVICE_APPROVAL_MODE=observe` heredado de las pruebas anteriores, **`enforce` DESACTIVADO**. Cloudflare Pages V2 publicó código Git `1347c7b364571a30454356bf96097e7df482c040`; GitHub Foundation workflow `40458814542` **SUCCESS** después del despliegue y la revisión del Administrador. El frontend Admin contiene los cinco módulos `Acceso a músicos, Chat, Repertorio, Calendario, Más`, pero solo el primero tiene funciones de administración. Mantener `observe` sin ampliar su uso y retirar su lógica experimental SOLO después de revisar clientes instalados y dependencias.

**AVANCE OFICIAL: 10/27 hitos CONFIRMADOS**, 17 abiertos. S01/S02/P04 permanecen ABIERTOS: tener una lista funcional y eliminar a Pepe no demuestra controles de identidad seguros, historial completo, borrado integral ni sincronización final. Evidencia histórica recuperable en commits y ejecuciones de CI; no volver a incorporar aquí estados antiguos como «actuales».

> **DECISIÓN ARQUITECTÓNICA DEFINITIVA — 26/10/2026:** **Chat Android es y seguirá siendo 100 % nativo (React Native/Expo)**: interfaz, escritura, teclado, burbujas, gestos, historial local, cola offline, WebSocket y multimedia cuando corresponda. **Chat en iPhone continúa como PWA**, porque no se distribuirá app iOS nativa de pago. **Home, Calendario, Repertorio, avisos, perfiles, ajustes visuales y Administrador** utilizan una sola **interfaz PWA React**, compartida entre iPhone y una WebView integrada en Android. El Android nativo conserva también permisos, notificaciones FCM, almacenamiento seguro, archivos, cámara, ciclo de vida y puente de integración. No transformar el Chat Android en WebView ni rehacer su código operativo. Se comparte la API, el backend y los contratos del Chat, no obligatoriamente sus componentes visuales. Los cambios puramente visuales de las pantallas PWA se publican sin APK; los cambios estructurales del Chat nativo requieren APK.

---

## 0A. UNA SOLA LÍNEA DE TRABAJO — ACUERDO DEFINITIVO 26/10/2026

**Una HAVANA NICE V2, un único Plan Maestro, un solo backend y una sola administración.** No copiar ni abrir versiones de la aplicación/planes en paralelo. Código fuente en `havana-nice-v2-foundation`; la rama `havana-nice-v2-apk-downloads` solamente almacena APKs compatibles, no otro proyecto. La historia Git se conserva para respaldo y recuperación. Jamás tocar `main` ni otros proyectos por este trabajo.

**Cada módulo se trabaja a la vez en tres superficies vinculadas y un mismo backend:** (A) **Android nativo** para el Chat completo (React Native) y para los permisos/puentes del sistema cuando sean necesarios en otros módulos; (B) **PWA de usuario**, Chat de iPhone y todas las demás pantallas compartidas, que Android consumirá por WebView sin duplicar las páginas; (C) **Administrador 100 % PWA**, SIEMPRE el mismo `/admin.html`, que incorpora por sección la gestión del módulo activo. Todos comparten contrato de API, Cloudflare Worker V2, D1, Durable Objects, roles, reglas de datos y QA. No crear repositorios, PWA o paneles nuevos para Calendario/Repertorio/Notificaciones.

**Secuencia vigente:** (1) **Acceso a músicos** desde el único Administrador: alta por nombre → autenticación PWA/Chat en backend → lectura/historial real → eliminación y expulsión probadas → limpieza segura de duplicados y datos residuales → QA. (2) Consolidación del Chat iPhone PWA y Android 100 % React Native, sin experimentar sobre la APK instalada. (3) Chat administrativo y funciones multimedia/notificaciones del Chat, con pruebas cruzadas. (4) Solo después Home, Calendario, Repertorio, Avisos y el resto, cada uno simultáneamente con su módulo correspondiente de Administrador. Las secciones futuras del Admin son placeholders, no implementaciones certificadas. Cualquier cambio de prioridades requerirá decisión explícita del propietario.

**Lo funcional tiene prioridad absoluta sobre lo visual:** mantener el Administrador limpio y sencillo; evitar rediseños constantes, colores y animaciones hasta que funcionen datos reales, roles, acciones, sincronización, caché y notificaciones. Cada nueva capacidad debe quedar conectada y validada en las superficies a las que corresponda, incluyendo CI y prueba física cuando se necesite, antes de marcarla terminada. Se mantiene exactamente el tablero oficial de **27 hitos**; este apartado define el método y no añade un segundo contador ni tareas duplicadas.

**PWA administradora instalable y con cambios continuos:** único enlace estable `https://havana-nice-v2-dev.pages.dev/admin.html`, manifiesto `/admin.webmanifest` con identidad independiente del Chat PWA, acceso directo instalable en Android/iPhone. Las nuevas publicaciones de Pages llegan a la **misma PWA instalada** al volver a abrirla o regresar a ella mediante comprobación de cambios en el bundle; no exigir reinstalación. Solo recursos estáticos pueden cachearse; **no cachear Admin HTML, credenciales ni respuestas privadas**. Con la aplicación totalmente cerrada no afirmar sincronización en segundo plano. Los cambios del Chat nativo requieren una APK nueva con versión, certificado y datos compatibles.

**Seguridad vinculante:** instalar una PWA no concede acceso administrativo. Paneles de músicos/dispositivos, aprobaciones y revocaciones solo pueden manejar datos mediante autenticación administrativa independiente con permisos reales en Worker; jamás insertar el secreto `V2_DEVICE_ADMIN_SECRET` en la PWA. El flag `V2_DEVICE_APPROVAL_MODE=enforce` sigue deshabilitado hasta que las sesiones antiguas estén protegidas y la migración esté probada.

**Una entrega vertical por capacidad:** requisitos → API/DB/permisos → PWA/Administrador donde corresponda → validación real → adaptación a React Native al cerrar la lógica → pruebas y preservación de datos → confirmación y tachado en este Plan Maestro. NO instalar una APK por cada experimento PWA. **El contrato detallado de sincronización y las funciones de administración se fijan en §11.1–11.4; no son un plan paralelo.** Quedan abiertos S01/S02/P04 hasta que funcionen realmente, no por existir una pantalla.

---


# 0. TABLERO DE AVANCE — CHECKLIST VIVA

**Actualizado:** 27 de octubre de 2026. **Avance certificado: 10 de 27 hitos**, 17 pendientes. Las cinco funciones de Chat de texto C01–C05 están aprobadas, pero no son el Chat completo. **Etapa activa: Acceso a músicos desde el Administrador PWA** con creación/validación de nombres, borrado, historial real, integridad D1 y consolidación de rutas. **Etapa siguiente:** sincronizar la misma lógica segura con Android React Native e iPhone PWA, completar seguridad y Chat, multimedia/push y QA. **Congelados** los módulos Home, Calendario, Repertorio, Avisos y la estética visual. El código nativo existente está protegido; no publicar APK nuevas mientras la mejora sea únicamente PWA/Worker. S01/S02/P04 permanecen abiertos por los controles y pruebas faltantes; no añadir otro tablero ni contabilizar subfunciones como hitos terminados.

**Cómo se usa:** `[x]` y texto tachado = terminado y confirmado; `[ ]` = todavía abierto. `EN REVISIÓN` significa que existe código o alguna prueba pero **no** está cerrado físicamente. Cuando el propietario confirme «ya quedó» y exista evidencia aplicable (CI, pruebas reales y control de regresión), cambiar **solo** la tarea correspondiente a `[x] ~~...~~` en este tablero, actualizar su evidencia y continuar. No marcar toda una fase por aprobar una captura aislada. Este tablero es la **lista única de progreso** y las secciones siguientes explican sus requisitos, sin crear planes paralelos.

## A. Base ya confirmada — 4/4

- [x] ~~**B01 · Fundación V2 aislada** — Android, iPhone PWA, Worker, D1 y WebSocket; se corrigió arranque Android sin Metro.~~ Confirmación del propietario el 24/10 y CI posteriores.
- [x] ~~**B02 · Chat básico de texto** — envío/recepción Android ↔ PWA, mensajes en vivo, teclado Android usable.~~ Confirmación física inicial el 25/10. No implica cierre del Chat avanzado.
- [x] ~~**B03 · Entrada por nombre persistente** — Orly, Andy, Jali, Rafa, Noa y Fer, sin distinguir mayúsculas; reapertura sin clave temporal.~~ Usuario confirmó «Ya quedó» el 26/10. **La aprobación segura de nuevos dispositivos sigue pendiente en S01.**
- [x] ~~**B04 · Auditoría preventiva #1** — corrección de caché PWA, limpieza de 18 sesiones vencidas, índice redundante D1 y controles de CI.~~ Ver sección 19. Auditorías futuras seguirán periódicamente.

## B. CHAT NATIVO ANDROID + CHAT PWA IPHONE — 5/5

- [x] ~~**C01 · Menú de interacción estilo WhatsApp** — pulsación prolongada junto a la burbuja, reacciones 👍 ❤️ 😂, Responder y botones Editar/Borrar con permisos; sin botón `+` inerte, sin franja duplicada, búsqueda plegable y teclado Android visible sobre la barra de escritura.~~ **Confirmado físicamente el 26/10/2026 a las 12:21 (CDMX):** capturas de ambos Chat muestran las tres acciones en mensajes propios recientes; APK Android `HAVANA-NICE-V2-ANDROID-b633676db5e1.apk` instalada sobre la existente y captura con `Escribe un mensaje` + `Enviar` sobre el teclado Android 16; el propietario confirmó «Ya quedó, seguimos». CI Android `40374961989` SUCCESS; distribución `40374961969` SUCCESS y enlace HTTP 200. **Nota:** C02 exige probar que las operaciones de edición/borrado realmente se apliquen y sincronicen entre ambos clientes; la aparición de botones no certifica C02.
- [x] ~~**C02 · Borrado y edición de mensajes** — editar/borrar mensajes propios dentro de los plazos de servidor; tombstones, permisos, sincronización y conservación del texto cuando falla Internet.~~ **QA física cerrada el 26/10/2026 a las 15:01 (Android nativo e iPhone PWA):** en ambos clientes, edición y borrado se sincronizan y mantienen su posición histórica; «Mensaje eliminado» se refleja en los dos. En PWA iPhone se verificó recuperación de edición tras desconexión, cierre/reapertura y reconexión. En Android, el propietario instaló APK `HAVANA-NICE-V2-ANDROID-bb1e8dd5ebd9.apk` y aportó dos capturas: la primera muestra «Editando mensaje», borrador «Prueba 2 editado por segunda vez, sin internet» y botón «Guardar» después de interrumpir Internet y reabrir; la segunda muestra **ese mismo mensaje editado** con hora original 14:58 y marca «editado», mientras el otro mensaje «Prueba 2» permanece independiente. El propietario confirma que cerró la app, restauró conexión y el cambio se aplicó sin crear mensaje nuevo. **Controles automáticos Foundation `40397166072`, APK `40397166053`, distribución `40397166136`: SUCCESS**. El Worker implementa verificación de autor, ventana de edición 15 min y borrado 48 h; no se realizaron pruebas manuales de abuso o de límite exacto, a cubrir en auditoría de seguridad S02/Q01. **No repetir pruebas físicas satisfactorias.**
- [x] ~~**C03 · Deslizar para responder** — gesto derecho sobre burbuja, preview «Respondiendo a…» junto al teclado y envío enlazado, sin bloquear scroll vertical ni disparar una respuesta al recorrer el historial.~~ **CONFIRMADO físicamente el 26/10 a las 14:13:** usuario recorrió rápidamente toda la conversación arriba/abajo sin activar Responder; al deslizar una burbuja de otro músico hacia la derecha, apareció «Respondiendo: Hola sin int» junto a la barra. Pruebas anteriores 13:03 confirmaron respuestas enlazadas y sincronizadas en Android e iPhone. **Nota separada, no forma parte de C03:** detectó que el Chat Android abría en medio del historial. Corrección de apertura posicionada en el mensaje más reciente, sin animación, se incorpora en código nativo en la próxima APK agrupada; requiere prueba física antes de dar el defecto por resuelto. El indicador «está escribiendo» movido junto al compositor está aprobado en PWA; Android pendiente de prueba tras esa misma actualización.
- [x] ~~**C04 · Reconexión y offline** — cola local persistente, borradores guardados, modo avión, reconexión tras bloqueo de pantalla y cierre completo, reapertura, cambio Wi-Fi/datos, entrega FIFO sin duplicados y restauración de historial.~~ **CONFIRMADO FÍSICAMENTE el 26/10/2026 a las 13:18:** el propietario probó un borrador no enviado, cerró por completo la app y volvió a abrirla: el borrador permaneció; cambió de red y siguió intacto. Después envió sin conexión, el mensaje quedó «en cola» y al reactivar Wi‑Fi se envió correctamente. **Evidencia anterior 13:06–13:14:** tanto la PWA iPhone como Android conservaron mensajes offline; Android retuvo dos mensajes tras bloqueo de pantalla, modo avión, retirada de recientes y cierre/reapertura completa; ambos aparecieron como «enviado · leído», en orden, sin duplicados visibles, al abrir la app con Internet. El propietario confirmó «todo está perfecto». **CI Foundation `40384165642`: SUCCESS.** El ajuste puramente visual para ocultar el número de usuarios conectados mientras figura «reconectando» está en el código `0b386a0c` y se incluye en el próximo paquete de APK; queda pendiente de comprobar en teléfono sin reabrir C04 funcional. No se certifica envío proactivo con la app totalmente cerrada: la entrega se observó al reabrirla con conexión.
- [x] ~~**C05 · Sincronización bidireccional completa** — Android Chat 100 % nativo ↔ iPhone PWA: mensajes simultáneos, edición y borrado sincronizados, respuestas enlazadas, reacciones ❤️ 😂 👍 y su retirada, recibos, historial, orden y sesiones restauradas.~~ **CONFIRMADO físicamente por el propietario el 26/10/2026:** envíos concurrentes visibles en ambos dispositivos prácticamente al mismo tiempo (13:21); edición y borrado correctos en ambos clientes (13:03 y 12:35), mensajes y recibos conservados; reacciones añadidas y retiradas en tiempo real desde ambos dispositivos (13:23–13:28); persistencia de reacciones y conversación después de cerrar y reabrir ambos chats, incluso entre días, confirmada a las 14:05 («Confirmado. Permanece incluso días»). La recuperación de cola y orden tras reconexión se había certificado en C04. **Alcance:** pruebas funcionales en los dos teléfonos del propietario, sin medición instrumental de latencia ni promesa de trabajo en segundo plano. No se toca `main`, producción, Worker ni D1.

**Puerta para tachar C01–C05:** CI y backend válidos cuando aplique **más prueba física específica**. No cerrar por existir código o APK publicada. Agrupar cambios de Chat Android y entregar una sola APK verificada, sin desinstalar la anterior.

## C. Android nativo + interfaz PWA para lo demás — 1/4

- [x] ~~**H01 · Proteger y congelar línea base del Chat Android 100 % nativo** — firma e identificador compatibles, versionCode creciente, SQLite/sesiones y datos preservados en una actualización real.~~ **CONFIRMADO 26/10/2026 a las 15:59 (CDMX).** La APK `HAVANA-NICE-V2-ANDROID-c4c5271786ad.apk` (versionName `0.0.3`, versionCode `3`, package `com.havananice.v2`) superó Foundation `40406690477`, Android APK `40406690470` y distribución `40406690506` con **SUCCESS**, descarga HTTP 200 e integridad SHA256 `de4422a30d51b34f2662a73fb2c7a394c4db78ca8847f6a3e1e19f1074183a1e`. El control de publicación compara firma pública del APK v2 anterior y nuevo, SHA256 de binarios, package ID y versionCode ascendente; se corrigió un falso rechazo del verificador mediante `v2/scripts/apk-signature-gate.py` sin saltar las comprobaciones. El propietario instaló la nueva APK **encima de la anterior** y confirmó explícitamente «Todo bien, todo se mantuvo bien» después de solicitarle verificar sesión, historial, mensajes, reacciones y funcionamiento. La caché/cola/borradores usan el almacenamiento preexistente `expo-sqlite/kv-store` con clave `havana-v2-chat-local-v1`; no se hizo migración destructiva. **Actualización adicional confirmada 26/10/2026, 19:36 (CDMX):** el propietario instaló Android `0.0.4` sobre `0.0.3`, sin volver a escribir su nombre, conservando conversaciones y emojis/reacciones. GitHub Actions build `40422055171`, distribución `40422055200` y foundation `40422685203`: **SUCCESS**. H01 permanece cerrado (sin incrementar el contador de hitos). **Límite de alcance:** H01 certifica la continuidad y actualización de la **línea de pruebas** del Chat, no que el proyecto tenga una firma privada de distribución general o credenciales cifradas. La APK continúa firmada con certificado Android Debug y la seguridad de credenciales/dispositivos se mantiene **abierta en S01/S02**, con endurecimiento de lanzamiento a completar antes de Q02. No cambiar la firma ni pedir desinstalar sin migración segura.
- [ ] **H02 · WebView de secciones NO-Chat.** Android abre Home/Calendario/Repertorio/Admin como PWA; al pulsar Chat cambia al **Chat React Native**, sin Chat PWA oculto en Android. **Preparación independiente 26/10/2026 durante CI H01:** se crea entrada visual PWA separada `/visual.html` con bundle React propio (`VisualApp.tsx`), navegación local funcional Inicio/Calendario/Repertorio/Avisos/Ajustes/Administración y estilo adaptable a teléfono; Home ofrece tarjetas que abren sus módulos. Por diseño NO carga el Chat PWA ni WebSockets, NO publica información privada, NO simula eventos ni cancela la compilación Android. Todos los módulos muestran explícitamente «en preparación» hasta estar respaldados por endpoints y permisos. Vite construye `index.html` (Chat iPhone existente) y `visual.html` como entradas distintas. Service Worker tiene fallback estático distinto para evitar que una WebView destinada a módulos muestre el Chat durante offline, con prueba de regresión. **Aún no integra WebView nativa, sesión compartida ni datos reales; H02 continúa abierto.** **Entrega CI / despliegue 26/10 15:27:** foundation check `40404526917` del commit `8f7d92cf` **SUCCESS** (incluye TypeScript, prueba del Service Worker y build PWA); Cloudflare Pages confirmó deployment de producción del mismo SHA con estado **success**, accesible como **vista preliminar** en `https://havana-nice-v2-dev.pages.dev/visual.html`. No hay datos ficticios ni operaciones administrativas expuestas. **No se ha integrado la WebView Android aún**, la PWA de Chat sigue en su ruta `/`, y H02/P01 NO se tachan. **Especificación visual aportada por el propietario el 26/10/2026:** tras cerrar H01, reconstruir el Home siguiendo **desde la primera versión** la estructura actual de HAVANA NICE oficial (fotografía de referencia), en este orden exacto: **01 Calendario de eventos; 02 Repertorio; 03 Notificaciones; 04 Familia HAVANA NICE; 05 Chat de información**, con bienvenida y perfil superiores y opciones inferiores según la referencia. No priorizar colores ni pequeños detalles aún. En Android, el acceso «Chat de información» abre React Native nativo (no web), y en iPhone abre Chat PWA. **No modificar el prototipo visual mientras se resuelve H01; la vista preliminar anterior no es la estructura aprobada.**
- [ ] **H03 · Navegación y sesión coordinadas.** Compartir identidad de forma protegida, sin segundo login, botón Atrás por nivel, sin pantallas blancas offline ni sesiones duplicadas.
- [ ] **H04 · Cambios visuales PWA sin APK.** Confirmar con prueba real que texto/color/estructura de Home/Repertorio/Admin se actualizan en Android WebView e iPhone PWA sin reinstalar.

## D. Seguridad y Administración de accesos — 0/2

- [ ] **S01 · Alta y autorización de músicos; controles adicionales de dispositivos en una fase posterior.** **CONFIRMADO PARCIALMENTE:** desde una PWA Admin con sesión autenticada el propietario crea un nombre en `chat_members`, lo visualiza junto a los demás y el cliente Chat solo acepta nombres activos existentes en D1; alta y borrado de `Pepe` probados físicamente. También existe código experimental antiguo de solicitud de dispositivos, pero no debe competir con el flujo principal por nombre. **AÚN PENDIENTE:** confirmar bloqueos de nombres no autorizados en ambas plataformas, evitar suplantación por nombre cuando se distribuya al equipo, definir si más adelante se exigirá aprobación de segundo teléfono, completar eliminación integral y QA del flujo tras cierre/reapertura. `V2_DEVICE_APPROVAL_MODE=observe` sigue configurado por motivos históricos; `enforce` PROHIBIDO mientras no haya un diseño cerrado y pruebas nativas. No marcar S01 cerrado.

- [ ] **S02 · Revocación, historial y sesiones seguras.** **CONFIRMADO PARCIALMENTE:** Worker verifica sesión/músico activo, conserva hashes en D1, el Administrador inicia sesión por su propia credencial, alta/borrado de nombre está protegida, y el borrado de miembro intenta expulsar sus WebSockets por Durable Object. El historial individual `chat_access_events` registra login/conexión/desconexión a partir del despliegue, sin reconstruir fechas ni modelos antiguos. **PENDIENTE:** prueba física de expulsión inmediata con dos clientes, revocación de credenciales en todas las rutas, limpieza de medios remotos futuros, distinguir apertura/conexión/entrada, rotación y almacenamiento protegido de tokens, manejo seguro del refresco PWA Admin, limitar las 9 sesiones administrativas vigentes y eliminar caminos alternos de ingreso. Conocer el nombre NO demuestra identidad. No marcar S02 cerrado.

## E. Chat multimedia y avisos del sistema — 0/5

- [ ] **M01 · Fotografías privadas.** Selector, compresión, miniatura, progreso y envío cruzado; puente HAVANA CLOUD→Drive con separación absoluta de galería y costo 0 MXN probado. **Aún apagado.**
- [ ] **M02 · Video.** Subida controlada, poster/duración, reproducción fluida y vuelta al Chat; cuota gratuita verificada.
- [ ] **M03 · Audio.** Grabación, envío y reproducción Android nativo ↔ iPhone PWA.
- [ ] **M04 · Visor multimedia.** Foto/video fullscreen, zoom, gestos, Atrás y conservación de posición del Chat.
- [ ] **M05 · Push real.** Android FCM nativo e iPhone Web Push, con app cerrada/bloqueada y navegación al Chat correcto.

### Puerta de calidad del Chat de información — decisión vinculante de desarrollo

**Definición operativa de “Chat 100 % aprobado” (no equivale a promesa de cero defectos absolutos):**

1. **C01–C05 (5/5):** mensajería de texto, menús, responder, editar/borrar, cola offline y sincronización Android nativo ↔ iPhone PWA; ya confirmados. No repetir pruebas exitosas salvo regresión concreta.
2. **H01:** APK con paquete y firma compatibles, versionCode creciente, actualización sobre instalada, respaldo razonable y datos locales conservados tras reinicio y actualización. El Chat Android no se sustituye por WebView. Verificar en el teléfono la APK posterior al bloqueo de distribución y nunca recomendar desinstalar.
3. **S01/S02 (2 abiertos):** alta/aprobación real de dispositivo con roles del servidor, expulsión y revocación, sesiones protegidas, autorización de WebSocket y API, rotación/renovación de credenciales, límites y almacenamiento seguro. Evitar que solo el nombre conceda acceso a un tercero. Panel visual de administración completo seguirá en P04, pero el **control seguro indispensable del Chat** debe funcionar antes.
4. **M01–M05 (5 abiertos):** selección/compresión/envío y recepción de fotos, videos y audios; miniaturas, reproducción, visor, zoom, navegación; notificaciones Android FCM e iPhone Web Push con aplicación cerrada y teléfono bloqueado. Probar archivos inválidos, límites, reintentos, desconexión, permisos y privacidad. **Costo incremental 0 MXN documentado antes de habilitar almacenamiento**; no activar R2, ni tocar HAVANA CLOUD o proveedores ajenos sin autorización específica.
5. **QA final del Chat (subconjunto de Q01, sin tachar anticipadamente Q01):** dos plataformas y varios usuarios/dispositivos, conexión estable/intermitente, bloqueo, cierre forzoso, orden/no duplicados, sesiones revocadas, fondos, memoria/latencia, límites de edición/borrado, adjuntos y push reales; pruebas de regresión y datos intactos durante actualización. Documentar bugs abiertos y resolver los críticos antes de que el propietario apruebe la etapa.
6. **Criterio de salto a interfaz inicial:** solo tras implementación, CI y pruebas físicas de los puntos anteriores y aceptación explícita del propietario. Luego construir desde la **primera versión funcional** el Home estructurado como HAVANA NICE original: Calendario, Repertorio, Notificaciones, Familia HAVANA NICE y Chat de información. Android llama directamente al Chat nativo; iPhone al Chat PWA. El prototipo `/visual.html` queda congelado hasta entonces.

**Este bloque define la secuencia y evidencia de aprobación; no agrega ni tacha hitos adicionales al tablero oficial de 27.**

## F. Pantallas PWA compartidas — 0/5

- [ ] **P01 · Home, navegación y Ajustes visuales.** PWA única dentro de Android WebView y PWA iPhone. **Primer código de interfaz compartida:** shell de Inicio y navegación en `/visual.html` creado; pendiente integración, sesión segura y QA móvil. No marcar completado.
- [ ] **P02 · Calendario.** Eventos, destinatarios, horario de texto libre, Llegar/Vestuario/Notas/Llamadas/Show y repertorio dentro de tarjeta de evento.
- [ ] **P03 · Repertorio.** General + por evento, checklist, contador, enlaces, canciones nuevas, selección múltiple y reordenación Admin.
- [ ] **P04 · Administrador completo.** PWA única `/admin.html` con navegación visible **Acceso a músicos / Chat / Repertorio / Calendario / Más**. Solo **Acceso a músicos** tiene funciones activas y conectadas: autenticación Admin independiente, crear nombres, lista privada desde D1, papelera con confirmación, historial desplegable y sincronización por eventos. El propietario creó y eliminó el miembro de prueba `Pepe` y comprobó que la lista volvió a seis integrantes. **Pendientes antes de cerrar P04:** pruebas físicas de historial/expulsión/integridad, protección contra recargas automáticas que pierdan sesión/formulario, QA de permisos, integración segura con Android y restantes módulos de administración que aún están expresamente congelados. No certificar P04 completo por las capturas actuales. La PWA se publica sin reinstalar; el Chat Android sigue React Native.

- [ ] **P05 · Avisos, perfiles y módulos de información.** Leído/no leído, enlaces, preferencias e integración sin duplicar pantallas.

## G. Cierre de proyecto — 0/2

- [ ] **Q01 · QA integral / auditoría final.** Seguridad, costo 0, rendimiento, pruebas multiusuario, actualizaciones APK sobre instalada, offline, no duplicados y respaldo; sin regresiones Android/iPhone.
- [ ] **Q02 · Transición gradual desde HAVANA NICE actual.** Únicamente con aprobación expresa y backups, sin romper producción ni perder datos del equipo.

**Reglas de mantenimiento del tablero:** cada confirmación se tacha aquí con fecha/evidencia, se revisan contadores de hitos, y se conserva §main§/producción y HAVANA CLOUD. No eliminar tareas porque aún no estén implementadas; se tachan al cerrarlas o se sustituyen solo por una decisión explícita. Prioridad inmediata: **S01/S02 → M01/M02/M03/M04/M05 → QA específica del Chat**, y **solo después H02/H03/H04 y P01–P05**, manteniendo Chat Android 100 % nativo y los hitos C01–C05 cerrados.

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

# 6. IDENTIDAD Y ACCESO DE MÚSICOS — LÓGICA VIGENTE

**Etapa 1 aprobada por el propietario — nombre creado por el Administrador:**
1. Solo una sesión **administrativa auténtica** crea `display_name` y la identidad normalizada `username` en `chat_members` mediante API privada y D1; nadie puede registrarse desde la PWA de músico.
2. El músico escribe **exactamente uno de los nombres ya autorizados**; el Worker busca `active=1`. Mayúsculas/minúsculas y acentos se normalizan de forma consistente, evitando dos usuarios por variantes del mismo nombre.
3. El Chat conserva localmente su sesión y entra sin repetir nombre cuando sigue vigente; Android es React Native y iPhone PWA.
4. En Admin se puede añadir nombre, consultar lista/historial de acceso desde D1 y eliminar con confirmación explícita; el servidor revoca sesiones y conexiones, sin depender de esconder botones.
5. Módulos Chat/Repertorio/Calendario permanecen visibles en el único Admin, **pero inactivos hasta su turno**.

La lista existente de seis músicos se conserva. El miembro de prueba `Pepe` se creó y eliminó; no recrearlo automáticamente. No almacenar una lista de permisos en el frontend ni crear un segundo backend.

**Limitación que NO debemos ocultar:** en esta etapa un tercero que conozca un nombre ya autorizado puede intentar entrar como esa persona. Es el comportamiento solicitado **por ahora**, no una verificación robusta de identidad ni un sistema listo para uso general. S01/S02 quedan abiertos y una evolución futura hacia controles de dispositivo/credenciales individuales requiere la aprobación del propietario, diseño único y QA real Android/iPhone. El código y tablas históricos de `observe` / primera reclamación de PWA no representan la lógica vigente; no activar `enforce` ni borrarlos en caliente hasta analizar referencias y los clientes instalados.

**Historial real:** un registro nuevo es cada inicio de sesión; conectar o desconectar WebSocket son eventos distintos. Mostrar fecha/hora, cliente, sistema operativo y modelo **solo si la aplicación/navegador aportan esos datos**; no inventar información anterior al despliegue. «Credenciales vigentes», «personas conectadas» y «entradas» son indicadores diferentes.

**Eliminación integral:** confirmar el objetivo por nombre; retirar en una operación atómica D1 sesiones, solicitudes y registros del músico, reacciones/mensajes propios/recibos relacionados, y avisar por DO a sus sockets activos. Preservar los datos de otros músicos. Si más tarde existe almacenamiento real de fotos/audio/video, borrar también referencias, objetos remotos y cuota sin dejar huérfanos. Evitar afirmar borrado instantáneo de cachés locales de dispositivos totalmente desconectados; el rechazo de servidor debe hacerse efectivo al reconectar.

**Roles:** Administrador gestiona autorizaciones; músico accede a sus recursos permitidos; eliminado/revocado no puede autenticar APIs ni WebSockets. El Administrador nunca comparte su contraseña con los músicos.

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

# 11. ADMINISTRADOR V2 — CENTRO DE CONTROL Y SINCRONIZACIÓN CON MÚSICOS

**Decisión confirmada el 26/10/2026, tras auditoría de solo lectura de HAVANA NICE original:** conservar como **referencia funcional positiva** su administración unificada, el inicio de sesión independiente, el inventario y autorización de teléfonos, el calendario con destinatarios, el repertorio y las notificaciones con actualizaciones en vivo. Implementar esas **capacidades** de forma nativa a la arquitectura aprobada de V2; **no copiar código heredado, permisos anónimos, datos, sesiones ni debilidades de seguridad**, ni conectar V2 a la base Supabase de producción. Original permanece totalmente intocable. La auditoría no equivale a certificación de que estas funciones estén terminadas en V2.

**Administrador único:** siempre la PWA instalable `/admin.html`, en el mismo repositorio, la misma rama de desarrollo, el **mismo Worker V2 + D1 + Durable Objects/WebSockets** y contratos del músico. Su sesión, pantallas y permisos son independientes de las sesiones del Chat. Cada módulo se entrega como una única operación vertical **backend ↔ Chat Android nativo/PWA iPhone o pantalla PWA compartida ↔ Administrador PWA**, sin paneles, bases o implementaciones paralelos.

## 11.1 Identidad administrativa y permisos (S02 + P04)

- **Inicio de sesión de Administrador independiente del músico:** identidad administrativa verificable por el **servidor** antes de cualquier lectura o acción privada. El nombre de un músico, una PWA instalada o una sesión del Chat nunca conceden privilegios administrativos.
- Mantener el flujo V2 de acceso administrativo protegido, sesión temporal, revocación/cierre y verificación de cada petición en Worker/D1. **No guardar tokens administrativos en localStorage/IndexedDB ni incluir secretos en frontend, GitHub o documentación.** Alta inicial del administrador exclusivamente mediante procedimiento seguro y autorizado; jamás eludir las restricciones del conector Cloudflare.
- Separar permisos por operación: músico consulta solo sus datos autorizados; administrador ve o cambia solo aquello que su rol permite; revocación o inactividad se hace efectiva en API y conexiones. Mantener registro auditable de decisiones sensibles (qué se hizo, a qué cuenta/dispositivo, cuándo y resultado) sin exponer credenciales.
- **No replicar** las políticas de lectura anónima de Chat/calendario detectadas en la aplicación original ni su autorización automática del primer teléfono. **Etapa vigente:** escribir un nombre creado por el Administrador permite entrar; aún NO valida que esa persona sea el titular. La futura comprobación real del dispositivo es requisito de seguridad de S01/S02 antes de ampliar el acceso general, no un bloqueo ya habilitado.

## 11.2 Acceso a músicos: alta, eliminación e historial; control de dispositivos posterior (S01/S02 + P04)

- **Vista real actual:** lista de integrantes desde D1, recuadro `Añadir miembro`, estado Activo, icono de papelera junto a Activo y acordeón por nombre. Todo detrás de sesión admin verificada, nunca público.
- **Crear:** autorizar cualquier nombre válido de músico desde Admin; normalización consistente y unicidad en D1, sin autorrregistro. El nombre autorizado es el contrato de entrada **de esta primera etapa**.
- **Eliminar:** confirmación irreversible del nombre exacto, borrado de sus credenciales y datos relacionados con comprobación de integridad, notificación realtime y expulsión de sockets; preservar datos de los otros músicos. La prueba con `Pepe` mostró el resultado en Admin; la QA de todos los efectos laterales continúa ABIERTA.
- **Historial por músico:** datos directamente de `chat_access_events`, contador de eventos `login`, lista de `login/connect/disconnect`, fecha/hora, cliente, SO y modelo si se recibe legítimamente. Antes de tener eventos reales mostrar `Sin historial registrado`. La detección por user-agent puede ser parcial/inexacta; no presentar modelo estimado como verificado.
- **Puntos de QA obligatorios:** cliente activo expulsado en vivo, reentrada bloqueada cuando el nombre desaparece de D1, historial al entrar/desconectar/reabrir, cobertura de archivos multimedia futuros, sesiones administrativas duplicadas, y reciclaje seguro de datos de prueba con respaldo.
- **Más adelante y solo tras nueva decisión:** solicitudes individuales `pending/approved/denied/revoked`, pruebas de solicitud/canje/revocación por teléfono, migración de Android y PWA sin pérdida y `enforce`. El prototipo anterior no es base del flujo operativo actual ni se debe ampliar por inercia.

## 11.3 Sincronización operativa de Administrador ↔ aplicaciones de músicos

**Regla obligatoria para todos los módulos:** lo que se autoriza, crea, edita, asigna, desactiva o revoca desde el Administrador se valida en el **mismo Worker**, se confirma en la **misma D1 V2** y se notifica por un canal realtime autenticado del backend a los clientes afectados; Android, iPhone y Administrador reconcilian el estado real. No hay tres copias de negocio ni tres fuentes de verdad.

**Situación vigente 27/10/2026:** la sesión Admin se autenticó físicamente y la lista de seis miembros se comprobó en la PWA. Las operaciones de alta y borrado están conectadas con el mismo Worker/D1 y se probó añadir y borrar a `Pepe`. El canal `admin.invalidate` puede refrescar `members`; verificar también comportamiento con dos pantallas, expulsión y reconexión. Los antiguos eventos `requests` proceden de pruebas de teléfonos que dejamos congeladas; no son la prioridad del producto ni están plenamente integradas con la nueva pantalla. Evitar hablar como si faltara configurar el login Admin, que ya está activo. No cerrar S01/S02/P04 sin pruebas finales.

- **Administrador en tiempo real, sin depender del botón «Actualizar».** Suscripciones autenticadas a cambios relevantes del Chat, músicos, dispositivos, solicitudes y módulos futuros; al recibir eventos, refrescar solo lo necesario, con orden e idempotencia. Al reconectar, abrir o volver del segundo plano, recuperar cambios perdidos consultando al servidor. El botón manual queda únicamente como respaldo/diagnóstico, no como mecanismo principal.
- **Calendario:** crear/editar/cancelar eventos y asignar **destinatarios concretos** desde el Administrador. Cada músico recibe/consulta solo eventos y cambios que le correspondan, con horarios como **texto libre**, detalles y repertorio del evento en su tarjeta. Sin duplicar el calendario por plataforma.
- **Repertorio:** gestión central del catálogo general y listas de evento desde Administrador; cambios de canciones, categorías, enlaces, orden, asignaciones y checklist se sincronizan con las pantallas de músicos autorizados, incluso tras desconexión o reapertura. Mantener reglas por evento y no mostrar listas inexistentes.
- **Notificaciones:** el Administrador crea avisos dirigidos a todos o a destinatarios autorizados. **Un solo evento/identificador de notificación en backend** alimenta feed, leídas/no leídas y push Android nativo/iPhone PWA según permisos y capacidades reales; evitar duplicados y respetar destinatarios. Publicar desde Admin no requiere una nueva APK si el cambio es solo de pantalla/datos PWA; FCM/servicios Android sí requieren implementación nativa.
- **Chat:** acciones administrativas permitidas, actividad y señales de nuevas solicitudes reflejadas en la PWA Admin; el Chat de Android **sigue 100 % React Native**, y el de iPhone sigue PWA. No convertir el Chat en WebView para resolver sincronización.
- **Archivos:** datos estructurados, roles, destinatarios y estados viven en **D1**; fotografías, audio y video utilizarán **un mismo almacenamiento de medios autorizado** por los clientes y Administrador cuando se implante M01–M05, con acceso controlado por Worker. Un *bucket* es para archivos, **no sustituye** el backend/base de datos ni implica crear R2 o mezclar almacenamiento de producción.

**Modelo de flujo esperado:** acción en Admin → sesión/rol/alcance validados en Worker → transacción y registro en D1 → evento realtime autorizado a las superficies interesadas → actualización local y caché → recuperación íntegra al volver online. Nunca confiar en IDs de destinatario, estado de dispositivo o rol enviados por el frontend sin comprobarlos en servidor.

## 11.4 Criterios de aceptación — orden actual, sin hitos nuevos

1. **AHORA: «Acceso a músicos»**, único módulo del Administrador activo. Validar crear nombre real, duplicados, denegación de nombres desconocidos, ingreso/restauración Android+iPhone con sesiones conservadas, papelera de prueba, expulsión WebSocket, datos relacionados y acordeón con historial real. Auditar y depurar las rutas alternativas de teléfonos y artefactos de prueba después de asegurar respaldos.
2. **DESPUÉS:** consolidar el Chat Android nativo/iPhone PWA, sus controles de sesiones, multimedia y QA. Un único backend y una lógica de autorización; no publicar APK experimental ni activar `enforce` con los dispositivos actuales.
3. **DESPUÉS DEL CHAT:** habilitar módulos Chat administrativo, Home, Calendario, Repertorio, Avisos y los demás en la **misma** PWA de Administrador y en las superficies de músicos correspondientes. Los botones de navegación vacíos hoy son estructura, no funciones terminadas.
4. Mantener 0 MXN adicional, PWA y Admin actualizables sin reinstalar, credenciales privadas, D1 única, rollback e integridad. No tocar `main` original, Supabase/HAVANA CLOUD, aplicaciones ajenas ni datos de músicos sin una decisión y una copia verificada.

**Estado:** Acceso a músicos **parcialmente comprobado**; lista, alta y eliminación del miembro de prueba verificadas, historial nuevo sin eventos en el último corte D1. S01, S02 y P04 permanecen abiertos. Tablero **10/27**.

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

# 18. ESTADO REAL VERIFICADO — 27 DE OCTUBRE DE 2026

## 18.1 Código y plataformas

- **Arquitectura elegida:** Chat Android 100 % React Native y Chat iPhone PWA; Home/Calendario/Repertorio/Admin y demás pantallas visuales PWA compartidas en Android WebView + iPhone. **La WebView de los módulos no-Chat aún no está integrada**; el Chat Android actual se conserva.
- Android hoy usa `v2/apps/android/App.tsx`, `SwipeableBubble.tsx` y `expo-sqlite/kv-store` para su Chat nativo. No eliminar, migrar a HTML ni desinstalar esta APK.
- iPhone usa `v2/apps/pwa/src/App.tsx` como Chat PWA; para módulos visuales futuros ese mismo proyecto React se reutilizará en Android WebView.
- El propietario confirmó físicamente el módulo Admin de acceso por nombres; creó y eliminó al miembro de prueba `Pepe`; quedaron seis integrantes iniciales. El módulo avanzado de dispositivos está **congelado**, no forma parte de la etapa actual.
- Chat texto, WebSockets, replies, reacciones, edición/borrado, búsqueda e historial existen en ambas implementaciones; long-press WhatsApp-like, swipe reply, reconexión y sincronización bidireccional requieren cierre de QA real.
- Fundación cerrada; problemas iniciales de Metro y handshake WebSocket ya corregidos. No volver a generar una APK debug que dependa de Metro.
- Fotos, video/audio, push, Home avanzado, Calendario, Repertorio y el resto del Admin V2 permanecen pendientes de implementación completa. **Acceso a músicos del Admin ya existe parcialmente**; no volver a describir toda la Administración como no implementada. En Android Chat sigue nativo cuando se añada multimedia.

## 18.2 Servidor

- Cloudflare Pages `havana-nice-v2-dev` publica `havana-nice-v2-foundation`; Worker `havana-nice-v2-dev` independiente en versión `52a45179-b54f-42ae-9165-74453cc52e18` 100 % y Durable Object `CHAT_ROOMS` con D1 `havana-nice-v2-dev`. No se han alterado el Worker, Pages ni Supabase de HAVANA NICE original.
- Migraciones D1 aditivas `0001–0012` incluidas en Git; `chat_access_events` creado en D1 con 0 eventos en la auditoría 27/10. Acceso Admin configurado con `V2_ADMIN_LOGIN_MODE=enabled` y Secret privado; `V2_DEVICE_APPROVAL_MODE=observe` residual de pruebas, `enforce` apagado.
- Datos reales y anomalías: ver **ESTADO VIGENTE** arriba y **Auditoría 2** en §19. No confundir filas de sesiones con número de teléfonos online.
- Multimedia preparada pero apagada, 0 archivos en D1, sin R2 ni bridge productivo externo. La eliminación actual de miembro no cubre todavía una eventual limpieza remota de multimedia, pendiente antes de activar subida.
- **Deuda de despliegue:** Pages publica desde GitHub pero el Worker sigue desplegándose como versión por operación separada. Converger a una sola publicación atómica/verificada y trazable por SHA antes del siguiente módulo; conservar rollback.

## 18.3 Última comprobación de compilaciones

- **V2 foundation CI** GitHub Actions `40453219011`, segundo intento tras desplegar el Worker, **SUCCESS**. Incluyó typecheck, seguridad Admin, tests de historial/borrado simulados sin afectar a usuarios, build PWA, export Android y smoke live Worker.
- **Cloudflare Pages producción V2**: commit `951a5577fc81308cdc7aa84689488ea17b0fbc84`, estado `success`, y **Worker V2** versión `52a45179-b54f-42ae-9165-74453cc52e18` 100 %. La fuente en `havana-nice-v2-foundation` no implica tocar la rama `main` original.
- **Android instalado confirmado**: 0.0.4; **Android 0.0.5** disponible/compilado, sin prueba física de actualización. No entregar nueva APK por una actualización de Admin/PWA.

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

### Auditoría 2 — 27/10/2026 · cotejo contra el Plan Maestro (SOLO LECTURA / SIN BORRADOS)

**Repositorios y ramas:** el mismo repositorio reúne `main` original y `v2/` nuevo. GitHub reportó **41 ramas** y **27 SHA de punta distintos**: nueve checkpoints antiguos de repertorio comparten un mismo SHA, cinco variantes calendario/acceso comparten otro, más otros duplicados. La rama V2 contiene **131 archivos**: 55 originales/históricos fuera de `v2/`, 73 de V2 y tres workflows. Esos 55 archivos no son necesariamente duplicación operativa: **pertenecen a la app original** y se conservarán hasta una migración segura. `main` sigue siendo producción original y tiene Pages independiente; no crear un nuevo repositorio ni mover código a `main` por rutina. Ausencia de protección de ramas verificada; proponer protección antes de actuaciones destructivas.

**Restos experimentales aún presentes:** `pwa-first-device.js` y ruta `/api/chat/pwa/session` (historia de primer dispositivo), `device-approval.js` y `chat_device_requests`, estados de espera de solicitudes en Android/iPhone y `chat_pwa_first_claims`. **La PWA actual usa `startNamedChatSession` → `/api/chat/session`, NO la ruta de primer dispositivo**. Se deben retirar/archivar dependencias obsoletas **solo tras** comprobar importaciones, compatibilidad con 0.0.4/0.0.5 y que `enforce` continúa apagado. Las migraciones antiguas permanecen en Git por trazabilidad. `havana-cloud-bridge-client.js` aparece sin integración de producción: candidato a archivar después de análisis; `drive-media.js` se conserva congelado para multimedia. `/visual.html` es una **vista preliminar H02** todavía referenciada en CI, no está integrada en Android y contiene una pantalla de Administrador con texto desactualizado; no es segundo Administrador oficial. Eliminarla del sitio activo solo después de adecuar la futura H02, el SW, el build y sus pruebas.

**Datos D1:** 6 miembros autorizados, 10 sesiones de músicos válidas, 45 mensajes, nueve reacciones, seis lecturas, dos solicitudes revocadas, seis registros de primera reclamación PWA, cero eventos de historial y cero archivos multimedia. Nueve sesiones Admin válidas requieren política de cierre de sesiones anteriores. **18 mensajes de identidades ya ausentes de `chat_members`, cuatro reacciones y tres recibos huérfanos**: clasificar y respaldar antes de eliminar, porque pueden ser parte del historial válido de conversaciones de prueba y no solo basura. La eliminación de `Pepe` está respaldada por captura física; hacer pruebas E2E de sockets y dependencias sin tocar músicos reales. No borrar histórico Chat automáticamente.

**Problemas funcionales a corregir:** acceso por nombre todavía permite suplantación, no confundir con seguridad total; el nuevo historial no reconstruye entradas pasadas, la detección de modelos depende del user-agent; el frontend Admin puede recargarse al actualizar Pages y perder una sesión/edición en memoria; Workers y Pages no se publican aún mediante una única operación coordinada; el borrado de músicos no incluye todavía objetos multimedia remotos cuando existan. El Worker principal contiene `// @ts-nocheck`; revisar al modularizar sin reescribir funcionalidades que ya pasaron QA.

**ORDEN DE DEPURACIÓN PREVIA A SEGUIR DESARROLLANDO:** 1) referencia de rollback de Git, backup D1 y Worker; 2) proteger `main` original; 3) restaurar un único acceso por nombre Admin/Worker/PWA con pruebas, eliminando caminos paralelos solo cuando no afecten Android; 4) evitar recargas destructivas de Admin, reforzar auditoría y borrado integral; 5) clasificar los datos huérfanos antes de decidir eliminaciones; 6) retirar/archivar código y ramas comprobablemente innecesarios, no tocar binarios ya entregados; 7) garantizar despliegue trazable y CI/E2E incluyendo cierre de sesión y WebSocket. Los módulos Chat, Repertorio y Calendario Admin continúan pospuestos hasta dejar **Acceso a músicos** aprobado en ambas plataformas.

**LÍMITE DE ESTA AUDITORÍA:** no se modifican ramas, workers, datos ni aplicaciones por actualizar el Plan Maestro; esto define qué conservar/corregir/retirar, no declara la limpieza ejecutada. Mantener exactamente **10/27** hitos.

### Depuración segura — ejecución 1, 27/10/2026

**Punto de recuperación registrado ANTES de modificar código:** commit Git de V2 `d20ca27720fb14b83f1c4cd8983e6f5f7aaa1b88`; Worker anterior `52a45179-b54f-42ae-9165-74453cc52e18` (100 %); D1 bookmark `000000b3-00000000-00005111-92b4a09c0b3e1f3ef3817711f4fbf43c`, lectura previa con 6 músicos, 10 sesiones y 45 mensajes. Cloudflare completó una **exportación SQL** de la misma bookmark pero **la descarga persistente de ese archivo NO se verificó** desde el entorno de herramientas: este snapshot de Time Travel no sustituye una copia independiente. **No borrar datos D1, tablas ni ramas históricas sin obtener y verificar una copia externa y las dependencias**. Nunca incluir aquí tokens de músicos ni el Secret del Administrador.

**Cambios de código ejecutados en la ÚNICA rama V2, sin reinstalar Android y sin cambiar Worker ni D1:**
- `v2/apps/pwa/src/admin-main.tsx` y `AdminChatAccess.tsx`: actualización de versión Admin se **aplaza** cuando hay sesión de Administrador activa o texto sin guardar. La versión nueva se aplica al salir de la sesión o al abrir sin borradores; no se persiste el bearer privado en localStorage. Previene cierres inesperados y formularios perdidos durante Pages deploy. Foundation `40456758694` / `40457028165` **SUCCESS** (compilación, reglas Admin y servidor V2).
- `v2/packages/shared/src/index.ts`: eliminado el cliente **muerto** `startPwaFirstDeviceSession` (~916 caracteres), sin referencias en Android ni PWA actual. Se conserva `startNamedChatSession` para ambos clientes. Por compatibilidad con frontend de caché antigua, la **ruta experimental en Worker** `/api/chat/pwa/session` aún permanece; no confundir limpieza de cliente con retirada del endpoint servidor.
- `.github/workflows/v2-android-apk.yml` y `v2-apk-direct-download.yml`: retirados triggers `push` de `v2/packages/shared/**`, `v2/package-lock.json` y de cambios exclusivos de workflows. Conservan build/publicación cuando cambie realmente `v2/apps/android/**` o se active explícitamente `workflow_dispatch`. Así los cambios Admin/PWA/shared no lanzan otra APK de forma automática. **Ninguna APK ha sido instalada en el dispositivo por esta depuración**; pueden quedar ejecuciones antiguas de Actions lanzadas antes de retirar el trigger, y sus artefactos no equivalen a una actualización probada.
- Se realizó búsqueda directa de referencias: `havana-cloud-bridge-client.js` está importado solo por pruebas de media; es código congelado para etapa M01 y **NO se elimina**; `device-approval.js` y `pwa-first-device.js` siguen alcanzables en el backend y existen dependencias Android; no retirarlos sin migración. El prototipo `visual.html` sigue requerido por el SW/tests H02; no borrar por apariencia de pantalla preliminar.

**Resultados:** `main` original sigue intacto, seis músicos/sesiones y mensajes sin modificaciones, Worker sin publicar nueva versión ni activar `enforce`, 10/27 hitos igual. **Pendiente de depuración por prioridad:** (1) copia externa D1 verificada, (2) QA de Admin sin recarga al volver de segundo plano y con formulario escrito, (3) retirar de forma escalonada rutas de aprobación de dispositivos del Worker *solo* cuando no puedan ser invocadas por clientes instalados/caché antiguos, (4) depurar datos huérfanos únicamente tras respaldo y decisión explícita, (5) consolidar proceso de despliegue coordinado backend/frontend. No avanzar a Chat/Repertorio/Calendario Admin durante esta etapa.

### Depuración segura — ejecución 2, 27/10/2026 · foco Administrador

**Cambios implementados y verificados (sin tocar APK Android ni `main` original):**

- **Sesiones administrativas:** Worker añade API exclusivamente autenticada `GET /api/chat/admin/auth/sessions` para consultar **cuántas otras sesiones activas existen** y `POST /api/chat/admin/auth/revoke-others` para cerrar **solo las demás**, preservando el token actual. El Administrador PWA tiene recuento, botón **«Cerrar otras sesiones»** y confirmación visible. El cierre ordena al Durable Object volver a verificar sesiones de WebSocket y expulsar las revocadas; el logout también provoca esta comprobación. **NO se ha ejecutado la operación destructiva sobre sesiones reales**; el usuario decide cuándo hacerlo.
- **Actualizaciones PWA:** se conserva la sesión Administrador en memoria, no se guardan secretos ni bearer en `localStorage`. Cuando un nuevo bundle llega con una sesión o formulario activo, se difiere la recarga. La interfaz anuncia **«Hay una actualización preparada»**; se aplicará al salir sin perder datos sin guardar. La actualización aún requiere prueba física de segundo plano en móvil.
- **Código obsoleto del cliente Admin:** se eliminaron `AdminDeviceRequest`, `adminDeviceRequests`, `adminDeviceAction` (sin consumidores en el Administrador vigente) y 606 bytes de estilos `a-admin-record*` del antiguo panel de aprobaciones. El Worker/DB conservan temporalmente el endpoint antiguo para compatibilidad de los clientes con caché y las pruebas de seguridad; esto NO cambia la decisión de congelar dispositivos.
- **Pruebas GitHub/Cloudflare:** prueba unitaria de que la sesión actual sobrevive al cierre del resto y anónimos no pueden acceder; además smoke live HTTP 401 de ambas nuevas rutas. `40458814542` **SUCCESS** (typecheck, Admin, CI, Chat/Worker live). PWA Pages commit `1347c7b364571a30454356bf96097e7df482c040` publicado; Worker `54d761d5-2388-429a-b95c-1213f1651dac` desplegado 100 % con seis bindings originales inalterados.
- **Datos D1 intactos después de publicar:** 6 músicos, 10 sesiones de músico, 45 mensajes; 11 sesiones Admin válidas contabilizadas en corte actual, **sin revocación**. Cloudflare terminó exportación SQL en bookmark `000000b8-00000002-00005111-d8d7eec0fce0e61a123dad11114b7442`, pero el enlace firmado no pudo materializarse/descargarse desde herramientas; **la exportación NO cuenta como backup externo verificado**. Existe Time Travel D1 con bookmark posterior `000000b9-00000000-00005111-172a0e787cd9df9061070d82c7694d3e`. No borrar filas, tablas o ramas hasta guardar y comprobar una copia independiente.

**Siguiente validación estrictamente de Administrador:** propietario abre `/admin.html`, confirma que el nuevo botón refleja sus sesiones anteriores, prueba un cierre voluntario de otras sesiones **si lo desea**, comprueba que la actual permanece y que las anteriores no pueden acceder; verifica acordeón de historial tras un acceso posterior al despliegue y la expulsión al borrar un integrante EXCLUSIVAMENTE de prueba. Seguir depurando ruta antigua de dispositivo sin romper Android 0.0.4 ni iPhone PWA. **No abrir otros módulos ni aumentar los 10/27 hitos todavía.**

### Depuración segura — ejecución 3, 27/10/2026 · preservación de sesiones y estabilidad Admin

**Regla cumplida: no romper funciones certificadas.** Cambios exclusivos en `v2/apps/pwa/src/admin-api.ts`, `AdminChatAccess.tsx` y prueba `v2/apps/pwa/tests/admin.test.mjs`. **No modificar** React Native/Android, secretos, Worker, D1, componentes Chat, datos ni `main`. No revocar sesiones reales ni crear miembros de prueba.

- **Fallo corregido:** la PWA Admin distinguía la autorización del usuario por comparación de texto de error, y al fallar una comprobación por falta de Internet o un error temporal trataba la sesión como vencida. Ahora `AdminApiError` incluye código HTTP y `isAdminUnauthorized` solamente considera 401 como fallo auténtico de autorización. Ante pérdida de red el Administrador informa «Sin conexión temporal», conserva la sesión y mantiene el listado ya cargado; al volver al primer plano/conectarse intenta actualizar. Las credenciales Admin continúan solo en memoria, nunca en `localStorage`.
- **Pruebas de regresión:** GitHub Actions `40460155058` **SUCCESS**: TypeScript, pruebas Admin y seguridad, build PWA, compilación de bundle Android sin distribución, smoke backend/Cloudflare. Cloudflare Pages registró el commit `644e91fdcfc83a59c0b60641887370f6f1211bd2` como desplegado; el Worker V2 **permanece sin cambios** en `54d761d5-2388-429a-b95c-1213f1651dac`, 100 %.
- **Integridad D1 posterior:** 6 músicos autorizados, 10 sesiones de músicos, 45 mensajes, 0 eventos de acceso nuevos. No afirmar que existe historial antiguo; los eventos comenzarán tras nuevas entradas/conexiones reales. Time Travel bookmark del corte previo `000000ba-00000000-00005111-f7804ba1c6c8e59707886a02aa096446`; Cloudflare completó la exportación SQL, pero **no existe copia externa descargada y validada** en este trabajo. Por tanto **no ejecutar limpiezas destructivas** de sesiones, mensajes, tablas o ramas.
- **Pendiente específico de Administración:** prueba física de Admin al desconectar Internet y reconectar, historial con eventos reales, baja de usuario exclusivamente de prueba con expulsión conectada y limpieza de multimedia futuro; corregir rutas viejas de aprobación de dispositivos solo después de identificar todos los clientes dependientes. No instalar APK nueva ni ampliar módulos visuales.

**Tablero inalterado: 10/27 hitos; S01/S02/P04 siguen pendientes de QA final.**

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

**CONTINUACIÓN VIGENTE — 27/10/2026, AUDITORÍA FRENTE AL PLAN MAESTRO INTEGRADA:** mantener **una fuente V2** en `havana-nice-v2-foundation`, una PWA Admin `/admin.html`, un Worker `havana-nice-v2-dev`, una D1 y una implementación Chat Android React Native/iPhone PWA. **Prioridad del propietario: solo «Acceso a músicos»**. Está publicada la lista, creación/autorizar nombres y eliminación (prueba física Pepe); falta validar historial con eventos posteriores al despliegue, expulsión con Chat en vivo, integridad de borrado y anonimización/retención de datos. La auditoría encuentra rutas de acceso de teléfonos obsoletas y datos de laboratorio huérfanos, pero **no se eliminaron**. Limpiar primero con respaldo, QA y rollback. Cloudflare: Worker `52a45179-b54f-42ae-9165-74453cc52e18` 100 %, Pages git `951a5577fc81308cdc7aa84689488ea17b0fbc84` `success`, Fundación CI `40453219011` SUCCESS. Android 0.0.4 confirmado, 0.0.5 sin instalar/probar. **S01/S02/P04 siguen ABIERTOS; 10/27 hitos**. No activar `enforce`, no publicar APK experimental, no tocar `main` original/Supabase/HAVANA CLOUD ni proyectos ajenos. La posible transición futura a un `main` exclusivo de V2 requiere otra decisión y una migración explícita; por ahora «un solo main» significa **una única línea autorizada de desarrollo V2**, no alterar producción.

**Regla inequívoca:** la PWA en Android proporciona Home, Calendario, Repertorio, Administrador y demás pantallas visuales; **no sustituye nunca el Chat React Native de Android**. La PWA de iPhone sí mantiene su propio Chat. Las decisiones previas contradictorias —Chat Android dentro de WebView, R2, clave temporal de laboratorio y APK para ajustes CSS— dejan de ser instrucciones vigentes; su historial puede consultarse en commits de Git.
