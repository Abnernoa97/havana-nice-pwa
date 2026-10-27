# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

## CONTINUIDAD EXACTA — LEER PRIMERO AL REANUDAR EN OTRO CHAT

**[ABRIR CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md)** — Este es el documento de traspaso completo del chat del 27/10/2026. **LEER ANTES de hacer cambios o pedir información al propietario.** Empieza con «LO PRIMERO QUE DEBES HACER EN EL NUEVO CHAT» y registra S02 aceptado para músicos NUEVOS (bloqueo duplicado + alerta verificados), el siguiente trabajo en M01 (fotos), las rutas/CI y la futura migración prudente de los seis músicos antiguos. No duplicar planes ni restaurar flujos descartados.

**Instrucción de continuidad del propietario:** «Revisa el Plan Maestro y sigue con la continuidad de HAVANA NICE V2». Al recibirla, abrir primero el documento enlazado y este tablero de 27 hitos; contrastar GitHub/Cloudflare en lectura inicial y seguir ejecutando la primera tarea pendiente. **Estado vigente: 12/27 hitos; S01 y S02 cerrados bajo el alcance aceptado. Próximo: M01.**

**Actualizado:** 27/10/2026. **Estado oficial: 12/27 hitos cerrados, 15 abiertos (44 %).** S02 aceptado por el propietario tras la prueba física de bloqueo en segundo teléfono y alerta en Admin. El alcance cerrado es la regla en **altas nuevas**; los seis músicos históricos permanecen en modo compatible para no cortar sus sesiones. No se exigirá QA adicional de desconexión o liberación para reabrir S02.

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

**Compatibilidad de los seis músicos anteriores:** Andy, Fer, Jali, Noa, Orly y Rafa siguen con `single_device_mode=0`; sus sesiones NO están sometidas aún al bloqueo por instalación. La aceptación de S02 cubre **altas nuevas**, no autoriza a presentar esas seis cuentas como migradas. Conservar las credenciales antiguas y revisar su adaptación gradual junto con H03/Q01, solo cuando pueda hacerse sin pérdida de sesión, conversaciones o borradores. No retrasar M01 por pruebas de seguridad adicionales.

## 3. Acceso exclusivo del Administrador

- Autenticación privada independiente del nombre de músico; token de corta duración, seguridad y revocación de otras sesiones.
- Un solo módulo «Acceso a músicos»: añadir, lista, estado de vinculación, historial real de entradas/conexiones, «Ver datos asociados» solo lectura, intentos duplicados, «Liberar dispositivo» y papelera con confirmación.
- Eliminar a un músico expulsa inmediatamente sus sockets y bloquea reingreso. Liberar un dispositivo **no** elimina la cuenta ni las conversaciones.
- Recuento de «credenciales» de D1 no equivale a «teléfonos conectados».
- Si existe multimedia externa sin procedimiento completo de borrado, la papelera debe fallar con seguridad sin dejar objetos huérfanos.
- Las secciones Administrador Chat, Repertorio, Calendario y Más están pendientes de habilitar; no mostrar datos falsos ni interfaces paralelas.

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
- [x] **S02 · Un músico nuevo · una instalación · alerta Admin (ACEPTADO).** Prueba real 27/10 con `Prueba 2`: primer teléfono entró, segundo teléfono recibió rechazo por nombre vinculado y Admin mostró alerta fechada. D1 confirmó 1 vínculo y 1 alerta. Propietario consideró cumplido el objetivo principal y descartó más QA de seguridad en este hito. «Liberar dispositivo» existe en Admin, pero no se ha ensayado físicamente; no afirmar que fue probado. **Excepción conocida:** las seis cuentas históricas siguen con acceso legado; adaptación futura en H03/Q01, sin cierre forzado.
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

**Totales:** 12 confirmados / 15 pendientes. S01 está cerrado por evidencia real de alta a expulsión. S02 está cerrado por aceptación explícita del propietario y evidencia física de **un usuario nuevo**, bloqueo del acceso duplicado y alerta Admin. No se han validado liberación física, desconexión ni migración de cuentas antiguas; esas comprobaciones NO son requisito pendiente de S02 tras el ajuste de alcance.

## 5. Estado técnico comprobado en esta limpieza

- **D1 antes del ensayo S02:** seis miembros históricos autorizados, diez sesiones de Chat y 45 mensajes; sin titulares vinculados ni alertas. **Tras el ensayo con `Prueba 2`:** siete nombres autorizados (seis antiguos + usuario temporal), exactamente un dispositivo vinculado y una alerta de acceso duplicado, verificado por lectura de D1. `Prueba 2` sigue autorizado para QA; no borrarlo automáticamente ni usar la cuenta como músico permanente.
- **Backend de acceso:** `POST /api/chat/session` para músico, `GET /api/chat/session` para recuperar, `DELETE /api/chat/session` para cerrar; `/api/chat/admin/auth/*` exclusivo de Administrador y rutas de gestión del músico/vinculación/alertas. Una sola fuente de validación.
- **Acceso nuevo:** `chat_single_device_owners` y `chat_duplicate_login_alerts` son las únicas tablas adicionales específicas de instalación y alertas.
- **Limpieza definitiva realizada:** eliminados del código y D1 el flujo de pedir/aprobar teléfonos y la inscripción experimental PWA. No hay botones, endpoints ni tablas de ese mecanismo; las sesiones del Chat que existían continúan intactas.
- **CI:** pruebas de tipado, autenticación independiente, restricción de duplicados, bloqueo de endpoints borrados y conservación de WebSocket/Chat; exigir SUCCESS antes de distribuciones.
- **Avance S02 verificado (27/10):** commit `5199a3af795a402e5a042e10ee10cd771777f6a4`; Foundation CI `40552356302` SUCCESS, repetido con éxito tras desplegar; Cloudflare Pages desplegado para ese commit; Worker V2 versión `fc65de5a-323c-4351-bf4f-c70c8bd86748` al 100 %. La ruta DELETE ya no puede dejar huérfana la credencial titular; libera únicamente el Administrador. Eliminada además una interrupción accidental del guardado de borradores PWA causada por eventos de escritura ajenos. D1 se volvió a leer: 6 músicos activos, 10 sesiones, 45 mensajes, 0 titulares nuevos y 0 alertas, sin mutaciones de prueba.
- **Protección pendiente en H03/Q01, no bloqueante para M01:** revisar la retención local de borradores/cola no enviados ante revocación o restauración 401; los clientes actuales pueden limpiar esos datos. No confundir mensajes ya guardados en D1 con borradores offline. Resolver antes de migrar las seis cuentas reales; no publicar APK sin QA correspondiente.

## 6. Próxima secuencia: M01 · Fotos privadas en Chat

1. **S02 ACEPTADO el 27/10 por el propietario:** `Prueba 2` inició desde un teléfono; otro rechazado con mensaje de nombre vinculado; Admin mostró alerta 27/10 11:58 a. m.; D1 confirmó 1 vinculación y 1 alerta. No añadir pruebas de seguridad no solicitadas. El mecanismo de liberación permanece disponible, pero no se ensayó físicamente.
2. **Continuar M01 funcional:** inspeccionar contrato de Chat, almacenamiento multimedia realmente disponible y rutas de subida segura, sin activar cobros ni exponer archivos. Implementar fotos privadas (subida/compresión/miniatura/progreso/visor inicial) para Chat iPhone PWA, Android React Native nativo y la gestión que corresponda en Admin, sobre un solo backend/plan.
3. **Sin romper lo existente:** mantener los seis músicos antiguos y sus sesiones, firma de Android 0.0.4, historial, cola local y caché. `Prueba 2` sigue siendo usuario QA temporal.
4. **Adaptación futura H03/Q01:** la regla de un único dispositivo todavía no aplica a los seis usuarios anteriores. La migración prudente y recuperación de borradores ante revocación se harán sin interrupciones, sin reabrir S02 ni bloquear el trabajo funcional.
5. **Siguiente orden:** completar M01–M04 y M05 de manera funcional, después H02–H04 / P01–P05 en el orden coordinado único, ajustando prioridades solo a petición del propietario.
**No crear copias del plan, ramas alternativas, login paralelo ni parches flotantes. La app de producción original queda protegida.**
