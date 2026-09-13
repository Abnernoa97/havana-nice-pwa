# HAVANA NICE APP / PWA — AUDITORÍA FINAL ACCESO 8

Fecha: 2026-09-13
Repositorio: `Abnernoa97/havana-nice-pwa`
Branch publicada: `main`
Baseline funcional: ACCESO 8 — `72df5c98ed4f56074b71a30b1e69ccf8676ca62f`

## Objetivo

Revisar de arriba abajo el árbol real de GitHub tomando ACCESO 8 como única referencia funcional y separar:
1. código activo que debe conservarse;
2. código experimental o duplicado que ya no participa en la aplicación;
3. información histórica que no debe ejecutarse;
4. datos de Supabase que son reales y no deben borrarse como si fueran basura.

## Limpieza realizada

Se eliminaron del `main` los archivos que la auditoría identificó como claramente no utilizados:

- `repertoire-language-ui.js` — experimento anterior de normalización visual; el módulo activo es `repertoire-v1.js`.
- `repertoire-v2.js` — segunda implementación de repertorio que no es cargada por la aplicación activa.
- `admin-storage-cleanup.js` — archivo vacío (`/* */`), sin función.
- `admin-storage-cleanup-marker.js` — marcador vacío de una limpieza anterior, sin función ejecutable.
- `admin-storage-usage-panel.js` — implementación anterior de panel de almacenamiento; no es cargada.
- `admin-storage-usage-v2.js` — implementación duplicada/anterior de uso de almacenamiento; no es cargada.
- `admin-storage-usage.js` — implementación legacy de uso de almacenamiento; no es cargada.

El módulo activo de almacenamiento administrativo es `admin-storage-summary.js`, que es cargado por `admin-ui-v1.js`.

## Código que permanece y por qué

### Músicos

- `index.html` — entrada principal y shell visual de la PWA.
- `operations-v1.js` — operaciones de calendario, Event Details y Show Day.
- `operations-fix.js` — ajustes de operaciones y carga de `session-memory-v2.js`.
- `session-memory-v2.js` — memoria/validación del último músico.
- `repertoire-v1.js` — repertorio activo y realtime.
- `calendar-v1.js`, `calendar-expand.js`, `calendar-navigation.js`, `calendar-recipients-v1.js` — calendario.
- `chat-v1.js`, `chat-theme-v1.js` — chat.
- `notifications-v5.js`, `notifications-navigation.js`, `notifications-admin-fix.js` — notificaciones.
- `musician-push.js` y `sw.js` — push/service worker.
- `family-v1.js` — módulo de familia actualmente presente en la aplicación.

### Administrador

- `admin.html` — entrada principal.
- `admin-ui-v1.js` — interfaz actual, acordeones, repertorio y cargadores de módulos administrativos.
- `admin-pwa.js` — registro del service worker.
- `admin-sw.js` — caché `hn-admin-v3` y actualización fresca de `admin.html` / `admin-ui-v1.js`.
- `admin-chat-v1.js` — chat administrativo.
- `admin-summary-realtime.js` — resumen realtime.
- `admin-storage-summary.js` — resumen de almacenamiento activo.
- `calendar-v1.js` y `calendar-recipients-v1.js` — calendario/recipientes administrativos.

### Recursos

- `manifest.json`, `admin-manifest.json` — manifiestos PWA.
- `havana-nice-icon-192.png`, `havana-nice-icon-512.png` — iconos PWA.
- `Video.Guru_20260908-142707130.mp4` — video de fondo usado por `index.html`; NO es basura.

## Hallazgos importantes que NO se deben borrar todavía

### 1. Repertorio legacy dentro de `index.html`

`index.html` todavía contiene una pantalla estática antigua de repertorio (`#repertoireScreen`) con una lista hardcodeada de canciones. El módulo activo `repertoire-v1.js` genera el repertorio actual desde Supabase y realtime y usa su propia pantalla dinámica. La pantalla estática es técnicamente legacy y contiene información vieja, por lo que queda marcada como **candidata clara para la siguiente limpieza controlada**.

No se elimina en esta auditoría porque requiere retirar también su CSS asociado de `index.html` y verificar que no se rompe ningún puente de navegación.

### 2. Categorías antiguas en `admin.html`

El HTML base del administrador todavía conserva opciones antiguas como `OTHER`, `COCKTAIL`, `DINNER`, `DANCE`, `BOLERO`, `SALSA` y `JAZZ`. `admin-ui-v1.js` las normaliza visualmente a `ENGLISH` / `ESPAÑOL`, por lo que no son parte de la UI efectiva final, pero sí son código fuente legacy y deben limpiarse en una pasada posterior.

### 3. Versiones antiguas en parámetros `?v=`

Hay referencias de cache-busting antiguas en algunos `<script src>` y cargadores dinámicos. No impiden la aplicación actual porque `admin-sw.js` fuerza red fresca para los recursos críticos, pero son información técnica antigua y conviene normalizarlas después de cerrar la limpieza estructural.

### 4. CSS repetido en `admin.html`

La definición `.image-preview-list` aparece repetida muchas veces con exactamente la misma regla. Es basura de código, no una función. Puede compactarse sin cambiar comportamiento.

### 5. `sw.js`

El service worker del músico conserva una constante de nombre de caché (`hn-v11`), pero el flujo actual no precachea ese nombre y limpia las cachés al activar. La constante es código muerto menor, no un módulo funcional independiente. No se toca en esta pasada porque el service worker está ligado al flujo de Push y actualización de la PWA.

## Información histórica que NO es basura de ejecución

- `ACCESO_6.md`
- `ACCESO_7.md`
- `ACCESO_8.md`

Son documentos de trazabilidad/auditoría y no se cargan en la aplicación. Se conservan como historial técnico.

## Branches antiguas

GitHub contiene múltiples branches de experimentos y checkpoints anteriores. Son historial de desarrollo y no forman parte del árbol publicado de `main`. No afectan la aplicación instalada. No se consideran basura runtime.

## Supabase: no borrar datos por apariencia de legacy

Los valores antiguos de `repertoire_songs.category` (`DANCE`, `JAZZ`, `OTHER`, `ROMANTIC`, `SOUL`, etc.) son datos reales de la base de datos. ACCESO 8 solamente normaliza su presentación a `ENGLISH` / `ESPAÑOL`. No deben eliminarse ni migrarse automáticamente como parte de una limpieza de archivos.

## Estado de seguridad de la limpieza

La limpieza realizada elimina únicamente archivos que fueron verificados como no cargados/no utilizados o vacíos. Los módulos funcionales de Calendario, Chat, Push, Notifications, Authentication, Session Memory, Repertorio activo, Admin Summary y Storage activo permanecen intactos.

## Próximo paso recomendado

La aplicación ya tiene una base mucho más limpia. Antes de publicar definitivamente a los músicos, la siguiente limpieza debe ser una única pasada controlada sobre:

1. `index.html` → retirar la pantalla estática legacy de repertorio y su CSS muerto.
2. `admin.html` → retirar categorías legacy del HTML y compactar CSS repetido.
3. Normalizar los `?v=` antiguos.
4. Después de eso, hacer una prueba live final de Admin → Supabase → músico en Calendario, Repertorio, Notificaciones y Chat.

No se debe borrar ningún módulo funcional adicional sin comprobar primero quién lo carga y qué flujo depende de él.
