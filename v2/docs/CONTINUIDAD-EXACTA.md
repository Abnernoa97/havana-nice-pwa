# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Corte de saneamiento y QA de Chat: 29 de octubre de 2026.** Este documento es una **bitácora técnica**, no otro plan. Los hitos, prioridades y casillas se controlan SOLO desde [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).

## Línea única V2

- Código fuente único: `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation`. No cambiar ni modificar la rama histórica `main`; la rama `havana-nice-v2-apk-downloads` contiene exclusivamente instaladores de distribución y no es una rama de código.
- Superficies previstas: Chat **Android 100 % React Native nativo**, PWA y Administrador web, compartiendo el **mismo Worker**, D1, Durable Object y contratos. `visual.html` es la representación visual no-Chat pendiente de integrar; no una app ni backend alternativo.
- Nunca volver a vincular otro proyecto como almacenamiento ni duplicar servicios. HAVANA CLOUD y otros productos no se han modificado.

## Avance comprobado

- **27 hitos oficiales:** 12 cerrados, 15 abiertos. **Saneamiento transversal: 10/10**, con confirmación del propietario de la actualización Android 0.0.10. Chat y Admin de texto tienen pruebas funcionales reales favorables; Q01 integral permanece abierto para los módulos no construidos, multimedia y QA físico adicional. S-H es únicamente el diseño del contrato de R2, NO su instalación.
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
- Prueba [41012373606](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/41012373606) **SUCCESS**; PWA Pages publicó el commit de HOME y se disparó compilación oficial 0.0.11 (aún verificar salida e instalación).
- **Seguridad:** no volver a introducir ingreso independiente en HOME, ni liberar sesiones, ni reinstalar/resetear aplicaciones. Próximo QA manual: al actualizar, HOME debe abrir conservando la identidad, Chat debe continuar donde estaba, volver a Inicio no debe cortar WebSocket ni perder borradores.
- H02/H03/P01 **parciales; 12/27**, no cerrar hasta validar físicas y visual final.

## Próximo trabajo de desarrollo

1. **H02 → H03:** integración segura de los módulos no-Chat en Android. Mantener Chat 100 % React Native, aprovechar PWA solo para presentación y utilizar contratos/backend V2 únicos. Prioridad funcional, no colores/interfaz.
2. Preparar el camino para P01/P02/P03/P04 en la misma arquitectura, sin duplicar autorización ni almacenar un segundo token en WebView.
3. **R2 no habilitado:** la API devuelve `403/10042`; cuando el propietario active el servicio, retomar M01/M02/M04 por el contrato del Plan Maestro. No levantar nube ni Worker alternativo.
4. Publicar otra APK solo cuando exista una función nativa nueva, manteniendo firma, paquete y actualización sobre la versión instalada.

**Regla:** nada de ramas de trabajo adicionales, caché reiniciada, nombres desvinculados, nueva base, ni cambios a `main` o HAVANA CLOUD. Q01 se cierra únicamente con toda la funcionalidad pertinente probada.
