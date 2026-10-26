# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Versión del plan:** 2026-10-26 · arquitectura visual unificada aprobada  
**Estado:** Fundación cerrada; Chat de texto funcional en laboratorio; migración de Android a interfaz PWA compartida por ejecutar; seguridad, multimedia, push y módulos restantes por completar.  
**Rama de trabajo:** `havana-nice-v2-foundation` del repositorio `Abnernoa97/havana-nice-pwa`.  
**Producción protegida:** `main`, HAVANA NICE oficial, sus usuarios y Supabase, HAVANA CLOUD y los demás proyectos permanecen intactos.  
**Presupuesto obligatorio:** 0 MXN de costo adicional, sin productos de facturación automática.  
**Documento rector:** este es el único plan de arquitectura, tareas, estado y auditoría de V2. La historia de cambios se conserva en Git.

> **DECISIÓN ARQUITECTÓNICA DEFINITIVA — 26/10/2026:** Toda la interfaz visual de HAVANA NICE V2, **incluido el Chat**, procede de **una sola PWA React**. En Android se presenta dentro de una aplicación nativa ligera mediante WebView. Android mantiene **funciones genuinamente nativas** donde aportan valor: sistema de notificaciones, almacenamiento protegido, integración con archivos/cámara, operaciones offline especializadas, gestión del ciclo de vida y servicios del sistema. iPhone ejecuta la misma PWA instalada. Se evita mantener dos interfaces dibujadas en paralelo. El motor y las responsabilidades nativas se construyen detrás de una interfaz controlada, nunca como segunda presentación visual del producto.

---

# 1. PROPÓSITO Y EXPERIENCIA FINAL

HAVANA NICE V2 será una aplicación privada para la administración y el trabajo cotidiano de HAVANA NICE: músicos, administrador, chat, calendario, repertorios, avisos, perfiles y ajustes. Debe sentirse rápida, elegante y sencilla en Android y iPhone.

Principios de experiencia:

- **Una sola apariencia:** PWA React + estilos compartidos para músicos y administrador; la misma pantalla en iPhone y Android, respetando las particularidades de teclado y navegación de cada sistema.
- **Edición visual sin reinstalar:** textos, colores, tipografías, distribución, tarjetas, menús y pantallas se cambian en el código PWA y se publican en Cloudflare Pages. Android los recibe al recuperar la versión web, sin APK nueva.
- **Funciones nativas auténticas:** la APK conserva código Android para lo que de verdad necesita capacidades del sistema y las expone a la PWA mediante un puente estrecho y protegido.
- **Chat fiable y pulido:** gestos coherentes, escritura fluida, notificaciones y sincronización incluso con interrupciones de red.
- **Local-first:** arranque desde recursos disponibles en el dispositivo, datos visibles inmediatamente, sincronización posterior y colas fiables.
- **Costo real 0 MXN:** si una característica necesita facturación o excedentes automáticos, no se habilita.
- **Una sola fuente de verdad de datos:** Worker, D1 y Durable Objects; dos teléfonos no deben mantener bases de negocio independientes.
- **Releases seguros:** actualizar Android conservando firma, paquete, datos, credenciales y borradores; no pedir desinstalación para un rediseño.

# 2. ARQUITECTURA ÚNICA DEL PRODUCTO

```text
                 UNA SOLA INTERFAZ PWA (React + Vite + TS)
            Chat · Home · Calendario · Repertorio · Admin
                           │
               ┌───────────┴───────────┐
               │                       │
        ANDROID — APK              iPHONE — PWA
        Expo / React Native        instalada en Home
        WebView de la PWA          pantalla completa
               │                       │
        PUENTE NATIVO              Capacidades web
        permisos/FCM               Web Push
        archivos/cámara            IndexedDB/Service Worker
        almacenamiento seguro      permisos web de iOS
        lifecycle/back
               └───────────┬───────────┘
                           │
                 CLOUDFLARE WORKER V2
               autenticación · API · roles
                           │
               ┌───────────┴───────────┐
               │                       │
            D1 SQLite            Durable Objects
        estado persistente         WebSockets
               │                       │
               └───────────┬───────────┘
                           │
               ARCHIVOS CHAT PRIVADOS
         puente backend privado → HAVANA CLOUD
                 → Google Drive existente
             solo cuando esté autorizado
```

**No hay dos implementaciones visuales.** La aplicación React Native que hoy renderiza el Chat en Android es una implementación provisional de laboratorio. Será reemplazada gradualmente por el contenedor WebView; se conserva hasta completar pruebas de equivalencia y migración de datos. **No retirar todavía el código o la APK actual.**

## 2.1 PWA: única capa de presentación

`v2/apps/pwa/` es el origen de toda la UI: HTML, React, CSS, componentes, diseño adaptable, accesibilidad, vistas, formularios, menús, repertorio, calendario y **Chat completo** (globos, menú de acciones, escritura, replies, reacciones, viewer, estados). El mismo conjunto visual se ve:

- En iPhone, dentro de la PWA instalada.
- En Android, dentro de una WebView incluida en la APK nativa.
- En navegador de desarrollo, para inspección y pruebas.

Las diferencias de plataforma se encapsulan en adaptadores, no bifurcando pantallas ni duplicando el diseño. El contenido mantiene safe areas, scroll, tamaños táctiles, contraste, tamaño de texto y navegación correctos.

El JavaScript de la interfaz gestiona los componentes, rutas, estado de UI y eventos. El núcleo compartido/Worker sigue siendo la autoridad de datos, sesiones y permisos. **PWA como visual no significa que toda la lógica se ejecute en una página o que Android deje de ser nativo.**

## 2.2 Android: contenedor y funciones nativas

Mantener el paquete **`com.havananice.v2`** y el proyecto Expo/React Native de V2. La APK dibujará únicamente un shell Android muy delgado: pantalla de carga/fallback local, WebView, integración de sistema y errores recuperables. Las vistas de producto, incluido el Chat, las dibuja la PWA.

Responsabilidades nativas cuando sean necesarias y estén justificadas por pruebas:

- Notificaciones Android: FCM, canales, permisos, apertura de destino, navegación desde notificación y sincronización de token del dispositivo.
- Almacenamiento protegido: credenciales y claves mediante mecanismos apropiados de Android; caché/archivos locales; traslado seguro de la sesión SQLite actual.
- Ciclo de vida: background/foreground, conectividad, reanudación, apertura de enlaces, permisos y botón **Atrás** un nivel dentro de la navegación, sin expulsar al menú principal.
- Cámara, selector de fotos/videos/archivos, compresión, grabación y reproducción especializada si la experiencia web lo requiere.
- Operaciones offline persistentes/seguras, transferencia de archivos y reintentos cuando una tarea deba sobrevivir más allá de la página.
- Integración de teclado, barra de estado, navegación Android, vibración y otros servicios del SO que mejoren de forma comprobable la experiencia.
- Diagnóstico de versión nativa, capacidades disponibles y compatibilidad del puente.

No crear interfaces paralelas de Chat, Repertorio, Calendario ni Administrador en React Native. Un problema puntual de rendimiento no autoriza duplicar una pantalla entera: se mide y se optimiza; una excepción visual nativa exigiría decisión expresa y documentada del propietario.

## 2.3 iPhone: misma PWA, sin app de App Store

PWA web instalada desde Safari, sin costo de cuenta de desarrollador ni distribución por App Store. Usa React y estilos de `v2/apps/pwa/`, IndexedDB/Service Worker, Web Push en condiciones compatibles con iOS, y selectores de medios web.

Una función que no sea viable en la PWA de iPhone debe contar con fallback honesto; nunca afirmar paridad de permisos o procesos en segundo plano sin verificar en un iPhone real.

## 2.4 Cambios que no requieren APK y cambios que sí

**Se publican solo en PWA:** tipografía, colores, logotipo mostrado dentro de la UI, textos, etiquetas, tarjetas, orden y posición de botones, pantalla nueva implementable en web, menús, gestos de Chat web, diseño de Admin, Calendario y Repertorio. Se entrega por Cloudflare Pages y aparece al recargar o abrir la versión nueva según política de actualización.

**Requieren APK solo si cambian capacidades Android:** permisos/manifest, firma, configuración de paquete, icono o splash del lanzador Android, puente JS↔nativo, librerías o servicios Android, canales especiales FCM, almacenamiento nativo, integración de cámara/archivos, motor especializado o componentes binarios.

**La PWA no debe interrumpir una acción abierta:** detectar versión nueva, proteger borrador/cola offline, activar actualización en punto seguro y mantener modo offline mientras la red no esté disponible. No depender de actualizar una APK por detalles gráficos.

# 3. ESTRUCTURA DE CÓDIGO Y FUENTE ÚNICA DE VERDAD

Repositorios y ramas:

- Repositorio: `Abnernoa97/havana-nice-pwa`.
- Desarrollo de V2: `havana-nice-v2-foundation`, directorio `v2/`.
- Producción original: `main`; **solo lectura para V2**.
- Publicación de binarios V2: rama `havana-nice-v2-apk-downloads`.
- HAVANA CLOUD: proyecto y Worker aparte, sin modificaciones en producción por el desarrollo V2.
- HAVANA MASTER LAB: laboratorio independiente, puede probar escenarios de navegador; no sustituye dispositivos Android/iPhone físicos.

Estructura:

```text
v2/
├─ apps/
│  ├─ pwa/                ÚNICA INTERFAZ VISUAL; iPhone + Android WebView
│  └─ android/            Shell Android + módulos/puente nativo
├─ packages/
│  └─ shared/             Contratos de API, modelos y reglas comunes
├─ cloudflare/
│  ├─ src/                Worker + lógica de Chat + multimedia apagada
│  ├─ migrations/         Esquemas y evolución D1 reproducible
│  └─ tests/
├─ tests/cross-platform/ Casos de paridad y pruebas E2E
├─ scripts/               Auditoría y validaciones
└─ docs/PLAN-MAESTRO.md   ÚNICO PLAN MAESTRO VIGENTE
```

La capa compartida debe incluir contratos estables, validadores, idempotencia, formato de eventos y helpers reutilizables. No duplicar el motor del Chat en WebView y React Native: en la arquitectura final **una sola instancia administra los mensajes**; el puente nativo maneja únicamente las capacidades que el SO necesita.

**Regla de ingeniería:** evitar archivos de arreglos acumulativos tipo `final-fix-2`, endpoints paralelos, APIs duplicadas y dependencias sin uso. Mantener módulos legibles, interfaces acotadas, cambios pequeños y pruebas de regresión.

# 4. WEBVIEW Y PUENTE NATIVO: CONTRATO OFICIAL

La decisión híbrida no consiste en abrir la web como un navegador sin controles. Debe implementarse un WebView seguro, estable y verificable.

## 4.1 Navegación, origen y seguridad

- Solo cargar el origen V2 autorizado y los recursos explícitamente necesarios; rechazar enlaces desconocidos dentro de la WebView y abrir enlaces externos en el navegador del sistema según política.
- Permitir comunicaciones puente **únicamente desde el origen de confianza**, validar tipo, versión, identificador de petición, parámetros, permisos y estado de sesión de cada acción.
- No usar comandos arbitrarios enviados por HTML, ni `eval` o exposición global de secretos, Google OAuth, refresh tokens o claves internas en la PWA.
- Mantener las operaciones sensibles validadas por el **Worker**, aunque un botón esté oculto o Android tenga un permiso instalado.
- Evitar duplicar el token del usuario en múltiples almacenes sin necesidad. Para credenciales del dispositivo Android, utilizar almacenamiento protegido y un intercambio limitado de capacidades.
- Añadir CSP web razonable, restricciones de navegación y tratamiento seguro de mensajes WebView; probar escenarios de navegación inesperada y XSS.

## 4.2 API del puente

El contrato versionado puede ofrecer funciones concretas: `getNativeCapabilities`, `requestNotificationPermission`, `registerPushToken`, `pickMedia`, `shareFile`, `openExternalLink`, `hapticFeedback`, `setStatusBar`, `reportAppState` y `navigateBack`. Se incorporarán solo las necesarias al módulo activo.

Cada llamada define autorización, tipo de entrada/salida, resultado exitoso, error, timeout y comportamiento cuando no existe puente (iPhone web/navegador). Los eventos nativos nunca se tratan como datos autenticados por el mero hecho de proceder del WebView.

## 4.3 Arranque y continuidad sin conexión

- Al primer arranque Android debe disponer de un **shell visual local** o versión web empaquetada verificable para evitar pantalla en blanco sin internet; por defecto recuperar la última versión válida desde caché web.
- Mantener la navegación y el Chat recientes disponibles offline; sincronizar al recuperar red y permisos. Nunca borrar un borrador por actualización de UI.
- La primera carga de un WebView puede diferir del Chat React Native actual; medir TTI, scroll, teclado y recuperación antes de sustituirlo.
- Android Back: subir exactamente un nivel, cerrar primero overlays/visores, regresar al Chat si estaba abierto, no abandonar la app.
- El enlace profundo del push debe llegar a la ruta compartida (Chat o sección) tras validar/restaurar sesión.

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

**La interfaz final del Chat es la misma PWA en Android e iPhone.** Android puede ejecutar capacidades de fondo nativas, pero no una segunda UI de Chat React Native.

## 7.1 Chat de texto y comportamiento

- Mensajes uno a uno dentro de la conversación privada del equipo, timestamp de servidor, nombre del remitente, orden estable e historial paginado.
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
3. **CHAT 3 · Respuestas:** preview, gesto, referencia al original y mensajes borrados. Implementado; validar el gesto en interfaz PWA compartida.
4. **CHAT 4 · Reacciones, edición y borrado:** backend y UI inicial operativos; cerrar overlay WhatsApp-like, límites de permisos, sincronización y QA física.
5. **CHAT 5 · Presencia y typing:** existe funcionalidad; validar condiciones con pantalla bloqueada y no confundir conexión con notificación.
6. **CHAT 6 · Fotografías:** almacenamiento privado con límite real cero pesos, selector, compresión, miniaturas, viewer, progreso, retry y confidencialidad. No está disponible para envío real.
7. **CHAT 7 · Videos:** poster, duración, selector, reproducción, red lenta, subida controlada, fullscreen y volver al punto anterior. No disponible.
8. **CHAT 8 · Audio:** grabación, duración, envío, pausa/reproducir, subida y retry. No disponible.
9. **CHAT 9 · Viewer y gestos multimedia:** foto/video fullscreen, zoom pellizco, swipe, navegación y retorno fiable. No cerrado.
10. **CHAT 10 · Push:** FCM Android, Web Push iPhone, rutas profundas, permisos, duplicados y app cerrada/bloqueada. No implementado de extremo a extremo.
11. **CHAT 11 · Pulido final:** animaciones, agrupación, scroll, grandes historiales, tiempos y accesibilidad. Solo al finalizar estabilidad.

**Puerta de cierre:** la fase no está concluida por compilar o por un simulador. Requiere funcionamiento del Chat PWA dentro del Android híbrido, PWA iPhone y confirmación física cuando aplique.

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

- **Android:** FCM y componentes nativos únicamente para registro del dispositivo, permisos/canales, recepción de notificaciones, apertura de ruta y acciones que realmente deban ejecutarse fuera de la WebView. No renderizar una pantalla alternativa por activar FCM.
- **iPhone PWA:** Web Push donde el SO lo permite, particularmente con la PWA instalada según requisitos del sistema. Abrir la ruta correcta al tocar notificación.
- **Servidor:** un evento de negocio y una sola decisión de quién debe recibir push; no duplicar por cada cliente. No mandar push duplicado cuando la conversación ya está activa cuando pueda verificarse.
- **Estado actual:** push no validado ni desplegado integralmente en V2; jamás declarar que funciona con app cerrada antes de medirlo en teléfonos reales.
- Una WebView **no sustituye automáticamente** un servicio nativo de background: permisos, ejecución y restricciones de batería siguen siendo responsabilidad Android.

# 10. RESTO DE LA APP — MISMA PWA VISUAL

Cada módulo utiliza el diseño único y el Worker/D1 compartidos. Android no necesita una segunda pantalla nativa para estos módulos.

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

- **PWA (ambos teléfonos):** Service Worker cachea exclusivamente shell y assets públicos del mismo origen; no guarda respuestas autenticadas ni APIs. IndexedDB para datos locales permitidos, borradores, cola y estado web. No borrar caché útil por actualización estética.
- **Android nativo:** almacenamiento seguro de credenciales y datos/archivos cuando corresponda; bridge coordinado con el estado web; no mantener dos motores activos publicando duplicados.
- **Actualización PWA:** network-first para recursos cuando haya red, versión estable anterior como fallback, cache versionada, migraciones IndexedDB compatibles. No aplicar cambio que borre cola o reemplace pantalla mientras el músico escribe.
- **Chat offline:** mismo ID de mensaje durante reintentos, FIFO, confirmación de backend, reconciliación, prioridad a no perder contenido, límites de cola y errores visibles.
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

- Android WebView PWA y iPhone PWA ven la misma versión visual.
- Android→iPhone e iPhone→Android; mensajes simultáneos y ausencia de duplicados.
- Cierre/reapertura, pantalla bloqueada, Wi-Fi↔datos, conexión lenta, modo avión, proceso Android reiniciado.
- Borradores y cola preservados en cambios de pantalla y actualización PWA.
- Long-press y swipe realmente funcionan en ambas plataformas; overlay contextual junto a la burbuja.
- Teclado Android e iPhone sin saltos ni tapar el composer; botón Atrás correcto.
- Reacciones/edición/borrado presentes tras sincronización y resync.
- Revocación de un usuario desde servidor impide leer y escribir, incluso si conserva la app.
- Push con app abierta, cerrada y bloqueada únicamente cuando su módulo exista.
- Media segura sin fuga a catálogo HAVANA CLOUD únicamente cuando se habilite.
- Actualización APK sobre una instalación existente preserva datos **con misma firma**; no forzar reinstalación.

Checks automáticos actuales: `v2-foundation-check.yml`, `audit:guard`, pruebas de media cerrado y protección de Service Worker, build PWA, export Android, tests de sesión/Worker y health. Complementarlos con pruebas WebView de puente, pruebas E2E del Chat y checks de versionado. **CI verde no equivale a prueba física completa.**

# 16. MIGRACIÓN ORDENADA A ANDROID HÍBRIDO

**El estado actual aún renderiza Chat con React Native en Android; esto es provisional.** No marcar la arquitectura final como desplegada hasta efectuar los pasos siguientes.

### Etapa H1 — Línea base y protección de datos

1. Identificar APK V2 instalada, `com.havananice.v2`, versión, firma y almacenamiento existente.
2. Registrar estado y formato de `expo-sqlite/kv-store` para sesión, borrador y cola; localizar datos que NO pueden perderse.
3. Guardar evidencia de rendimiento/gestos actuales como referencia.
4. Mantener APK existente operativa y rama `main` intacta. Nunca pedir desinstalación por migrar tecnología visual.

### Etapa H2 — Contenedor híbrido mínimo

1. Incorporar WebView al proyecto Expo/React Native **manteniendo package ID y firma**; crear shell y fallback local para arranque sin red.
2. Mostrar la PWA V2 de Pages dentro del contenedor, con navegación y back correctos.
3. Definir handshake/versión de bridge, lista de origen permitido, permisos y fallback web.
4. Comprobar acceso por nombre, carga, reconexión, scroll, teclado, caché y retorno en Android, sin tocar producción.
5. No habilitar todavía cámaras, FCM o bridge de archivos si no se necesita para cerrar la prueba.

### Etapa H3 — Sesión y caché sin pérdida

1. Migrar de forma segura el token de SQLite actual al nuevo modelo de credencial protegida/dispositivo autorizado; evitar que la PWA se registre como otra persona por perder sesión.
2. Migrar o reconciliar borrador/cola pendientes, conservando los IDs y evitando envíos duplicados.
3. Hacer que una única capa sea propietaria del socket del Chat; no ejecutar simultáneamente el viejo Chat RN y el nuevo Chat PWA.
4. Probar actualización sobre app instalada, apagado total del proceso, retorno, pérdida de conexión y permiso revocado.
5. Confirmar con el usuario funcionamiento idéntico en Android e iPhone antes de retirar el código visual nativo antiguo.

### Etapa H4 — Chat PWA como única interfaz

1. Afinar gestos de Chat PWA sobre WebView e iPhone: swipe reply, long press, emojis, editar/borrar y viewer.
2. Igualar apariencia, teclado, accesibilidad, safe areas y rendimiento con pruebas físicas.
3. Eliminar **solo después de confirmar equivalencia** `App.tsx`/componentes RN de renderizado de mensajes que queden obsoletos; conservar shell, módulos Android y migrador de datos si aún se necesitan.
4. Mantener la versión anterior recuperable durante el periodo de comprobación.
5. Reorganizar módulos visuales en la PWA y profundizar en Admin, Calendario y Repertorio sin duplicación.

### Etapa H5 — Núcleo Android especializado

Añadir progresivamente FCM y servicios nativos de cámara/archivos/seguridad cuando cada módulo los requiera, documentando claramente por qué una función no puede resolverse con las capacidades web existentes. Estas mejoras sí pueden necesitar una APK nueva, en paquetes planificados y no por retoques estéticos.

# 17. PLAN DE IMPLEMENTACIÓN DE MÓDULOS

El orden vigente evita extender una arquitectura temporal:

1. **Fundación V2** — cerrada.
2. **Chat de texto y sesiones** — conservar estado actual de funcionamiento; pruebas finales de gestos/reconexión/borrado.
3. **Arquitectura híbrida H1–H4** — siguiente frente prioritario; una UI PWA compartida también en Chat Android, sin sacrificar historial ni datos.
4. **Seguridad de acceso** — aprobación y revocación de dispositivos/roles, primero API y después pantalla Admin compartida.
5. **Chat fotografías** — solo al tener puente privado de almacenamiento probado con costo 0.
6. **Chat videos/audio + viewers** — por capacidades separadas, siempre dentro de cuotas.
7. **Push Android e iPhone** — una lógica de eventos y dos transportes del sistema.
8. **Home y ajustes** — PWA compartida.
9. **Calendario y repertorios generales/por evento** — PWA compartida, sincronización con Admin.
10. **Notificaciones internas, perfiles/Familia HAVANA NICE, Admin completo** — PWA con permisos por rol.
11. **Pulido final, auditoría de integridad y pruebas extremo a extremo**.
12. **Migración gradual desde la app actual solo cuando V2 esté aprobada**, con respaldos y sin cortar el servicio de producción.

No abrir capacidades que compliquen la arquitectura mientras H1–H4 no estén estables. Se puede investigar sin desplegar, pero se integra verticalmente y se valida antes de pasar al siguiente módulo.

# 18. ESTADO REAL VERIFICADO — 26 DE OCTUBRE DE 2026

## 18.1 Código y plataformas

- La rama V2 contiene app Android Expo/React Native que **todavía dibuja Chat nativo de laboratorio** y una PWA React que **dibuja Chat web**. El unificado visual Android WebView está **aprobado como arquitectura, NO implementado**.
- Android usa almacenamiento `expo-sqlite/kv-store`; PWA usa IndexedDB. Existe cola offline y conservación de borrador por dispositivo. La migración al contenedor debe preservar el acceso ya instalado.
- El usuario confirmó recientemente que el acceso por nombre quedó funcionando. Son seis nombres iniciales. El módulo visual de autorizaciones de Admin V2 no existe.
- Chat texto, realtime, reply, reacciones, edición/borrado, búsqueda e historial paginado están programados y se probaron parcialmente con ambos clientes. UI gestual contextual y reconexión cruzada completas requieren pruebas específicas tras la migración.
- FASE 0 aprobada con arranque autónomo Android; problemas iniciales de Metro y WebSocket fueron corregidos en iteraciones previas. No volver a usar debug APK sin bundle.
- Fotografías reales, video/audio, push, Home avanzado, calendario, repertorio y Admin V2 no están completos.

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
- Los cambios solo de PWA se publican por Pages y **no ejecutan un build nativo**.

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

1. Leer este Plan Maestro único y comprobar estado real en GitHub/Cloudflare.
2. Elegir una capacidad pequeña y vertical; preservar producción.
3. Preparar migraciones retrocompatibles si cambian esquemas/almacenamiento.
4. Implementar una sola solución reutilizable; verificar seguridad y 0 MXN.
5. Ejecutar pruebas de código, endpoint, PWA y, cuando corresponda, APK/bridge Android.
6. Actualizar una versión sin perder sesión, cola, historial ni formato de datos.
7. Obtener confirmación física de Android/iPhone cuando sea indispensable.
8. Consolidar los resultados **editando este mismo documento**, sin notas contradictorias, “planes alternos”, listas paralelas de decisiones ni anexos duplicados.

## Punto de continuación actual

**El siguiente paso de desarrollo es H1 → H2: preparar un contenedor Android WebView de la PWA de V2 sin perder la sesión, la cola offline ni la firma de la app actual.** Mantener intacta la última APK que funciona hasta contar con una alternativa validada. Después completar H3 → H4 y continuar con la seguridad del módulo Admin.

Esta es la arquitectura única desde la cual se deben interpretar todas las tareas siguientes. Las decisiones anteriores incompatibles —dos interfaces visuales paralelas, Chat con UI nativa permanente en Android, R2, claves temporales de laboratorio y construcción de una APK por cambios estéticos— quedan sustituidas por lo aquí definido. Su registro histórico permanece accesible mediante los commits de Git, pero **no son instrucciones vigentes**.
