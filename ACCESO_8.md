# HAVANA NICE APP / PWA — ACCESO 8

## Punto de partida oficial

Acceso 8 es el nuevo baseline oficial de TODO el estado actual de la aplicación PWA de HAVANA NICE.

Repositorio: `Abnernoa97/havana-nice-pwa`
Branch oficial: `main`
Branch de baseline: `ACCESO-8`
Commit de baseline: `72df5c98ed4f56074b71a30b1e69ccf8676ca62f`
Baseline anterior: ACCESO 7 — `2dd583653105bd8b35a4af8325527cc21170bfdf`

Acceso 8 congela el estado existente en el commit indicado. Todo cambio posterior a este punto debe considerarse fuera del baseline salvo autorización explícita.

## Auditoría del estado real

La auditoría de Acceso 8 se realizó sobre el árbol real de GitHub del commit `72df5c98ed4f56074b71a30b1e69ccf8676ca62f`.

### Aplicación de músicos
- `index.html` existe y es la entrada principal de la PWA de músicos.
- `operations-v1.js` y `operations-fix.js` están presentes.
- `session-memory-v2.js` está presente.
- `repertoire-v1.js` está presente.
- `calendar-v1.js`, `calendar-expand.js`, `calendar-navigation.js` y `calendar-recipients-v1.js` están presentes.
- `chat-v1.js` y `chat-theme-v1.js` están presentes.
- `notifications-v5.js`, `notifications-navigation.js` y `notifications-admin-fix.js` están presentes.
- `musician-push.js` está presente.
- `sw.js` está presente.

### Aplicación de administrador
- `admin.html` existe y es la entrada principal de la PWA de administrador.
- `admin-ui-v1.js` contiene el rediseño actual del dashboard y la lista de Repertorio.
- `admin-pwa.js` registra el service worker del administrador.
- `admin-sw.js` está en versión de caché `hn-admin-v3` y fuerza la obtención fresca de `admin.html` y `admin-ui-v1.js`.
- `admin-chat-v1.js`, `admin-summary-realtime.js`, `admin-storage-summary.js` y `calendar-recipients-v1.js` están presentes.

## Funciones conservadas en Acceso 8

- Separación funcional entre Admin y Musicians.
- Acceso de músicos mediante nombre, sin crear un nuevo sistema de email/password.
- Authentication existente.
- Memoria del último músico mediante `session-memory-v2.js`.
- Push notifications y flujo de push existente.
- Notificaciones Admin → músico.
- Chat realtime.
- Calendario realtime.
- Repertorio realtime.
- Admin Summary realtime/storage.
- Storage.
- Service workers de músico y administrador.

## Memoria del último músico

Se conserva `session-memory-v2.js`.

Comportamiento establecido:
1. Primer acceso mediante nombre y validación con el RPC existente `login_by_username`.
2. Después de un acceso exitoso se recuerda el último músico localmente.
3. Al volver a abrir la PWA se valida nuevamente el músico recordado.
4. Si es válido, se reconstruye la sesión de perfil y continúa el flujo normal.
5. Logout elimina la memoria local.
6. Si el músico ya no está activo, la restauración automática no concede acceso.

No forman parte de Acceso 8 Passkey, biometría, fingerprint, Face ID, WebAuthn ni un nuevo sistema de contraseña.

## Repertorio — estado de Acceso 8

La interfaz del repertorio queda reducida visualmente a dos idiomas:
- `ENGLISH`
- `ESPAÑOL`

En la aplicación de músicos, `repertoire-v1.js` presenta únicamente esos dos grupos. Las categorías antiguas de base de datos se normalizan visualmente: `ESPAÑOL` se presenta como español y el resto como inglés.

En el administrador, los controles de idioma quedan limitados a `ENGLISH` y `ESPAÑOL`.

La lista de canciones del administrador utiliza el formato vertical alineado con la lista de Calendario: canción/artista a la izquierda y `EDITAR` / `BORRAR` a la derecha; al editar, los campos aparecen en línea y el primer botón pasa a `GUARDAR`.

Importante: la migración física de los valores antiguos de la columna `category` de Supabase NO forma parte de Acceso 8. El cambio realizado es de interfaz/normalización visual y de controles. No se debe afirmar que los valores de la base de datos fueron migrados.

## Caché y actualización del administrador

`admin-sw.js` usa `hn-admin-v3`. Para `admin.html` y `admin-ui-v1.js` intenta obtener una respuesta fresca sin caché y actualiza la copia almacenada. Esto fue incorporado para evitar que una versión antigua del administrador impida visualizar los cambios actuales.

## Archivos experimentales / no usados

El árbol actual contiene:
- `repertoire-language-ui.js`
- `repertoire-v2.js`

Estos archivos existen en el repositorio pero no son el módulo activo de repertorio en Acceso 8. El módulo activo es `repertoire-v1.js`.

## Lo que fue auditado vs. lo que NO se puede certificar desde GitHub

GitHub permite verificar el árbol, commits, archivos, hashes y código que componen Acceso 8. Por esa razón se certifica como estado de código el commit indicado.

No se debe interpretar esta auditoría como una prueba física de cada flujo en un teléfono/dispositivo real ni como una prueba de cada evento de Supabase en producción. Una prueba live requiere ejecutar las aplicaciones contra el entorno desplegado y comprobar los flujos con dispositivos/usuarios reales.

## Regla oficial de continuación

A partir de ahora, `ACCESO 8` es el único punto de partida oficial de HAVANA NICE APP / PWA.

No mezclar con Familia Noa, la página web de HAVANA NICE, Azoria u otros proyectos.
No modificar funciones congeladas salvo instrucción explícita.
Todo nuevo desarrollo debe partir de este baseline y preservar todo lo que aquí se declara como estado actual.
