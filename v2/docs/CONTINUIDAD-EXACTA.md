# HAVANA NICE V2 — CONTINUIDAD EXACTA Y ÚNICA

**Corte verificado:** 28/10/2026 UTC (27/10, horario de Ciudad de México). **Fuente permanente de trabajo:** [Plan Maestro de 27 hitos](./PLAN-MAESTRO.md). Este archivo reemplaza **íntegramente** la continuidad anterior. No crear duplicados, documentos paralelos ni recuperar instrucciones desechadas.

> **INSTRUCCIÓN PARA EL SIGUIENTE CHAT:** continuar HAVANA NICE V2 desde este documento y `PLAN-MAESTRO.md`. Antes de actuar, consultar en lectura GitHub/Cloudflare y las pruebas más recientes; no pedir al propietario que repita requisitos ya decididos. **APK Android 0.0.6 validada físicamente por el propietario el 27/10/2026** («Quedó perfecto»). El foco inmediato ya es M01: foto privada real en HAVANA CLOUD, asociada al Chat/Administrador; M02 después. No rehacer el acceso de músicos, no reabrir hitos cerrados ni introducir diseños rechazados. Ejecutar las tareas desde las integraciones disponibles sin pedirle al propietario que programe, suba archivos a mano, manipule tokens o limpie datos.

## 1. Decisiones irrevocables de trabajo y protección

- **Un proyecto, una línea y un Plan Maestro de 27 hitos.** Solo una arquitectura activa por módulo. Eliminar del código los elementos obsoletos rechazados, no dejarlos ocultos, desactivados o en archivos paralelos para confundir en el futuro. Nunca sustituir trabajo real por parches o maquetas que simulen funcionalidad.
- **No romper nada que ya funcione** en HAVANA NICE V2 o en HAVANA CLOUD. No modificar ni borrar datos, fotos personales, dispositivos, sesiones, mensajes o permisos ajenos a la tarea. Hacer cambios pequeños, pruebas automáticas y verificación post-despliegue.
- El propietario indica objetivos, revisa capturas y hace pruebas físicas que solo él puede realizar. El asistente se encarga del código, CI, GitHub y Cloudflare mediante conectores cuando estén disponibles; no transferir trabajo técnico innecesario al propietario. Explicar honestamente los bloqueos y los cambios no verificados.
- **Chat Android 100 % React Native nativo**, nunca WebView de Chat. **Chat iPhone PWA**. **Administrador PWA único**. Otros módulos Android pueden adoptar PWA visual compartida; toda operación real usa la misma lógica de negocio de V2.
- Construcción sincronizada por módulo: contrato/Worker y datos únicos → PWA → Android nativo cuando corresponda → Administrador → pruebas integrales. Primero funcionalidad; no invertir recursos en colores, efectos o seguridad desproporcionada para este grupo musical.
- **Conservar APK y datos locales:** actualizaciones sobre `com.havananice.v2`, con certificado idéntico, versionCode creciente, sin desinstalar ni borrar caché/sesión/borradores. No asumir que una APK publicada ya está físicamente instalada.
- **No cobros nuevos, almacenamiento paralelo, OAuth de músico a Google ni cambios silenciosos en producción.** Evitar R2 u otras nubes para este Chat; utilizar HAVANA CLOUD ya existente. Cualquier límite de cuota, token vencido o transferencia fallida debe comunicarse sin prometer costo cero absoluto.
- **No activar audios, archivos genéricos o documentos** en el puente de HAVANA CLOUD; la prioridad presente es exclusivamente **fotografías y videos**. M03 se conserva en el tablero original, pero queda aplazado.

## 2. Fuentes, repositorios y URLs actuales

### HAVANA NICE V2
- Repositorio GitHub: `Abnernoa97/havana-nice-pwa`.
- **Rama fuente activa V2:** `havana-nice-v2-foundation`. El `main` antiguo pertenece a la app anterior; no tocarlo ni mover la producción original. La rama `havana-nice-v2-apk-downloads` **solo distribuye los binarios verificados**, no es otra fuente de código. Puede existir historial de ramas antiguas; no son backends alternativos.
- `v2/docs/PLAN-MAESTRO.md`: tablero canónico y decisiones.
- `v2/docs/CONTINUIDAD-EXACTA.md`: **este documento único de traspaso**.
- PWA músico: https://havana-nice-v2-dev.pages.dev/
- Administrador: https://havana-nice-v2-dev.pages.dev/admin.html
- Worker/API V2: https://havana-nice-v2-dev.soloaplicaciones97.workers.dev
- Worker `havana-nice-v2-dev`, D1 UUID `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5`, Durable Object `CHAT_ROOMS`; cuenta Cloudflare Soloaplicaciones. Todo aislado de la app antigua.
- Código: `v2/apps/pwa/src/App.tsx`, `ChatComposerIcon.tsx`, `AdminApp.tsx`, `AdminChatAccess.tsx`, `admin-api.ts`; Android `v2/apps/android/App.tsx`, `ChatComposerIcon.tsx`, `app.json`; compartido `v2/packages/shared/src/index.ts`; Worker `v2/cloudflare/src/index.ts`, `message-removal.js`, `havana-cloud-bridge-client.js`. Confirmar árbol actual antes de editar.

### HAVANA CLOUD
- Repositorio GitHub distinto: `Abnernoa97/havana-nice-cloud`.
- **`main` de HAVANA CLOUD:** producto existente, conectado a las cuentas Google Drive autorizadas; conservar biblioteca personal y permisos. La rama **preexistente** `havana-nice-v2-cloud-bridge-lab` contiene el puente experimental privado y sus tests; no mezclarla en producción sin validaciones.
- Worker actual `havana-nice-cloud` y web https://havana-nice-cloud.soloaplicaciones97.workers.dev
- **HAVANA CLOUD continúa siendo la nube y su GALERÍA EXISTENTE se conserva íntegra.** El propietario autoriza expresamente que allí se vean también los archivos del Chat, y organizará manualmente una carpeta **HAVANA NICE APP** dentro de la biblioteca normal. El Perfil HAVANA NICE APP sigue mostrando **solo sus estadísticas** de capacidad/uso (sin convertir el Perfil en galería). Chat V2 y su Administrador muestran los archivos en sus mensajes. **No crear nueva galería ni alterar el funcionamiento existente de Cloud.**
- Registro aislado de la app: `worker/havana-v2-app-space.ts` en el `GoogleAccountStore` existente, prefijo Durable Object `havana-app:v1:media:` (distinto de biblioteca/Google/carpetas); GET autenticado `/api/havana-nice-app/status`. **Ese registro no equivale a subir fotos:** hoy el contador está preparado pero no hay multimedia real del Chat.
- El puente nuevo es único: CLOUD LAB worker/havana-v2-unified-transfer.ts y V2 cloudflare/src/unified-media.js. Su transporte es por fragmentos; ambos Workers aún deben desplegarse y enlazarse en privado.

## 3. Último estado REAL auditado (no extrapolar estados antiguos)

- **GitHub V2 código fuente:** rama havana-nice-v2-foundation; verificar su HEAD en GitHub al reanudar, sin usar el SHA antiguo de la APK como versión vigente de fuente.
- **GitHub Actions en el commit de APK** `828e0682815dfc0579e3197ed7a4c582372887ad`: Foundation CI `40613744827` **SUCCESS**; compilación de APK `40613744649` **SUCCESS**; publicador directo `40613744654` **SUCCESS**.
- **Cloudflare V2 Worker** desplegado: `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`; **HAVANA CLOUD Worker**: `a5165b9e-b952-42b3-9468-e86da0190a11`. Esas versiones de Worker son la última auditoría de despliegue y todavía no incluyen el nuevo transporte. No confundir CI de GitHub con despliegue operativo en Cloudflare.
- **Lectura de D1 al cierre de la conversación:** **3 músicos, 3 sesiones de músicos, 3 instalaciones vinculadas, 44 mensajes (última comprobación 28/10), 11 reacciones (última lectura), 0 registros de multimedia y 0 mensajes marcados eliminados**. Hay un músico adicional respecto a auditorías viejas de 2; **no asumir su nombre** sin consultarlo. No modificar D1 para volver a 2.
- Todos los seis músicos históricos y `Prueba 2` fueron **retirados del padrón a petición del propietario** el 27/10; el propietario volvió a crear músicos manualmente desde Administrador con la nueva lógica. Se conservaron mensajes/reacciones históricos, sin restaurar credenciales de cuentas eliminadas. No autosembrar el grupo original.
- **No afirmar pruebas físicas inexistentes.** El borrado físico nuevo sigue pendiente de prueba; la instalación Android 0.0.6 ya fue confirmada por el propietario; la PWA con nuevo compositor y los selectores **sí fue confirmada con fotografías del teléfono**.

## 4. APK Android nativa: 0.0.6 PUBLICADA, verificada y validada físicamente

La petición más reciente del propietario fue obtener **una actualización de Android ahora**, para trabajar con la interfaz aprobada antes de conectar HAVANA CLOUD. **Ya se generó y publicó la actualización**, aunque la respuesta visible sobre la compilación todavía estaba en proceso durante ese chat. No reconstruir un segundo instalador si ya está el correcto.

- **Nombre:** HAVANA NICE V2 Android **0.0.6**.
- **Package:** `com.havananice.v2`; **versionCode 6**, superior a 0.0.5/versionCode 5.
- **URL directa APK publicada y verificada HTTP 200:** https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-ANDROID-828e0682815d.apk
- **SHA-256 de APK:** `6f66111fa3f935c61788718fb4c220211f725f05f66e19ad603896d18f24e50e`.
- Firma del certificado idéntica a APK 0.0.5: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. Verificador `v2/scripts/apk-signature-gate.py` pasó antes de publicar.
- APK independiente con bundle JS y recursos incluidos; no requiere Metro. **Actualizar encima de la app instalada, jamás desinstalar ni borrar datos/caché.**
- **QA físico del instalador confirmado el 27/10:** el propietario instaló/probó 0.0.6 y respondió «Quedó perfecto». La confirmación respalda la actualización y el compositor aprobado; no inventar pruebas adicionales que no documentó explícitamente. Si falla la instalación, **no** aconsejar desinstalar: comparar firma y versionCode del teléfono con APK antes de actuar.
- Flujos de build/distribución GitHub: `.github/workflows/v2-android-apk.yml` y `v2-apk-direct-download.yml` con guard de misma firma y versionCode mayor; disparan por cambio **específico** de `v2/apps/android/app.json` o manualmente. No generar otra APK por cada retoque de PWA o documentación.

## 5. Chat de texto: cerrado y protegido; no reconstruirlo

- **12/27 hitos** reconocidos y **15 pendientes**: cerrados `B01 B02 B03 B04 C01 C02 C03 C04 C05 H01 S01 S02`.
- Texto real sincronizado entre iPhone PWA y Chat Android React Native por **único** Worker/D1/Durable Object; nombre de autor, burbujas, respuestas, editar/borrar según permisos, reacciones, leído, swipe/menú contextual, cola y borradores offline, reconexión. No introducir segundo Chat o segundo mensaje almacenado.
- Acceso de músicos: solo un **nombre autorizado por Administrador**, una instalación vinculada al primer acceso, token opaco persistente, 409 para duplicado y alerta en Admin. Sin contraseñas de músicos, aprobaciones manuales de teléfonos ni puertas alternativas. El propietario dio S01/S02 por **cerrados**; no reabrirlos ni exigir ensayos de seguridad bancarios.
- Administrador: **un solo Chat general** donde el administrador **VE TODO** en burbujas de los músicos, autor/fecha/reacciones/presencia, pero **NO escribe como músico**. Puede eliminar mensajes de todos; reutiliza la sesión Admin y WebSocket privado `/ws/admin`, no se autentica como un músico.
- **Eliminación definitiva**: no mostrar «Mensaje eliminado». Backend `message-removal.js` elimina físicamente registro D1, elimina reacciones, desvincula respuestas y notifica `chat.deleted` y `admin.chat.deleted` en una sola lógica. Fueron retirados cuatro registros de borrado antiguo; D1 mantiene 0 marcadores. No volver al borrado lógico o a burbujas fantasma. En un futuro, borrado de foto/video también eliminará el objeto privado desde HAVANA CLOUD, con confirmación/reintentos sin fingir éxito.
- Admin URL `/admin.html`: menú de acceso a músicos + Chat general; otros módulos en construcción. Antes se corrigió CORS para DELETE en **una sola ruta** del Worker; no inventar otro endpoint de moderación.

## 6. Compositor de fotos y videos APROBADO físicamente en PWA

El propietario mostró capturas del menú anterior y lo rechazó. **Forma definitiva y única tipo WhatsApp** (el diseño ya está en PWA y en código Android):

1. En la misma barra compacta: **emoji** (funciona, confirmado como correcto), campo «Mensaje», **clip**, **cámara directa**, círculo negro con **micrófono si no hay texto** / **enviar texto cuando escribes**.
2. Al tocar el **clip** aparece un **menú flotante**, encima de las burbujas sin desplazar el Chat, y con solo dos elementos **VERTICALES**: **«Fotos»** arriba y **«Video»** debajo. **Fotos** abre selector de imágenes del teléfono; **Video** abre selector filtrado de videos.
3. Al tocar **cámara en la barra** se abre la cámara del teléfono para capturar. En PWA se validó físicamente el lanzamiento de la cámara Android mediante `capture='environment'`; en nativo se usa `expo-image-picker.launchCameraAsync`, autorizado solo al usarla.
4. Selección con vista previa, tamaño y quitar archivo. La nueva fuente permite originales hasta 100 MiB por foto/10 GiB por video en fragmentos de 4 MiB; **sin enviar todavía en producción** hasta instalar Service Binding y migrar D1.
5. **BORRAR PARA SIEMPRE de la fuente V2** los controles anteriores y no reintroducirlos: menú clip «Galería»/«Cámara», cuadrícula de cuatro botones, botón «+», estilos/handlers obsoletos y opciones en otra pantalla. Ya se reemplazaron en código; los tests `v2/tests/chat-media-ui.test.mjs` vigilan regresiones.
6. **Micrófono:** solo informativo por ahora; no pedir permisos ni grabar audios hasta M03, que queda pospuesto. Se mantiene emoji interactivo.
7. **Sin envíos simulados:** la acción de Enviar media está regida por los flags del Worker, no por una constante antigua. Ninguna burbuja se publica hasta que Google Drive confirme bytes y D1 confirme mensaje.

**Evidencia:** fotografías del propietario 28/10: 1) PWA muestra «Fotos / Video» correctamente, 2) al tocar cámara abre la cámara real, 3) confirma que el selector de Fotos carga imágenes y el de Video carga videos. El propietario solicitó después una APK de Android para continuar y luego enlazar HAVANA CLOUD.

## 7. ÚNICA ruta foto/video — CLOUD almacena; Chat y Administrador visualizan

**Regla definitiva revisada por el propietario (28/10 UTC):** No existe problema en que fotos y videos del Chat se vean también en la **galería normal y ya existente de HAVANA CLOUD**. Su organización se hará mediante una carpeta manual llamada **HAVANA NICE APP**, que él mismo creará. **No crear otra galería ni páginas nuevas** y jamás cambiar el funcionamiento existente de HAVANA CLOUD. El Perfil HAVANA NICE APP mantiene solo datos de capacidad/uso. El Chat V2 Android/PWA selecciona y envía hasta cinco originales mezclados; el Worker V2 autentica la sesión, transmite por Service Binding privado a CLOUD y almacena referencias en D1. Chat y especialmente **Administrador → Chat general** muestran su foto/video, reproducción y borrado. Nunca entregar Drive OAuth ni tokens Google a músicos o Administrador.

**Calidad/límites y lotes:** **máximo CINCO archivos por envío** (CI de selección múltiple y lote: [SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40628869932)), no cinco de cada tipo: cinco fotos, cinco videos, tres fotos + dos videos, una foto + cuatro videos, etc. Un solo Enviar, cola acumulativa, selección múltiple desde Fotos/Video, cada archivo original vinculado a su mensaje y administrable en Chat general. Si falla un archivo, conservar los pendientes con la identidad del lote para reintentar sin duplicar los confirmados. Límite tanto en cliente como en D1 por índice 0-4 y único por músico/lote/índice. Sin compresión deliberada del original. Fotos hasta **100 MiB** (jpeg/png/webp/heic/heif) y videos hasta **10 GiB** (mp4/quicktime), enviados en fragmentos de 4 MiB. El archivo debe caber en una sola cuenta Drive con cuota disponible. Miniaturas y portadas ligeras para visualización; jamás sustituir el original. Nada de audio ni documentos por ahora.

**Limpieza realmente ejecutada en GitHub:** el módulo v2/cloudflare/src/drive-media.js, sus tests exclusivos y el bootstrap 0005_v2_drive_media.sql se BORRARON de la rama de trabajo; sus rutas/importaciones antiguas fueron retiradas. Se borraron también los prototipos CLOUD LAB worker/havana-v2-photo-transfer.ts y worker/havana-v2-photo-google.ts, que cargaban las fotos completas en memoria; no reintroducirlos. Ambos fueron reemplazados por una sola ruta foto/video.

**Fuente nueva preparada, aún NO desplegada:** V2 `cloudflare/src/unified-media.js` (inicio, fragmentos, mensaje D1 confirmado, lectura autenticada, eliminación ligada al original), PWA `media-upload.ts`, Android `media-upload.ts` y visores Chat/Administrador. CLOUD LAB `worker/havana-v2-unified-transfer.ts`, `worker/havana-v2-upload-recovery.ts` y DO privado reutilizan las cuentas Google Drive existentes pero sin tocar la lógica de su galería personal. **Ya NO se ocultan archivos del Chat:** se quitó el filtro del sincronizador y se borraron la convención `.blob` y MIME `application/octet-stream` solo usados para impedir la visibilidad. Ahora el archivo se sube con sus **bytes exactos, MIME foto/video y nombre normal**, permitiendo su ingreso en la biblioteca habitual mediante la sincronización Drive ya existente. El propietario creará la carpeta HAVANA NICE APP y organizará archivos; la asignación automática y el momento exacto de aparición no están implementados ni probados. CI verificada de MIME original y galería normal sin cambiar Cloud: https://github.com/Abnernoa97/havana-nice-cloud/actions/runs/40631799354 (SUCCESS). Se compararon directamente `main` vs LAB y son **idénticos** el método de sincronización, su endpoint y el uploader normal de Cloud. `main`, el Worker productivo y toda la biblioteca personal de HAVANA CLOUD siguen sin cambios.



**Comprobado por CI (sin subir bytes reales a Drive):** V2 <https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40628869932> SUCCESS (hasta 5 fotos/videos en lote); CLOUD LAB <https://github.com/Abnernoa97/havana-nice-cloud/actions/runs/40629805508> SUCCESS para controles anteriores; verificar CI reciente del cambio a galería normal antes de activar. APK 0.0.6 ya aprobada físicamente, SIN nueva APK generada en este trabajo. Las pruebas no equivalen a QA real de subida en teléfonos.

**D1 REAL ACTUALIZADA DE FORMA ADITIVA Y VERIFICADA (28/10 UTC):** nueva `chat_media_assets` y **2 índices** ya creados en Cloudflare con hasta cinco posiciones por envío. Comprobación posterior: **44 mensajes, 3 músicos, 0 multimedia nueva, 0 archivos/bytes en tablas antiguas**. No se borraron aún las tablas vacías de media viejo porque la versión ACTUAL de Administrador consulta una; retirarlas físicamente de D1 solo tras desplegar/verificar el nuevo Worker que ya no depende de ellas.

**Auditoría CI de despliegue seguro (28/10 UTC):** rama `havana-nice-v2-cloud-bridge-lab` aprobó `npx tsc --project tsconfig.worker.json --noEmit`, pruebas reales de código de reanudación, subida con MIME original, comparación automática de partes esenciales de `worker/index.ts` con `main` (subida/sync/registro), y `wrangler deploy --dry-run` en [CI 40632752522](https://github.com/Abnernoa97/havana-nice-cloud/actions/runs/40632752522). El paquete **no fue desplegado**. La verificación completa de Chat V2 incluye ahora el bundle Wrangler real y aprobó [CI 40632794953](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40632794953). Consulta real Cloudflare mantiene 44 mensajes, 3 músicos, 0 media. Sin binding/flags vivos en Worker actual. No activar por escribir solamente Wrangler ni tocar Google/Cloud main por atajos.

**Avance real siguiente (28/10 UTC):** [CLOUD LAB CI 40633586383 SUCCESS](https://github.com/Abnernoa97/havana-nice-cloud/actions/runs/40633586383): recupera original ya confirmado incluso si cuenta Drive llegó a cuota completa, comprueba cuota al iniciar nuevos y usa el catálogo Google normal sin cambiarlo. [V2 CI 40633636899 SUCCESS](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40633636899): 5 adjuntos mixtos, sexta posición rechazada, índice repetido rechazado antes de iniciar otra sesión remota y reintento idempotente. Backend CI incluye Wrangler dry-run. Producción Cloudflare revisada: CLOUD version `a5165b9e-b952-42b3-9468-e86da0190a11` y V2 version `efbedccb-4d2d-4a3e-a560-8acb91c5a9eb`, ambas al 100%, **SIN desplegar la versión nueva**, conservadas para rollback. **Bloqueo material:** despliegue CLOUD completo incluye assets PWA/bindings y secretos. Nunca sustituirlo por un Worker parcial ni confundir `dry-run` con código vivo. Pendiente una publicación versionada integral coordinada (conservando assets, secretos, DO y credenciales), Service Binding y prueba Google real.

**Bloqueo para activación:** los Workers reales todavía no incorporan el código unificado; el Service Binding `HAVANA_CLOUD_BRIDGE` está **definido en `v2/cloudflare/wrangler.jsonc`, todavía NO instalado en el Worker vivo**, sin flags `V2_CLOUD_BRIDGE_ENABLED`/`V2_CLOUD_BRIDGE_MEDIA_ENABLED`; Cloud necesita HAVANA_V2_BRIDGE_ENABLED/HAVANA_V2_MEDIA_ENABLED y un secreto compartido. La biblioteca personal de CLOUD y la app original main no fueron modificadas. Google OAuth actual y espacio por cuenta no verificados en vivo. **NO afirmar que Fotos/Video ya están guardando o que M01/M02 están cerrados.**

**Siguiente orden:** validar que Google Drive conserve MIME y nombre original, que HAVANA CLOUD lo catalogue por su sincronizador habitual y que moverlo a carpeta manual no interfiera con el enlace en Chat/Admin. Verificar una transferencia REAL aislada con cuentas OAuth activas; coordinar el despliegue seguro de CLOUD y D1/V2 manteniendo flags OFF, verificar lectura y borrado Admin y miniaturas sin descargar originales completos; activar flags después; preparar UNA nueva APK sobre 0.0.6 con misma firma cuando backend esté probado; completar QA física PWA/Android/Admin. M01 y M02 siguen abiertos. M03 audios aplazados.

## 8. Tablero maestro exacto: 27 hitos

**CERRADOS (12):** `B01` Fundación V2 aislada; `B02` Chat básico; `B03` nombre persistente; `B04` auditoría base; `C01` menú contextual; `C02` editar/eliminar; `C03` responder deslizando; `C04` offline/reconexión; `C05` sincronización de texto; `H01` línea base Android/firma; `S01` altas desde Admin; `S02` una instalación por músico nuevo y alerta (alcance aceptado).

**ABIERTOS (15):** `H02` módulos Android no Chat con PWA visual; `H03` sesión/navegación; `H04` actualizaciones visuales sin APK; `M01` fotografías reales; `M02` videos reales; `M03` audios (aplazado); `M04` visor multimedia completo; `M05` push; `P01` Home; `P02` Calendario; `P03` Repertorio; `P04` Admin completo; `P05` avisos/perfiles; `Q01` QA integral; `Q02` migración a producción solo cuando el propietario autorice.

**12/27 = 44 %; faltan 15.** La pantalla Chat general Admin y la interfaz fotos/video son **avances parciales dentro de hitos abiertos**, no hitos nuevos. No inflar porcentajes ni abrir otro tablero maestro.

## 9. Reglas de QA, limpieza y migración que NO se deben olvidar

- Comprobar CI completo `.github/workflows/v2-foundation-check.yml`, tests Chat/moderación/CORS, aislamiento, PWA, TypeScript, Expo export y endpoints privados antes de publicar. No mutar D1 como parte de una auditoría; no inventar métricas ni compatibilidad probada.
- **Una sola fuente de verdad:** mensajes/autores/permisos y referencias multimedia en D1 V2; bytes/gestión de Drive en HAVANA CLOUD. El Administrador reutiliza ese flujo y no genera copias.
- Cada corrección debe **reemplazar** el código anterior y borrar rutas/estilos/funciones definitivamente rechazados. Antes de eliminar una parte aparentemente antigua, inspeccionar sus dependencias y preservar trabajos futuros legítimos. Mantener pruebas de no regresión para los elementos descartados.
- No tocar `main` de la app anterior, no alterar otros Workers/Cloudflare builds/servicios, no inventar nuevas URLs ni distribuir APK no verificada.
- Mantener en Android el mismo paquete, firma y sesion; en PWA permitir actualizaciones visuales mediante Pages, pero no fingir una actualización nativa. **No actualizar Android por cada ajuste visual:** solo cuando el usuario pida una entrega empaquetada.
- No repetir la prueba S02 del segundo teléfono ni la seguridad del nombre si no hay regresión. Riesgo conocido/aceptado: el primero que conoce el nombre podría ocupar el vínculo; no inventar seguridad de hardware.
- **Deuda técnica acotada** para H03/Q01: si una sesión es revocada o la recuperación devuelve 401, verificar si el cliente borra borradores/cola sin enviar; no provocar ese escenario destruyendo sesiones existentes. El Worker puede conservar rutas de compatibilidad para registros legado `single_device_mode=0` aunque hoy los usuarios activos utilicen modo único; no afirmar eliminación absoluta del código legado sin nueva auditoría.
- Más adelante, otros módulos deben crecer en PWA + Android + Administrador al mismo tiempo (Calendario, Repertorio, Home), siempre con un único backend; no crear segundas versiones de la lógica.

## 10. Acción concreta al abrir el siguiente chat

Leer este documento y Plan Maestro en la rama havana-nice-v2-foundation; verificar HEAD, CI, Workers y D1. No pedir prueba APK 0.0.6 ya confirmada ni rehacer rutas eliminadas. Continuar la sección 7: despliegue sincronizado y pruebas REALES del único flujo foto/video; HAVANA CLOUD solo guarda, Administrador muestra. No repetir preguntas técnicas ni abrir otro Plan Maestro; conservar 12/27 hasta QA real.

**FIN DE LA CONTINUIDAD VIGENTE. No existe un segundo plan ni un segundo archivo de traspaso.**
