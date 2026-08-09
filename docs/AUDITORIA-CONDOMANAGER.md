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

**NO cubierto todavía — no asumir que está limpio:** lógica de negocio
completa de `lib/pagos/*` y `lib/facturacion/service.ts`, las páginas del
dashboard (`app/(dashboard)/**`) más allá de lo que aparece por grep,
políticas RLS en la base (no se consultó `pg_policies` directamente, solo
se infiere de los comentarios en código), los crons
(`cron/limpiar-no-confirmados`, `cron/procesar-activaciones-masivas`), y
`lib/domuscrm-sync.ts`.

Leyenda de estado: ⬜ pendiente · 🔧 en análisis (9 puntos presentados, sin
código tocado) · ✅ corregido y verificado · ❌ descartado (no era un
problema real, con motivo).

---

## 🟠 IMPORTANTE

### 🟠-1 — ⬜ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única

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

---

### 🟠-2 — ⬜ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía"

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

---

## 🔵 MENOR

### 🔵-1 — ⬜ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo

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

Presentado el análisis de 9 puntos para 🟠-1 y 🟠-2 — **pendiente
decisión de Gina sobre si proceder con el fix ahora** (ambos son de bajo
riesgo de regresión, pero 🟠-1 toca 13 archivos) o seguir ampliando la
auditoría primero (pagos/facturación, RLS, crons — todavía no cubiertos).
🔵-1 es limpieza, se puede hacer en cualquier momento sin discusión.
