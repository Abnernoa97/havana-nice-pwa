# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Corte de saneamiento: 29 de octubre de 2026.** Este documento es una **bitácora técnica**, no otro plan. Los hitos, prioridades y casillas se controlan SOLO desde [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).

## Línea única V2

- Código fuente único: `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation`. No cambiar ni modificar la rama histórica `main`; la rama `havana-nice-v2-apk-downloads` contiene exclusivamente instaladores de distribución y no es una rama de código.
- Superficies previstas: Chat **Android 100 % React Native nativo**, PWA y Administrador web, compartiendo el **mismo Worker**, D1, Durable Object y contratos. `visual.html` es la representación visual no-Chat pendiente de integrar; no una app ni backend alternativo.
- Nunca volver a vincular otro proyecto como almacenamiento ni duplicar servicios. HAVANA CLOUD y otros productos no se han modificado.

## Avance comprobado

- **27 hitos oficiales:** 12 cerrados, 15 abiertos. **Saneamiento transversal: 8/10** (S-A, S-B, S-B2, S-C, S-D, S-E, S-F, S-G). Pendientes S-H — contrato R2 y S-I — QA de actualización física y conjunto Chat/Admin.
- **S-C (config):** `v2/cloudflare/wrangler.jsonc` declara `HAVANA_ENV=development` y `V2_ADMIN_LOGIN_MODE=enabled`. `V2_ADMIN_LOGIN_SECRET` solo está como secreto remoto; D1 y `CHAT_ROOMS` están enlazados. CI prohíbe otro Service Binding y una configuración Admin incompleta.
- **S-D (acceso):** eliminado el acceso de sesión heredada sin dueño, la excepción `single_device_mode=0` y su antigua ruta DELETE de músico. La sesión de cada nombre se conserva mediante un solo dispositivo. El Administrador sigue teniendo su propia sesión/credencial y la acción exclusiva de liberar el dispositivo. Worker `havana-nice-v2-dev` **versión `0b563838-5b5f-48ca-bb85-82297a52eee6` desplegada al 100 %**, validada previamente con el secreto existente, D1 y Durable Object.
- **S-E (automatizaciones):** eliminado físicamente `.github/workflows/v2-media-deps-once.yml`; `expo-video@58.0.12` permanece exactamente fijado en manifest y lock. Existe ya una protección de CI que exige solo `v2-foundation-check.yml` y `v2-android-apk.yml`.
- **S-F (fuentes y pruebas):** README corregido sobre músicos y sesiones. Eliminado `v2/tests/cross-platform/README.md` porque era un marcador sin pruebas ejecutables. Plan Maestro y Continuidad no contienen otro tablero.
- **S-G (D1):** 28 filas de sesiones administrativas estaban vencidas, de las cuales 21 estaban revocadas. Se eliminaron SOLO mediante criterio `revoked_at IS NOT NULL OR expires_at<=now` sobre `chat_admin_sessions`. Consulta inmediata posterior: **0 sesiones Admin, 3 músicos, 3 sesiones de músico y 44 mensajes**. Músicos y mensajes no se tocaron.
- **S-B (Android):** `v2-android-apk.yml` es el **único workflow de compilación, verificación de firma y publicación**. Ejecución GitHub Actions [40963966950](https://github.com/Abnernoa97/havana-nice-pwa/actions/runs/40963966950) `success`: APK `com.havananice.v2`, `versionName 0.0.10`, `versionCode 10`; se verificó la misma firma de la APK anterior y `versionCode 9 → 10`. La publicación usa un worktree aislado, sin mezclar archivos modificados por Expo con la rama binaria. Descarga estable `https://raw.githubusercontent.com/Abnernoa97/havana-nice-pwa/havana-nice-v2-apk-downloads/HAVANA-NICE-V2-LATEST.apk` verificada HTTP 200. **Falta solo la instalación real sobre la app 0.0.9 y la prueba de sesión/caché** (S-I/Q01).
- **S-B2 (binarios):** el workflow eliminó 22 de 24 instaladores del HEAD de `havana-nice-v2-apk-downloads`. Quedan exactamente `HAVANA-NICE-V2-LATEST.apk` (76.997.911 bytes) y `HAVANA-NICE-V2-PREVIOUS.apk` (77.006.359 bytes), además de README y SHA256SUMS. No implica purga del historial de Git.
- **Pruebas:** GitHub Actions pasó el chequeo fundacional tras retirar la excepción de acceso y añadir las protecciones de workflow/configuración. El último APK confirmado anteriormente fue Android 0.0.9; el 0.0.10 compilado anteriormente no había podido distribuirse por el flujo viejo. **La versión descargable nueva aún requiere comprobación**.

## Siguiente punto exacto

1. **Completado:** Android unificado compiló/publicó APK 0.0.10 con firma y versión compatibles. No rehacer flujo ni crear más ramas.
2. **Completado:** rama de binarios contiene solo LATEST y PREVIOUS, la fuente está en la rama V2 única.
3. Verificar versión PWA publicada, Chat/Administrador, las sesiones ya existentes y WebSockets sin regresión. Prueba física de actualización Android 0.0.9→0.0.10 necesaria para Q01/S-I.
4. Solo entonces el propietario habilita R2 Standard gratuito y se implementan M01/M02/M04 en la misma API sin intermediarios.

**Regla:** nada de APK múltiples, caché reiniciada por comodidad, nuevos repositorios, ramas de trabajo o integración con aplicaciones independientes. No presentar R2 como activo ni los hitos M01/M02 como cerrados.
