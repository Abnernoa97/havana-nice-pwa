# HAVANA NICE V2 — CONTINUIDAD EXACTA PARA EL SIGUIENTE CHAT

**Fecha del traspaso: 27 de octubre de 2026, alrededor de las 11:25 h (Ciudad de México).**
**Fuente oficial:** [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).
**Estado CERTIFICADO: 11/27 hitos terminados, 16 pendientes. S01 CERRADO; S02 ABIERTO.**

**ACTUALIZACIÓN S02 (27/10/2026, reanudación):** auditoría y corrección concreta completadas en la única rama `havana-nice-v2-foundation`. Commit de código `5199a3af795a402e5a042e10ee10cd771777f6a4`, Foundation CI `40552356302` SUCCESS (incluida nueva ejecución completa tras publicar), Cloudflare Pages SUCCESS en ese commit y Worker V2 versión `fc65de5a-323c-4351-bf4f-c70c8bd86748` desplegada 100 %. Verificados los cinco bindings originales de Worker sin cambios (D1, Durable Object, variables y secreto Admin), y lectura D1: 6 músicos, 10 sesiones, 45 mensajes, 0 vinculaciones nuevas, 0 alertas. No se creó ningún usuario de prueba, no se borraron datos y no se generó APK. La ruta de logout ya no puede dejar a un músico vinculado sin su token; también se corrigió una cancelación inoportuna del guardado de borradores PWA al recibir eventos `typing`.

**SIGUIENTE ACCIÓN REAL:** prueba S02 con **nuevo usuario temporal creado desde el Administrador** y dos instalaciones; validar 409, alerta, conexión offline, restauración y liberación. La creación/borrado del usuario de QA requiere aprobación del propietario o que él lo haga. Antes de migrar a los seis músicos, resolver además la retención segura de borradores/cola locales cuando una sesión queda revocada o GET restore devuelve 401; la versión actual de los clientes aún puede eliminar esos datos locales. No tachar S02 ni tomar los CI como prueba física.

> **LO PRIMERO QUE DEBES HACER EN EL NUEVO CHAT:** abrir este archivo directamente en GitHub, leer también el Plan Maestro en esta misma rama, verificar el estado ACTUAL de GitHub/CI, Cloudflare Worker/Pages/D1 sin alterar datos, y **CONTINUAR EN S02: UN NOMBRE = UNA INSTALACIÓN VINCULADA + ALERTAS AL ADMINISTRADOR**. No pedir al propietario que explique de nuevo el proyecto. No saltar a Calendario, Repertorio, Home, colores, notificaciones ni una nueva APK mientras falte la prueba de S02. Si todo está estable, preparar el ensayo físico con UN usuario temporal creado únicamente desde el Administrador. No usar ninguno de los seis músicos como prueba.

## 1. Orden exacto de trabajo desde este punto (no reinventar el plan)

1. **Verificar el estado ya publicado, no volver a construir de cero.** Revisar la rama havana-nice-v2-foundation, el último Foundation CI, el Worker en uso, el despliegue Pages y una consulta SOLO LECTURA de D1. Confirmar que no sobreviven rutas antiguas de aprobación de teléfonos y que los seis músicos y sus sesiones siguen intactos. Nunca confundir CI de un commit anterior con CI del HEAD documental posterior.
2. **Revisión técnica S02 antes de la prueba real.** Inspeccionar rutas POST/GET/DELETE de sesión, verificación en WebSocket y Durable Object, reclamo atómico de la primera instalación y error 409 name_already_bound. Confirmar que ninguna API alterna emite sesiones para el mismo nombre y que liberar un dispositivo no borra conversaciones, que una sesión titular puede restaurarse y que pérdidas de almacenamiento local quedan tratadas. Resolver defectos con pruebas y CI antes de probar en el teléfono.
3. **Prueba controlada con nombre nuevo TEMPORAL.** Solo mediante aprobación explícita del propietario para alta/baja, o dejar al propietario realizarla desde Admin. Probar: primer teléfono entra y queda vinculado; un segundo no entra aun cuando el primero está offline; aparece alerta en Admin autenticado; el primero reabre sin escribir nombre; Admin libera la vinculación con confirmación; el primero es expulsado y el segundo puede entrar. Verificar registros en D1 y que no se perdieron mensajes. No atribuir una prueba al usuario si todavía no la realizó.
4. **Migración futura, músico por músico**, de Andy, Fer, Jali, Noa, Orly y Rafa: la base tiene varias credenciales antiguas y NO puede elegirse un teléfono titular arbitrariamente. Conservar exactamente las sesiones actuales hasta tener una transición compatible y pruebas físicas PWA iPhone/Android nativo. Agrupar cualquier cambio React Native en UNA actualización APK que preserve firma, package, SQLite, caché, sesión, borradores e historial. No forzar el cierre sobre músicos reales sin consentimiento y respaldo.
5. **Solo al pasar S02** y su aceptación física, tachar S02 en el mismo tablero y seguir con Chat multimedia/push y luego pantallas no-Chat y módulos Admin según el orden único del Plan Maestro. No crear otro tablero, otra rama de desarrollo ni otro backend.

## 2. Decisión DEFINITIVA del propietario sobre accesos

El propietario **RECHAZÓ** las contraseñas individuales y las aprobaciones manuales de teléfonos. Quiso expresamente la regla simple:

- El Administrador escribe y autoriza UNA SOLA VEZ el nombre del músico en «Acceso a músicos». Solo ese nombre registrado en D1 puede iniciar sesión.
- El primer acceso exitoso desde una instalación queda vinculado al nombre. La instalación conserva una credencial aleatoria persistente; el músico **no introduce contraseña ni repite nombre todos los días**.
- Otro dispositivo/navegador que introduzca ese mismo nombre NO puede entrar aunque el primer dispositivo esté desconectado, apagado o con Internet intermitente: el Worker debe responder 409 name_already_bound, no crear otra sesión y registrar una alerta.
- El Administrador recibe una **alerta de acceso duplicado** cuando su PWA esté abierta/conectada (invalida vía WebSocket y recupera registros en D1). Una alerta push con la aplicación cerrada NO se ha construido; eso pertenece a M05 y no hay que afirmarlo.
- «Liberar dispositivo» es una acción administrativa separada y confirmada que revoca la sesión titular, permite vincular el reemplazo, pero **NO borra el nombre ni los mensajes**. Papelera permanente es otra acción.
- No basarse en número de usuarios «en línea», dirección IP, huella de navegador, Android 10, «modelo K» ni nombre como prueba de dispositivo. El titular es la credencial persistida/registrada en el servidor.
- LÍMITE ACEPTADO/EXPLICADO: quien conozca el nombre y llegue primero puede reclamarlo; quien copie el token podría suplantar la instalación; borrar datos de navegador/PWA podría exigir liberación administrativa. Esto limita la garantía de identidad; no afirmar seguridad absoluta de hardware.

## 3. Lo YA comprobado físicamente: no repetir pruebas superadas

- **27/10 — S01:** el propietario creó desde la PWA Admin el músico temporal «Prueba 1». El teléfono entró al Chat y su acordeón registró exactamente 1 login, 2 conexiones y 2 desconexiones. Se corrigió el User-Agent reducido de Chrome («Android 10; K») para NO inventar versión ni modelo. El propietario aportó captura de la corrección.
- El propietario eliminó voluntariamente «Prueba 1»: desapareció del listado; lectura D1 confirmó cero miembro, cero sesiones/entradas huérfanas relacionadas, y seis músicos y 45 mensajes intactos. El propietario confirmó «Sí lo sacó» del Chat activo; aportó otra captura al intentar reingresar con «prueba 1»: «Tu nombre todavía no está autorizado». **S01 se marcó [x] por esta evidencia**, como acceso controlado por nombre; NO se consideró verificación de identidad física.
- **27/10 — inspección sin borrados:** «Ver datos asociados» en la ficha de Andy y Noa fue probado en dos capturas y contrastado directamente con D1. Andy: 4 credenciales de acceso, 1 mensaje, 0 reacciones, 1 lectura, 0 historial, 2 solicitudes antiguas, 1 activación antigua, 0 multimedia. Noa: 2 credenciales, 13 mensajes, 7 reacciones, 1 lectura, 4 eventos de historial, 0 solicitudes, 1 activación antigua, 0 multimedia. Etiqueta corregida «Credenciales de acceso»: esos registros NO significan teléfonos conectados en vivo.
- **26/10 — Chat C01–C05 todos [x]:** menú de pulsación prolongada, responder deslizando, reacciones, edición y borrado con permisos, respuestas enlazadas, borradores y cola persistentes offline, recuperación al cambiar red/cerrar aplicación, orden sin duplicados y sincronización Android nativo ↔ PWA iPhone, comprobados con dos teléfonos. No rehacer ni repetir esas pruebas sin detectar una regresión real.
- **H01 [x]:** actualización de Android 0.0.3 a 0.0.4 encima de la app previa conservó conversaciones, sesión y reacciones. Android instalado físicamente 0.0.4; hubo APK 0.0.5 compilada pero sin validación física. No desinstalar ni borrar caché.

## 4. Estado técnico comprobado en el traspaso

**GitHub:** repositorio Abnernoa97/havana-nice-pwa. ÚNICA rama de desarrollo HAVANA NICE V2: havana-nice-v2-foundation. No tocar main (app original de producción). Último commit de código S02 auditado: 5199a3af795a402e5a042e10ee10cd771777f6a4; tras esta actualización documental el HEAD avanzará de nuevo. main histórico de la entrega: 3f2d2379d0ed855a025d8e7162cd2a8be9. **No tratar estos SHA como inmutables:** siempre leer HEAD de nuevo. Plan Maestro sigue siendo la fuente única de 27 hitos.

**Cloudflare:** cuenta Soloaplicaciones (identificador de cuenta be5ba365b96fde2f1ec78a18c2d8e8ea); Worker exclusivo havana-nice-v2-dev, URL https://havana-nice-v2-dev.soloaplicaciones97.workers.dev; Pages https://havana-nice-v2-dev.pages.dev; Admin https://havana-nice-v2-dev.pages.dev/admin.html; D1 havana-nice-v2-dev UUID 6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5; Durable Object CHAT_ROOMS. **ÚLTIMA LECTURA REAL tras corregir S02:** Worker versión fc65de5a-323c-4351-bf4f-c70c8bd86748 al 100 %, Pages SHA 5199a3af795a402e5a042e10ee10cd771777f6a4 estado success. D1: 6 miembros activos, 10 sesiones, 45 mensajes, 0 instalaciones vinculadas y 0 alertas duplicadas. Versión Worker anterior disponible para rollback: b67b652d-a676-49ac-83a5-e6fdfff88e30. No crear usuarios, sesiones ni escrituras D1 simplemente para inspeccionar.

**GitHub CI:** Foundation CI 40552356302 para SHA 5199a3af795a402e5a042e10ee10cd771777f6a4 concluyó SUCCESS; se repitió el job tras desplegar el Worker y terminó SUCCESS, incluso en verificaciones live de Worker/Pages. CI sigue comprobando 404 de endpoints antiguos. Los commits solo documentales no necesariamente disparan esta suite por los filtros de paths.

**Backend y código principal actual:**
- v2/cloudflare/src/index.ts — Worker, login músico, bearer/GET restore, GET/DELETE sesión, verifySession y Durable Object WebSocket.
- v2/cloudflare/src/single-installation.js — reclamo atómico del titular mediante token hash, auditoría de intentos duplicados, revisión de alertas y release de instalación solo por Admin.
- v2/cloudflare/src/member-admin.js — lista/historial y baja; bloquea bajas con multimedia externa sin limpieza efectiva.
- v2/cloudflare/src/admin-auth.js y admin-realtime.js — credencial de Administrador separada, WebSocket privado de invalidación.
- v2/cloudflare/migrations/0013_single_installation_access.sql — columna single_device_mode (los seis existentes en 0, nuevos en 1), tablas chat_single_device_owners y chat_duplicate_login_alerts.
- v2/apps/pwa/src/AdminChatAccess.tsx y admin-api.ts — vista «Acceso a músicos», alertas de acceso duplicado, revisión, vínculo y «Liberar dispositivo», «Ver datos asociados», sesiones Admin.
- v2/cloudflare/tests/single-installation.test.mjs y demás tests + .github/workflows/v2-foundation-check.yml — CI.
- v2/packages/shared/src/index.ts — contratos de Chat; v2/apps/android/App.tsx (Chat React Native); v2/apps/pwa/src/App.tsx (Chat iPhone PWA).

**Cambio importante POSTERIOR a mensajes anteriores del chat:** GitHub registró una limpieza de código y D1 que RETIRÓ los flujos descartados de solicitudes/aprobación individuales de teléfonos y «primera reclamación PWA»: ya no existen los archivos device-approval.js y pwa-first-device.js ni sus migraciones 0009/0011 en HEAD; el CI comprueba 404 en rutas eliminadas. **NO recrear esos flujos** por ver instrucciones viejas o commits históricos. Antes de operar debe contrastarse código de HEAD contra la versión Worker en uso y el estado real D1.

**Credenciales y privacidad:** nunca mostrar/cambiar el secreto de Administrador, hashes, bearer tokens, IP privadas, credenciales Cloudflare. No activar un flujo paralelo, duplicado o alternativo. Cerrar otras sesiones administrativas requiere decisión del propietario. Los reportes de modelos de Chrome pueden no identificar el teléfono.

**Backup de D1:** existe evidencia de puntos de restauración Time Travel, pero la descarga de un backup independiente externo no se había verificado. No confundir Time Travel con una copia independiente. NO hacer purgas destructivas, borrar historiales, eliminar ramas legadas indiscriminadamente o migrar a producción hasta que haya respaldo y permiso expresos. La limpieza de flujos viejos ya registrada NO es autorización para más limpiezas.

## 5. Arquitectura innegociable y alcance futuro

- **Chat Android 100 % React Native/Expo nativo**: mensajes, gestos, teclado, WebSocket, offline, caché, futuras fotos/videos/audio. NUNCA reemplazar Chat por WebView.
- **Chat iPhone PWA.** Compartir contratos de Worker/API/D1 y datos, NO forzar una UI React compartida para Chat nativo.
- Home, Calendario, Repertorio, Avisos, perfiles/ajustes y Admin: PWA visual compartida, embebida en WebView Android cuando se implemente. Los prototipos no prueban integración.
- Administrador PWA en /admin.html: Acceso a músicos es la sección funcional; Chat Admin, Repertorio, Calendario y Más siguen pendientes. **No trabajar colores, diseño ni esos módulos antes de cerrar S02**.
- Al llegar a Home, orden de referencia aprobado: Calendario de eventos; Repertorio; Notificaciones; Familia HAVANA NICE; Chat de información. En Android el último abre Chat nativo; en iPhone, PWA.
- Repertorio y Calendario se sincronizan por **una sola API/modelo** con Admin, PWA y nativo según corresponda, en la misma línea de desarrollo. Nada de versiones/patches paralelos.
- Archivos Chat fotos, videos, audios, visor, y notificaciones push aún NO cerrados. No prometer push real con app cerrada. No activar cobros de R2 u otros servicios ni tocar HAVANA CLOUD original para pruebas.
- No fusionar V2 con main original ni mover clientes de producción a V2 sin autorización explícita y QA/backup. No crear ramas adicionales para cada cambio.

## 6. Calidad: qué se puede afirmar y qué queda abierto

**CERRADOS físicamente: 11/27** — B01 B02 B03 B04, C01 C02 C03 C04 C05, H01, S01. **ABIERTOS: 16/27** — H02 H03 H04, S02, M01 M02 M03 M04 M05, P01 P02 P03 P04 P05, Q01 Q02. Cada [x] debe corresponder a evidencia funcional y criterio real.

**S02 NO se cierra aún**, aunque tenga esquema, código, tests y Worker publicado. Falta prueba real de primer dispositivo/segundo dispositivo, alerta administrativa, persistencia offline, liberación, nuevo vínculo y transición de las seis cuentas. Validar problemas de carreras, seguridad y persistencia con pruebas adicionales.

**Precisión de la alerta:** hoy el mecanismo descrito avisa en Admin autenticado y conectado por WebSocket o cuando recargue los datos. No existe prueba de notificación push externa con Admin cerrado (M05 abierto).

**Reglas de trabajo con este propietario:** el asistente hace implementación, auditoría, GitHub/Cloudflare/CI y entrega final; el propietario solo aporta aprobación y pruebas físicas desde sus teléfonos cuando realmente sean necesarias. Nunca pedirle cambios manuales de código, uso de terminal, copiar tokens o reinstalaciones innecesarias. Reportar exactamente qué se publicó y qué no; no prometer trabajo en segundo plano. Priorizar funcionamiento sobre apariencia.

## 7. Instrucción literal que debe entender el próximo chat

Cuando el propietario diga **«Revisa el Plan Maestro y sigue con la continuidad de HAVANA NICE V2»**, debes:

1. Ir a este repositorio/rama, leer **primero este archivo de continuidad** y luego v2/docs/PLAN-MAESTRO.md.
2. Revisar el último commit y CI de GitHub y el último Worker/Pages/D1 real (solo lectura inicial).
3. Resumir brevemente estado 11/27, S01 cerrado y S02 activo, las seis cuentas preservadas y el **siguiente trabajo concreto**.
4. **Continuar ejecutando S02 en la misma línea**, empezando por lo pendiente no verificado; no hacer preguntas repetidas ni reconstruir el proyecto desde cero. No borrar músicos ni alterar sesiones sin aprobación.
5. Tras conseguir una nueva validación física, actualizar este archivo y el tablero en Plan Maestro, manteniendo una fuente única y sin mentir sobre hito cerrado.

**Este documento ES el traspaso operativo del chat.** Si cualquier estado cambia después de esta fecha, prevalecen las comprobaciones actuales de GitHub/Cloudflare y el tablero vigente del Plan Maestro, con sus evidencias. No asumir que una versión o una cifra histórica siguen vigentes sin verificar.
