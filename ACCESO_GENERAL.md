# HAVANA NICE PWA — ACCESO GENERAL

Fecha: 2026-09-14

## Punto de partida oficial

Este documento establece **ACCESO GENERAL** como el último punto de partida oficial del proyecto HAVANA NICE PWA.

Repositorio: `Abnernoa97/havana-nice-pwa`
Rama oficial: `main`

## Estado real comprobado

La aplicación se encuentra en un estado funcional comprobado para el flujo de fondo global y conserva la base funcional de ACCESO 8.

### Fondo global de la aplicación

- Administrador dispone de la sección **FONDO DE LA APP** dentro de Resumen.
- **CAMBIAR VIDEO** permite seleccionar y subir un MP4/WEBM al bucket `musician-backgrounds`.
- El fondo se guarda en la configuración singleton `public.app_background_config` con `id=1`.
- El fondo es global para todos los músicos; ya no depende de filas individuales por músico para la activación.
- **RESTAURAR DEFAULT** vuelve a `storage_path = null`, dejando como fallback el video incluido en GitHub.
- El video predeterminado actual es `Video.Guru_20260908-142707130.mp4`.
- Los archivos globales anteriores se limpian al activar/restaurar.
- La configuración está conectada a Supabase Realtime.
- Se comprobó físicamente que al cambiar el fondo desde Administrador, el fondo aparece en la aplicación de músico sin recargar.
- Se comprobó físicamente que RESTAURAR DEFAULT también se refleja en la aplicación de músico sin recargar.

### Supabase

- Proyecto: `xzfradccsxonmauinecl`.
- Tabla global: `public.app_background_config`.
- La tabla está habilitada para Realtime.
- Se aplicaron permisos de lectura para `anon` y `authenticated`.
- Se aplicaron permisos de escritura para `authenticated`.
- Política de lectura activa permite a `anon`/`authenticated` leer la configuración cuando `active=true`.
- Bucket utilizado: `musician-backgrounds`, público.

### Código verificado en GitHub

- `musician-background-v1.js`: V2, escucha `app_background_config` mediante Realtime y utiliza el video GitHub como fallback.
- `operations-fix.js`: crea `window.hnMusicianSupabase` a partir del cliente/configuración existente de la aplicación y carga el listener global de fondo.
- `admin-background-v1.js`: V2, administra el fondo global mediante `app_background_config` y Storage.

## Base conservada de ACCESO 8

Se conserva la arquitectura y funcionalidad previamente auditada de ACCESO 8:

- Separación Administrador / Músicos.
- Acceso de músicos mediante nombre/flujo existente.
- Autenticación existente.
- Session memory existente.
- Calendario.
- Calendario en tiempo real.
- Repertorio en tiempo real.
- Repertorio visual limitado a ENGLISH / ESPAÑOL.
- Chat en tiempo real.
- Notificaciones.
- Push notifications.
- Admin Summary.
- Storage.
- Service workers.
- Funciones Show Day existentes.

## Repertorio

- Interfaz de músico: ENGLISH y ESPAÑOL.
- Interfaz de administrador: ENGLISH y ESPAÑOL.
- Canciones, edición, orden, disponibilidad y Realtime se conservan.
- Las categorías antiguas de la base de datos no fueron migradas; la normalización es de interfaz.

## Alcance de este acceso

ACCESO GENERAL sustituye a ACCESO 8 como referencia de trabajo.

A partir de este punto:

1. No mezclar estados anteriores con este baseline.
2. No modificar módulos congelados sin instrucción explícita.
3. Cualquier cambio futuro debe partir del estado real de `main` en este acceso.
4. Las pruebas de fondo global realizadas confirman el flujo Administrador → Músicos y Restaurar Default → Músicos.
5. La prueba de fondo no implica que se haya realizado una prueba física simultánea con 6–7 dispositivos; esa prueba de concurrencia sigue siendo una validación separada si se desea antes del lanzamiento.

## Nota de auditoría

ACCESO GENERAL registra lo que está implementado y lo que fue comprobado en esta sesión. No se deben declarar como físicamente probadas funciones que no hayan sido probadas en dispositivos reales.
