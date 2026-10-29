# HAVANA NICE V2 — PLAN MAESTRO ÚNICO

**Actualizado el 29 de octubre de 2026.** Fuente única: `Abnernoa97/havana-nice-pwa`, rama `havana-nice-v2-foundation`. Documento técnico único de continuidad: [CONTINUIDAD-EXACTA.md](./CONTINUIDAD-EXACTA.md).

## Estado real de V2

**La conexión anterior de almacenamiento externo fue retirada de V2, SIN migración de laboratorio.**

- Código fuente de autenticación, adaptación multimedia, fragmentación de subidas y panel administrativo antiguos: **eliminados físicamente de la rama V2**.
- Worker de V2: **versión `db55ac36-137c-4bbc-bb21-de3d633287b3` desplegada al 100 %**, con D1, Durable Object, autenticación de Administrador y sin Service Binding externo, verificado por API Cloudflare.
- D1 V2: borradas **15 burbujas multimedia**, **19 registros de archivo**, **19 transferencias**, **una vinculación** y **cinco tablas del almacenamiento anterior**. Verificación posterior: **44 mensajes de texto permanecen**, cero tablas antiguas. Ninguna foto ni video fue trasladado a R2.
- PWA/Android: su fuente ya no utiliza el cargador anterior. Selectores/visor mantienen su interfaz; envíos de multimedia no disponibles hasta activar R2. **La publicación PWA y el QA de Android deben comprobarse antes de declarar ese frente terminado**.
- Los servicios y repositorios de aplicaciones independientes se preservan; no modificar sistemas ajenos para completar V2.
- **Cloudflare R2 Standard privado:** pendiente de alta gratuita del propietario y de integración técnica. No existe bucket ni subida activa. Diseñar desde cero y sin usar sistemas intermedios.

## Reglas de desarrollo

1. Una sola rama y un solo Worker, base D1, Durable Object y API para Chat, Android y Administrador.
2. Chat Android **100 % nativo**; PWA solo es presentación visual de los futuros módulos. Administrador PWA comparte el mismo backend y los mismos mensajes.
3. Nunca crear variantes paralelas, parches escondidos ni código dejado «apartado»: reemplazar o borrar lo descartado.
4. No tocar lo que ya funciona: mensajes de texto, identidad única por músico, sesiones, aviso de acceso duplicado, Administrador, conversaciones, menú, borradores, navegación y firma de Android.
5. Android usa el paquete `com.havananice.v2`; actualizaciones encima de la APK existente, con firma estable y versión creciente, nunca desinstalar ni perder caché.
6. Confirmar con CI y pruebas reales antes de tachar hitos. **12/27 permanecen cerrados, 15 abiertos.**

## Tablero MAESTRO — 27 hitos

### Fundación y Chat: 9 cerrados

- [x] **B01** — Fundación V2 aislada con su repositorio/Worker/D1/DO/clientes.
- [x] **B02** — Chat básico de texto Android ↔ PWA.
- [x] **B03** — Nombre autorizado y sesión persistente.
- [x] **B04** — Auditoría preventiva, estabilidad y CI.
- [x] **C01** — Menú contextual, reacción y acciones.
- [x] **C02** — Edición y eliminación canónica de mensajes.
- [x] **C03** — Responder deslizando.
- [x] **C04** — Offline, borradores y reconexión.
- [x] **C05** — Sincronización bidireccional del Chat.

### Android y seguridad: 3 cerrados, 3 abiertos

- [x] **H01** — Android nativo con firma e instalación sin desinstalar.
- [ ] **H02** — Módulos no-Chat con PWA visual en Android.
- [ ] **H03** — Navegación, sesión y persistencia intermodular.
- [ ] **H04** — Actualización PWA visual sin reinstalar Android.
- [x] **S01** — Altas y bajas de músicos desde Administrador.
- [x] **S02** — Una instalación por nombre y alerta ante duplicado.

### Multimedia: 5 abiertos

- [ ] **M01** — Fotos originales privadas, desde cero con R2, Chat/Administrador.
- [ ] **M02** — Videos originales privados, desde cero con R2, Chat/Administrador.
- [ ] **M03** — Audios; aplazados, micrófono informativo.
- [ ] **M04** — Visor completo; conservar aspecto de fotos aprobado y verificar videos dentro de Android, caché y pantalla completa con el nuevo backend.
- [ ] **M05** — Push con la app cerrada, no confundir con WebSocket.

### Módulos y QA: 7 abiertos

- [ ] **P01** — Home y configuración.
- [ ] **P02** — Calendario con eventos/horarios/vestuario.
- [ ] **P03** — Repertorio general y por evento.
- [ ] **P04** — Administrador completo; Acceso a músicos y Chat general ya funcionan.
- [ ] **P05** — Avisos y perfiles.
- [ ] **Q01** — QA integral Android/PWA/Admin/red/reintentos/caché.
- [ ] **Q02** — Paso a producción solo con autorización expresa.

**Resultado: 12/27 (44,4 %).** No cerrar M01/M02/M04 antes de integrar R2 y probarlos realmente.

## Siguiente paso real

1. Confirmar CI completo sobre el HEAD limpio, publicación de Pages y continuidad del Chat/Administrador.
2. El propietario activa R2 Standard con las condiciones del nivel gratuito en su cuenta Cloudflare.
3. Crear bucket privado R2 de V2, sin puente ni archivos antiguos, con autenticación de Worker, subida directa rápida, multipart reanudable para grandes videos, confirmación de integridad, permisos, descarga Range y borrado seguro.
4. Implementar y probar conjuntamente Android nativo, PWA y Administrador, sin romper los módulos cerrados.

**Prohibido reintroducir el almacenamiento anterior o realizar una migración de datos de laboratorio.**
