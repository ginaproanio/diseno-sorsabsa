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

## Paso 3 — Cada producto a su propio proyecto

Recién aquí quedan **desoldados de verdad**: hoy los tres productos comparten
una base, así que si esa base cae, caen los tres — aunque la identidad ya esté
afuera, porque lo que se pierde son sus datos.

Orden sugerido, del más barato al más caro:

1. **CondoManager** y **DomusCRM** — 0 filas operativas, es replicar el esquema.
2. **JustiRed al final** — es el único con contenido real (3.731 filas) y con
   tráfico de buscadores (Googlebot y Applebot indexan `/rest/v1/leyes`).

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
