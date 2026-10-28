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
- Código: `v2/apps/pwa/src/App.tsx`, `ChatComposerIcon.tsx`, `AdminApp.tsx`, `AdminChatAccess.tsx`, `admin-api.ts`; Android `v2/apps/android/App.tsx`, `ChatComposerIcon.tsx`, `app.json`; compartido `v2/packages/shared/src/index.ts`; Worker `v2/cloudflare/src/index.ts`, `message-removal.js`, `unified-media.js` (preparación no operativa). Confirmar árbol actual antes de editar.

### HAVANA CLOUD — intocable

- Repositorio separado `Abnernoa97/havana-nice-cloud`, **única fuente `main`**; Worker productivo `havana-nice-cloud`, web https://havana-nice-cloud.soloaplicaciones97.workers.dev. No modificar código, PWA, Worker, conexiones Google, galería, credenciales, caché, datos, despliegues ni versiones de este producto por necesidades de V2.
- La rama experimental anterior `havana-nice-v2-cloud-bridge-lab` fue **restituida exactamente al SHA de `main` `9e22460751a4de7e3b85aca8096752e1372eb14d`**, eliminando en su árbol activo las ocho adiciones, tres diferencias y el mecanismo de publicación innecesario. No volver a reabrir ese puente: **NO existe desarrollo alternativo activo de CLOUD**.
- Las fotos/videos del Chat pueden aparecer también en la **galería normal ya existente** de CLOUD. El propietario creará/organizará manualmente la carpeta **HAVANA NICE APP**. No crear una galería paralela ni convertir el Perfil HAVANA NICE APP en galería; conserva las estadísticas actuales.
- La función de estado `/api/havana-nice-app/status` ya pertenece a CLOUD main y no almacena ni activa subidas del Chat.
- La API CLOUD **existente** ofrece `/api/google/upload/session` y `/api/google/upload/chunk`; funciona con cuentas Drive autorizadas y **sesión autenticada de CLOUD**. No entregar contraseña, cookies, tokens OAuth ni sesiones a músicos. Primero estudiar un enlace seguro SOLO DESDE EL WORKER V2 sin ampliar las funciones de CLOUD. Si la autenticación existente no lo admite de forma segura, explicarlo como bloqueo real: no simular éxito.

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

## 7. M01/M02 — un solo Chat multimedia, HAVANA CLOUD intacta

**Decisión vigente del propietario (28/10):** conservar HAVANA CLOUD exactamente como funciona hoy. Los originales del Chat se podrán ver también en su galería habitual y organizar manualmente en carpeta **HAVANA NICE APP**. El **único proyecto en desarrollo es HAVANA NICE V2**; no crear Worker's alternos, ramas LAB con puente, segundas nubes, nuevas versiones de CLOUD ni publicar nada de CLOUD para integrar el Chat.

**Límites y UX aprobados:** máximo **cinco archivos combinados por envío** (fotos y videos mezclados, nunca 5+5), selección múltiple y una acción Enviar. Originales sin compresión deliberada: fotos JPEG/PNG/WebP/HEIC/HEIF hasta 100 MiB; videos MP4/QuickTime hasta 10 GiB, fragmentos de 4 MiB. Menú del clip solo **Fotos** y **Video**; cámara desde botón separado. PWA aprobada y APK 0.0.6 instalada físicamente, con selectores funcionando. Admin Chat general debe poder ver y borrar mensajes/autores sin escribir en Chat; los archivos no se publican como mensajes hasta confirmación remota y D1.

**Estado verdadero del código V2:** `cloudflare/src/unified-media.js`, `apps/pwa/src/media-upload.ts`, `apps/android/media-upload.ts` y visores fueron preparados pero **NO están integrados a una vía real y autenticada de CLOUD**. El modelo anterior `HAVANA_CLOUD_BRIDGE` / `/api/internal/havana-v2/...` requería modificar CLOUD, lo cual está PROHIBIDO. Por eso se **eliminó físicamente** `services.HAVANA_CLOUD_BRIDGE` del `wrangler.jsonc` V2 y el módulo auxiliar sin uso `havana-cloud-bridge-client.js`. El código media V2 que aún conserva llamadas al viejo protocolo debe refactorizarse/reemplazarse EN V2 antes de activarse; hoy el Worker activo continúa rechazando subida. No considerar ese código «conexión preparada» o «traspaso listo para desplegar».

**D1 verificada, sin borrados destructivos:** `chat_media_assets` más índices de la migración aditiva `0014_unified_chat_media.sql` ya existentes. Último control: 44 mensajes, 3 músicos, **0 archivos multimedia**; no borrar tablas antiguas mientras el Worker productivo aún dependa de ellas. No tocar sesiones, mensajes, dispositivos, archivos personales ni caché. M01/M02 abiertos; 12 de 27 hitos terminados.

**Auditoría y limpieza ejecutadas:** El Cloud LAB experimental se eliminó de su rama activa al igualarla byte por byte con `main` (SHA indicado en sección 2). No hay flujo de subida/versión nueva de CLOUD; no hay despliegues. En la rama V2 siguen únicamente el código de Chat, UI, D1 y pruebas que necesitamos para M01/M02; las pruebas de lote mixto y duplicados V2 aprobaron [GitHub CI 40633636899](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40633636899). Son simulaciones; **ninguna transferencia real a Google Drive ha sido confirmada**. No reproducir antiguas cronologías de experimentos, ni restaurar laboratorios de CLOUD.

**Próximo paso M01 sin desviaciones:** estudiar en modo lectura la autenticación actual de CLOUD (`/api/auth/login` y cookies de sesión) y los endpoints ya publicados de subida por fragmentos; construir **solo dentro del backend V2** un adaptador que cumpla la seguridad y privacidad sin trasladar credenciales a los músicos. Validar una foto real y lectura/borrado/Administrador manteniendo intacta la nube; después video real, rangos y APK instalable sobre 0.0.6. Si resulta imposible una autenticación segura sin modificar CLOUD, detener esa ruta y explicar exactamente la limitación. Nunca cambiar CLOUD por conveniencia.

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

Leer este documento y Plan Maestro en la rama `havana-nice-v2-foundation`; verificar HEAD, CI, Workers y D1 sin modificar CLOUD. No pedir nuevamente prueba APK 0.0.6 ni rehacer rutas eliminadas. Continuar sección 7: aprovechar la API existente de CLOUD **solo desde V2** y comprobar autenticación antes de activar; después pruebas reales foto/video/Administrador. No repetir preguntas técnicas, no preparar versiones o puentes CLOUD y no abrir otro Plan Maestro; conservar 12/27 hasta QA real.

**FIN DE LA CONTINUIDAD VIGENTE. No existe un segundo plan ni un segundo archivo de traspaso.**
