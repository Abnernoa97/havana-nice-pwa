# HAVANA NICE V2 — ÚNICA LÍNEA DE DESARROLLO

**Fuente de verdad:** [Plan Maestro](docs/PLAN-MAESTRO.md) y [Continuidad Exacta](docs/CONTINUIDAD-EXACTA.md). No reintroducir decisiones, pruebas ni pantallas descartadas. Auditoría cruzada: 29 de octubre de 2026. **La lista de prioridades y los 36 hitos (27 originales + 9 modulares) viven únicamente en el Plan Maestro**.

## Arquitectura que debe mantenerse

- Una sola rama V2 de desarrollo: `havana-nice-v2-foundation`. `main` y el sitio HAVANA NICE original son otra línea existente y NO se modifican.
- Un solo backend V2: Worker `havana-nice-v2-dev`, base D1 `havana-nice-v2-dev` y Durable Object `CHAT_ROOMS`.
- Chat Android 100 % React Native, sin WebView, conservando firma del paquete `com.havananice.v2`, sesiones SQLite, historial y borradores; la actualización se instala sobre la aplicación existente. No reinstalar.
- Chat iPhone PWA, sincronizado con el Chat nativo mediante contratos, mensajes, sesión y WebSocket del mismo Worker/D1.
- Administrador real e independiente en `/admin.html`: «Acceso a músicos», «Chat general» y panel funcional de **Calendario** (crear/editar/eliminar/seleccionar destinatarios). El Chat Admin modera los mensajes sin iniciar sesión como músico ni escribir; comparte D1 y WebSocket. Repertorio, Músicos, Avisos y Ajustes están pendientes.
- `/visual.html` es únicamente una **maqueta sin datos privados ni permisos de Chat o Administrador** destinada a futuros módulos no-Chat de Android WebView/PWA (H02–H04). No es una segunda puerta de ingreso.
- R2 pendiente de activación del plan gratuito por el propietario. No existe almacenamiento multimedia configurado todavía.

## Regla obligatoria — módulos independientes, HOME única

Cada módulo (Chat, Calendario, Repertorio, Músicos, Avisos, Ajustes) contiene su lógica, vista y estado propios, su contrato/API y pruebas cuando corresponda. **Solo HOME conecta la navegación**; los módulos no deben importar motores de otras secciones ni revocar la sesión por errores locales. El Administrador gestiona cada módulo desde su sección de control. **Una sola entrada de músico, un solo vínculo de dispositivo y un único Worker/D1.** No confundir «sección independiente» con segunda autenticación o segundo backend. A01–A09 recogen los criterios pendientes en el Plan Maestro; `tests/module-boundaries.test.mjs` añade controles automáticos en GitHub Actions.

## Acceso a músicos actual — sin mecanismos paralelos

1. El Administrador autenticado crea el nombre en `POST /api/chat/admin/members` (no existe autoservicio de registro).
2. La entrada nueva de músico se realiza **solo** con `POST /api/chat/session`, nombre exacto normalizado y registro activo en D1. No contraseñas por músico, solicitudes de teléfonos, aprobaciones individuales ni otros formularios.
3. `GET /api/chat/session` revalida el token persistente del mismo cliente. `DELETE /api/chat/session` no puede soltar la vinculación del único dispositivo nuevo; solo el Administrador puede liberar la instalación.
4. Los músicos tienen un único vínculo en `chat_single_device_owners`: el primer cliente queda vinculado y un segundo recibe `409 name_already_bound`, con alerta para Administrador. La columna antigua `single_device_mode` ya fue eliminada.
5. **Estado comprobado 29/10/2026:** 3 músicos, 3 sesiones, 3 vínculos, 47 mensajes y 2 alertas duplicadas en D1 al terminar el QA de Chat. Los siguientes músicos solo los incorpora el Administrador. Estos recuentos son una lectura puntual, no constantes de código.
6. El login del Administrador, con un secreto servidor independiente y sesiones separadas, es intencionado y no constituye una segunda entrada de músicos.

**S02 y QA funcional de Chat aceptados:** bloqueo duplicado desde PWA, alerta Admin, envío Android→Admin y cola offline/reconexión probados físicamente. **Estado: 12/36 hitos; siguiente trabajo P02/A03 y pruebas modulares A09.** Q01 integral permanece abierto para funciones futuras.

## Limpieza y archivos históricos

- El código de aprobación antigua de teléfonos, peticiones individuales y contraseñas de laboratorio **no forma parte de la aplicación V2 actual**. El guard de CI prohíbe revivir sus rutas.
- Las migraciones SQL y tablas del sistema se conservan. La migración histórica `0007` ya no contiene altas automáticas de los seis músicos: una base V2 nueva comienza con cero nombres hasta que el Administrador los agregue.
- **Rama V2 limpia:** se retiraron de `havana-nice-v2-foundation` 55 copias idénticas de los archivos históricos de la raíz (19 704 817 bytes), tras comprobar cada hash contra `main`. Se conservan intactas en `main` y en el historial Git. Esto reduce archivos en el checkout de V2, pero no elimina objetos históricos del repositorio. Cloudflare Pages de V2 compila únicamente `v2`.
- No crear otra rama, otro backend, login paralelo, APK de prueba innecesaria ni cambios destructivos de datos.

**Estado actual:** saneamiento 10/10. Android **0.0.11** instalado con HOME → Chat aprobados por el propietario; código Android **0.0.12** de Calendario preparado, sin afirmar instalación/publicación hasta verificarla. Calendario V2 dispone de panel Administrador, vista acordeón, API privada y tablas D1, pendiente de QA real Admin ↔ músico. R2 sigue deshabilitado y la subida multimedia pendiente. Continuar P02/A03/A09 según el [Plan Maestro](docs/PLAN-MAESTRO.md), sin modificar la aplicación original ni crear infraestructura paralela.
