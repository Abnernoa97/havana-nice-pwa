# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Corte de saneamiento y QA de Chat: 29 de octubre de 2026.** Este documento es una **bitácora técnica**, no otro plan. Los hitos, prioridades y casillas se controlan SOLO desde [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).

## Línea única V2

- Código fuente único: `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation`. No cambiar ni modificar la rama histórica `main`; la rama `havana-nice-v2-apk-downloads` contiene exclusivamente instaladores de distribución y no es una rama de código.
- Superficies previstas: Chat **Android 100 % React Native nativo**, PWA y Administrador web, compartiendo el **mismo Worker**, D1, Durable Object y contratos. `visual.html` es la representación visual no-Chat pendiente de integrar; no una app ni backend alternativo.
- Nunca volver a vincular otro proyecto como almacenamiento ni duplicar servicios. HAVANA CLOUD y otros productos no se han modificado.

## Avance comprobado

- **36 hitos oficiales desde el 30/10/2026:** 12 cerrados y 24 abiertos (27 originales + 9 de aislamiento modular A01–A09). **Saneamiento transversal: 10/10**, con confirmación del propietario de la actualización Android 0.0.10. Chat y Admin de texto tienen pruebas funcionales reales favorables; Q01 integral permanece abierto para los módulos no construidos, multimedia y QA físico adicional. S-H es únicamente el diseño del contrato de R2, NO su instalación.
- **S-C (config):** `v2/cloudflare/wrangler.jsonc` declara `HAVANA_ENV=development` y `V2_ADMIN_LOGIN_MODE=enabled`. `V2_ADMIN_LOGIN_SECRET` solo está como secreto remoto; D1 y `CHAT_ROOMS` están enlazados. CI prohíbe otro Service Binding y una configuración Admin incompleta.
- **S-D (acceso):** eliminado el acceso de sesión heredada sin dueño, la excepción `single_device_mode=0` y su antigua ruta DELETE de músico. La sesión de cada nombre se conserva mediante un solo dispositivo. El Administrador sigue teniendo su propia sesión/credencial y la acción exclusiva de liberar el dispositivo. Worker `havana-nice-v2-dev` desplegado; el 29/10/2026 la versión `4868029c-218d-43d8-92e3-664b9c19d133` servía el 100 % del tráfico, con D1 y Durable Object enlazados.
- **S-E (automatizaciones):** eliminado físicamente `.github/workflows/v2-media-deps-once.yml`; `expo-video@58.0.12` permanece exactamente fijado en manifest y lock. Existe ya una protección de CI que exige solo `v2-foundation-check.yml` y `v2-android-apk.yml`.
- **S-F (fuentes y pruebas):** README corregido sobre músicos y sesiones. Eliminado `v2/tests/cross-platform/README.md` porque era un marcador sin pruebas ejecutables. Plan Maestro y Continuidad no contienen otro tablero.
- **S-G (D1):** 28 filas de sesiones administrativas estaban vencidas, de las cuales 21 estaban revocadas. Se eliminaron SOLO mediante criterio `revoked_at IS NOT NULL OR expires_at<=now` sobre `chat_admin_sessions`. Consulta inmediata posterior: **0 sesiones Admin, 3 músicos, 3 sesiones de músico y 44 mensajes**. Músicos y mensajes no se tocaron.
- **S-B (Android):** `v2-android-apk.yml` es el **único workflow de compilación, verificación de firma y publicación**. Ejecución GitHub Actions [40963966950](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40963966950) `success`: APK `com.havananice.v2`, `versionName 0.0.10`, `versionCode 10`; se verificó la misma firma de la APK anterior y `versionCode 9 → 10`. La publicación usa un worktree aislado, sin mezclar archivos modificados por Expo con la rama binaria. Descarga estable `https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-LATEST.apk` verificada HTTP 200. **El propietario confirmó que la actualización de la app ya quedó** (S-I). Conservar Q01 abierto para pruebas integrales adicionales.
- **S-B2 (binarios):** el workflow eliminó 22 de 24 instaladores del HEAD de `havana-nice-v2-apk-downloads`. Quedan exactamente `HAVANA-NICE-V2-LATEST.apk` (76.997.911 bytes) y `HAVANA-NICE-V2-PREVIOUS.apk` (77.006.359 bytes), además de README y SHA256SUMS. No implica purga del historial de Git.
- **Pruebas automáticas:** ejecución GitHub Actions [40975170083](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40975170083) en `success`, sobre commit `bf0b268`; controles de acceso, sesiones, WebSocket, seguridad, caché y compilaciones aprobados. Android 0.0.10 está instalado y fue probado físicamente; el fallo del flujo antiguo quedó resuelto.

## QA funcional de Chat confirmado por el propietario — 29 de octubre de 2026 (México)

- Administrador: sesión autenticada, conexión, lista de 3 músicos y vista de Chat con historial/reacciones verificadas mediante capturas.
- Android nativo → Administrador: el mensaje «Prueba V2 Android» apareció en ambas superficies; hubo sincronización del Chat.
- Red desconectada: Android conservó identidad, historial y reacciones, mostró reconexión y recuperó estado «en vivo» al volver internet.
- Mensajería offline: «Prueba sin internet» se mostró «en cola», pasó a «enviado» al restablecer red y apareció una sola vez en el Administrador.
- Acceso duplicado: la PWA rechazó «Noa» ya vinculado al nativo; Admin mostró la nueva alerta, sin liberar el vínculo ni crear una nueva sesión.
- El propietario confirma que las comprobaciones de PWA también pasan y solicita avanzar a otras funciones. No prolongar pruebas redundantes del Chat.
- Lectura D1 posterior: 47 mensajes, 3 músicos, 3 sesiones, 3 propietarios de instalación y 2 alertas duplicadas; no se modificaron estos registros para el QA.
- **No cerrar Q01 global:** pendiente por alcance futuro de multimedia y módulos restantes, no por fallos detectados del Chat.

## Refuerzo técnico de TypeScript — 29 de octubre de 2026

- Análisis real temporal de la entrada del Worker sin `@ts-nocheck`: 93 diagnósticos iniciales; se corrigieron tipos y validaciones de borde sin cambiar contratos de sesión, D1 o mensajes.
- Fuente definitiva: `cloudflare/src/index.ts` con tipado activo; `tsconfig.json` resuelve módulos JavaScript auxiliares sin revisar todavía sus cuerpos (`checkJs:false`). Metadatos de dispositivos descritos mediante JSDoc en `member-admin.js`.
- Auditoría preventiva impide reintroducir `@ts-nocheck` en el Worker. Diagnóstico temporal de CI eliminado físicamente.
- Validación final GitHub Actions [41010325277](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41010325277) `success`, incluyendo TypeScript, build sin despliegue, seguridad, WebSocket, Admin, PWA y exportación Android.
- Sin despliegue del Worker: permanece la versión remota `4868029c-218d-43d8-92e3-664b9c19d133` al 100 % de tráfico al verificar; Android sigue en APK 0.0.10.
- `npm ci` reportó 12 advisories (5 altas, 2 moderadas, 5 bajas) sin detalle de paquetes. Revisar posteriormente; no cambiar dependencias sin auditoría y comprobaciones.

## Dependencias y Calendario, código sin activar — 29 de octubre de 2026 (México)

- Auditoría npm de V2 en [41010648961](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41010648961): 12 incidencias (5 altas, 2 moderadas, 5 bajas). Wrangler/Miniflare→undici; Expo CLI→zod y dependencias indirectas; node-forge/deepmerge. Sin cambios de versiones ni lock. La prueba temporal npm audit fue retirada.
- Nueva migración `0018_calendar_events.sql` solo en GitHub, **NO aplicada a D1**. Nuevo archivo `cloudflare/src/calendar.js` unido al Worker V2 solamente en fuente y contrato `packages/shared/src/calendar.ts`, sin conexión paralela. La API no se desplegó; no hay datos reales de calendario creados.
- El Admin vigente conserva su autenticación privada; el músico usa su token autorizado. API con lectura limitada por rango y escrituras admin únicamente, versiones optimistas para evitar sobrescribir modificaciones.
- CI final [41011185017](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41011185017) **SUCCESS** en TypeScript, pruebas nuevas de calendario, reglas de acceso, seguridad del Chat, build PWA y export Android.
- **P02/H02/H03 permanecen abiertos:** hace falta conectar pantallas, desplegar el Worker tras migración segura, validar la experiencia real en Admin/PWA/Android. No instalar otra APK mientras solo exista backend preparatorio.

## HOME conectada a autorización original — 30 octubre 2026

- El acceso autorizado dejó de ser la puerta exclusiva al Chat: en la fuente V2, la sesión válida existente abre HOME y desde HOME entra al Chat. Ninguna función de emisión/restauración de credenciales, registro de músico, token, base D1, DO ni caché local ha sido reemplazada.
- Android: `NativeMemberHome.tsx` es por ahora la capa de navegación funcional; el Chat React Native sigue montado en `App.tsx`, incluso al ver HOME, mediante ocultación de vista. No hay WebView ni segundo Chat. El trabajo PWA visual dentro de Android es parte de H02 y aún no está cerrado.
- PWA: una sola HOME reutiliza `VisualApp.tsx` dentro de la aplicación autenticada y mantiene el Chat existente en el DOM. `visual.html` sigue siendo presentación sin sesión.
- Módulos compartidos: `packages/shared/src/memberModules.ts` provee las seis entradas, sin datos inventados. Los pendientes no se deben marcar como implementados.
- Prueba de HOME [41012373606](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41012373606) **SUCCESS**. PWA Pages publicó HOME. La APK **0.0.11** quedó **firmada, con firma comparable a 0.0.10, y publicada** en la rama de APK oficiales por workflow [41012482568](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41012482568) `success`. `SHA256SUMS.txt` para `HAVANA-NICE-V2-LATEST.apk`: `1edc01c0a6d379ec53133bf02fe71958214c12afb4fd4224485ed00bf4e9396c`. **Confirmación del propietario (30/10/2026):** Android 0.0.11 funcionando, capturas de HOME con identidad Noa conservada y Chat nativo con historial y estado `en vivo`; botón de regreso `‹ Inicio` presente. El propietario indica «Todo bien». No equivale a QA completa de los módulos futuros ni a prueba instrumental de WebSocket/borradores al ocultar el Chat.
- **Seguridad:** no volver a introducir ingreso independiente en HOME, ni liberar sesiones, ni reinstalar/resetear aplicaciones. Próximo QA manual: al actualizar, HOME debe abrir conservando la identidad, Chat debe continuar donde estaba, volver a Inicio no debe cortar WebSocket ni perder borradores.
- H02/H03/P01 **parciales**. HOME→Chat físico aprobado; se mantiene un solo login y el tablero ampliado es **12/36**. No cerrar hasta completar H02 (capa no-Chat), navegación integral y módulos reales.

## Regla modular y continuación real — 30 de octubre de 2026

- **Regla aprobada por el propietario e incorporada al Plan Maestro único:** todos los módulos (Chat, Calendario, Repertorio, Músicos, Avisos, Ajustes) se desarrollan y prueban aisladamente, y se unen a **una sola HOME**. **No** se crean accesos, tokens, dispositivos, Workers, bases ni aplicaciones separados por sección. La entrada ya autorizada del músico continúa sin cambios, y Administrador conserva sus propios permisos.
- **Tablero:** se amplió de **27 a 36 hitos** (+9 A01–A09: entrada/HOME, Chat, Calendario, Repertorio, Músicos, Avisos, Ajustes, aislamiento de fallos y pruebas de arquitectura). Ninguno de los nuevos está cerrado artificialmente. Resultado **12 cerrados, 24 abiertos**. Único tablero en `PLAN-MAESTRO.md`.
- **Refuerzo nuevo:** `tests/module-boundaries.test.mjs` comprueba que las superficies de HOME/Calendario no crean un login adicional ni tocan mensajes o vínculos del Chat, y que solo Admin tiene las operaciones de escritura de Calendario. `.github/workflows/v2-foundation-check.yml` ejecuta el test en cada cambio de fuente; exigir suite verde antes de darlo por completado. **Primera ejecución [41097569931](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41097569931) `success`**; esto no cierra A09 hasta que todos los módulos tengan sus pruebas.
- **Calendario actual:** se revisó el acordeón de V1 en lectura exclusivamente y se implementaron sus campos, el panel de calendario Admin y los componentes Android/PWA en V2. Migración D1 aislada 0018 aplicada, sin fechas ficticias; Worker V2 verificado al 0 % de tráfico y desplegado al 100 % como `40f8eec3-cf4f-471c-a53c-bd9c381ed10f` con cinco bindings intactos. Tests SQL de privacidad y acceso aprobados. Pendiente prueba de extremo a extremo con fecha creada en Admin y comprobación física del músico.
- **APK:** Android 0.0.11 está instalado con HOME y Chat aprobados por el propietario. La APK **0.0.12**, con Calendario, fue firmada y publicada: [workflow 41096311572](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41096311572) `success`, `LATEST.apk` checksum SHA256 `277587336cf7d478b41100b705105e7f6f0b67ec5ac94d5829c501d461bf7137`, 0.0.11 en `PREVIOUS.apk`. **Instalación física 0.0.12 y QA Admin↔músico pendientes.** Instalar encima, sin borrar sesión.
- **Hitos próximos:** P02/A03 prueba real Admin → músico; A01/A02/A09 comprobar aislamiento, caída de Calendario sin perder HOME/Chat; después Repertorio P03/A04. PWA dentro de Android se mantiene como meta de H02, sin sustituir Chat nativo.

## Calendario libre y destinatarios reales — 30/10/2026

- Las capturas reales del Administrador mostraron `Destinatarios inválidos`. Causa: la API de Calendario validaba `recipientIds` como UUID, pero Andy, Fer y Noa tienen `actor_id` de formato `member:<id>`. Validación corregida; comprobar existencia y actividad en D1 para evitar destinatarios falsos.
- Todos los campos editables de contenido de Calendario son ahora texto libre, sin selector de fecha, `select` para Estado ni formato obligatorio de Maps. El título sigue siendo necesario para identificar la ficha; la selección de músicos sigue con casillas por autorización.
- Migración V2 `0019_calendar_free_text.sql` aplicada. Se guarda texto literal en fecha, estado y Maps; `date_sort` opcional permite orden cronológico cuando el texto es fecha reconocible. Google Maps no abre protocolos no seguros.
- Worker V2 publicado con versión `1df3def4-5b3e-4438-86b4-e2b3b16e4abd` al 100 %, con los cinco bindings existentes heredados. El archivo temporal de bundle y el paso de export CI se retiraron físicamente al terminar.
- Pruebas automáticas SQLite con `member:` y símbolos aprobadas; actualización del cliente Android a fuente `0.0.13` iniciada. Pendiente: verificación final de la nueva APK, envío real de una fecha Admin→músico y confirmación física del propietario. El tablero permanece **12/36**.

## Calendario — validación física Administración/PWA del músico (30/10/2026)

- Capturas reales muestran creación, listado y apertura del acordeón del evento del 14dic26 desde Administrador y consulta del mismo evento por Andy en la PWA, incluyendo campos y acceso a Google Maps que abrió el destino. Usuario confirma «Ya quedó».
- D1 verificada en solo lectura: **1 evento real, 3 asignaciones a 3 músicos activos, 3 sesiones y 3 instalaciones vinculadas**. No se insertaron registros artificiales para la prueba ni se tocaron datos del Chat.
- **Pendiente identificado:** en la captura de Andy la PWA escribió `Invalid Date` en vez de `14dic26`. El código más reciente de `calendarDate` ya devuelve fechas libres literalmente y el despliegue Pages correspondiente está aprobado, por lo que se sospecha bundle viejo cargado. Falta confirmación visual tras recargar la PWA en línea, **sin cerrar sesión, borrar caché local ni reinstalar**.
- P02/A03 quedan **parciales** hasta corregir/verificar ese detalle, probar Android nativo 0.0.13, editar/borrar/asignar a destinatarios y observar aislamiento frente a un error de Calendario. Hitos oficiales **12/36**, sin cierre adelantado.

## Próximo trabajo de desarrollo

1. **H02 → H03:** integración segura de los módulos no-Chat en Android. Mantener Chat 100 % React Native, aprovechar PWA solo para presentación y utilizar contratos/backend V2 únicos. Prioridad funcional, no colores/interfaz.
2. Preparar el camino para P01/P02/P03/P04 en la misma arquitectura, sin duplicar autorización ni almacenar un segundo token en WebView.
3. **R2 no habilitado:** la API devuelve `403/10042`; cuando el propietario active el servicio, retomar M01/M02/M04 por el contrato del Plan Maestro. No levantar nube ni Worker alternativo.
4. Publicar otra APK solo cuando exista una función nativa nueva, manteniendo firma, paquete y actualización sobre la versión instalada.

**Regla:** nada de ramas de trabajo adicionales, caché reiniciada, nombres desvinculados, nueva base, ni cambios a `main` o HAVANA CLOUD. Q01 se cierra únicamente con toda la funcionalidad pertinente probada.
