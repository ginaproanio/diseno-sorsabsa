# Pendientes del ecosistema SORSABSA

Lista viva de lo que falta, en orden de prioridad. Se va anotando a medida que
aparece. Fuente de arquitectura: `ARQUITECTURA-ECOSISTEMA.md`. El plan paso a
paso del desoldado vive en [`PLAN-DESOLDADO.md`](PLAN-DESOLDADO.md) — este doc
es la lista de trabajo suelto, no el plan en sí.

Última actualización: 2026-08-08.

## Principio que gobierna (regla dura)

**Todo producto DEBE usar los sistemas compartidos del ecosistema** (SSO
auth-sorsabsa, pagos-sorsabsa, notificaciones-sorsabsa, design system). Reinventar
cualquiera de ellos = octuplicar código y mantenimiento. Antes de construir
"login propio", "cobro propio" o "notificaciones propias" en un producto, se
usa el compartido.

---

## 1. ✅ RESUELTO — separar auth a su propio proyecto (vía OIDC)

Cerrado 08-ago-2026 en `PLAN-DESOLDADO.md` Pasos 1-2 (ambos cerrados) —
**el estado actual vive ahí, no acá.** `sorsabsa-identity` es el emisor OIDC
real; cada producto lo registra como proveedor personalizado y valida su
propio token.

**Historial breve (por qué no fue por llave compartida):** intentado 29-jul,
identity firma los tokens y condomanager confía en ellos sin refactor. No se
pudo — Supabase asigna el `kid` al importar una llave, no acepta uno propio, y
la validación es estricta por kid: dos proyectos con la misma llave quedan
con kids distintos y no validan entre sí. Third-Party Auth tampoco sirve
(solo Firebase/Clerk/WorkOS/Auth0/Cognito, sin OIDC genérico). Confirmado con
Supabase soporte el 31-jul (Gabriel Claudino): el camino soportado es
identity como **issuer OIDC** y cada producto como proveedor `custom:`
confiando en él — sin compartir llave privada ni `kid`. Ese es el plan que
`PLAN-DESOLDADO.md` ejecuta desde su Paso 1, ya cerrado. (El ticket
detallado —la carta, los timestamps del 409— se borró 09-ago-2026: la
decisión que importaba ya vive implementada, no hacía falta conservar el
expediente.) Nada se rompió en el proceso — login en vivo intacto durante
todo el intento.

## 2. ✅ HECHO — JustiRed al SSO central

Unificado al proyecto central (`twkuidnjwhopbjnrhnxp`, schema `justired`) el
29-jul. Cerrado del todo el 08-ago-2026: schema expuesto en Settings → API, y
los 5 secrets de sus Edge Functions cargados — verificado con peticiones
reales (`Accept-Profile: justired` → 200 con datos; los 3 secrets con
consumidor externo pasaron de "no configurado" a su siguiente error real,
sin tocar datos). Proyecto viejo `jywrjk` (vacío) dado de baja.

**Nota:** `legaltech/scraper/scraper.py` escribe hoy directo con
`SUPABASE_SERVICE_ROLE_KEY`, no llama a `ingesta-legal`. Repuntarlo es
trabajo aparte, sin empezar, sin urgencia.

## 3. ✅ HECHO — cutover de pagos (fuera de Vercel)

pagos-sorsabsa corre en Railway, verificado. Los 3 llamadores (agente24siete,
condomanager, domuscrm) repuntados y estandarizados a `PAGOS_API_URL`.
Proyecto borrado de Vercel.

## 4. ✅ HECHO — notificaciones-sorsabsa → Railway

Mismo patrón que pagos, verificado (`POST /api/listar` → 200). Repuntado con
`NOTIFICACIONES_API_URL`, proyecto borrado de Vercel. (agente24siete todavía
no llama a notificaciones — sigue en su TODO `alertarAdmin()`.)

## 5. ✅ HECHO — RLS activado en las 4 tablas expuestas (seguridad)

`unidad_fotos`/`domus.invitations` (`twkuidnjwhopbjnrhnxp`) y
`planes`/`movimientos_saldo` (`nwcqaginlnzjlkgwifas`, con datos reales
detrás) tenían RLS desactivado — cualquiera con la anon key leía/escribía
todo. Cerrado 08-ago-2026, aplicado en vivo vía Supabase MCP y verificado con
`get_advisors` real (las 4 ya no aparecen en el listado):

- `unidad_fotos`: el residente sube/ve fotos de su unidad; el admin solo ve.
  `condomanager` commit `ad7cb10`.
- `domus.invitations`: el admin que la envió la ve; solo el invitado ve la
  suya, por email. `domuscrm` commit `8ccce4d`.
- `planes`: catálogo público de lectura. `movimientos_saldo`: solo el dueño.
  `agente24siete` commit `28d1981`.

## 6. ✅ HECHO — proyecto Supabase huérfano borrado

`sorsabsa_ecosystem` (`tkkpqbelzwoenmeynjvw`) — verificado con `list_projects`
real: ya no existe. El org `SORSABSA_Corp` tiene 3 proyectos: `condomanager`,
`sorsabsa-identity`, `agente24siete`.

## 7. SorsabsaForensic → Fase 0 antes de Railway

Es PyQt5 (app de escritorio), no un servicio. Antes de Railway: poblar
`core/orchestrator.py` (vacío), sacar el renderizador de informe fuera de Qt,
quitar rutas absolutas, Dockerfile. Ver `PLAN_MATERIALIZACION.md` §2.

## 8. Probar CondoManager end-to-end (Punta Blanca)  🔴 SIGUIENTE — 08-ago-2026

Nunca se verificó el flujo real: admin entra, crea condominio, carga
residentes, emite alícuota, residente paga. Es lo que convierte "plomería
lista" en "producto que funciona para un cliente". **Bloqueante para el Paso 3
de `PLAN-DESOLDADO.md`** (Gina decidió no separar proyectos hasta probar
esto — separar cuesta $20/mes reales y no hay apuro).

**Flujo mapeado 08-ago-2026** (grafo de graphify + código, no probado en vivo
todavía):

1. **Admin crea condominio** → `/register` (auto-registro, no un superadmin a
   mano) → `POST /api/registro-admin` → crea `condominios` + `perfiles`
   (`admin_condominio`) + trial de 15 días vía pagos-sorsabsa.
2. **Carga residentes** → `admin/residentes/nuevo` o `.../importar` (masivo)
   → quedan `PENDIENTE` → `admin/residentes/pendientes` los aprueba (o se
   auto-registran en `/register/residente`).
3. **Emite alícuota** → `admin/parametrizacion/rubros` (catálogo) →
   `admin/facturacion` (emisión real) → verificable en
   `admin/reportes/{rubros-por-unidad,estado-cuenta,recaudacion}`.
4. **Residente paga** → `residente/page.tsx` (ve su deuda) →
   `/api/pagos/iniciar` → PayPhone → `/api/pagos/confirmar` →
   `residente/historial`.

## 9. ✅ HECHO — Auditoría de reuso de sistemas compartidos

Cerrado 08-ago-2026. Grafo cruzado armado con graphify sobre los 11 repos
del ecosistema (auth-sorsabsa, pagos-sorsabsa, notificaciones-sorsabsa,
diseno-sorsabsa, geo-sorsabsa, condomanager, crm_inmobiliario, legaltech,
agente24siete, convertidor, `iot`) — 4242 nodos, 6912 edges. El BFS del
grafo salió con ruido para preguntas puntuales de "quién importa X" (nodos
genéricos como `GET()`/`POST()` colisionando entre repos); la respuesta
final se armó con grep dirigido, más rápido y verificable.

**⚠️ Nota de continuidad:** el grafo fusionado vive en el scratch de esta
sesión (`graphify-out/graph.json` por repo SÍ persiste, ya sea porque cada
repo lo commitea vía su propio CI, o localmente en `c:/<repo>/graphify-out/`
para los tres que no lo tenían: `geo-sorsabsa`, `crm_inmobiliario`,
`convertidor`). El archivo FUSIONADO (`ecosistema-graph.json`) no se guardó
en ningún repo — para reconstruirlo: `graphify merge-graphs
<repo1>/graphify-out/graph.json <repo2>/graphify-out/graph.json ... --out
<destino>`. No hace falta volver a extraer cada repo si su grafo ya existe.

**Resultado — quién reusa cada sistema compartido:**

| Sistema | Reusa | No reusa (y por qué) |
|---|---|---|
| SSO (`auth-sorsabsa`) | ✅ 6/6: condomanager, domuscrm, agente24siete, justired, convertidor, `iot` (#14) | — |
| Pagos (`pagos-sorsabsa`) | ✅ condomanager, domuscrm, agente24siete, justired | — |
| Notificaciones (`notificaciones-sorsabsa`) | ✅ condomanager, domuscrm | ⚠️ agente24siete no — `alertarAdmin()` sigue en TODO, avisa por WhatsApp (canal baneado), error se traga en silencio |
| Design system (`@sorsabsa/ui`) | ✅ 6/6 con UI: auth-sorsabsa, condomanager, justired, agente24siete, domuscrm, convertidor | `iot` no (Flask/Jinja — otro stack, no un hueco) |
| Geo (`@sorsabsa/geo` + `geo-sorsabsa/service`, #13) | ✅ Paquete: domuscrm. Servicio: SorsabsaForensic, `iot` | CondoManager no consume el paquete (Punta Blanca podría necesitarlo — sin arrancar) |

**Reinventado, encontrado con evidencia — y corregido en el camino, no solo
señalado:**

1. `iot` tenía su propio login (Basic Auth) → corregido, #14.
2. `iot` tenía su propia extracción de coordenadas de Maps, más débil que la
   de SorsabsaForensic (tomaba el encuadre, no el lugar — 22m de error real
   en la URL de prueba) → corregido, #13.
3. SorsabsaForensic tenía esa misma lógica por su cuenta, sin compartir con
   `iot` → unificada al servicio, #13.

Ninguno de los tres reinventos fue intencional — cada uno se construyó por
separado porque nadie tenía visibilidad de que el otro ya existía. Es
justamente lo que este ejercicio estaba pensado para sacar a la luz.

## 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA

Ampliado 08-ago-2026 a partir de un punto de Gina: ya existe un proyecto de
Google Cloud, `sorsabsaecosystem` (el mismo que tiene habilitada la Calendar
API que usa agente24siete, `ARQUITECTURA-ECOSISTEMA.md` §4-bis), y pidió
sumar Facebook además de Google. Sigue sin bloquear nada — ampliación del
Paso 1 de `PLAN-DESOLDADO.md`, no depende del Paso 3.

**Por qué en identity y no en cada producto:** los dos proveedores se dan de
alta UNA vez en `sorsabsa-identity` (el emisor OIDC único desde
`PLAN-DESOLDADO.md` Pasos 1-2, cerrados) — no en condomanager ni en ningún
proyecto de producto. Es una razón de arquitectura, no de negocio: como los
6 productos ya confían en identity, el proveedor se hereda gratis en todos
sin repetir el alta (Client ID + redirect URI) en cada proyecto Supabase por
separado. **No implica cuentas compartidas entre productos** — un residente
de CondoManager y un agente de DomusCRM no tienen relación, y cada producto
sigue emitiendo su propio usuario local y separado al federar (igual que ya
pasa hoy con email/contraseña, `PLAN-DESOLDADO.md` Paso 2). Corregido
08-ago-2026: la primera versión de este párrafo decía lo contrario — que
sería "la misma cuenta si comparte el email" entre CondoManager y DomusCRM,
lo cual es falso y quedó anotado para no repetirlo.

- ✅ **Código hecho** — `auth-sorsabsa` commit `af41efc`: `/oauth/consent`
  (la única pantalla de identity donde se escribe contraseña) ahora tiene
  "Continuar con Google" y "Continuar con Facebook", además del formulario
  de correo/contraseña que ya tenía.
  `identityClient.auth.signInWithOAuth({provider: 'google'|'facebook'})`,
  con el `authorization_id` viajando en el propio `redirectTo` (no en
  `sessionStorage`, que no sobrevive el salto a un dominio ajeno como
  `accounts.google.com`). Vuelve con la sesión de identity ya puesta y el
  mismo `useEffect` que ya existía la detecta y aprueba sola — cero cambios
  en el resto del flujo (`/auth/login`, `/auth/complete`). `typecheck` y
  `next build` limpios.
- ✅ **Google — HECHO y probado en vivo, 08-ago-2026.** Gina creó el cliente
  OAuth en `sorsabsaecosystem` (Google Auth Platform → Clientes →
  `sorsabsa_consola_google`, tipo **Aplicación web**) y lo habilitó en
  Supabase Dashboard → `sorsabsa-identity` → Sign In/Providers → Google.
  - 🐛 **Bug real encontrado y arreglado en el camino, no achacable a Gina**:
    el primer intento dio "authorization not found", reproducido incluso en
    incógnito con un solo intento limpio — no era doble clic ni sesión
    contaminada (se descartó leyendo los logs reales de `sorsabsa-identity`
    vía Supabase MCP, no adivinado). Causa real, confirmada contra la doc
    oficial de Supabase (OAuth 2.1 Server) y el tipo `OAuthAuthorizationDetails`
    del SDK: `/oauth/consent` nunca llamaba `getAuthorizationDetails()` antes
    de `approveAuthorization()` — ese paso es el que liga la autorización
    pendiente a la sesión real, y sin él la aprobación siempre fallaba.
    Corregido en `auth-sorsabsa` commit `c4cb79f`. Verificado en vivo por
    Gina después del fix: login con Google completa de punta a punta.
  - **Hallazgo aparte, esperado y correcto — no es un bug:** Gina entró con
    `gina.proanio76@gmail.com` y llegó con su acceso de superadmin de
    CondoManager intacto, sin haberlo pedido de nuevo. Es el comportamiento
    correcto de un SSO real: identity liga cuentas por email, así que el
    mismo correo resuelve al mismo perfil sin importar qué método de login
    se use para probarlo.
  - ✅ **Confirmado publicada y probada con una cuenta ajena** (no la de
    Gina): `sorsabsa@gmail.com` logueó bien contra identity y llegó hasta
    CondoManager, que la rechazó con "Tu cuenta no pertenece a ningún
    condominio" — la guardia correcta de CondoManager (sin perfil, sin
    acceso), no un fallo del SSO. Cierra Google del todo: funciona para
    cualquier cuenta Google, no solo la de Gina.
- 🐛 **Bug real #2, ecosistema entero, encontrado probando Facebook —
  "Cerrar sesión" no cerraba nada de verdad.** Al reintentar con otra
  cuenta, Gina quedó "colgada en un bucle" — CondoManager solo cerraba SU
  sesión local; la de `sorsabsa-identity` (el portero real desde
  `PLAN-DESOLDADO.md` Paso 2) seguía viva, y el OAuth Server de identity
  auto-aprueba una autorización ya consentida (`auto_approved: true`,
  confirmado en los logs reales vía Supabase MCP) — cualquier reintento
  volvía a autenticar en silencio a la MISMA cuenta, sin mostrar el login
  de nuevo. Afectaba a los 6 productos por igual, no solo a CondoManager
  (ninguno cerraba la sesión de identity). Corregido:
  - `auth-sorsabsa` commit `71a6bed` — `/auth/logout` (el "cierre
    universal" que ya existía de nombre, no de hecho) ahora cierra las DOS
    sesiones.
  - `condomanager` commit `b84f771` — el botón de la pantalla "sin perfil"
    pasa por ese logout compartido en vez de su atajo local.
  - ⏳ **Queda un gap menor, no urgente:** `condomanager/app/components/SignOutButton.tsx`
    (el "Salir del sistema" del sidebar normal, con la regla de salir a la
    web propia de cada condominio/asociación) sigue sin pasar por el
    logout compartido — a propósito, no se tocó: ese redirect a un dominio
    arbitrario (`puntablancaecuador.com`, etc.) no está en el allowlist del
    logout compartido y hubiera roto esa regla de negocio sin más trabajo.
    Mismo gap probablemente presente en el resto de productos (nadie más
    fue auditado todavía) — pendiente de un barrido aparte si hace falta.
- ✅ **Facebook — HECHO y probado en vivo, 08-ago-2026.** App nueva y
  separada en Meta for Developers, **"Sorsabsa Identity"** (App ID
  `1851084815870458`, aislada del portafolio de WhatsApp de agente24siete
  a propósito: una app "Business" con WhatsApp habría ofrecido "Facebook
  Login for Business", un flujo distinto pensado para activos de negocio,
  no para autenticar personas). App ID/Secret pegados en Supabase
  Dashboard → `sorsabsa-identity` → Sign In/Providers → Facebook.
  - **Camino real hasta que anduvo (tres correcciones mías sobre la
    marcha, ninguna intuida a la primera):**
    1. "Dominios de la app" (Configuración → Básica) tenía que llevar el
       dominio de identity (`gyqgorgfstffbgazhbnb.supabase.co`) — dije
       primero que era opcional; el propio error de Facebook
       ("El dominio de esta URL no está incluido...") probó que es
       obligatorio para este flujo.
    2. El redirect URI (`.../auth/v1/callback`) nunca había quedado
       guardado de verdad en Facebook Login → Configurar → "URI de
       redireccionamiento de OAuth válidos" — el campo estaba vacío, Gina
       lo había probado en el validador de arriba (que solo comprueba,
       no guarda) sin darse cuenta de que eran dos campos distintos.
    3. El permiso `email` (el único scope que pide Supabase) no estaba
       agregado en Casos de uso → Personalizar → Permisos y funciones —
       ahí el error fue "Invalid Scopes: email". Se agregó con el botón
       "+ Agregar" de esa fila.
  - ✅ **Probado con una cuenta real y ajena:** `gina.proanio@hotmail.com`
    (vinculada a Facebook) logueó bien contra identity y llegó hasta
    CondoManager, que la rechazó con "Tu cuenta no pertenece a ningún
    condominio" — mismo patrón exacto que el cierre de Google: el login
    funciona, CondoManager filtra por su regla propia.
  - ✅ **Revisión de Meta — APROBADA.** Enviada 08-ago-2026; Meta contestó
    el **mismo día**, 8 de agosto de 2026 a las 18:55 GMT-5 (mucho antes de
    los ~20 días estimados): *"Solicitud aprobada — Completamos la revisión
    y se aprobaron las solicitudes y la configuración de la app."* App
    **"Sorsabsa Identity"** (App ID `1851084815870458`). A partir de acá
    `email` vía Facebook Login funciona para cualquier usuario, no solo
    administradores/desarrolladores/testers — cierra del todo el login
    social de identity (Google + Facebook, ambos ✅ en producción).
    - "Uso permitido" y "Tratamiento de datos" completados. En este
      último, corregido en el camino: el encargado del tratamiento
      declarado inicialmente era solo Gina — se agregó **Supabase, Inc.**
      como segundo encargado (categoría "Alojamiento en la nube"), porque
      el email que llega de Facebook queda guardado en la base de
      `sorsabsa-identity`, no solo procesado por Gina. Las preguntas sobre
      solicitudes de datos a autoridades por seguridad nacional: "No" (es
      la realidad — nunca pasó) y "Ninguna de las anteriores" en políticas
      relacionadas (no hay un proceso formal escrito a esta escala).
    - 🐛 **Confusión real en el camino, corregida:** "Dominios de la app"
      y "URL del sitio" (plataforma Sitio web) quedaron desincronizados
      dos veces — una vez por mi propia instrucción ambigua (mezclé el
      campo "¿Dónde podemos encontrar la app?" del popup de instrucciones
      de prueba, que sí va `condomanager.vip`, con "URL del sitio" de la
      plataforma, que va `auth.sorsabsa.com`), y otra vez porque Gina
      recibió una sugerencia de otra herramienta con datos desactualizados
      (decía borrar el dominio de Supabase, lo que habría reproducido el
      primer error). Estado final correcto: "Dominios de la app" =
      `auth.sorsabsa.com` + `gyqgorgfstffbgazhbnb.supabase.co` (los dos,
      sin `https://`); "URL del sitio" = `https://auth.sorsabsa.com`.
- ✅ **UI — botones de Google/Facebook lado a lado, no apilados.** Pedido
  de Gina 08-ago-2026 (con los dos uno debajo del otro el formulario
  quedaba largo). `auth-sorsabsa` commit `afa4ee6`. `typecheck`/`next
  build` limpios.

## 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado

Cerrado 08-ago-2026, `agente24siete` commit `82b66e4`. `/admin` ya estaba con
el mismo portero que el resto del ecosistema (login local muerto limpiado
antes, commit `447b1bb`). Los dos puntos que quedaban:

- **`/portal` (panel de CLIENTE) ya tiene login real.** Creado
  `app/portal/LoginGate.tsx` (mismo patrón que `/admin`) y conectado en
  `app/portal/layout.tsx`. Al conectarlo apareció un bug real: `/auth/callback`
  escribía siempre `a24_admin_token` sin mirar `next` — `/admin` y `/portal`
  comparten una sola entrada `agente24siete` en el allowlist de auth-sorsabsa
  (sin `app=` distinto por rol), así que un login que volvía a `/portal`
  quedaba con el token en la llave equivocada. Corregido: decide por el
  prefijo de `next`. El backend ya validaba bien por JWKS — nunca fue un
  agujero de seguridad, solo faltaba el flujo del navegador.
- **`pages/api/admin/index.js` y `pages/api/portal/index.js`** (~1500 líneas,
  panel viejo PRE-Fase-3 en HTML+JS autocontenido) — confirmado sin
  referencias en todo el repo, Gina decidió borrarlos. Hecho.

`next build` verificado en cada paso. Detalle en `agente24siete/README.md` y
`todo.md` (Fase 3).

## 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente

`unidad_fotos` subía a Supabase Storage en vez de R2 (`ARQUITECTURA-ECOSISTEMA.md`
dice R2 = objetos; el patrón ya existía y funcionaba en `legaltech/scraper/r2.py`).
Corregido 08-ago-2026 reusando el patrón TypeScript que ya existía
(`crm_inmobiliario/backend/src/lib/storage.ts`: URLs prefirmadas) —
`condomanager` commit `232111e`.

Bucket y credenciales reales de Gina, verificados con un script real
(presign → PUT → GET público → borrado) contra el bucket de verdad: **funciona
de punta a punta.** Variables en Vercel producción, redeploy hecho y `READY`.

**⏳ Sin probar: el clic real de un residente subiendo una foto por la UI** —
no se fabricó esa prueba tocando cuentas reales sin permiso.

## 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales

Arrancado 08-ago-2026 a partir de un punto real de Gina: SorsabsaForensic e
`iot` (Inspección Ocular Técnica, no dispositivos IoT — nombre engañoso,
repo real `c:/iot/iot`) tenían cada uno su propia extracción de coordenadas
de un enlace de Google Maps, escrita por separado — riesgo real porque los
dos generan informes que sostienen afirmaciones ante tribunal. Detalle en
`ARQUITECTURA-ECOSISTEMA.md` §4-bis.

- ✅ `geo-sorsabsa/service/` — FastAPI, porta de SorsabsaForensic la
  resolución de enlaces + extracción de coordenadas + distancia/rumbo.
  Commit `09cf93d`. Probado: 8/8 unitarios + en vivo contra Google real.
- ✅ Railway creado por Gina, root directory `service/`, proyecto
  `passionate-grace` — 08-ago-2026. **Verificado en vivo**:
  `https://geo-sorsabsa-production.up.railway.app` — `/`, `/distancia` y
  `/resolver` responden bien, incluido el caso real con tilde sin codificar
  (el bug de arriba, confirmado arreglado en producción, no solo en local).
  Hubo un tropiezo real en el camino: dije que pusiera el puerto `8010`
  (el de la Dockerfile) en el dominio público de Railway — el contenedor en
  realidad escuchaba en `8080` (el `$PORT` real que asigna Railway, que el
  código sí lee bien vía `os.getenv`), y hasta corregir el puerto del
  dominio el servicio daba 502. Diagnosticado con `railway logs` (CLI ya
  instalada y con sesión iniciada — no hubo que pedir logs a mano).
- 🔴 **Bug real encontrado, arreglado en el servicio nuevo, NO portado de
  vuelta a SorsabsaForensic:** `UnicodeEncodeError` en la resolución de
  enlaces cuando la URL trae una tilde o ñ sin percent-encoding (copiar la
  barra de direcciones del navegador tal cual, con un nombre de lugar en
  español — plausible en Ecuador). Afecta
  `SorsabsaForensic/core/processors/georeferencia/processor.py::_resolver_enlace`
  (el mismo patrón de `urllib.request` sin normalizar la URL). El arreglo
  ya existe, portado, en `geo-sorsabsa/service/geo_core.py::_normalizar_url_ascii`
  — falta decidir si se lleva a SorsabsaForensic (código pericial, no se
  tocó sin permiso) o si directamente ese repo pasa a llamar al servicio
  nuevo y el bug queda resuelto por esa vía.
- ✅ **Cerrado 08-ago-2026 — los dos consumidores repuntados y probados
  contra el servicio real en producción** (Gina: "los peritajes realizados
  ya fueron entregados... no tengas recelo de afectar algún expediente" —
  una vez entregado el expediente al juez, la copia local ya no es la que
  cuenta, así que no había razón para seguir esperando):
  - `SorsabsaForensic` commit `f40b08d` (repo `ginaproanio/sorsabsaforensic`,
    `c:/sorsabsa/SorsabsaForensic`): se eliminó toda la lógica local de
    resolución/distancia (`_resolver_enlace`, `_datos_del_enlace`,
    `_distancia_y_rumbo`, `_cardinal` y sus regexes) — ahora llama al
    servicio. Sin cálculo local de respaldo si el servicio no responde, a
    propósito: falla declarado como limitación, no un número sin verificar.
    Lo que se queda local (`_clasificar_vista_calle`, la captura con
    Playwright) no lo toca el servicio — necesita un navegador real.
  - `iot` commit `49548dd` (repo `ginaproanio/iot`, `c:/iot/iot`):
    `report_service.py::_maps_replace` dejó su regex local
    (`@(-?\d+\.\d+),(-?\d+\.\d+)`, que solo servía con URLs ya expandidas y
    tomaba el CENTRO DEL ENCUADRE, no el lugar) y ahora llama al servicio.
    **Esto no fue solo deduplicar**: probado con una URL real, la
    coordenada vieja y la correcta difieren ~22 metros — `iot` estaba
    reportando la posición equivocada. Se degrada sin romper el informe si
    el servicio no responde (el mapa es un plus, no una obligación).
  - Los dos probados de punta a punta contra
    `https://geo-sorsabsa-production.up.railway.app` real, no mocks.
    `python -m py_compile` limpio en ambos.

## 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa)

Cerrado 08-ago-2026, a partir de un punto de Gina revisando el pendiente 9
(reuso de compartidos): "iot debería consumir también el portero de
sorsabsa". `iot` tenía su propio login (HTTP Basic Auth, credenciales por
variable de entorno `PATRICIO_USER`/`SUSANA_USER`) — el único producto que
no usaba el SSO.

**Corrección de rumbo en el camino:** la primera propuesta era abrir una
sesión de Flask del lado del servidor para "adaptar" el flujo a un stack
sin cliente JS pesado. Gina: *"¿no quedamos en que se estandarice el
consumo de los compartidos? porque tenemos que adaptarnos en vez de
desarrollar como corresponde?"* — tenía razón: eso introducía un modelo de
seguridad distinto al resto del ecosistema. Lo estándar (verificado en
`agente24siete/lib/adminAuth.js`) es **verificación JWKS stateless en cada
request, sin sesión de servidor**. `iot/iot_system/app/auth_sso.py` porta
exactamente eso — la única diferencia real es de transporte (una
navegación de página no puede mandar `Authorization: Bearer`, así que el
token viaja en una cookie httponly en vez de un header), no de modelo de
seguridad: se reverifica la firma por JWKS en cada petición igual que en
cualquier otro producto.

- `iot` commit `b6a01d5` (repo `ginaproanio/iot`): `requires_auth` (Basic
  Auth) reemplazado, `/auth/callback` nuevo, `/logout` ahora borra la
  cookie de verdad (con Basic Auth ni eso se podía). "Un usuario por
  persona" se mantiene — la identidad ya no sale de comparar credenciales,
  sale de `user_metadata.identidad_iot` del usuario de Supabase.
- `auth-sorsabsa` commit `263531d`: `iot` registrado en el allowlist
  (`BRANDS.sorsabsa`, sin marca propia — mismo criterio que `convertidor`).
- **Cuentas reales creadas** (Admin API, invite por email vía Resend):
  `patricio.marmol@hotmail.com`, `susi.espinosa@hotmail.com`. Deben entrar
  a su correo y fijar contraseña antes del primer login real.
- Probado de punta a punta con un token REAL (magic link redimido vía
  Admin API, no un mock): sin cookie → redirect al portero; callback →
  verifica y guarda cookie; con cookie → acceso; ruta `fetch()` sin cookie
  → 401 JSON, no redirect (rompería el `fetch`); logout → borra la cookie.
- ⏳ **Pendiente, no urgente**: `PATRICIO_USER`/`PATRICIO_PAS`/
  `SUSANA_USER`/`SUSANA_PAS`/`ADMIN_USER`/`ADMIN_PAS` en Railway ya no los
  lee ningún código (confirmado por grep) — se pueden borrar del dashboard
  cuando convenga, no rompen nada si quedan.
- **⚠️ Corrección 08-ago-2026, no volver a repetir el error:** `iot` NO
  tiene su propio proyecto de Supabase — sus usuarios viven en
  **`verticales_sorsabsa`** (`twkuidnjwhopbjnrhnxp` — Gina le cambió el
  nombre el 08-ago-2026 en el Dashboard, antes decía "condomanager";
  el cambio de nombre es solo cosmético, no toca ref/URL/keys de nada).
  **Este proyecto YA era compartido antes de `iot`** — convive con
  CondoManager (schema `public`), DomusCRM (`domus`) y JustiRed
  (`justired`), decisión de arquitectura previa documentada en
  `ARQUITECTURA-ECOSISTEMA.md` §3 (ahorrar los $10/mes por proyecto
  nuevo mientras no hay clientes pagando). `iot` quedó ahí por el default
  hardcodeado en `iot_system/app/auth_sso.py:33`
  (`SUPABASE_URL = os.getenv("SUPABASE_URL", "https://twkuidnjwhopbjnrhnxp.supabase.co")`)
  — creado por un asistente al implementar el portero de `iot`, sin
  preguntar antes en qué proyecto crearlo. `iot` no necesita tablas
  propias de Postgres (solo login), así que compartir identidad no
  acopla datos: cada app filtra acceso con su propia regla
  (CondoManager por `perfiles`, `iot` por `user_metadata.identidad_iot`)
  — estar en la misma tabla `auth.users` no da acceso cruzado a nada.
  Sin decidir todavía si se le da a `iot` un proyecto propio de todos
  modos ($10/mes) — anotado para no perderlo, no para resolverlo ahora.
  Confirmado en vivo con SQL real, no adivinado: Patricio
  (`patricio.marmol@hotmail.com`) confirmó e inició sesión bien
  (invitado 08-ago 15:11, `last_sign_in_at` con dato); Susi
  (`susi.espinosa@hotmail.com`, invitada 08-ago 15:12) nunca confirmó
  (`confirmed_at` null) — coincide con el enlace vencido que reportó. Para
  administrar estos usuarios (reenviar invitación, etc.), el Dashboard
  correcto es **`verticales_sorsabsa`**, no `sorsabsa-identity`.
- ✅ **Tres bugs reales encontrados probando la invitación de Susi,
  corregidos 08/09-ago-2026:**
  1. `auth-sorsabsa` commit `8952ce8` — `src/app/page.tsx` no existía:
     cualquier `redirect_to` sin path (como el de esta alta por Admin
     API) caía en 404 crudo al fallar el enlace. Ahora esa ruta existe y
     muestra un mensaje entendible.
  2. `auth-sorsabsa` commit `8952ce8` — el correo de invitación mostraba
     solo la marca institucional "SORSABSA" para apps sin marca propia
     (`iot`, `convertidor`) — Susi no reconoció el nombre y se asustó.
     Ya se pasaba `config.welcome` ("Acceso a IOT") a la pantalla de
     login pero no al correo; ahora también se muestra ahí.
  3. 🔴 **El más grave: el portero de `iot` (commit `b6a01d5`, 08-ago)
     nunca se había desplegado a Railway.** Gina seguía viendo el modal
     viejo de Basic Auth al entrar a `iot-production-d29b.up.railway.app`
     — no por un bug de código, sino porque Railway seguía sirviendo el
     deploy del 29-jul (`7a55d60`), dos commits atrás; el auto-deploy no
     se disparó solo tras el push. Confirmado con `railway status --json`
     (deploy activo = commit viejo) antes de tocar nada. Forzado con
     `railway up` y verificado en vivo: `curl` a la raíz ahora da `302` a
     `auth.sorsabsa.com/auth/login?app=iot`, sin `WWW-Authenticate`. Sin
     determinar todavía por qué el auto-deploy de Railway no se disparó
     solo con el push — revisar si vuelve a pasar con el próximo commit.
  4. `auth-sorsabsa` commit `e456fc7` — `/oauth/consent` (donde se
     escribe la contraseña de verdad) mostraba texto fijo ("Un acceso,
     todos tus productos") para cualquier app, ignorando
     `welcome`/`subtitle` de `AppConfig` que `/auth/login` sí usaba.
     Ahora usa el mismo dato en las dos pantallas.
- ✅ **`iot` consiguió marca propia, 08-ago-2026** — hasta acá usaba
  `BRANDS.sorsabsa` (genérica) en todo el login/correo aunque sus
  informes PDF (`iot_system/app/services/report.css`) ya tenían una
  identidad real: navy `#1B2A40` + dorado `#D4AC0D` + azul info `#2980B9`,
  nunca extraída al sistema de diseño. Gina la encontró y se agregó a
  `diseno-sorsabsa/src/brand/brands.ts` (`@sorsabsa/ui` v0.1.39, commit
  `b5c56a2`) y se conectó en `auth-sorsabsa/src/lib/apps.ts` (commit
  `c1e1120`). Ya no debería verse "SORSABSA" genérico en ninguna pantalla
  de `iot`.
- ✅ **`scripts/invite-user.mjs` (`auth-sorsabsa`, commit `70805aa`)** — el
  botón "Invite user" del Dashboard de Supabase no deja fijar
  `redirect_to`, así que el correo salía con la marca institucional
  genérica sin importar el fix de arriba (probado en vivo: Gina invitó a
  Susana desde el Dashboard y le llegó "Bienvenida a SORSABSA", no la
  marca de `iot`). El script sí fija `redirect_to` con `?app=`, reusable
  para cualquier producto/usuario futuro. Uso:
  `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/invite-user.mjs <email> <app>`
  (la llave de `verticales_sorsabsa` ya está en `condomanager/.env.local`,
  mismo proyecto).
- 🔴 **Bug real #4, el más grave de los cuatro — `auth-sorsabsa` commit
  `4c6c1cc`.** Con el correo ya bien y el enlace funcionando, Susana llegó
  a loguearse de verdad y quedó bloqueada en `/auth/complete` con "No
  pudimos verificar tu cuenta / Hubo un problema técnico al validar tu
  suscripción". Causa real: `lib/entity-resolver.ts::resolveEntitySubject`
  solo tenía casos para `condomanager`/`domuscrm` — cualquier otra app
  (incl. `iot`, herramienta INTERNA sin nada que cobrar) caía al
  fallback (`subject: userId`, sin bypass) y `/api/entitlements` terminaba
  pidiéndole a `pagos-sorsabsa` la suscripción de un producto que nunca
  estuvo ahí para venderse. Agregado bypass explícito para `iot` y
  `convertidor` (mismo caso: ambas son herramientas de uso interno, no
  productos con clientes pagando) — mismo patrón que el bypass ya
  existente para superadmin sin condominio/empresa.
- 🔴 **Bug real #5 — el que de verdad causaba el "bucle" (`auth-sorsabsa`
  commit `cb045fd`).** Con el #4 arreglado, Susana llegó más lejos pero
  quedó atrapada rebotando cada 2-9 segundos entre `/oauth/authorize` y
  `/auth/complete` — confirmado con los logs reales de `auth` de AMBOS
  proyectos (identity y `verticales_sorsabsa`), no adivinado. Causa: el
  campo `AppConfig.callbackUrl` ("el destino real tras el login", según
  su propio comentario) existe desde que se armó el allowlist, pero
  **nunca se usaba en ningún lado** — ni `resolveSafeRedirect` ni
  `/api/redirect-allowed` lo consultan, el destino final siempre caía en
  la raíz del producto con el token en el fragment. Los productos Next.js
  lo toleraban de pura casualidad (su cliente de Supabase detecta la
  sesión en cualquier página); `iot` es Flask server-rendered — solo
  `/auth/callback` sabe canjear el fragment por una cookie
  (`iot_system/app/editor.py`). Sin pasar por ahí, la raíz nunca ve cookie
  válida y rebota a `/auth/login`, que con sesión de identity ya puesta
  auto-aprueba sola (mismo mecanismo `auto_approved: true` del bug #2) y
  repite el ciclo — el bucle real que describió Gina.
  - Arreglo **acotado a `iot` a propósito**: los demás productos ya
    funcionan hoy (verificado en vivo por Gina varias veces con Google y
    Facebook) y cada uno de sus `/auth/callback` espera el destino final
    en un lugar distinto — CondoManager por query `?redirect=`, no en el
    fragment. Homologar a todos los productos para que `callbackUrl` se
    use de verdad en todos lados es trabajo aparte, con una convención a
    definir primero (fragment vs query), no algo para tocar a ciegas
    mientras había una persona real bloqueada.
  - ✅ **Confirmado en vivo, 08-ago-2026** — con `auth-sorsabsa` commit
    `4375183` (el script de invitación redirige a `/auth/complete`, no a
    `/auth/login` — evita todo el show de OAuth que quedaba secuestrado
    por una sesión de identity ajena ya activa en el mismo navegador),
    Gina entró desde el correo de Susana y llegó de verdad al sistema.
- 🚨 **Bug propio, encontrado en el camino — commit `b29e7b2` de `iot`
  arrastró por error fotos y documentos de un expediente real (casos
  "eloy-alfaro-susana" y "pomasqui-susana") más dos scripts personales de
  Gina, con un `git add -A` descuidado.** Corregido en el commit
  `2f1ac56`: sacados del tracking (`git rm --cached`, siguen en disco) y
  agregados a `.gitignore` (`cases/`, `sync_*_a_railway.py`) para que no
  vuelva a pasar. **Quedan en el historial del commit anterior** — no se
  reescribió el historial (force-push) sin confirmar con Gina primero.
- ⏳ **Pendiente — expedientes de `iot` a R2, todavía sin bucket.**
  Mismo patrón que el resto del ecosistema (`ARQUITECTURA-ECOSISTEMA.md`:
  R2 = objetos) — hoy los expedientes de `iot` viven en disco/Volume de
  Railway, nunca debieron pasar por git en primer lugar (causa raíz del
  punto de arriba). Falta crear el bucket de R2 para `iot` y portar el
  patrón de subida ya usado en `legaltech/scraper/r2.py` /
  `condomanager` (pendiente #12) — sin empezar.

## 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas

Abierto 08-ago-2026. **No volver a preguntar esto — está todo acá.**

**Hecho confirmado (pantalla, no interpretación):** en Business Settings →
Cuentas de WhatsApp del portafolio comercial **"Sorsabsa Servicios"**
(verificado ✓), TODAS las cuentas están **"Desactivada"** con el mismo
motivo: *"Esta cuenta se inhabilitó porque no cumple la Política de comercio
de WhatsApp Business."* — agente24siete, CondoManager, PuntaBlanca,
EcoInmobiliaria, Sorsabsa (x2), y hasta la de prueba. Confirmado también
desde WhatsApp Manager (no solo el resumen de Business Settings). El número
de CondoManager (+593 99 321 7356) y el de agente24siete (+593 99 321 9056)
muestran además "No verificado" — consecuencia del baneo de la cuenta, no un
fallo de Gina en el paso de verificación por código (ese sí lo completó).

**Causa real, según relato directo de Gina:** registró varias líneas
celulares en 2-3 días seguidos; la última (agente24siete) se quedó sin
batería a mitad de la verificación por código, la completó recién al día
siguiente — y ese mismo día se desactivaron TODAS de golpe, **antes de que
ninguna mandara un solo mensaje real**. Encaja con el patrón conocido de
Meta de marcar como riesgo el **alta masiva de números en poco tiempo**
dentro de un mismo Business Manager — no con el contenido de los mensajes
(no puede ser spam algo que nunca se usó).

**Gina ya agotó la vía de autoservicio, repetidas veces, sin éxito** —
esto no es un intento nuevo.

**Segundo problema, más grande, enredado con el primero:** los activos
comerciales (incl. estas cuentas de WhatsApp) quedaron atrapados en un
perfil personal de Facebook viejo, `gina.proanio.3`, al que Gina perdió
acceso porque el 2FA estaba atado a una línea corporativa de un trabajo
anterior que ya devolvió. El perfil actual, `gsproanio`, es donde opera
hoy. Meta trata la operación desde dos identidades distintas sobre los
mismos activos como señal de riesgo — lo que traba también la apelación
del baneo de arriba. Gina ya escribió un "Resumen de Hechos" ordenado para
posible asesoría legal (vive en su disco local, no en el repo).

**🚨 Advertencia real, no descartar:** en el camino, otra IA/bot (no esta
sesión) le dio "diagnósticos técnicos" con tablas y IDs de aspecto oficial
(ej. "Heurística de seguridad (Duplicidad)", "Access Block [Spam]") y un
link de soporte que se verificó como **404, no existe**. Ningún bot de
soporte puede consultar en vivo los sistemas internos de Meta — eso es
contenido inventado con formato de autoridad, no un hallazgo real. Peor:
recomendó declarar la cuenta como **"hackeada"** (`facebook.com/hacked` →
"Alguien más entró en mi cuenta") para forzar atención humana, **aunque no
fue un hackeo** — es pérdida de acceso a 2FA. Gina ya identificó por qué
eso es un error (distorsiona la realidad del caso, puede jugar en contra
si se descubre). **No seguir ese consejo. No declarar un hackeo que no
ocurrió.**

**Decisión — dos pistas independientes, una no bloquea la otra:**

1. **Recuperación de identidad/activos (`gina.proanio.3` + baneo de las
   WABA)** — estancada por autoservicio. Probablemente necesite Soporte de
   empresas de Meta **pagado**, o asesoría legal real. Sin dueño ni fecha
   todavía.
2. **Que WhatsApp vuelva a funcionar para agente24siete, en paralelo, sin
   depender de que (1) se resuelva** — camino más corto: registrar el canal
   vía **Twilio** (ya integrado en agente24siete para voz,
   `docs/twilio.md`), que es Proveedor de Soluciones oficial de WhatsApp
   Business (BSP) — puede tener una vía de escalamiento con Meta que un
   desarrollador individual no tiene. No es garantía, vale explorarlo
   cuando se retome.

**En curso, 08-ago-2026 — Revisión de la app "Sorsabsa Asistente" en Meta
for Developers:** **esto es independiente de (1) y (2)** — pedir acceso
avanzado a los permisos (`whatsapp_business_messaging`,
`whatsapp_business_management`, `business_management`, `public_profile`)
es un prerrequisito para operar en vivo con cualquier número, más allá de
cuándo se resuelva el baneo actual. Portafolio comercial ya verificado
("Sorsabsa Servicios" ✓), ícono/política de privacidad/categoría de
"Configuración de la app" ya cargados (política de privacidad verificada
en vivo: `sorsabsa.com/privacy-policy/`, existe y menciona explícitamente
"Sorsabsa Asistente"). "Uso permitido" avanzado con llamadas de prueba
reales por Graph API Explorer (`me/businesses`,
`1771240747588175/phone_numbers`) — quedan videos de pantalla por subir en
2 de los 4 permisos, después "Tratamiento de datos" e "Instrucciones para
revisores" — mismo checklist que ya se hizo con éxito para la app de login
(Sorsabsa Identity, pendiente #10).

**🔍 Hallazgo suelto, sin resolver, no bloquea la revisión:** la llamada de
prueba a `1771240747588175/phone_numbers` (número de CondoManager) mostró
`webhook_configuration.application: "https://asistentepericial.vercel.app/api/webhook"`
— un dominio que no es de agente24siete (suena a la línea pericial/forense).
Revisar cuándo se destrabe el baneo; hoy no importa porque la cuenta no
manda ni recibe nada de todos modos.

## 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar

**Decisión de Gina, 09-ago-2026:** suscripciones, pagos y referidos deben
estar implementados en cada producto vertical del ecosistema (CondoManager,
DomusCRM, agente24siete, JustiRed, etc.) — no es una idea nueva, ya es el
principio documentado en `condomanager/docs/PAGOS.md` y
`crm_inmobiliario/webs/docs/SUSCRIPCIONES.md` (11/15-jul-2026): un servicio
centralizado (`pagos-sorsabsa`), entidad = quien paga (no siempre la
persona que loguea), cada producto llama `crear-trial` en su alta.

**Estado real por producto, verificado en código (no supuesto):**

| Producto | `entity-resolver.ts` | `crear-trial` en el alta | Referidos | Pago de suscripción self-service |
| --- | --- | --- | --- | --- |
| CondoManager | ✅ `resolve_condominio_for_user` | ✅ `registro-admin` | ✅ `/admin/referidos` | ✅ RESUELTO 09-ago-2026 (`condomanager@0175814`) |
| DomusCRM | ✅ `resolve_company_for_user` | ✅ `registro-agencia` | ✅ `api/referrals` | ❌ mismo gap — no se tocó todavía, no existe ni la pantalla |
| agente24siete | ✅ bypass (modelo real es saldo, no suscripción — ver `AUDITORIA-PORTERO-SSO.md` 🔴-6) | N/A (no aplica) | ✅ `/portal/referidos`, pero el premio (días de suscripción) no conecta con nada real | ✅ `/portal/recargas` (esto SÍ es self-service, pero es saldo, no plan) |
| JustiRed | ❌ sin caso, cae al fallback (`subject: userId`) | ❌ no existe ninguna llamada | ❌ nada | ❌ nada — **tampoco hay página de registro propia** |

**✅ RESUELTO para CondoManager, 09-ago-2026 (`condomanager@0175814`) — el
pago de la suscripción DEBE ser self-service, no "Contactar a Ventas".**
Hasta ahora CondoManager y DomusCRM resolvían ese gap con un simple
`mailto:` — un admin de condominio o una inmobiliaria no tenía forma de
pagar/renovar su plan sin escribir a soporte y esperar. `pagos-sorsabsa`
ya tenía lo necesario para esto sin construir nada nuevo del lado del
motor: `/api/iniciar` (Capa 1, cuenta propia de SORSABSA vía
`PAYPHONE_TOKEN`/`PAYPHONE_STORE_ID`) acepta `suscripcion: { plan, dias,
sujeto }`, que al aprobarse extiende `pagos.suscripciones`
automáticamente (`api/confirmar.js`, `extenderSuscripcion`) — es la MISMA
pieza que ya usa `/portal/recargas` de agente24siete, solo que ahí se usa
para saldo.

`POST /api/admin/suscripcion` (nuevo) llama a `/api/iniciar` con los 3
planes ya publicados en la landing ($29/$79/$149 — precio resuelto en el
servidor, nunca confiado del cliente), sin `entidadId` (Capa 1, no
confundir con la Capa 2 que usa el condominio para cobrar a sus propios
residentes). `suscripcion.sujeto = condominio_id` — el mismo que ya
consulta el GET de ese archivo vía `/api/entitlements` — a propósito, para
NO repetir el bug real ya documentado más abajo en este mismo punto:
`justired-payments-iniciar` manda un id de transacción descartable como
`sujeto`, así que ningún pago ahí puede reconciliarse con una sesión real
después. `suscripcion/page.tsx` gana una sección "Elige tu plan" con los
3 planes y un botón "Pagar y activar" que redirige a PayPhone. Verificado:
typecheck y eslint limpios; no se hizo una llamada real a PayPhone (habría
generado un intento de cobro real en la cuenta de Gina) — las mismas
credenciales ya las usa el GET de ese archivo, en producción, confirmado
funcionando.

**Sigue pendiente: el equivalente en DomusCRM.** No se tocó en esta pasada
— hoy DomusCRM ni siquiera tiene una pantalla de suscripción/facturación
propia (se buscó, no existe; solo `admin/profile` para datos de la
agencia). Construirla es alcance nuevo, no una edición como la de
CondoManager.

**Pendiente de analizar, planteado por Gina, 09-ago-2026: ¿es correcto que
`suscripciones` viva DENTRO de `pagos-sorsabsa`, o debería ser su propio
servicio?** Ya quedó anotado en `ARQUITECTURA-ECOSISTEMA.md` (fila
"Suscripciones") que son dominios distintos — "¿quién tiene acceso a qué?"
no es "¿cómo se procesó este cobro?" — pero hoy comparten repo, base
Postgres y schema (`pagos.suscripciones`, junto a `pagos.pagos`/
`pagos.comercios`/`pagos.referido_*`), a diferencia de `notificaciones`,
que sí es un servicio Railway aparte. **No decidido todavía — queda para
analizar, no para ejecutar a ciegas:**

- A favor de separarlo: mismo argumento de siempre en este ecosistema
  (identity no puede vivir dentro de un producto, §3 de
  `ARQUITECTURA-ECOSISTEMA.md`) — "quién tiene acceso" es un servicio que
  todo el ecosistema consulta constantemente (cada login pasa por acá),
  mientras que "pagos" es transaccional y más pesado (llamadas a
  PayPhone, credenciales cifradas por comercio). Separar reduce el radio
  de un incidente: un problema en el procesador de pagos no debería poder
  tumbar el chequeo de acceso de todo el ecosistema, y viceversa.
- En contra / a favor de dejarlo como está: `api/confirmar.js` extiende
  la suscripción DENTRO de la misma función que confirma el pago
  (`extenderSuscripcion`, ver arriba) — son pocas tablas, poco tráfico
  hoy, y separarlo hoy es un servicio nuevo que mantener (otro deploy,
  otra clave, otra URL) por un beneficio que todavía no se siente
  (nadie reportó un incidente donde uno tumbó al otro).

Sin decisión de Gina, no se toca la infraestructura — esto es solo para
que quede visible la próxima vez que se revise arquitectura de fondo.

**JustiRed es el riesgo real, no solo un hueco de checklist:** está
registrado en `auth-sorsabsa/src/lib/apps.ts` (pasa por el SSO central,
tiene `AuthCallback.tsx`), así que cualquier usuario real que loguee por
primera vez ejecuta el mismo camino que bloqueó a DomusCRM el 15-jul y a
agente24siete hace un rato: `resolveEntitySubject` no tiene su caso, cae a
`{subject: userId}`, pregunta a `pagos.suscripciones`, no hay fila, "Sin
suscripción activa". Sin una página de registro propia, hoy no está claro
cómo se da de alta un cliente nuevo de JustiRed en absoluto.

**Corrección, 09-ago-2026 — JustiRed no está en blanco, tiene MÁS que
CondoManager/DomusCRM en un punto y les falta en otro.** Ya existe una
pantalla pública de precios (`src/pages/Pricing.tsx`, ruta `/planes`) que
llama a una función real (`supabase/functions/justired-payments-iniciar`)
que **sí** usa el motor centralizado correctamente — `pagos-sorsabsa
/api/iniciar`, con su propia `PAGOS_API_KEY_JUSTIRED` (confirma lo que ya
se había visto en Railway: cada producto con su llave), y manda
`suscripcion: {plan, dias, sujeto}` para que se auto-extienda al
aprobarse. Eso es exactamente el botón self-service que a CondoManager y
DomusCRM les falta (arriba en este mismo punto).

**Pero el flujo es 100% anónimo — ahí está el problema real.** Cualquiera
llena nombre/email/teléfono en `/planes` y paga, **sin loguearse, sin
crear ninguna cuenta**. El `sujeto` que se manda es
`justired-${Date.now()}-${random}` — un ID de transacción nuevo en cada
pago, nunca el mismo dos veces. La fila que queda en `pagos.suscripciones`
no se puede volver a encontrar: ningún login futuro, con ningún usuario
real, va a coincidir jamás con ese sujeto. Es un pago que paga algo, pero
no puede desbloquear una sesión real después. (Tablas relacionadas,
preexistentes y desconectadas de todo esto:
`justired.subscription_plans`/`justired.lawyer_subscriptions`, sin
`auth_user_id` ni relación con `auth.users`.)

**Por dónde empezar cuando se retome (no es la pregunta de individual vs.
jurídica todavía):**

1. Una tabla que vincule al abogado con su cuenta real de Supabase
   (`auth_user_id`) — mismo patrón que `domus.companies`. Un despacho de 1
   persona es solo una fila con un usuario; no hace falta resolver lo de
   equipos/créditos para dar este paso.
2. Construir el registro real (hoy no existe) que cree esa fila y llame a
   `crear-trial`, igual que `registro-admin`/`registro-agencia`.
3. Agregar el caso `justired` en `entity-resolver.ts`.
4. Conectar `Pricing.tsx` al usuario logueado real en vez del formulario
   anónimo, mandando ese `id` estable como `sujeto` en vez del ID de
   transacción descartable.

**Por qué no se construye ya — respuesta textual de Gina al preguntarle
quién es la entidad que paga en JustiRed:** *"quien se registra y no he
contemplado que sea persona natural o jurídica, pero sí que se debe
considerar los dos tipos; si es un paquete individual puede manejar el
sistema solo, si es un cierto número de usuarios aquí puede haber un
volumen de usuarios tipo 5 usuarios, otro 10 usuarios, y van con cupo de
créditos de IAs, pueden comprar créditos — no sé si hacer un sistema de
créditos, porque a cada producto le puede llegar a necesitar créditos de
IA, se asigna un cupo y es administrable el cupo, pero todavía me falta
desarrollar la idea."*

**Lo que esto insinúa, sin decidirlo por ella:** un futuro sistema de
"créditos de IA" podría ser, como suscripciones/pagos/referidos, su propio
dominio transversal — no exclusivo de JustiRed. `agente24siete` ya tiene
un prototipo funcional de esto (`saldo`/`movimientos_saldo`, markup por
plan) que podría ser el punto de partida a generalizar, en vez de
inventar uno nuevo para JustiRed. **No implementar todavía** — falta que
Gina termine de definir: persona natural vs. jurídica, los tiers por
volumen de usuarios, y si créditos de IA se comparte entre productos o es
por producto.

**No hacer nada de código para JustiRed hasta que esto se resuelva.** Si
antes de eso alguien intenta registrarse como cliente real de JustiRed,
va a chocar con "Sin suscripción activa" sin poder pagar nada — vale la
pena que Gina lo sepa antes de anunciar o vender JustiRed a un cliente
real.

**09-ago-2026 — análisis de arquitectura pedido por Gina: "¿referidos es
un sistema independiente, o me toca desoldarlo después?"** Verificado a
fondo, con evidencia (schema real de `pagos-sorsabsa`, código de
`agente24siete/lib/saldo.js`). Conclusión completa en
`ARQUITECTURA-ECOSISTEMA.md` §1 (filas Suscripciones/Referidos/Créditos)
— resumen:

- **Referidos SÍ es transversal de verdad** — `producto`/`sujeto`
  opacos, sin FK a ningún producto, un producto nuevo lo adopta sin
  tocar `pagos-sorsabsa`. El acoplamiento no está en el sistema, está en
  su premio (`recompensa_dias` asume que todo producto mide valor en
  días de suscripción).
- **Créditos/Saldo NO es transversal — ahí está el hueco real.** Hoy
  vive 100% local en `agente24siete` (`movimientos_saldo`, keyed por
  `cliente_id`, con `markup_uso` de sus propias tablas `clientes`/
  `planes` mezclado adentro). Si mañana otro producto necesita créditos
  prepagados, hoy tocaría reinventarlo o migrar agente24siete
  después — el riesgo de "desoldar" que Gina preguntaba, confirmado
  real, no hipotético.
- **Modelo propuesto, aprobado por Gina:** 3 primitivos independientes
  en `pagos-sorsabsa`, todos con el mismo patrón `producto`/`sujeto`
  opaco — Suscripciones (gate de acceso recurrente, ya existe),
  Créditos/Saldo (consumo prepagado, generalizar desde agente24siete —
  no construido todavía), Referidos (ya existe, premia con días de
  suscripción, sin necesitar saber de créditos).

**Decisión de Gina sobre agente24siete, mismo día — resuelve
`AUDITORIA-PORTERO-SSO.md` 🔴-6 (quedaba "pendiente de decidir"):**
*"agente24siete debe ir por suscripción, y si se acaba el saldo puede
comprar saldo"* — no son modelos que compiten, son capas que se
complementan (mismo patrón que Anthropic/OpenAI: plan base + créditos
consumibles aparte). Hoy agente24siete no tiene ninguna de las dos
capas realmente conectadas: el login la bypasea por completo (🔴-5,
correcto, no revertir) y `pagos.suscripciones` no tiene ningún
consumidor real en la app (🔴-6). **✅ Construido 09-ago-2026
(`agente24siete@57cfd58`), falta el backfill de clientes existentes y
verificar en vivo** — ver `AUDITORIA-PORTERO-SSO.md` 🔴-6 para el
detalle de qué se descartó (3 candidatos que mezclaban suscripción con
saldo) y por qué el gate real va dentro de agente24siete, no en el login
SSO.

**🔴 Pendiente real antes de que esto sea seguro en producción:** correr
`agente24siete/scripts/backfill-suscripciones.mjs` (dry-run por defecto,
`--confirm` para escribir) — les da 365 días de trial a los clientes que
ya existen, para que el gate nuevo no les corte el servicio de un
momento a otro. No se corrió todavía: las credenciales reales
(`DATABASE_URL`/`PAGOS_API_URL`/`PAGOS_API_KEY`) no estaban disponibles
en el entorno de esta sesión, solo en Vercel. **El gate ya está en
`main` y activo en el próximo deploy** — correr el backfill antes de que
eso pase, o los clientes reales sin fila en `pagos.suscripciones` se
quedan sin poder mandar mensajes.

---

## 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir

**Origen:** 09-ago-2026, discutiendo cómo activar los residentes precargados de
Punta Blanca (censo real, ~3800). Gina identificó el riesgo correcto: si un
admin manda un masivo (invitaciones, recordatorio de alícuotas) a una lista
sucia, el rebote/queja daña la reputación de **todo el dominio compartido**
(`auth.sorsabsa.com`, único verificado en Resend) — el reseteo de contraseña
de otro condominio, de otro producto, puede empezar a caer en spam.

**Diseño acordado con Gina, no implementado todavía:**
1. **Segundo dominio verificado en Resend, solo para masivos** (ej.
   `notificaciones.sorsabsa.com`), separado del transaccional — mismo patrón
   que usan Buildium/AppFolio/TownSq (software de gestión de condominios):
   canal transaccional nunca se degrada por culpa del canal masivo.
2. **Cupo por condominio** (arrancar en 2 envíos masivos/mes, activación +
   alícuotas comparten el cupo) — con aviso visible al admin antes de
   confirmar, cupo restante a la vista.
3. **Corte automático por rebotes/quejas**, no solo por conteo — un tenant
   puede respetar el cupo y aun así ensuciar la lista.
4. **Envío en tandas**, nunca un blast instantáneo — batch API de Resend o
   cola propia, goteado.

**Por qué no se hizo hoy:** requiere DNS/dominio nuevo y una cola de envío
(los serverless functions de Vercel no aguantan mandar miles de correos en
una sola invocación) — más grande que el resto del trabajo de hoy. La
activación de residentes (ítem relacionado, ver commits de CondoManager
09-ago-2026) se construyó para funcionar SIN esto: el disparador "bajo
demanda" (uno a uno, cuando el residente entra por su cuenta) no necesita
nada de lo de arriba. El disparador "masivo" queda con un cupo simple
(sin segundo dominio ni cola) hasta que esto se construya — usarlo con
cuidado mientras tanto.

**Añadido 09-ago-2026 — visibilidad de consumo, no solo gobernanza:**
Gina notó que hoy no hay nada centralizado para saber cuánto se gasta de
Resend, ni por producto ni por condominio — el dashboard de Resend es una
sola vista para toda la cuenta, sin separar por tenant. Diseño propuesto:

1. **Corto plazo, sin infraestructura nueva:** mandar `tags` en cada
   `.send()` de Resend (ej. `{name:'condominio', value:'punta-blanca'}`) —
   el propio dashboard de Resend ya puede filtrar por tag.
2. **Consumo real, visible al cliente:** registrar cada envío (quién, a
   quién, cuándo, si rebotó) en `notificaciones-sorsabsa` — ya es el
   servicio que trackea comunicaciones (la campana in-app) y ya tiene base
   en Railway; extenderlo es reusar, no duplicar. Lo más robusto: un
   **webhook de Resend** (`email.sent`/`delivered`/`bounced`) apuntando a
   un endpoint nuevo ahí, para que se registre solo sin depender de que
   cada producto se acuerde de reportarlo.
3. **Dónde se ve:** el superadmin de CondoManager (o de cualquier
   vertical) consultaría esa base vía API de `notificaciones-sorsabsa` —
   una vista de "consumo de correo por condominio" en
   `panel/superadmin/condominios/[id]` (o un reporte agregado), el mismo
   patrón que ya usa `pagos-sorsabsa` para que cada producto consulte su
   propio estado de facturación sin duplicar la lógica.

No implementado — queda anotado junto con el resto de este ítem.

---

## Hecho (para no re-hacer)

- ✅ pagos + notificaciones: **datos** migrados a Railway (SORSABSA-DATA).
- ✅ pagos-sorsabsa: **código** corriendo en Railway, verificado end-to-end.
- ✅ Convertidor backend, `iot` (Inspección Ocular Técnica): en Railway.
- ✅ Expedientes forenses (1.5 GB, 2296 archivos) respaldados en R2 privado, íntegros.
- ✅ Supabase Pro activado → núcleo `condomanager` encendido y sin pausarse.
- ✅ Limpieza menor en agente24siete: fix duplicado en rama `auditoria/ciclo-operativo`
  (commit `4bc591b`) y un `git stash` sin aplicar ahí — `main` quedó correcto
  y desplegado, la rama vieja queda para revisar si se retoma ese repo.

## 18. ✅ RESUELTO 09-ago-2026 — Sin patrón visual compartido entre los onboarding propios (condomanager, domuscrm)

**Origen:** 09-ago-2026, Gina revisando `/register` de DomusCRM: "el
formulario es bastante soso para la creación de una agencia inmobiliaria,
no hay estandarización en este tipo de formularios". Verificado con código,
no es solo percepción visual.

**Corrección 09-ago-2026 (misma sesión):** este ítem se anotó primero como
"cada producto arma su propio register" sin aclarar que **eso es correcto a
propósito, no el hueco**. Verificado en `auth-sorsabsa/src/lib/apps.ts`:
existe un `/auth/register` genérico en identity y **sí lo usan** agente24siete,
justired y convertidor (apps sin `registerUrl`). Condomanager y DomusCRM
tienen `registerUrl` configurado — el genérico se auto-redirige a su
formulario propio, porque crear solo la identidad sin la empresa/condominio
dejó una vez a una clienta real con cuenta huérfana, sin agencia y sin poder
entrar (bug documentado en el comentario de `registerUrl`, motivó el
mecanismo). **El hueco real es más angosto**: entre los formularios que sí
tienen que ser propios (condomanager, domuscrm) no hay ningún patrón visual
compartido — abajo el detalle.

**Lo que existe:** `@sorsabsa/ui` (este mismo repo, `diseno-sorsabsa`,
publicado como paquete) es consumido por condomanager (`^0.1.10`),
crm_inmobiliario/webs (`v0.1.38`), agente24siete (`^0.1.6`) y auth-sorsabsa
(`v0.1.39`) — la regla dura del principio de este documento (usar los
sistemas compartidos) sí se cumple a nivel de dependencia declarada.

**El hueco real, con evidencia:**

- El paquete solo tiene primitivos planos para formularios: `Input` (un
  campo con label/ícono/error), `Card`, `Button`. No existe ningún
  componente de agrupación (`FormSection`/fieldset), stepper/wizard, ni un
  layout pensado para un formulario "grande" (alta de cuenta + alta de
  empresa en un solo submit, como pide `ESTANDAR-DESARROLLO.md`: "dato
  atómico → un solo insert", no dos altas separadas).
- `crm_inmobiliario/webs/src/app/register/page.tsx` (DomusCRM, botón
  "Crear mi cuenta" de la landing) sí usa `@sorsabsa/ui`
  (`BrandProvider`/`Card`/`Input`/`Button`/`Icon`), pero arma la jerarquía
  visual a mano con dos `<p>` de sección ("Tu cuenta" / "Tu agencia") sin
  ningún componente que las agrupe — de ahí el "soso": todos los campos
  con el mismo peso visual, sin separación real entre bloques.
- `condomanager/app/register/page.tsx` (alta de admin + condominio, mismo
  tipo de formulario) **ni siquiera usa `@sorsabsa/ui` para esta pantalla**
  — importa `@/app/components/ui/Button` y `@/app/components/ui/PasswordInput`
  locales, propios del proyecto, aunque condomanager sí depende del paquete
  compartido para otras pantallas. Confirma que la falta de estándar no es
  solo "el paquete es pobre": ni siquiera los dos proyectos que lo tienen
  instalado lo usan igual para el mismo tipo de formulario.
- No se revisó todavía agente24siete (si tiene un formulario equivalente)
  ni si `PasswordInput` de condomanager debería fusionarse con el `Input`
  de `@sorsabsa/ui` en vez de vivir duplicado.

**Resuelto — se eligió (a):** componente compartido primero, adoptado en
los dos onboarding propios.

- `diseno-sorsabsa@ca4efa0` (`@sorsabsa/ui@0.1.40`): `FormSection` nuevo —
  agrupa un bloque de campos con título (+ ícono opcional) y borde, en vez
  del `<p>` suelto de antes.
- `diseno-sorsabsa@acf31a8` (`@sorsabsa/ui@0.1.41`): `Input` gana
  `type="password"` con botón mostrar/ocultar integrado (2 íconos nuevos,
  `eye`/`eyeOff`, en el catálogo propio) — estandariza algo que
  CondoManager reimplementaba a mano (`PasswordInput` local) y que DomusCRM
  no tenía en absoluto (sin ningún toggle).
- `condomanager@6535381`: `/register` reescrito con
  `Card`/`Input`/`Button`/`FormSection`/`Icon` de `@sorsabsa/ui` — antes ni
  siquiera usaba el paquete compartido en esta pantalla, aunque el resto
  del proyecto sí (y ya está envuelto en `BrandProvider` desde
  `app/layout.tsx`, así que las clases `brand-*` ya funcionaban ahí, solo
  no se usaban). Campos agrupados en "Tu cuenta"/"Tu condominio". El
  `PasswordInput` local se deja intacto — sigue en uso en otras 5
  pantallas, no se tocó ahí. De paso se encontró y quitó `useRouter()`
  muerto (declarado, nunca usado). Lógica de submit intacta byte a byte,
  confirmado con diff.
- `domuscrm@aa34dc1`: `/register` adopta `FormSection` en sus dos
  secciones y gana el toggle de contraseña gratis (ya usaba
  `type="password"`, no hizo falta tocar el JSX para eso).

Verificado en los 3 repos: `tsc --noEmit` limpio, `eslint` sin errores
nuevos, `jest` 18/18 en `diseno-sorsabsa`. No se tocó ningún endpoint ni
payload de submit — solo presentación.
