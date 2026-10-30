# HAVANA NICE V2 — ÚNICA LÍNEA DE DESARROLLO

**Fuente de verdad:** [Plan Maestro](docs/PLAN-MAESTRO.md) y [Continuidad Exacta](docs/CONTINUIDAD-EXACTA.md). No reintroducir decisiones, pruebas ni pantallas descartadas. Auditoría cruzada: 29 de octubre de 2026. **La lista de prioridades y los 27 hitos viven únicamente en el Plan Maestro**.

## Arquitectura que debe mantenerse

- Una sola rama V2 de desarrollo: `havana-nice-v2-foundation`. `main` y el sitio HAVANA NICE original son otra línea existente y NO se modifican.
- Un solo backend V2: Worker `havana-nice-v2-dev`, base D1 `havana-nice-v2-dev` y Durable Object `CHAT_ROOMS`.
- Chat Android 100 % React Native, sin WebView, conservando firma del paquete `com.havananice.v2`, sesiones SQLite, historial y borradores; la actualización se instala sobre la aplicación existente. No reinstalar.
- Chat iPhone PWA, sincronizado con el Chat nativo mediante contratos, mensajes, sesión y WebSocket del mismo Worker/D1.
- Administrador real e independiente en `/admin.html`: «Acceso a músicos» y «Chat general» activos. El Chat Admin muestra y modera los mensajes de todos sin iniciar sesión como músico ni escribir; comparte D1 y WebSocket, y su papelera ejecuta el borrado canónico para todos. Calendario, Repertorio y Más aún no tienen datos conectados.
- `/visual.html` es únicamente una **maqueta sin datos privados ni permisos de Chat o Administrador** destinada a futuros módulos no-Chat de Android WebView/PWA (H02–H04). No es una segunda puerta de ingreso.
- R2 pendiente de activación del plan gratuito por el propietario. No existe almacenamiento multimedia configurado todavía.

## Acceso a músicos actual — sin mecanismos paralelos

1. El Administrador autenticado crea el nombre en `POST /api/chat/admin/members` (no existe autoservicio de registro).
2. La entrada nueva de músico se realiza **solo** con `POST /api/chat/session`, nombre exacto normalizado y registro activo en D1. No contraseñas por músico, solicitudes de teléfonos, aprobaciones individuales ni otros formularios.
3. `GET /api/chat/session` revalida el token persistente del mismo cliente. `DELETE /api/chat/session` no puede soltar la vinculación del único dispositivo nuevo; solo el Administrador puede liberar la instalación.
4. Los músicos tienen un único vínculo en `chat_single_device_owners`: el primer cliente queda vinculado y un segundo recibe `409 name_already_bound`, con alerta para Administrador. La columna antigua `single_device_mode` ya fue eliminada.
5. **Estado comprobado 29/10/2026:** 3 músicos, 3 sesiones, 3 vínculos, 47 mensajes y 2 alertas duplicadas en D1 al terminar el QA de Chat. Los siguientes músicos solo los incorpora el Administrador. Estos recuentos son una lectura puntual, no constantes de código.
6. El login del Administrador, con un secreto servidor independiente y sesiones separadas, es intencionado y no constituye una segunda entrada de músicos.

**S02 y QA funcional de Chat aceptados:** bloqueo duplicado desde PWA, alerta Admin, envío Android→Admin y cola offline/reconexión probados físicamente. **Estado: 12/27 hitos; siguiente trabajo H02/H03.** Q01 integral permanece abierto para funciones futuras.

## Limpieza y archivos históricos

- El código de aprobación antigua de teléfonos, peticiones individuales y contraseñas de laboratorio **no forma parte de la aplicación V2 actual**. El guard de CI prohíbe revivir sus rutas.
- Las migraciones SQL y tablas del sistema se conservan. La migración histórica `0007` ya no contiene altas automáticas de los seis músicos: una base V2 nueva comienza con cero nombres hasta que el Administrador los agregue.
- **Rama V2 limpia:** se retiraron de `havana-nice-v2-foundation` 55 copias idénticas de los archivos históricos de la raíz (19 704 817 bytes), tras comprobar cada hash contra `main`. Se conservan intactas en `main` y en el historial Git. Esto reduce archivos en el checkout de V2, pero no elimina objetos históricos del repositorio. Cloudflare Pages de V2 compila únicamente `v2`.
- No crear otra rama, otro backend, login paralelo, APK de prueba innecesaria ni cambios destructivos de datos.

**Estado actual:** saneamiento 10/10, Android **0.0.10** firmado e instalado, Chat de texto sincronizado y probado físicamente en Android/PWA/Admin. Sin reabrir lo que funciona. R2 sigue deshabilitado y la subida multimedia pendiente. Continuar H02/H03 según el [Plan Maestro](docs/PLAN-MAESTRO.md), sin modificar la aplicación original ni crear infraestructura paralela.
