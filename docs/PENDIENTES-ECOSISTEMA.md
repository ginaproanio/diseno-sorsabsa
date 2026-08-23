# Pendientes del ecosistema SORSABSA

Lista viva de lo que falta, en orden de prioridad. Se va anotando a medida que
aparece. Fuente de arquitectura: `ARQUITECTURA-ECOSISTEMA.md`. El plan paso a
paso del desoldado vive en [`PLAN-DESOLDADO.md`](PLAN-DESOLDADO.md) — este doc
es la lista de trabajo suelto, no el plan en sí.

Última actualización: 2026-08-22.

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

## 7. 🟡 SorsabsaForensic → Fase 0 arrancada de verdad, no completa — servicio de correo en Railway, el resto sigue local

**➡️ El plan completo vive en [`PLAN-SORSABSAFORENSIC-WEB.md`](PLAN-SORSABSAFORENSIC-WEB.md)
(15-ago-2026) — este punto es el resumen, el plan manda.** Incluye el modelo
de negocio ($80/caso perito · $20–30/unidad público), los tres modos de acceso
a las plataformas con cobertura medida en vivo, y la regla dura: `core/`
(13.683 líneas, cero imports de Qt) no se reescribe.

Es PyQt5 (app de escritorio), no un servicio. Fase 0 original: poblar
`core/orchestrator.py` (vacío), sacar el renderizador de informe fuera de Qt,
quitar rutas absolutas, Dockerfile. Ver `PLAN_MATERIALIZACION.md` §2.

**✅ Hecho y verificado en producción, 15-ago-2026** — motivo real: Gina
entrega la computadora donde corre `main.py`, no puede seguir dependiendo
de ella. Se armó un Railway project que ya existía (`Sorsabsa Foresics`,
`31cb8934-57ce-46e0-80bb-e2368c5e9546`, conectado a
`github.com/ginaproanio/sorsabsaforensic`) pero que **crasheaba en bucle**
desde el 08-ago sin que nadie lo notara: Railpack adivinaba y corría
`main.py` (el entrypoint de PyQt5) dentro de un contenedor sin pantalla —
`ImportError: libGL.so.1`, confirmado en los logs reales antes de tocar
nada.

- `core/orchestrator.py` poblado — lógica de casos idéntica a
  `gui_pyqt/case_panel.py` (misma estructura de 5 carpetas, misma función
  `es_expediente`) pero sin Qt, más el dispatch a `CorreoProcessor` (la
  MISMA clase que usa la app de escritorio, no reimplementada).
  `CASOS_DIR` configurable por env var.
- `api.py` nuevo — FastAPI, `Authorization: Bearer <API_KEY>` (el servicio
  no arranca sin `API_KEY` seteada, sin modo abierto por defecto). Crear/
  listar/borrar casos, subir evidencia de correo, procesar, listar/
  descargar informes. UI mínima en `/ui` (una página HTML servida por el
  mismo servicio, sin build aparte) para operar sin curl/Postman.
- `Dockerfile` + `requirements-api.txt` — hace explícito que corre
  `api.py`, no `main.py`; subset de dependencias sin PyQt5/weasyprint/
  torch/whisper/playwright (no hacen falta para esto).
- 🔴 **Bug real encontrado y arreglado en el camino, mismo patrón que ya
  había pasado con geo-sorsabsa (`ARQUITECTURA-ECOSISTEMA.md` §4-bis):**
  el primer despliegue devolvía 502 — puerto fijo (`8000`) en el
  Dockerfile en vez de leer el `$PORT` real que asigna Railway en
  runtime. Corregido (forma shell del `CMD`, expande `${PORT}`).
- **Infra armada vía Railway CLI** (ya autenticado en sesión, igual que
  con GitHub/`gh`): `API_KEY` generada y seteada, volumen persistente de
  5GB montado en `/data` (`CASOS_DIR=/data/expedientes` — sin esto,
  cualquier caso creado se perdía en el próximo deploy), dominio público
  generado (`sorsabsaforensic-production.up.railway.app`).
- **Verificado de punta a punta contra producción real, no solo local**:
  crear caso → subir un `.eml` sintético → procesar → hash SHA-256 +
  datos extraídos correctos, todo en el volumen persistente
  (`/data/expedientes/...`) → confirmado en `GET /casos`. Caso de prueba
  borrado después con el endpoint `DELETE /casos/{nombre}` (agregado
  porque `railway volume files` pide una llave SSH que no está
  configurada — más simple y más útil en general que resolver eso).

**⚠️ Alcance real, acotado a propósito — no es la Fase 0 completa:**

1. **Solo `correo` (.msg/.eml).** Es lo único que el caso activo necesita
   hoy (`Proceso Arbitral No. 019-25` → "Correos electrónicos", ver su
   `03_informes/datos_estructurados.json`). Los otros 14 procesadores de
   la app de escritorio (whatsapp, facebook, instagram, tiktok, youtube,
   video, red_x, documento, georeferencia, imagen_forense,
   materializacion_video, web_social, gsheets, analisis_audio) no están
   portados — varios (facebook/instagram/tiktok) además necesitan las
   sesiones de navegador logueadas que solo existen en el disco que se va
   a borrar, un problema aparte de este.
2. **`.pst`/`.ost` rechazados a propósito, no soportados todavía.**
   Necesitan `pythonnet` + `XstReader.Api.dll` (una DLL de Windows) vía
   CoreCLR — sin confirmar que corra en el contenedor Linux. El servicio
   los rechaza con un error explícito en vez de intentarlo y fallar peor
   adentro.
3. **El PDF final NO se genera desde el servicio todavía.**
   `gui_pyqt/report_panel.py` (~5000 líneas, ~40 métodos
   `_anexo_*_html` que sí parecen portables + la orquestación final que
   arma `html_completo` y llama a weasyprint) es candidato a extraerse,
   pero es trabajo grande y este servicio corre el ANÁLISIS forense
   (extraer correos, hashear, dejar constancia) — no se apuró una
   extracción sin verificar en un generador de documentos que va a un
   tribunal. Por ahora, el PDF del informe sigue siendo local.
4. **Volumen de Railway, no R2** — decisión pragmática por tiempo, no la
   arquitectura final: la regla dura del ecosistema
   (`ARQUITECTURA-ECOSISTEMA.md`: "los expedientes y las fotos no van en
   el disco de la aplicación") dice que esto debería vivir en R2, como
   `sorsabsa-expedientes`. Migrar de disco de Railway a R2 queda
   pendiente, anotado para no perderlo — no bloqueaba lo urgente de hoy.

**Corrección de Gina, misma sesión — no es "solo sube 019-25 completo",
es más angosto: ningún caso se sube completo.** Cada expediente en
`c:/sorsabsa/expedientes_forenses/2026/<caso>/` tiene 5 subcarpetas
(`01_evidencias`/`02_procesamiento`/`03_informes`/`04_imagenes`/
`05_varios`); de todo eso, **lo único que debe quedar por caso es el PDF
del último informe entregado**, dentro de `03_informes/` — ni la

**Objetivo explícito, 15-ago-2026 (Gina):** que SorsabsaForensic deje de
correr en su computadora — hoy vive 100% local (disco + app de escritorio).

**Corrección de Gina, misma sesión — no es "solo sube 019-25 completo",
es más angosto: ningún caso se sube completo.** Cada expediente en
`c:/sorsabsa/expedientes_forenses/2026/<caso>/` tiene 5 subcarpetas
(`01_evidencias`/`02_procesamiento`/`03_informes`/`04_imagenes`/
`05_varios`); de todo eso, **lo único que debe quedar por caso es el PDF
del último informe entregado**, dentro de `03_informes/` — ni la
evidencia cruda, ni el procesamiento intermedio, ni las imágenes, ni los
archivos sueltos.

Verificado contra el disco real (no es teórico) — hoy son **12 casos,
3018 archivos, 2.0 GB** (el respaldo de R2 ya hecho, ver "Hecho", quedó
en 2296/1.5 GB — desactualizado, ~722 archivos de más se generaron
después). Si se aplica la regla de Gina (solo el último PDF de
`03_informes/` por caso), el total baja a **~102 MB** — la diferencia es
sobre todo `caso-096-2026-TCE` (862 MB, 1068 archivos) que tiene UN solo
PDF real (54 MB) y el resto son variantes de depuración del generador de
informes (`informe.json.antes-*` — 40+ copias, `error_pdf.log`, etc.), no
evidencia que haga falta conservar.

Dos hallazgos al identificar "el último PDF" que vale dejar anotados para
quien lo automatice:

- **No confiar en el nombre del archivo, usar la fecha real de
  modificación.** `CASO-20260730/03_informes/` tiene dos PDF:
  `Informe-30-07-2026_16-07-05.pdf` (nombre con hora, pero grabado más
  temprano) e `Informe-30-07-2026.pdf` (nombre sin hora, pero grabado 36
  minutos después — el real último). Ordenar por nombre de archivo da el
  resultado equivocado ahí.
- **`Caso UMET/` no tiene ningún PDF en `03_informes/`** — solo 4 `.md`
  de planificación (`cotizacion.md`, `plan.md`, `requisitos.md`,
  `solicitud.md`) en `05_varios/`. Parece una cotización que nunca llegó
  a ejecutarse, no un caso con informe entregado — no hay nada que subir
  de ahí, a menos que Gina diga lo contrario.

**✅ Ejecutado 15-ago-2026 — motivo real: Gina entrega esta computadora,
tiene que borrar el disco.** Decidido en el momento: no hace falta
conservar nada más que los informes entregados — se cierra la duda de
arriba, el disco local NO se conserva aparte.

1. `Caso UMET/` — **borrado por completo** (no tenía informe, solo
   cotización que nunca se ejecutó).
2. Extraído el último PDF real (por fecha de modificación, no por
   nombre) de los 11 casos restantes → carpeta
   `c:/sorsabsa/expedientes_forenses/INFORMES-FINALES-2026/` (11
   archivos, 103 MB).
3. **Subido a R2, cubo `sorsabsa-expedientes`, prefijo
   `informes-finales/2026/<caso>.pdf`** — verificado bajando 3 de vuelta
   (`caso-096-2026-TCE`, `Proceso Arbitral No. 019-25`, `CASO-20260730`),
   no solo confiando en el "Upload complete" de la consola. Ver
   `ARQUITECTURA-ECOSISTEMA.md` → "Cómo conectarse a Cloudflare/R2" para
   cómo se hizo (`wrangler`, ya autenticado, sin pedirle llaves a Gina).
4. `SorsabsaForensic` (código) — 2 commits que solo existían local
   (`cd6d23a` el fix de seguridad de geo-sorsabsa, `7babe1e` trabajo
   nuevo sin terminar de auditar: lector EWF, examen de etiquetas
   forenses, análisis de audio) **pusheados a GitHub**, repo privado
   confirmado, `git status` limpio.

**Sigue pendiente, sin tocar:** la evidencia cruda/procesamiento de los
11 casos (1.9 GB) queda solo en el disco que se va a borrar — a
propósito, es justo lo que Gina decidió no conservar. `Proceso Arbitral
No. 019-25` sigue siendo el único caso activo: mientras se trabaja, su
carpeta completa vive donde corresponda (hoy disco, después el servicio
en Railway de este mismo punto) — no se redujo a un solo PDF porque
todavía no se entregó.

## 8. Probar CondoManager end-to-end (Punta Blanca)  🔴 SIGUIENTE — 08-ago-2026

Nunca se verificó el flujo real: admin entra, crea condominio, carga
residentes, emite alícuota, residente paga. Es lo que convierte "plomería
lista" en "producto que funciona para un cliente". **Bloqueante para el Paso 3
de `PLAN-DESOLDADO.md`** (Gina decidió no separar proyectos hasta probar
esto — separar cuesta $20/mes reales y no hay apuro).

⚠️ **Restricción de orden, agregada 16-ago-2026 — leer antes del paso 2.**
Probar el flujo con **un** condominio es seguro y es lo que este punto pide.
Lo que NO se puede hacer todavía es subir el censo real de Punta Blanca: son
5 condominios y ~120 personas con propiedades en más de uno, o sea el primer
caso real de una persona con dos filas en `perfiles`. Medido en el código el
15-ago-2026, hay **60 `.single()` sobre `perfiles`** en CondoManager —
`.single()` no devuelve la primera fila, **falla** con más de una, así que
esos 60 lugares empiezan a dar error el día que exista el primer perfil
doble. Las Fases 4 y 5 de [`PLAN-MULTI-CONDOMINIO.md`](PLAN-MULTI-CONDOMINIO.md)
son las que los migran; hasta entonces, censo completo no.

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
  - ✅/⚠️ **Actualizado 16-ago-2026 — este bullet estaba vencido y su
    advertencia se cumplió.** Decía que `condomanager/app/components/SignOutButton.tsx`
    "sigue sin pasar por el logout compartido, a propósito, no se tocó",
    porque el redirect a un dominio arbitrario (`puntablancaecuador.com`)
    no está en el allowlist y rompería la regla de "salir a la web propia".
    **Sí se tocó** después (`condomanager@c9a2359`): hoy pasa por el logout
    compartido — correcto, sin eso la sesión de identity quedaba viva — pero
    la otra mitad no se resolvió, y es exactamente lo que este bullet había
    predicho: el `next=` a la web de la asociación no pasa el allowlist y el
    portero lo descarta en silencio, así que se sale a `condomanager.vip`.
    Verificado leyendo los tres archivos (`apps.ts`, `auth/logout/page.tsx`,
    `dynamic-hosts.ts` — este último arranca con `if (app !== 'domuscrm')
    return false`). **Anotado como hallazgo con su análisis en
    `AUDITORIA-PORTERO-SSO.md` 🟠-6**, incluida la razón por la que el fix
    NO es agregar el dominio a mano: CondoManager todavía no tiene
    verificación de propiedad de dominio, que es lo que hace segura la
    allowlist dinámica de DomusCRM.
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

**🟡 10-ago-2026 — auditoría del servicio (`AUDITORIA-GEO-SORSABSA.md`)
encontró un 🔴 CRÍTICO que este punto no reflejaba: `/resolver` y
`/distancia` no exigían autenticación de ningún tipo, y `/resolver` seguía
CUALQUIER URL que le mandaran (no solo enlaces de Google Maps) — SSRF real
desde el servidor de Railway, único servicio transversal del ecosistema sin
llave (el resto sigue el patrón de `pagos-sorsabsa`:
`PAGOS_API_KEY_<PRODUCTO>`).**

- **Código hecho y commiteado 15-ago-2026** (retomado de la auditoría, sin
  cambiar el fix ya diseñado ahí): `geo_core.py::host_permitido` restringe a
  dominios reales de Google Maps, chequeado en la entrada y en cada salto
  de redirección; `main.py::autenticar_producto` exige
  `Authorization: Bearer` por producto (`GEO_API_KEY_IOT`/
  `GEO_API_KEY_SORSABSAFORENSIC`). `geo-sorsabsa` commit `694579a`.
  `iot` (commit `8fe7b74`) y `SorsabsaForensic` (commit `cd6d23a`) ya
  mandan el header. Verificado con la app real (ASGI, sin red) +
  `tests/test_geo_core.py` 11/11 (3 nuevos) + `py_compile` limpio en los 3
  repos. Detalle completo y las pruebas exactas en
  `AUDITORIA-GEO-SORSABSA.md` 🔴-1. Este doc: `diseno-sorsabsa` commit
  `029c104`.
- **⏳ Falta lo operativo, no es trabajo de código:** generar las 2 llaves
  reales y cargarlas en Railway — primero `GEO_API_KEY` en `iot`/
  `SorsabsaForensic`, recién después `GEO_API_KEY_IOT`/
  `GEO_API_KEY_SORSABSAFORENSIC` en `geo-sorsabsa` y desplegar (orden en
  `geo-sorsabsa/service/README.md`, evita una ventana de 401). Ninguno de
  los 4 commits se pushed todavía (solo local).

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
consumidor real en la app (🔴-6). **✅ RESUELTO 09-ago-2026
(`agente24siete@57cfd58`)** — ver `AUDITORIA-PORTERO-SSO.md` 🔴-6 para
el detalle completo (qué se descartó, por qué el gate va dentro de
agente24siete y no en el login SSO).

**Backfill corrido en vivo por Gina, mismo día:** `1 clientes
encontrados... Resumen: 0 ya activos, 1 backfillados, 0 fallidos` — el
único cliente real (Punta Blanca) tiene ahora 365 días de trial en
`pagos.suscripciones`, sin corte de servicio.

**Nota para la próxima vez que esto pase — costó una ronda larga de
diagnóstico:** `DATABASE_URL`, `PAGOS_API_URL` y `PAGOS_API_KEY` de
agente24siete estaban marcadas **"Sensitive" en Vercel** —
`vercel env pull` nunca entrega el valor real de una var Sensitive,
siempre baja el placeholder literal `"[SENSITIVE]"` sin avisar. Eso, no
un valor mal guardado, era la causa del `getaddrinfo ENOTFOUND base`
que se persiguió un buen rato. Los valores reales solo se ven en el
dashboard de Vercel, nunca por CLI.

**Bloqueado por #15, no por esto:** la prueba en vivo (WhatsApp real a
Punta Blanca) espera a que Meta reactive las cuentas — código e
infraestructura de este punto quedan completos y verificados sin esa
prueba. No volver a preguntar por esto hasta que #15 se resuelva.

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

## 19. 🟡 qa_sorsabsa: sin guard automático que impida que README.md y TODO.md se desincronicen — 10-ago-2026

Auditoría (`AUDITORIA-QA-SORSABSA.md`) encontró y corrigió 3 hallazgos
reales (conteo de checks mal sumado, TODO.md con 3 semanas de atraso,
un assert que aceptaba un 500 como válido) — los 3 nacían de que nada
obliga a que README.md y TODO.md digan lo mismo. Se dejó una nota
("el conteo vive en README.md") pero eso depende de que alguien la
respete. Propuesta sin construir: un check de CI que compare
`grep -c '^###' checks/*.http` contra el total que dice README.md y
falle el build si no coinciden. No se hizo porque es una decisión de
alcance — ¿vale la pena un guard más para un repo de 4 archivos de
texto? — que le toca decidir a Gina, no meterla sin que la pida.

## 20. ⏳ Magnific (Freepik) — script listo, falta la API key real

Origen: 15-ago-2026, Gina pidió conectar con Magnific (el upscaler de
imágenes, hoy parte de Freepik) para mejorar/escalar imágenes puntuales. No
hay MCP server de Magnific instalado — se resolvió como script contra su
API REST.

- ✅ Script hecho: `c:\diseno-sorsabsa\scripts\magnific-upscale.mjs` — sube
  una imagen local en base64, crea la tarea
  (`POST https://api.magnific.com/v1/ai/image-upscaler`,
  header `x-magnific-api-key`), espera el resultado (polling) y descarga la
  imagen mejorada.
- ⏳ **Falta la key real.** Se consigue en la cuenta de freepik.com/api
  (habilita también Magnific).
- **Corrección sobre dónde ponerla, para no exponerla:** la key NO va en
  `c:\diseno-sorsabsa\.env.local.example` — ese archivo es la plantilla y
  SÍ se commitea a git; una key real ahí queda expuesta en el historial para
  siempre, aunque se borre después. Va en
  **`c:\diseno-sorsabsa\.env.local`** (mismo nombre, sin `.example`) — ya
  está en `.gitignore`, nunca se commitea. Paso: copiar
  `.env.local.example` → `.env.local` y completar `MAGNIFIC_API_KEY=` con
  la key real ahí.
- **Sin verificar en vivo todavía:** el endpoint de creación de tarea está
  confirmado contra `docs.magnific.com`; el de polling
  (`GET .../{task_id}`) sigue el patrón estándar del resto de la API de
  IA de Freepik/Magnific pero no se probó con una key real. Si al primer
  uso da 404 en el polling, revisar `docs.magnific.com/api-reference/image-upscaler-creative`
  y ajustar `POLL_URL` en el script.

## 21. 🟡 Convertidor: vuelve a ser producto, con el motor y la web separados — 16-ago-2026

**El estado y la decisión viven en [`ARQUITECTURA-ECOSISTEMA.md`](ARQUITECTURA-ECOSISTEMA.md)
(§ Convertidor) — este punto es solo la lista de trabajo que quedó.** La
decisión del 30-jul ("no es producto hoy") quedó superada: Gina pidió ver la
funcionalidad y, como no puede correr nada local (entrega la máquina), se
desplegó. Hoy la web está en `convertidor.sorsabsa.com` (Vercel) y el motor
en `api.convertidor.sorsabsa.com` (Railway), los dos públicos y con
certificado válido.

Es un producto **API-first**: motor transversal (lo consume el scraper de
JustiRed) y app vertical sobre esa misma API. Nombrarlo así importa porque
las dos mitades se despliegan, versionan y cobran distinto.

Pendiente, en orden de lo que bloquea a lo que se ve:

1. **El cobro no existe todavía — análisis completo abajo (21-bis).** Es lo
   que bloquea todo lo demás, incluido el pago único por archivo grande que
   pidió Gina.
2. **Catálogo de herramientas** (lo que Gina describe como *"algo como
   ilovepdf.com"*): hoy la web expone UNA sola conversión (PDF → Markdown)
   aunque el motor entrega `txt`/`md`/`csv`. No hay dónde elegir qué hacer.
3. ✅ **Portero** — cerrado 16-ago-2026, `convertidor@616abcb`.
   `AUDITORIA-PORTERO-SSO.md` 🟠-9. Con esto los seis productos usan el mismo
   contrato de salida.
4. **Notificaciones**: no consume `notificaciones-sorsabsa`.

---

## 21-bis. 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026

Análisis pedido por Gina (*"analiza lo que bloquea el cobro"*), siguiendo
`ESTANDAR-DESARROLLO.md`.

> **ESTADO — leer esto primero**
>
> - ✅ **Decisión 1 tomada por Gina y aplicada:** el gate freemium, opción B
>   (modo nuevo en `apps.ts`). `auth-sorsabsa@ad61eef` + `convertidor@96ae4e2`.
>   Incluye la verificación del plan del lado del servidor y el `sujeto`
>   estable en el pago, que son los cortes 1, 2 y 3 de la tabla de abajo.
> - ⬜ **Decisión 2 sin tomar:** dónde vive el crédito del **pago único** por
>   archivo grande (corte 4). Es lo que Gina dejó apuntado por no alcanzar en
>   esta etapa.
> - ✅ **DESPLEGADO** el 16-ago-2026, portero primero y Convertidor después.
>   Verificado contra producción, no contra el código: un anónimo que pide OCR
>   recibe `402`, y una conversión normal sigue funcionando.
> - 🔴 **DOS BLOQUEOS NUEVOS, encontrados al probar lo desplegado** — ver
>   "Lo que apareció al probarlo" al final. Uno de ellos hace que el plan Pro
>   **no se pueda entregar** aunque el cobro funcione.
>
> El diagnóstico se conserva entero abajo, no se reescribe: es lo que explica
> por qué la solución tiene la forma que tiene.

### 1 · Síntoma

**Hoy cualquier persona que inicia sesión es Pro, sin pagar.** No es una
hipótesis: `useEntitlements` calcula
`isPro = entitlements?.active === true && entitlements?.plan !== "free"`, y
para Convertidor el portero responde `{ active: true, motivo: 'sin_cobro' }`
— sin campo `plan`. `undefined !== "free"` es verdadero, así que **`isPro`
sale `true` para todo el mundo**: OCR, 50 MB, HTML y JSON, gratis. Los dos
servicios validan contra el mismo proyecto de Supabase
(`twkuidnjwhopbjnrhnxp`), así que el token verifica y la respuesta llega.

Y del otro lado: **si alguien igual paga los $9, no pasa nada.** El pago se
cobra y no acredita ningún plan.

### 2 · Causa inmediata — cuatro cortes independientes en la misma cadena

| # | Dónde | Qué está roto |
| --- | --- | --- |
| 1 | `auth-sorsabsa/src/lib/apps.ts` | `convertidor` declara `cobro: { modo: 'sin_cobro' }` — *"herramienta INTERNA … no hay nada que cobrar"*. El portero nunca le pregunta a pagos-sorsabsa y contesta `active: true` siempre. |
| 2 | `convertidor/…/api/pagos/iniciar/route.ts` | Manda `correo: ""` y **ningún** bloque `suscripcion`. En `pagos-sorsabsa/api/confirmar.js`, `extenderSuscripcion` corta en seco si falta `suscripcion.dias` o `suscripcion.sujeto`: el pago aprobado **nunca escribe fila en `suscripciones`**. |
| 3 | `convertidor/…/api/convert/route.ts` | No lee sesión ni plan: `MAX_SIZE = 50 MB` para cualquiera. El límite de 5 MB y el candado del OCR viven **solo en el navegador**, así que se saltan llamando la ruta directo. |
| 4 | — | El **pago único** por archivo grande que pidió Gina no existe en ninguna parte: solo hay `convertidor-pro` a $9/mes. |

Aparte, `/precios` promete *"Hasta 10MB por archivo"* en el plan Gratis y la
app aplica 5 MB. La página de precios ofrece el doble de lo que entrega.

### 3 · Causa raíz

**El producto cambió de categoría y la línea que decide si hay algo que
cobrar se quedó en la anterior.** Convertidor pasó de herramienta interna a
producto con página de precios, planes y ruta de pago — todo eso se escribió—
pero `cobro: { modo: 'sin_cobro' }` sigue diciendo que no se le cobra a nadie.
Es el mismo patrón que apareció hoy con el pie de página: el cambio llega a
una copia y no a la otra.

**Y debajo hay algo más de fondo, que es lo que hay que decidir:** el gate del
portero es binario. `/auth/complete:84` hace `if (!entitlement.active)` →
cierra la sesión y muestra `payment_blocked`. Sirve para CondoManager o
DomusCRM, donde sin suscripción no hay producto. **Convertidor es freemium:
todos entran, solo algunas funciones se pagan.** El portero hoy no sabe
expresar eso — confunde *"¿puede entrar?"* con *"¿qué plan tiene?"*.

**Por eso NO se puede simplemente cambiar `sin_cobro` por `persona`:** eso
dejaría a `active: false` a todo el mundo (nadie tiene fila en
`suscripciones`) y el portero **bloquearía el login de Convertidor para
todos**, Gina incluida, también para el plan gratis. Mismo tipo de trampa de
orden que `AUDITORIA-DOMUSCRM.md` 🔴-1 fix #2 etapa 2.

### 4 · Componente responsable

El portero (`apps.ts` + `/api/entitlements` + `/auth/complete`), no el
Convertidor. El producto no puede arreglar esto solo sin volver a decidir por
su cuenta lo que el portero existe para unificar.

### 5 · Código afectado

`auth-sorsabsa`: `src/lib/apps.ts`, `src/lib/entity-resolver.ts`,
`src/app/api/entitlements/route.ts`, `src/app/auth/complete/page.tsx`.
`convertidor`: `api/pagos/iniciar`, `api/convert`, `hooks/useEntitlements.ts`,
`app/precios`. `pagos-sorsabsa`: `CALLBACKS_POR_PRODUCTO` en `api/confirmar.js`.

### 6 · Solución de raíz (no parche)

#### DECISIÓN 1 — ✅ TOMADA POR GINA, 16-ago-2026: opción B

*"esto me suena bien aplicalo: un tercer modo freemium en apps.ts"*.
Implementada en `auth-sorsabsa@ad61eef` y `convertidor@96ae4e2`. Las dos
opciones se conservan escritas porque explican por qué el código quedó así:

- **A · Convertidor pregunta por su cuenta.** Sigue `sin_cobro` en el login y
  el producto consulta el plan aparte. Rápido, pero deja a un producto
  resolviendo por su cuenta una pregunta del portero: la segunda vez que otro
  producto sea freemium, se copia. Es la forma que crea la próxima excepción.
- **B · El portero aprende a decir "freemium".** Un tercer `modo` en
  `PoliticaDeCobro` donde `/api/entitlements` **sí** consulta a
  pagos-sorsabsa, devuelve `{ active: true, plan: 'free' | 'pro' }` y
  `/auth/complete` **no** bloquea. Es un hecho del producto declarado en el
  archivo donde ya vive lo que cada producto ES, sin un solo `if (app === …)`
  — igual que la etapa 1 del fix #2 de DomusCRM, que sacó cuatro nombres de
  producto de `entity-resolver.ts`.

  **Señal de que B es lo que siempre se quiso:** el cliente ya compara
  `plan !== "free"`. Quien lo escribió esperaba un campo `plan` que el backend
  nunca produjo.

Con B tomada, lo mecánico ya se hizo (`convertidor@96ae4e2`):

- ✅ **`/api/pagos/iniciar`** exige la sesión, saca el usuario del token (nunca
  del body) y manda `correo` y
  `suscripcion: { plan: 'pro', dias: 30, sujeto: user.id }`. El `sujeto` es
  **el mismo id** que `/api/entitlements` busca después.
  `condomanager/app/api/admin/suscripcion/route.ts:129-139` fue la referencia,
  y su comentario nombra el bug evitado: JustiRed mandaba un sujeto nuevo en
  cada pago, así que ningún login futuro lo encontraba (punto #16).
- ✅ **`/api/convert`** lee la sesión y consulta el plan del lado del servidor
  (`convertidor/frontend/src/lib/sesion-servidor.ts`). El chequeo del cliente
  se queda para la experiencia, pero dejó de ser la autoridad.
- ✅ **Límites y precio en un solo módulo** (`lib/planes.ts`). Eran tres copias
  que ya se contradecían.

---

#### DECISIÓN 2 — 🔄 REPLANTEADA 16-ago-2026: ya no es de almacenamiento

> **Gina decidió que el Convertidor NO vende espacio:** *"convertidor en
> freemium no se queda, se descarga y se borra, espacio para convertidor no,
> que sea la capacidad de conversión lo que se vende"*. Ver
> [`ALMACENAMIENTO-COSTOS.md`](ALMACENAMIENTO-COSTOS.md), decisión de cabecera.
>
> **Con eso, las tres opciones de la tabla de abajo quedan sin objeto** — no
> hay crédito de bytes que guardar en ningún lado. Se conservan porque el
> análisis de costos sigue sirviendo si otro producto vende espacio.
>
> **Lo que queda de esta decisión, mucho más chico:** una conversión pagada hay
> que recordarla igual, porque el pago vuelve por una redirección y la
> conversión ocurre después — y sobre todo porque la conversión puede fallar y
> sin nada anotado el cobro queda aprobado y el servicio no prestado. Pero lo
> que se guarda ahora es **una fila** (quién, cuánto pagó, si ya la usó), no
> archivos: cabe en el Supabase que el producto ya usa para identidad, **sin
> cubo, sin token de R2, sin cuota y sin ciclo de vida**. Detalle en
> `ALMACENAMIENTO-COSTOS.md` §8.2.
>
> **Y aparece una que no estaba:** cuánto vive el resultado listo para
> descargar. No es almacenamiento —es la ventana de descarga, lo mismo que el
> "borramos a las 2 horas" de iLovePDF— pero hay que elegir un número, porque
> cero minutos obliga a que la descarga sea parte de la misma petición y un
> corte de red pierde una conversión ya pagada. Recomendado: 1 hora. §8.1.

##### El análisis original (espacio como producto), conservado

**Lo que Gina pidió:** *"pago por suscripción **o un solo pago por la
conversión de un archivo más grande de los 5mb**"*. Lo primero ya funciona;
esto no.

**Por qué no es "lo mismo pero más chico":** una suscripción se guarda en
`pagos.suscripciones` y se responde con una fecha (`periodo_fin > now()`). Un
pago único **no extiende un período: autoriza UNA conversión**, y eso es un
saldo que se consume. `pagos-sorsabsa` ya sabe cobrarlo (una fila en `pagos`
sin metadata de suscripción); lo que no existe es quién lo recuerda ni quién lo
descuenta.

**Las tres opciones, con lo que cuesta cada una:**

| Opción | Dónde vive el crédito | A favor | En contra |
| --- | --- | --- | --- |
| **A · Tabla propia en `verticales_sorsabsa`** (esquema `convertidor`) | Base que el producto ya usa para identidad | Control total del consumo; no toca a nadie más | Convertidor estrena base de datos: RLS, migraciones y un esquema más que mantener |
| **B · Saldo prepago, como agente24siete** | El producto lleva el saldo y `pagos-sorsabsa` solo avisa | Patrón que ya existe y funciona en el ecosistema; sirve si mañana hay más cosas que cobrar por unidad | Es el mismo trabajo que A más la idea de "saldo"; sobra si solo va a haber un tipo de compra |
| **C · Sin crédito: se paga y se convierte en el acto** | En ningún lado — el pago devuelve a una pantalla que ya trae el archivo | Nada que guardar, nada que descontar, nada que reconciliar | Si el pago se aprueba y la conversión falla, no hay a qué volver: la persona pagó y perdió el archivo |

**Recomendación: A**, y no C. C parece la más barata hasta el primer fallo de
conversión después de un cobro aprobado — ahí no hay crédito al que volver y la
reclamación se atiende a mano. B es A con una capa de más que hoy no se usa.

**Lo que hace falta hacer una vez decidido** (esto ya está averiguado, no hay
que volver a investigarlo):

1. `CALLBACKS_POR_PRODUCTO.convertidor` en `pagos-sorsabsa/api/confirmar.js` —
   hoy solo están `agente24siete` y `condomanager-recaudacion`.
2. Un webhook en Convertidor que reciba ese aviso y acredite.
3. El lugar donde se guarda, según la opción elegida.
4. En `/api/convert`, consumir el crédito **después** de que la conversión
   salga bien, no antes.

**Lo que NO hay que hacer**, por si esto se retoma en otra sesión: resolverlo
con un parámetro en la URL de vuelta del pago (`?pagado=true`) o cualquier cosa
que venga del navegador. Es exactamente el `isPro = forceOcr` que este producto
ya tuvo — el cliente diciendo cuánto pagó.

### 7 · Código a eliminar — ✅ hecho

El comentario *"herramienta INTERNA … no hay nada que cobrar"* de `apps.ts`
(dejó de ser cierto) y el `monto: plan_id === "convertidor-pro" ? 9 : 0` de
`iniciar/route.ts`, que codificaba el precio en la ruta en vez de tomarlo del
catálogo de planes. También el `isPro` escrito a mano en la pantalla, que era
donde vivía el bug de origen: ahora hay una sola definición en
`useEntitlements`, y exige un plan pagado explícito.

### 8 · Riesgo de regresión

**Alto si se toca en el orden equivocado**, y ahí está el valor de este
análisis: cambiar solo `apps.ts` deja a todos afuera del login. Se hizo en el
orden seguro — `PoliticaDeCobro` primero, con `/auth/complete` intacto porque
freemium responde `active: true`, después `iniciar`, después `convert`.

**Y el mismo cuidado vale para el DESPLIEGUE, que es lo que queda:** los dos
commits suben juntos y en ese orden, portero primero. Desplegar solo
Convertidor deja el plan Pro inalcanzable — el portero todavía respondería sin
campo `plan` y `esPro` sería falso para todos, incluso para quien pague.

Un test cazó el cambio al hacerlo (`entity-resolver.test.ts` tenía a
`convertidor` en la lista de `sin_cobro`) y se actualizó con el caso nuevo.
Eso es la red que hay: 21 tests en el portero.

### 9 · Validación

**Hecho contra producción el 16-ago-2026, sin credenciales** (los tres casos
se prueban como visitante anónimo, que es el peor escenario):

| Prueba | Antes | Ahora |
| --- | --- | --- |
| Anónimo pide `force_ocr=true` | se lo daba | `402` — "El OCR está disponible en el plan Pro" |
| Anónimo sube un PDF chico | funcionaba | sigue funcionando, devuelve el markdown |
| Anónimo inicia un pago | lo iniciaba sin dueño | `500` "Pagos no configurado" — ver bloqueo B abajo |

**Falta probar con cuenta** (necesita sesión real): entrar y ver "Plan Gratis";
después de pagar, que `suscripciones` tenga fila con `sujeto` = su userId; y la
prueba que de verdad importa — **cerrar sesión, volver a entrar y seguir siendo
Pro**, o sea que el pago sobreviva a la sesión, que es lo que JustiRed no
lograba.

---

### Lo que apareció al probarlo — 16-ago-2026

Ninguno de los dos salió de leer código: salieron de llamar a la API desplegada.

#### 🔴 A · Vercel corta el archivo en ~4,5 MB, así que el plan Pro no se puede entregar

Medido contra `convertidor.sorsabsa.com/api/convert`:

| Tamaño | Respuesta |
| --- | --- |
| 3 MB | llega al motor |
| 4 MB | llega al motor |
| 5 MB | **`413 FUNCTION_PAYLOAD_TOO_LARGE`** — Vercel lo rechaza ANTES de ejecutar nuestro código |

Es el límite de cuerpo de petición de las funciones de Vercel, no una regla
nuestra. Consecuencias, en orden de gravedad:

1. **El plan Pro promete 50 MB por archivo y por esta ruta no entran ni 5.** Se
   puede cobrar y no se puede entregar. Esto ya no es un problema de cobro: es
   el producto pagado que no existe.
2. **El plan Gratis anuncia 5 MB y el techo real es ~4,5.** El número que se
   anuncia no se cumple, justo en el borde.
3. **El "pago único por archivo más grande de 5 MB" que pidió Gina está
   bloqueado por la plataforma, no por la facturación.** Aunque el crédito de
   la Decisión 2 estuviera hecho, el archivo no llega.

**Esto cambia la Decisión 2:** antes de decidir dónde vive el crédito hay que
decidir **por dónde sube el archivo grande**. El motor en Railway es un
contenedor y no tiene ese límite; las dos salidas conocidas son subir directo
al motor (`api.convertidor.sorsabsa.com`, que hoy además **no pide
credencial** — habría que ponerle una) o subir a R2 y pasarle la URL al motor.
No se elige acá: es decisión de arquitectura y cuesta plata de tráfico.

**No se bajó el número anunciado a 4 MB** a propósito: 5 MB es la cifra que
Gina fijó, y ajustar el anuncio para que coincida con la limitación sería
esconder el defecto en vez de resolverlo.

#### 🟠 B · `PAGOS_API_URL` y `PAGOS_API_KEY` no están configuradas en Convertidor

`vercel env ls production` en el proyecto `convertidor` devuelve solo
`CONVERTIDOR_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Por eso `/api/pagos/iniciar` responde `500`
"Pagos no configurado" antes de llegar a comprobar la sesión: **nadie puede
suscribirse todavía**, y no por el código. Las tiene que cargar Gina en Vercel
(son secretos; el valor está en el proyecto `pagos-sorsabsa`).

#### 🟡 C · El motor aplica OCR por su cuenta cuando la página trae poco texto

En la prueba del camino feliz, un PDF con una línea de texto volvió como
`## Página 1 (OCR-Tesseract)`. O sea: el candado nuevo bloquea el **interruptor**
de OCR, no el **cómputo** — un PDF escaneado que entre por el plan gratis igual
hace correr Tesseract en Railway. Reduce el gasto abierto, no lo cierra. Si el
OCR se va a cobrar de verdad, la decisión de aplicarlo tiene que llegar al motor
como un parámetro que el servidor controla, no como una heurística del motor.

---

## 22. ⬜ SorsabsaForensic y el Convertidor: ¿se están duplicando? — pregunta abierta, 16-ago-2026

**Pregunta de Gina, sin analizar todavía** (*"anota nada más esto, luego
analizamos"*): *"me hablas de él en JustiRed, en Convertidor, ¿y qué pasa con
SorsabsaForensic? ¿No lo está duplicando? Debería también consumirlo dependiendo
de las pericias en las que sea convocado, pero será convocado cuando se lo
requiera. Hoy ¿algún procesador lo llama? ¿De qué forma interviene si acaso se
lo llama?"*

**Esto es la anotación, no la respuesta.** Lo único que se comprobó es el hecho
de partida, para que el análisis no arranque de una suposición:

- **Hoy NINGÚN procesador de SorsabsaForensic llama al Convertidor.** `grep` en
  `c:/sorsabsa/SorsabsaForensic/**/*.py` por `convertidor`, `tesseract`,
  `easyocr`, `pytesseract` y `ocr`: **cero coincidencias**. Ni lo consume ni
  tiene OCR propio.
- Tiene **16 procesadores** (`core/processors/`): audio, correo, **documento**,
  facebook, georeferencia, gsheets, imagen_forense, infografía,
  materialización_video, red_x, tiktok, video, web_social, whatsapp, youtube.
- El candidato natural es **`documento`**, y ahí está el matiz que hace la
  pregunta buena: `documento/processor.py` **usa PyMuPDF (`fitz`) para
  RENDERIZAR páginas a imagen** (`get_pixmap`, DPI configurable), no para
  extraer texto. O sea, hasta donde se ve, **no duplica al Convertidor: hace
  otra cosa** — materializa la evidencia como imagen, que es lo que pide una
  pericia. Pero comparte la misma librería, y de ahí a "esto ya lo hace el
  otro" hay un paso corto que conviene no dar sin mirar.

**Lo que queda por analizar, y es lo que Gina preguntó:**

1. ¿Renderizar a imagen y extraer texto son de verdad dos cosas, o el
   Convertidor debería devolver ambas y Forensic dejar de abrir el PDF?
2. Si una pericia necesita el TEXTO de un PDF (un contrato, un oficio), ¿hoy
   qué hace Forensic? ¿No lo extrae, o lo extrae en otro procesador?
3. ¿Cómo se invoca "cuando se lo requiera"? Forensic es por caso, no continuo:
   habría que ver si el orquestador puede llamar al Convertidor por HTTP como
   hace el scraper de JustiRed, y con qué credencial (el motor exige
   `Authorization: Bearer` desde el 16-ago-2026, y la regla del ecosistema es
   **un token por producto**, así que sería el suyo, no el de JustiRed).
4. Si pasa a consumirlo, el Convertidor deja de tener dos consumidores y pasa a
   tener tres — y eso toca la decisión de capacidad/cobro: los transversales no
   se cobran entre sí, pero sí consumen cómputo de Railway que ahora **es el
   producto** (`ALMACENAMIENTO-COSTOS.md` §8.3).

---

## 23. ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito

**Va en `sorsabsa.com`.** Decisión de Gina el mismo día en que apareció el tema.

**Cómo apareció:** hablando de costos por producto, Gina lo reformuló hacia lo
que de verdad le falta: *"hoy no hay algo desde donde yo diga administro desde
aquí mi negocio, veo cuántos clientes, ingresos, gastos, etc… ahora tendría que
monitorear las bases de datos a mano, no sé quién ingresa y si alguien
ingresa"*.

Y después lo encuadró bien, que es lo que cambia el alcance: *"es parte de un
CRM que eso sí necesito, el CRM para que pueda contratar vendedores y ellos
puedan gestionar, promocionar y vender los productos del ecosistema"*.

### ⚠️ Este CRM NO es DomusCRM — no confundirlos nunca

| | **DomusCRM** (`crm_inmobiliario`) | **Este** |
|---|---|---|
| Qué es | Producto que SE VENDE | Herramienta INTERNA de SORSABSA |
| Quién lo usa | Inmobiliarias clientes y sus agentes | Gina y los vendedores que contrate |
| Qué gestiona | Inmuebles y sus compradores | **Los seis productos del ecosistema y quién los compra** |
| Dominio | `domuscrm.app` (multi-tenant) | `sorsabsa.com` |

Los dos son "un CRM" y ahí termina el parecido. Quien retome esto: leer esta
tabla antes de proponer "reusar DomusCRM", que es la conclusión fácil y
equivocada — DomusCRM vende metros cuadrados, este vende suscripciones a
software.

### Estado real, relevado el 16-ago-2026 (no supuesto)

Lo que **ya existe** y sería su materia prima:

- **Ingresos y suscriptores por producto:** `pagos-sorsabsa` tiene `pagos` y
  `suscripciones`, las dos con columna `producto` **e indexadas por ella**.
  Está construido, solo que nadie lo mira. Es la mitad que suele costar.
- **Quién entra:** consultado en vivo contra `verticales_sorsabsa`
  (`/auth/v1/admin/users`): **11 usuarios, los 11 han iniciado sesión alguna
  vez, ninguno registrado sin entrar nunca**, último ingreso ese mismo día a
  las 14:42, actividad concentrada entre el 8 y el 15 de agosto. La mayoría
  entra por `custom:sorsabsa-identity`, o sea federada por el portero, que es
  como debe ser.

Lo que **no existe**:

- **Gastos por producto.** Cloudflare, Railway, Vercel, Supabase y Hostinger
  van cada uno por su lado y ninguno sabe qué producto es cuál. Necesita el
  inventario de recursos por producto — ver `ALMACENAMIENTO-COSTOS.md`.
- **Historial de ingresos.** `last_sign_in_at` guarda **un solo sello y pisa el
  anterior**: dice cuándo entró por última vez cada persona, y nada más. No
  dice a qué producto entró, ni cuántas veces, ni si entró y rebotó contra una
  pantalla de "sin acceso".
- **Cualquier noción de vendedor, cartera, comisión o embudo**, que es lo que
  el CRM necesita y hoy no tiene dónde apoyarse.

### Lo que se pierde mientras tanto — dicho y aplazado a conciencia

**El portero es el único punto por donde pasan todos los ingresos de todos los
productos**, y hoy no registra ninguno. Cada login que ocurre sin registrarse
es histórico que **no se puede reconstruir después**: es lo único de esta lista
que no se puede armar más adelante con datos ya guardados.

Se le planteó a Gina que empezar por ahí costaba poco (una tabla y una
escritura desde `/auth/complete`) y **decidió aplazarlo igual**, con su razón:
*"no es algo en lo que ahora me quiera desgastar porque realmente nos falta
mucho para llegar a tener clientes"*. Con cero clientes, el histórico que se
pierde es de sus propias pruebas. Queda anotado que fue una decisión tomada
sabiendo el costo, no un olvido.

### Orden sugerido cuando se retome

1. **Registro de ingresos en el portero** — lo único urgente por lo de arriba.
2. **Inventario de recursos por producto** — destraba el cuadrante de gastos.
3. **Consola** — dónde se mira todo junto; hasta que existan 1 y 2 no tendría
   qué mostrar.
4. **CRM de ventas** encima de eso: vendedores, cartera, comisiones.

**No es un producto más del ecosistema**: es la herramienta desde la que se
administran los otros seis. Vive en `sorsabsa.com`, usa el portero como todos,
y lee de `pagos-sorsabsa` con su propia clave (regla de una clave por producto,
`pagos-sorsabsa/lib/auth.js`).

---

## 24. 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)

**Contexto.** Dos días de sesión arrancando de *"me preocupa que ninguno de los
productos esté cobrando"*. Resultó cierto: **el cobro llevaba semanas muerto y
`pagos.pagos` tenía cero filas**. Causa raíz: PayPhone devolvía 401 a cada
intento (token de una aplicación en **Prueba** contra el endpoint de
producción), y `api/iniciar.js` llamaba a la pasarela **antes** de insertar la
fila, así que ningún intento fallido dejaba rastro. Los dos checks de QA que
tocaban pagos comprobaban que la puerta *rechazara* sin clave — y siguieron en
verde todo ese tiempo.

Detalle técnico completo (qué es el `storeId`, por qué el enlace de pago exige
`Referer`, las variables selladas de Railway) en
[`ARQUITECTURA-ECOSISTEMA.md`](ARQUITECTURA-ECOSISTEMA.md) §4-ter. Cierra
también el §21-bis de este documento.

### Lo que quedó funcionando ✅

| Qué | Verificado |
|---|---|
| Cobro Capa 1 de punta a punta | Pago real de $9: `APROBADO`, `transaction_id 90384096`, suscripción extendida con `ultimo_pago_id` |
| Intento fallido deja rastro | Estado nuevo `FALLIDO` con el motivo textual de la pasarela |
| Monitor que lo detecta | `/api/salud-pasarela` + check *"Pagos · la caja PUEDE cobrar"* en qa_sorsabsa |
| Catálogo de productos | Tabla `pagos.productos`: alta de un producto = un INSERT |
| Aviso de vencimiento | `/api/avisar-vencimientos` + cron diario en GitHub Actions |
| Confirmación del Convertidor | Ruta `/api/pagos/confirmar` — antes la pantalla de éxito **mentía** |
| Puerta de "Crear cuenta" | En `/oauth/consent`, la única pantalla de acceso que el usuario ve |

### ✅ El aviso de vencimiento ya llega — en CondoManager (22-ago-2026)

`pagos-sorsabsa` **no puede** mandar el aviso y no debe: guarda `sujeto` como
id opaco, sin nombres ni correos, a propósito. Solo el producto sabe
traducirlo. Por eso avisa al PRODUCTO, y el producto decide a quién.

`condomanager/app/api/webhooks/vencimiento` resuelve el `sujeto` a condominio y
manda **dos correos**: al cliente para que renueve, y uno interno a SORSABSA
con nombre, correo, teléfono y ciudad — porque el objetivo declarado era poder
**llamar** antes del corte, no solo enterarse. El interno sale incluso si el
cliente no tiene correo registrado, que es justo el caso en que hay que llamar.

Va por **correo** (Resend, el canal propio que CondoManager ya tenía) y **no**
por la campana de `notificaciones-sorsabsa`: la campana solo la ve quien entra,
y quien está por vencer es justamente quien dejó de entrar.

Verificado de punta a punta el 22-ago-2026 con una corrida real, y la segunda
corrida devolvió `ya_avisadas: 6` — no reenvía.

> **Falta el mismo receptor en los demás productos.** `callback_vencimiento_url`
> sigue en NULL para `domuscrm`, `justired`, `convertidor` y `agente24siete`:
> el cron los detecta y los reporta en `sin_receptor`, visible en la salida y
> como `::warning::` de GitHub. Cada uno necesita su propio endpoint, porque
> cada uno traduce su `sujeto` a otra cosa.
>
> **Falta configurar `EMAIL_AVISOS_INTERNOS`** en el proyecto Vercel de
> CondoManager. Sin esa variable el correo al cliente sale igual, pero el aviso
> interno no — y avisa por consola en vez de fallar en silencio.

### 🟠 Cobro incompleto

| # | Qué falta | Por qué importa |
|---|---|---|
| 24.1 | **`pagos.comercios` está vacía** | La Capa 2 no puede cobrar: ni condominio→residente (alícuotas) ni inmobiliaria→sus clientes. El código existe y es fail-closed, así que hoy falla para toda entidad |
| 24.2 | **DomusCRM y Forensic sin código de cobro** | No es un problema de credenciales: la ruta de pago no está escrita. DomusCRM no tiene página propia de suscripción |
| 24.3 | **Referidos: la conversión nunca se construyó** | Los estados llegan hasta `registrado`; acreditar `recompensa_dias` no existe en ningún archivo. Ya estaba anotado y sigue |

### 🟡 Deuda del motor financiero

| # | Qué | Detalle |
|---|---|---|
| 24.4 | **`clave_hash` sin usar** | Las claves de los 4 productos actuales siguen en variables de entorno. NO se migraron a propósito: las "Sensitive" de Vercel y las selladas de Railway no se pueden releer (`PAGOS_API_KEY_DOMUSCRM` es una), y rotarlas a ciegas cortaría al producto en producción. Se retiran cuando se pueda regenerar cada una con su producto delante |
| 24.5 | **La clave SALIENTE de los callbacks sigue siendo la compartida** | `api/confirmar.js` y `api/avisar-vencimientos.js` autentican con `PAGOS_API_KEY` hacia todos. Es el comportamiento que ya había, pero es acoplamiento: depende de 24.4 |
| 24.6 | **`pagos-sorsabsa` no despliega desde GitHub** | Entre sus variables no hay ninguna `RAILWAY_GIT_*`, que es lo que Railway inyecta cuando el servicio está conectado a un repo. Hoy se sube con `railway up` desde la máquina de Gina — justo lo que ella pidió evitar (*"todo debe correr directamente en nube"*) |
| 24.7 | **Parche de seguridad de Postgres sin aplicar** | Railway lo programó para la próxima ventana de mantenimiento. Reinicia el Postgres de `pagos` **y** `notificaciones`. Conviene aplicarlo mirando, no dejarlo caer solo |

### 🟡 Datos que mienten

| # | Qué | Por qué importa |
|---|---|---|
| 24.8 | **5 de 6 suscripciones de `condomanager` apuntan al vacío** | Sus `sujeto` no son ni condominio, ni perfil, ni usuario — condominios borrados o ids que nunca existieron. Solo `1e0656a0…` (Punta Blanca) es real. **Inflan cualquier métrica de clientes activos**, y de hecho ya causaron una conclusión falsa en esta misma sesión: se repitió durante dos días que "6 condominios pierden acceso el 24" contando filas sin comprobar a qué apuntaban. Es la Regla 4 del estándar |
| 24.9 | **Filas de prueba en `pagos.pagos`** | Dos `_verificacion` y dos `convertidor` en `PENDIENTE` que no se pueden confirmar hacia atrás (nunca se recibió el `id` de PayPhone, porque la pantalla que lo traía lo ignoraba). Limpiarlas o marcarlas antes de que alguien mida ingresos |

### 🟡 Portero

| # | Qué | Detalle |
|---|---|---|
| 24.10 | **"Crear cuenta" se muestra para TODAS las apps** | Debería ser declarado, no supuesto: un campo en `auth-sorsabsa/src/lib/apps.ts`, al lado de `registerUrl` que ya funciona así. En agente24siete esa puerta invita a fabricar identidades huérfanas, y la persona lo descubre *después* de registrarse. **El campo NO debe ser un `autoservicio: sí/no`** — ver 24.10-bis: lo que decide no es una política sino qué exige el alta, y eso cambia con el tiempo |
| 24.11 | **Diseño: una puerta, no dos** | Recomendación, no defecto. El patrón actual en autoservicio (Slack, Notion, Linear, Vercel) es **email primero**: se escribe el correo y el sistema decide si es acceso o alta. `/oauth/consent` ya pide correo y contraseña en la misma pantalla, así que encaja — y elimina la pregunta en vez de responderla con un enlace |

### 24.10-bis · Por qué agente24siete no puede tener autoservicio, y qué haría falta

Primero se anotó que "sus clientes los da de alta un administrador". Es cierto
y es la **consecuencia**, no la causa. La causa es que **cada alta consume un
recurso escaso y pagado**, y eso cambia el embudo entero.

**Lo que hace distinto a este producto:**

1. **Un cliente sin número no tiene producto.** `negocios.numero_whatsapp_id`
   es `UNIQUE NOT NULL`: un negocio no existe sin canal. El Convertidor entrega
   valor con cero aprovisionamiento —se sube un PDF y ya—; agente24siete no
   hace nada hasta que un número apunta a él.
2. **Ese número cuesta desde el minuto uno, y no lo paga el cliente.** Un alta
   gratuita es un número comprado más minutos de Deepgram, ElevenLabs y Claude
   en cada llamada. El freemium del Convertidor es barato (CPU); el de
   agente24siete es un **pasivo recurrente por cada registro**.
3. **El alta es manual de verdad, no por política.** `agente24siete/docs/twilio.md`
   pasos 3 y 4: comprar el número con capacidad *Voice*, configurar su webhook
   en la consola de Twilio y después un `UPDATE negocios SET
   twilio_phone_number=…, canal_toggle=…` a mano. Más el `prompt_sistema`, que
   hoy lo escribe alguien que entendió el negocio del cliente.

**Nada de eso es imposible — está sin construir.** Twilio tiene API para
comprar el número y fijar su `VoiceUrl` programáticamente, lo que convierte los
pasos 3 y 4 en código; el `prompt_sistema` sale de un formulario de onboarding;
y el saldo prepago ya existe (`movimientos_saldo` con su ledger, `planes.markup_uso`
a 1.5).

**Pero el embudo se invierte respecto al Convertidor:** allí se prueba y luego
se paga; aquí hay que **cobrar antes de aprovisionar**. "Crear cuenta gratis"
en agente24siete no es una puerta, es una factura. La versión compatible con
autoservicio sería un **número demo compartido** con tope duro: el prospecto
llama, comprueba que funciona, y solo al pagar se le compra el suyo.

**Falta separar dos consumos distintos (planteado por Gina, 22-ago-2026).** Lo
que gasta el CLIENTE y lo que gasta SORSABSA no son lo mismo, y hoy solo está
modelado el primero: `movimientos_saldo` está keyed por `cliente_id`, así que
el consumo propio de SORSABSA no tiene dónde vivir. Cualquier uso interno del
canal —ver el párrafo siguiente— necesita esa separación antes de existir, o se
mezcla con la facturación de los clientes.

**Idea aplazada a futuro:** un robot que llame para vender y evitar pagar
vendedores. Es consumo de SORSABSA, no de un cliente — depende de la separación
de arriba.

> ### ⛔ Decisión de Gina, 22-ago-2026: por ahora NO se gasta en números
>
> Twilio queda en pausa. No se compran números ni se aprovisiona nada por
> cliente. **Consecuencia, escrita sin adornos: agente24siete no se puede
> vender hoy** — WhatsApp baneado por Meta ("hoy en standby", su README) y la
> voz con el código completo pero sin cuenta ni número. La pregunta del
> registro y el autoservicio es *posterior* a tener un canal vivo: no hay
> producto que entregar aunque alguien se registre y pague.
>
> Por eso el campo de `apps.ts` (24.10) **no debe ser un booleano**: un
> `autoservicio: false` congelaría como "nunca" algo que es una pausa. Debe
> describir **qué exige el alta** de ese producto, para que el día que el
> número se compre solo y se cobre por adelantado, el cambio sea un dato y no
> una revisión del portero.

### 🟡 Convertidor

| # | Qué | Detalle |
|---|---|---|
| 24.12 | **`npm run lint` no revisa nada** | El script existe pero el proyecto **no tiene configuración de ESLint**: al correrlo, pide crearla desde cero. Es exactamente la Regla 2 de la parte II del estándar — *"una comprobación desconectada es una comprobación que no existe"*. El typecheck sí sirvió: atrapó una regresión real en esta sesión |
| 24.13 | **`__pycache__/*.pyc` versionados** | Mismo problema que los 154 archivos de `.next` que ya documentó `ARQUITECTURA-ECOSISTEMA.md` |
| 24.14 | **El requisito de cuenta aparece en el paso del pago** | Hoy: se convierte gratis, se pulsa "Suscribirse" y *ahí* se pide cuenta — el peor momento, porque la persona ya decidió comprar y se le pone un trámite. El momento natural es **cuando choca con el límite** (su archivo pesa 62MB, el tope gratis son 50), con su archivo delante. Hoy el producto pide la cuenta **para cobrar**, no **para servir** |

### 🟡 QA

| # | Qué | Detalle |
|---|---|---|
| 24.15 | **JustiRed en rojo, desde antes de esta sesión** | *"Biblioteca Legal: ID inexistente devuelve 404, no revienta el servidor"* está devolviendo **200**: un ID que no existe responde como si existiera. Sin diagnosticar |


---

## 25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026)

**Requisito de Gina, repetido varias veces y nunca cumplido del todo:** la
campana de notificaciones va **siempre en la esquina superior derecha, antes
del perfil del usuario, en todos los productos del ecosistema**, con el mismo
diseño. No es una preferencia estética: es el canal por el que se avisa de una
**urgencia o un problema del ecosistema**, y un canal que no está en todos los
productos no sirve para eso.

### Lo que había — auditado el 22-ago-2026

| Producto | Campana | Qué usaba |
|---|---|---|
| CondoManager | ⚠️ | **Propia y suelta**: un `<Link>` a una página con un icono `Bell` de lucide-react dentro de su `<header>` (`DashboardShell.tsx` L630). **No usa el componente compartido** |
| DomusCRM | ⚠️ | **Propia** (71 líneas): botón `rounded-full` con `p-2`, `Icon` del design system |
| JustiRed | ⚠️ | **Propia** (102 líneas): `rounded-xl h-10 w-10`, icono `Bell` de **lucide-react** |
| agente24siete | ❌ | **Ninguna** |
| Convertidor | ❌ | **Ninguna** |

Cuatro respuestas distintas al mismo elemento. Ni el mismo componente ni el
mismo diseño — hasta los hooks diferían en los nombres (`noLeidas`/`marcarLeida`
frente a `unreadCount`/`markRead`). Es la duplicación que persigue
`ESTANDAR-DESARROLLO.md`: *"la misma regla en producto A y producto B — encontrar
la fuente única de verdad y que ambos la usen"*.

### Lo hecho ✅

`@sorsabsa/ui` ya exportaba `NotificationBell`, y es **puramente
presentacional**: recibe `notificaciones`, `unreadCount`, `onMarkRead` y
`onMarkAllRead` por props. Los datos —de dónde salen y cómo se marcan leídas—
son de cada producto y se quedan en su hook. Por eso la migración fue mecánica:
los dos hooks ya devolvían exactamente la forma que el componente espera
(`id`, `tipo`, `mensaje`, `leida`, `created_at`).

**DomusCRM y JustiRed** pasaron a ser adaptadores de ~30 líneas sobre el
componente compartido. Sus puntos de uso (layout y Navbar) no cambiaron.
Verificado con `tsc --noEmit` y el build de cada uno.

### Lo que falta 🟡

**agente24siete y el Convertidor siguen sin campana**, y ahí **no basta un
adaptador**: ninguno de los dos está integrado con `notificaciones-sorsabsa`.
Cada uno necesita, en este orden:

1. Las rutas de API que hablen con el servicio compartido (`/api/crear`,
   `/api/listar`, `/api/marcar-leida`, `/api/marcar-todas-leidas`) con su
   propia `NOTIFICACIONES_API_KEY`.
2. Un `useNotifications` que devuelva la forma estándar.
3. El `NotificationBell` de `@sorsabsa/ui` en su cabecera, antes del perfil.

**Por qué importa más de lo que parece:** mientras esos dos no la tengan, un
aviso de urgencia del ecosistema **no llega a sus usuarios**, que es el caso de
uso que motivó el requisito. Y el Convertidor es hoy el único producto con un
cobro verificado funcionando, o sea el único con clientes que pagan a los que
haya que avisarles de algo.


### Corrección del 22-ago-2026 y decisión de Gina

Lo primero que se reportó aquí —"CondoManager usa la del design system"— **era
falso**. `NotificationBell` de `@sorsabsa/ui` tenía **cero usos en todo el
ecosistema**: CondoManager también tenía la suya, suelta dentro de su `<header>`.
Eran cuatro respuestas distintas y el componente compartido no lo usaba nadie.
El error vino de dar por buena una coincidencia de `grep` sobre la palabra
"Bell" sin abrir el archivo.

**Decisión de Gina: el estándar es el componente del design system.** O sea que
falta **migrar CondoManager**, cuya campana hoy es un enlace a una página y pasa
a ser el panel desplegable compartido. DomusCRM, JustiRed y el Convertidor ya
están en él.

**Y una limitación del check de conformidad que este caso destapó:** detecta
"este repo redefine un símbolo que `@sorsabsa/ui` exporta", pero **no** detecta
"lo reimplementó suelto dentro de un archivo" — que es exactamente lo de
CondoManager. La regla que faltaría: marcar la importación directa de iconos de
`lucide-react` que el design system ya envuelve.

### ✅ Cerrado el 22-ago-2026 — los cinco productos

| Producto | Cómo quedó |
|---|---|
| CondoManager | Adaptador `CampanaNotificaciones` + se retiró su campana suelta, su contador y la prop `notifCount` |
| DomusCRM | Adaptador sobre el componente compartido |
| JustiRed | Adaptador (se borraron ~100 líneas de implementación propia) |
| Convertidor | Integración completa nueva: puente, 3 rutas, hook y campana |
| agente24siete | Integración completa nueva **+ barra superior**, que no existía |

**Dos cosas hubo que arreglar en el propio componente compartido**, y las dos
se descubrieron al ir a migrar CondoManager — o sea, leyendo lo que cada
producto renderiza, no antes:

1. **Estaba pintado a mano en gris oscuro** (`bg-zinc-900`, `border-zinc-700`,
   `text-emerald-400`, `font-mono`): el componente del design system ignoraba
   los tokens del design system. Puesto en CondoManager (verde y oro) o
   DomusCRM (azul) se veía como un panel ajeno pegado encima — y las
   implementaciones locales que reemplaza **sí** usaban los tokens, así que
   unificar tal cual habría sido un retroceso visual en tres productos a la
   vez. Corregido en **v0.1.54**: ahora hereda del `BrandProvider` de cada
   producto. Misma campana, la marca de quien la muestra.
2. **No tenía enlace a la bandeja completa**, y CondoManager sí la tiene, con
   destino según rol. Migrar sin eso le habría quitado el acceso a esa
   pantalla. `verTodasHref` se añadió en **v0.1.55**: un componente compartido
   tiene que cubrir lo que cubrían las implementaciones que reemplaza; si no,
   "unificar" es degradar.

Los cinco productos quedaron en `@sorsabsa/ui` **v0.1.55**.

**Falta configurar, y sin esto la campana sale vacía** (lo dice por consola, no
falla en silencio): `NOTIFICACIONES_API_URL` y `NOTIFICACIONES_API_KEY` en los
proyectos Vercel de **Convertidor** y **agente24siete**.

---

## 26. 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)

**Por qué esta sección se escribe así.** Gina, al cerrar el día:

> *"si no sirve para que compren, el esfuerzo de 6 meses no sirve para nada.
> Un usuario: vale o no vale. Tú puedes decir que el código es maravilloso,
> pero si para el usuario tiene un error, el sistema no vale."*

Tiene razón, y las listas anteriores de este documento están escritas al
revés: agrupadas por defecto técnico, no por lo que le pasa a la persona que
intenta pagar. Esta es la única tabla que decide si hay negocio.

El ejemplo que lo prueba, encontrado hoy: en el Convertidor el código estaba
bien, la pantalla decía **"¡Pago confirmado!"**, y el cliente **no recibía
nada** — porque nadie llamaba a `Confirm` y PayPhone reversaba el cobro a los
5 minutos. Ningún test lo habría visto; ninguna métrica lo mostraba. Solo la
pregunta de arriba.

### El estado real, producto por producto

| Producto | ¿Se puede registrar? | ¿Puede pagar? | ¿Recibe lo que compró? |
|---|---|---|---|
| **Convertidor** | ✅ desde hoy | ✅ verificado con pago real | ✅ desde hoy — **antes no** |
| **CondoManager** | ✅ onboarding propio | ✅ Capa 1 | ⚠️ **Capa 2 imposible**: `pagos.comercios` vacía, ningún condominio puede cobrar alícuotas |
| **JustiRed** | ✅ | ✅ Capa 1 | ⚠️ el `sujeto` de su suscripción no es estable: cada renovación crea fila nueva en vez de extender |
| **DomusCRM** | ✅ onboarding propio | ❌ **no existe página de pago** | — |
| **agente24siete** | ⚠️ sí, pero **solo el admin da de alta** — ya no rechaza a quien tiene cuenta en el ecosistema, y desde el 22-ago hay pantalla para hacerlo | — | ❌ **no hay canal**: WhatsApp baneado por Meta, Twilio sin número |
| **Forensic** | — | ❌ **cobro sin implementar** (Fase 5) | — |

**Traducido a negocio: de seis productos, hoy solo UNO puede venderse y
entregarse de punta a punta.** Y hasta esta mañana, ninguno.

### Lo que bloquea cada uno, en orden de cercanía a una venta

1. **CondoManager · Capa 2 sin comercios.** El código está y es fail-closed, así
   que hoy falla para todo condominio. Falta dar de alta credenciales por
   entidad. Es el producto más cerca de vender y lo detiene un dato ausente.
2. **DomusCRM · sin ruta de pago.** No es configuración: la pantalla y el
   endpoint no están escritos.
3. **agente24siete · queda un bloqueo, de los dos que había.** (a) ~~El alta
   rechaza a quien ya tiene identidad en el ecosistema~~ — **cerrado el
   22-ago-2026**, ver §27: `acceso-cliente.js` ahora asegura la identidad en
   vez de crearla, y existe la pantalla que faltaba para dar de alta.
   (b) **Sigue abierto:** aunque se dé de alta, no hay canal que entregar.
   Decisión de Gina del 22-ago: no se gasta en números (ver §24.10-bis).
4. **JustiRed · sujeto inestable.** Cobra, pero la suscripción no se acumula.
5. **Forensic · cobro sin escribir.**

### La lección de método, que es la que se repitió todo el día

Cada defecto de esta lista **existía desde hacía semanas o meses** y ninguno
apareció por leer código: aparecieron al **intentar usar el producto**. El
cobro muerto salió al mirar los logs; el "¡Pago confirmado!" que mentía, al
mirar la base después de un pago real; el 409 del alta, al intentar entrar.

`ESTANDAR-DESARROLLO.md` parte II ya lo dice en abstracto —*"una prueba que
pasa no es una prueba que sirve"*—. Esta sección es su forma concreta:
**antes de dar algo por hecho, recorrer el camino del usuario completo, con
datos reales, hasta que reciba lo que compró.** Ninguna otra comprobación
sustituye eso.

---

## 27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)

### El hueco: código escrito que nadie ejecutaba

`/api/admin/clientes` y `/api/admin/acceso-cliente` existían, funcionaban y
estaban probados contra la base. **Ninguna pantalla los llamaba.** Dar de alta
un cliente exigía escribir SQL a mano — es decir, en la práctica el producto
no se le podía vender a nadie, aunque cada pieza por separado estuviera bien.

Es el caso literal de `ESTANDAR-DESARROLLO.md` Parte II regla 1 (*código que
nadie ejecuta*), y la razón por la que §26 se pregunta por el camino del
usuario y no por el estado del código: acá el código estaba **completo**.

### Lo hecho ✅ — `app/admin/clientes`

- **Alta** con los datos que exige el SRI para facturar (razón social, RUC,
  dirección) y contacto, en formulario **en la misma página**. Sin modales
  (`ESTANDAR-UI.md` §1).
- **Lista** con los tres estados reales de acceso —con acceso · invitado que
  todavía no entró · sin acceso—, cuántos negocios cuelgan del cliente, y su
  suscripción.
- **Dar acceso** expandido bajo la fila, también en línea.
- El menú del panel se unificó en `AdminNav.tsx` (una sola lista para
  escritorio y móvil) — donde apareció que **`/admin/negocios` existía sin
  estar enlazada en ningún lado**: solo se llegaba escribiendo la URL.
- Se retiraron los tres `prompt()` de `/admin/contactos`, que violaban
  `ESTANDAR-UI.md` §1 desde antes de que la regla se escribiera.

### Lo que la pantalla dice y el sistema antes se callaba

Tres cosas que ocurrían en silencio y ahora se ven:

1. **La contraseña que el admin escribe puede no aplicarse.** Si la persona ya
   tiene cuenta en el ecosistema —el caso normal en cuanto hay dos productos,
   porque identity es una sola— entra con la suya. El endpoint ya devolvía
   `identidadYaExistia`; nadie lo mostraba. Sin ese aviso el admin le dicta al
   cliente una clave que no funciona.
2. **El período de prueba puede no crearse.** El trial vive en pagos-sorsabsa y
   su fallo no aborta el alta (a propósito). El resultado se descartaba: un
   cliente sin trial se veía idéntico a uno con trial, y se enteraba el usuario
   final cuando el bot dejaba de contestarle.
3. **"No tiene suscripción" y "no pude preguntar" son cosas distintas.**
   `consultarSuscripcionCliente` las separa. Colapsarlas haría que un corte de
   pagos-sorsabsa se lea como *"todos tus clientes están vencidos"*; colapsarlas
   al revés sería el fallback peligroso que `ESTANDAR-DESARROLLO.md` prohíbe.

### 🔴 Y el agujero que apareció al leer los endpoints

Los **11** endpoints de `pages/api/admin/` llamaban a `autenticarAdmin` **sin
`await`**. Como es `async`, devolvía una Promesa —siempre truthy— así que el
`if (!usuario) return` **nunca se cumplía** y el cuerpo del handler se
ejecutaba con la sesión ya rechazada: `crearCliente` insertaba,
`crearTrialCliente` disparaba y `acceso-cliente` llegaba a `createUser` **en el
Supabase de identidad compartido de todo el ecosistema**.

Análisis completo, tabla de carreras y verificación en producción:
`AUDITORIA-AGENTE24SIETE.md` 🔴-2. Corregido en `agente24siete@16ef1db`.

**Lo importante de este hallazgo no es el bug, es cómo se veía:** las
respuestas eran 401 y 403 correctos. Desde afuera el panel parecía
autenticado. No lo encontró ninguna auditoría de seguridad ni ningún check —
apareció al ir a construir la pantalla que faltaba.

### Lo que queda 🟡

- **No hay comprobación automática que impida que el `await` se vuelva a
  perder.** El contrato quedó escrito en el docblock de `lib/adminAuth.js`,
  y eso es todo lo que lo sostiene. `pages/api/**` es `.js` sin tipos;
  lo que sí lo marcaría es la regla `@typescript-eslint/no-floating-promises`.
  **No está puesta. Anotado, no resuelto.**
- **El alta sigue siendo solo del admin.** No hay autoservicio, y es
  deliberado — ver §24.10-bis.
- **Y el bloqueo que manda: no hay canal.** Un cliente dado de alta, con
  acceso y con suscripción, todavía no recibe lo que compró: WhatsApp está
  baneado por Meta y Twilio no tiene número. La pantalla saca a agente24siete
  del "no se puede ni empezar", no del "no se puede entregar".

---

## 28. ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026

**Por qué esta sección existe separada.** Gina agrupa las pruebas en vivo al
final, no intercaladas, y esa noche cerró cansada: *"qué otra cosa podemos
avanzar, estoy cansada como para hacer pruebas, pero las cosas que puedan ir de
tu lado sí podríamos avanzar"*. Todo lo de abajo **necesita a una persona
usando el producto** — no se puede cerrar desde el código, y por eso queda
escrito en vez de quedar en la conversación.

Cada punto dice qué hacer, qué tiene que pasar, y qué significa si no pasa.

### 28.1 · CondoManager → EcoInmobiliaria (lo más cerca de valer dinero)

La integración se enganchó el 22-ago (`condomanager@3127979` y siguientes;
`AUDITORIA-CONDOMANAGER.md` 🔴-4). Estado verificado ese día:

- ✅ Lado DomusCRM: `configurado: true` en
  `www.domuscrm.app/api/webhooks/condomanager/salud`.
- ✅ El tenant `ecoinmobiliaria` existe (`domus.site_lookup`).
- ⬜ **Lado CondoManager: sin verificar.** Necesita sesión.

**La prueba:** entrar a la única unidad que hay (terreno, Mz. 114 Lote 14,
condominio *Comité Pro Mejoras Sector 46 de Punta Blanca*), ponerla **EN VENTA
con precio**, subirle una foto, y guardar.

- Si aparece una **advertencia ámbar** en la sección Comercialización → falta
  `DOMUSCRM_WEBHOOK_KEY` en CondoManager y no se publicó nada.
- Si no aparece → se envió. Comprobar en `domus.properties` que llegó, con
  `property_type = 'land'` (no `apartment`) y con sus fotos.

### 28.2 · agente24siete — el alta que antes no existía

Todo lo del 22-ago está desplegado y sin probar por una persona:

| qué probar | qué tiene que pasar |
|---|---|
| Entrar por cualquier puerta (`/portal`, `/admin`, "Ingresar" de la web) | aterrizar en el **panel**, sin pantallas de rechazo (🔴-3) |
| Crear un cliente en `/admin/clientes` | queda creado **con 15 días de prueba**; si no, avisa que pagos no respondió |
| Darle acceso con un correo **que ya exista** en el ecosistema | aviso ámbar: entra con SU contraseña, la escrita no se aplica |
| La campana en el panel | arriba a la derecha, antes del perfil |
| "Salir" y volver a entrar | pide credenciales y **no** reusa la sesión anterior (🟠-4) |

**La primera vez hay que entrar de nuevo:** la llave de sesión cambió a
`a24_token` (🔴-3), así que toda sesión abierta dejó de valer. Es una sola vez.

### 28.3 · Lo que arrastra de días anteriores

- **El aviso de vencimiento de CondoManager** (§24): confirmar que el correo
  llegó. Si no llegó, `RESEND_API_KEY` quedó mal puesta.
- **La campana en convertidor y agente24siete**: que no salga vacía —
  confirmaría `NOTIFICACIONES_API_URL`/`_KEY` en Vercel.
- **🟠-4 de `AUDITORIA-AGENTE24SIETE.md`**: en DevTools → Application,
  confirmar que al salir **no queda ninguna** de las dos llaves de sesión. Ese
  punto 9 ya estuvo seis días sin ejecutarse y por eso el hallazgo quedó medio
  abierto sin que nadie lo supiera.

### Lo que NO está en esta lista, a propósito

Nada que se pueda comprobar leyendo, consultando una base o corriendo un
build. Todo eso ya se hizo y está en los commits y en las auditorías. Acá solo
queda **lo que exige a una persona usando el producto**, que es exactamente la
clase de defecto que todo el 22-ago demostró que ninguna herramienta encuentra.

---

## 29. 🟡 Lo que queda del barrido de UI del 23-ago-2026 — 18 modales, 8 desvíos y un sistema de avisos sin disparador

**Contexto.** El 23-ago se hizo el primer barrido de `ESTANDAR-UI.md` §1 sobre
todo el ecosistema y la consolidación del design system. Lo hecho está en
`AUDITORIA-CONDOMANAGER.md` (🟠-5, 🔵-6), `AUDITORIA-JUSTIRED.md` y
`AUDITORIA-DOMUSCRM.md`. Esta sección es **solo lo que quedó vivo**, con lo que
hace falta para cerrarlo.

Todo lo de abajo se puede hacer sin Gina. No requiere pruebas en vivo (eso es
§28).

### 29.1 · 18 modales del navegador

Números verificados corriendo `npm run modales:local`, no estimados.

| producto | vivos | dificultad |
|---|---|---|
| CondoManager | 10 | 8 mecánicos · 2 necesitan diseño |
| DomusCRM | 7 | 5 mecánicos · `prompt()` de GeoLocation necesita un campo |
| JustiRed | 1 | `alert()` en `Hero.tsx:22` |
| agente24siete · Convertidor · auth-sorsabsa · pagos-sorsabsa | **0** | — |

**Los mecánicos** son `ConfirmarAccion` de `@sorsabsa/ui` (v0.1.56+) o un aviso
en la pantalla. La pieza ya existe; no hay nada que diseñar.

**Los dos que NO son mecánicos, y por qué:**

- `condomanager .../recaudacion/admin/administrar/generar` — dice *"Ya existe
  una deuda para este rubro en este período, ¿continuar?"*. Eso **no es
  "¿estás seguro?"**: es una advertencia con una decisión real detrás.
  Convertirlo en un `ConfirmarAccion` genérico perdería la información. Va
  como aviso en la pantalla, con el detalle de qué deuda ya existe.
- `condomanager .../crm-vendedores/vendedor/[oportunidadId]` y
  `domuscrm .../properties/new/components/GeoLocation.tsx` — son `prompt()`,
  o sea **piden un dato**. Necesitan un campo en el formulario, no un botón de
  confirmar.

**Al convertir un `confirm()` de borrado hay que conservar la protección.** Es
el error real de esta tanda: en `571c80b` se quitó el `confirm()` de
`useAmenidades` y `useMantenimientos` sin poner nada, y borrar una amenidad con
todas sus reservas quedó a un clic. Lo encontró Gina preguntando, no una
prueba. Corregido en `ddce3c7`.

### 29.2 · 8 desvíos de conformidad — de los cuales 1 es falso positivo

Corriendo `npm run conformidad:local` el 23-ago, **con los grafos al día**:

- **4 × `Notificacion`** — el mismo tipo declarado de nuevo en CondoManager
  (2 pantallas), DomusCRM y JustiRed, cuando `@sorsabsa/ui` ya lo exporta.
  JustiRed y DomusCRM son **idénticos carácter por carácter**: se arregla
  importando. CondoManager le suma `condominio_id` y `usuario_id`, así que
  debe **extender** el tipo compartido, no repetirlo.
- **3 × sistema de toasts de JustiRed** — ver 29.3. Aplazado a propósito.
- **1 × `Tag` en agente24siete** — ⚠️ **falso positivo, no tocar.**
  `app/admin/contactos/page.tsx` declara `type Tag = { id, nombre, color }`:
  es la **etiqueta de un contacto**, un tipo del negocio. El `Tag` de
  `@sorsabsa/ui` es una píldora de interfaz. Misma palabra, cosas sin relación.
  El check compara nombres de símbolos y no puede distinguirlas.
- ~~**Convertidor: SIN GRAFO**~~ — ❌ **hallazgo mío equivocado, corregido el
  mismo día.** El Convertidor **sí tiene grafo**: vive en
  `frontend/graphify-out/graph.json`, porque su app vive en `frontend/`. El
  check miraba la raíz del repo y concluía que estaba fuera del grafo. Su tabla
  de productos decía `sub: ""` para el Convertidor, cuando
  `ARQUITECTURA-ECOSISTEMA.md` ya documentaba *"`c:\convertidor` (app en
  `frontend/`)"*. **El dato estaba escrito y la herramienta no lo usaba.**

  **Lo que sí es cierto, y es peor:** el Convertidor **no tiene workflow de
  graphify**. Su grafo existe pero nadie lo reconstruye — la última corrida de
  Actions en ese repo es del 21-jul-2026. O sea que está en el grafo con el
  código de julio, lo cual es **peor que no estar**, porque parece cubierto.
  Ahora la guardia de frescura lo dice en cada corrida en vez de tragárselo.
  **Para cerrarlo:** copiarle el `graphify.yml` que ya tienen los otros nueve
  repos.

> **El check da candidatos, no duplicados.** Compara nombres. Dos cosas que se
> llaman igual pueden hacer cosas distintas (`Tag`), y algo que comparte el 90 %
> del dibujo puede tener el 10 % que importa (`Button` con `next/link`,
> `EstadoBadge` con su mapa de estados). **Su lista es el principio de la
> revisión, no su conclusión** — ver `AUDITORIA-CONDOMANAGER.md` 🔵-6, donde 3
> de 5 "duplicados" no lo eran.

### 29.3 · El design system tiene `Toast` pero no cómo dispararlo

`@sorsabsa/ui` exporta un componente `Toast`. **No exporta un provider ni un
`useToast()`**, así que no hay forma de decir "mostrá este aviso" desde una
pantalla. JustiRed conserva el sistema de shadcn (`toast.tsx`, `use-toast.ts`,
`toaster.tsx`, `sonner.tsx`) porque retirarlo lo dejaría **sin avisos**.

Es la misma forma exacta del problema que causó el desvío de JustiRed: el
producto no eligió duplicar, duplicó porque la pieza compartida no alcanzaba.
Y se repite ahora que ya se conoce el patrón — por eso queda escrito acá en vez
de resolverse a las apuradas.

**Para cerrarlo:** un `ToastProvider` + `useToast()` en `@sorsabsa/ui`, y
recién entonces migrar JustiRed. Antes de eso, cualquier retiro es un
retroceso. Es además la pieza que **más falta para terminar de sacar modales**:
buena parte de los `alert()` que quedan son avisos, y un aviso quiere un toast,
no una confirmación.

### 29.4 · La deuda que se retira se escribe (regla 6, parte II)

Cerrado en esta tanda, para no volver a auditarlo:

- **JustiRed: 48 → 7 componentes propios, cero duplicados.** Build de 39 s a
  10 s.
- **CondoManager: 9 → 7, cero duplicados.** `Tabla`, `PasswordInput` y la
  copia local de `ConfirmarAccion` borradas.
- **46 de 56 modales fuera de CondoManager**, en ocho tandas verificadas.
- **`@sorsabsa/ui` creció 5 versiones** (0.1.56 → 0.1.60): `Select`,
  `Checkbox`, `Tabs`, `ConfirmarAccion`, variante `outline`, `asChild`,
  `CardDescription`.
- **Los tres checks del ecosistema, corregidos** — ver 29.5.

### 29.5 · Los tres checks afirmaban cosas que no habían mirado (`diseno@68fbdc0`)

Esto salió al ir a escribir los números de las auditorías, y va acá porque es
la causa directa de que Gina dijera *"he perdido la confianza en la auditoría,
grep, grafo, GitHub Action"*.

| check | qué pasaba | estado |
|---|---|---|
| workflow *sin modales* | **nunca corrió**: clonaba por nombre de CARPETA local y DomusCRM en GitHub es `domuscrm`, no `crm_inmobiliario` | ✅ corregido |
| *conformidad* | leyó un grafo 69 s más viejo que el código y denunció 5 duplicaciones ya borradas | ✅ guardia de frescura |
| *modales* | contaba 2 modales en auth-sorsabsa que eran `<script>alert(1)</script>` dentro de una prueba de XSS | ✅ excluye pruebas |

**El del grafo es el grave, y no por las falsas alarmas.** En la dirección
contraria, entre que alguien introduce una duplicación y graphify publica el
grafo nuevo, el check decía *"sin desvíos"* mirando un grafo que todavía no la
contenía: **verde sin haber mirado el código actual**.

Ahora, antes de opinar de un producto, comprueba que **graphify ya haya corrido
sobre el último commit de código** de ese repo. Si no corrió, no comprueba: lo
dice y sigue.

**Costó dos intentos equivocados, y los dos valen como aviso:**

1. *Comparar `built_at_commit` contra la cabeza del repo.* Mal: graphify **no
   commitea nada cuando el grafo le sale igual**, así que ese campo se queda
   atrás en todo arreglo que no mueva símbolos —una cadena, un comentario, el
   cuerpo de una función—, que son la mayoría. Marcó como atrasados a
   agente24siete y pagos-sorsabsa teniendo los dos el grafo al día.
2. *Preguntar si graphify corrió en la cabeza.* Mal: graphify publica el grafo
   en un commit propio con `[skip ci]`, o sea que **no corre sobre su propio
   commit**. Como la cabeza de casi todos los repos ES ese commit, daba
   "atrasado" en cuatro de siete.

El ancla correcta es **el último commit que no sea de graphify**. Comprobado en
las dos direcciones: con los siete repos al día → comprueba los siete sin una
sola falsa alarma; con un commit que graphify no vio → se niega y nombra el
commit exacto.

> **La lección, que es más general que este check:** las dos versiones
> equivocadas eran *inferencias sobre el estado* ("si cambió el código, el grafo
> debe estar viejo"). La que funciona pregunta por **el hecho**: ¿corrió o no
> corrió? Regla 5 de la parte II de `ESTANDAR-DESARROLLO` —*lo que se declara no
> se deduce*— aplicada a una herramienta en vez de a un dato.

**Queda vivo un límite conocido:** el check de modales todavía marcaría un
`alert(` que aparezca dentro de una cadena en código de producción. Reconocer
cadenas de JavaScript a fuerza de expresión regular es justamente la cirugía
por regex que ya salió mal antes, así que se dejó anotado en vez de darlo por
cubierto.

### 29.6 · Cómo correr estas comprobaciones

```
npm run modales:local        # los 7 productos, desde disco
npm run conformidad:local    # duplicación contra el design system
```

En CI: workflow *sin modales* los lunes 07:00 Ecuador y en cada push que toque
el script o `ESTANDAR-UI.md`; *conformidad del ecosistema* con su propio
disparador. Los dos avisan por Resend y se ponen en rojo.

---

### 29.7 · Autoauditoría de esta tanda contra `ESTANDAR-DESARROLLO.md`

Gina pidió auditar **lo que hice hoy** con el mismo estándar con el que audito
el código ajeno. Esto es el resultado. Lo que sigue no son riesgos teóricos:
cada uno se verificó corriendo algo.

#### 🔴 A-1 — La guardia de frescura fallaba ABIERTA (pregunta 10)

**Síntoma.** Ninguno visible: por eso es grave.

**Causa raíz.** Al escribir la guardia le puse tres `return null` para los
casos "no pude averiguarlo" (sin token, API caída, repo no encontrado). En esa
función `null` significa **"el grafo sirve, seguí comprobando"**. O sea que
sin token el check volvía en silencio a su comportamiento viejo —afirmar sobre
un grafo sin verificar— **y salía verde**.

Es el *fallback peligroso* textual del estándar: *"si no existe configuración →
continuar"*. Y lo cometí **dentro del arreglo que existía para tapar ese mismo
defecto**. Mis propios comentarios decían *"no se inventa un veredicto"*
mientras el código inventaba uno.

**Corregido hoy.** Ahora esos caminos devuelven el motivo y el producto no se
comprueba. **Verificado con un token inválido a propósito:** tres productos
pasan a "no se pudo consultar", el check sale con 1 en vez de 0.

#### 🔴 A-2 — Verifiqué todo a mano (pregunta 17, reglas 1 a 3)

Comprobé las cinco salidas del check de modales, las dos direcciones de la
guardia y el commit vacío de prueba **escribiendo comandos en una terminal**.
Nada de eso quedó como prueba automática. La pregunta 17 —*¿qué prueba
fallaría si el defecto volviera mañana?*— tenía una sola respuesta honesta:
**ninguna**. Y "yo lo comprobé" es exactamente el *"alguien, alguna vez"* que
la regla 1 rechaza.

**Cerrado a medias.** Se agregó `src/scripts/ecosistema.test.ts`, que compara
la lista de productos contra la tabla del documento de arquitectura y **se
comprobó que puede fallar**: al poner a propósito `repo: "crm_inmobiliario"`
—el bug real del workflow— dos aserciones se rompen. La suite pasó de 22 a 32
pruebas.

**Sigue abierto:** las cinco salidas de `modales.mjs` y las tres de la guardia
de frescura **no tienen prueba automática**. Es la deuda más grande que deja
esta tanda.

#### 🟠 A-3 — La lista de productos vivía en cinco lugares (pregunta 6)

`ECOSISTEMA` en `conformidad.mjs`, la lista de clonado del workflow, las rutas
con que ese workflow invoca el script, y los dos `*:local` de `package.json`.
**Dos ya discrepaban** (`crm_inmobiliario` contra `crm_inmobiliario/webs`).

Y no es teórico: esa duplicación **es** la causa del workflow que nunca corrió.

**Corregido hoy:** `src/scripts/ecosistema.mjs` es la única lista; el workflow
y los scripts la consultan. De cinco copias quedó una, con una prueba que la
ata al documento.

#### 🟠 A-4 — El dato estaba en `ARQUITECTURA-ECOSISTEMA.md` y no lo abrí. Dos veces

Es el hallazgo de fondo, y lo señaló Gina, no yo:

1. Escribí el workflow clonando `crm_inmobiliario`. La tabla *"Carpeta local /
   Repo GitHub"* del documento ya decía `c:\crm_inmobiliario` → `domuscrm`,
   **con ⚠️ en esa misma fila**.
2. Concluí *"Convertidor: SIN GRAFO, fuera del grafo de conocimiento"*. El
   documento ya decía *"`c:\convertidor` (app en `frontend/`)"*, que es
   exactamente dónde está su grafo.

Las dos veces **redescubrí con `find` y `gh` lo que estaba escrito**, y una de
las dos terminó como un hallazgo falso en una auditoría. Gina: *"no entiendo
por qué te pierdes tanto"*.

**Corregido hoy:** el documento ganó la tabla *"Dónde vive el grafo de cada
repo, y qué lo regenera"* —los diez repos, verificados en disco— y la prueba
nueva impide que el código se aleje de ella en silencio.

#### 🟠 A-5 — El check de modales vive en el repo equivocado (regla 2)

Se dispara con los push a **diseno-sorsabsa** y los lunes. Un modal agregado a
CondoManager un martes **no se detecta hasta el lunes siguiente**: hasta 7 días.
La regla 2 pide que la comprobación esté conectada a algo que la ejecute — lo
está, pero a algo que no se entera de lo que vigila. **No corregido.** Lo
correcto es un workflow reutilizable que cada producto invoque en su propio
push.

#### 🟡 A-6 — Dije "el ecosistema" midiendo 7 de 11 repos (regla 4)

Afirmé *"18 modales en el ecosistema"* sin haber mirado `geo-sorsabsa`,
`notificaciones-sorsabsa`, `qa_sorsabsa` ni `Siniestros`. **Comprobado
después:** los tres primeros no tienen pantallas (0 y 1 `.tsx`), cero
coincidencias. El número aguanta — pero lo verifiqué **después de publicarlo**,
que es el orden equivocado.

#### 🟡 A-7 — Probé mutando el repo real de Gina (pregunta 11)

Para comprobar que la guardia se dispara creé un commit vacío en
`c:\agente24siete` y después lo revertí con `reset --hard`. Funcionó y el repo
quedó limpio (verificado), pero **la prueba de una herramienta no debería
tocar el repo de un producto**: lo correcto es un repo de mentira armado en
`/tmp`, como sí se hizo para las salidas del check de modales.

#### 🟡 A-8 — Dependencia nueva sin declarar (pregunta 13)

La guardia usa el CLI `gh` para conseguir un token cuando corre a mano. Es una
dependencia nueva del script hacia una herramienta externa que nadie declaró.
Hoy degrada bien (sin `gh` no comprueba y lo dice), pero está sin anotar.

#### Lo que sí cumplió

- **Preguntas 1-3:** los tres defectos se persiguieron hasta la causa raíz, no
  hasta el síntoma. En la guardia de frescura hicieron falta **dos intentos
  equivocados** antes de dar con la pregunta correcta, y los dos quedaron
  escritos en el código y acá.
- **Pregunta 15:** la tanda anterior retiró 46 modales y 50 componentes
  duplicados, todos anotados.
- **Regla 6:** esta sección existe.
- **Regla 4, en un caso:** al medir por segunda vez apareció que 5 de los 9
  desvíos eran fantasmas de un grafo viejo. *"Correr la medición dos veces"*
  evitó publicar cinco hallazgos falsos… y aun así se me escapó el sexto (el
  del Convertidor), que salió recién al arreglar A-3.

#### La lección, en una línea

**Las tres versiones equivocadas de hoy —el workflow, la guardia v1, la
guardia v2— tienen la misma forma: deduje en vez de leer.** Deduje el nombre
del repo del nombre de la carpeta, deduje la frescura del grafo de que hubiera
cambiado el código, deduje que el Convertidor no tenía grafo de no encontrarlo
donde yo suponía. Las tres veces **el dato estaba escrito en alguna parte**.
Es la regla 5 de la parte II —*lo que se declara no se deduce*— aplicada a
quien usa el estándar, no a quien escribe el código.

---

## 30. 🟡 Las cuatro comprobaciones que sí encuentran cosas — y el grafo, que no (23-ago-2026)

**Gina, al cabo de un día entero corrigiendo el grafo:** *"estoy harta de
corregir el grafo, no veo que ayude… ¿tú le ves valor?"*. La respuesta honesta
es **no**, y no es una opinión: está medida abajo.

### 30.1 · Por qué el grafo no se gana el puesto

| lo que encontró defectos reales hoy | cómo |
|---|---|
| el bypass de autenticación en 11 endpoints | construir una pantalla |
| el bucle de login | Gina usando el producto |
| 11 rutas desconectadas, 8 huecos reales | el check de **costura** — texto plano |
| 4 archivos de 0 bytes dados por "implementados" | el check de **huérfanos** — 0,26 s |
| los triggers de EcoInmobiliaria | leer código |
| 3 "duplicados" que no lo eran | leer código |

Y el grafo, en un solo día: **7 hallazgos falsos** — 5 `Card` fantasma de un
grafo viejo, el `Tag` de agente24siete, y "Convertidor sin grafo".

El problema no es que esté mal construido: **mide lo que no duele**. Sus
aristas son imports y contención; los defectos de este ecosistema viven en
HTTP, en SQL y entre repos, donde tiene **cero aristas** (medición completa en
`diseno-sorsabsa/docs/graphify-ci.md`).

**Decisión: no se borra, pero se deja de arreglar.** Ya se mantiene solo, 9 de
10 en verde, y no cuesta tiempo si nadie lo toca. Lo que costaba era tratar su
salida como hallazgos.

### 30.2 · Con qué se lo reemplaza

Cuatro comprobaciones, todas de texto plano, todas en segundos, todas en
`@sorsabsa/ui` y corriendo sobre los ocho repos:

| check | pregunta que responde | estado |
|---|---|---|
| `npm run modales:local` | ¿queda algún diálogo del navegador? | 18 vivos |
| `npm run conformidad:local` | ¿se duplica lo que el design system ya da? | 8 desvíos |
| `npm run costura` | ¿cada ruta de API tiene llamador, y cada llamada una ruta? | ver 30.3 |
| `npm run costura:ecosistema` | ¿las rutas que un producto le pide a un servicio existen? | 41 llamadas, 0 rotas |
| `npm run huerfanos:local` | ¿qué archivo no importa nadie? | 4 vivos |

**`costura:ecosistema` es la que atrapa el bug que nadie podía ver:**
agente24siete llamando a `${NOTIFICACIONES_API_URL}/api/marcar-todas` cuando la
ruta se llama `marcar-todas-leidas`. No es un import (el grafo no lo ve),
compila perfecto (`tsc` no lo ve) y vive en dos repos (ninguna comprobación de
un repo solo lo ve). Probada contra ese bug exacto en un ecosistema de mentira.

### 30.3 · Lo que queda por triar, y NO son defectos todavía

**Rutas sin llamador local**, del barrido de costura:

| producto | rutas | sin llamador |
|---|---|---|
| condomanager | 41 | 8 |
| domuscrm | 30 | 8 |
| auth-sorsabsa | 3 | 1 |
| convertidor · agente24siete | 31 | 0 |

De los 8 de CondoManager, **2 son crons declarados en `vercel.json`**
(verificado) y varios son webhooks. Hay que mirarlos uno por uno y declarar los
legítimos en el `costura.config.json` de cada producto, como ya se hizo en
agente24siete. **Presentarlos como huecos sin triar sería repetir el error de
decir el alcance sin contarlo.**

**Archivos que nadie importa**, del check de huérfanos:

- `condomanager/app/dev-tools/ColorPalette.tsx` — herramienta de desarrollo.
- `legaltech/src/components/ui/use-toast.ts` (85 bytes) — copia duplicada del
  de `src/hooks/`. Se borra sin más.
- `legaltech/src/hooks/use-mobile.tsx` — resto de shadcn.
- **`agente24siete/lib/vozTwilio.js`** — un cliente de SMS de Twilio, 31
  líneas, funcional y documentado en `docs/twilio.md`, que **ningún código
  importa**. No se borró a propósito: agente24siete no tiene canal (WhatsApp
  baneado, Twilio sin número, §15), así que esto puede ser un camino a medio
  construir y no basura. **Decisión de Gina:** conectarlo o retirarlo.

### 30.4 · Lo que falta del lado de las herramientas

- **Los checks corren desde diseno-sorsabsa, no desde cada producto.** Un modal
  agregado a CondoManager un martes no se ve hasta el lunes. Lo correcto es un
  workflow reutilizable que cada producto invoque en su propio push.
- **`costura` y `conformidad` no tienen prueba automática.** `huerfanos` sí
  (5, tres de ellas negativas) y `ecosistema` también. Es lo que queda del
  hallazgo A-2 de §29.7.
- **El Convertidor sigue sin `graphify.yml`** — y está en `master`, así que
  copiar el template no dispararía. Si se acepta 30.1, esto deja de importar.
