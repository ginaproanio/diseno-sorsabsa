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

### 🔴-1 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager

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
3. ⬜ **`LoginGate` NO se tocó todavía (borrado), a propósito.** El punto 7
   de este mismo hallazgo lo marca como "código que debe eliminarse",
   pero con el riesgo ya declarado como medio y clientes reales de por
   medio, se decidió dejarlo un ciclo más como red de seguridad. Se borra
   en un commit aparte una vez que Gina confirme el punto 9 en vivo.

**10-ago-2026, mismo día — Gina probó en vivo y encontró el hueco real:**
entrando por el flujo completo (landing → Google → cuenta sin cliente
asociado) el síntoma original volvió a aparecer — sidebar completo,
"Sesión inválida o expirada" al lado, no una sola pantalla centrada. La
prueba directa a `/portal` sin sesión sí funcionó bien (middleware
redirige limpio); el caso que fallaba era el TERCERO que el punto 1 de
este mismo hallazgo ya nombraba desde el inicio y que el fix original
(middleware + `tokenExpirado`) nunca cubrió: **un token con forma válida
y sin vencer, pero de una cuenta sin cliente/usuario asociado.**
`middleware.ts` no puede resolver esto porque corre en Edge, sin acceso a
un pool de Postgres — la única forma de saberlo es la misma consulta que
ya hace `autenticarCliente`/`autenticarAdmin` (`clientes.auth_user_id` /
`usuarios.email`).

**Cerrado, commit `agente24siete@6325176`:**

- `pages/api/portal/whoami.js` y `pages/api/admin/whoami.js` (nuevos):
  reusan `autenticarCliente`/`autenticarAdmin` tal cual — no agregan
  ninguna verificación nueva, solo exponen la que ya existía como un
  endpoint liviano.
- `LoginGate` (los dos): después del chequeo de vigencia (🟠-2), llama a
  `whoami` con el mismo token. `autenticarCliente` responde 401 para los
  tres casos ("Cuenta sin cliente asociado" incluido); `autenticarAdmin`
  usa 403 para "cuenta no habilitada" — el chequeo del lado admin
  contempla los dos códigos. Si la red falla (no un 401/403 explícito),
  se deja pasar — una desconexión momentánea no es motivo para expulsar a
  alguien que sí tiene sesión válida; cada llamada real sigue
  verificando igual del lado del servidor.
- Verificado con `next build` completo: los dos endpoints nuevos
  aparecen registrados, sin errores de compilación.

Con esto, los 3 casos que el punto 1 de este hallazgo nombraba desde el
principio (sin token, token vencido, cuenta sin cliente asociado) quedan
cubiertos ANTES de dibujar el shell. `LoginGate` sigue sin borrarse — el
punto 7 sigue pendiente hasta la prueba en vivo.

**10-ago-2026, mismo día, bug propio introducido por el fix de arriba —
bucle infinito real, encontrado por Gina probando en vivo:**

1. **Síntoma:** repitiendo el flujo (landing → Google → cuenta sin
   cliente), el navegador quedó rebotando sin parar contra
   `auth.sorsabsa.com/oauth/consent?authorization_id=...` — un bucle real,
   no una sola pantalla con error.
2. **Causa inmediata:** el fix de `whoami` (arriba) trataba CUALQUIER 401
   (portal) o 401/403 (admin) igual: limpiar sesión y `irALogin()`.
3. **Causa raíz:** "Cuenta sin cliente asociado"/"cuenta no habilitada"
   son un estado del NEGOCIO, no de sesión — ningún login nuevo lo
   arregla, porque la cuenta sigue sin cliente después de reautenticar.
   Redirigir a login en ese caso desencadenó el bucle: identity ya tenía
   la autorización de agente24siete consentida de una sesión anterior, así
   que auto-aprobaba sin pedir credenciales (mismo comportamiento
   documentado en `auth-sorsabsa/src/app/auth/logout/page.tsx`), volvía a
   `/portal`, `whoami` fallaba otra vez por el mismo motivo real, y de
   nuevo a login — sin fin.
4. **Componente responsable:** `LoginGate.tsx` (portal y admin), la rama
   que decide qué hacer después de un 401/403 de `whoami`.
5. **Código afectado:** el mismo ya identificado arriba.
6. **Fix, commit `agente24siete@b505379`:** `LoginGate` ahora lee el
   cuerpo del error de `whoami` (`data.error === "Cuenta sin cliente
   asociado"` en portal; `res.status === 403` en admin) y en ESE caso
   muestra un estado terminal (pantalla centrada, sin sidebar, sin
   volver a login) en vez de redirigir. "Sin token"/"token vencido" siguen
   yendo a login igual que antes — ahí sí lo resuelve.
7. **Código a eliminar — autocrítica:** el primer intento de este mismo
   fix agregó un contador de "intentos de login" genérico en
   `sessionStorage`, presentado como red de seguridad "por si la causa
   era otra" — código para una causa **no identificada**, exactamente lo
   que este documento prohíbe. Gina lo señaló directo ("no sabes que es
   lo que pasa? esto es solución a medias") antes de que se publicara.
   Se sacó por completo antes del commit final — no quedó rastro en el
   código, solo en esta nota.
8. **Riesgo de regresión:** bajo — el cambio queda acotado a la rama
   exacta que causó el bucle; el resto del flujo (sin token, vencido) no
   se tocó.
9. **Validación pendiente, la hace Gina:** repetir el mismo flujo (landing
   → Google → cuenta sin cliente) y confirmar que llega a una sola
   pantalla centrada, sin volver a rebotar contra `auth.sorsabsa.com`.

**10-ago-2026, mismo día — el bucle SEGUÍA después del fix de arriba.**
Gina, directo: *"aunque sea por otra causa???? no sabes que es lo que
pasa? no logras identificarla? esto es solución a medias, no seguiste
el ESTANDAR-DESARROLLO.md"* — señalando, con razón, que el fix anterior
había agregado un contador de reintentos "por si la causa era otra" SIN
identificar ninguna otra causa real. Se sacó ese contador por completo
(no quedó código, solo esta nota) y se investigó la causa real en vez de
seguir parcheando síntomas:

1. **Síntoma:** el bucle seguía — `agente24siete.app/portal` mostraba
   "Redirigiendo al acceso…" indefinidamente, rebotando entre `/portal` y
   `auth.sorsabsa.com`.
2. **Causa inmediata, encontrada leyendo código, no supuesta:**
   `auth-sorsabsa/src/lib/safe-redirect.ts:21` hace `new URL(requested)`.
   `LoginGate` mandaba `next` como ruta RELATIVA (`/portal`) — `new URL()`
   **tira excepción** con una ruta relativa (no hay base para
   resolverla). El `catch` de esa función trata cualquier excepción como
   "malformado" y devuelve siempre `config.redirectUrl`, el destino por
   defecto — nunca el `/portal` real que se había pedido.
3. **Causa raíz:** en `auth-sorsabsa/auth/complete/page.tsx`, cuando el
   destino resuelto es exactamente `redirectUrl` (`sinDestinoEspecifico`),
   se usa `callbackUrl` en su lugar — que en `apps.ts`, para
   agente24siete, apuntaba a `https://www.agente24siete.app/auth/callback`
   (CON `www.`), mientras `redirectUrl`/`allowedHosts[0]` es
   `https://agente24siete.app` (SIN `www.`). Son dos orígenes distintos
   a nivel de navegador — `localStorage` y las cookies sin `domain`
   explícito NO se comparten entre ellos. El token quedaba instalado en
   `www.agente24siete.app`, pero la navegación real seguía en
   `agente24siete.app` (sin www, como se ve en la barra de direcciones de
   la captura de Gina) — cada vuelta a `/portal` encontraba el origen
   "vacío", volvía a pedir login, y el ciclo se repetía indefinido. Este
   patrón de `next` relativo rompiendo `safe-redirect` es EXCLUSIVO de
   agente24siete: CondoManager y DomusCRM arman su `next` como URL
   absoluta (`window.location.origin + ...`) en el código equivalente —
   nunca tocaron esta rama rota.
4. **Componente responsable:** `LoginGate.tsx` (agente24siete, construye
   el `next` relativo) y `apps.ts` (auth-sorsabsa, `callbackUrl`
   desalineado) — dos causas, en dos repos, que se combinan para producir
   el síntoma.
5. **Código afectado:** `app/portal/LoginGate.tsx`,
   `app/admin/LoginGate.tsx`, `app/auth/callback/page.tsx` (agente24siete);
   `src/lib/apps.ts` (auth-sorsabsa).
6. **Fix, commits `agente24siete@87c5216` y `auth-sorsabsa@d693e0a`:**
   `next` ahora viaja absoluto (`origin + pathname + search`) — nunca cae
   al fallback. `auth/callback` ajustado para leer `esPortal` del
   `pathname` de una URL absoluta (antes comparaba con
   `next.startsWith('/portal')`, que dejaba de matchear con un `next`
   absoluto). `callbackUrl` corregido para coincidir con `redirectUrl`
   (sin `www`), como defensa adicional aunque el fix principal ya evita
   que ese fallback se dispare.
7. **Código a eliminar:** ninguno nuevo — el contador de la iteración
   anterior ya se había sacado por completo antes de este commit.
8. **Riesgo de regresión:** bajo — cambia el FORMATO de `next` (relativo
   → absoluto) pero no la lógica de negocio; verificado que
   `resolveSafeRedirect` y `esPortal` manejan el nuevo formato
   correctamente por lectura de código, y `next build` completo
   compiló limpio en los dos repos (confirmado por el listado real de
   rutas en la salida, no solo el código de salida).
9. **Validación pendiente, la hace Gina:** repetir el flujo completo
   (login normal, y el caso de cuenta sin cliente) y confirmar que ya NO
   rebota — ni entre `/portal` y `auth.sorsabsa.com`, ni por el motivo
   original de 🟠-2/`whoami`.

---

### 🔴-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@16ef1db` — Los 11 endpoints de `pages/api/admin/` llamaban a `autenticarAdmin` sin `await`: el `if (!usuario) return` nunca se cumplía y el cuerpo del handler se ejecutaba con la sesión rechazada

**1. Síntoma:** ninguno visible. Nadie reportó nada — las respuestas seguían
siendo 401 y 403 correctos, así que desde afuera el panel parecía autenticado.
Se encontró leyendo los endpoints para construir la pantalla `/admin/clientes`,
no por una falla observada. Esto es parte del hallazgo: **un agujero de
autenticación que devuelve el código de estado correcto no se manifiesta.**

**2. Causa inmediata:** el patrón repetido en cabecera de cada handler:

```js
const usuario = autenticarAdmin(req, res);   // sin await
if (!usuario) return;
```

`autenticarAdmin` es `async`. Una función `async` devuelve **siempre** una
Promesa, y una Promesa es **siempre** truthy — incluso la que va a resolver a
`null`. Así que `if (!usuario)` nunca es verdadero y **el `return` nunca se
ejecuta**. El handler sigue de largo hacia su lógica de negocio mientras la
comprobación de sesión corre en paralelo, sin nadie esperándola.

Comprobado con una reproducción del patrón exacto (no deducido):

```
>> el cuerpo del handler SE EJECUTÓ pese al 401
RESPUESTA AL CLIENTE: 401 No autorizado
(descartado 200)
```

**3. Causa raíz:** `autenticarAdmin` cambió a `async` en la Fase 3, cuando el
panel dejó de firmar su propio JWT y pasó a verificar el token del portero
contra el JWKS (`await jwtVerify`) más un `SELECT` sobre `usuarios`. Los call
sites venían de la versión síncrona anterior y **no se actualizaron**. Nada lo
detectó: no hay TypeScript en `pages/api/**` (son `.js`), y ninguna prueba
ejercita un endpoint admin con sesión inválida. El equivalente del portal
—`autenticarCliente`, mismo cambio, mismo día— sí quedó con `await` en sus 12
call sites; el admin quedó atrás y nadie volvió a mirar.

**4. Componente responsable:** los call sites, no `autenticarAdmin`. La función
hace lo correcto; el contrato "hay que esperarla" no estaba escrito en ningún
lado y se perdió en la migración.

**5. Código afectado:** los 11 endpoints de `pages/api/admin/` —
`acceso-cliente`, `clientes`, `conocimiento`, `contactos`, `conversaciones`,
`estadisticas`, `leads`, `negocios`, `pagos`, `pipelines`, `usuarios`. El único
correcto era `whoami.js`, escrito después, ya con `await`.

**6. Impacto real — dos cosas distintas, y la segunda es la grave:**

*(a) Los efectos secundarios corrían igual.* Independientemente de quién ganara
la carrera por la respuesta, el cuerpo del handler se ejecutaba: `crearCliente`
insertaba en la base, `crearTrialCliente` llamaba a pagos-sorsabsa, y
`acceso-cliente` llegaba hasta `createUser` **en el Supabase de identidad
compartido de todo el ecosistema**. Un POST con un token cualquiera creaba
identidades aunque el emisor recibiera 401.

*(b) La lectura podía filtrarse.* Quién responde primero es una carrera:

| caso | camino de la comprobación | camino del handler | quién gana |
|---|---|---|---|
| sin header `Authorization` | responde 401 **antes del primer `await`**, o sea síncrono | ni arranca | la comprobación, siempre |
| `Bearer` con basura | `jwtVerify` falla rápido (ni parsea) | consulta a Postgres | la comprobación, por poco |
| **token válido de alguien que NO es admin** | `jwtVerify` **+ `SELECT` sobre `usuarios`** | **un solo `SELECT`** | **puede ganar el handler** |

El tercer caso es el que importa: identity es **una sola** para todo SORSABSA,
así que cualquier persona con cuenta en cualquier producto —un cliente de
CondoManager, por ejemplo— tiene un token que `jwtVerify` acepta. A partir de
ahí la comprobación necesita una consulta más que el handler, y la lista
completa de clientes de agente24siete podía salir antes que el 403.

Verificado en producción para los dos primeros casos (`curl` sin header y con
`Bearer no-soy-un-token` contra `www.agente24siete.app/api/admin/clientes`):
401 en ambos. El tercero no se probó en vivo — habría exigido crear una
identidad real en el proyecto compartido — y no hacía falta: el fix es
correcto gane quien gane la carrera, y (a) ocurre en los tres casos.

**7. Fix aplicado:** `await` en los 11 call sites. Nada más — no hay cambio de
diseño, la comprobación siempre estuvo bien escrita.

**8. Lo que impide que vuelva:** el contrato quedó escrito en el docblock de
`lib/adminAuth.js`, con el porqué y con la fecha. Es lo único que hoy lo
sostiene: **no hay comprobación automática que lo detecte**, y no la habrá
mientras `pages/api/**` sea `.js` sin tipos (con TypeScript, `if (!promesa)`
sobre un `Promise<T | null>` no da error tampoco — habría que mirar
`@typescript-eslint/no-floating-promises`, que sí lo marca). Anotado como
pendiente, no resuelto.

**9. Riesgo de regresión:** ninguno. Agregar `await` solo hace que el `return`
funcione como siempre se pretendió. `npx tsc --noEmit` y `npm run build`
limpios; los 11 endpoints siguen compilando y respondiendo igual ante sesión
válida.

**Nota de método.** Esto no lo encontró ninguna auditoría de seguridad ni
ningún check: apareció al ir a construir la pantalla que faltaba. Es el mismo
patrón que 🔴-5 de `AUDITORIA-PORTERO-SSO.md` y que el `pipefail` del check de
conformidad — **lo que no se ejecuta de verdad no se sabe si funciona**, y una
comprobación de seguridad que devuelve el código correcto por accidente es
indistinguible de una que funciona.

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

### 🟠-3 — ✅ RESUELTO 10-ago-2026 (era la hipótesis (b): configuración) — ¿el mensaje de Gina fue realmente por vencimiento, o hay un problema de configuración?

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

**✅ Respuesta, 10-ago-2026 — era (b), configuración, no vencimiento
natural.** `AUDITORIA-PORTERO-SSO.md` 🔴-12 lo cerró: agente24siete
verificaba el JWT contra su PROPIO proyecto Supabase
(`nwcqaginlnzjlkgwifas`) cuando quien realmente emite la sesión del login
por SSO es `verticales_sorsabsa`. El encabezado de este hallazgo siguió
diciendo "pendiente de verificar" hasta el 16-ago-2026 aunque la sección
de cierre de este mismo documento ya daba la respuesta — corregido acá
para que las dos partes digan lo mismo.

### 🟠-4 — 🔧 CORREGIDO 16-ago-2026, commit `agente24siete@61760c5`, falta la prueba en vivo de Gina — "Salir" borra el `localStorage` pero deja viva la cookie de sesión — el gate del SERVIDOR sigue viendo sesión válida hasta 60 minutos después de cerrarla. Encontrado 16-ago-2026

**1. Síntoma:** después del clic en "Salir", volver a `/portal` (o
`/admin`) hace que `middleware.ts` —el gate del servidor, la pieza que
🔴-1 construyó justamente para decidir antes de servir HTML— deje pasar
la petición y sirva la página: para él la sesión sigue vigente. Recién
`LoginGate`, ya en el navegador, encuentra el `localStorage` vacío y
rebota al portero. Nadie llega a ver datos ajenos (cada llamada a
`pages/api/**` sigue exigiendo el `Authorization: Bearer` que salió del
`localStorage` borrado), pero el JWT sigue existiendo en el navegador
—legible por cualquier JS del origen, y enviado en cada petición— hasta
60 minutos después de que la persona creyó haber salido.

**2. Causa inmediata:** `components/SignOutButton.tsx:16` hace solo
`localStorage.removeItem(tokenKey)`. La cookie `a24_cliente_token` /
`a24_admin_token` no se toca.

**3. Causa raíz — dos fixes del mismo día que nunca se cruzaron:** el
botón (🟠-1, commit `c6f2578`) se escribió cuando agente24siete guardaba
la sesión SOLO en `localStorage`, y su propio comentario lo dice como
justificación: *"agente24siete guarda su sesión en localStorage, no en
cookies"*. Horas más tarde, el fix de 🔴-1 (commit `89429ff`) agregó la
cookie precisamente para que el middleware pudiera decidir del lado del
servidor — y nadie volvió al logout. Esa frase quedó falsa el mismo día
en que se escribió. La regla correcta ya existe en el repo:
`limpiarSesionLocal()` borra las dos cosas… escrita dos veces, una en
cada `LoginGate`, y el logout no usa ninguna. Es la duplicación de la
misma regla en tres lugares que `ESTANDAR-DESARROLLO.md` marca — el fix
no es "agregarle una línea al botón".

**4. Componente responsable:** `components/SignOutButton.tsx`, más la
ausencia de un único lugar donde viva "cerrar la sesión local".

**5. Código afectado:** `components/SignOutButton.tsx`;
`app/portal/LoginGate.tsx::limpiarSesionLocal` y
`app/admin/LoginGate.tsx::limpiarSesionLocal` (las dos copias).

**6. Fix propuesto:** extraer `limpiarSesionLocal(tokenKey)` a un módulo
único (`lib/sesion.ts`) y llamarlo desde los tres lugares. Si solo se
parcha el botón, quedan tres copias de la regla y el próximo cambio en
cómo se guarda la sesión vuelve a dejar una atrás — que es exactamente
lo que pasó acá.

**7. Código que debe eliminarse:** las dos definiciones locales de
`limpiarSesionLocal`, y el comentario de `SignOutButton.tsx:7-10` que
afirma que la sesión no vive en cookies.

**8. Riesgo de regresión:** bajo — borrar de más al salir no puede dejar
a nadie adentro, y el camino de login no se toca.

**9. Validación:** entrar a `/portal`, clic en "Salir", y en DevTools →
Application → Cookies confirmar que `a24_cliente_token` ya no existe (hoy
sigue ahí). Después volver a `agente24siete.app/portal`: debe redirigir
al portero sin que el servidor llegue a servir la página.

**Construido, commit `agente24siete@61760c5` — Gina: "adelante":**

- `lib/sesion.ts` nuevo: `limpiarSesionLocal(tokenKey)`, definición única.
- `app/portal/LoginGate.tsx` y `app/admin/LoginGate.tsx`: borraron su copia
  local y usan la compartida — de tres copias de la regla a una.
- `components/SignOutButton.tsx`: usa la compartida, y el comentario que
  afirmaba que la sesión no vive en cookies quedó corregido con la fecha en
  que dejó de ser cierto.
- Verificado con `tsc --noEmit` limpio y `next build` COMPLETO (no solo
  typecheck): rutas listadas en la salida real y bundle de Middleware
  (34.4 kB) generado.

⬜ **Falta el punto 9, lo hace Gina** — la comprobación que cierra esto no
es que compile: es ver la cookie desaparecer del navegador al salir.

**Actualización del mismo día (`agente24siete@c7102bf`):** `limpiarSesionLocal`
sigue viviendo en `lib/sesion.ts` y sigue siendo lo único propio de este
producto, pero ya no la llama un logout escrito acá: la llama
`salirDelEcosistema` de `@sorsabsa/ui` como su función de limpieza. O sea el
fix de este hallazgo se conserva entero; lo que cambió es quién arma la URL
del portero (ver 🟠-6 y `AUDITORIA-PORTERO-SSO.md` 🟠-7).

### 🟠-5 — ⬜ El `next` de agente24siete no apunta a su propio `/auth/callback`: el login solo termina por una cadena de fallbacks, con una vuelta entera de más por el portero. Encontrado 16-ago-2026

**1. Síntoma:** ninguno visible hoy — el login funciona, y por eso este
hallazgo no sale de una pantalla sino de leer el flujo completo. Lo que
hay es una vuelta entera de más por `auth.sorsabsa.com` en cada login que
arranca `LoginGate`, y una dependencia invertida: el flujo termina
**porque** el `next` del middleware está mal formado. Corregir eso solo
—dejarlo absoluto, la forma que 🔴-1 estableció como correcta— reinstala
el bucle infinito del 10-ago.

**2. Causa inmediata, verificada leyendo los cuatro archivos, no supuesta:**

- `LoginGate` (portal y admin) manda `next = <origen><ruta protegida>`
  (ej. `https://www.agente24siete.app/portal`). Ese host SÍ está en
  `allowedHosts`, así que `resolveSafeRedirect` lo honra y
  `auth/complete` entrega los tokens ahí:
  `https://www.agente24siete.app/portal#access_token=…`. **Ninguna página
  de `/portal` lee el fragment** — el único archivo del repo que lo hace
  es `app/auth/callback/page.tsx` (grep de `access_token` sobre todo
  `app/`: 1 solo resultado). Los tokens se pierden en esa vuelta.
- Esa misma navegación vuelve a pasar por `middleware.ts`, que no
  encuentra cookie (la borró `limpiarSesionLocal()` justo antes de salir)
  y redirige otra vez al portero — ahora con `next` RELATIVO (`/portal`).
  Ahí `new URL('/portal')` tira excepción, `resolveSafeRedirect` cae a
  `redirectUrl`, `auth/complete` detecta `sinDestinoEspecifico` y usa
  `callbackUrl`, y recién ahí los tokens aterrizan en `/auth/callback`,
  que sí sabe instalarlos. Segunda vuelta: sesión puesta, login termina.

**3. Causa raíz:** el contrato del portero es que `next` apunte a la
única página del producto que sabe canjear el fragment. CondoManager lo
cumple explícitamente (`app/login/page.tsx:166-174`: arma
`<origen>/auth/callback` y mete el destino real como query
`?redirect=&condominio=&asociacion=`, con la URL del portero centralizada
en `lib/auth/sso.ts`). agente24siete apunta `next` a la página protegida
en sí, y por eso necesita el fallback para funcionar. Encima sus dos
emisores de `next` están en formatos distintos: `LoginGate` absoluto
(desde `87c5216`) y `middleware.ts` relativo (desde `89429ff` — `git log
-- middleware.ts` tiene un único commit: el fix del `next` absoluto tocó
los dos `LoginGate` y el callback, y nunca volvió por el middleware).

- **Efecto colateral, por lectura de código + comportamiento
  especificado del navegador (el fragment se hereda cuando el `Location`
  del redirect no trae uno propio); no verificado en vivo todavía:** en
  esa vuelta extra el redirect del middleware sale desde una URL que
  todavía tiene el fragment con los tokens, así que
  `auth.sorsabsa.com/auth/login` los recibe y llama
  `identityClient.auth.setSession()` con ellos
  (`auth-sorsabsa/src/app/auth/login/page.tsx:98-105`) — tokens del
  proyecto de agente24siete contra el cliente de identity. Es la misma
  combinación que el comentario de `condomanager/app/login/page.tsx:63-72`
  documenta como fallida (*"setSession rechaza tokens de un proyecto
  Supabase distinto al del cliente"*). El resultado de esa llamada no se
  mira. Es lo primero a revisar si alguna vez el login vuelve a pedir
  contraseña sin motivo.

**4. Componente responsable:** `app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx` y `middleware.ts` — los tres construyen `next`
a mano, ninguno apunta a `/auth/callback`.

**5. Código afectado:** esos tres, más `app/auth/callback/page.tsx` (hoy
deduce el panel y el destino del `next` que viaja en el fragment).

**6. Fix propuesto:** una sola función (`lib/sso.ts`, misma pieza que
`condomanager/lib/auth/sso.ts`) que arme
`next = <origen>/auth/callback?destino=<ruta>`, usada por los tres
emisores. `/auth/callback` decide panel y redirección por `destino`, no
por el `next` del fragment. Con eso el destino siempre lo honra
`resolveSafeRedirect` (host ya en la allowlist), nunca se toca el
fallback de `callbackUrl`, y desaparece la vuelta extra. `/auth/callback`
queda fuera del `matcher` del middleware, como ya está hoy.

> ⚠️ **El fix parcial que NO hay que hacer:** "poner el `next` del
> middleware absoluto, para que sea igual al de `LoginGate`". Eso hace
> que `resolveSafeRedirect` honre `https://www.agente24siete.app/portal`
> en las DOS vueltas: los tokens caen siempre en una página que no los
> lee, el middleware nunca encuentra cookie, y como identity
> auto-aprueba la autorización ya consentida, el ciclo no termina nunca.
> Es el bucle infinito del 10-ago otra vez, por una causa distinta.

**7. Código que debe eliminarse:** las tres construcciones de `next` a
mano (los dos `irALogin()` y el bloque del middleware) y el respaldo de
`app/auth/callback/page.tsx:31-36` para el `next` relativo, que existe
solo para sostener este camino.

**8. Riesgo de regresión:** medio — toca los tres puntos de entrada de
sesión de un producto en producción con clientes reales (Punta Blanca).
`middleware.ts` corre en Edge: la función compartida no puede arrastrar
nada de Node (mismo cuidado que ya se tuvo con `tokenExpirado`).

**9. Validación:** los tres casos de siempre (sin token, token vencido,
cuenta sin cliente) en los dos paneles, más el conteo de saltos: con el
fix, un login que arranca en `/portal` debe pasar UNA sola vez por
`auth.sorsabsa.com` — hoy pasa dos, visible en la pestaña Network del
navegador con "Preserve log" activado.

### 🟠-6 — ✅ CORREGIDO Y ESTANDARIZADO 16-ago-2026 — La pantalla terminal encerraba a la persona: sin salir, sin volver a la web, sin poder pedir el alta

**Escrito el 16-ago-2026, tarde:** este hallazgo se corrigió y se commiteó
(`agente24siete@9512c52`) **antes** de quedar registrado acá, y tres archivos
del código lo citaban por número (`app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx`, `@sorsabsa/ui/src/components/SinAcceso.tsx`)
apuntando a una sección que no existía. Se detectó cruzando las citas del
código contra los números reales de cada auditoría. Queda escrito.

**1. Síntoma:** Gina, probando en vivo el login con su cuenta sin cliente
asociado: *"quiero ingresar y me deja encerrada en: Cuenta sin cliente
asociado… no me dice salir e iría a la web nuevamente y crear una cuenta, me
deja aquí."* La pantalla no tenía **ninguna** acción.

**2. Causa inmediata:** el estado terminal renderiza ANTES de `children`, así
que el sidebar —único lugar donde vivía "Salir" (🟠-1)— no existe en esa
pantalla, y la tarjeta no tenía acciones propias.

**3. Causa raíz:** el fix del bucle (`b505379`, ver 🔴-1) resolvió la mitad
del problema —dejar de reintentar un login que nunca va a funcionar— y no la
otra: **qué puede HACER la persona ahí.** Se convirtió un bucle infinito en
una pantalla sin salida. Y el "Salir" no es cosmético en este caso: la sesión
local ya está limpia, pero la de identity sigue viva y auto-aprueba la misma
cuenta, así que un enlace pelado a la web dejaría el próximo "Ingresar"
volviendo justo ahí.

**4. Componente responsable:** la rama del estado terminal de los dos
`LoginGate`.

**5. Código afectado:** `app/portal/LoginGate.tsx`, `app/admin/LoginGate.tsx`,
`components/SignOutButton.tsx`, `lib/sesion.ts`.

**6. Fix — en dos pasos, y el primero estuvo mal:**

1. **`agente24siete@9512c52`** agregó botones a esta pantalla y un
   `cerrarSesionCentral` propio en `lib/sesion.ts`. Desbloqueó a Gina, pero
   era **una variante más**: cada producto del ecosistema resolvía este mismo
   caso a su manera. Gina lo señaló en el acto: *"te había pedido que el
   portero maneje un estándar, pero en cada producto le haces trabajar de
   formas diferentes, entonces no hay estándar."*
2. **`agente24siete@c7102bf`** lo reemplazó por `<SinAcceso>` de
   `@sorsabsa/ui` v0.1.49+ — la pantalla y el contrato de salida compartidos
   por todo el ecosistema (`AUDITORIA-PORTERO-SSO.md` 🟠-7). Este repo solo
   aporta el texto de su regla de negocio.

**7. Código que debe eliminarse — ya eliminado:** el `cerrarSesionCentral` de
`lib/sesion.ts` (vivió unas horas) y las dos tarjetas propias. También sobró
el botón "Solicitar una cuenta" que había agregado el paso 1: con la regla de
Gina —*"un botón para salir, lo que le lleva a la web si es que la tiene"*—
salir ya deja a la persona en la landing, donde vive ese formulario.

**8. Riesgo de regresión:** bajo — es agregar acciones a una pantalla que no
tenía ninguna; no toca el gate ni el camino feliz.

**9. Validación — la hace Gina:** desde la pantalla "Cuenta sin cliente
asociado", clic en "Salir" → debe llegar a `agente24siete.app`, y un login
nuevo debe **pedir credenciales** (prueba de que cerró también la sesión de
identity, no solo la apariencia de haber salido).

---

## 🟡 MEDIO

### 🟡-1 — ⬜ El `refresh_token` se descarta: la sesión dura 60 minutos y se "renueva" con una vuelta completa por el portero. Encontrado 16-ago-2026

**1. Síntoma:** cada ~60 minutos de uso continuo la persona es rebotada
al portero. Hoy se ve como un parpadeo (identity auto-aprueba la
autorización ya consentida), pero si la sesión de identity venció
también, aparece el formulario de login en medio del trabajo, sin que
nada lo haya provocado.

**2. Causa inmediata:** `app/auth/callback/page.tsx:23` lee solo
`access_token` del fragment; el `refresh_token` que `auth/complete` manda
al lado se ignora, y la cookie se instala con `max-age=3600` fijo, sin
relación con el `exp` real del token.

**3. Causa raíz:** agente24siete no usa el cliente de Supabase para
sostener su sesión — es el patrón "JWKS stateless" de FASE 3, legítimo y
ya documentado (ver la sección "Resuelto con Gina"). Pero ese patrón no
trae renovación incluida y nadie la escribió. CondoManager no tiene el
problema porque su SDK renueva solo.

**4. Componente responsable:** `app/auth/callback/page.tsx` — es quien
recibe y tira el `refresh_token`.

**5. Código afectado:** ese archivo, más donde viva la renovación.

**6. Fix propuesto — no decidido a propósito, hay dos caminos y no dan
lo mismo:** (a) guardar el `refresh_token` y renovar contra el proyecto
emisor antes de que venza, o (b) aceptar la vuelta por el portero COMO el
mecanismo de renovación — y entonces 🟠-5 hay que arreglarlo primero, para
que esa vuelta sea un solo salto silencioso y no dos. Elegir antes de
escribir código: 🟠-5 cambia el costo real de (b).

**7-8.** N/A hasta decidir.

**9. Validación:** dejar `/portal` abierto más de una hora con una sesión
real y registrar qué pasa exactamente al minuto 60 — hoy no está
observado, solo deducido del código.

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

- **16-ago-2026 — tres hallazgos nuevos, ninguno tocado todavía.** Salieron
  de revisar el estado real del código contra lo que este documento daba por
  cerrado, no de una pantalla nueva: 🟠-4 (el logout no borra la cookie que
  el middleware sí mira), 🟠-5 (el `next` no apunta al `/auth/callback`
  propio: el login termina por una cadena de fallbacks, con una vuelta de
  más) y 🟡-1 (el `refresh_token` se tira). Los tres con su análisis de 9
  puntos arriba. Orden sugerido: **🟠-4 primero** (chico, cerrado, riesgo
  bajo, y es una sesión que sigue viva después de "Salir"), 🟠-5 después
  (más grande y con una trampa explícita anotada), y 🟡-1 al final porque su
  costo depende de cómo quede 🟠-5.
  - **🟠-4 construido el mismo día** (`agente24siete@61760c5`, Gina:
    "adelante") — falta solo su punto 9 en vivo.
  - **🟠-5 y 🟡-1 siguen sin tocarse**, esperando decisión.
- **10-ago-2026:** 🟠-1 (Salir), 🟠-2 (chequeo de vigencia), 🔴-1
  (`middleware.ts` + cookie + `whoami` para el tercer caso), el fix del
  bucle de "cuenta sin cliente", y la causa real del bucle que persistía
  (`next` relativo + `callbackUrl` desalineado) — commits
  `agente24siete@c6f2578`, `agente24siete@89429ff`,
  `agente24siete@6325176`, `agente24siete@b505379`,
  `agente24siete@87c5216` y `auth-sorsabsa@d693e0a`. typecheck y `next
  build` completo limpios en todos.
- **✅ Validado en vivo por Gina, 10-ago-2026:** login completo con la
  cuenta de prueba (sin cliente asociado) → una sola pantalla centrada,
  marca correcta, sin sidebar, sin rebotar contra `auth.sorsabsa.com`.
  Los 3 casos del punto 9 quedan cubiertos: sin token → login (probado en
  todo este ciclo), token vencido → login (🟠-2), cuenta sin cliente →
  pantalla terminal (probado hoy en vivo, el caso que faltaba).
- **La causa de fondo era `AUDITORIA-PORTERO-SSO.md` 🔴-12** (agente24siete
  verificaba el JWT contra su propio proyecto Supabase en vez de contra
  `verticales_sorsabsa`, que es quien realmente emite la sesión en el
  login por SSO) — **también resuelve 🟠-3**, que quedaba "no
  diferenciado": era un problema de configuración, no vencimiento
  natural.
- **Hallazgo adicional, descubierto por este mismo fix:** una vez que el
  JWT empezó a verificar bien, apareció un segundo problema —
  `DATABASE_URL` de agente24siete usaba el hostname de conexión directa a
  Postgres (`db.<proyecto>.supabase.co`), que requiere IPv6 y las
  funciones serverless de Vercel no siempre resuelven — `getaddrinfo
  ENOTFOUND`. Estaba oculto porque el login nunca pasaba de la
  verificación de JWT antes de hoy. **Corregido:** `DATABASE_URL`
  reemplazada por la cadena del "Transaction pooler" de Supabase.
  Detalle completo en `AUDITORIA-PORTERO-SSO.md` 🔴-12.
- **Dato verificado en producción hoy (16-ago-2026) que corrige el
  razonamiento escrito en 🔴-1:** `curl` real contra
  `https://agente24siete.app/portal` responde **308 → `www.agente24siete.app`**.
  O sea el origen canónico en producción es **www**, no el apex (es una
  configuración de dominio en Vercel: no hay ninguna redirección en
  `vercel.json` ni en `next.config.mjs`). `apps.ts` tiene hoy
  `redirectUrl`/`callbackUrl` apuntando al apex — funciona igual porque el
  navegador conserva el fragment al seguir un 308, así que los tokens
  llegan a www de todos modos, y `allowedHosts` ya cubre los dos hosts. Se
  anota porque el análisis de 🔴-1 razonó sobre la premisa contraria ("la
  navegación real seguía en `agente24siete.app`"): si alguna vez el apex
  pasa a servirse directo, sin la redirección, los dos orígenes se separan
  de nuevo y ese bug renace.
- **22-ago-2026 — esa fragilidad ahora sostiene una cosa más que cuando se
  escribió la nota de arriba.** Desde que existe `middleware.ts`, el gate de
  página no lee `localStorage`: lee la **cookie** `a24_admin_token` /
  `a24_cliente_token` que escribe `app/auth/callback`. Y esa cookie se pone con
  `document.cookie` sin atributo `domain`, o sea **host-only**: vale para el
  host exacto donde corrió la página, no para sus hermanos. Hoy funciona
  porque `https://agente24siete.app/auth/callback` responde **308 → www**
  *antes* de que la página se ejecute (verificado hoy con `curl`: apex 308 a
  www en `/`, `/auth/callback` y `/admin/*`; www responde 200), así que el
  callback corre ya en www y la cookie nace en www — el mismo host donde el
  middleware la va a buscar.

  Si el apex alguna vez se sirve directo, el callback correrá en el apex, la
  cookie será del apex, `window.location.replace(next)` mandará al apex, y el
  308 llevará a www **con una cookie que www no recibe**: el middleware no ve
  sesión, rebota al portero, identity auto-aprueba porque ya hay sesión,
  vuelve al callback… **bucle infinito de login**, no un simple "aterricé en
  la página equivocada". Es el mismo patrón que ya costó 34 vueltas en los
  logs de SorsabsaForensic. Se anota acá porque el arreglo, si llega ese día,
  no es tocar el callback: es que `callbackUrl` en `auth-sorsabsa/src/lib/
  apps.ts` apunte al host canónico real.
- **Corrección sobre el plan original — `LoginGate.tsx` NO se borra.** El
  punto 7 de este hallazgo decía eliminarlo "una vez que el middleware
  cubra su función" — eso era cierto para el chequeo de vigencia (🟠-2),
  pero desde el fix del caso "cuenta sin cliente" (mismo día, más tarde),
  `LoginGate` también hace la consulta a `whoami` que confirma la
  asociación a un cliente/usuario real — algo que `middleware.ts` **no
  puede hacer** desde Edge (sin acceso a la base). Borrarlo eliminaría la
  única capa que cubre ese caso. Queda como está, a propósito — no es
  duplicación sin sentido, es la pieza que middleware estructuralmente no
  puede reemplazar sin convertirse en un middleware Node con acceso a
  base (cambio de arquitectura mayor, no evaluado hoy).
