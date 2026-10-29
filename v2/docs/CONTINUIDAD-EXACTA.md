# HAVANA NICE V2 — CONTINUIDAD EXACTA

**Corte: 29 de octubre de 2026, después de la auditoría integral.**

> **La única fuente de decisiones, prioridades, 27 hitos y lista de saneamiento es [PLAN-MAESTRO.md](./PLAN-MAESTRO.md).** Este archivo solo contiene el estado técnico y las pruebas de relevo; no es otro plan.

## Fuente y límites

- Repositorio `Abnernoa97/havana-nice-pwa`; **única rama canónica de código V2:** `havana-nice-v2-foundation`.
- La rama `main` del repositorio compartido es histórica, fuera de alcance; **no tocarla ni cambiar el default automáticamente**. La rama `havana-nice-v2-apk-downloads` solo almacena binarios, no un segundo código V2. Revisar su simplificación según S-B/S-B2.
- No modificar la aplicación original, HAVANA CLOUD ni otros proyectos; no recrear puente, otra base, login alternativo, API paralela o migración de laboratorio.
- Android conserva `com.havananice.v2`, Chat 100 % nativo, sesión/caché local, firma e instalación sobre la APK existente. PWA/iPhone y Administrador comparten Worker, D1 y Chat DO. `visual.html` es maqueta sin datos, no backend alternativo.

## Verificaciones recientes

- **Fundación V2:** suite GitHub Actions exitosa en commit `177ac4eb23ed9cd631f44752ce07d33d16c45d8b`; continúa **12/27 hitos**. No reinterpretar los 27.
- **Worker `havana-nice-v2-dev`:** versión `f7d5e3d1-0611-4cb8-b7e6-9dc9899779c6` desplegada al 100 % con cinco bindings: `CHAT_ROOMS`, `DB`, `HAVANA_ENV`, `V2_ADMIN_LOGIN_MODE`, `V2_ADMIN_LOGIN_SECRET`. No existe servicio externo vinculado.
- **D1:** 11 tablas útiles; 44 mensajes, 3 músicos, 3 sesiones, 3 vínculos, 12 reacciones. Se eliminaron los 15 mensajes multimedia de laboratorio, los 19 registros multimedia y 19 transferencias, una vinculación, y cinco tablas antiguas. Ninguna se migró a R2. Los datos de la aplicación independiente quedaron intactos.
- **Administrador:** 28 registros históricos de sesión, 21 revocados, ninguno vigente en la lectura del 29/10. No borrar las tablas ni sesiones de usuario sin filtros y verificación. `wrangler.jsonc` declara `HAVANA_ENV` pero **no** `V2_ADMIN_LOGIN_MODE=enabled` que sí está en producción; alinear fuente y conservar `V2_ADMIN_LOGIN_SECRET` estrictamente como secreto externo.
- **PWA:** Pages `havana-nice-v2-dev` confirmó publicación del commit `177ac4eb23ed9cd631f44752ce07d33d16c45d8b` con estado success.
- **Android 0.0.10:** la compilación standalone y comprobación del paquete/firma pasaron en GitHub; `versionCode=10`. La distribución automática directa **falló por `unexpected EOF`** al consultar la API GitHub. No declarar la APK pública ni instalada. La anterior aprobada fue 0.0.9.
- **R2:** aún sin activar. API `403/10042`; no hay bucket, originales ni carga activa. No avanzar antes de resolver saneamiento.
- **Ramas/entregas:** una rama de código V2, una de binarios con 24 APK (≈1,78 GB), y la rama histórica `main`. Un workflow de APK build, otro de distribución y otro workflow de sincronización única de dependencia. Consolidar, no multiplicar.

## Próxima ejecución exacta

**SANEAMIENTO TRANSVERSAL S-A → S-I del Plan Maestro, sin crear hitos nuevos.**

Prioridad inmediata: alinear configuración no secreta Worker/Admin; unificar build + firma + publicación de APK y recuperar la distribución de 0.0.10; eliminar workflow puntual obsoleto; corregir residuos documentales y de pruebas; revisar excepciones heredadas de acceso y limpieza de sesiones caducadas; pasar QA sin perder la instalación ni el Chat.

**Después, y solo después:** activación gratuita R2 por el propietario e implementación **M01 fotos → M02 videos → M04 visores** con R2 directo y privado, desarrolladas a la vez en Android/PWA/Administrador. M03 audio y M05 push permanecen abiertos.

**Regla de continuidad:** no marcar «terminado» sin estado GitHub/Cloudflare y, en su caso, prueba real en teléfono. El Plan Maestro es el documento que se marca; este archivo solo registra evidencia y posición de reanudación.
