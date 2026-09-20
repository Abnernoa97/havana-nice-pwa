# HAVANA NICE APP / PWA — ACCESO GENERAL 8.5

Fecha oficial: 2026-09-20

## ESTADO OFICIAL CONGELADO

Este documento establece **ACCESO GENERAL 8.5** como checkpoint oficial de la aplicación HAVANA NICE APP / PWA.

Repositorio: `Abnernoa97/havana-nice-pwa`
Rama principal: `main`
Rama de respaldo del checkpoint: `acceso-general-8-5`
Aplicación: `https://havana-nice-pwa.pages.dev/`
Supabase Project ID: `xzfradccsxonmauinecl`

Commit funcional inmediatamente anterior al documento de checkpoint:
`ec0b540c22507e0733d601a013f803e45441ff36`

Este checkpoint conserva el árbol completo del repositorio tal como existe en este momento. No sustituye ni elimina checkpoints anteriores.

---

## 1. PRINCIPIO DE ESTE CHECKPOINT

ACCESO GENERAL 8.5 congela **todo el estado actual de la app**, incluyendo:

- Aplicación de músicos.
- Aplicación de administrador.
- Login y Device Gate.
- Session Memory.
- Perfil / Familia HAVANA NICE.
- Calendario.
- Repertorio.
- Notificaciones internas.
- Push notifications.
- Chat de Información.
- Texto, audio, foto y video en Chat.
- Reply en Chat.
- Media handling / video processing.
- Service Worker unificado.
- Instalación PWA.
- Background global.
- Supabase Realtime.
- Storage.
- Lógica de rutas internas de Push.
- Estado actual de Supabase documentado abajo.

Todo archivo que exista en la rama `acceso-general-8-5` forma parte de este baseline aunque no aparezca enumerado individualmente en este documento.

---

## 2. PUSH / RUTAS INTERNAS — ESTADO OFICIAL

La lógica oficial es simple y directa:

### Chat de Información

Cualquier mensaje generado desde Chat — texto, nota de voz, foto o video — envía Push con destino:

`https://havana-nice-pwa.pages.dev/#chat`

El router interno interpreta `#chat` y abre **CHAT DE INFORMACIÓN**.

### Notificaciones de Administrador

Una notificación creada desde la aplicación Administrador envía Push con destino:

`https://havana-nice-pwa.pages.dev/#notifications`

El router interno interpreta `#notifications` y abre **NOTIFICACIONES**.

### Navegación Atrás

Se implementó el retorno desde una ruta abierta por Push hacia HOME de HAVANA NICE para evitar que el primer Atrás saque inmediatamente al usuario de la aplicación.

Estado de validación física:

- Chat Push -> HAVANA NICE -> Chat de Información: **comprobado físicamente después de instalación limpia**.
- Admin Push -> HAVANA NICE -> Notificaciones: **comprobado físicamente después de instalación limpia**.
- Flujo Atrás -> HOME después del último ajuste: **implementado, pendiente de confirmación física posterior al cambio**.

No declarar este último punto como físicamente validado hasta recibir confirmación en dispositivo.

---

## 3. INSTALACIÓN OFICIAL

Origen oficial único:

`https://havana-nice-pwa.pages.dev/`

Para instalaciones realmente limpias se debe desinstalar una instalación anterior y borrar los datos del sitio/origen anterior antes de volver a instalar.

La instalación actual debe provenir del dominio Cloudflare anterior. Las antiguas instalaciones originadas en GitHub Pages no deben utilizarse como referencia del estado oficial.

---

## 4. SERVICE WORKER / PWA

Service Worker actual: `sw.js`

Arquitectura actual:

- Service Worker unificado para músicos + administrador + Push.
- JavaScript same-origin crítico utiliza política network-first/no-cache cuando hay red.
- Limpieza de caches HAVANA NICE obsoletos durante activación.
- Shell músico y shell administrador separados.
- Push muestra notificación y utiliza el destino hash entregado por backend.
- Rutas soportadas por Push: `#chat` y `#notifications`.

Manifest músico permanece en `manifest.json`.
Manifest administrador permanece en `admin-manifest.json`.

No modificar identidad/origen del manifest sin una razón explícita y pruebas controladas.

---

## 5. SESSION MEMORY / DEVICE ACCESS

`session-memory-v2.js` conserva al último músico validado en el dispositivo y restaura la sesión solamente después de validar la autorización mediante backend.

La lógica de rutas Push está integrada con Session Memory para permitir que una entrada por `#chat` o `#notifications` termine en la sección correcta una vez que el músico válido esté disponible.

`musician-device-access-v1.js` continúa siendo la pieza de autorización de dispositivo.

No sustituir esta arquitectura por un login paralelo sin instrucción explícita.

---

## 6. CHAT DE INFORMACIÓN

Archivo principal: `chat-v2.js`

Estado conservado en ACCESO GENERAL 8.5:

- Realtime.
- Historial local / IndexedDB.
- Sincronización incremental.
- Texto.
- Nota de voz.
- Fotos.
- Videos.
- Reply / respuesta a mensajes.
- Unread / lectura.
- Scroll y carga progresiva.
- Media preview.
- Video posters / playback metadata según backend actual.
- UI de progreso de subida existente.
- Corrección de teclado Android existente.
- Typing / presencia existente.

Archivos relacionados conservados:

- `chat-v2.js`
- `chat-media-v13.js`
- `chat-media-fix-v1.js`
- `chat-keyboard-v1.js`
- `chat-typing-v2.js`
- `operations-fix.js`

No refactorizar Chat completo salvo instrucción explícita. Prioridad: estabilidad y cambios de causa raíz.

---

## 7. PERFIL / FAMILIA HAVANA NICE

Se conserva el estado actual de:

- `family-v1.js`
- edición de foto y portada;
- perfiles de integrantes;
- carga inmediata de perfil con media posterior;
- fixes específicos de iPhone contenidos en `ios-install-v1.js`;
- capa/z-index de Home / Mi Perfil ya corregida.

No alterar la corrección iPhone de `.home-top` / perfil sin una razón concreta.

---

## 8. CALENDARIO / REPERTORIO / NOTIFICACIONES

Se conserva el estado actual de:

- `calendar-v1.js`
- `calendar-expand.js`
- `calendar-navigation.js`
- `calendar-recipients-v1.js`
- `repertoire-v1.js`
- `notifications-v5.js`
- `notifications-navigation.js`

Realtime y estados existentes quedan incluidos en el checkpoint.

---

## 9. ADMINISTRADOR

Se conserva la aplicación de administrador completa y separada del flujo músico.

Archivos principales existentes incluyen:

- `admin.html`
- `admin-ui-v1.js`
- `admin-family-v1.js`
- `admin-chat-v1.js`
- `admin-access-v1.js`
- `admin-background-v1.js`
- `admin-storage-summary.js`
- `admin-summary-realtime.js`
- `admin-pwa.js`
- `admin-manifest.json`

La aplicación Administrador continúa publicando notificaciones que terminan en la sección Notificaciones de la app músico mediante la ruta oficial `#notifications`.

---

## 10. BACKGROUND GLOBAL

Se conserva la arquitectura global existente basada en:

- `public.app_background_config`
- bucket `musician-backgrounds`
- `musician-background-v1.js`
- `admin-background-v1.js`

El fallback incluido en repositorio permanece disponible.

---

## 11. SUPABASE — ESTADO DEL BACKEND EN ESTE CHECKPOINT

Project ID:
`xzfradccsxonmauinecl`

Última migración registrada al crear ACCESO GENERAL 8.5:

`20260920041942 — use_hash_routes_for_push_targets`

Migraciones inmediatamente relacionadas con Push actuales:

- `20260919204117 — chat_messages_push_notifications`
- `20260919205503 — chat_push_professional_copy`
- `20260920034246 — canonical_cloudflare_push_urls`
- `20260920035428 — route_push_to_app_sections`
- `20260920041942 — use_hash_routes_for_push_targets`

Funciones/trigger functions de Push actuales:

- `public.hn_push_on_chat_message()` -> `https://havana-nice-pwa.pages.dev/#chat`
- `public.hn_push_on_notification()` -> `https://havana-nice-pwa.pages.dev/#notifications`

Tablas públicas existentes en el momento del checkpoint:

- `profiles`
- `profile_realtime`
- `repertoire_songs`
- `repertoire_realtime`
- `musician_backgrounds`
- `notifications`
- `calendar_events`
- `chat_messages`
- `chat_settings`
- `calendar_event_recipients`
- `musician_push_subscriptions`
- `app_background_config`
- `family_profiles`
- `musician_devices`
- `musician_access_alerts`

Todas las tablas anteriores tenían RLS habilitado al registrar el checkpoint.

### Edge Functions activas y versiones registradas

- `send-musician-push` — v2 — hash `fe84ba7d97a620ca0b00308c62ddc578af270f159a627bf285e783d0884a354c`
- `passkey-options` — v2 — hash `51e91825ddce27e095fcfe9ff9ee136b8a2e82467da92eca107cf9c8b599e62f`
- `passkey-register-verify` — v2 — hash `ba3925160e54996aa0005ce53bf435bdf6e5d01852b0897b071cbd81e1934b35`
- `passkey-auth-options` — v2 — hash `724e16b917d5814e62ba6d2fe492644f0a670857870d7f1f583dc2bf3502a0d7`
- `passkey-auth-verify` — v2 — hash `bc342192ac0821d6a558d9731c37283324f414b7301e3e6e433767bed5ca2573`
- `passkey-status` — v2 — hash `3a260e98f05e839ff4474e3917c925ec0a27030924ab8eded5199c299e91a6a6`
- `family-profile-media-v1` — v7 — hash `33ec8f519dca6250d35c171476fa54ba02113938549b52fff002e2f3d98a964c`
- `storage-maintenance-v1` — v7 — hash `2d6a18f5f68caf68673e27649af98db170cc9cd136aa664f172118d8b4bda5f2`
- `admin-publish-notification-v1` — v3 — hash `c17963e3ab670be80dd20c3d9f9d6719ece20664481db214124bd3425c1e55f8`
- `chat-video-transcode-v1` — v5 — hash `63e59279c99f447e4810c764c2825dd165fb0137b0e2aa5d9c851e7ffee457dd`

No se copian secretos, llaves privadas ni datos de producción dentro de este documento.

---

## 12. REGLAS DE RESTAURACIÓN

Si en el futuro el proyecto se rompe y el usuario pide regresar a **ACCESO GENERAL 8.5**:

1. Usar como referencia primaria la rama `acceso-general-8-5`.
2. Comparar `main` contra esa rama antes de cambiar nada.
3. No hacer reset destructivo de `main` sin instrucción explícita del usuario.
4. Revisar también el estado de Supabase contra la última migración y versiones de Edge Functions documentadas aquí.
5. No copiar ni reconstruir secretos desde este documento.
6. Restaurar primero la causa raíz mínima; no aplicar parches acumulativos.

---

## 13. VALIDACIÓN Y DISCIPLINA

La evidencia física del usuario tiene prioridad sobre suposiciones técnicas.

Estado confirmado antes de congelar 8.5:

- instalación limpia desde Cloudflare realizada;
- Chat Push redirige a la app real y a Chat de Información;
- Admin Push redirige a la app real y a Notificaciones;
- funcionamiento general posterior a instalación limpia reportado como correcto;
- ajuste de Atrás -> HOME implementado en el commit funcional previo, pendiente de confirmación física específica.

No afirmar pruebas físicas adicionales que no hayan sido realizadas por el usuario.

---

## 14. BASELINE

**ACCESO GENERAL 8.5 es desde ahora un checkpoint oficial completo.**

Cualquier trabajo futuro debe poder compararse contra este estado.

No mezclar HAVANA NICE APP / PWA con la página web comercial de HAVANA NICE, FAMILIA NOA, Squarespace ni otros proyectos.
