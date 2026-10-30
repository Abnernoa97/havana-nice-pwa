# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Auditoría cruzada: 29 de octubre de 2026. QA funcional del Chat confirmado por el propietario el 29 de octubre de 2026 (hora de México).**  
**Fuente de desarrollo única:** repositorio `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`.  
**Tablero único ampliado por decisión del propietario (30/10/2026):** **12/36 hitos cerrados (33,3 %) · 24 abiertos**. Nueve hitos A01–A09 nuevos para modularidad y aislamiento; los 27 anteriores conservan sus identificadores y estado.  
**Estado:** Chat Android/PWA/Administrador probado físicamente en texto, sincronización, reconexión, cola offline y bloqueo duplicado. Saneamiento 10/10 cerrado; Android 0.0.11 firmado e instalado sobre 0.0.10; HOME y Chat reconocidos en capturas y confirmados por el propietario. QA integral Q01 permanece abierto para módulos todavía no implementados, pruebas físicas adicionales y multimedia. R2 todavía no habilitado. **Protección de tipos del Worker V2 completada:** se retiró `@ts-nocheck`, se tiparon las interfaces y el CI ahora impide recuperar la supresión, con suite [41010325277](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41010325277) aprobada; no se desplegó Worker ni nueva APK.  
**Documento auxiliar:** [CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md) es únicamente una bitácora de estado y relevo; **este archivo es el único plan de decisiones, hitos y prioridades**.

## 1. Objetivo y arquitectura que no se negocian

Una sola línea de código y una sola infraestructura V2, sin variantes, copias de funciones, puentes a otros proyectos ni parches ocultos.

- **Android:** Chat 100 % React Native nativo, sin WebView ni sustitución PWA de su mensajería. Identificador firmado `com.havananice.v2`; las actualizaciones se instalan encima de la aplicación existente, preservando sesión y caché.
- **iPhone / navegador:** PWA para Chat y presentación visual. `/visual.html` es por ahora una maqueta de módulos no-Chat, **no una segunda aplicación con permisos, autenticación ni datos duplicados**.
- **Administrador:** una superficie administrativa PWA `/admin.html`, con acceso a músicos y Chat general que utilizan **el mismo** backend y la misma base D1. No crear un segundo Chat ni otra base.
- **Backend único:** Worker `havana-nice-v2-dev` + D1 `havana-nice-v2-dev` + Durable Object `CHAT_ROOMS`; código compartido de contratos en `v2/packages/shared`.
- **Archivos futuros:** R2 privado directamente, solo tras activación por el propietario. Nunca reutilizar el puente ya descartado ni migrar archivos multimedia de laboratorio.
- **Límite estricto:** trabajar **solo en V2**. No modificar la aplicación original, su rama histórica `main`, el repositorio o Worker de HAVANA CLOUD, ni los demás proyectos de la cuenta. No desinstalar Android ni restablecer datos locales para limpiar código.
- **Una sola verdad documental:** este Plan Maestro define dirección y prioridades; Continuidad registra evidencias y el estado de la última intervención; README apunta a ambos sin repetir instrucciones contradictorias.

### REGLA PERMANENTE APROBADA · Módulos independientes reunidos en HOME (30/10/2026)

- [x] **Decisión arquitectónica autorizada:** cada sección se desarrolla, se prueba, se documenta y se mantiene como **módulo funcional independiente** (Chat, Calendario, Repertorio, Músicos, Avisos, Ajustes y los siguientes que se autoricen). Una sola aplicación V2 los reúne mediante **HOME**, que únicamente coordina acceso y navegación; no debe contener la lógica interna de cada módulo.
- **INDEPENDENCIA DE MÓDULOS, NO DE SESIONES DE LOGIN:** existe **una sola entrada de músico autorizada por Administrador**, un único token/restauración y un vínculo de dispositivo. No crear registros, claves, sesiones, servidores, bases ni APK independientes por pestaña. El Administrador conserva su autorización privilegiada ya implementada. La palabra «independiente» describe lógica, estado de pantalla, APIs y tests del módulo, no otra identidad.
- **Límites técnicos obligatorios:** cada módulo tendrá su propio componente de interfaz y, cuando corresponda, adaptador de API, validadores, rutas del Worker, tablas/registros D1 y pruebas. Puede compartir contratos, autenticación, utilidades visuales y backend existentes, **pero no copiar ni modificar la lógica de otro módulo para funcionar**. El backend es uno y cada módulo se incorpora como ruta/handler aislado.
- **HOME estable y pequeña:** listar y abrir módulos usando `packages/shared/src/memberModules.ts`; sin guardar eventos, mensajes, canciones o avisos dentro de HOME; sin duplicar menús, pantallas, secretos ni conexiones. El Chat Android permanece 100 % React Native nativo. La presentación PWA para los módulos no-Chat se unifica **después** de completar su funcionalidad, manteniendo la misma HOME lógica.
- **Contención de errores:** al fallar un módulo, mostrar error y opción de reintento **en su sección**, permitir salir a HOME y seguir utilizando las demás. Un fallo de Calendario no debe cerrar sesión, limpiar caché del Chat, revocar el nombre o impedir el acceso a Repertorio. Los efectos/sondeos/solicitudes se limpian al desmontar cada módulo; evitar estados globales ajenos. Reconocer el límite: compartimos proceso/app/Worker/D1, por lo que **no existe garantía de aislamiento absoluto ante una caída de infraestructura común**.
- **Control desde Administración:** cada módulo funcional tendrá su propia sección de gestión en el Administrador, con permisos adecuados. Los músicos nunca obtienen permisos Admin por abrir HOME. Administrador ↔ módulo de músico se verifica con el **mismo backend V2**.
- **Criterio para tachar un hito:** funcionamiento y permisos reales, pruebas automáticas de regresión del módulo + Chat/acceso, integración HOME y Administrador cuando aplique, y prueba física donde sea necesaria. No considerar «terminado» un botón, maqueta, compilación o contrato aislado. El código provisional sustituido se **elimina físicamente** tras verificar su sustituto; conservar pruebas vigentes y migraciones históricas por seguridad.
- **Orden de avance:** terminar **Calendario P02** y aislamiento A03, después Repertorio P03/A04 y cada módulo sucesivo; diseño final y capa visual compartida al final. Se permiten más de 36 hitos solo cuando aporten una función o protección concreta, **dentro de este mismo tablero**, sin abrir un plan paralelo.


### «Un solo main»: interpretación técnica correcta

Actualmente el **único código fuente V2** se desarrolla en `havana-nice-v2-foundation`. La rama predeterminada del repositorio compartido aún se llama `main` y pertenece a una etapa histórica que está fuera de alcance; `havana-nice-v2-apk-downloads` contiene **binarios, no código fuente alternativo**.

**No renombrar ni borrar `main`, ni cambiar a ciegas la rama predeterminada del repositorio:** podría afectar sistemas anteriores. La meta es una **sola rama CANÓNICA de desarrollo de V2**, un único proceso de entrega y una versión instalada vigente. Cambiar el default de GitHub solo si se demuestra que no altera la aplicación histórica y existe autorización específica. Ningún cambio de infraestructura es necesario para reconocer la rama V2 como única fuente.

## 2. Estado comprobado en la auditoría

| Sistema | Hecho verificado | Estado |
|---|---|---|
| Código de V2 | Rama canónica `havana-nice-v2-foundation`; último commit comprobado `bf0b268`; suite GitHub [40975170083](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40975170083) aprobada | **En orden** |
| Cloudflare Worker | `havana-nice-v2-dev`, sin Service Binding externo | **En orden** |
| Configuración runtime Worker | Cinco bindings: `CHAT_ROOMS`, `DB`, `HAVANA_ENV`, `V2_ADMIN_LOGIN_MODE`, `V2_ADMIN_LOGIN_SECRET` | **Publicado; fuente sincronizada** |
| D1 | 11 tablas de aplicación, sin `chat_cloud_*` ni tablas multimedia antiguas; datos de texto y vínculos conservados | **En orden** |
| Datos Chat | 47 mensajes, 3 músicos autorizados, 3 sesiones y 3 vínculos de instalación; 2 alertas duplicadas registradas en consulta posterior a QA | **Conservados** |
| Administrador | 28 sesiones históricas vencidas/revocadas retiradas durante saneamiento; nueva sesión real autenticada y Chat general revisado visualmente | **Validado en Chat y acceso** |
| PWA de V2 | Despliegue `success` de `bf0b268`; bloqueo de nuevo acceso duplicado probado físicamente en navegador | **Publicado y probado para acceso** |
| Android 0.0.10 | APK firmada, `versionCode 10`, instalación sobre la anterior confirmada; Chat probado en red/offline/reconexión | **Instalado y probado para Chat** |
| Entrega 0.0.10 | Workflow único de publicación [40963966950](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40963966950) en `success`; instalación confirmada por el propietario | **Confirmada** |
| R2 | API de cuenta devolvió `403/10042`: servicio sin activar | **No iniciado** |
| Supabase | Sin implementación activa en V2 | **No incorporar** |
| Conexión a HAVANA CLOUD | Código del puente y tablas V2 retirados; no figura en el Worker actual | **Cerrada la retirada** |

**No confundir** una compilación correcta o un despliegue PWA exitoso con QA físico aprobado de Android, video o reproducción. El Chat de texto y el acceso de músicos deben conservarse.

## 3. Tablero único V2 — 36 hitos oficiales (27 originales + 9 de arquitectura modular)

### Fundación y Chat: 9 de 9 cerrados

- [x] **B01** — Fundación V2 aislada con repositorio/Worker/D1/DO/clientes. **Auditoría:** arquitectura canónica correcta; pendiente de higiene de ramas y entregables en Saneamiento S-A.
- [x] **B02** — Chat básico de texto Android ↔ PWA. **Auditoría:** persisten 44 mensajes de texto y la misma API.
- [x] **B03** — Nombre autorizado y sesión persistente. **Auditoría:** existen 3 músicos y 3 sesiones; conservar identidad/credenciales.
- [x] **B04** — Auditoría preventiva, estabilidad y CI. **Auditoría:** suite principal exitosa; no implica que la publicación de la APK también lo sea.
- [x] **C01** — Menú contextual, reacción y acciones. **Proteger** interfaz aprobada y las 12 reacciones existentes.
- [x] **C02** — Edición y eliminación canónica de mensajes. **Proteger** un único método de borrado y los permisos.
- [x] **C03** — Responder deslizando. **Proteger** sin recrear componentes.
- [x] **C04** — Offline, borradores y reconexión. **Proteger** caché local y reintentos.
- [x] **C05** — Sincronización bidireccional del Chat. **Proteger** WebSocket/DO y reconciliación.

### Android y seguridad: 3 cerrados, 3 abiertos

- [x] **H01** — Base nativa firmada con actualización sobre la anterior. **Auditoría:** el principio y la firma se preservan; **distribución 0.0.10 publicada y comprobada: versionCode 9→10, firma igual**, cubierta por S-B/Q01, sin reabrir la base ya aprobada.
- [ ] **H02** — Módulos no-Chat con PWA solo como capa visual Android. **Auditoría:** `visual.html` es una maqueta sin datos reales.
- [ ] **H03** — Navegación, sesión y persistencia entre módulos. **Auditoría:** implementación completa pendiente.
- [ ] **H04** — Actualización del aspecto visual PWA sin reinstalar Android. **Auditoría:** validación de actualización y caché pendiente.
- [x] **S01** — Altas y bajas de músicos desde Administrador. **Auditoría:** sesión administrativa separada; configuración no secreta de despliegue alineada en S-C.
- [x] **S02** — Una instalación por músico, con alerta de acceso duplicado. **Auditoría:** 3 registros de `chat_single_device_owners` coinciden con las 3 sesiones válidas. La columna histórica `single_device_mode` fue eliminada de D1. El rechazo PWA de un nombre ya vinculado y la nueva alerta en Administrador se comprobaron en dispositivo real.

### Multimedia: 0 de 5 cerrados

- [ ] **M01** — Fotos originales privadas en Android/PWA/Admin con R2 directo. **Auditoría:** sin almacenamiento activo ni migración.
- [ ] **M02** — Videos originales privados con R2 directo, carga reanudable y lectura Range. **Auditoría:** sin almacenamiento activo.
- [ ] **M03** — Audio, aplazado; micrófono solo informativo.
- [ ] **M04** — Visor de fotos/videos completo y rápido. **Auditoría:** las superficies visuales `ChatMediaView` / `NativeChatMediaView` permanecen, pero aún mencionan las rutas `/api/chat/media/:id/grant`; son contratos de visor que deben diseñarse/actualizarse con R2, **no un puente activo**. Conservar el aspecto aprobado de fotografía y resolver video nativo.
- [ ] **M05** — Push real con aplicación cerrada.

### Módulos y QA: 0 de 7 cerrados

- [ ] **P01** — Home y configuración real.
- [ ] **P02** — Calendario, eventos, horarios y vestuario.
- [ ] **P03** — Repertorio, canciones y versiones por evento.
- [ ] **P04** — Administrador completo. **Parcial:** accesos, seguridad y Chat general sí existen; calendario/repertorio/más siguen pendientes.
- [ ] **P05** — Avisos y perfiles reales.
- [ ] **Q01** — QA integral Android/PWA/Admin: firma, actualización sobre instalada, sesión, reconexión, caché, privacidad y reproducción. **Pruebas reales ya superadas:** login Admin, Chat histórico, mensaje Android→Admin, red interrumpida/reconexión, envío offline único y PWA bloqueada por dispositivo duplicado con alerta Admin. **Abierto:** alcance integral incluye otras superficies, dos teléfonos independientes y multimedia M01/M02/M04 todavía inexistente; no cerrar antes.
- [ ] **Q02** — Paso a producción después de autorización y QA completos.

**TOTAL VIGENTE: 12/36 cerrados, 24 abiertos.** Los 27 hitos originales permanecen; se añaden nueve hitos A01–A09 sin crear otro tablero. Saneamiento transversal: **10/10 tareas cerradas**. La parte de Chat de Q01 tiene evidencia real Android/PWA/Admin; **Q01 integral sigue abierto** hasta completar las funciones pendientes. M01/M02/M04 todavía no están implementados. No introducir más hitos ni tableros paralelos.

### Aislamiento modular, navegación y prevención de fallos — 0 de 9 cerrados

- [ ] **A01 — Entrada única + HOME orquestadora:** contrato explícito de módulos, HOME únicamente navegación, misma sesión de músico para todas las secciones, sin segundo login ni nueva sesión por módulo. **Parcial:** HOME/Chat ya probados en Android 0.0.11; faltan guardias automáticas integrales.
- [ ] **A02 — Chat autónomo y protegido:** motor nativo Android, PWA y vista Administrador aislados del ciclo de vida de otros módulos; nunca desmontar Chat por entrar al Calendario ni restablecer borradores/cola/sesión. **Parcial:** Chat nativo y HOME funcionan; falta prueba de fallo provocado de otro módulo.
- [ ] **A03 — Calendario aislado de Chat y otras secciones:** acordeón del músico + CRUD exclusivo de Administración + asignación privada por fecha, consultas y errores propios, sin tocar tablas/estado del Chat. **Parcial:** fuente, D1 y API ya implementadas; pendiente QA real Admin → móvil, navegación y error de red.
- [ ] **A04 — Repertorio autónomo:** propio módulo, catálogo, listas por evento, edición Admin, API/contratos y permisos separados del Chat y Calendario; integración HOME al finalizar.
- [ ] **A05 — Músicos autónomo:** ficha/lista del equipo y datos pertinentes, Administración como única autoridad; no duplicar el sistema existente de acceso/vínculo del nombre.
- [ ] **A06 — Avisos autónomo:** creación y gestión desde Administración, destinatarios y consulta seguros, sin interferir con notificaciones/Chat.
- [ ] **A07 — Ajustes autónomo:** preferencias y datos permitidos del músico con almacenamiento apropiado, sin pantalla alternativa de autenticación ni opción de liberar dispositivos.
- [ ] **A08 — Contención de errores y ciclo de vida:** fallbacks por sección, reintento, navegación a HOME, aislamiento de errores de renderizado/carga y limpieza de suscripciones; pruebas de desconexión y errores sin perder Chat.
- [ ] **A09 — Pruebas de arquitectura por módulo en CI:** tests de fronteras e importaciones, rechazo de login/servidor/copia del Chat en otros módulos, smoke de APIs independientes, verificación Admin↔músico y regresión automática de los módulos aprobados; mantener una sola cadena de APK.

**Medición:** estos nueve hitos son adicionales y no equivalen a nueve aplicaciones o sesiones nuevas. Regla anterior marcada [x] como decisión aprobada; ninguno de los nueve se cierra sin cumplir los criterios de ejecución arriba.

**Primera barrera automática ya implementada:** `v2/tests/module-boundaries.test.mjs` y el paso `Enforce modular isolation and single shared access` del CI [41097569931](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41097569931) `success`. Verifica la misma lista de módulos en HOME, ningún login independiente, Calendario sin operaciones del Chat, lectura de músico frente a escritura de Administrador y la ruta compartida. Es un avance de A01/A02/A03/A09, **no basta para cerrar ninguno**: faltan contención de errores real, módulos siguientes y QA en dispositivos.

## 4. Fase prioritaria: SANEAMIENTO TRANSVERSAL DE V2

**Objetivo:** resolver la auditoría ANTES de integrar R2. Esta es una lista operativa dentro de B01/B04/H01/S01/S02/Q01, **no una nueva versión ni un plan paralelo**. Cada casilla solo se marca con evidencia, nunca por intención.

- [x] **S-A — Una sola línea de fuente:** formalizar `havana-nice-v2-foundation` como **única fuente V2**; mantener aislada la rama histórica `main`. No crear más ramas de trabajo ni migrar/reposicionar V1. Revisar configuración y documentación que aún confunde `main` con la fuente actual.
- [x] **S-B — Una cadena Android:** workflow único `v2-android-apk.yml` **exitoso**, ejecución [40963966950](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40963966950). APK 0.0.10 `com.havananice.v2` firmada; el control comparó certificados y confirmó `versionCode 9 → 10`. La URL estable `HAVANA-NICE-V2-LATEST.apk` respondió HTTP 200. **La instalación real sobre 0.0.9 se valida en S-I/Q01.**
- [x] **S-B2 — Depuración de binarios:** la rama `havana-nice-v2-apk-downloads` pasó de **24 APK (≈1,78 GB) a exactamente 2 APK (≈154 MB)**: `HAVANA-NICE-V2-LATEST.apk` y `HAVANA-NICE-V2-PREVIOUS.apk`, verificado en el árbol Git. La limpieza se hizo únicamente en el HEAD de la rama de distribución; los objetos de commits históricos pueden seguir existiendo.
- [x] **S-C — Configuración reproducible del Worker:** `wrangler.jsonc` ya declara `V2_ADMIN_LOGIN_MODE=enabled` y el secreto sigue exclusivamente en Cloudflare; las pruebas de fuente impiden divergencias. Verificar nuevamente al desplegar R2.
- [x] **S-D — Autenticación sin reglas históricas paralelas:** se retiró la excepción `single_device_mode=0`, el inicio de sesión sin dueño y la ruta de salida heredada de músicos. El Worker final está desplegado con un único control de instalación. **No se eliminaron sesiones de músico.**
- [x] **S-E — Retirar automatizaciones de una sola ejecución:** `expo-video@58.0.12` y el lock están fijados. Eliminado físicamente `.github/workflows/v2-media-deps-once.yml`; las pruebas prohíben su reaparición.
- [x] **S-F — Documentación y pruebas congruentes:** corregir `v2/README.md` ya informa los músicos y sesiones reales; se eliminó `v2/tests/cross-platform/README.md` por ser una guía vacía. El Plan Maestro es la única fuente de decisiones; Continuidad solamente registra evidencias.
- [x] **S-G — Higiene de D1 y sesiones:** aplicar una política prudente de caducidad para `chat_admin_sessions` (28 filas históricas, 21 revocadas, 28 vencidas): se eliminaron las 28 mediante filtro de vencimiento/revocación; quedaron 0 sesiones Admin, 3 músicos, 3 sesiones de músicos y 44 mensajes.
- [x] **S-H — Contrato único multimedia R2 (DISEÑO, no implementación):** definido más abajo para Android nativo, PWA y Admin. Una sola API en el Worker V2, un bucket privado, un registro D1, sin otros Workers ni puentes. **M01/M02/M04 siguen abiertos hasta implementar y probar.**
- [x] **S-I — QA de salida de saneamiento (confirmación de actualización del propietario; QA integral Q01 abierto):** CI general en verde, PWA publicada, un solo flujo de APK confirmado, actualización in-place sin pérdida de sesión, login Admin y Chat, un músico por dispositivo, WebSocket, y D1/Worker sin residuo externo. **No instalar/desinstalar por comodidad de pruebas.**

### Contrato único de archivos aprobado para construcción — S-H

**Diseño previo, aún sin R2 activo.** Este bloque forma parte del mismo Plan Maestro; no es un proyecto ni servicio independiente.

**Una ruta de datos:** Android nativo / PWA / Administrador → **Worker V2 existente** → bucket **R2 privado** con binding `CHAT_MEDIA_R2`; metadatos y permisos solamente en **D1 V2**. Sin enlaces con otras aplicaciones; sin API de almacenamiento paralela, Dropbox, Google Drive, Supabase ni segundo Worker.

**Una sola entidad:** tabla nueva `chat_media_objects` (nueva migración, nunca reutilizar las tablas del puente eliminado), con ID opaco, actor, ID de mensaje/cliente para idempotencia, clave privada R2, tipo, MIME, tamaño, estado, marcas de tiempo y datos de carga reanudable. Estados `pending → ready` o `failed/aborted`. **No crear la burbuja definitiva antes de confirmar el objeto R2.**

**Un único contrato HTTP y una única autorización:**

| Endpoint del Worker V2 | Comportamiento |
|---|---|
| `GET /api/chat/media/status` | Configuración y límites que los clientes consultan al abrir el Chat; requiere sesión válida |
| `POST /api/chat/media/start` | Solicitud idempotente: validar miembro, clase, MIME, tamaño/cuota y registrar carga pendiente |
| `PUT /api/chat/media/:id/content` o `PUT /api/chat/media/:id/part/:number` | Original pequeño o partes reanudables de un video, respectivamente, con el **mismo** control de propietario |
| `POST /api/chat/media/:id/complete` | Verificar objeto/tamaño/tipo, finalizar multipart cuando corresponda, registrar estado ready y emitir el único mensaje/evento |
| `GET /api/chat/media/:id/grant` + `GET /api/chat/media/:id/file` | Acceso privado a fotos/videos por autorización corta y específica del archivo; soportar peticiones HTTP Range para reproducción y reanudación |
| `DELETE /api/chat/media/:id` | Borrado autorizado del original y metadatos, coordinado con el borrado canónico del mensaje, sin duplicar la moderación |

**Una política de uso:** máximo cinco adjuntos por envío según contratos compartidos, sin compresión de los originales. Videos multipart: partes iguales de al menos **5 MiB**, excepto la última; aplicar ciclos de vida para subidas incompletas. Límite de archivo y presupuesto de almacenamiento **se validan en servidor**, ajustados al nivel gratuito que efectivamente active el propietario; 10 GB de franquicia no significan almacenamiento ilimitado ni ausencia de cargos por excedentes.

**Una experiencia visual:** reutilizar los selectores Fotos/Video y visores aprobados, sin etiquetas técnicas, códigos ni texto superpuesto en miniaturas. Android usará su reproductor nativo; la PWA y el Administrador compartirán permisos y metadatos. Cachear localmente lo imprescindible, por archivo y con reglas de expiración; nunca guardar respuestas privadas de API indiscriminadamente en el Service Worker. Probar carga inmediata percibida, Range, miniaturas, fotos completas y renovación de autorizaciones.

**Reglas ante fallos:** deduplicar por ID de cliente, no publicar mensajes incompletos, permitir reanudar multipart, invalidar permisos tras revocación y reconciliar objetos R2 huérfanos sin borrar mensajes de texto. Tests de acceso, eliminación, cuotas, fallo de red y reproducción en Android/PWA/Admin. Ningún modo viejo quedará escondido detrás de flags.

**Referencia técnica:** [R2 multipart en Workers](https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/) y [límites por parte](https://developers.cloudflare.com/r2/objects/upload-objects/). **No implementar hasta que Cloudflare confirme R2 habilitado.**

### Orden obligatorio y dependencias

**Primero:** S-A, S-C, S-E, S-F — ya ejecutadas y validadas en la fuente.  
**Segundo:** S-B y S-B2 — ejecutadas, publicación y dos binarios verificados.  
**Tercero:** S-D y S-G ejecutadas; S-I se cerró con confirmación de actualización del propietario. Q01 conserva la validación integral.  
**Cuarto:** S-H ya definió la arquitectura única R2; cuando S-I esté validado y el propietario habilite R2, comenzamos M01 → M02 → M04 en Android nativo/PWA/Admin. M03/M05 permanecen aplazados según el plan.

## 5. Reglas de finalización y preservación

- Solo cerrar hitos con evidencia del código, despliegue y, cuando proceda, prueba física del usuario. El CI en verde no demuestra por sí mismo reproducción multimedia ni actualización correcta en teléfono.
- Ninguna limpieza debe borrar mensajes de texto, músicos, acceso único, sesiones válidas, administrador, ajustes locales ni la firma Android.
- Una rama de **binarios** no es una rama de desarrollo; el objetivo final es **una sola fuente**, un pipeline reproducible y una descarga vigente.
- No renumerar ni editar migraciones aplicadas de D1 por estética. Los huecos históricos no son por sí solos código duplicado.
- No confundir `/visual.html` y `/admin.html` con otra API o backend. Pueden tener varias entradas visuales y seguir siendo **un solo sistema**.
- No reactivar Supabase ni conexión alguna con el almacenamiento externo anterior. No inventar una R2 activada antes de comprobarlo.

### Protección de tipos V2 — 29 de octubre de 2026 (México)

- **Corregido en la fuente:** `v2/cloudflare/src/index.ts` ya no lleva `@ts-nocheck`. Añadidos contratos TS para D1, solicitudes, WebSockets, mensajes, respuestas y sesiones; `member-admin.js` declara por JSDoc los metadatos de dispositivo. `cloudflare/tsconfig.json` incluye los módulos JS con `allowJs: true`, pero `checkJs: false`: el compilador verifica la interfaz TS principal y resuelve esos imports; la validación estricta del código JS interno sería un trabajo distinto.
- **CI limpio y estable:** prueba final [41010325277](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41010325277) `success`, con `npm run typecheck`, seguridad, Admin, PWA y export Android. Se retiró la prueba diagnóstica temporal y quedó una comprobación permanente contra `@ts-nocheck`. No se modificó la firma ni publicó otra APK; el Worker remoto conserva la versión anterior.
- **Aviso pendiente de dependencias:** `npm ci` notificó 12 incidencias de seguridad en el árbol instalado (5 bajas, 2 medias y 5 altas); falta revisar su procedencia y alcance. No ejecutar `npm audit fix --force` de forma indiscriminada. No equivale a 12 vulnerabilidades explotables en el Worker público.
- **Prioridad posterior:** revisar dependencias antes de producción y avanzar con H02/H03, manteniendo el Chat nativo intacto. Esta mejora no cambia el total oficial de hitos.

### Revisión de dependencias y primera base de Calendario — 29 de octubre de 2026 (México)

- **Análisis reproducible V2:** `npm audit --json` ejecutado sin corregir ni actualizar paquetes, en [41010648961](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41010648961). Total: **12 avisos npm** (5 altos, 2 moderados, 5 bajos; ningún crítico). Paquetes relevantes: `undici` vía Miniflare/Wrangler, `zod` vía Expo CLI, `node-forge` y `deepmerge` indirectos. El mecanismo automático sugiere incluso retroceder Expo a 51, **prohibido hacerlo a ciegas** en la app Android Expo 58. Diagnóstico temporal retirado del workflow; no se alteraron las dependencias.
- **Calendario — base de datos aún SIN aplicar:** nueva migración aislada `0018_calendar_events.sql`. No modifica ninguna tabla del Chat. Los eventos contemplan fecha, zona horaria, llamados, llegada, show, fin, lugar, ciudad, vestuario, notas, estado y versión optimista.
- **Calendario — fuente aún SIN desplegar:** `cloudflare/src/calendar.js` es la única API prevista de eventos en el mismo Worker/D1 V2. Músicos autorizados pueden leer; Administrador autenticado puede crear y modificar. El contrato `packages/shared/src/calendar.ts` reutiliza el token V2 actual sin crear otra sesión ni backend.
- **Pruebas aisladas aprobadas:** [41011185017](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41011185017) `success`: validación de fechas y zona horaria, permisos, lectura Admin/miembros, escritura autorizada, concurrencia, TypeScript, seguridad del Chat, PWA y export de Android. Los errores de la primera ejecución se corrigieron antes de terminar; solo el último commit probado es la referencia.
- **Aún no completado:** integración de Calendario real en las pantallas de Administrador, PWA/Android; migración D1 en entorno real, despliegue seguro de la API y QA en dispositivos. **P02/H02/H03 siguen abiertos**. No presentar la creación del contrato como módulo terminado ni modificar la APK 0.0.10 antes de tener las pantallas y la navegación funcionales.

### HOME como destino del acceso existente — 30 de octubre de 2026 (México)

- **Regla aprobada:** el Administrador autoriza el nombre para entrar a **la aplicación**, no solo al Chat. La misma función `startNamedChatSession(name.trim())`, el mismo `restoreNamedChatSession`, el token actual, el vínculo único de instalación, y las claves locales quedan **sin cambios**; al reconocerse `session`, la navegación abre `home` de forma predeterminada.
- **Fuente implementada:** una sola configuración de módulos `packages/shared/src/memberModules.ts`; pantallas HOME de PWA usando `VisualApp.tsx` ya existente y capa de navegación React Native en `apps/android/NativeMemberHome.tsx`. La vista pública `visual.html` sigue exclusivamente de presentación y no puede entrar a Chat ni iniciar sesión.
- **Chat:** conserva su propia interfaz nativa en Android; PWA conserva el Chat existente. Al volver a HOME el Chat **se oculta, no se desmonta**, para mantener WebSocket, estado, borradores y cola offline. Entra y sale por un botón de navegación, sin iniciar una segunda sesión.
- **Módulos visibles:** Chat disponible; Calendario, Repertorio, Músicos, Avisos y Ajustes señalados como pendientes de datos reales. No confundir HOME navegable con funciones todavía inexistentes.
- **Pruebas V2:** suite [41012373606](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41012373606) **SUCCESS**, incluidas pruebas específicas de HOME, aislamiento de Admin, autenticación original, offline, Android export y PWA build. Cloudflare Pages publicó la fuente aprobada. **QA física de HOME→Chat aprobada por el propietario el 30/10/2026:** capturas de Inicio para Noa, historial de mensajes y conexión en vivo. El botón ‹ Inicio aparece en Chat; no se midió por separado la continuidad de borradores/WebSocket al navegar.**
- **Entrega nativa:** versión **0.0.11** / `versionCode 11` **compilada, firmada, compatible y publicada** por el flujo oficial [41012482568](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41012482568) (`success`), con mismo identificador `com.havananice.v2`, firma verificada frente a 0.0.10 y un APK anterior de respaldo. Descarga estable `HAVANA-NICE-V2-LATEST.apk` en rama de binarios. **Instalación física de la 0.0.11 y recorrido HOME→Chat confirmados por el propietario con dos capturas el 30/10/2026.**
- **H02/H03/P01 siguen abiertos:** HOME y navegación HOME→Chat ya tienen QA física favorable; restan la capa visual PWA no-Chat en Android, los módulos reales, y las pruebas integrales. El total oficial continúa en **12/36**.

### Calendario funcional V2 — 30 de octubre de 2026

- **Referencia (lectura exclusiva):** se estudiaron `calendar-v1.js`, `calendar-expand.js`, `calendar-navigation.js`, `calendar-recipients-v1.js` y `admin-calendar-accordion-v1.js` de `main`. Ningún archivo original ni su Supabase se modificó o reutilizó como backend V2.
- **Campos y experiencia:** acordeón por fecha con fecha, evento y venue; Google Maps siempre visible; al desplegar, llamada, prueba de sonido, llegada, show/fin, vestuario, detalles, contacto, teléfono, notas y estado. Permite horas expresadas como texto (`Por definir`), igual que la original.
- **Administrador real:** en el Administrador existente, pestaña Calendario, formulario para crear/editar/eliminar fechas y seleccionar destinatarios músicos activos; Todos/Ninguno y exclusión por defecto de músicos no seleccionados. Token de Admin permanece en memoria; no hay segundo acceso.
- **Privacidad:** una sola API `cloudflare/src/calendar.js` en el Worker V2; GET músico devuelve exclusivamente sus eventos asignados con `actor_id` del token ya autorizado. Admin autenticado puede leer y modificar. Cambios a fecha+destinatarios son D1 `batch` atómico con protección `version`/revision; eliminaciones con verificación de versión.
- **Base D1:** migración aditiva `0018_calendar_events.sql` aplicada a `havana-nice-v2-dev`: tablas `calendar_events` y `calendar_event_recipients`, 0 eventos iniciales; integridad de relaciones correcta, tres músicos, tres sesiones, tres dueños intactos.
- **Pruebas:** CI [41093711371](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41093711371) aprobada con tests reales de SQLite (destinatarios Noa/Fer, edición concurrente, borrado, validación). Worker verificado en Cloudflare como versión al 0 % mediante [41095998168](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41095998168) `success` y subido al **100 %** como versión `40f8eec3-cf4f-471c-a53c-bd9c381ed10f` conservando las cinco vinculaciones D1/DO/secretos y la versión anterior para reversión. Cloudflare Version URLs no funciona con Workers que implementan DO, por eso se usó `Cloudflare-Workers-Version-Overrides` (y se retiró el ensayo provisional).
- **Clientes:** PWA y Android comparten contrato `packages/shared/src/calendar.ts`. En PWA `CalendarAccordion.tsx` solo recibe token de sesión validada; Android `NativeCalendar.tsx` usa el mismo token y Chat React Native permanece completamente independiente. No se crearon datos ficticios ni se añadieron dependencias.
- **Entrega Android 0.0.12 confirmada en GitHub:** workflow oficial [41096311572](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41096311572) `success`: APK `com.havananice.v2` firmada y publicada en la rama exclusiva de instaladores; `SHA256SUMS.txt` de `HAVANA-NICE-V2-LATEST.apk` = `277587336cf7d478b41100b705105e7f6f0b67ec5ac94d5829c501d461bf7137`, y la 0.0.11 quedó como `PREVIOUS`. **Instalación física 0.0.12 y prueba de una fecha creada y asignada desde Admin todavía no confirmadas**. No cerrar P02/A03 sin esa QA; tablero **12/36**.
- **Limpieza:** eliminado físicamente el paquete de release temporal `v2/cloudflare/.worker-release-staging/worker.mjs`; workflow restaurado a `permissions:contents:read`, mantiene pruebas permanentes de API. No hay Worker o repositorio adicional ni cambios a `main`.

## 6. Próxima decisión operacional

**Saneamiento 10/10 cerrado; pruebas funcionales del Chat superadas.** No repetir QA de texto sin motivo; Q01 sigue abierto para funciones no implementadas. El siguiente trabajo es **QA del Calendario P02 + A03** en Administrador ↔ músico Android/PWA y pruebas de límites A09, conservando HOME↔Chat y la entrada única A01. H02 (capa visual PWA no-Chat en Android) sigue aparte, sin crear una segunda HOME ni reemplazar el Chat nativo. Priorizar estructura funcional y persistencia, no estética.

**R2 es otro frente pendiente, no un bloqueo a H02/H03:** cuando el propietario habilite R2 en la cuenta Cloudflare V2, retomar M01 → M02 → M04 usando únicamente el Worker/D1 existentes y el contrato aprobado. No crear una nube alternativa.
