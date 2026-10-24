# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Última actualización:** 2026-10-24  
**Estado:** FASE 0 — FUNDACIÓN EN CURSO  
**Costo objetivo permanente:** 0 MXN  
**Plataformas:** Android nativo + iPhone PWA premium  
**Backend oficial:** Cloudflare  
**Fuente única de verdad de continuidad:** este archivo  
**Modo operativo:** el usuario pide el resultado; ChatGPT ejecuta todo el trabajo técnico de punta a punta

---

# 1. OBJETIVO

Construir HAVANA NICE V2 desde cero, limpia, rápida, mantenible y profesional, sin arrastrar parches ni dependencias innecesarias de la aplicación actual.

La nueva app debe:

- sentirse nativa y rápida;
- abrir inmediatamente desde caché local;
- sincronizar en segundo plano;
- tener Chat realmente realtime;
- funcionar de forma coherente entre Android e iPhone;
- permitir fotos, video, audio y push;
- tener un sistema de acceso pequeño y seguro;
- mantener costo de infraestructura y distribución en 0 MXN siempre que sea técnicamente posible;
- ser administrable y desplegable de forma automatizada;
- dejar a producción actual completamente fuera de riesgo.

---

# 2. MODELO OPERATIVO — ENTREGA LLAVE EN MANO

La regla de trabajo de HAVANA NICE V2 es:

```
USUARIO
“Quiero X”
↓
CHATGPT
arquitectura
código
Cloudflare
GitHub
permisos
infraestructura
base de datos
storage
realtime
seguridad
tests
builds
deploy
diagnóstico
correcciones
↓
ENTREGA LISTA
```

El usuario NO debe encargarse de tareas técnicas manuales como:

- entrar a Cloudflare para crear recursos;
- crear Workers;
- crear D1;
- crear R2;
- configurar Durable Objects;
- crear bindings;
- crear rutas;
- editar variables;
- crear permisos internos;
- escribir SQL;
- crear tablas;
- configurar GitHub Actions;
- copiar tokens;
- ejecutar Wrangler;
- compilar Android;
- preparar PWA;
- revisar logs;
- diagnosticar errores;
- hacer deploy;
- corregir fallos de infraestructura;
- mantener sincronizados Android y PWA.

ChatGPT debe hacer directamente todo lo anterior usando las herramientas conectadas y automatizaciones disponibles.

## 2.1 Acceso directo a Cloudflare

El complemento oficial de Cloudflare para ChatGPT está instalado y autenticado.

Está autorizado para trabajar sobre las cuentas Cloudflare existentes seleccionadas por el propietario.

El flujo oficial pasa a ser:

```
ChatGPT
├── Cloudflare oficial → crear / leer / modificar / desplegar infraestructura
├── GitHub → código fuente, commits, ramas y automatizaciones
└── builds/tests → validar antes de entregar
```

Para HAVANA NICE V2 se debe usar infraestructura NUEVA y aislada.

No reutilizar ni modificar recursos existentes de otros proyectos salvo orden expresa del usuario.

## 2.2 Intervención del usuario

Objetivo: cero intervención técnica del usuario.

Solo se solicitará una acción al usuario cuando una plataforma externa exija obligatoriamente una acción personal del propietario que no pueda ejecutarse por API o por las herramientas conectadas, por ejemplo:

- aceptar una autorización OAuth;
- aprobar una acción especialmente sensible;
- iniciar sesión cuando la plataforma exija presencia humana;
- instalar físicamente un APK/PWA en un teléfono;
- realizar una prueba física que no pueda ejecutarse remotamente.

Estas excepciones NO deben convertirse en trabajo técnico delegado al usuario.

Nunca pedirle al usuario que haga manualmente un paso que ChatGPT pueda ejecutar.

## 2.3 Entrega

Cuando el usuario pida una función, ChatGPT debe intentar completar en la misma tarea:

1. diseño;
2. implementación;
3. backend;
4. permisos;
5. infraestructura;
6. pruebas automáticas;
7. compilación;
8. despliegue;
9. verificación;
10. documentación;
11. entrega del artefacto o enlace listo para usar.

No entregar instrucciones cuando se pueda entregar el resultado.

---

# 3. REGLAS ABSOLUTAS

## 3.1 HAVANA NICE actual

La aplicación HAVANA NICE actual es PRODUCCIÓN y está totalmente prohibido:

- modificarla para construir V2;
- reutilizar su backend como laboratorio;
- alterar datos;
- migrar tablas;
- cambiar credenciales;
- cambiar despliegue;
- borrar archivos;
- introducir módulos V2;
- “limpiar” producción mientras hacemos V2.

Solo se puede:

- leer arquitectura;
- observar comportamiento;
- reutilizar ideas funcionales;
- consultar estructura como referencia.

## 3.2 FAMILIA NOA

FAMILIA NOA es otro proyecto independiente.

Se pueden estudiar patrones técnicos útiles, pero HAVANA NICE V2 NO compartirá:

- Worker;
- base de datos;
- almacenamiento;
- sesiones;
- usuarios;
- secretos;
- deploy;
- lógica de producción.

## 3.3 Costo

No introducir un servicio de pago como requisito de funcionamiento sin aprobación expresa del usuario.

## 3.4 Validación

Nunca decir “ya funciona” por haber escrito código.

Una función queda terminada únicamente cuando:

- compila;
- pasa pruebas automáticas;
- funciona en Android;
- funciona en iPhone PWA;
- funciona Android → iPhone;
- funciona iPhone → Android;
- se prueba reconexión/caché cuando corresponda;
- el usuario la confirma físicamente.

---

# 4. ARQUITECTURA OFICIAL

```
                    HAVANA NICE V2
                           │
              ┌────────────┴────────────┐
              │                         │
       ANDROID NATIVO              IPHONE PWA
       React Native/Expo           PWA premium
              │                         │
              └────────────┬────────────┘
                           │
                           ↓
                 CLOUDFLARE WORKER
                    API CENTRAL
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ↓                ↓                ↓
         D1          DURABLE OBJECTS        R2
      datos           WebSockets           media
   persistentes          Chat          foto/video/audio
```

Complementos:

```
Android push  → FCM
iPhone PWA    → Web Push

GitHub        → código y versionado
GitHub Actions / Wrangler → validación y despliegue automatizado
```

---

# 5. RESPONSABILIDAD DE CADA PIEZA

## 5.1 Cloudflare Worker — API central

Será la única puerta de entrada del backend.

Android y PWA NO hablarán directamente con D1 ni R2.

El Worker será responsable de:

- autenticación;
- sesiones;
- permisos;
- validación de entrada;
- lectura/escritura de D1;
- URLs firmadas o acceso controlado a R2;
- conexión con Durable Objects;
- rutas admin;
- push;
- diagnóstico;
- rate limiting cuando haga falta;
- auditoría de acciones sensibles.

Estructura prevista:

```
/api/auth/*
/api/chat/*
/api/calendar/*
/api/repertoire/*
/api/notifications/*
/api/family/*
/api/admin/*
/api/media/*
/api/push/*
/health
```

## 5.2 D1 — fuente persistente de datos

D1 guardará información estructurada:

- usuarios;
- sesiones;
- dispositivos;
- permisos;
- mensajes;
- replies;
- reacciones;
- estados de lectura;
- calendario;
- destinatarios;
- repertorio;
- repertorio por evento;
- notificaciones;
- metadata de archivos;
- configuración;
- auditoría básica.

D1 NO guardará blobs pesados de fotos, videos o audio.

## 5.3 Durable Objects + WebSockets — realtime

La ruta rápida del Chat no debe esperar a la base de datos.

Durable Objects manejará eventos vivos como:

- mensaje nuevo;
- typing;
- online/offline;
- reacción;
- read receipt;
- eventos instantáneos del Chat.

Principio:

```
usuario toca enviar
↓
mensaje aparece localmente
↓
WebSocket lo distribuye
↓
persistencia ocurre en paralelo
↓
cliente reconcilia confirmación
```

Nunca diseñar Chat como:

```
guardar DB
↓
esperar
↓
volver a consultar
↓
mostrar
```

## 5.4 R2 — media

R2 guardará:

- fotos;
- videos;
- audios;
- thumbnails;
- posters;
- archivos de Chat cuando corresponda.

La base guardará únicamente metadata y referencias.

Los archivos privados no deben depender de una URL pública eterna.

## 5.5 FCM y Web Push

Android:
- FCM para notificaciones cuando la app esté cerrada o el teléfono bloqueado.

iPhone PWA:
- Web Push para la PWA instalada en Home Screen.

El Worker centralizará la lógica para que una misma notificación pueda salir hacia ambos sistemas.

---

# 6. ACCESO, SESIONES Y PERMISOS

No se utilizará un sistema empresarial complicado de identidad si no aporta valor.

HAVANA NICE tiene pocos usuarios y roles claros.

## 6.1 Roles iniciales

### ADMIN
Puede:
- administrar usuarios;
- administrar dispositivos;
- calendario;
- repertorio;
- notificaciones;
- Chat según reglas definidas;
- ajustes administrativos.

### MÚSICO
Puede:
- acceder a sus módulos;
- usar Chat;
- leer calendario autorizado;
- leer repertorio;
- recibir notificaciones;
- ejecutar acciones explícitamente permitidas.

### INACTIVO / BLOQUEADO
No puede acceder aunque conserve la app instalada.

## 6.2 Permisos

El servidor siempre verifica permisos.

Ocultar un botón NO cuenta como seguridad.

Ejemplos futuros:

```
chat.read
chat.send
chat.react
chat.delete_own
calendar.read
calendar.write
repertoire.read
repertoire.write
notifications.read
admin.access
```

## 6.3 Sesiones

Objetivo:

- login sencillo;
- sesión persistente;
- token corto + mecanismo seguro de renovación;
- revocación;
- dispositivo registrado;
- cierre remoto;
- cambio inmediato a bloqueado;
- no guardar secretos sensibles en PWA o APK.

## 6.4 Diseño de acceso

Primera versión prevista:

```
usuario
+
credencial personal
↓
Worker valida
↓
sesión segura
↓
dispositivo autorizado
```

Passkeys se pueden añadir después si mejoran claramente la experiencia.

---

# 7. ESTRATEGIA DE CÓDIGO

Un solo proyecto lógico y una sola fuente de verdad.

Estructura:

```
v2/
│
├── apps/
│   ├── android/
│   └── pwa/
│
├── packages/
│   └── shared/
│
├── cloudflare/
│   ├── src/
│   └── wrangler.jsonc
│
├── tests/
│   └── cross-platform/
│
├── docs/
│   └── PLAN-MAESTRO.md
│
└── scripts/
```

No debe existir una segunda documentación de arquitectura o continuidad.

Si cambia una decisión importante, se reescribe ESTE documento.

---

# 8. METODOLOGÍA DE CONSTRUCCIÓN

Se trabaja VERTICALMENTE.

Nunca:

```
terminar toda Android
↓
meses después intentar copiar a PWA
```

Siempre:

```
capacidad compartida/backend
↓
Android
↓
PWA
↓
Android → PWA
↓
PWA → Android
↓
prueba física
↓
CERRADO
```

No se abre la siguiente capacidad mientras la actual esté incompleta.

---

# 9. FASE 0 — FUNDACIÓN

Objetivo: dejar una base técnica estable antes de hacer funciones visibles complejas.

## 0.1 Aislamiento

- rama V2 aislada;
- producción intacta;
- futura migración a repo dedicado si se habilita creación del repo;
- ningún deploy V2 puede apuntar a producción actual.

## 0.2 Android

- React Native / Expo;
- paquete Android propio;
- app arranca;
- pantalla Fundación;
- configuración por entorno;
- cliente API compartido;
- caché local base;
- diagnóstico.

## 0.3 PWA

- Vite + React;
- manifest;
- standalone;
- service worker;
- safe areas iPhone;
- caché base;
- cliente API compartido;
- diagnóstico.

## 0.4 Cloudflare

Crear recursos independientes para HAVANA NICE V2:

- Worker;
- D1;
- Durable Object namespace;
- variables y secretos;
- entorno development;
- health endpoint;
- deploy automatizado.

R2 sigue siendo el almacenamiento oficial de media, pero Cloudflare exige una activación inicial de la suscripción R2 mediante checkout en el dashboard antes de permitir su API. Como R2 no es necesario para Chat de texto ni para cerrar la base técnica inicial, su activación se difiere hasta justo antes de CHAT 6 — FOTOS. No bloquear FASE 0 por R2.

No reutilizar Worker ni recursos de FAMILIA NOA.

## 0.5 Contratos compartidos

Definir:

- User;
- Session;
- Device;
- Permission;
- Message;
- Reaction;
- Attachment;
- Event;
- Recipient;
- Song;
- Notification;
- API result/error;
- realtime envelope.

## 0.6 Observabilidad

Cada cliente debe poder mostrar internamente:

- versión;
- build;
- plataforma;
- entorno;
- estado API;
- estado WebSocket;
- última sincronización;
- estado push;
- errores recientes útiles.

## 0.7 Cierre de FASE 0

FASE 0 solo se cierra cuando:

- Android compila;
- PWA compila;
- Worker está desplegado;
- /health responde;
- Android consume /health;
- PWA consume /health;
- D1 existe y responde;
- Durable Objects está preparado y responde;
- R2 puede permanecer pendiente hasta el módulo de media si Cloudflare sigue exigiendo activación manual de suscripción;
- primer APK laboratorio existe;
- preview PWA existe;
- Android arranca físicamente;
- iPhone PWA arranca físicamente;
- usuario confirma ambos.

---

# 10. CHAT — PRIMER MÓDULO FUNCIONAL

Chat será el primer módulo completo porque obliga a validar realtime, caché, archivos, reconexión y push.

## CHAT 1 — TEXTO BÁSICO

### Backend/shared
- Message v1;
- client_message_id;
- sender;
- server timestamp;
- texto;
- estado;
- persistencia D1;
- distribución WebSocket;
- orden determinista;
- deduplicación.

### Android
- abrir Chat;
- render local;
- escribir;
- enviar;
- recibir sin refresh;
- scroll estable;
- teclado estable.

### PWA iPhone
- misma capacidad;
- teclado iOS estable;
- safe areas;
- recibir sin refresh;
- scroll estable.

### Prueba obligatoria
- Android → iPhone;
- iPhone → Android;
- envío simultáneo;
- 20 mensajes seguidos;
- cambio Wi‑Fi/datos;
- cerrar/abrir;
- cero duplicados;
- orden correcto.

No avanzar hasta aprobar.

---

## CHAT 2 — ESTADOS Y RECONEXIÓN

Android + PWA:

- enviando;
- enviado;
- error;
- reintentar;
- cola offline;
- reconnect;
- mensaje creado offline;
- sincronización posterior;
- no duplicar;
- preservar orden.

---

## CHAT 3 — REPLY

Android + PWA:

- reply_to_message_id;
- preview;
- localizar original;
- original ausente/borrado.

---

## CHAT 4 — REACCIONES

Android + PWA:

- ❤️;
- 😂;
- 👍;
- optimista;
- agregar/quitar;
- múltiples usuarios;
- realtime.

---

## CHAT 5 — PRESENCE / TYPING

- online;
- offline;
- escribiendo;
- expiración;
- no persistir ruido innecesario en D1.

---

## CHAT 6 — FOTOS

### R2
- metadata;
- tipo;
- tamaño;
- thumbnail;
- estado upload;
- acceso privado/controlado.

### Android
- cámara/selector;
- compresión razonable;
- progreso;
- cancelación;
- retry;
- viewer.

### PWA
- cámara/selector;
- progreso;
- cancelación;
- retry;
- viewer.

### Prueba
- Android → iPhone;
- iPhone → Android;
- varias fotos;
- red lenta;
- reconexión.

Cerrar fotos antes de video.

---

## CHAT 7 — VIDEO

Android + PWA:

- selección;
- metadata;
- thumbnail/poster;
- duración;
- upload R2;
- progreso;
- cancelación;
- retry;
- reproducción;
- red lenta.

No imponer límites arbitrarios sin necesidad real.

---

## CHAT 8 — AUDIO

Android + PWA:

- grabar;
- duración;
- enviar;
- reproducir;
- pausar;
- upload;
- retry.

Waveform/velocidad solo si aportan valor real.

---

## CHAT 9 — VIEWER / GESTOS

- foto fullscreen;
- zoom;
- swipe;
- video fullscreen;
- cerrar;
- regresar al mismo punto del Chat.

---

## CHAT 10 — PUSH

### Android
- FCM;
- app cerrada;
- teléfono bloqueado;
- tap abre conversación correcta.

### iPhone PWA
- Web Push;
- permiso;
- badge cuando aplique;
- tap abre conversación correcta.

### Pruebas cruzadas
- Android cerrado recibe desde iPhone;
- iPhone cerrado recibe desde Android;
- no duplicar push si la conversación ya está activa.

---

## CHAT 11 — PULIDO

Solo después de estabilidad:

- animaciones;
- emojis;
- stickers si se decide;
- menú contextual;
- timestamps;
- agrupación;
- unread separator;
- scroll-to-bottom;
- optimización de historial grande.

SALIDA: Chat V2 aprobado físicamente en Android + iPhone.

---

# 11. RESTO DE MÓDULOS

Después de Chat se mantiene la misma metodología vertical.

## MÓDULO 2 — ACCESO
- login;
- sesión;
- dispositivo;
- bloqueo;
- revocación;
- admin/músico;
- Android + PWA.

## MÓDULO 3 — HOME
- caché inmediata;
- refresh silencioso;
- navegación;
- Android + PWA.

## MÓDULO 4 — CALENDARIO
1. lista;
2. cards;
3. horarios texto libre;
4. detalle;
5. Maps;
6. destinatarios;
7. realtime;
8. caché/offline;
9. repertorio de evento.

Cada capacidad: Android + PWA antes de seguir.

## MÓDULO 5 — REPERTORIO
1. English;
2. Español;
3. búsqueda si aporta valor;
4. links;
5. realtime;
6. caché.

## MÓDULO 6 — NOTIFICACIONES
1. feed;
2. detalle;
3. imágenes;
4. links;
5. push Android;
6. Web Push iPhone;
7. badge;
8. leído/no leído.

## MÓDULO 7 — FAMILIA
Solo funcionalidades que realmente se decidan para HAVANA NICE V2.

No conectar ni mezclar datos con la app FAMILIA NOA.

## MÓDULO 8 — AJUSTES
- cuenta;
- dispositivo;
- notificaciones;
- versión;
- diagnóstico;
- cerrar sesión.

---

# 12. ADMIN V2

Administrador utiliza la MISMA API central.

Orden:

1. acceso admin;
2. dashboard;
3. músicos/dispositivos;
4. calendario;
5. destinatarios;
6. repertorio;
7. repertorio de evento;
8. notificaciones;
9. Chat admin;
10. Familia si aplica;
11. media/diagnóstico.

Reglas:

- no crear una API admin paralela;
- permisos se verifican en Worker;
- ninguna operación sensible depende solo de UI;
- toda acción destructiva importante debe ser auditable;
- cliente nunca recibe secretos del servidor.

---

# 13. CACHÉ Y OFFLINE

Android y PWA deben compartir reglas, no necesariamente la misma tecnología física.

Principios:

- mostrar cache local primero;
- sincronizar después;
- no bloquear Home por red;
- colas para acciones offline cuando tenga sentido;
- IDs generados en cliente para reconciliar;
- deduplicación;
- timestamps del servidor para orden final;
- conflictos explícitos, no silenciosos.

---

# 14. MEDIA

Principios:

- D1 guarda metadata;
- R2 guarda archivos;
- thumbnail/poster separado cuando ayude a velocidad;
- upload resumible cuando sea necesario;
- no cargar video completo para mostrar una lista;
- liberar memoria local;
- limpiar archivos huérfanos;
- nunca hacer pública una colección privada por comodidad.

---

# 15. SEGURIDAD

Reglas mínimas:

- Worker autentica cada operación sensible;
- verificar autorización, no solo autenticación;
- secretos solo servidor;
- no incluir secretos en APK/PWA;
- sesiones revocables;
- dispositivos identificables;
- inputs validados;
- queries parametrizadas;
- R2 privado por defecto para media privada;
- URLs temporales/controladas;
- rate limits donde corresponda;
- logs sin exponer credenciales;
- backups/export periódico de datos importantes cuando el proyecto madure.

---

# 16. PERFORMANCE

Objetivos:

- arranque local primero;
- evitar requests redundantes;
- WebSocket para realtime;
- no consultar historial completo para mostrar lo reciente;
- paginación;
- índices D1;
- thumbnails;
- compresión razonable;
- no mezclar archivos pesados con datos estructurados;
- medir antes de optimizar;
- cualquier cuello real se demuestra con métricas.

---

# 17. LIMITACIONES FREE A VIGILAR

La arquitectura se diseña para mantenerse cómodamente dentro del nivel gratuito.

No codificar lógica dependiente de un número comercial fijo.

En cada release importante revisar límites vigentes de:

- Workers requests/CPU;
- D1 lecturas/escrituras/almacenamiento;
- Durable Objects;
- WebSockets;
- R2 almacenamiento/operaciones;
- FCM;
- Web Push.

Si un límite cambia, se optimiza arquitectura antes de aceptar un costo.

---

# 18. REGLAS PARA NO REPETIR LA DEUDA DE LA APP ACTUAL

1. No crear archivos `fix2`, `patch-final`, etc.
2. No duplicar lógica Android/PWA.
3. No mezclar módulos sin relación.
4. No esconder problemas con refresh manual.
5. No hacer seguridad desde la UI.
6. No dejar archivos cargados que no existen.
7. No usar WebView para fingir nativo.
8. No crear una segunda API para resolver una inconsistencia de la primera.
9. No agregar validaciones arbitrarias a campos de información.
10. No experimentar en producción.
11. No abrir múltiples features complejas simultáneamente.
12. No refactorizar algo estable solo por estética.
13. No declarar terminado sin prueba física.
14. Toda infraestructura V2 debe ser reproducible desde código/configuración.
15. Todo cambio importante actualiza ESTE documento, no crea otro.

---

# 19. FLUJO DE TRABAJO EN CADA CHAT FUTURO

Al entrar a cualquier chat de HAVANA NICE V2:

1. leer `v2/docs/PLAN-MAESTRO.md`;
2. identificar ESTADO ACTUAL;
3. revisar rama/commit;
4. trabajar solo el paso actual;
5. ejecutar pruebas;
6. dejar commit identificable;
7. indicar al usuario prueba física exacta;
8. corregir si falla;
9. cuando el usuario confirme, marcar CERRADO;
10. actualizar directamente la sección ESTADO ACTUAL de ESTE archivo.

No crear:
- continuidad aparte;
- decisiones aparte;
- plan alternativo;
- “plan actualizado 2”.

---

# 20. ORDEN OFICIAL

```
0. FUNDACIÓN
1. CHAT TEXTO
2. CHAT ESTADOS / RECONEXIÓN
3. CHAT REPLY
4. CHAT REACCIONES
5. CHAT PRESENCE / TYPING
6. CHAT FOTOS
7. CHAT VIDEO
8. CHAT AUDIO
9. CHAT VIEWER
10. CHAT PUSH
11. CHAT PULIDO
12. ACCESO
13. HOME
14. CALENDARIO
15. REPERTORIO
16. NOTIFICACIONES
17. FAMILIA SI APLICA
18. AJUSTES
19. ADMIN V2
20. QA COMPLETO
21. MIGRACIÓN GRADUAL
```

Cada punto cierra Android + PWA antes de avanzar.

---

# 21. ESTADO ACTUAL

## Rama de trabajo
`havana-nice-v2-foundation`

## Control de versión
El estado vigente siempre es el HEAD de `havana-nice-v2-foundation`. No fijar este documento a su propio commit porque cada actualización del plan genera un commit nuevo.

## Ya hecho
- plan de desarrollo vertical;
- scaffold Android;
- scaffold PWA;
- manifest PWA;
- service worker inicial;
- paquete shared inicial;
- workflow de validación;
- producción actual aislada;
- decisión definitiva Cloudflare-first;
- decisión D1 + Durable Objects + R2;
- decisión API central Worker;
- decisión FCM Android + Web Push iPhone;
- decisión de acceso propio y simple;
- decisión de no reutilizar infraestructura de FAMILIA NOA;
- complemento oficial de Cloudflare instalado y autenticado;
- acceso directo confirmado a las cuentas Cloudflare autorizadas;
- lectura de Workers existentes confirmada sin modificar recursos;
- modo operativo “usuario pide → ChatGPT ejecuta todo → entrega lista” establecido como regla oficial;
- Worker Cloudflare creado: `havana-nice-v2-dev`;
- Worker deployment inicial: `ead5da47803447f4860514803c8d667d`;
- workers.dev habilitado: `https://havana-nice-v2-dev.soloaplicaciones97.workers.dev`;
- D1 creado: `havana-nice-v2-dev`;
- D1 UUID: `6a4abd3a-c01b-4d4f-b0ed-49f7eaca0cc5`;
- D1 foundation schema aplicado: `foundation-v1`;
- Durable Object creado: `ChatRoom`;
- Durable Object namespace: `9ad73b6bb654447ab5b4a3ba4fae9185`;
- Durable Object SQLite verificado mediante consulta directa exitosa;
- Worker observability/invocation logs habilitados;
- Android y PWA apuntan al mismo endpoint Cloudflare `/health`;
- R2 detectado como no activado en la cuenta; Cloudflare exige checkout inicial desde dashboard y se difiere hasta el módulo de media;
- dependencias bloqueadas en `v2/package-lock.json` (lockfile v3);
- CI reproducible usa `npm ci`;
- CI Fundación verde: run `40068871342`;
- CI verifica estructura, dependencias exactas, typecheck, build PWA, export Android, Worker/D1 vivo y Durable Object vivo;
- Cloudflare Pages V2 creado: `havana-nice-v2-dev`;
- Pages project ID: `737f5483-cd45-4711-bd97-d2b06fd94313`;
- URL PWA V2 reservada: `https://havana-nice-v2-dev.pages.dev`;
- Pages V2 usa rama `havana-nice-v2-foundation`, root `v2`, build `npm ci && npm run build:pwa`, output `apps/pwa/dist`;
- filtro de despliegue Pages corregido a `*` para que Cloudflare detecte commits del monorepo con root `v2`;
- workflow APK Android creado y validado;
- APK Android Fundación compilado: `HAVANA-NICE-V2-FOUNDATION.apk`;
- Android APK workflow run: `40068929315` — SUCCESS;
- Android APK artifact ID: `12550492280`;
- Android APK tamaño: `146037722` bytes (~140 MB, debug foundation);
- Android APK SHA-256: `5433f123b31bccf4ae1965fd94eff5a35b2e81834deea57b351e077bb4ba3041`;
- Cloudflare Pages deploy real: SUCCESS;
- Pages deployment con iconos: `68cae54f-d160-4dc1-a306-733ce171907e`;
- PWA estable: `https://havana-nice-v2-dev.pages.dev`;
- CI Fundación con validación PWA en vivo: run `40069278714` — SUCCESS;
- PWA incluye manifest standalone y assets de icono HAVANA NICE 192/512.
- Auditoría de continuidad 2026-10-24: rama, plan completo, APK descargado y SHA-256 del APK comprobados directamente.
- GitHub Actions V2 última validación verificada sobre commit `d9d6091d917612d9e1bc17331bf90c4bb81e08f0`: run `40069493140` — SUCCESS (incluye comprobaciones en vivo de API, Durable Object y PWA).
- Cloudflare Pages último deployment verificado sobre ese commit: `48f6457e-3b56-421d-aa00-14be4fb1d9b5` — SUCCESS.
- D1 consulta directa de lectura confirmó `system_meta.schema_version = foundation-v1`; sin escrituras sobre los datos.
- Primer APK laboratorio extraído del artifact de GitHub Actions y verificado: `146037722` bytes, SHA-256 `5433f123b31bccf4ae1965fd94eff5a35b2e81834deea57b351e077bb4ba3041`; pendiente confirmar instalación/arranque en Android real.
- Confirmación física pendiente en Android y en iPhone PWA; NO marcar FASE 0 como cerrada hasta que el usuario compruebe ambos.
- Prueba física Android 2026-10-24: la app V2 anterior (`assembleDebug`, run `40068929315`) se instaló, pero falló al iniciar con `Unable to load script / Metro`, porque el JS no estaba embebido para ejecución autónoma. Capturas de usuario documentan el bloqueo. NO reutilizar ese APK para instalación.
- Corrección aplicada exclusivamente al workflow `.github/workflows/v2-android-apk.yml` en commit `b5ed00b9ce21481786ecff5bd9c54b3f28a4ad88`: `assembleRelease` y comprobaciones de bundle `assets/index.android.bundle`, firma `apksigner`, paquete `com.havananice.v2`; GitHub run `40070809476` — SUCCESS, incluida subida de artifact `12551153324`.
- APK autónomo entregado para Android `HAVANA-NICE-V2-STANDALONE-ANDROID.apk`: 67,784,170 bytes; contiene `assets/index.android.bundle` (1,250,680 bytes); SHA-256 `51c8b5f6e222a07b168e9e6717999ed7dba5bffa6cc631f9a1b6326c813b0e88`. El usuario aún debe confirmar físicamente su arranque sin Metro. En caso de conflicto de firma durante actualización, desinstalar SOLO paquete V2, nunca producción.
- Entrega APK 2026-10-24: se detectó error `Library file not found` al abrir el primer vínculo generado por ChatGPT; se creó nueva copia APK directamente como archivo de conversación verificado con el SHA-256 ya registrado. GitHub Actions puede descargar el artifact original, pero la creación de GitHub Release pública con `GITHUB_TOKEN` devolvió HTTP 403; se retiró el workflow experimental. No se afectó Android, backend, main ni producción. Pendiente confirmar que el nuevo archivo sea descargable e instalable físicamente.


## En curso
FASE 0 — infraestructura, CI y PWA completados técnicamente. Prueba física Android inicial FALLIDA (APK debug solicita Metro). APK autónomo release V2 compilado y validado técnicamente, entregado para nueva prueba física Android; iPhone PWA aún pendiente. FASE 0 NO cerrada hasta confirmación de ambos clientes.

## Siguiente paso exacto
1. instalar/probar el NUEVO APK autónomo release de Fundación en un Android real, sin Metro, confirmar API/DB/realtime;
2. abrir e instalar la PWA V2 en Home Screen de un iPhone real;
3. confirmar en ambos clientes: API CONECTADA, D1 ok, schema foundation-v1 y Realtime configured;
4. si ambas pruebas físicas pasan, marcar FASE 0 CERRADA;
5. iniciar CHAT 1 — TEXTO BÁSICO Android ↔ iPhone PWA.

R2 se activa y crea antes de CHAT 6 — FOTOS, no antes.

## Primer módulo después de FASE 0
CHAT 1 — TEXTO BÁSICO Android ↔ iPhone PWA.

---

# 22. DECISIONES DEFINITIVAS

- Android: nativo.
- iPhone: PWA premium mientras costo objetivo sea 0 MXN.
- Backend V2: Cloudflare.
- API: Worker.
- Datos: D1.
- Realtime Chat: Durable Objects + WebSockets.
- Media: R2.
- R2 se activa solo cuando empiece media; su checkout inicial no bloquea Fundación ni Chat de texto.
- Android push: FCM.
- iPhone push: Web Push.
- Auth/permisos: sistema propio pequeño, server-side.
- GitHub: fuente de verdad del código.
- Un solo plan maestro.
- Desarrollo vertical Android + PWA.
- Producción actual: intocable.
- FAMILIA NOA: independiente.
- No depender de infraestructura de las apps actuales.
- Cloudflare oficial conectado a ChatGPT es la vía principal de administración de infraestructura.
- GitHub Actions queda como automatización reproducible de builds/deploys.
- El usuario no realiza trabajo técnico manual: pide el resultado y ChatGPT ejecuta el ciclo completo.
- Solo se pide intervención humana cuando una plataforma la exige obligatoriamente y no existe vía API/herramienta conectada.
- Siempre preferir entregar un resultado listo antes que instrucciones para que el usuario lo construya.
