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

### 🔴-1 — ✅ RESUELTO 15-ago-2026 — El panel de Control de Calidad no hace nada: RLS bloquea la tabla para cualquier usuario, la UI lo esconde con un "éxito" falso

> **Cerrado el 15-ago-2026.** Construido lo que pedía el punto 6, con la
> decisión de negocio ya tomada por Gina (quién modera: `justired.staff`).
> Qué existe ahora:
>
> - **`justired.staff`** (`email` · `nombre` · `rol` · `activo`) — fuente única
>   de autorización, mismo patrón que `usuarios` de agente24siete
>   (`lib/adminAuth.js`): se resuelve por el email del token del SSO central.
>   RLS activado y cero políticas, esta vez **a propósito y documentado**: la
>   tabla que decide quién modera no puede ser legible por el navegador.
>   Sembrada con `gina.proanio76@gmail.com` (rol `admin`). **Ningún email
>   hardcodeado en código.**
> - **Edge Function `justired-calidad`** (desplegada, `version 1`, ACTIVE,
>   `verify_jwt: true`) — identidad por token, autorización contra `staff`, y
>   recién entonces toca la tabla con `service_role`. Una sola función con
>   `accion: listar | resolver` en vez de una por acción: la regla "quién puede
>   moderar" vive en un solo despliegue, no duplicada en dos.
> - **El "éxito" falso está muerto**: el UPDATE lleva `.eq('estado','pendiente')
>   .select(...)` y devuelve las filas que **realmente** cambió. Cero filas →
>   `409` con mensaje, no un `ok`. La fila no se saca de la pantalla si la base
>   no cambió.
> - **`Calidad.tsx`** ya no llama a `supabase.from(...)`; el gate dejó de ser
>   `if (!user)`. Una cuenta logueada sin autorización ve "Acceso restringido"
>   —una pantalla explícita— en vez de una lista vacía que miente.
> - **Trazabilidad**: `revisado_por` + `revisado_at` en
>   `documentos_pendientes_revision`, y `check (estado in ('pendiente',
>   'aprobado','rechazado'))` — antes era texto libre y cualquier typo era un
>   estado válido.
>
> Migraciones versionadas en `legaltech/supabase/migrations/`
> (`20260815000000_justired_staff_y_trazabilidad_revision.sql`).
> **Falta solo la validación en vivo** (ver el cierre de este documento).
>
> Al construirlo aparecieron **dos hallazgos nuevos**, 🔴-2 y 🔴-3 — uno de
> ellos explica por qué el login de JustiRed no podía funcionar.

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

**6. Fix propuesto — ✅ ejecutado 15-ago-2026 tal cual está escrito acá
(la decisión del punto 6.1 la tomó Gina: `justired.staff`):**

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

### 🔴-2 — 🔧 El portero central tiene a JustiRed registrada en un dominio que NO EXISTE: todo login termina en `justired.app` (NXDOMAIN)

**Encontrado el 15-ago-2026**, al ir a corregir el logout de 🟠-1: había que
decidir a dónde vuelve el usuario tras salir, y la allowlist no coincidía con
el dominio real del sitio. **Esto responde el pendiente nº 1 de la sesión
anterior** ("verificar si un abogado puede loguearse hoy") sin necesidad de
probarlo en vivo: no puede, y la causa no es el gate de suscripción.

**1. Síntoma:** cualquier login por `auth.sorsabsa.com/auth/login?app=justired`
termina redirigiendo a `https://justired.app` — un dominio que no resuelve. El
navegador muestra un error de DNS, no una pantalla de JustiRed.

**2. Causa inmediata:** `auth-sorsabsa/src/lib/apps.ts`, entrada `justired`:
`redirectUrl: 'https://justired.app'`, `callbackUrl:
'https://justired.app/auth/callback'`, `allowedHosts: ['justired.app',
'www.justired.app', 'localhost']`.

**3. Causa raíz, verificada con DNS y HTTP el 15-ago-2026, no supuesta:**

| Dominio | Resultado real |
| --- | --- |
| `justired.app` | **NXDOMAIN** — *"Non-existent domain"* |
| `www.justired.app` | no resuelve |
| `justired.com` | `308` → `https://www.justired.com/` |
| `www.justired.com` | **`200`**, `<title>JustiRed - Conectamos tus necesidades legales…</title>`, detrás de Cloudflare |

El dominio real del producto es `justired.com`, y el propio SPA lo sabe: sus
canónicos (`Index.tsx`, `Privacidad.tsx`, `LeyDetail.tsx`) y sus correos
(`contactenos@justired.com`) apuntan ahí. El registro del portero nunca se
actualizó. El mecanismo de redirección es correcto y falla-cerrado como debe:

- `useAuth.signIn()` manda `next=https://www.justired.com/auth/callback`.
- `resolveSafeRedirect` (`lib/safe-redirect.ts:30`) exige que el host esté
  **exactamente** en `allowedHosts`. `www.justired.com` no está → devuelve
  `config.redirectUrl`, o sea el dominio muerto.
- La allowlist dinámica no salva el caso: `esDominioDeTenant`
  (`lib/dynamic-hosts.ts:25`) hace `if (app !== 'domuscrm') return false`.
- Y el forzado de `callbackUrl` de `/auth/complete` (que actúa justo cuando
  `resolveSafeRedirect` cayó al default) manda a
  `https://justired.app/auth/callback`: el mismo dominio muerto.

**Es el mismo error que ya se corrigió para agente24siete en este archivo** —el
comentario de `apps.ts:77-80` explica que apuntaba a `www.agente24siete.app`
siendo el origen real `agente24siete.app`— pero peor: ahí el host existía y
solo no compartía `localStorage`; acá no existe ningún host.

**4. Componente responsable:** el portero central (`auth-sorsabsa`), no
JustiRed. `ESTANDAR-DESARROLLO.md`: *"Problema de autenticación central →
corregir el portero, no cada producto."*

**5. Código afectado:** `auth-sorsabsa/src/lib/apps.ts`, entrada `justired`.

**6. Fix aplicado (código, 15-ago-2026):** `redirectUrl` y `callbackUrl` a
`https://www.justired.com`, `allowedHosts: ['justired.com',
'www.justired.com', 'localhost']`. Es corregir un dato mal registrado, no
agregar una excepción: ni un `if (app === 'justired')` ni un bypass.

**7. Código a eliminar:** nada. Es sustitución de un valor equivocado.

**8. Riesgo de regresión:** bajo en su efecto, **alto en su alcance de
despliegue**: `apps.ts` lo comparten todos los productos, así que el deploy de
`auth-sorsabsa` toca el login de todo el ecosistema. Por eso **el código está
cambiado pero NO desplegado** — el deploy lo decide Gina. Lo que sí es seguro
afirmar: peor que redirigir a un dominio inexistente no se puede quedar.

**9. Validación:** con `auth-sorsabsa` desplegado, entrar por
`auth.sorsabsa.com/auth/login?app=justired` y confirmar que aterriza en
`www.justired.com/auth/callback` con sesión, no en un error de DNS. Recién ahí
se puede saber si el gate de suscripción de `/auth/complete` bloquea o no a un
abogado — hoy esa pregunta ni siquiera se alcanza a responder.

---

### 🔴-3 — ✅ RESUELTO 15-ago-2026 — La cola de revisión no gateaba nada: toda ley capturada era pública desde el primer segundo, aprobada o no

**Encontrado el 15-ago-2026** al construir el fix de 🔴-1: se verificó qué pasa
**después** de aprobar, y la respuesta fue "nada".

**1. Síntoma:** `scraper/README.md` documentaba *"Aprobado → visible en la
biblioteca. Rechazado → no se publica"*. Falso: las 80 leyes estaban visibles
en la biblioteca pública estando las 80 en `pendiente`. Rechazar un documento
no lo quitaba de la vista de nadie.

**2. Causa inmediata:** `justired.leyes` **no tiene ninguna columna de estado**
(verificado en `information_schema.columns`: 20 columnas, ninguna de revisión),
y su política de lectura era `leyes lectura publica … using (true)` para `anon`
y `authenticated`. Ninguna consulta del frontend (`LegalLibrary.tsx`,
`LeyDetail.tsx`) filtra por estado, porque no hay por dónde.

**3. Causa raíz:** el orden del pipeline. El flujo documentado en
`docs/biblioteca-legal.md` §4 es explícito: *"6. Guardar leyes · articulos …
8. Revisar documentos_pendientes_revision → panel /calidad"*. **La publicación
ocurre en el paso 6 y la revisión en el 8** — la cola nunca fue un gate previo,
es una lista posterior. Se construyó la cola y la pantalla, pero nunca el
mecanismo que hiciera valer su resultado. Combinado con 🔴-1, el panel era
doblemente inerte: ni escribía en la base, ni habría cambiado nada si lo
hubiera hecho.

**4. Componente responsable:** las políticas de lectura de
`justired.leyes`/`articulos` — no el scraper (archiva bien) ni el panel.

**5. Código afectado:** políticas `leyes lectura publica` y `articulos lectura
publica`; `scraper/README.md` §"Flujo de calidad" (documentaba algo inexistente).

**6. Fix aplicado, con la decisión de Gina (15-ago-2026): lo rechazado
desaparece de la biblioteca, lo pendiente sigue visible.** Se descartó
"solo lo aprobado es público" porque vaciaba la biblioteca de 80 leyes a 0
hasta revisarlas una por una.

- El estado sigue viviendo en **un solo lugar**
  (`documentos_pendientes_revision.estado`). **No se agregó una columna espejo
  en `leyes`**: dos columnas con el mismo dato es la duplicación que el
  estándar pide evitar.
- **Trampa evitada, y vale escribirla:** una política sobre `leyes` que
  consultara `documentos_pendientes_revision` con un subselect directo se
  evalúa con los permisos de quien consulta, y `anon` no tiene acceso a esa
  tabla — habría fallado, o peor, devuelto cero filas haciendo que `not exists`
  diera siempre `true`: **una política que existe y no filtra nada.** Sería el
  mismo defecto que originó esta auditoría. Por eso la lectura del estado pasa
  por `justired.ley_rechazada(uuid)`, `SECURITY DEFINER` con `search_path`
  fijado, que devuelve solo un booleano.
- Se aplicó también a `articulos`: sin eso, una ley "desaparecida" seguía
  legible artículo por artículo por `ley_id`.

**7. Código a eliminar:** las dos políticas `using (true)` (reemplazadas) y la
frase falsa del README (corregida, con la nota de por qué era falsa).

**8. Riesgo de regresión:** medido, no estimado. Prueba ejecutada dentro de una
transacción **revertida** (verificado después: 80 en `pendiente`, 0 con
revisor — no quedó rastro):

| Momento | Leyes visibles para `anon` | Artículos visibles |
| --- | --- | --- |
| Antes (nada rechazado) | **80** | **4433** |
| Rechazando 1 ley | **79** | **4423** |

O sea: la biblioteca no pierde nada hoy, y una ley rechazada se va con sus 10
artículos.

**9. Validación:** rechazar un documento real desde `/calidad` y ver que esa ley
desaparece de la biblioteca pública; aprobar otro y ver que sigue visible.
Queda para la validación en vivo.

---

## 🟠 IMPORTANTE

### 🟠-1 — ✅ Corregido en código 15-ago-2026 (ver `AUDITORIA-PORTERO-SSO.md` 🔴-11)

El logout de JustiRed (`hooks/useAuth.ts::signOut()`) llamaba solo
`supabase.auth.signOut()` — nunca pasaba por
`https://auth.sorsabsa.com/auth/logout`, repitiendo el mismo bug que ya
se corrigió dos veces en el ecosistema (CondoManager, y la cadena de 7
parches que originó `AUDITORIA-PORTERO-SSO.md`). JustiRed nunca tuvo su
propio "Fix 7".

**Corregido — y con una diferencia respecto de CondoManager que importa.**
CondoManager (`SignOutButton.tsx`) **reemplazó** el `signOut()` local por el
logout central. En JustiRed hacen falta **los dos, en este orden**, y no es
redundancia:

1. `supabase.auth.signOut()` local — JustiRed es una SPA y su sesión vive en el
   `localStorage` de `www.justired.com`. El logout central corre en
   `auth.sorsabsa.com` y **no puede tocar ese almacenamiento**: sin este paso,
   el `access_token` ya emitido sigue ahí y `getSession()` lo da por bueno
   hasta que expire — la app se vería logueada después de "salir".
2. Redirección a `/auth/logout?app=justired&next=<origin>` — cierra la sesión
   de **identity**, que es lo único que impide el auto-reingreso silencioso.
   Esa autoridad no se reimplementa en el producto.

`next` usa `window.location.origin` (no una constante) para que funcione igual
en producción y en local. **Depende de 🔴-2:** hasta que `apps.ts` no esté
desplegado con los dominios correctos, ese `next` no pasa la allowlist y el
usuario sale hacia el dominio muerto.

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

---

## 15-ago-2026 — Qué se ejecutó, qué falta

**Punto 3 ✅ construido y desplegado** (🔴-1) · **punto 4 ✅ corregido en
código** (🟠-1) · **punto 1 respondido sin necesidad de probarlo en vivo**: no
era el gate de suscripción, es que el portero manda a JustiRed a un dominio
inexistente (🔴-2) — y por el camino apareció 🔴-3, que el punto 3 no cubría.
**Punto 2 (`lawyer_subscriptions` vs `pagos-sorsabsa`) sigue intacto**: no se
tocó, sigue necesitando su propio análisis de 9 puntos.

### Ya está andando en producción (base de datos)

Aplicado sobre `verticales_sorsabsa` (`twkuidnjwhopbjnrhnxp`), schema
`justired`, y versionado en `legaltech/supabase/migrations/`:

| Cambio | Estado |
| --- | --- |
| `justired.staff` + RLS sin políticas (deliberado) + `check (email = lower(email))` | ✅ creada, sembrada con 1 fila |
| `documentos_pendientes_revision`: `revisado_por`, `revisado_at`, `check` de estado, 2 índices | ✅ aplicado |
| Edge Function `justired-calidad` (`verify_jwt: true`) | ✅ desplegada, ACTIVE |
| Políticas de `leyes`/`articulos` + `justired.ley_rechazada()` | ✅ aplicadas y medidas (80→79 al rechazar una) |

**Por qué `check (email = lower(email))`:** el email es la llave de
autorización. Guardado con mayúsculas, la comparación exacta falla y la
tentación es resolverlo con `ILIKE` — que trata `_` y `%` como comodines y
**podría hacer coincidir un email con otro**. Se normaliza en el
almacenamiento para poder comparar con `.eq` y nada más.

**Comprobado, no supuesto:** la función responde `401` sin token y `401`
`{"error":"token inválido"}` con la llave anon — falla cerrado. El SPA compila
y `tsc --noEmit` pasa limpio.

### Cambiado en código, SIN desplegar — lo decide Gina

| Repo | Archivo | Qué |
| --- | --- | --- |
| `legaltech` | `src/pages/Calidad.tsx` | reescrito contra la Edge Function |
| `legaltech` | `src/hooks/useAuth.ts` | logout central (🟠-1) |
| `legaltech` | `scraper/README.md` | corregida la promesa falsa del flujo de calidad |
| `auth-sorsabsa` | `src/lib/apps.ts` | dominios reales de JustiRed (🔴-2) |

⚠️ **`auth-sorsabsa` toca el login de TODO el ecosistema.** Es un cambio de un
dato mal registrado, no de lógica, pero el deploy es decisión de Gina.

### Validación en vivo pendiente (en este orden, porque se encadenan)

1. **Desplegar `auth-sorsabsa`** y entrar a JustiRed por SSO: debe aterrizar en
   `www.justired.com`, no en un error de DNS. Sin esto, nada de lo demás se
   puede probar desde una sesión real.
2. **Desplegar `legaltech`** y abrir `/calidad` con la cuenta de Gina: debe
   listar **80 documentos** (hoy la pantalla dice "No hay documentos
   pendientes" con 80 esperando).
3. **Aprobar uno** → debe seguir en la biblioteca, y `revisado_por` /
   `revisado_at` quedan grabados en la base.
4. **Rechazar uno** → debe desaparecer de la biblioteca pública (80 → 79).
5. **Con una cuenta cualquiera sin fila en `staff`** → "Acceso restringido",
   no una lista vacía.
6. **Cerrar sesión** y volver a entrar: debe **pedir credenciales de nuevo**.
   Si entra solo, el logout central no cerró la sesión de identity.

---

## 23-ago-2026 — Por qué JustiRed "iba por otro camino": la respuesta, a la tercera vez que Gina lo preguntó

Gina, textual: *"otra vez ¿por qué JustiRed tira por otro camino? ¿por
qué no sigue el estándar? ojo, es la tercera vez que lo digo"*.

### La respuesta no era indisciplina del producto

JustiRed necesitaba un **desplegable**. `@sorsabsa/ui` **no tenía
ninguno**. Así que se instaló shadcn entero: **48 componentes**, de los
cuales usaba 12 y **7 duplicaban** lo que el design system ya daba
(button, input, card, avatar, badge, table, toast).

Nadie eligió duplicar. Los duplicados **vinieron de arriba**, al traer la
librería que sí tenía la pieza que faltaba. CondoManager hizo lo mismo
por el mismo motivo.

### Por qué tardó tres avisos en verse

El check de conformidad informaba esto como *"JustiRed reimplementa 18
símbolos"* — o sea, como un desvío del producto. **Mide en una sola
dirección: sabe decir "este producto duplica", nunca "al design system le
falta".** Durante semanas el informe apuntó al síntoma y ocultó la causa.
Hicieron falta tres señalamientos de Gina para que alguien preguntara
*duplica **para conseguir qué***.

Es exactamente la pregunta 5 de `ESTANDAR-DESARROLLO` leída al revés: no
*"¿existe ya otro componente que haga esto?"* sino **"¿el componente
compartido alcanza para lo que este producto necesita?"**. Sin esa
segunda pregunta, el estándar empuja al producto a elegir entre cumplir y
funcionar — y siempre gana funcionar.

### Qué se hizo

| paso | commit | resultado |
|---|---|---|
| Borrar lo que nadie usaba | `7acf835` | 48 → 11 componentes |
| Migrar Button, Input, Badge, Select | `a12b9bb` | usa `@sorsabsa/ui` |
| Retirar el Card propio | `8b39a05` | **48 → 7, cero duplicados** |

Y del lado del design system, la causa raíz: **`Select` existe desde
v0.1.56**, construido sobre el `<select>` nativo a propósito — trae
teclado, lectores de pantalla y la rueda de iOS de fábrica, mejor que
cualquier lista dibujada a mano.

**Efecto medido, no estimado:** el build pasó de **39 s a 10 s**.

### Lo que queda vivo, y por qué

- **El sistema de toasts** (`toast.tsx`, `use-toast.ts`, `toaster.tsx`,
  `sonner.tsx`). El design system tiene un componente `Toast` pero **no
  un mecanismo para dispararlo** — no hay provider ni `useToast()`.
  Retirar el de JustiRed sin tener con qué reemplazarlo dejaría al
  producto sin avisos. **Aplazado a propósito**, no olvidado: ver
  `PENDIENTES-ECOSISTEMA.md` §29.
- **1 modal**: `alert()` en `src/components/Hero.tsx:22`.
- **`Notificacion`** redefinido en `src/hooks/useNotifications.ts`,
  idéntico carácter por carácter al que `@sorsabsa/ui` exporta.

### Un modal que se retiró de más — y por qué se anota

`fe43047` sacó un `<Dialog>` de la página de precios. **Estaba bien
hecho**: era una capa con la marca, no el cuadro gris del navegador.
Gina lo precisó después: *"lo que odio es el cartel negro oscuro que
parece de terminal"*. La regla estaba mal escrita —decía "nada de
modales, ninguno"— y el check la aplicó al pie de la letra.
`ESTANDAR-UI.md` §1 se corrigió (`18300c8`) para prohibir el diálogo del
**navegador**, y el check dejó de marcar `<Dialog>`.

Queda escrito porque el modo de fallo es general: **una regla mal escrita
hace daño más rápido cuando se automatiza**, porque deja de depender de
que alguien la lea con criterio.
