# HAVANA NICE V2 — ÚNICA LÍNEA DE DESARROLLO

**Fuente de verdad:** [Plan Maestro](docs/PLAN-MAESTRO.md) y [Continuidad Exacta](docs/CONTINUIDAD-EXACTA.md). No reintroducir decisiones, pruebas ni pantallas descartadas. Última revisión del acceso: 27 de octubre de 2026.

## Arquitectura que debe mantenerse

- Una sola rama V2 de desarrollo: `havana-nice-v2-foundation`. `main` y el sitio HAVANA NICE original son otra línea existente y NO se modifican.
- Un solo backend V2: Worker `havana-nice-v2-dev`, base D1 `havana-nice-v2-dev` y Durable Object `CHAT_ROOMS`.
- Chat Android 100 % React Native, sin WebView, conservando firma del paquete `com.havananice.v2`, sesiones SQLite, historial y borradores; el dispositivo instalado de referencia usa 0.0.4. No reinstalar.
- Chat iPhone PWA, sincronizado con el Chat nativo mediante contratos, mensajes, sesión y WebSocket del mismo Worker/D1.
- Administrador real e independiente en `/admin.html`: «Acceso a músicos» y «Chat general» activos. El Chat Admin muestra y modera los mensajes de todos sin iniciar sesión como músico ni escribir; comparte D1 y WebSocket, y su papelera elimina para todos con registro lógico. Calendario, Repertorio y Más aún no tienen datos conectados.
- `/visual.html` es únicamente una **maqueta sin datos privados ni permisos de Chat o Administrador** destinada a futuros módulos no-Chat de Android WebView/PWA (H02–H04). No es una segunda puerta de ingreso.
- R2 descartado; medios privados solo mediante una solución de almacenamiento autorizada y presupuestada. No activar Google Drive/puentes ni servicios de pago por presunción.

## Acceso a músicos actual — sin mecanismos paralelos

1. El Administrador autenticado crea el nombre en `POST /api/chat/admin/members` (no existe autoservicio de registro).
2. La entrada nueva de músico se realiza **solo** con `POST /api/chat/session`, nombre exacto normalizado y registro activo en D1. No contraseñas por músico, solicitudes de teléfonos, aprobaciones individuales ni otros formularios.
3. `GET /api/chat/session` revalida el token persistente del mismo cliente. `DELETE /api/chat/session` no puede soltar la vinculación del único dispositivo nuevo; solo el Administrador puede liberar la instalación.
4. Los músicos nuevos tienen `single_device_mode=1`: el primer cliente queda vinculado y un segundo recibe `409 name_already_bound`, con alerta para Administrador.
5. **Reinicio autorizado 27/10/2026:** se eliminaron del D1 los seis músicos históricos y `Prueba 2`, junto con 12 sesiones, 1 vínculo, 1 alerta, 20 eventos de acceso y 7 lecturas. **No hay usuarios ni sesiones actualmente**. Los próximos músicos los añade exclusivamente el Administrador con `single_device_mode=1`; ya no queda ninguna cuenta legado que migrar. Se conservaron los 46 mensajes históricos y sus 11 reacciones, que no otorgan acceso.
6. El login del Administrador, con un secreto servidor independiente y sesiones separadas, es intencionado y no constituye una segunda entrada de músicos.

**S02 aceptado** por el propietario tras prueba física con `Prueba 2` (bloqueo en segundo teléfono, alerta Admin y vinculación verificadas); no repetir pruebas de seguridad sin motivo. **Estado: 12/27 hitos, M01 siguiente.**

## Limpieza y archivos históricos

- El código de aprobación antigua de teléfonos, peticiones individuales y contraseñas de laboratorio **no forma parte de la aplicación V2 actual**. El guard de CI prohíbe revivir sus rutas.
- Las migraciones SQL y tablas del sistema se conservan. La migración histórica `0007` ya no contiene altas automáticas de los seis músicos: una base V2 nueva comienza con cero nombres hasta que el Administrador los agregue.
- **Rama V2 limpia:** se retiraron de `havana-nice-v2-foundation` 55 copias idénticas de los archivos históricos de la raíz (19 704 817 bytes), tras comprobar cada hash contra `main`. Se conservan intactas en `main` y en el historial Git. Esto reduce archivos en el checkout de V2, pero no elimina objetos históricos del repositorio. Cloudflare Pages de V2 compila únicamente `v2`.
- El archivo `cloudflare/src/havana-cloud-bridge-client.js` no participa actualmente en el Worker desplegado; es una propuesta de integración futura para multimedia, **no** un acceso alternativo y no debe activarse sin decisión sobre almacenamiento.
- No crear otra rama, otro backend, login paralelo, APK de prueba innecesaria ni cambios destructivos de datos.

**Chat general Admin publicado:** Worker versión `0450e895-84db-469e-af27-4894b4a6b0ea`, Foundation CI `40572364562` éxito, sin borrar datos reales; falta QA visual en teléfono. La funcionalidad de moderación multimedia vendrá cuando existan mensajes foto/video/audio.

**Próxima funcionalidad:** M01 — fotos privadas reales, respetando Chat nativo Android, Chat PWA iPhone, el Administrador y una sola API.
