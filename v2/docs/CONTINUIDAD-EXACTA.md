# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Corte de saneamiento: 29 de octubre de 2026.** Este documento es una **bitácora técnica**, no otro plan. Los hitos, prioridades y casillas se controlan SOLO desde [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).

## Línea única V2

- Código fuente único: `Abnernoa97/havana-nice-pwa` → `havana-nice-v2-foundation`. No cambiar ni modificar la rama histórica `main`; la rama `havana-nice-v2-apk-downloads` contiene exclusivamente instaladores de distribución y no es una rama de código.
- Superficies previstas: Chat **Android 100 % React Native nativo**, PWA y Administrador web, compartiendo el **mismo Worker**, D1, Durable Object y contratos. `visual.html` es la representación visual no-Chat pendiente de integrar; no una app ni backend alternativo.
- Nunca volver a vincular otro proyecto como almacenamiento ni duplicar servicios. HAVANA CLOUD y otros productos no se han modificado.

## Avance comprobado

- **27 hitos oficiales:** 12 cerrados, 15 abiertos. **Saneamiento transversal:** S-A, S-C, S-D, S-E, S-F, S-G marcados, **6/10**; S-B, S-B2, S-H, S-I siguen pendientes de su comprobación final.
- **S-C (config):** `v2/cloudflare/wrangler.jsonc` declara `HAVANA_ENV=development` y `V2_ADMIN_LOGIN_MODE=enabled`. `V2_ADMIN_LOGIN_SECRET` solo está como secreto remoto; D1 y `CHAT_ROOMS` están enlazados. CI prohíbe otro Service Binding y una configuración Admin incompleta.
- **S-D (acceso):** eliminado el acceso de sesión heredada sin dueño, la excepción `single_device_mode=0` y su antigua ruta DELETE de músico. La sesión de cada nombre se conserva mediante un solo dispositivo. El Administrador sigue teniendo su propia sesión/credencial y la acción exclusiva de liberar el dispositivo. Worker `havana-nice-v2-dev` **versión `0b563838-5b5f-48ca-bb85-82297a52eee6` desplegada al 100 %**, validada previamente con el secreto existente, D1 y Durable Object.
- **S-E (automatizaciones):** eliminado físicamente `.github/workflows/v2-media-deps-once.yml`; `expo-video@58.0.12` permanece exactamente fijado en manifest y lock. Existe ya una protección de CI que exige solo `v2-foundation-check.yml` y `v2-android-apk.yml`.
- **S-F (fuentes y pruebas):** README corregido sobre músicos y sesiones. Eliminado `v2/tests/cross-platform/README.md` porque era un marcador sin pruebas ejecutables. Plan Maestro y Continuidad no contienen otro tablero.
- **S-G (D1):** 28 filas de sesiones administrativas estaban vencidas, de las cuales 21 estaban revocadas. Se eliminaron SOLO mediante criterio `revoked_at IS NOT NULL OR expires_at<=now` sobre `chat_admin_sessions`. Consulta inmediata posterior: **0 sesiones Admin, 3 músicos, 3 sesiones de músico y 44 mensajes**. Músicos y mensajes no se tocaron.
- **S-B (Android):** se eliminaron el workflow independiente de distribución `v2-apk-direct-download.yml` y el polling de otra ejecución de GitHub. El único `v2-android-apk.yml` ahora compila, valida paquete/firma/versionCode, compara con la APK previa, publica una descarga estable `HAVANA-NICE-V2-LATEST.apk` y guarda `HAVANA-NICE-V2-PREVIOUS.apk` para recuperación. **La primera ejecución terminó con fallo de publicación, **después de compilar, verificar firma y versión**: Expo dejó modificado `v2/apps/android/package.json` y `git switch -C` rechazó cambiar de rama. Se sustituyó ese cambio por `git worktree add --detach` en un directorio de entrega aislado; ejecución corregida `ff8eb4b70769b388d3c159d1445da16460b46517` en curso. **NO marcar S-B hasta confirmar descarga y firma.****
- **S-B2 (archivos):** los 24 instaladores históricos (≈1,78 GB) siguen en la rama de binarios mientras el nuevo pipeline no confirme entrega y firma de 0.0.10. El pipeline pretende dejar dos APK en su HEAD; no equivale a reescribir el historial Git antiguo. No borrar a mano antes de prueba de publicación.
- **Pruebas:** GitHub Actions pasó el chequeo fundacional tras retirar la excepción de acceso y añadir las protecciones de workflow/configuración. El último APK confirmado anteriormente fue Android 0.0.9; el 0.0.10 compilado anteriormente no había podido distribuirse por el flujo viejo. **La versión descargable nueva aún requiere comprobación**.

## Siguiente punto exacto

1. Revisar el workflow Android con publicación aislada del commit `ff8eb4b70769b388d3c159d1445da16460b46517` y sus logs. Si falla, corregir el mismo workflow **sin crear otro**; confirmar hash, certificado, paquete y versión 10 antes de indicar enlace de descarga.
2. Confirmar que la rama de binarios contiene solamente LATEST y PREVIOUS tras el flujo exitoso, y que la fuente queda en una única rama.
3. Verificar versión PWA publicada, Chat/Administrador, las sesiones ya existentes y WebSockets sin regresión. Prueba física de actualización Android 0.0.9→0.0.10 necesaria para Q01/S-I.
4. Solo entonces el propietario habilita R2 Standard gratuito y se implementan M01/M02/M04 en la misma API sin intermediarios.

**Regla:** nada de APK múltiples, caché reiniciada por comodidad, nuevos repositorios, ramas de trabajo o integración con aplicaciones independientes. No presentar R2 como activo ni los hitos M01/M02 como cerrados.
