# Auditoría — CondoManager como aplicación (más allá del portero)

**Abierta:** 09-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo de
esta lista se corrige sin presentar antes el análisis de 9 puntos (síntoma,
causa inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Por qué existe este doc separado de [AUDITORIA-PORTERO-SSO.md](./AUDITORIA-PORTERO-SSO.md):**
ese documento audita la federación de identidad (SSO) entre productos.
09-ago-2026, Gina pidió explícitamente ampliar el alcance: *"necesito
auditar condomanager como tal ya no solo el portero"* — la preocupación es
deuda acumulada en el producto mismo, no solo en el punto de entrada.

**Estado de esta auditoría:** ABIERTA — primera pasada, no exhaustiva.

**Alcance cubierto en esta primera pasada:** las 35 rutas de
`app/api/**/route.ts`, `middleware.ts`, `lib/auth/post-login.ts`,
`lib/modulos/entitlement.ts`, `lib/crypto.ts`, `app/api/webhooks/*`,
búsqueda de patrones de riesgo (hardcode, bypass, fallback peligroso,
secretos embebidos) en todo `*.ts`/`*.tsx`.

**09-ago-2026, segunda pasada acotada a propósito:** Gina pidió
específicamente *"cómo interactúa el portero con esto: pagos/facturación,
RLS, crons — solo hasta ahí la auditoría"* antes de pasar a validación
manual. No es una auditoría completa de esos 3 subsistemas — es
específicamente el punto de contacto entre la sesión post-portero
(`auth.getUser()`, `perfiles.user_id`, RLS) y cada uno. Cubierto: RLS real
de `perfiles`/`residentes` vía `pg_policies` (antes solo se infería del
código), GRANTs reales de las tablas creadas hoy vía `pg_class.relacl`
(antes no se habían mirado), los 2 crons completos, y el patrón de
autenticación de `pagos/iniciar`, `pagos/confirmar`, `pagos/consultar`.

**NO cubierto todavía — no asumir que está limpio:** lógica de negocio
completa (montos, cálculos, reglas de facturación en sí) de `lib/pagos/*`
y `lib/facturacion/service.ts`, las páginas del dashboard
(`app/(dashboard)/**`) más allá de lo que aparece por grep, RLS de tablas
fuera de `perfiles`/`residentes`, y `lib/domuscrm-sync.ts`.

Leyenda de estado: ⬜ pendiente · 🔧 en análisis (9 puntos presentados, sin
código tocado) · ✅ corregido y verificado · ❌ descartado (no era un
problema real, con motivo).

---

## 🔴 CRÍTICO

### 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026

**1. Síntoma:** encontrado auditando "¿cómo interactúa el portero con RLS?".
Al verificar en vivo (no inferir del código) si `service_role` podía leer
`registros_pendientes` — la tabla de la que depende `reconciliar-perfil`
(el paso post-portero que crea el `perfil` del admin) — Postgres devolvía
`permission denied for table registros_pendientes`.

**2. Causa inmediata:** la tabla no tenía NINGÚN grant — ni siquiera para
`service_role` — y RLS estaba deshabilitado. `pg_class.relacl` mostraba
`null` (sin ACL) contra el `condominios=arwdDxtm/postgres,anon=...,
authenticated=...,service_role=...` que sí tiene cada tabla normal del
schema.

**3. Causa raíz, confirmada con SQL:** `select * from pg_default_acl where
defaclnamespace='public'::regnamespace` devuelve vacío — este proyecto NO
tiene `ALTER DEFAULT PRIVILEGES` configurado en `public`. Cada tabla nueva
necesita su propio `GRANT` explícito en su propia migración; si la
migración no lo incluye, la tabla queda invisible incluso para
`service_role` (que bypasea RLS pero sigue necesitando el GRANT — son dos
mecanismos independientes). Las migraciones de hoy
(`20260809160000_registros_pendientes.sql`,
`20260809140000_activacion_residentes.sql`) no lo incluyeron — yo no lo
incluí. Mismo patrón exacto en las dos, por la misma razón: no sabía que
este proyecto no tiene default privileges.

**4. Componente responsable:** cualquier migración que cree una tabla
nueva en este proyecto — debe incluir su propio `GRANT`.

**5. Código/impacto afectado — esto es lo grave:** con
`registros_pendientes` inaccesible, **todo alta de `admin_condominio`
desde que se aplicó esa migración fallaba** en el paso 2.1 de
`app/api/registro-admin/route.ts` (el insert a `registros_pendientes`),
disparando el rollback completo (borra el condominio y el usuario de
identity) y devolviendo 500. Registro de admin estuvo roto en producción
todo ese tiempo. Con `campanas_masivas` en el mismo estado,
`app/api/admin/activar-residentes-masivo/route.ts` también estaba roto —
la función construida hoy mismo para el caso de uso real de Punta Blanca.

**6. Fix aplicado:**

```sql
GRANT ALL ON public.registros_pendientes TO anon, authenticated, service_role;
GRANT ALL ON public.campanas_masivas TO anon, authenticated, service_role;
ALTER TABLE public.registros_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_masivas ENABLE ROW LEVEL SECURITY;
```

Sin policies para `anon`/`authenticated` a propósito — mismo patrón que el
resto del schema (grant + RLS), y ambas tablas solo las toca código
server-side con `supabaseAdmin`.

**7. Código que debe eliminarse:** ninguno.

**8. Riesgo de regresión:** ninguno — la tabla estaba completamente
inutilizable antes; el fix solo la habilita.

**9. Validación — hecha en vivo, no solo aplicada:**

- `set local role service_role; select count(*) from registros_pendientes;`
  → antes: `permission denied`. Después: `0` (sin error).
- Insert real transaccional como `service_role` (con `rollback` al final,
  sin dejar datos): confirmado que ahora puede escribir.
- Insert como `anon`: `42501 row-level security policy` — confirma que
  quedó bloqueado por RLS (no por falta de grant, que sería un error
  distinto) — el diseño "grant + RLS deniega" funciona como se esperaba.
- Mismas 3 pruebas repetidas para `campanas_masivas` — mismo resultado.
- `get_advisors(security)` después del fix: ambas tablas aparecen como
  "RLS enabled, no policies" (INFO, no error) — es el estado esperado, no
  un hallazgo nuevo.

**No se necesitó reparar datos** — el rollback de `registro-admin` ya
hacía su trabajo (borraba el condominio y el usuario de identity en cada
intento fallido), así que no quedó ningún condominio a medio crear.

---

## Resto de la pasada "portero × pagos/facturación/RLS/crons"

**RLS de `perfiles`/`residentes` — verificado en vivo, CORRECTO, sin
hallazgo.** `perfiles_select`/`perfiles_write`/`residentes_select`/
`residentes_write` usan `user_id = auth.uid()` y las funciones
`current_rol()`/`current_condominio_id()`/`current_residente_id()`/
`is_superadmin()` — exactamente el modelo post-🔴-1: `auth.uid()` es el id
LOCAL federado de este proyecto, que es lo que `perfiles.user_id` guarda.
No es una inferencia del código — se leyó `pg_policies` directo.

**Crons × portero:**

- `procesar-activaciones-masivas` — CORRECTO. Crea las cuentas de
  activación con `supabaseAdminIdentity` (identity), no con el proyecto de
  producto — mismo patrón que `registro-admin`.
- `limpiar-no-confirmados` — confirma el pendiente que ya estaba anotado
  en `AUDITORIA-PORTERO-SSO.md`: usa `supabaseAdmin.auth.admin.listUsers()`
  del proyecto de PRODUCTO. Desde 🔴-1, las cuentas nuevas sin confirmar
  (admin o residente) se crean en IDENTITY — este cron nunca las va a
  encontrar. Su propósito declarado ("defensa contra basura de bots") es
  hoy un no-op para toda cuenta nueva; solo seguiría limpiando las 2
  cuentas reales pre-🔴-1. Efecto colateral no evaluado a fondo: un email
  que un bot usó para un registro nunca confirmado queda ocupado en
  identity para siempre (nadie lo libera), lo que podría bloquear
  permanentemente a la persona real dueña de ese correo si intenta
  registrarse. Queda igual que estaba: bajo impacto, sin 9 puntos
  completos todavía — se prioriza según lo que Gina decida.

**Pagos/facturación × portero:** mecanismo CORRECTO (`auth.getUser()` →
`perfiles.select(rol)`, igual que el resto) en `pagos/iniciar` y
`pagos/consultar/[id]`. `pagos/confirmar` es el webhook de PayPhone —
correctamente NO usa sesión de usuario, reconfirma contra PayPhone como
fuente de verdad. Hallazgo menor: `pagos/iniciar` y `pagos/consultar/[id]`
son 2 copias más del mismo patrón que 🟠-1 ya centralizó en
`lib/auth/requireRole.ts` — no migradas todavía (quedaron fuera del
barrido original porque ese barrido fue sobre `app/api/**` completo pero
priorizó los 13 casos con gate estricto de rol; estos dos también
califican). Fast-follow de bajo riesgo, no urgente.

**Menor, pre-existente, no de hoy:** `get_advisors` marca que
`current_rol()`, `current_condominio_id()`, `current_residente_id()`,
`is_modulo_activo()` e `is_superadmin()` son `SECURITY DEFINER` y
ejecutables vía RPC por `anon` (no solo `authenticated`). No es un bug
introducido hoy y no se investigó si es explotable (probablemente no:
`auth.uid()` es `NULL` sin sesión, así que devolverían "sin rol"/`false`)
— queda anotado para cuando se audite RLS a fondo, no ahora.

---

## 🟠 IMPORTANTE

### 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026

**1. Síntoma:** el mismo bloque — `auth.getUser()` → `perfiles.select("rol,
condominio_id").eq("user_id", user.id)` → comparar `rol` contra una lista
de valores permitidos → 401/403 si no calza — aparece copiado, casi letra
por letra, en al menos 13 archivos.

**2. Causa inmediata:** cada ruta nueva que necesitó "solo admin" o "solo
superadmin" escribió su propio chequeo en vez de importar uno existente.

**3. Causa raíz:** nunca se creó un `lib/auth/requireRole.ts` (o similar)
como fuente única. En 4 archivos incluso se llegó a nombrar la función
igual (`requireSuperadmin`) — evidencia de que el patrón se reconoció como
repetible, pero se resolvió copiando el archivo, no extrayendo un módulo.

**4. Componente responsable:** debería existir un único helper server-side
en `lib/auth/`, usado por toda ruta que necesite autorización por rol —
exactamente el principio que `ESTANDAR-DESARROLLO.md` nombra explícito:
*"Ya existe un servicio central para algo... usarlo. No implementar una
versión local paralela"* y *"debe existir una única autoridad. Si dos
componentes deciden distinto sobre el mismo concepto, eso es un hallazgo
arquitectónico."*

**5. Código afectado (13 sitios, mínimo):**
- `app/api/superadmin/admin-condominio/route.ts` — función nombrada `requireSuperadmin()`
- `app/api/superadmin/suscripcion-condominio/route.ts` — misma función, copiada
- `app/api/superadmin/notificaciones/enviar/route.ts` — misma función, copiada
- `app/api/superadmin/notificaciones/destinatarios/route.ts` — misma función, copiada
- `app/api/superadmin/firma/route.ts` — inline, ×2 (POST y DELETE)
- `app/api/reservas/aprobar/route.ts` — inline
- `app/api/reservas/cancelar/route.ts` — inline
- `app/api/reservas/rechazar/route.ts` — inline
- `app/api/reservas/mantenimiento/route.ts` — inline
- `app/api/reservas/disponibilidad/route.ts` — inline
- `app/api/residentes/aprobar/route.ts` — inline
- `app/api/residentes/rechazar/route.ts` — inline
- `app/api/admin/activar-residentes-masivo/route.ts` — inline

**6. Fix propuesto:** crear `lib/auth/requireRole.ts` con una función
`requireRole(rolesPermitidos: string[], opciones?: { scopeCondominio?: boolean })`
que centralice: obtener usuario, obtener perfil, comparar rol, y
(cuando aplica) devolver `condominio_id` para el scoping por condominio que
ya hacen `aprobar`/`rechazar`/`reservas` — ese scoping SÍ debe quedarse en
cada ruta (es lógica de negocio propia de cada endpoint), solo el chequeo
de identidad+rol se centraliza.

**7. Código que debe eliminarse:** las 4 copias literales de
`requireSuperadmin()` y los ~9 bloques inline equivalentes, reemplazados
por la importación del helper único.

**8. Riesgo de regresión:** bajo si se hace ruta por ruta con el mismo
contrato de retorno (401 sin sesión, 403 sin el rol), verificando cada
endpoint después del cambio. El riesgo real está en tocar 13 archivos en
una sola pasada sin probar cada uno — mejor en tandas chicas.

**9. Validación:** para cada ruta migrada, probar con 3 sesiones (sin
sesión, con sesión pero rol insuficiente, con sesión y rol correcto) y
confirmar que el código de estado no cambió respecto al comportamiento
anterior.

**No es un hallazgo de datos comprometidos** — cada copia, revisada
individualmente, chequea correctamente. El riesgo es a futuro: la próxima
vez que se corrija esta regla (ej. agregar un chequeo de suscripción activa
al gate), hay que acordarse de tocar 13 archivos, y basta con olvidar uno
para que quede una ruta con una regla de autorización distinta al resto —
exactamente el patrón que causó la cadena de 7 parches de IOT.

**Resuelto 09-ago-2026** (`condomanager@f60960d`): `lib/auth/requireRole.ts`
— `getPerfilAutenticado()`, `getPerfilOpcional()`, `requireRole(roles,
{mensajeError?})`. 11 rutas migradas a `requireRole()` (las 13 originales
menos `reservas/cancelar`, que no tiene un solo rol permitido — admin O
residente dueño — y usa `getPerfilAutenticado()` directo; y menos
`reservas/disponibilidad`, dejada sin tocar a propósito porque su chequeo
de perfil es opcional, no el mismo patrón de gate). Mensajes 403
específicos de cada ruta preservados vía `mensajeError`; los 401
(3 variantes del mismo significado, sin razón funcional) se normalizaron a
uno solo. El tipado nuevo (`condominio_id: string | null` en vez de `any`
implícito) sacó a la luz que `reservas/aprobar`, `rechazar` y
`mantenimiento` pasaban `perfil.condominio_id` a `moduloActivo()` sin
verificar que no fuera null dentro del bloque `admin_condominio` — se
agregó un guard explícito fail-closed en los 3 como parte de este mismo
fix. `tsc --noEmit` y `eslint` limpios.

---

### 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026

**1. Síntoma:** si la consulta a `perfiles` en `lib/auth/post-login.ts`
falla (error de red, timeout, etc.), el usuario es enviado a `/panel` sin
que se aplique el chequeo de residente `PENDIENTE`/`RECHAZADO`.

**2. Causa inmediata:**
[lib/auth/post-login.ts:43-45](../../condomanager/lib/auth/post-login.ts):
```ts
if (perfilesError || !perfiles || perfiles.length === 0) {
  return { ok: true, destino: "/panel" };
}
```
`perfilesError` (fallo real de la consulta) y `perfiles.length === 0`
(usuario legítimamente nuevo, sin perfiles) devuelven exactamente la misma
respuesta.

**3. Causa raíz:** el tipo de retorno (`PostLoginResultado`) solo tiene
`ok: true` / `ok: false` con un mensaje de negocio — no hay forma de
distinguir "no configurado todavía" (vacío, válido) de "no pude
verificarlo" (error, inválido). Es el mismo patrón que
`ESTANDAR-DESARROLLO.md` nombra explícito bajo "Fallback peligroso": *"Un
sistema debe distinguir 'no configurado' de 'configurado y válido' —
nunca convertir lo primero en lo segundo para evitar que falle
visiblemente."*

**4. Componente responsable:** `resolverPostLogin` mismo — es quien decide
el destino post-login.

**5. Código afectado:** `lib/auth/post-login.ts`, líneas 29-45. Consumido
por `app/auth/callback/page.tsx`.

**6. Fix propuesto:** separar el caso de error del caso vacío —
`if (perfilesError) return { ok: false, error: "No se pudo verificar tu cuenta. Intenta de nuevo." }`
y dejar `if (!perfiles || perfiles.length === 0) return { ok: true, destino: "/panel" }`
como el único camino permisivo real.

**7. Código que debe eliminarse:** ninguno — es una separación de un
`if` compuesto en dos, no una reescritura.

**8. Riesgo de regresión:** mínimo. El único cambio de comportamiento es
que un error de base de datos ahora bloquea con un mensaje en vez de dejar
pasar — es un endurecimiento, no una restricción nueva sobre casos que
antes funcionaban bien.

**9. Validación:** simular `perfilesError` (mock o desconectar
momentáneamente) y confirmar que ya no lleva a `/panel` sino al mensaje de
error.

**Nota de severidad:** esto NO es una fuga de datos — RLS sigue siendo la
barrera real sobre qué puede leer cada usuario en `/panel`; lo que se
salta es el mensaje de negocio ("tu solicitud está pendiente"). Por eso es
🟠 y no 🔴: el peor caso es una mala experiencia (alguien con acceso
pendiente ve una pantalla confusa en vez del mensaje claro), no acceso
indebido a datos de otro condominio.

**Resuelto 09-ago-2026** (`condomanager@e4a7051`): el `if` compuesto se
separó en dos, exactamente como se propuso en el punto 6 — `perfilesError`
ahora devuelve `{ ok: false, error: "No se pudo verificar tu cuenta.
Intenta de nuevo." }` en vez de `{ ok: true, destino: "/panel" }`.
`app/auth/callback/page.tsx` ya manejaba `ok: false` de forma genérica
(`setMensaje(resultado.error)`), sin acoplarse al texto — no hubo que
tocarlo. `tsc --noEmit` y `eslint` limpios. **Validación real (punto 9,
simular el error de red) todavía no hecha** — el cambio es mínimo y de
bajo riesgo, pero no se ha probado en vivo.

---

## 🔵 MENOR

### 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026

**Síntoma:** `scratch/dist/lib/crypto.js`, `scratch/dist/lib/facturacion/service.js`
y `scratch/dist/scratch/test_invoicing_flow.js` están trackeados en git —
es la salida compilada de `scratch/test_invoicing_flow.ts`, un script de
prueba manual.

**Causa raíz:** falta un `.gitignore` para `scratch/dist/` (o para todo
`scratch/`, si esa carpeta es exclusivamente de pruebas locales
desechables).

**Fix propuesto:** `git rm -r --cached scratch/dist` + entrada en
`.gitignore`. Si `scratch/test_invoicing_flow.ts` y `scratch/run-qa-suite.js`
siguen siendo útiles como script de QA manual, pueden quedarse trackeados
(son fuente, no build output) — a decidir con Gina.

**Resuelto 09-ago-2026** (`condomanager@5aaa1c7`): `git rm -r --cached
scratch/dist` + entrada en `.gitignore`. El fuente (`test_invoicing_flow.ts`,
`run-qa-suite.js`) se quedó trackeado.

**Riesgo:** ninguno funcional. Es exactamente el tipo de "basura que se va
quedando" que motivó esta auditoría — no cambia el comportamiento de la
app, pero ensucia el repo y el historial.

---

## Hallazgos ya cubiertos en AUDITORIA-PORTERO-SSO.md (no repetidos acá)

Para no duplicar: `residentes.rol_pendiente` vs `registros_pendientes`
(🔴-9), la duplicación de `MENSAJES_HASH` entre auth-sorsabsa y
condomanager (🔵-4), y todo lo de autenticación/federación SSO viven en
[AUDITORIA-PORTERO-SSO.md](./AUDITORIA-PORTERO-SSO.md).

## Próximo paso

**Auditoría automatizable cerrada por ahora, a propósito** (09-ago-2026,
a pedido explícito de Gina: acotar a "cómo interactúa el portero con
pagos/facturación/RLS/crons" y de ahí pasar a validación manual). Estado:

- 🔴-3 corregido y verificado en vivo (`condomanager@1ebebc3`) — era el
  hallazgo más serio: `registro-admin` y `activar-residentes-masivo`
  estaban rotos en producción.
- 🟠-1 corregido (`@f60960d`), 🟠-2 corregido (`@e4a7051`), 🔵-1 corregido
  (`@5aaa1c7`) — typecheck + eslint limpios en los tres.
- RLS de `perfiles`/`residentes` verificada en vivo: correcta, sin
  hallazgo.
- Crons: `procesar-activaciones-masivas` correcto; `limpiar-no-confirmados`
  confirma el pendiente ya conocido (bajo impacto).
- Pagos/facturación: mecanismo de auth correcto; 2 archivos más
  (`pagos/iniciar`, `pagos/consultar/[id]`) quedaron fuera del barrido de
  🟠-1, fast-follow de bajo riesgo.

**Ninguno de 🔴-3/🟠-1/🟠-2 tiene todavía la validación en vivo con
sesión real de usuario** (🔴-3 sí se validó a nivel de base de datos —
grants y RLS con `set local role` — pero no se probó el flujo completo
`registro-admin` → confirmar correo → login → `reconciliar-perfil` de
punta a punta después del fix). Esa ronda de validación manual, agrupada,
es el siguiente paso — no antes.
