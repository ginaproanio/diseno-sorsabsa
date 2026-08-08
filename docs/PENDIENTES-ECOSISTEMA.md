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
Supabase soporte el 31-jul: la respuesta y el plan de bloques quedaron en
[`supabase-ticket-jwt-signing-keys.md`](supabase-ticket-jwt-signing-keys.md).
Nada se rompió en el proceso — login en vivo intacto durante todo el intento.

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

## 10. 🟡 Login social: Google ✅ y Facebook ✅ funcionando — falta Revisión de Meta para público general

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
  - 🔵 **Sin urgencia — Revisión de Meta para público general.** A
    diferencia de Google (que no la pidió), Facebook exige **Revisión de
    la app** para que `email` funcione con cualquier usuario. Mientras no
    esté aprobada, funciona igual para administradores/desarrolladores/
    testers de la app (así se probó arriba) — un cliente real y ajeno a
    Meta for Developers quedaría bloqueado hasta que se apruebe. No
    bloquea nada del ecosistema; retomar cuando haga falta login público
    real: Casos de uso → Revisar → completar "Uso permitido", "Tratamiento
    de datos" e "Instrucciones para revisores", enviar y esperar la
    aprobación de Meta (días, no minutos).

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
