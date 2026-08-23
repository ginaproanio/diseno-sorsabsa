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
`lib/supabaseAdminIdentity.js`. **Ampliado el 22-ago-2026** con las piezas que
los hallazgos de ese día incorporaron y que no existían al abrir: `middleware.ts`,
`lib/sesion.ts`, `lib/jwt.ts`, `app/admin/AdminNav.tsx` y los 11 endpoints de
`pages/api/admin/**` (🔴-2). Comparado contra el patrón YA probado y
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

### 🔴-3 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@bd3a7a6` — El producto nunca preguntaba QUIÉN SOS: decidía "administradora o clienta" mirando la URL pedida, y `usuarios`/`clientes` solo servían para rechazarte después

**1. Síntoma.** Gina, después de chocar tres veces contra la misma pantalla:
*"si se creó el administrador, ¿nunca validás que es administrador?????? si
es usuario administrador va al portal, caso contrario es cliente, ¿tiene
negocio????? por dios despierta al arquitecto o es que yo no entiendo qué
diablos hizo"*. Tenía razón en las tres preguntas.

**2. Causa inmediata.** Dos líneas gobernaban todo el ruteo del producto:

```js
app/auth/callback:  const esPortal = pathname.startsWith("/portal")
middleware.ts:      const esAdmin  = path.startsWith("/admin")
```

El producto decidía qué eras **según la URL que habías pedido**, y guardaba la
sesión en una llave u otra según esa adivinanza. Ni el callback ni el
middleware consultaban jamás `usuarios` ni `clientes`.

**3. Causa raíz — un error de modelo, no un olvido.** Los dos `whoami`
existían y funcionaban, pero se llamaban **después** del ruteo y solo para
**rechazar**. Nadie preguntaba antes, porque el producto no tenía el concepto
de "¿qué lugar tiene esta persona acá?". Tenía el concepto inverso: "esta URL
pertenece a los admin, aquella a los clientes, y quien llegue se supone que
corresponde".

De ahí salen, como consecuencias del MISMO error, tres hallazgos que se
trataron por separado creyéndolos independientes:

| hallazgo | lo que se veía | lo que era |
|---|---|---|
| 🟠-4 (2ª mitad) | "Salir" no sacaba | dos llaves de sesión, porque "panel" y "portal" se modelaban como dos sesiones |
| 🟠-7 | la pantalla no decía la cuenta | nadie había resuelto la identidad, así que no había qué mostrar |
| 🟠-8 | callejón cerrado en círculo | la puerta pública asume que quien entra es cliente |

**Los tres son el mismo defecto visto por tres ventanas.** 🟠-8 en particular
se "arregló" horas antes agregando un botón a la pantalla de rechazo: un
parche sobre el síntoma, y así lo señaló Gina.

**4. Componente responsable.** Faltaba uno: la autoridad que responde qué
lugar tiene una persona en este producto. No existía.

**5. Código afectado:** `app/auth/callback/page.tsx`, `middleware.ts`,
`app/portal/LoginGate.tsx`, `app/admin/LoginGate.tsx`, `lib/sesion.ts`, y las
14 pantallas que leían la llave de sesión a mano.

**6. Fix aplicado.**

- **`pages/api/quien-soy.js`** (nuevo): resuelve contra `usuarios` y
  `clientes`, informa si el cliente tiene negocios —un cliente sin negocio
  entra al portal y no ve nada, la tercera pregunta de Gina— y devuelve
  `destino` **ya calculado**. La regla de ruteo vive en un solo lugar en vez
  de copiada en cuatro. Reconcilia ANTES de consultar, o un cliente recién
  dado de alta se vería "sin lugar" justo en su primer login.
- **Una sola llave de sesión** (`a24_token`). Una persona tiene una identidad
  y una sesión; "panel" y "portal" son dos permisos sobre la misma.
- **El callback rutea por identidad** y respeta un enlace directo solo si esa
  persona tiene lugar ahí.
- **Los gates dejan de establecer identidad y solo autorizan.** Que cada uno
  ofrezca el otro lado sale del mecanismo, no de un caso especial.

**7. Código eliminado** (pregunta 15) — no dejado "por las dudas":
`pages/api/admin/whoami.js`, `pages/api/portal/whoami.js`,
`pages/api/auth/reconciliar-cliente.js` (su regla vive ahora en
`lib/clientes.js`, con dos llamadores y una definición), **el parche de 🟠-8**,
el parámetro `tokenKey` de `limpiarSesionLocal` —la deuda anotada esa misma
noche, retirada en el mismo commit—, la constante `TOKEN_KEY` repetida en 14
archivos, y la tarjeta de `/admin` que pedía **pegar el token a mano en un
`<input>`**, cuyo propio texto decía que el login real "se implementa en la
Fase 3" (implementada desde el 10-ago), más cinco tarjetas muertas iguales.

**8. Riesgo de regresión — medio, y con una consecuencia visible.** Al cambiar
la llave, **toda sesión abierta deja de valer y hay que entrar una vez más**;
las llaves viejas quedan en la lista de BORRADO para que la primera visita
limpie el navegador. El riesgo es bajo hoy porque `clientes` tiene **cero
filas** (verificado esta noche contra la base): las evaluaciones de riesgo de
🔴-1 y 🟠-5 hablan de *"clientes reales (Punta Blanca)"* y **esa premisa ya no
es cierta** — se corrige acá para que nadie siga calculando con ella.

**9. Validación.** ✅ `tsc --noEmit` y `next build` completos, con
`/api/quien-soy` registrado y los tres endpoints viejos ausentes del listado
de rutas. ⬜ **La prueba real la hace Gina**: entrar por `/portal`, por
`/admin` y por el "Ingresar" de la web, y confirmar que las tres terminan en
el panel sin pasar por ninguna pantalla de rechazo. ❌ **Sin prueba
automática** (pregunta 17): este repo no tiene suite de navegador. Lo que
sostiene el diseño no es un test, es que la pregunta tiene un solo dueño y la
respuesta un solo formato.

**Deuda anotada (regla 6):** las dos llaves viejas siguen en la lista de
borrado de `lib/sesion.ts`. Se quitan cuando no quede ninguna viva — duran 60
minutos.

**Nota de método.** Este hallazgo no lo encontró una auditoría: lo encontró
Gina gritando que despertáramos al arquitecto, después de que se le ofreciera
un parche. Los tres hallazgos que resultaron ser síntomas de éste
—🟠-4, 🟠-7, 🟠-8— se habían analizado con los 9 puntos cada uno, y **ninguno
de los tres análisis levantó la cabeza para preguntar por qué el producto
nunca resolvía la identidad**. La señal estaba escrita en
`ESTANDAR-DESARROLLO.md`: *"Fix sobre fix: al reconocer esta cadena, no
agregar otro eslabón — retroceder hasta la primera decisión arquitectónica
incorrecta."* Hubo tres eslabones en un día antes de retroceder.

---

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

### 🟠-4 — ✅ CERRADO 22-ago-2026 en DOS pasos (`agente24siete@61760c5` + `agente24siete@628c84a`) — "Salir" no sacaba. Primero por la cookie; después, descubierto al ejecutar por fin el punto 9, porque borraba UNA de las DOS llaves de sesión. Encontrado 16-ago-2026, cerrado el 22-ago-2026

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

---

#### 22-ago-2026 — el punto 9 se ejecutó por fin, seis días después, y el fix estaba a la mitad

Arriba quedó escrito: *"⬜ Falta el punto 9, lo hace Gina — la comprobación
que cierra esto no es que compile: es ver la cookie desaparecer del navegador
al salir."* Estuvo seis días sin ejecutarse. El día que se ejecutó, no falló
por la cookie —eso sí estaba bien— sino por algo que el análisis original no
había mirado. **Regla 2 de la parte II, en su forma más cara: la comprobación
existía, estaba bien escrita, y no la corría nadie.**

**1. Síntoma.** Gina, probando en vivo: *"ingrese cuando me dijiste y salí,
volví a ingresar y ya no pude"*, y después, con la observación que resolvió el
caso: *"parece que tomara el perfil de patricio.marmol@hotmail.com que está
preescrito y no le importa que yo presione google para ingresar"*.

**2. Causa inmediata.** `limpiarSesionLocal(tokenKey)` recibía UNA llave y
borraba UNA llave. El panel le pasa `a24_admin_token`; el portal,
`a24_cliente_token`. Salir de un panel dejaba la sesión del otro viva —en
`localStorage` **y** en su cookie— hasta 60 minutos.

**3. Causa raíz — y no es "faltó una línea".** El producto modela la sesión
**por panel**; el portero la modela **por persona**. Son dos componentes
decidiendo distinto sobre el mismo concepto, que es exactamente lo que la
sección *Fuente única de verdad* de `ESTANDAR-DESARROLLO.md` marca como
hallazgo arquitectónico en sí mismo, no como coincidencia.

El fix del 16-ago heredó el parámetro `tokenKey` del código que venía a
reemplazar sin preguntarse si ese parámetro **debía existir**. La pregunta 15
—*"¿qué código debería eliminarse?"*— se respondió sobre las dos copias
duplicadas de la función, y no sobre su firma. Unificar tres copias de una
regla equivocada da una sola copia equivocada.

**4. Componente responsable:** `lib/sesion.ts` — es quien sabe qué guarda este
producto y dónde, y por lo tanto quien tiene que saber que son dos cosas.

**5. Código afectado:** `lib/sesion.ts`; y los tres que le pasan `tokenKey`
(`app/portal/LoginGate.tsx`, `app/admin/LoginGate.tsx`,
`components/SignOutButton.tsx`).

**6. Impacto real — por qué se veía como "no me deja entrar".** Con el token
viejo todavía vigente, `middleware.ts` dejaba pasar la petición y `LoginGate`
daba la sesión por buena, así que **`app/auth/callback` nunca llegaba a
correr** y el token nuevo nunca se guardaba. De ahí la frase de Gina: el
producto ya había decidido con la sesión anterior antes de que Google entrara
en la historia. Y lo que lo convierte en fallo y no en comodidad:
`salirDelEcosistema` **sí** destruye la sesión en `sorsabsa-identity`
—verificado contra `auth.sessions`: las sesiones previas desaparecieron y se
crearon dos nuevas a las 17:51:12 hora Ecuador— así que quedaba un token local
válido para una identidad que **ya no existía**. El mismo defecto que este
hallazgo denunciaba el 16-ago, por la otra mitad.

**7. Fix, commit `agente24siete@628c84a`:** `limpiarSesionLocal` borra las DOS
llaves, `localStorage` y cookie. La lista (`LLAVES_DE_SESION`) vive en el
módulo que borra, no en el que escribe. El parámetro se conserva y **se ignora
a propósito**: no hay ningún caso legítimo en el que salir de un panel deba
dejarte dentro del otro, en el mismo navegador y con la identidad central ya
cerrada.

**8. Código que debe eliminarse — anotado, NO retirado hoy:** el argumento
`tokenKey` en los tres call sites y en la firma. Se dejó por compatibilidad
para que el fix llegara en un commit chico y verificable mientras Gina estaba
bloqueada. **Queda como deuda a retirar** (parte II, regla 6): se borra cuando
se toque cualquiera de esos tres archivos por otro motivo. Mientras siga ahí,
un parámetro ignorado es una invitación a creer que hace algo.

**9. Riesgo de regresión:** bajo — borrar de más al salir no puede dejar a
nadie adentro. El único efecto observable es que cerrar sesión en un panel
ahora también cierra el otro, que es lo que se pretende.

**Validación — y acá hay que ser exacto sobre qué se comprobó y qué no:**

- ✅ Verificado en la base de identity que el logout central destruye las
  sesiones (las de las 17:23/17:31 desaparecieron; aparecieron las de 17:51).
- ✅ `tsc --noEmit` y `next build` completos, limpios.
- ⬜ **Falta la prueba en vivo**: salir del panel y confirmar que en
  DevTools → Application ya no está NI `a24_admin_token` NI
  `a24_cliente_token`, en cookies y en localStorage. Se anota explícitamente
  porque es el mismo punto 9 que estuvo seis días sin ejecutarse y cuya
  ausencia dejó este hallazgo medio abierto sin que nadie lo supiera.
- ❌ **Ninguna prueba automática fallaría si esto volviera mañana.** Es la
  respuesta honesta a la pregunta 17 de la parte II. No hay suite de
  navegador en este repo y no se creó una hoy. Anotado como pendiente real,
  no como algo cubierto.

**Nota de método, para no repetirla.** El 16-ago este hallazgo se dio por
"corregido, falta la prueba de Gina" y el encabezado dijo 🔧 durante seis
días. En ese estado es indistinguible de "cerrado" para quien lo lee rápido —
y de hecho se le construyó encima. La lección no es "probar más": es que un
hallazgo cuya validación no se ejecutó **no está corregido**, y su encabezado
tiene que decirlo con la misma fuerza que lo diría un ⬜.

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

**22-ago-2026 — trazado en vivo, y una hipótesis mía que resultó FALSA.** Al
construir `/admin/clientes` se vio que `middleware.ts` manda
`next=%2Fadmin%2Fclientes` (relativo) y se sospechó que el enlace directo a
una ruta profunda se perdía después del login: `resolveSafeRedirect` no puede
resolver una ruta relativa y cae a `redirectUrl`. **Es cierto y no importa.**
Siguiendo el flujo completo en el código, `auth/complete` arma el fragment con
`…&next=${encodeURIComponent(next)}` usando el `next` ORIGINAL, no el destino
resuelto — así que la ruta pedida viaja aparte y sobrevive; y
`app/auth/callback/page.tsx` tiene un `catch` explícito para el `next`
relativo. El destino profundo llega bien.

Se anota por dos motivos. Uno: **evita que alguien "arregle" esto rompiéndolo**
— la trampa ya está escrita en el punto 6 de este hallazgo y ahora hay un
segundo motivo para no tocarlo a la ligera. Dos: es un caso de método. La
sospecha era razonable, encajaba con el bug real del 10-ago, y era **falsa**;
lo único que la descartó fue seguir el dato por los cuatro archivos en vez de
informarla. Este hallazgo sigue ⬜ **abierto**: la vuelta de más por el portero
existe igual, que es lo que denuncia desde el 16-ago.

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

### 🟠-7 — ✅ CORREGIDO 22-ago-2026 (`6684e54`) · **síntoma de 🔴-3** — Las dos pantallas de rechazo nunca dicen CON QUÉ CUENTA te está rechazando, y con una identidad compartida eso vuelve indistinguible "te rechacé" de "estoy roto"

**1. Síntoma.** Gina, entrando a `/admin/clientes`: *"dice: Cuenta no
habilitada"*. Y al reintentar por otra vía: *"si hago el acceso por google
dice: Cuenta sin cliente asociado"*. Las dos pantallas correctas, las dos
inútiles: ninguna dice de quién habla.

**2. Causa inmediata.** Los dos `LoginGate` pasan a `<SinAcceso>` un `mensaje`
que es una cadena fija. El dato —el `email` del JWT que el propio gate acaba
de leer del `localStorage`— está en la mano y no se usa.

**3. Causa raíz.** El texto se escribió cuando pensar en "la cuenta" era
pensar en **una**. Con portero central hay **una sola identidad para todo
SORSABSA** y la misma persona acumula varias: en `auth.users` de
`sorsabsa-identity` hay hoy siete, dos de ellas de Gina (una Google, una
Facebook). En ese mundo "esta cuenta no está habilitada" no identifica nada.

Es el mismo error de fondo que 🔴-2 de `PENDIENTES-ECOSISTEMA.md` §27
(*"asegurar la identidad, no crearla"*): razonar sobre un producto aislado
cuando el portero ya es compartido. Y el componente compartido no tenía la
culpa — `@sorsabsa/ui/SinAcceso` declara su `mensaje` como `ReactNode`
con este motivo escrito textualmente: *"Acepta nodos para poder resaltar el
email con el que entró"*. **La pieza estaba preparada; nadie le pasaba el
dato.**

**4. Componente responsable:** los dos `LoginGate` de agente24siete, que son
quienes tienen el token.

**5. Código afectado:** `lib/jwt.ts`, `app/portal/LoginGate.tsx`,
`app/admin/LoginGate.tsx`.

**6. Costo real, medido en esta sesión.** El diagnóstico tomó cerca de media
hora y **produjo una afirmación equivocada**: sin saber qué cuenta era, se
dedujo de dos marcas de tiempo separadas por 18 segundos que el rechazo había
sido para `patricio.marmol@hotmail.com`, y se le dijo a Gina como si fuera un
hecho. Al mirar `auth.sessions` no había ninguna sesión de esa cuenta que lo
respaldara. Se corrigió ante Gina en el momento. **La pantalla tenía el dato
todo el tiempo**; se dedujo lo que se podía haber leído, que es justo lo que
la regla 5 de la parte II (*lo que se declara no se deduce*) previene.

**7. Fix aplicado:** `emailDelToken()` en `lib/jwt.ts`, hermano de
`tokenExpirado()` — decodifica el claim sin verificar firma, **para mostrar,
nunca para autorizar** (eso lo sigue haciendo el servidor contra el JWKS). Los
dos gates lo pasan dentro del `mensaje`. Si el token no trae `email`, el texto
cae al genérico anterior: no se inventa un dato ausente.

**8. Código que debe eliminarse:** ninguno.

**9. Riesgo de regresión:** ninguno — es texto. No toca el gate ni decide
acceso. `tsc` y `next build` limpios.

**Validación:** ⬜ la hace Gina, entrando con una cuenta sin lugar en el
producto y confirmando que la pantalla nombra esa cuenta. ❌ Ninguna prueba
automática lo cubre (respuesta honesta a la pregunta 17).

**Pendiente que este hallazgo deja abierto — ver 🟡-3:** el rechazo se ve
ahora en la pantalla de quien lo sufre, pero **sigue sin quedar registrado en
ningún lado**. Nadie puede responder después "¿a quién se le negó el acceso
esta tarde, y por qué?".

---

### 🟠-8 — ✅ CORREGIDO 22-ago-2026 (`6b9a69a`, **el fix fue un parche; lo reemplazó 🔴-3 en `bd3a7a6`**) — El producto tiene DOS poblaciones y la web UNA sola puerta: la administradora entra por la de clientes, es rechazada con razón, y sale a un callejón cerrado en círculo

**1. Síntoma.** Gina, tres veces seguidas en la misma noche: *"INTENTO entrar
por google y me dice Cuenta sin cliente asociado — Entraste como
gina.proanio76@gmail.com"*. La pantalla era **correcta** en todo: la cuenta es
la suya, y efectivamente no está en `clientes`. Y aun así la dejaba afuera.

**2. Causa inmediata.** El único "Ingresar" de la web (`app/page.tsx`) apunta
a `/portal`, fijo. Al panel solo se llega escribiendo `/admin` a mano: **no
está enlazado desde ninguna parte del producto** (relevado hoy: cero
enlaces a `/admin` fuera del propio panel).

**3. Causa raíz.** agente24siete tiene **dos poblaciones distintas** —
`usuarios` (quien administra) y `clientes` (quien contrata) — y una sola
entrada, escrita cuando "quien entra" significaba una sola cosa. No es un
fallo del gate: el gate hace exactamente lo que debe. Falta una puerta.

Y el círculo se cierra por el propio contrato de salida: "Salir" lleva al
`redirectUrl` de `apps.ts` —la landing— cuya única puerta es otra vez
`/portal`. Cada intento honesto de volver a entrar termina en la misma
pantalla. **Un rechazo correcto, repetido en bucle, es indistinguible de un
producto roto**, que es la misma familia de 🟠-7.

**4. Componente responsable.** La entrada del producto. Dos candidatos reales:
la landing (que podría ofrecer las dos puertas) o `/portal` (que puede
enrutar a quien no es cliente). Se eligió `/portal`: mantiene **una sola
puerta pública** —no hay que decidir si un enlace de administración va en una
página de marketing— y pone la decisión donde ya está la información.

**5. Código afectado:** `app/portal/LoginGate.tsx`. Nada más.

**6. Fix aplicado.** Cuando el portal rechaza a alguien por no ser cliente,
consulta `/api/admin/whoami` **antes** de mostrar la pantalla terminal. No
decide nada por su cuenta: le pregunta a la autoridad que ya existe
(`usuarios`, vía el mismo endpoint que usa el panel). Sirve el token del
portal porque `autenticarAdmin` resuelve por el claim `email` del JWT, no por
de qué llave de `localStorage` salió. Si la respuesta es 200, la pantalla
ofrece *"Ir al panel de administración"* y el texto deja de aconsejarle que
pida el alta como cliente.

Las tres preguntas de alarma del estándar, respondidas:

- **¿Es una excepción?** No. No hay ningún `if email === …` ni `if app === …`:
  la condición es "esta identidad está en `usuarios`", que es un dato, no una
  constante.
- **¿Es un bypass?** No. El panel sigue decidiendo su propio acceso y el viaje
  a `/admin` pasa por `middleware.ts` y por el portero como cualquier otro. No
  se copia ningún token de una llave a la otra — eso sí habría sido un bypass.
- **¿Duplica lógica?** No. `SinAcceso.secundaria` está documentado
  literalmente para esto: *"otro lugar del producto donde la persona SÍ tiene
  lugar"*. Era la pieza correcta, escrita y sin usar — el mismo patrón que
  🟠-7, donde `mensaje` ya aceptaba nodos "para poder resaltar el email".

**Fallback, explícito:** si `/api/admin/whoami` no se puede consultar (red
caída), **no se ofrece nada**. Nunca se insinúa un permiso que no se pudo
comprobar — la dirección prohibida por *fallback peligroso*.

**7. Código que debe eliminarse:** ninguno.

**8. Riesgo de regresión:** bajo. Solo agrega un botón a una rama que ya era
terminal. El camino de un cliente real no se toca: llega a `sin_cliente` solo
quien ya fue rechazado.

**9. Validación:** ⬜ la hace Gina — entrar por "Ingresar" de la landing con
su cuenta y confirmar que la pantalla ahora ofrece el panel. ❌ Sin prueba
automática (pregunta 17).

**Lo que este hallazgo NO resuelve, dicho como tal.** La puerta pública sigue
siendo una sola y sigue llamándose "Ingresar" hacia `/portal`. Quien
administra pasa por un rechazo antes de llegar a donde va — mejor que un
callejón, peor que una puerta. Si algún día hay más de una persona
administrando, **la decisión de fondo es de Gina**: o la landing ofrece las
dos puertas, o `/portal` deja de ser la entrada y pasa a serlo una ruta que
enrute por quién sos. No se eligió por ella.

---

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

### 🟡-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@d168078` — El portero se reejecutaba en CADA clic del menú, y mientras tanto la pantalla decía "Redirigiendo al acceso…" aunque no fuera a ningún lado

**1. Síntoma.** Gina, recién entrada al panel: *"me cambio entre opciones
clientes y conversaciones y veo el mensaje redirigiendo"*. En cada cambio de
sección, una pantalla completa anunciando una expulsión que no ocurría.

**2. Causa inmediata — son dos defectos que se potencian:**

- El menú (`app/admin/AdminNav.tsx`) usaba `<a href>`, o sea **navegación con
  recarga completa**. Cada clic reejecutaba `middleware.ts`, remontaba
  `LoginGate` y disparaba otra vez `/api/admin/whoami`.
- El cartel de espera se mostraba para `estado !== "listo"`, un único cajón que
  mezclaba *verificando* con *redirigiendo*, y su texto era el del segundo.

**3. Causa raíz.** El `<a href>` es mío, de ese mismo día: `AdminNav.tsx` nació
al unificar el menú de escritorio y móvil, y copió el marcado del `<aside>` que
reemplazaba sin notar que en un layout de App Router eso tira abajo el árbol
entero —`LoginGate` incluido— en cada navegación. El componente compartido
`MobileNav` sí usa `<a>` a propósito y lo dice; ese razonamiento no vale para
el `<aside>`, que vive dentro del gate.

El cartel es más viejo y es de la familia del *"¡Pago confirmado!"* del
Convertidor (`PENDIENTES-ECOSISTEMA.md` §26): **la pantalla afirmando algo
distinto de lo que está pasando.** No era grave mientras se veía una vez por
sesión; con la recarga por clic pasó a leerse como *"te estoy echando"*, seis
veces por minuto.

**4. Componente responsable:** `app/admin/AdminNav.tsx` (la navegación) y los
dos `LoginGate` (el texto).

**5. Código afectado:** esos tres.

**6. Fix aplicado:** `next/link` en el `<aside>` — navegación del lado del
cliente, el layout no se remonta, la sesión se comprueba **una vez por carga y
no una vez por clic**. Los ítems deshabilitados dejaron de ser enlaces: no van
a ningún lado, y un `<a>` sin destino es otra cosa que la pantalla afirma y no
cumple. Estado `"redirigiendo"` nuevo, marcado justo antes de cada salto real
al portero: mientras solo comprueba dice *"Verificando tu acceso…"*.

**7. Código que debe eliminarse:** ninguno.

**8. Riesgo de regresión:** bajo. `next/link` no cambia quién decide el acceso
—el gate sigue igual— solo con qué frecuencia se le pregunta. Ojo con lo que
NO cambia: el `matcher` de `middleware.ts` sigue cubriendo `/admin/*`, así que
una entrada directa por URL o un refresco siguen pasando por el servidor.

**9. Validación:** ⬜ la hace Gina — cambiar de sección y confirmar que no
aparece ningún cartel. ❌ Sin prueba automática.

### 🟡-3 — ⬜ No existe ningún registro de accesos NI de rechazos: el único rastro es un campo que se pisa. Encontrado 22-ago-2026

**1. Síntoma.** Gina, en medio del problema de acceso: *"¿hay log de
acceso?"*. La respuesta honesta fue no, y por eso el diagnóstico se hizo por
deducción — con una conclusión equivocada de por medio (ver 🟠-7 punto 6).

**2. Causa inmediata, relevada hoy contra las bases, no supuesta:**

| fuente | qué guarda | sirve para mirar atrás |
|---|---|---|
| `auth.audit_log_entries` (identity) | **0 filas** — Supabase la purga sola | no |
| `auth.users.last_sign_in_at` | solo el ÚLTIMO ingreso, se pisa en cada login | no |
| `auth.sessions` | sesiones vivas, con IP y fecha; desaparecen al cerrar sesión | a medias |
| logs de Vercel | las respuestas HTTP, retención corta | a medias, y no dicen el porqué |
| agente24siete | **nada** | no |

**3. Causa raíz.** Nunca se decidió que esto hiciera falta. El portero delega
la identidad en Supabase y se asumió que "Supabase ya lo registra" — hoy se
comprobó que su tabla de auditoría está vacía. Y del lado del producto, los
rechazos (`autenticarAdmin` → 403, `autenticarCliente` → 401) se responden y
se olvidan: no hay `console.error`, no hay tabla, no hay nada. La información
más valiosa para un portero —**a quién NO dejó pasar y por qué**— es la única
que no se guarda.

**4. Componente responsable — sin decidir, y es la pregunta que hay que
responder antes de escribir código:** ¿va en `sorsabsa-identity` (un intento
de login es del portero, y serviría para los seis productos) o en cada
producto (los 401/403 los decide el producto, contra SUS tablas
`usuarios`/`clientes`)? Son eventos distintos y probablemente hagan falta los
dos. Ponerlo en el producto es más rápido y **repite lo mismo seis veces** —
justo lo que la sección *Fuente única de verdad* previene.

**5-8.** N/A hasta decidir el punto 4. **Anotado a propósito sin fix
propuesto:** escribir el código antes de responder quién es el dueño del
evento es como se llega a seis implementaciones distintas del mismo registro.

**9. Validación, cuando se haga:** reproducir el caso de hoy —entrar con una
cuenta sin lugar en el producto— y poder responder después, leyendo, *quién*
fue rechazado, *cuándo*, *en qué producto* y *por qué motivo*, sin deducir
nada de marcas de tiempo.

**Decisión pendiente de Gina.** Ofrecido en la sesión del 22-ago y **no
construido**: sin su respuesta al punto 4, cualquier cosa que se escriba nace
en el lugar equivocado.

---

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
- **22-ago-2026 — cinco entradas nuevas, cuatro ya corregidas.** Ninguna salió
  de auditar: salieron de **construir `/admin/clientes` y de que Gina la
  usara**. 🔴-2 (los 11 endpoints admin sin `await`, commit `16ef1db`), 🟠-4
  reabierto y cerrado de verdad (`628c84a`), 🟠-7 (las pantallas no decían la
  cuenta, `6684e54`), 🟡-2 (el menú recargaba entero y el cartel mentía,
  `d168078`) y 🟡-3 (**no hay registro de rechazos** — ⬜ sin construir, espera
  que Gina decida de quién es ese evento).
  - **Lo que las cinco tienen en común, y es el hallazgo de método del día:**
    ninguna se manifestaba como un error. 🔴-2 devolvía 401 y 403 correctos;
    🟠-4 se veía como "no me deja entrar"; 🟠-7 se veía como un sistema roto;
    🟡-2 se veía como una expulsión. **Un portero que rechaza bien por el
    motivo equivocado es indistinguible de uno que funciona** — hasta que
    alguien lo usa de verdad.
  - **🔴-3 (`bd3a7a6`) es la causa raíz de tres de ellos.** 🟠-4 (2ª mitad),
    🟠-7 y 🟠-8 resultaron ser el MISMO defecto visto por tres ventanas: el
    producto nunca resolvía la identidad, decidía "administradora o clienta"
    por la URL pedida. Los tres se analizaron con sus 9 puntos y ninguno
    levantó la cabeza para preguntar por qué. El estándar ya lo advierte
    —*"fix sobre fix: retroceder hasta la primera decisión arquitectónica
    incorrecta"*— y hubo tres eslabones antes de retroceder. El de 🟠-8 era
    directamente un parche, y Gina lo cortó: *"despierta al arquitecto"*.
  - **🟠-8 se sumó más tarde esa misma noche** (`6b9a69a`), y es el que mejor
    resume el día: la pantalla que 🟠-7 había arreglado funcionaba
    perfectamente y **seguía dejando a Gina afuera**, porque el defecto no
    estaba en lo que decía sino en que al producto le faltaba una puerta.
  - **Deuda a retirar** (parte II, regla 6): el argumento `tokenKey` de
    `limpiarSesionLocal`, hoy ignorado a propósito, en la firma y en sus tres
    call sites. Se borra al tocar cualquiera de esos archivos por otro motivo.
  - **Lo que NO quedó cubierto, dicho como tal:** ninguno de los cuatro fixes
    tiene una prueba automática que falle si el defecto vuelve (pregunta 17 de
    la parte II). Este repo no tiene suite de navegador y no se creó una. Lo
    único que hoy sostiene 🔴-2 es un docblock; lo único que sostiene 🟠-4 es
    que la lista de llaves vive en un solo lugar.
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
