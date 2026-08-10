# Auditoría — agente24siete, el portero (sesión/autenticación)

**Abierta:** 10-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo se
corrige sin presentar antes el análisis de 9 puntos (síntoma, causa
inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Por qué existe:** Gina, probando `/portal` con su cuenta de Google
(`gina.proanio76@gmail.com`, sin cliente asociado a propósito, para
probar el caso "no tengo cuenta"), vio el sidebar completo del panel
dibujarse con el mensaje `Sesión inválida o expirada` adentro, sin botón
de salir. Su reacción, textual: *"por que jwts no era el estandar de
implementacion del portero... vamos a tener que hacer una auditoria como
la que hicimos a condomanager y solo así logramos estabilizar al portero
y condomanager."* No se implementó ningún fix reactivo más — esto es esa
auditoría.

**No se puede mandar la app a revisión de Meta (WhatsApp) mientras el
portero de agente24siete no esté al nivel de CondoManager/identity** —
la revisión necesita un flujo de login/sesión que funcione de verdad, no
solo "compila y no tira error 500".

**Alcance:** todo lo relacionado a sesión/autenticación en
`agente24siete` — `lib/clienteAuth.js`, `lib/adminAuth.js`,
`app/auth/callback/page.tsx`, `app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx`, `app/portal/layout.tsx`,
`app/admin/layout.tsx`, `pages/api/auth/reconciliar-cliente.js`,
`lib/supabaseAdminIdentity.js`. Comparado contra el patrón YA probado y
estabilizado en CondoManager (`middleware.ts`,
`app/components/SignOutButton.tsx`) y contra el contrato real de
`auth-sorsabsa/src/app/auth/logout/page.tsx`, no contra suposiciones.

**10-ago-2026 — extendido a los otros 3 productos web:** Gina, al ver este
hallazgo, preguntó por qué habría de ser solo acá. Se auditó el mismo patrón
en DomusCRM y JustiRed contra la misma referencia (CondoManager) — resultado
en `AUDITORIA-PORTERO-SSO.md` 🔴-11: no es el mismo bug copiado, son tres
fallas distintas (gate ausente acá, gate incompleto en DomusCRM, logout
local en JustiRed). Los hallazgos de abajo (🔴-1, 🟠-1, 🟠-2) siguen siendo
la fuente específica de agente24siete; 🔴-11 es el consolidado ecosistema.

---

## 🔴 CRÍTICO

### 🔴-1 — 🔧 CONSTRUIDO 10-ago-2026, falta probar en vivo — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager

**1. Síntoma:** un usuario sin sesión válida (sin token, con token vencido,
o con token de una cuenta sin cliente asociado) ve el shell COMPLETO del
panel — sidebar, marca, navegación — con el error apareciendo recién
adentro, en el área de contenido. Esto es exactamente lo que ya se había
encontrado y "corregido" el 09-ago-2026 en `admin/layout.tsx` (comentario
en el propio archivo: *"el sidebar se dibujaba siempre, incluso sin
sesión"*) — pero ese fix solo resolvió el caso "no hay NINGÚN token", no
"hay un token pero es inválido/vencido".

**2. Causa inmediata:** `LoginGate` (`app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx`) es un componente `"use client"` que corre
DESPUÉS de que la página ya se sirvió al navegador — decide si mostrar
`children` mirando `localStorage.getItem(TOKEN_KEY)`. Si existe CUALQUIER
string ahí, deja pasar inmediatamente (`setListo(true)`), sin decodificar
ni validar nada. El layout entero (sidebar incluido) se monta antes de
que ninguna llamada real al backend confirme que la sesión sirve para
algo.

**3. Causa raíz:** agente24siete nunca implementó gating server-side.
CondoManager (`condomanager/middleware.ts`, ya auditado y estabilizado)
resuelve exactamente este problema de otra forma: **antes de que el
navegador reciba una sola línea de HTML de una ruta protegida**, el
middleware corre en el servidor, llama a `supabase.auth.getUser()`
(validación EN VIVO contra Supabase Auth, no un cálculo local) contra la
sesión en cookies, y si no hay sesión válida, redirige — la página
protegida ni se llega a renderizar. agente24siete no tiene ningún
archivo `middleware.ts`. Es la diferencia real entre "el navegador decide
si mostrarte algo que ya tiene" (agente24siete) y "el servidor decide si
te manda algo" (CondoManager) — la primera es estructuralmente incapaz de
evitar el flash que Gina vio, sin importar cuántos parches se agreguen
del lado del cliente.

**4. Componente responsable:** el portero de agente24siete necesita un
`middleware.ts` — el mismo tipo de componente que ya resolvió esto en
CondoManager, no una versión más lista de `LoginGate`.

**5. Código afectado:**

- `app/portal/LoginGate.tsx`, `app/admin/LoginGate.tsx` — el mecanismo
  actual, insuficiente por diseño.
- `app/auth/callback/page.tsx` — hoy instala el token SOLO en
  `localStorage` (`a24_cliente_token`/`a24_admin_token`). Un
  `middleware.ts` corre en el servidor y **no tiene acceso a
  `localStorage`** (es exclusivo del navegador) — para que el servidor
  pueda decidir algo, el token tiene que viajar también en una cookie.
- `lib/clienteAuth.js`, `lib/adminAuth.js` — siguen siendo necesarios
  para las rutas de API (`pages/api/**`), que se llaman con
  `Authorization: Bearer` — el middleware no los reemplaza, los
  complementa (gatea las PÁGINAS, no las llamadas API en sí).

**6. Fix propuesto (requiere confirmación de Gina, no es chico):**

1. `app/auth/callback` guarda el token TAMBIÉN en una cookie (además de
   `localStorage`, que se sigue usando para los headers `Authorization`
   de las llamadas a `pages/api/**` — no hay que migrar esas rutas).
2. `middleware.ts` nuevo, matcher sobre `/portal/*` y `/admin/*`: lee la
   cookie, si no existe o no decodifica un `exp` vigente, redirige a
   `auth.sorsabsa.com/auth/login?app=agente24siete&next=<ruta>` — mismo
   contrato que ya usa `LoginGate`, mismo `AUTH_PORTAL`. No hace falta
   validación de firma en el middleware (eso ya lo hace cada API route
   con `jose`/JWKS) — alcanza con chequear vigencia (`exp`) para el gate
   de PÁGINA, exactamente para evitar el flash. La verificación fuerte
   sigue viviendo donde ya vive: en cada llamada a `pages/api/**`.
3. `LoginGate` se simplifica o se elimina — si el middleware ya garantiza
   que nadie llega a la página sin cookie vigente, no hace falta la
   doble verificación del lado del cliente (**"código a eliminar"**,
   punto 7 de la ESTANDAR-DESARROLLO).

**7. Código que debe eliminarse:** `app/portal/LoginGate.tsx` y
`app/admin/LoginGate.tsx` completos, una vez que el middleware cubra su
función — no coexistir "por las dudas" (duplicación de la misma regla en
dos lugares, exactamente lo que la ESTANDAR-DESARROLLO prohíbe).

**8. Riesgo de regresión:** medio — toca el flujo de login de los dos
paneles (cliente y admin) de un producto en producción, con clientes
reales (Punta Blanca). Probar en los dos roles, con token ausente, token
vencido, y token válido, antes de considerar esto cerrado.

**9. Validación — pendiente, la hace Gina:** simular los 3 casos (sin
cookie, cookie vencida, cookie válida) contra `/portal` y `/admin`,
confirmar que el HTML servido en los dos primeros casos es directamente
el de la página de login (no un flash del shell), y que el tercero
funciona igual que hoy.

**10-ago-2026, construido, commit `agente24siete@89429ff` — Gina: "avanza
con el -1":**

1. ✅ `app/auth/callback` guarda el token TAMBIÉN en cookie
   (`a24_cliente_token`/`a24_admin_token`, misma llave que ya usaba
   `localStorage` — eso no cambió, sigue siendo la fuente del header
   `Authorization` para `pages/api/**`).
2. ✅ `middleware.ts` nuevo (matcher `/portal/*` y `/admin/*`): lee la
   cookie del panel correspondiente, si falta o `tokenExpirado()` da
   `true` (mismo chequeo de `exp` que ya usa `LoginGate`, sin verificar
   firma — eso lo sigue haciendo cada API route vía `jose`/JWKS) redirige
   a `auth.sorsabsa.com/auth/login` ANTES de servir el HTML. Verificado
   con `next build` completo (no solo `tsc`), compila limpio en Edge
   runtime, bundle de Middleware generado (34.4 kB) — confirma que
   `tokenExpirado()` (usa `atob`) es compatible con el runtime del
   middleware, no solo con el navegador.
3. ⬜ **`LoginGate` NO se tocó, a propósito.** El punto 7 de este mismo
   hallazgo lo marca como "código que debe eliminarse", pero con el
   riesgo ya declarado como medio y clientes reales de por medio, se
   decidió dejarlo un ciclo más como red de seguridad — no cambia ningún
   comportamiento (si el middleware deja pasar, `LoginGate` encuentra el
   mismo token válido en `localStorage` y no hace nada; si el middleware
   redirige, `LoginGate` ni llega a cargar). Se borra en un commit aparte
   una vez que Gina confirme el punto 9 en vivo — no antes.

---

## 🟠 IMPORTANTE

### 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — No existe botón de cerrar sesión en ningún panel — y la versión ingenua repetiría un bug ya corregido en CondoManager e identity

**1. Síntoma:** ni `/portal` ni `/admin` tienen ninguna opción de "Salir"
en el sidebar. Confirmado con grep (`logout|Salir|cerrar sesi|removeItem`
en `app/admin/**` y `app/portal/**`): cero resultados.

**2. Causa inmediata:** nunca se construyó.

**3. Causa raíz — por qué esto no es "agregar un botón" sin más:**
`auth-sorsabsa/src/app/auth/logout/page.tsx` (el logout central real)
tiene, en su propio comentario, la razón exacta por la que un logout
ingenuo (`localStorage.removeItem(...)` y ya) NO alcanza: *"esta
pantalla solo cerraba la sesión del PRODUCTO — nunca la de
sorsabsa-identity... cualquier reintento de login volvía a autenticar en
silencio a la MISMA cuenta sin mostrar el formulario."* Es el MISMO bug
que `AUDITORIA-PORTERO-SSO.md` 🟠-5 ya encontró y corrigió en
CondoManager (dos logouts locales, ninguno pasaba por el central).
Construir un "Salir" que solo limpie `localStorage` en agente24siete
sería repetir, por tercera vez, un defecto que el ecosistema ya pagó dos
veces.

**4. Componente responsable:** el logout central de identity
(`auth.sorsabsa.com/auth/logout`) ya existe y ya resuelve esto — no
construir nada nuevo del lado del logout en sí.

**5. Código afectado:** `app/portal/layout.tsx`, `app/admin/layout.tsx`
(agregar el botón/link).

**6. Fix propuesto — mismo contrato que `condomanager/app/components/SignOutButton.tsx`
(referencia real, ya en producción):**

```ts
const handleSignOut = () => {
  localStorage.removeItem(TOKEN_KEY); // el local, propio de agente24siete
  window.location.href =
    `https://auth.sorsabsa.com/auth/logout?app=agente24siete&next=${encodeURIComponent(window.location.origin)}`;
};
```

El `localStorage.removeItem` local SÍ hace falta acá (a diferencia de
CondoManager, que no lo necesita) porque agente24siete guarda el token
en `localStorage`, no en cookies — el logout central corre en el dominio
`auth.sorsabsa.com` y no puede tocar el `localStorage` de
`agente24siete.app` (orígenes distintos). Icono `logOut`, ya agregado a
`@sorsabsa/ui@0.1.43` para esto.

**7. Código que debe eliminarse:** ninguno (no existía nada antes).

**8. Riesgo de regresión:** bajo — es agregar, no modificar un flujo
existente.

**9. Validación:** clic en "Salir", confirmar que `localStorage` queda
sin el token, y que un segundo intento de login desde cero SÍ pide
credenciales de nuevo (no auto-aprueba en silencio) — esa es la prueba
real de que cierra las DOS sesiones, no solo la apariencia de haber
salido.

### 🟠-2 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — `LoginGate` valida presencia de token, nunca vigencia — deja pasar sesiones vencidas al shell completo

**1. Síntoma:** el caso puntual que reportó Gina — token de horas atrás,
`LoginGate` lo acepta igual, el sidebar se dibuja, recién la llamada a
`/api/portal/dashboard` descubre (server-side, vía `jwtVerify`) que venció.

**2. Causa inmediata:** `LoginGate` solo hace
`if (!token) { redirigir }` — nunca mira `exp`.

**3. Causa raíz:** mismo síntoma que 🔴-1, pero es la pieza que SÍ se
puede arreglar hoy sin la migración a `middleware.ts` — un parche
razonable mientras 🔴-1 no se decide, no un sustituto de él.

**4. Componente responsable:** `LoginGate` (los dos, portal y admin) —
temporal, hasta que 🔴-1 lo vuelva innecesario.

**5. Código afectado:** `app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx`. Ya hay un borrador sin commitear:
`lib/jwt.ts` (`tokenExpirado()`, decodifica `exp` sin red ni verificación
de firma — la firma la sigue verificando el servidor).

**6. Fix propuesto:** en el `useEffect` de cada `LoginGate`, si
`tokenExpirado(token)` es verdadero, tratarlo igual que "no hay token"
(limpiar la clave de `localStorage` y redirigir) en vez de dejarlo pasar.

**7. Código que debe eliminarse:** este mismo chequeo, el día que 🔴-1 se
resuelva y el middleware asuma la función completa — dejarlo anotado acá
para no olvidarlo cuando llegue ese momento.

**8. Riesgo de regresión:** bajo — solo agrega un chequeo, no cambia el
camino feliz.

**9. Validación:** con un token real vencido a mano (se puede fabricar
uno con `exp` en el pasado para la prueba), confirmar que `LoginGate` NO
deja pasar y redirige limpio, sin dibujar el sidebar.

### 🟠-3 — Pendiente de verificar en vivo, no descartado: ¿el mensaje de Gina fue realmente por vencimiento, o hay un problema de configuración?

**1. Síntoma:** `jwtVerify` respondió "Sesión inválida o expirada" para
un login de Google reciente.

**2-3. Causa inmediata/raíz:** dos hipótesis, **no diferenciadas
todavía**: (a) el token efectivamente venció (plausible — pasó bastante
tiempo real en la sesión de trabajo entre el login y la prueba), o (b)
`SUPABASE_JWKS_URL`/`SUPABASE_URL` de agente24siete están mal apuntadas
o desincronizadas del proyecto real que emite el token vía el proveedor
OIDC de identity — un bug de configuración, no de código.

**4. Componente responsable:** no determinado todavía.

**5-7.** N/A hasta diferenciar.

**8.** N/A.

**9. Validación pendiente, la hace Gina:** login nuevo, prueba
INMEDIATA (sin dejar pasar tiempo) contra `/portal`. Si funciona bien en
el acto → confirma (a), causa ya cubierta por 🟠-2/🔴-1, cerrar este
punto. Si falla incluso recién logueado → confirma (b), hace falta
revisar el valor real de `SUPABASE_JWKS_URL`/`SUPABASE_URL` en Vercel
contra el proyecto `nwcqaginlnzjlkgwifas` (ninguno de los dos es
secreto — son URLs públicas, se pueden pegar acá para revisar juntos).

---

## Resuelto con Gina (ya no está pendiente)

- **¿"Sesión inválida o expirada" fue por falta de cuenta o por el JWT
  en sí?** Por el JWT — mensaje distinto de "Cuenta sin cliente
  asociado" (la rama que sí esperábamos para este caso de prueba).
- **¿JWT verificado localmente (jose + JWKS) es en sí mismo el defecto
  arquitectónico?** No, verificado contra `lib/adminAuth.js`: es el
  patrón documentado de FASE 3 (*"Auth delegada a auth-sorsabsa"*),
  igual en los dos paneles, coherente con que las rutas de API reciben
  `Authorization: Bearer` (no cookies) — un patrón legítimo y ya
  documentado, no accidental. El defecto real es que la decisión de
  MOSTRAR PÁGINA nunca pasó por el servidor (🔴-1), no cómo se verifica
  el token en las llamadas a la API.

## Pendiente de decidir con Gina antes de ejecutar

- **10-ago-2026:** 🟠-1 (Salir), 🟠-2 (chequeo de vigencia en
  `LoginGate`) y 🔴-1 (`middleware.ts` + cookie) construidos, commits
  `agente24siete@c6f2578` y `agente24siete@89429ff`. typecheck y `next
  build` completo limpios (sin suite de tests ni eslint configurados en
  este repo — mismo estado que antes de este fix, no se tocó).
- **Único pendiente real de esta auditoría:** la validación EN VIVO de
  🔴-1 (punto 9) — sin cookie, con cookie vencida, y con cookie válida,
  en los dos paneles, contra clientes reales. Recién ahí se borra
  `LoginGate.tsx` (punto 7, "código que debe eliminarse") — se dejó sin
  tocar a propósito como red de seguridad hasta esa confirmación.
- **🟠-3** sigue necesitando que Gina haga una prueba en vivo puntual
  (login nuevo, probar de inmediato contra `/portal`) — puede resolverse
  en la MISMA prueba que valida 🔴-1, no hace falta repetirla dos veces.
