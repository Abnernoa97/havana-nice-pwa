# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**ADMINISTRADOR · CHAT GENERAL PUBLICADO — 27/10/2026:** el usuario pidió que el Administrador vea todos los mensajes de todos los músicos en una sola conversación con burbujas, sin adoptar identidad de músico ni enviar mensajes, con posibilidad de eliminar cualquier mensaje. Se implementó en la **misma PWA Admin** (/admin.html → Chat) reutilizando la única sesión de Administrador y un canal WebSocket privado `/ws/admin`. Worker V2 `0450e895-84db-469e-af27-4894b4a6b0ea` 100%; Pages / GitHub SHA `a783c0fc21c6cdb9be5fde5e5c6b11c926cf958a` SUCCESS; Foundation CI `40572364562` SUCCESS con pruebas nuevas de historial, autenticación y eliminación. **Funciones incluidas:** burbujas de mensajes históricos y recientes con emisor, fecha, respuestas, estado editado/borrado, reacciones, presencia en vivo y «está escribiendo»; paginación para mensajes anteriores; botón eliminar con confirmación, borrado lógico centralizado en D1 y aviso `chat.updated` tanto a Android/PWA como al propio Admin. No crea una segunda conversación ni nombre de usuario Admin dentro del Chat; no hay caja de escritura. **Fotos, videos y audios NO están aún habilitados**, se incorporarán al mismo visor cuando existan M01–M04 con borrado seguro de objetos. Pruebas automáticas completas; **validación física visual con sesión real de Administrador todavía pendiente**. Estado de D1 inmediatamente después: 2 miembros (Noa y Fer), 2 sesiones, 2 propietarios, 46 mensajes, 11 reacciones conservados, sin datos eliminados durante el desarrollo. Esta función es un entregable dentro del Administrador, **no se incrementa 12/27** sin completar alguno de los hitos ya enumerados.


**ÚLTIMA AUDITORÍA EN VIVO · 27/10/2026, después de volver a agregar músicos:** en D1 ya figuran **Noa y Fer**, ambos activos con `single_device_mode=1`, **1 sesión y 1 vínculo por músico**. Total: 2 miembros, 2 sesiones, 2 vínculos, 0 alertas. Consultas de integridad: 0 sesiones huérfanas, 0 vinculaciones inconsistentes, 0 miembros de modo antiguo, 0 duplicaciones de credencial; `PRAGMA foreign_key_check` sin errores. Se conservaron 46 mensajes y 11 reacciones de autores históricos, sin acreditar esos mensajes a los nuevos IDs. El resto de músicos aún no estaba registrado al corte de esta lectura. **ÚNICA LÍNEA DE V2 EN USO:** GitHub `havana-nice-v2-foundation` → Cloudflare Pages (`root_dir=v2`) y Worker `havana-nice-v2-dev` → D1 única; Android y PWA usan el mismo `POST /api/chat/session`, mismas sesiones y WebSocket. GitHub **no tiene literalmente un solo `main`**: su rama predeterminada `main` guarda la app anterior; hay 30 ramas en total (1 `main` antigua, 1 fuente V2, 1 distribución de APK, 27 ramas históricas/de respaldo). Las 27 no alimentan Pages V2. **RESIDUO EN EL CÓDIGO:** `createSession` y `verifySession` del Worker aún permiten un camino legado si un registro fuese creado manualmente con `single_device_mode=0` (en D1 actualmente no hay ninguno); la migración 0013 conserva el valor por defecto 0. Por ello la ejecución ACTUAL está unificada, pero **no se debe afirmar que se haya eliminado cada rama de compatibilidad heredada del código**. No limpiar a ciegas el Worker ni cambiar el default GitHub `main`; cualquier supresión de legado requiere cambio controlado, CI y despliegue preservando las dos sesiones activas. CI Foundation de HEAD `503ffd970430053eb69736e579b2f319a493e989` SUCCESS, Pages SUCCESS, Worker `fc65de5a-323c-4351-bf4f-c70c8bd86748` al 100%. Auditoría de solo lectura, sin cambiar datos ni sesiones.


**REINICIO DE MÚSICOS POSTERIOR — 27/10/2026:** por solicitud explícita del propietario se vació el acceso de los seis músicos originales y `Prueba 2`. D1 quedó entonces con 0 miembros, 0 sesiones de músicos, 0 propietarios y 0 alertas (antes de reañadir a Noa y Fer); 46 mensajes y 11 reacciones se conservan como historial sin autorización. Admin permanece funcional y es la única forma de dar altas nuevas (`single_device_mode=1`). Esta instrucción prevalece sobre cualquier inventario **histórico** anterior; no recrear automáticamente los seis nombres ni solicitar otra migración.


## CONTINUIDAD EXACTA — LEER PRIMERO AL REANUDAR EN OTRO CHAT

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Este es el documento de traspaso completo del chat del 27/10/2026. **LEER ANTES de hacer cambios o pedir información al propietario.** Empieza con «LO PRIMERO QUE DEBES HACER EN EL NUEVO CHAT» y registra S02 aceptado para músicos NUEVOS (bloqueo duplicado + alerta verificados), el siguiente trabajo en M01 (fotos), las rutas/CI y el reinicio autorizado del padrón de músicos sin destruir mensajes antiguos. No duplicar planes ni restaurar flujos descartados.

**Instrucción de continuidad del propietario:** «Revisa el Plan Maestro y sigue con la continuidad de HAVANA NICE V2». Al recibirla, abrir primero el documento enlazado y este tablero de 27 hitos; contrastar GitHub/Cloudflare en lectura inicial y seguir ejecutando la primera tarea pendiente. **Estado vigente: 12/27 hitos; S01 y S02 cerrados bajo el alcance aceptado. Próximo: M01.**

**Actualizado:** 27/10/2026. **Estado oficial: 12/27 hitos cerrados, 15 abiertos (44 %).** S02 aceptado por el propietario tras la prueba física de bloqueo en segundo teléfono y alerta en Admin. S02 se validó físicamente con un usuario nuevo; posteriormente el propietario autorizó reiniciar el padrón de los siete nombres y sesiones, que estuvo **vacío** antes de las nuevas altas de Noa y Fer. Las próximas altas siguen siendo exclusivamente modo un dispositivo; no quedan cuentas legadas activas. No se exigirá QA adicional para reabrir S02.

## 1. Fuente única y alcance

- Repositorio: `Abnernoa97/havana-nice-pwa`. **Única rama de desarrollo V2:** `havana-nice-v2-foundation`. La rama `main` original y la app de producción quedan intactas.
- Worker `havana-nice-v2-dev`, D1 `havana-nice-v2-dev`, Durable Object `CHAT_ROOMS`. Sin backend duplicado.
- **Administrador:** PWA independiente `/admin.html`, sesión administrativa privada. **Chat iPhone:** PWA. **Chat Android:** 100 % React Native, sin WebView para Chat. Otros módulos usarán PWA visual compartida.
- Todo módulo se desarrolla en una misma secuencia: contrato y datos únicos del Worker/D1 → PWA de músicos → Android nativo donde corresponda → Administrador → pruebas de extremo a extremo. Priorizar funcionalidad; estética después.
- Android instalado debe conservar sus conversaciones, archivos locales, historial y firma. No publicar nuevas APK por cambios de PWA o backend; publicar una sola actualización probada cuando cambie Chat nativo.

## 2. ÚNICO acceso a músicos — la decisión vigente

**Regla inequívoca: un nombre autorizado desde Administrador = una única instalación titular.** La entrada del músico requiere exclusivamente el nombre creado por el Administrador; no se piden contraseñas ni permisos individuales de nuevos teléfonos.

1. **Crear:** el Administrador autenticado añade el nombre, único en D1 y con estado activo. Un nombre desconocido no accede.
2. **Vincular:** la primera instalación que inicia sesión recibe una credencial aleatoria opaca, cuyo hash permanece en D1 como única titular. La operación es atómica ante intentos simultáneos.
3. **Entrar siempre:** esa misma instalación reutiliza su credencial local tras cerrar la app, reiniciar o perder Internet. El estado «en línea» no decide la propiedad.
4. **Bloquear duplicados:** otro navegador/teléfono que escriba el nombre registrado recibe `409 name_already_bound`; no recibe sesión ni sustituye a la instalación titular. Se registra el intento en D1 con fecha/plataforma disponible y se avisa por el WebSocket privado al Administrador conectado.
5. **Administrar:** ver el estado de vinculación, historial y alertas; marcar alertas revisadas. **«Liberar dispositivo»** invalida credencial y WebSockets sin eliminar la cuenta ni sus mensajes. El primer ingreso posterior puede ocupar la instalación liberada. **Papelera** elimina miembro y datos asociados con doble confirmación, y expulsa sus conexiones.
6. **Límite reconocido:** el primer teléfono que conozca el nombre podría vincularlo antes que su titular; una instalación PWA no prueba identidad física ni garantiza persistencia si se borran sus datos locales. No inventar modelos ni usar fingerprinting. Una alerta visible en Administrador conectado no implica push con la app cerrada; eso corresponde a M05.

**Nuevo inicio aprobado por el propietario (27/10/2026):** todos los músicos de V2 (Andy, Fer, Jali, Noa, Orly, Rafa y `Prueba 2`) fueron eliminados del padrón. **0 cuentas, 0 sesiones, 0 dispositivos vinculados y 0 alertas** en aquel instante (posteriormente se reañadieron Noa y Fer, 1 vínculo cada uno). Los próximos nombres se crean únicamente en Admin y utilizan `single_device_mode=1`, sin aprobación de teléfonos ni claves individuales. Se conservaron mensajes y reacciones históricas para evitar pérdida de conversación; pertenecen a los identificadores anteriores y no conceden autoría a las nuevas cuentas.

## 3. Acceso exclusivo del Administrador

- Autenticación privada independiente del nombre de músico; token de corta duración, seguridad y revocación de otras sesiones.
- Un solo módulo «Acceso a músicos»: añadir, lista, estado de vinculación, historial real de entradas/conexiones, «Ver datos asociados» solo lectura, intentos duplicados, «Liberar dispositivo» y papelera con confirmación.
- Eliminar a un músico expulsa inmediatamente sus sockets y bloquea reingreso. Liberar un dispositivo **no** elimina la cuenta ni las conversaciones.
- Recuento de «credenciales» de D1 no equivale a «teléfonos conectados».
- Si existe multimedia externa sin procedimiento completo de borrado, la papelera debe fallar con seguridad sin dejar objetos huérfanos.
- **Administrador Chat general ya está implementado y publicado:** visor privado de todo el Chat, sincronización de mensajes en vivo y papelera de moderación que propaga la eliminación a los músicos; falta validación visual física del propietario. Administrador Repertorio, Calendario y Más siguen pendientes de habilitar; no mostrar datos falsos ni interfaces paralelas.

## 4. Tablero de 27 hitos

- [x] **B01 · Fundación V2 aislada.** Repositorio y rama única V2, Cloudflare Worker/D1/DO, PWA iPhone y Android nativo integrados; producción original intacta.
- [x] **B02 · Chat básico de texto.** Mensajes reales Android ↔ iPhone PWA con entrega y recepción en vivo.
- [x] **B03 · Entrada por nombre persistente.** Sesión recordada tras reapertura, sin pedir clave a cada inicio.
- [x] **B04 · Auditoría preventiva inicial.** Caché, integridad, índices y CI mínimos revisados.
- [x] **C01 · Menú de acciones estilo WhatsApp.** Pulsación prolongada, reacción, respuesta, edición y borrado contextual; validado físicamente.
- [x] **C02 · Edición y borrado de mensajes.** Permisos de autor, plazos, conservación de texto offline y sincronización.
- [x] **C03 · Deslizar para responder.** Gesto con preview junto al teclado sin interferir con scroll.
- [x] **C04 · Offline y reconexión.** Cola local, borradores, restauración, cambio de red y reenvío sin duplicados.
- [x] **C05 · Sincronización bidireccional.** Texto, reacciones, lectura, edición y borrado entre Android e iPhone.
- [x] **H01 · Proteger línea base Android nativa.** Paquete `com.havananice.v2`, firma compatible, actualización preservando sesión y caché; APK instalada de referencia 0.0.4.
- [ ] **H02 · Módulos no-Chat mediante PWA.** Android mostrará Home, Calendario y Repertorio vía PWA visual, pero Chat seguirá 100 % React Native. Falta integración y QA.
- [ ] **H03 · Navegación y sesión coordinadas.** Identidad coherente entre secciones, botón Atrás correcto y recuperación offline sin duplicados.
- [ ] **H04 · PWA visual actualizable sin APK.** Cambios visuales reflejados en iPhone y Android WebView sin reinstalar; demostrar físicamente.
- [x] **S01 · Músicos creados por Administrador.** Administrador autoriza únicamente nombres existentes en D1. Prueba real `Prueba 1`: alta, ingreso, historial, eliminación, expulsión y bloqueo de reingreso. No implica identidad física.
- [x] **S02 · Un músico nuevo · una instalación · alerta Admin (ACEPTADO).** Prueba real 27/10 con `Prueba 2`: primer teléfono entró, segundo teléfono recibió rechazo por nombre vinculado y Admin mostró alerta fechada. D1 confirmó 1 vínculo y 1 alerta. Propietario consideró cumplido el objetivo principal y descartó más QA de seguridad en este hito. «Liberar dispositivo» existe en Admin, pero no se ha ensayado físicamente; no afirmar que fue probado. **Situación actual:** las siete cuentas del ensayo fueron retiradas después por petición del propietario; todas las próximas altas usan la nueva lógica. Los mensajes históricos siguen guardados.
- [ ] **M01 · Fotos privadas.** Compresión, miniaturas, carga, progreso y visor; pasarela privada Drive/HAVANA CLOUD con costo controlado.
- [ ] **M02 · Videos.** Subida controlada, poster, duración y reproducción fluida.
- [ ] **M03 · Audios.** Grabación, envío y reproducción cruzada Android/iPhone.
- [ ] **M04 · Visor multimedia.** Foto/video fullscreen, zoom, gestos y retorno al Chat sin perder posición.
- [ ] **M05 · Notificaciones push.** Android FCM e iPhone Web Push al estar cerrada/bloqueada la app; las alertas de acceso duplicado también deben notificarse fuera del Administrador.
- [ ] **P01 · Home y ajustes.** Interfaz visual compartida PWA y navegación funcional.
- [ ] **P02 · Calendario.** Eventos, destinatarios, horarios, notas, vestuario, llamadas y repertorio por evento.
- [ ] **P03 · Repertorio.** General y por evento, checklist, enlaces, nuevas canciones y gestión desde Admin.
- [ ] **P04 · Administrador completo.** Acceso a músicos funcional; quedan Chat, Repertorio, Calendario y Más; todos sincronizados con backend y clientes.
- [ ] **P05 · Avisos y perfiles.** Leído/no leído, preferencias, enlaces e información sin módulos duplicados.
- [ ] **Q01 · QA integral.** Pruebas físicas multiusuario, seguridad, firma APK, offline, auditoría D1, cuotas y ausencia de regresiones.
- [ ] **Q02 · Transición gradual a producción.** Migración únicamente con autorización específica y copia verificable; no tocar la app original.

**Totales:** 12 confirmados / 15 pendientes. S01 está cerrado por evidencia real de alta a expulsión. S02 está cerrado por aceptación explícita del propietario y evidencia física de **un usuario nuevo**, bloqueo del acceso duplicado y alerta Admin. No se validó físicamente la liberación manual ni la desconexión; el propietario dio por suficiente el bloqueo y la alerta. **No queda migración pendiente de cuentas viejas: se retiraron todas a petición del propietario.**

## 5. Estado técnico comprobado en esta limpieza

- **D1 antes del ensayo S02:** seis miembros históricos autorizados, diez sesiones de Chat y 45 mensajes; sin titulares vinculados ni alertas. **Tras el ensayo con `Prueba 2`:** siete nombres autorizados (seis antiguos + usuario temporal), exactamente un dispositivo vinculado y una alerta de acceso duplicado, verificado por lectura de D1. `Prueba 2` sigue autorizado para QA; no borrarlo automáticamente ni usar la cuenta como músico permanente.
- **Backend de acceso:** `POST /api/chat/session` para músico, `GET /api/chat/session` para recuperar, `DELETE /api/chat/session` para cerrar; `/api/chat/admin/auth/*` exclusivo de Administrador y rutas de gestión del músico/vinculación/alertas. Una sola fuente de validación.
- **Acceso nuevo:** `chat_single_device_owners` y `chat_duplicate_login_alerts` son las únicas tablas adicionales específicas de instalación y alertas.
- **Limpieza definitiva realizada:** eliminados del código y D1 el flujo de pedir/aprobar teléfonos y la inscripción experimental PWA. No hay botones, endpoints ni tablas de ese mecanismo; las sesiones del Chat que existían continúan intactas.
- **CI:** pruebas de tipado, autenticación independiente, restricción de duplicados, bloqueo de endpoints borrados y conservación de WebSocket/Chat; exigir SUCCESS antes de distribuciones.
- **Avance S02 verificado (27/10):** commit `5199a3af795a402e5a042e10ee10cd771777f6a4`; Foundation CI `40552356302` SUCCESS, repetido con éxito tras desplegar; Cloudflare Pages desplegado para ese commit; Worker V2 versión `fc65de5a-323c-4351-bf4f-c70c8bd86748` al 100 %. La ruta DELETE ya no puede dejar huérfana la credencial titular; libera únicamente el Administrador. Eliminada además una interrupción accidental del guardado de borradores PWA causada por eventos de escritura ajenos. D1 se volvió a leer: 6 músicos activos, 10 sesiones, 45 mensajes, 0 titulares nuevos y 0 alertas, sin mutaciones de prueba.
- **Protección pendiente en H03/Q01, no bloqueante para M01:** revisar la retención local de borradores/cola no enviados ante revocación o restauración 401; los clientes actuales pueden limpiar esos datos. No confundir mensajes ya guardados en D1 con borradores offline. Las cuentas anteriores ya fueron revocadas por instrucción del propietario; no limpiar caché ni desinstalar APK.

## Auditoría de rutas y limpieza del acceso · 27/10/2026

**Comprobación del código, Cloudflare Pages, Worker y D1 (lectura, sin cambios de datos):**

- Entrada de músicos única: `POST /api/chat/session` mediante nombre autorizado; `GET` es solo restauración y `DELETE` es cierre. Alta de nombres solo por Admin autenticado `POST /api/chat/admin/members`. Administración tiene su propia autenticación privilegiada separada; no existe otra entrada para músicos.
- Flujos desechados de aprobación individual de teléfonos y claves de laboratorio ausentes del árbol `v2/` actual; la base D1 ya no contiene tablas de esos flujos. Se reforzó `audit-guard.mjs` para impedir rutas paralelas y altas que omitan `single_device_mode=1`.
- Cloudflare Pages compilado **desde `v2`**, rama `havana-nice-v2-foundation`, y Worker actual versión `fc65de5a-323c-4351-bf4f-c70c8bd86748`. No usa los JS históricos del directorio raíz ni `main`.
- Tablas D1 vigentes: `chat_members`, `chat_sessions`, `chat_single_device_owners`, `chat_duplicate_login_alerts`, `chat_admin_sessions`, `chat_admin_login_limits`, historial, mensajes, reacciones, lecturas, metadatos y multimedia planificada. Ninguna tabla verificada de aprobación antigua. `_cf_KV` es interna; no eliminarla.
- Conteos en el momento de la inspección: **7 nombres (6 originales + Prueba 2), 12 sesiones, 46 mensajes, 1 instalación vinculada y 1 alerta**. Los seis originales siguen modo legado `single_device_mode=0`, no afirmar que están protegidos contra duplicados.
- Inventario: la maqueta pública `/visual.html` es preliminar y no expone Chat/Administración, pero **no debe usarse como puerta de entrada a futuros módulos con datos privados** hasta coordinar sesión en H03. El puente de HAVANA CLOUD es código futuro no conectado; no crea acceso actual. Ninguno debe eliminarse como «basura» sin resolver sus tareas futuras.
- Se actualizaron README, comentarios del almacenamiento Android, textos obsoletos de maquetas y el nombre de la prueba de CI. Después se **retiraron de esta rama V2 55 copias de los archivos de la raíz histórica (19 704 817 bytes de archivos)**, comprobando previamente coincidencia exacta por hash con `main`. **La rama `main` sigue sin modificaciones**; Git conserva el historial y esos objetos. Se conservan D1, sesiones, módulos funcionales, las migraciones SQL, la firma y los datos Android; no se generó APK ni desplegó otro Worker. Se añade un guard al CI para mantener limpia la raíz V2.
- **Reinicio de miembros completado 27/10 (instrucción expresa posterior):** D1 consultada y modificada exclusivamente en `havana-nice-v2-dev`: 7 cuentas antiguas desautorizadas y eliminadas, 12 sesiones cerradas, 1 vínculo, 1 alerta, 20 eventos de acceso y 7 marcadores de lectura retirados. **0 músicos, 0 sesiones, 0 vínculos en el momento del reinicio** (ahora 2 músicos reañadidos); las **46 conversaciones de texto y 11 reacciones siguen preservadas**; las sesiones Admin se conservaron (21 registros de historial/sesión en ese momento). Time Travel bookmark de D1 verificado antes de actuar; no es backup independiente. El nuevo esquema no debe autosembrar los seis nombres históricos. Las nuevas altas del Administrador llevan `single_device_mode=1`. No eliminar el historial de mensajes por inferencia.
- La próxima funcionalidad sigue siendo **M01**. Retención de datos offline ante revocaciones permanece como futura revisión H03/Q01; no hay músicos legacy que convertir.

## 6. Próxima secuencia: M01 · Fotos privadas en Chat

1. **S02 ACEPTADO el 27/10 por el propietario:** `Prueba 2` inició desde un teléfono; otro rechazado con mensaje de nombre vinculado; Admin mostró alerta 27/10 11:58 a. m.; D1 confirmó 1 vinculación y 1 alerta. No añadir pruebas de seguridad no solicitadas. El mecanismo de liberación permanece disponible, pero no se ensayó físicamente.
2. **Continuar M01 funcional:** inspeccionar contrato de Chat, almacenamiento multimedia realmente disponible y rutas de subida segura, sin activar cobros ni exponer archivos. Implementar fotos privadas (subida/compresión/miniatura/progreso/visor inicial) para Chat iPhone PWA, Android React Native nativo y la gestión que corresponda en Admin, sobre un solo backend/plan.
3. **Sin romper lo existente:** el propietario decidió eliminar y crear nuevamente todos los músicos. Tras vaciar Admin, ya reañadió a Noa y Fer con la nueva lógica; los restantes siguen pendientes de alta. Conservar la firma de Android 0.0.4, los 46 mensajes y las 11 reacciones anteriores; no borrar cachés ni reinstalar.
4. **Acceso unificado desde este punto:** no hay músicos anteriores activos que migrar. Todos los nombres reintroducidos en Admin se crearán con vínculo único automático. H03/Q01 continúan para navegación y resiliencia offline, no para adaptar los seis usuarios revocados.
5. **Siguiente orden:** completar M01–M04 y M05 de manera funcional, después H02–H04 / P01–P05 en el orden coordinado único, ajustando prioridades solo a petición del propietario.
**No crear copias del plan, ramas alternativas, login paralelo ni parches flotantes. La app de producción original queda protegida.**
