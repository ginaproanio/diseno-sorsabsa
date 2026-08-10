# Auditoría — JustiRed (legaltech)

**Abierta:** 10-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo se
corrige sin presentar antes el análisis de 9 puntos (síntoma, causa
inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Por qué existe:** mismo pedido que abrió las auditorías de CondoManager,
DomusCRM y agente24siete — Gina: *"vamos ahora auditoria a justired como lo
hemos hecho con domus, condomanager, agente24siete."*

**Alcance:** `legaltech` completo — portero/sesión (`hooks/useAuth.ts`,
`pages/AuthCallback.tsx`, `components/Navbar.tsx`), y todo lo que ese
portero gatea (`pages/Calidad.tsx`, el único panel privado real del
repo). Comparado contra el patrón ya estabilizado en CondoManager,
DomusCRM y agente24siete, y contra `AUDITORIA-PORTERO-SSO.md` 🔴-11 (que
ya cubría el gate de sesión de JustiRed — no se duplica acá, se
referencia).

**Diferencia de arquitectura, confirmada, no un defecto:** JustiRed es una
SPA pura (Vite + React Router, sin servidor propio) — no puede tener
`middleware.ts`, y no lo necesita: no tiene un panel privado con rutas
protegidas del estilo `/admin/*`. Su gate de sesión (`supabase.auth
.getSession()`/`setSession()`, con auto-refresh) es el patrón correcto
para esta arquitectura, ya confirmado en `AUDITORIA-PORTERO-SSO.md`
🔴-11 — no se re-audita acá.

---

## 🔴 CRÍTICO

### 🔴-1 — ⬜ El panel de Control de Calidad no hace nada: RLS bloquea la tabla para cualquier usuario, la UI lo esconde con un "éxito" falso

**1. Síntoma:** `/calidad` (`pages/Calidad.tsx`) es un panel real —
aprobar/rechazar documentos legales antes de publicarlos en la biblioteca
— gateado con `if (!user) { "Inicia sesión" }`. Cualquier cuenta logueada
ve la lista de pendientes y puede tocar "Aprobar"/"Rechazar". **En los
hechos, ni la lectura ni la escritura llegan a la base:** un reviewer
real vería siempre "No hay documentos pendientes" (aunque los haya), y un
clic en "Aprobar" hace desaparecer la fila de la pantalla sin cambiar
nada en la base.

**2. Causa inmediata:** `Calidad.tsx` consulta y actualiza
`documentos_pendientes_revision` directo con el cliente del navegador
(`supabase.from(...)`, la llave pública/anon) — nunca a través de una
función de servidor.

**3. Causa raíz, verificada con datos, no supuesta:**

- `pg_class`: `documentos_pendientes_revision` tiene
  `relrowsecurity = true` (RLS activado).
- `pg_policies`: **cero políticas** para esa tabla. Con RLS activado y
  sin ninguna política, Postgres deniega por defecto a cualquier rol que
  no sea el dueño — exactamente el comportamiento correcto de RLS
  ("falla-cerrado"), pero acá no fue una decisión, fue que nunca se
  escribió la política.
- La migración original (`00000000000000_baseline_schema.sql:305`) lo
  confirma explícito: `GRANT ALL ON TABLE
  "justired"."documentos_pendientes_revision" TO "service_role";` — el
  diseño original de la tabla YA asumía acceso solo por `service_role`
  (backend), nunca por el cliente. `Calidad.tsx` se construyó después,
  del lado del cliente, sin ese contrato en cuenta.
- **Por qué se ve "como que funciona" en vez de tirar un error visible:**
  con RLS bloqueando sin política, un `SELECT` no da error — simplemente
  devuelve cero filas (como si no hubiera nada pendiente). Un `UPDATE`
  tampoco da error — afecta cero filas, y `Calidad.tsx` solo mira
  `if (!error)` para decidir si sacar la fila de la lista local
  (`setPendientes(prev => prev.filter(...))`) — nunca verifica cuántas
  filas cambiaron de verdad. El resultado es un "éxito" completamente
  falso: la interfaz confirma una acción que la base nunca ejecutó.
- **Contraejemplo real, en el mismo repo, que muestra el patrón
  correcto:** `NotificationBell.tsx`/`useNotifications` no toca ninguna
  tabla directo — llama a funciones de servidor
  (`justired-notifications-listar`, `-marcar-leida`,
  `-marcar-todas-leidas`, ya desplegadas en `supabase/functions/`), que sí
  corren con `service_role`. Ese es el patrón que `Calidad.tsx` debería
  haber seguido desde el principio.

**4. Componente responsable:** `pages/Calidad.tsx` (arquitectura de
acceso equivocada) — no la tabla ni la política, que están correctamente
cerradas por diseño.

**5. Código afectado:** `src/pages/Calidad.tsx` completo (lectura y las
dos escrituras).

**6. Fix propuesto (NO ejecutado, requiere decisión de Gina — no es solo
"agregar una política"):**

1. **Decisión de negocio primero:** ¿quién debe poder aprobar/rechazar
   documentos? Hoy el único gate es "cualquier cuenta logueada" — ni
   siquiera con políticas RLS correctas alcanza, si la intención real es
   "solo el equipo de SORSABSA", no "cualquiera con cuenta en JustiRed"
   (que incluye abogados y clientes reales de la biblioteca pública).
   Esto es exactamente el punto 9 del estándar ("¿estoy hardcodeando/
   asumiendo autorización sin una fuente real?") — no proponer una
   política sin esa respuesta.
2. Con esa decisión tomada: una función de servidor (Edge Function, mismo
   patrón que `justired-notifications-*`) con `service_role`, que valide
   el rol/autorización del usuario ANTES de tocar la tabla — no una
   política RLS que confíe en el token del usuario para decidir quién
   modera contenido legal.
3. `Calidad.tsx` deja de llamar a `supabase.from(...)` directo — llama a
   esa función.
4. Las dos escrituras (`aprobar`/`rechazar`) deben verificar el
   resultado real (filas afectadas), no solo `!error` — para que un
   fallo futuro se vea, en vez de repetir este mismo síntoma.

**7. Código a eliminar:** las tres llamadas directas a
`supabase.from("documentos_pendientes_revision")` en `Calidad.tsx`.

**8. Riesgo de regresión:** bajo tocar — el panel HOY no hace nada real,
así que no hay comportamiento en producción que se pueda romper. El
riesgo está en el lado contrario: no resolver esto a tiempo si alguien
asume que el panel de calidad "ya está andando".

**9. Validación:** con la función de servidor construida, confirmar que
un documento real aprobado por un reviewer autorizado SÍ cambia de
estado en la base (no solo en la pantalla), y que una cuenta sin
autorización no puede hacerlo aunque esté logueada.

---

## 🟠 IMPORTANTE

### 🟠-1 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11 (no duplicado acá)

El logout de JustiRed (`hooks/useAuth.ts::signOut()`) llama solo
`supabase.auth.signOut()` — nunca pasa por
`https://auth.sorsabsa.com/auth/logout`, repitiendo el mismo bug que ya
se corrigió dos veces en el ecosistema (CondoManager, y la cadena de 7
parches que originó `AUDITORIA-PORTERO-SSO.md`). Ya documentado y con fix
propuesto ahí — pendiente de confirmación de Gina, mismo estado que
antes de esta auditoría.

---

## Resuelto, verificado, no tocar

- **El cliente de Supabase apunta al proyecto correcto.**
  `src/integrations/supabase/client.ts` fija `db.schema = 'justired'`
  contra `verticales_sorsabsa` (`twkuidnjwhopbjnrhnxp`) — el mismo
  proyecto que emite la sesión en el login por SSO (ver
  `AUDITORIA-PORTERO-SSO.md` 🔴-12, el bug que sí tuvo agente24siete). El
  propio comentario del archivo dice que esto YA se corrigió una vez
  antes ("antes apuntaba a jywrjk, que rechazaba el token central") — no
  hay nada que repetir acá.
- **El gate de sesión (SDK de Supabase, sin `middleware.ts`) es correcto
  para una SPA sin servidor propio** — ya confirmado en
  `AUDITORIA-PORTERO-SSO.md` 🔴-11, no se re-abre.
- **El alta de cuenta nueva usa el `/auth/register` genérico de
  identity** (JustiRed no tiene `registerUrl` propio en `apps.ts`) — ya
  verificado en `PENDIENTES-ECOSISTEMA.md` #18, correcto a propósito.

## Pendiente de decidir con Gina antes de ejecutar

- 🔴-1 necesita la decisión de negocio (punto 6.1) antes de escribir
  cualquier código — no es un fix chico, es definir quién modera.
- 🟠-1 es chico y seguro, mismo patrón ya probado en CondoManager y
  agente24siete — puede ejecutarse cuando Gina confirme, igual que el
  resto de logouts pendientes del ecosistema.
