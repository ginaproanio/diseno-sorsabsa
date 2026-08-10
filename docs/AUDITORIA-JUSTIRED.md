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

---

## 10-ago-2026 — Estado real, adónde debe llegar, y los transversales que esta auditoría todavía no cubrió

Sesión cortada por límite de tokens antes de construir nada — esta
sección deja documentado el mapa completo para retomar, sin perder lo
ya entendido hoy.

### Qué es JustiRed hoy, de verdad (confirmado, no supuesto)

Gina, textual: *"justired se dedico a capturar leyes, de hecho sigue
alimentando y grabando en r2 cloudflare, pero nada más, el sistema fue
diseñado en figma, vino aca, usa el scraper pero nada más."* Coincide
con el código: `scraper/` captura leyes reales y las sube (R2), un
pipeline las deja en `justired.leyes`/`articulos`/
`documentos_pendientes_revision` (**75 filas reales pendientes hoy**,
verificado), y el sitio público (Index, Blog, LawyerProfile, Pricing,
biblioteca legal) las muestra. **Ahí termina el sistema construido.** No
existe ningún espacio de trabajo para la persona que debe revisar lo que
el scraper capturó antes de que se publique — el curador de las leyes
capturadas no tiene un lugar propio, ni como rol ni como pantalla.

### Confirmado con datos: no hay NINGÚN rol autenticado en JustiRed, ni siquiera "abogado"/"cliente"

`SELECT` sobre `information_schema.columns`/`pg_class` en el esquema
`justired`: seis tablas (`leyes`, `articulos`, `articulos_embeddings`,
`documentos_pendientes_revision`, `subscription_plans`,
`lawyer_subscriptions`) — **ninguna es una tabla de personas/roles**.
`lawyer_subscriptions` guarda `lawyer_name`/`lawyer_email`/
`lawyer_phone` como texto plano, sin FK a `auth.users` — es un registro
de pago para aparecer en el directorio, no una cuenta con rol. `useAuth()`
(`hooks/useAuth.ts`) solo expone el usuario crudo de Supabase — no hay
`rol`, no hay `perfil`, no hay forma de distinguir "abogado" de "cliente"
de "curador" en ningún lado del sistema. Por eso `Calidad.tsx` (🔴-1) no
tenía otra opción que gatear con `if (!user)` — no había nada más contra
qué chequear.

**A dónde debe llegar (diseño propuesto, no construido):** tabla
`justired.staff` (`email`, `nombre`, `rol`, `activo` — mismo patrón que
`usuarios` de agente24siete) + una Edge Function con `service_role` que
valide contra esa tabla (mismo patrón que `justired-notifications-*`, ya
construido y funcionando en este mismo repo) + `Calidad.tsx` (o su
reemplazo) llamando a esa función en vez de tocar la tabla directo.
Gina ya confirmó el diseño en el chat — falta solo ejecutar.

### 🔵 Transversales — no auditado hasta hoy, hallazgo real encontrado al cerrar

Pedido explícito de Gina: *"la auditoria no ha alcanzado los
transversales."* Verificado, con evidencia concreta de que JustiRed
corre un sistema de suscripción **paralelo**, no el transversal:

- `justired.lawyer_subscriptions` tiene columnas
  `payphone_transaction_id`/`payphone_client_transaction_id`/
  `payphone_response` — **Payphone integrado directo**, sin pasar por
  `pagos-sorsabsa` (el motor de cobros transversal que sí usan
  CondoManager, DomusCRM y, desde el 09-ago, agente24siete).
- `auth-sorsabsa/src/lib/entity-resolver.ts` (el que decide "quién paga"
  para el gate de suscripción en `/auth/complete`) **no tiene ningún
  caso para `'justired'`** — a diferencia de `domuscrm`/`condomanager`
  (resuelven la empresa/condominio) o `agente24siete`/`iot`/`convertidor`
  (bypass explícito). Sin caso propio, cae al `return { subject: userId
  }` genérico: trata a la PERSONA que inicia sesión como la entidad que
  paga, no a "el abogado" ni a "la suscripción de lawyer_subscriptions".
- **Contradice una afirmación ya escrita en `ARQUITECTURA-ECOSISTEMA.md`**
  (fila Referidos, sin fecha de verificación propia): *"[recompensa_dias]
  le funciona a CondoManager/DomusCRM/JustiRed"* — asumía que JustiRed
  usa `pagos.suscripciones` transversal. **Con lo encontrado hoy, esa
  frase es dudosa** — JustiRed parece cobrar y llevar su propia
  suscripción de abogados 100% local, sin relación con `pagos.suscripciones`.
  No confirmado del todo (no se probó un pago real de abogado en vivo
  hoy) — queda como hallazgo a verificar, no como hecho cerrado.

**Por qué importa, en los mismos términos que motivó esta pregunta:**
mismo riesgo de "desoldar" ya identificado para Créditos/Saldo de
agente24siete en `ARQUITECTURA-ECOSISTEMA.md` §1 — un tercer sistema de
cobro paralelo (pagos-sorsabsa, saldo de agente24siete, y ahora
lawyer_subscriptions de JustiRed) es exactamente la clase de duplicación
que `ESTANDAR-DESARROLLO.md` pide evitar, y potencialmente el motivo
real (no confirmado hoy) de que el login por SSO de JustiRed pueda estar
bloqueando o dejando pasar abogados por una razón que nadie diseñó a
propósito.

### Pendiente para la próxima sesión, en orden

1. Verificar en vivo (con Gina) si un abogado real puede loguearse por
   SSO a JustiRed hoy, y si el gate de suscripción de `/auth/complete`
   lo bloquea o lo deja pasar — sin esto, el punto de arriba sigue siendo
   hallazgo, no hecho confirmado.
2. Decidir: ¿`lawyer_subscriptions` se queda como sistema propio (con
   una razón de negocio real, ej. Payphone directo por algo específico
   de abogados) o se migra a `pagos-sorsabsa` como el resto del
   ecosistema? Requiere su propio análisis de 9 puntos — no ejecutar sin
   eso.
3. Construir el rol `justired.staff` + Edge Function + `Calidad.tsx`
   funcional (🔴-1), una vez decidido el punto 6.1 original (quién es
   curador).
4. Resolver 🟠-1 (logout central), chico y seguro, puede ir en paralelo.
