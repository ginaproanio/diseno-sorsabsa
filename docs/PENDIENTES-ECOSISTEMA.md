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

## 9. Auditar reuso de sistemas compartidos (graphify)

Correr graphify sobre el ecosistema (merge de repos) para ver con datos quién
reusa auth/pagos/notificaciones/design-system y quién reinventó — la
herramienta pensada para no seguir descubriendo drift repo por repo (como
pasó con R2 en el #12).

## 10. Login con Google (mejora, no bloquea nada)  🔵 apuntado 08-ago-2026

Agregar "Continuar con Google" a identity — ampliación del Paso 1 de
`PLAN-DESOLDADO.md`, no depende del Paso 3.

1. **Gina, Google Cloud Console:** OAuth Client, Redirect URI =
   `https://gyqgorgfstffbgazhbnb.supabase.co/auth/v1/callback` (de identity,
   uno solo para todo el ecosistema).
2. **Gina, Supabase Dashboard** → `sorsabsa-identity` → Sign In/Providers →
   Google: Client ID/Secret.
3. **Código:** botón en `auth-sorsabsa` `/oauth/consent` →
   `identityClient.auth.signInWithOAuth({provider: 'google'})`.

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

## 13. 🟡 geo-sorsabsa/service desplegado y verificado — falta repuntar consumidores

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
- ⏳ **Sin repuntar ningún consumidor.** Ni SorsabsaForensic ni `iot` llaman
  al servicio todavía — ambos siguen con su lógica inline. Deliberado: se
  hace con el servicio ya verificado en vivo, no antes.

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
