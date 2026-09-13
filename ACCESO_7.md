# HAVANA NICE APP / PWA — ACCESO 7

## Punto de partida oficial

Acceso 7 es el nuevo baseline oficial de la aplicación PWA de HAVANA NICE.

Repositorio: `Abnernoa97/havana-nice-pwa`
Branch principal: `main`
Baseline anterior: ACCESO 6 — `9e681bef69df75952e007b96004a91269b0697c5`

Este acceso conserva todo el estado funcional acumulado desde ACCESO 6 y establece el estado actual de `main` como nuevo punto de partida.

## Aplicaciones incluidas

- Aplicación de músicos: `index.html` y módulos asociados.
- Aplicación de administrador: `admin.html` y módulos asociados.
- Ambas forman parte exclusivamente del proyecto HAVANA NICE APP / PWA.

## Estado funcional congelado / preservado

- Native Push en tiempo real.
- Notificaciones del administrador al dispositivo del músico.
- Chat realtime.
- Calendario realtime.
- Repertoire realtime.
- Admin Summary realtime/storage.
- Storage.
- Separación Admin / Musicians.
- Acceso de músicos mediante nombre, sin email/password.
- Authentication existente.
- `notifications-v5.js`.
- `sw.js`.
- `send-musician-push`.
- `musician-push.js`.
- `musician_push_subscriptions`.
- `family-v1.js` restaurado al estado correspondiente al baseline.
- `calendar-navigation.js` restaurado al estado correspondiente al baseline.

## Cambio incorporado antes de ACCESO 7

Se implementó una memoria local del último músico utilizado en el dispositivo, sin Passkey, biometría, fingerprint, Face ID, WebAuthn, contraseña nueva ni credencial nueva.

Archivo actual:
- `session-memory-v2.js`

Integración:
- `operations-fix.js` carga `session-memory-v2.js`.

Comportamiento previsto:
1. La primera entrada solicita el nombre y valida mediante el RPC existente `login_by_username`.
2. Después de un login exitoso se recuerda el último músico en `localStorage`.
3. Al volver a abrir la PWA se recupera ese nombre y se valida nuevamente mediante `login_by_username`.
4. Si la validación es correcta, se reconstruye `hn_profile` en `sessionStorage` y se ejecuta el flujo normal de entrada a Home.
5. Logout elimina la memoria local del último músico.
6. Si el músico dejó de estar activo, la restauración automática no permite el acceso, limpia la memoria y deja disponible el login normal.

## Implementación descartada

`session-memory-v1.js` fue descartado porque no funcionó correctamente en la prueba real.
También se eliminó el sistema experimental de Passkey/biometría (`passkey-device.js` y `passkey-register.js`).

## Regla para continuar desde ACCESO 7

Todo trabajo posterior debe tomar ACCESO 7 como baseline oficial y considerar descartado cualquier cambio posterior que no sea indicado explícitamente como válido.

No modificar los módulos congelados salvo instrucción explícita.
No mezclar este proyecto con la página web de HAVANA NICE ni con Familia Noa u otros proyectos.
