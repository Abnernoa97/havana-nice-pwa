# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Auditoría cruzada y consolidación: 29 de octubre de 2026.**  
**Fuente de desarrollo única:** repositorio `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`.  
**Tablero inalterado:** **12/27 hitos cerrados (44,4 %) · 15 abiertos**.  
**Estado:** Chat/Administrador base conservados; ocho tareas de saneamiento ejecutadas. Android 0.0.10 firmado, publicado y disponible; QA físico y contrato R2 todavía pendientes.  
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

### «Un solo main»: interpretación técnica correcta

Actualmente el **único código fuente V2** se desarrolla en `havana-nice-v2-foundation`. La rama predeterminada del repositorio compartido aún se llama `main` y pertenece a una etapa histórica que está fuera de alcance; `havana-nice-v2-apk-downloads` contiene **binarios, no código fuente alternativo**.

**No renombrar ni borrar `main`, ni cambiar a ciegas la rama predeterminada del repositorio:** podría afectar sistemas anteriores. La meta es una **sola rama CANÓNICA de desarrollo de V2**, un único proceso de entrega y una versión instalada vigente. Cambiar el default de GitHub solo si se demuestra que no altera la aplicación histórica y existe autorización específica. Ningún cambio de infraestructura es necesario para reconocer la rama V2 como única fuente.

## 2. Estado comprobado en la auditoría

| Sistema | Hecho verificado | Estado |
|---|---|---|
| Código de V2 | 82 archivos bajo la rama canónica; pruebas generales del commit `177ac4eb23ed` aprobadas | **En orden** |
| Cloudflare Worker | `havana-nice-v2-dev`, sin Service Binding externo | **En orden** |
| Configuración runtime Worker | Cinco bindings: `CHAT_ROOMS`, `DB`, `HAVANA_ENV`, `V2_ADMIN_LOGIN_MODE`, `V2_ADMIN_LOGIN_SECRET` | **Publicado; fuente sincronizada** |
| D1 | 11 tablas actuales, sin `chat_cloud_*` ni tablas multimedia antiguas | **En orden** |
| Datos Chat | 44 mensajes, 3 músicos con modo de dispositivo único, 3 sesiones, 12 reacciones | **Conservados** |
| Administrador | 28 filas históricas de sesión, 21 revocadas; ninguna vigente según el reloj servidor en la consulta | **Depuración completada: 0 sesiones antiguas** |
| PWA de V2 | Despliegue confirmado del commit `177ac4eb23ed` | **Publicado** |
| Android 0.0.10 | Compilación APK y prueba general GitHub **exitosas**; mismo paquete/versionCode 10 | **Compilado** |
| Entrega 0.0.10 | Workflow de enlace directo **falló** al consultar GitHub con `unexpected EOF`; no se confirmó instalación en teléfono | **Pendiente** |
| R2 | API de cuenta devolvió `403/10042`: servicio sin activar | **No iniciado** |
| Supabase | Sin implementación activa en V2 | **No incorporar** |
| Conexión a HAVANA CLOUD | Código del puente y tablas V2 retirados; no figura en el Worker actual | **Cerrada la retirada** |

**No confundir** una compilación correcta o un despliegue PWA exitoso con QA físico aprobado de Android, video o reproducción. El Chat de texto y el acceso de músicos deben conservarse.

## 3. Auditoría contra los 27 hitos — tablero oficial

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
- [x] **S02** — Una instalación por músico, con alerta de acceso duplicado. **Auditoría:** los 3 músicos usan `single_device_mode=1`; la excepción de acceso heredado ya se eliminó y se publicó en el Worker.

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
- [ ] **Q01** — QA integral Android/PWA/Admin: firma, actualización sobre instalada, sesión, reconexión, caché, privacidad y reproducción. **Debe absorber las pruebas del saneamiento y de M01/M02.**
- [ ] **Q02** — Paso a producción después de autorización y QA completos.

**TOTAL INALTERADO: 12/27.** Saneamiento transversal: **8/10 tareas ejecutadas**; contrato R2 y QA físico pendientes. Ninguna tarea de limpieza siguiente es un hito 28 ni reemplaza el tablero original.

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
- [ ] **S-H — Contrato de multimedia futuro:** mantener temporalmente las vistas de fotos/video ya aprobadas pero no las antiguas subidas. Diseñar **un único contrato de subida, lectura y borrado R2** para los tres clientes, evitando adaptadores adicionales y eliminando referencias técnicas cuando sean sustituidas. Esto se implementará dentro de M01/M02/M04, una vez saneado el resto.
- [ ] **S-I — QA de salida de saneamiento:** CI general en verde, PWA publicada, un solo flujo de APK confirmado, actualización in-place sin pérdida de sesión, login Admin y Chat, un músico por dispositivo, WebSocket, y D1/Worker sin residuo externo. **No instalar/desinstalar por comodidad de pruebas.**

### Orden obligatorio y dependencias

**Primero:** S-A, S-C, S-E, S-F — ya ejecutadas y validadas en la fuente.  
**Segundo:** S-B y S-B2 — ejecutadas, publicación y dos binarios verificados.  
**Tercero:** S-D y S-G — ejecutadas; S-I permanece abierto hasta QA y distribución comprobada.  
**Cuarto:** cuando todo lo anterior esté confirmado, el propietario habilita R2 y comenzamos M01 → M02 → M04 de forma simultánea en Android nativo/PWA/Admin. M03/M05 permanecen aplazados según el plan.

## 5. Reglas de finalización y preservación

- Solo cerrar hitos con evidencia del código, despliegue y, cuando proceda, prueba física del usuario. El CI en verde no demuestra por sí mismo reproducción multimedia ni actualización correcta en teléfono.
- Ninguna limpieza debe borrar mensajes de texto, músicos, acceso único, sesiones válidas, administrador, ajustes locales ni la firma Android.
- Una rama de **binarios** no es una rama de desarrollo; el objetivo final es **una sola fuente**, un pipeline reproducible y una descarga vigente.
- No renumerar ni editar migraciones aplicadas de D1 por estética. Los huecos históricos no son por sí solos código duplicado.
- No confundir `/visual.html` y `/admin.html` con otra API o backend. Pueden tener varias entradas visuales y seguir siendo **un solo sistema**.
- No reactivar Supabase ni conexión alguna con el almacenamiento externo anterior. No inventar una R2 activada antes de comprobarlo.

## 6. Próxima decisión operacional

**Bloque actual: S-I (prueba física de actualización Android, Chat/Admin/sesiones) y S-H (contrato R2).** El flujo Android ya tiene un único instalador vigente con firma comprobada. Mantener 12 hitos cerrados hasta QA real.

Tras ello: activar R2 Standard privado dentro de la misma cuenta Cloudflare y desarrollar M01/M02/M04 sin migrar archivos de prueba.
