# HAVANA NICE V2 — PLAN MAESTRO DE TRABAJO

**Estado:** PLANIFICACIÓN APROBADA  
**Objetivo:** reconstruir HAVANA NICE sin prisa, con arquitectura limpia, rápida y mantenible.  
**Costo objetivo:** 0 MXN.  
**Plataformas objetivo:** Android nativo + iPhone PWA premium.  
**Backend principal:** Supabase.  
**Repositorio:** un solo repositorio, una sola rama `main`, lógica compartida y dos clientes.  
**Regla principal:** NO tocar ni sustituir la HAVANA NICE actual mientras V2 no esté físicamente validada.

---

## 1. REGLA DE TRABAJO FUNDAMENTAL

HAVANA NICE V2 se construirá **verticalmente**, no por plataforma completa.

Nunca se hará primero toda Android y después toda PWA.

Cada capacidad se considera terminada únicamente cuando tenga:

1. Backend/contrato compartido listo.
2. Android nativo listo.
3. PWA iPhone lista.
4. Prueba Android → PWA aprobada.
5. Prueba PWA → Android aprobada.
6. Prueba de reconexión/caché cuando corresponda.
7. Documentación actualizada.
8. Commit limpio y estado marcado como CERRADO.

**No se empieza la siguiente capacidad hasta cerrar las dos plataformas de la capacidad actual.**

Ejemplo correcto:

- Texto Chat compartido
- Texto Chat Android
- Texto Chat PWA
- Prueba cruzada
- CERRADO
- Foto Chat compartida
- Foto Android
- Foto PWA
- Prueba cruzada
- CERRADO
- Video Chat...
  
Ejemplo prohibido:

- Hacer Chat Android completo
- Hacer fotos Android
- Hacer videos Android
- Hacer audio Android
- Después intentar copiar todo a PWA

---

## 2. ARQUITECTURA OBJETIVO

```
HAVANA NICE V2
│
├── apps/
│   ├── android/          Android nativo
│   └── pwa/              iPhone / web instalada
│
├── packages/
│   ├── domain/           Modelos y reglas compartidas
│   ├── data/             Supabase, repositorios y sincronización
│   ├── realtime/         Broadcast, Presence y eventos
│   ├── cache/            Persistencia local y colas
│   └── ui-shared/        Tokens/recursos realmente compartibles
│
├── supabase/
│   └── migrations/       TODO cambio backend versionado
│
├── tests/
│   └── cross-platform/
│
└── docs/
    └── continuidad y decisiones
```

### Principios

- Un solo `main`.
- `main` siempre debe poder compilar.
- No habrá ramas históricas permanentes tipo `fix-2`, `safe-3`, etc.
- Los checkpoints importantes serán tags/releases, no docenas de ramas.
- Toda modificación de Supabase deberá quedar versionada como migración.
- Android y PWA usan el mismo modelo de datos.
- La UI puede ser distinta donde cada plataforma lo necesite.
- Nunca se fuerza código visual idéntico si crea hacks.
- Supabase es la fuente de verdad.
- UI optimista: la interfaz no espera a Postgres cuando no es necesario.
- Realtime rápido: Broadcast/Presence para eventos vivos.
- Persistencia: Postgres para historial definitivo.

---

# 3. ORDEN EXACTO DE CONSTRUCCIÓN

## FASE 0 — AISLAMIENTO Y BASE DEL PROYECTO

Antes de construir una pantalla:

### 0.1 Crear proyecto V2 independiente
- Nuevo repositorio HAVANA NICE V2.
- No reutilizar el frontend viejo como base.
- La app actual queda producción/consulta.

### 0.2 Crear estructura monorepo
- Android.
- PWA.
- paquetes compartidos.
- tests.
- docs.
- Supabase migrations.

### 0.3 Entornos
- Desarrollo/staging.
- Producción.
- Nunca probar cambios destructivos directamente contra producción.

### 0.4 Contratos de datos
Definir tipos compartidos para:
- usuario/músico
- sesión
- mensaje
- reacción
- attachment
- evento
- destinatario
- canción
- repertorio
- notificación

### 0.5 Caché local
Definir desde el principio:
- datos guardados localmente
- caducidad
- sincronización
- reconciliación
- funcionamiento sin conexión

### 0.6 Diagnóstico
Cada cliente tendrá información interna de:
- versión
- build
- conexión Realtime
- última sincronización
- errores
- estado push

**SALIDA FASE 0:** Android y PWA arrancan, se conectan al entorno de desarrollo y muestran una pantalla mínima con sesión/conectividad.

---

# 4. CHAT PRIMERO — MÓDULO DE PRUEBA DE TODA LA ARQUITECTURA

Chat será el primer módulo funcional completo porque obliga a resolver lo más difícil: Realtime, caché, reconexión, archivos, push, teclado y sincronización Android ↔ iPhone.

## CHAT 1 — TEXTO BÁSICO

### 1A Compartido/backend
- modelo Message v1
- id generado en cliente
- sender
- timestamp servidor
- texto
- estado local
- persistencia Postgres
- Broadcast
- ordenamiento determinista
- deduplicación

### 1B Android
- abrir Chat
- lista nativa
- escribir
- enviar
- mensaje aparece instantáneamente
- recibir mensaje sin refrescar

### 1C PWA iPhone
- misma capacidad
- caja de texto estable
- teclado iPhone
- recibir por WebSocket
- render inmediato

### 1D Prueba cruzada obligatoria
- Android → iPhone
- iPhone → Android
- envío simultáneo
- 20 mensajes seguidos
- cambio Wi‑Fi/datos
- cerrar/abrir
- cero duplicados
- orden correcto

**No avanzar hasta aprobar.**

---

## CHAT 2 — ESTADOS DE MENSAJE Y RECONEXIÓN

Compartido + Android + PWA:
- enviando
- enviado
- error
- reintentar
- cola offline
- reconexión automática
- mensaje creado sin internet
- sincronización al recuperar red
- evitar duplicados
- preservar orden

Pruebas cruzadas en ambas direcciones.

---

## CHAT 3 — RESPONDER MENSAJES

Compartido + Android + PWA:
- reply_to_message_id
- preview de respuesta
- tap para localizar original
- mensaje borrado/original ausente

Prueba cruzada.

---

## CHAT 4 — REACCIONES

Compartido + Android + PWA:
- ❤️
- 😂
- 👍
- reacción optimista
- agregar/quitar
- múltiples usuarios
- actualización Realtime

Prueba cruzada.

---

## CHAT 5 — PRESENCIA Y “ESCRIBIENDO”

Compartido + Android + PWA:
- online
- offline
- typing
- expiración automática
- no escribir Presence a Postgres innecesariamente

Prueba cruzada.

---

## CHAT 6 — FOTOS

### Compartido
- attachment común
- metadata
- tamaño
- MIME
- thumbnail
- URL final
- estado de upload

### Android
- selector/cámara
- compresión cuando convenga
- upload
- progreso
- viewer nativo

### PWA iPhone
- selector/cámara disponible
- upload
- progreso
- viewer PWA

### Pruebas
- Android manda → iPhone ve
- iPhone manda → Android ve
- varias fotos
- red lenta
- cancelar/reintentar

**Cerrar fotos completamente antes de video.**

---

## CHAT 7 — VIDEO

Compartido + Android + PWA:
- metadata
- thumbnail/poster
- duración
- upload
- progreso
- reproducción
- error/retry
- límites definidos por experiencia real, no arbitrariamente

Pruebas Android ↔ iPhone.

---

## CHAT 8 — AUDIO / NOTAS DE VOZ

Compartido + Android + PWA:
- grabar
- duración
- waveform si aporta valor
- enviar
- reproducir
- pausar
- velocidad si se decide
- estado de upload

Pruebas Android ↔ iPhone.

---

## CHAT 9 — VIEWER Y GESTOS

Android + PWA:
- foto full screen
- zoom
- swipe
- video full screen
- cerrar con gesto/botón
- volver al mismo punto del Chat

---

## CHAT 10 — PUSH

### Android
- push con app cerrada
- push con teléfono bloqueado
- tap abre mensaje correcto

### iPhone PWA
- Web Push
- onboarding para permiso
- badge cuando corresponda
- tap abre Chat

### Pruebas
- Android cerrado recibe desde iPhone
- iPhone cerrado recibe desde Android
- app abierta no duplica aviso innecesariamente

---

## CHAT 11 — PULIDO

Solo después de que todo lo anterior funcione:
- animaciones
- emojis
- stickers
- menú contextual
- timestamps
- agrupación visual
- scroll
- unread separator
- scroll-to-bottom
- diseño final
- performance con historial grande

**SALIDA CHAT:** Chat V2 aprobado físicamente en al menos un Android y un iPhone.

---

# 5. DESPUÉS DEL CHAT

Se repite exactamente la misma metodología vertical.

## MÓDULO 2 — AUTENTICACIÓN / ACCESO
- sesión persistente
- permisos
- dispositivo autorizado
- cierre/revocación
- Android + PWA + prueba cruzada

## MÓDULO 3 — HOME
- carga inmediata desde caché
- actualización silenciosa
- navegación
- Android + PWA

## MÓDULO 4 — CALENDARIO
Orden interno:
1. lista de eventos
2. tarjeta/expandir
3. horarios texto libre
4. detalles
5. Maps
6. destinatarios
7. realtime
8. caché/offline
9. repertorio de evento embebido

Cada punto: Android + PWA + prueba antes del siguiente.

## MÓDULO 5 — REPERTORIO GENERAL
1. ENGLISH
2. ESPAÑOL
3. búsqueda si se decide
4. links de referencia
5. realtime
6. caché

Android + PWA.

## MÓDULO 6 — NOTIFICACIONES
1. feed interno
2. detalle
3. imágenes
4. links
5. push Android
6. Web Push iPhone
7. badge
8. leído/no leído

## MÓDULO 7 — FAMILIA
Migrar únicamente lo que realmente se usa.
Android + PWA.

## MÓDULO 8 — AJUSTES / CUENTA
- usuario
- dispositivo
- notificaciones
- versión
- diagnóstico
- cerrar sesión

---

# 6. ADMINISTRADOR V2

Administrador no se copia de la app actual.

Se construye después de estabilizar los contratos de datos de cada módulo.

Orden:

1. Acceso admin
2. Dashboard mínimo
3. Músicos/dispositivos
4. Calendario
5. Destinatarios
6. Repertorio general
7. Repertorio por evento
8. Notificaciones
9. Chat admin
10. Familia
11. Storage/diagnóstico

Regla:
- Admin siempre usa las mismas APIs/modelos que los clientes.
- No crear una segunda lógica paralela para los mismos datos.
- Los RPC admin quedan cerrados correctamente.
- Ningún `admin_*` debe depender de permisos anónimos salvo justificación explícita.

---

# 7. DEFINICIÓN DE “TERMINADO” PARA CADA FEATURE

Una feature NO está terminada porque “el código ya está”.

Debe cumplir:

- [ ] Android funciona físicamente.
- [ ] PWA iPhone funciona físicamente.
- [ ] Android → PWA funciona.
- [ ] PWA → Android funciona.
- [ ] Sin errores visibles.
- [ ] No requiere refresh manual.
- [ ] Reconexión probada si aplica.
- [ ] Caché probada si aplica.
- [ ] No duplica datos.
- [ ] Backend versionado.
- [ ] Tests mínimos pasan.
- [ ] Documentación actualizada.
- [ ] Commit final identificado.
- [ ] Usuario confirma prueba física.

---

# 8. REGLAS PARA EVITAR OTRO PROYECTO PARCHADO

1. No crear un archivo nuevo solo para corregir otro archivo si puede resolverse limpiamente en su módulo.
2. No usar nombres permanentes tipo `fix`, `fix2`, `patch`, `final-final`.
3. No dejar loaders apuntando a archivos inexistentes.
4. No usar cache-busting manual basado en parches como arquitectura central.
5. No duplicar lógica entre Android y PWA.
6. No mezclar Chat con Calendar ni módulos sin relación.
7. No depender de DOM observers para lógica de negocio.
8. No usar WebView como sustituto automático de una pantalla nativa.
9. No agregar validaciones arbitrarias de datos.
10. No hacer cambios de Supabase sin migración en Git.
11. No tocar producción para experimentar.
12. No declarar una función terminada sin prueba física.
13. No empezar tres features simultáneamente.
14. Una capacidad abierta a la vez por módulo.
15. Si algo funciona bien, no se refactoriza solo “por limpiar” sin beneficio medible.

---

# 9. METODOLOGÍA DE CADA SESIÓN DE TRABAJO

En cada chat futuro:

1. Leer este documento.
2. Identificar **FASE / MÓDULO / PASO ACTUAL**.
3. Revisar último commit y estado.
4. Trabajar únicamente ese paso.
5. Probar automáticamente.
6. Entregar prueba física exacta al usuario.
7. Esperar resultado físico.
8. Corregir si falla.
9. Cuando usuario confirme, marcar paso CERRADO.
10. Actualizar este documento con:
   - fecha
   - commit
   - qué quedó cerrado
   - siguiente paso

---

# 10. ORDEN RESUMIDO OFICIAL

```
0. FUNDACIÓN
   Android + PWA

1. CHAT TEXTO
   Android + PWA

2. CHAT RECONEXIÓN/ESTADOS
   Android + PWA

3. CHAT REPLY
   Android + PWA

4. CHAT REACCIONES
   Android + PWA

5. CHAT PRESENCE/TYPING
   Android + PWA

6. CHAT FOTOS
   Android + PWA

7. CHAT VIDEO
   Android + PWA

8. CHAT AUDIO
   Android + PWA

9. CHAT VIEWER
   Android + PWA

10. CHAT PUSH
    Android + PWA

11. CHAT PULIDO
    Android + PWA

12. ACCESO
    Android + PWA

13. HOME
    Android + PWA

14. CALENDARIO
    capacidad por capacidad, Android + PWA

15. REPERTORIO
    capacidad por capacidad, Android + PWA

16. NOTIFICACIONES
    capacidad por capacidad, Android + PWA

17. FAMILIA
    capacidad por capacidad, Android + PWA

18. AJUSTES
    Android + PWA

19. ADMIN V2
    módulo por módulo

20. QA COMPLETO
    Android + iPhone

21. MIGRACIÓN GRADUAL
    sin apagar app actual hasta validación final
```

---

# 11. ESTADO ACTUAL

**Última actualización:** 2026-10-23  
**V2 todavía no iniciada técnicamente.**  
**Estado actual:** arquitectura y metodología definidas.  
**Primer paso cuando el usuario diga ADELANTE:** FASE 0 — crear el repositorio V2 aislado y su estructura base.  
**Primera feature funcional después de la fundación:** CHAT TEXTO Android ↔ iPhone PWA.

---

# 12. DECISIONES YA TOMADAS

- Costo: 0 MXN.
- Android: nativo.
- iPhone: PWA premium mientras se mantenga costo cero.
- Un único backend.
- Supabase como fuente principal de verdad.
- Realtime rápido mediante Broadcast/Presence donde corresponda.
- GitHub como fuente de verdad del código.
- Un solo `main`.
- Supabase migrations en Git desde el primer día.
- Desarrollo vertical Android + PWA por cada capacidad.
- App actual se conserva y no se rompe durante la construcción.
