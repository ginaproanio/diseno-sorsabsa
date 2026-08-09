# Plan de desoldado del ecosistema SORSABSA

Escrito el 31-jul-2026, después de la respuesta de Supabase
([`supabase-ticket-jwt-signing-keys.md`](supabase-ticket-jwt-signing-keys.md)).
Este documento dice **en qué orden** y **cuándo se considera hecho** cada paso.

> **Principio que gobierna todo lo de abajo:** nada se prueba en el proyecto que
> sirve el login. Todo lo verificable se prueba primero contra
> `sorsabsa-identity`, que está vacío. Y ningún paso se da sin que el anterior
> tenga su criterio de "hecho" cumplido **por una petición real**, no por
> lectura de código.

## Punto de partida — medido el 31-jul-2026, no recordado

Todo vive en un solo proyecto Supabase, `twkuidnjwhopbjnrhnxp` ("condomanager"):

| Esquema | Tablas | Filas reales | Qué es |
|---|---|---|---|
| `public` | 40 | solo semillas (88 rubros, 74 permisos, 2 condominios, 2 unidades, 2 residentes) | CondoManager |
| `domus` | 27 | catálogo geográfico (222 cantones) + **1 empresa** | DomusCRM |
| `justired` | 6 | **3.731** (3.602 artículos, 63 leyes) | JustiRed |
| `auth` | 23 | **4 usuarios de prueba** | el login de TODOS |
| `storage` | — | 1 objeto | 5 cubos |

**Lectura:** de datos operativos no hay nada, salvo la biblioteca de JustiRed.
La ventana para mover cosas está abierta y se cierra el día que entre el primer
cliente real (Punta Blanca en CondoManager, EcoInmobiliaria en DomusCRM).

## Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero

**Por qué:** `public` tiene 40 tablas y las migraciones del repo crean **17**.
Faltan `condominios`, `unidades`, `residentes`, `perfiles`, `catalogo_rubros`,
`modulos`, `modulo_permisos` — el corazón del producto. La primera migración es
del 24-jun y el proyecto nació el 13-jun: lo anterior se creó a mano y **su
definición solo existe dentro de la base viva**. En `domus` la proporción es
peor: 27 tablas, 6 archivos `.sql`.

**Hoy no se puede recrear el producto desde el repo.** Mientras eso siga así,
cualquier movimiento —mudanza, reconstrucción o desastre— se hace de memoria.

**Qué se hace:** `pg_dump --schema-only` de `public`, `domus` y `justired`,
commiteado en su repo como migración base.

**Hecho cuando:** un proyecto nuevo y vacío levanta el esquema completo
replicando solo lo que está en el repo, sin consultar la base viva.

**Riesgo:** ninguno. Es lectura, no toca producción.

### Estado — hecho el 07-ago-2026, con un pendiente real

Los tres `pg_dump --schema-only` se corrieron de verdad contra
`twkuidnjwhopbjnrhnxp` (no se leyó código, se conectó a la base) y los
conteos coincidieron exacto con la tabla de arriba: `public`=40, `domus`=27,
`justired`=6. Sin FKs cruzando esquemas — cada dump es autocontenido.

- **`condomanager`** (commit `e5fa9b1`): las 26 migraciones incrementales se
  archivaron en `supabase/migrations_archive/` (no se borraron) porque el
  dump ya trae su efecto acumulado; dejarlas activas junto al baseline
  rompía el replay (`CREATE POLICY` y `ALTER TABLE ADD CONSTRAINT` sin guard,
  duplicados). El baseline (`00000000000000_baseline_schema.sql`) queda como
  única migración activa.
- **`crm_inmobiliario`** (commit `c8d5996`): no tenía ni carpeta `supabase/`
  — se creó junto con el baseline de `domus`.
- **`legaltech`** (commit `ddeb8d1`): hallazgo aparte — su
  `supabase/config.toml` apuntaba a `jywrjkfamdtcoehlsiup`, un proyecto que
  **ya no existe** en la cuenta (no aparece en `supabase projects list`), y
  sus 6 migraciones creaban `public.leyes`/`public.subscription_plans` — ni
  el proyecto ni el esquema correctos. Producción nunca se vio afectada: el
  scraper en Railway lee `SUPABASE_URL` de sus variables de entorno, no de
  ese archivo. Se corrigió el `project_id` a `twkuidnjwhopbjnrhnxp` y se
  archivaron las 6 migraciones huérfanas.

### ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados

Se autorizó el gasto (10 USD/mes) y se creó `paso0-verificacion-temporal`
(`mmjlsmvsjjedfrpbfboj`) en `SORSABSA_Corp`, vacío. Primer intento de
`supabase db push` con los tres baseline: **falló**, dos veces, por razones
reales — no hipotéticas:

1. `GRANT ... TO "app_runtime"` — el rol no existe en un proyecto nuevo. Se
   creó a mano en algún momento en la base viva, nunca quedó en una
   migración. Capturado con sus atributos reales (leídos de `pg_roles`) en
   `crm_inmobiliario/supabase/roles.sql` (commit `c537878`), su dueño real
   (rol dedicado de DomusCRM, `SIN BYPASSRLS`, ver `backend/.env.example`).
2. `domus.properties.location` es `extensions.geography` (PostGIS) y
   `justired.articulos_embeddings` usa `extensions.vector` (pgvector) —
   `pg_dump --schema=X` no trae extensiones porque viven en el schema
   `extensions`, fuera del filtro por esquema. Agregado
   `CREATE EXTENSION IF NOT EXISTS` al inicio de cada baseline afectado
   (`crm_inmobiliario` `c537878`, `legaltech` `a299189`) — y de paso
   `pg_net` en `condomanager` (`c87d504`, no bloqueaba el replay porque
   `check_function_bodies=false` no valida cuerpos de función al crearlos,
   pero sin la extensión las funciones de sync con DomusCRM fallarían en
   producción real).

**Con los tres fixes, `supabase db reset --linked` corrió limpio, desde
cero, sin un solo error:** 73 tablas (40 `public` + 27 `domus` + 6
`justired`), exacto contra el punto de partida. El *advisory* de RLS del
proyecto de prueba marcó exactamente las mismas dos tablas ya conocidas
(`public.unidad_fotos`, `domus.invitations`, pendiente #5 de
`PENDIENTES-ECOSISTEMA.md`) — ninguna sorpresa nueva ahí.

⚠️ El proyecto de prueba no se pudo pausar por MCP ("Project is not
free-tier") y el MCP no puede borrar proyectos. **Borrado a mano por Gina el
07-ago-2026** desde el dashboard — dejó de cobrar los 10 USD/mes.

**Paso 0 cerrado de verdad: probado por una petición real, no por lectura
de código — como pide el criterio de este documento.**

## Paso 1 — Identity como emisor OIDC

`sorsabsa-identity` (`gyqgorgfstffbgazhbnb`) pasa a ser el emisor de identidad
del ecosistema. Es el camino que confirmó Supabase el 31-jul.

- Habilitar el servidor OAuth 2.1 en identity y registrar el cliente.
- ✅ Ya verificado: el documento de descubrimiento OIDC responde, con `issuer`,
  `authorization_endpoint`, `token_endpoint` y `jwks_uri`.

**Hecho cuando:** se completa un login de prueba de punta a punta contra
identity y se verifica el token emitido — **sin haber tocado el proyecto de
producto todavía**.

### ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado

Sin tocar `twkuidnjwhopbjnrhnxp` en ningún momento:

1. **Servidor OAuth 2.1 habilitado** en `sorsabsa-identity` (Dashboard →
   Authentication → OAuth Server), con Site URL `http://localhost:3000`
   (descartable, solo para esta prueba — identity todavía no tiene ninguna
   app propia desplegada).
2. **Cliente OAuth registrado**: `sorsabsa-paso1-test`
   (`a637b245-6ecf-4d8e-9610-9c728aa5924c`), público, redirect
   `http://localhost:3000/callback`.
3. **Usuario de prueba** creado y confirmado vía Admin API
   (`paso1-test@sorsabsa.local`) — **borrado al terminar**, identity vuelve a
   quedar en 0 usuarios.
4. **Script Node.js** (`@supabase/supabase-js` + PKCE manual + `jose` para
   verificar firma) corrió el flujo completo real: login → `GET
   /oauth/authorize` (302 al `authorization_path`) → `getAuthorizationDetails`
   → `approveAuthorization` → canje del code por tokens en `/oauth/token` →
   verificación del `id_token` contra el `jwks_uri` real.

**Todos los checks en verde:** `authorization_id` presente, redirect exacto
al `redirect_uri` registrado, `state` anti-CSRF intacto, `access_token` +
`id_token` recibidos, firma `ES256` válida contra el JWKS real, `iss` =
`https://gyqgorgfstffbgazhbnb.supabase.co/auth/v1`, `sub` = el usuario que
inició sesión, `aud`/`client_id` = el cliente registrado.

**Paso 1 cerrado de verdad: login de punta a punta probado, token emitido y
verificado — sin haber tocado el proyecto de producto.**

## Paso 2 — El producto confía en identity

- Alta del proveedor OIDC personalizado (`custom:…`) en el proyecto de producto,
  apuntando al issuer de identity. (Pro = proveedores ilimitados; en Free el
  tope es 3.)
- Reapuntar el login de `auth-sorsabsa` a ese proveedor.
- Los 4 usuarios actuales **se recrean en identity, no se migran**: son de
  prueba.

**Hecho cuando:** alguien entra por identity y el RLS de los tres productos
responde igual que antes — probado con una consulta real de cada esquema
(`public`, `domus`, `justired`), no con una pantalla que "se ve bien".

**Lo que este paso NO resuelve, y hay que decirlo:** el esquema `auth` sigue
existiendo dentro del proyecto de producto con copias locales federadas
—Supabase no deja apagar su Auth—. Lo que cambia es que **deja de ser el
dueño**. Si ese proyecto muere, las cuentas ya no se pierden.

### Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices

**Hecho, probado con una petición real (no una pantalla que "se ve bien"):**

- Proveedor OIDC `custom:sorsabsa-identity` dado de alta en `condomanager`
  (Sign In / Providers → Custom Providers), issuer =
  `https://gyqgorgfstffbgazhbnb.supabase.co/auth/v1`.
- `condomanager` registrado como cliente **confidential** en `sorsabsa-identity`
  → OAuth Apps (`7523b9d0-01ca-492b-b852-8282890221d0`), Redirect URI = el
  Callback URL que Supabase generó (`.../auth/v1/callback`).
- 🐛 **Bug real encontrado y corregido:** el campo Scopes del proveedor
  mostraba `openid, email, profile` en gris — era el placeholder del
  formulario, no un valor guardado. Lo que había quedado grabado era
  `["openid", ""]`. Sin `email` en el scope, identity nunca lo devuelve y
  condomanager no puede crear el usuario federado (`email_optional=false`).
  Corregido escribiendo el valor real.
- **Login encadenado de punta a punta, con script**, igual que el Paso 1 pero
  a través de dos Supabase Auth: login en identity → `condomanager` inicia
  `signInWithOAuth('custom:sorsabsa-identity')` → identity pide consentimiento
  → aprobado → `condomanager` canjea el code con identity **del lado del
  servidor** (con el `client_secret`) → **condomanager emite su PROPIO
  token**, firmado con **su propio `kid`** (`9e498800-…`, el real de
  producción — no el de identity). `sub` es un usuario nuevo y local, federado
  (`7add8517-…`), distinto del `sub` de identity (`5f99d320-…`, que queda en
  `user_metadata` para trazabilidad).
- **`public` (CondoManager): verificado de verdad.** La política de
  `perfiles_select` usa `user_id = auth.uid()` — no es de lectura pública. La
  consulta con el token federado devolvió `200` y vacío (correcto: usuario
  nuevo, sin perfil todavía). Esto **sí prueba** que `auth.uid()` resuelve
  bien de punta a punta.

**Lo que el criterio original pedía y no se puede probar tal como está escrito:**

- **`justired`:** ninguna de sus 6 tablas tiene una política basada en
  `auth.uid()` — `leyes`/`articulos` son de lectura pública (`USING (true)`,
  para cualquiera, logueado o no) y el resto tiene RLS activado con **cero
  políticas** (bloqueo total). El `200` que devolvió la prueba habría salido
  igual con un token inválido: no hay nada ahí que dependa de quién sos, así
  que no hay forma de probar la federación con una consulta a este esquema
  hoy. No es una falla de este paso — es que justired todavía no tiene
  ningún dato ligado a un usuario.
- **`domus`, primera lectura (corregida abajo):** `crm_inmobiliario/backend`
  (servicio `crm-inmobiliario-api`) no usa `supabase-js` ni PostgREST — usa
  `@fastify/jwt` con su propio `JWT_SECRET`, y aísla por
  `set_config('app.current_company_id', ...)` en vez de `auth.uid()`/RLS.
  Parecía un segundo sistema de identidad, aparte de todo este plan.

**✅ Pero el producto real no pasa por ahí — verificado, no supuesto.** El
panel de DomusCRM que corre en Vercel (`crm_inmobiliario/webs`, lo que usan
los agentes) tiene su propia guardia en
[`webs/src/lib/auth-guard.ts`](../../crm_inmobiliario/webs/src/lib/auth-guard.ts):
valida la sesión llamando `GET {condomanager}/auth/v1/user` y después
chequea membresía en `domus.company_users`. **Ese es el mecanismo real**, y
usa a condomanager — el mismo proyecto que ya confía en identity. Se probó
con un script: login en identity → condomanager → token federado → `GET
/auth/v1/user` contra condomanager con ese token → `200`, usuario resuelto.
**El panel real hereda la confianza en identity sin tocar una línea de
código.**

`backend/` (`crm-inmobiliario-api`) queda aparte: sin `Dockerfile` ni config
de Railway en el repo, y **nada en todo el repo firma un JWT con la forma
que espera** (`company_id`/`role` como claims directos — hubiera necesitado
un Auth Hook de Supabase que nunca se configuró). Confirmado con Gina: no
está sirviendo tráfico real. No es un segundo portero en producción — es
código incompleto o abandonado. Pendiente de decisión aparte (completarlo,
conectarlo a identity igual que `webs/`, o borrarlo), no bloquea este plan.

**Lectura honesta:** el Paso 2 está probado y funciona en todo lo que
importa hoy — CondoManager (`public`, verificado con una política RLS real)
y el panel real de DomusCRM (heredado, verificado con `GET /auth/v1/user`).
Un solo portero: identity. Para `justired` el criterio de "consulta con
RLS real" no es probable todavía porque el esquema no tiene ninguna política
basada en `auth.uid()` — no es una falla, es que no hay nada ahí que
dependa de quién sos.

### auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026

El único ítem que quedaba del Paso 2. `auth-sorsabsa` (el login real de todo
el ecosistema) ya no valida contraseña contra condomanager directo:

- `/auth/login`: solo inicia `signInWithOAuth('custom:sorsabsa-identity')`
  y redirige. Ya no pide contraseña ahí.
- `/oauth/consent` (nueva): la **única** pantalla del ecosistema donde se
  escribe una contraseña de verdad — login contra identity, aprueba sin
  fricción extra (productos propios confiando en su propio emisor, no un
  tercero de verdad) y redirige de vuelta.
- `/auth/complete` (nueva): recibe la sesión ya federada de condomanager y
  hace lo que antes hacía `/auth/login` después del login — valida
  suscripción contra `pagos-sorsabsa`, traspasa la sesión al producto real.

**Probado:** typecheck limpio, tests existentes pasan (14/15 — el que falla
es un color de marca, ya fallaba antes de este cambio, confirmado con `git
stash`). El punto crítico —que el `redirectTo` con `?app=&next=` sobreviva
íntegro el viaje identity↔condomanager, con los tokens cayendo en el
fragmento donde `/auth/complete` los espera— se probó con script contra las
APIs reales. Las 3 páginas compilan y sirven con `next dev`.

**✅ Probado con clic real en navegador — 3 bugs reales encontrados y
arreglados**, ninguno lo iba a agarrar un script:

1. Commit `212f8b9` — variables `NEXT_PUBLIC_IDENTITY_SUPABASE_URL` y
   `NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY` agregadas en Vercel
   (`auth-sorsabsa`). Sin esto el deploy servía pero `/oauth/consent`
   hablaba con una URL vacía.
2. Commit `4f8eac1` — **"Application error"** al entrar a `/oauth/consent`:
   `Wordmark` llama `useBrand()` y esa pantalla no tenía `<BrandProvider>`
   alrededor, crash inmediato. Y **doble clic**: condomanager.vip → "Iniciar"
   → auth-sorsabsa mostraba OTRO botón "Iniciar sesión" antes de recién ahí
   ir a identity. Arreglado: `BrandProvider` agregado, y `/auth/login`
   dispara el redirect solo al montar (un clic desde el producto alcanza).
3. Commit `682425c` — **la marca cambiaba a mitad de camino**: entrar por
   condomanager.vip abría un login verde/oro CondoManager que saltaba a la
   marca genérica SORSABSA en `/oauth/consent`. Causa: identity solo
   devuelve `?authorization_id=` a esa pantalla, ningún otro parámetro
   sobrevive el salto. Arreglado con `sessionStorage` (mismo origen, mismo
   tab) para que `/oauth/consent` sepa qué producto lo trajo.

Gina probó cada ronda en el navegador real y confirmó — la señal es que
después del tercer fix pasó directo a pedir *reducir* los saltos visuales
del flujo, no a reportar un bug nuevo (esa mejora queda anotada para el
Paso 3, ver más abajo).

**Paso 2 cerrado — 08-ago-2026: un solo portero, identity, de punta a
punta, probado con peticiones reales en cada tramo y con clic real en
navegador en el tramo que faltaba.**

**Extendido el mismo día a agente24siete** (no estaba en el criterio original
de este paso, pero vive en el mismo proyecto consolidado): su `/admin`
confirmado con el mismo portero, y de paso se limpió un login local muerto
que una migración anterior había dejado sin desenchufar. Su `/portal` de
cliente en su momento no tenía login real — **corregido, esta nota estaba
vieja: cerrado el 08-ago-2026** (`PENDIENTES-ECOSISTEMA.md` #11, commit
`82b66e4`). El 09-ago se encontraron y corrigieron además dos bugs reales
más en agente24siete (login que mostraba el menú antes de redirigir, y el
gate que bloqueaba al 100% de sus clientes por chequear una suscripción
que el producto nunca usó) — ver `AUDITORIA-PORTERO-SSO.md` 🔴-5/🔴-6.

## Paso 3 — Cada producto a su propio proyecto

**⏸️ EN PAUSA — decidido 08-ago-2026.** Gina: "no quiero separar hasta probar
el sistema." Tiene razón y además no cuesta nada esperar — verificado con
Supabase real (`get_organization`/`get_cost`/`list_projects`, no de memoria):

- **Separar cuesta $20/mes extra, de verdad.** Org `SORSABSA_Corp` (Pro): hoy
  3 proyectos activos (condomanager, identity, agente24siete) = $25 Pro +
  3×$10 cómputo − $10 crédito = **$45/mes**. Terminado el Paso 3 (3 productos
  nuevos + el viejo pausado, que no cobra) = 5 proyectos activos = **$65/mes**.
  El org es Pro completo — no se puede dejar un proyecto nuevo en plan
  gratis mientras no hay tráfico sin mezclar planes, que Supabase no permite.
- **Ese costo no se activa hasta que se cree el proyecto nuevo** — esperar al
  pendiente #8 (`PENDIENTES-ECOSISTEMA.md`, CondoManager end-to-end real con
  Punta Blanca, nunca hecho) no cuesta nada.
- **`public`/`domus` no tienen ni una fila operativa real hoy** — nada que
  perder probando en el proyecto compartido tal cual está.
- **Orden correcto: probar primero, separar después.** Si el test real
  destapa que falta una tabla/columna, mejor encontrarlo antes de fijar el
  baseline que Paso 3 va a replicar — y un bug de producto es más fácil de
  diagnosticar en el entorno ya estable que mezclado con "¿esto lo rompió la
  migración o es un bug real?" en un proyecto recién separado.

**Retomar cuando el pendiente #8 esté cerrado.** Mientras tanto, todo lo de
abajo queda escrito para cuando se retome, sin tocar.

Recién ahí quedan **desoldados de verdad**: hoy los tres productos comparten
una base, así que si esa base cae, caen los tres — aunque la identidad ya esté
afuera, porque lo que se pierde son sus datos.

Orden sugerido, del más barato al más caro:

1. **CondoManager** y **DomusCRM** — 0 filas operativas, es replicar el esquema.
2. **JustiRed al final** — es el único con contenido real (3.731 filas) y con
   tráfico de buscadores (Googlebot y Applebot indexan `/rest/v1/leyes`).

**Aprovechar este paso para sacar los dos saltos visibles del login**
(decidido 08-ago-2026, a raíz de que Gina los vio en el navegador real): hoy
`auth-sorsabsa` hace de intermediario entre el botón "Iniciar" del producto y
`identity` — de ahí las pantallas `/auth/login` ("Redirigiendo…") y
`/auth/complete` ("Verificando…/Entrando…"), que no las pide OIDC, las metí
yo para centralizar marca + chequeo de suscripción + redirect seguro en un
solo lugar mientras los tres productos compartían un proyecto. Cuando cada
producto tenga el suyo, que el propio botón "Iniciar" llame
`signInWithOAuth('custom:sorsabsa-identity')` directo y aterrice directo en
el callback del producto — la única pantalla ajena que queda es la de
contraseña en identity (`/oauth/consent`), que es la parte no negociable de
un SSO real. No se hace antes porque codificarlo hoy sería contra el
proyecto compartido y se tira apenas cada producto tenga su propio proyecto.

**Hecho cuando:** cada producto responde desde su propio proyecto y el viejo se
puede pausar sin que nadie lo note.

## Lo que NO se hace (decidido, con razón escrita)

- ⛔ **No borrar el proyecto `condomanager`.** Destruiría el plano de ~23 tablas
  que no están en ninguna migración, y la biblioteca de JustiRed. No hace falta:
  el paso 3 llega al mismo sitio hacia adelante, y si el proyecto nuevo no
  levanta, el viejo sigue en pie.
- ⛔ **No compartir llave privada ni `kid`.** Imposible por diseño: el `kid` es
  único a nivel de plataforma. Y Supabase lo desaconseja aunque se pudiera.
- ⛔ **No HS256 compartido.** Existe, pero Supabase lo desaconseja como
  arquitectura y da soporte limitado.
- ⛔ **No insistir con la llave revocada `b156c393`.** Bloqueada hasta el
  **2026-08-28** y el soporte **no puede** saltarse el bloqueo. Es inerte.

## Pendiente aparte — el escaneo de JustiRed falló el 31-jul

`legaltech/.github/workflows/scan.yml` ("Escaneo Registro Oficial"),
`cron: '0 8 * * *'` = **03:00 en Ecuador**.

- El 31-jul **falló la corrida programada** y Gina la lanzó a mano. La manual sí
  insertó: última fila de `justired.leyes` a las 12:21 UTC, y las 63 leyes
  tienen su `r2_key`.
- ❓ **Causa sin diagnosticar.** Mirar los logs del run fallido en Actions. No
  suponerla.
- ✅ **No apagarlo.** Es lo único del ecosistema que genera contenido solo, y es
  lo que los buscadores están indexando.
- ✅ R2 verificado el 31-jul con objetos reales, no con el dominio a secas:
  `archivo.justired.com/registros-oficiales/2026/RO_No_256.pdf` → 200,
  `application/pdf`, 1.08 MB. La raíz da 404 y eso es lo correcto: R2 no lista.
