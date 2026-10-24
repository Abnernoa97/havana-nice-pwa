# Supabase migrations — HAVANA NICE V2

Toda modificación del backend V2 deberá quedar versionada aquí.

Reglas:
1. No experimentar contra producción.
2. No crear tablas/RPC/triggers definitivos únicamente desde Studio.
3. Una migración debe poder reproducir el backend desde cero.
4. Ejecutar advisors después de DDL.
5. RLS obligatorio para tablas expuestas.
6. Nunca exponer service_role/secret keys en Android o PWA.
7. Los RPC admin deben tener autorización explícita.

Estado: todavía no existe ninguna migración V2.
