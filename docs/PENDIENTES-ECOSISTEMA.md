# Pendientes del ecosistema SORSABSA

Lista viva de lo que falta, en orden de prioridad. Se va anotando a medida que
aparece. Fuente de arquitectura: `ARQUITECTURA-ECOSISTEMA.md`.

Última actualización: 2026-07-29.

## Principio que gobierna (regla dura)

**Todo producto DEBE usar los sistemas compartidos del ecosistema** (SSO
auth-sorsabsa, pagos-sorsabsa, notificaciones-sorsabsa, design system). Reinventar
cualquiera de ellos = octuplicar código y mantenimiento. Antes de construir
"login propio", "cobro propio" o "notificaciones propias" en un producto, se
usa el compartido.

---

## 1. ✅ RESUELTO — separar auth a su propio proyecto (vía OIDC, no vía llave compartida)

**08-ago-2026: cerrado por el camino B de abajo, ejecutado en `PLAN-DESOLDADO.md`
Pasos 1 y 2 (ambos cerrados).** `sorsabsa-identity` es el emisor OIDC real;
cada producto lo registra como proveedor personalizado y valida su propio
token — sin compartir llave ni `kid`, como el muro de abajo ya anticipaba
que no se podía. Queda el historial de cómo se llegó ahí (útil para no
reabrir el camino A por error), pero **para el estado actual, ver
`PLAN-DESOLDADO.md` Pasos 1-2 — no este ítem.**

### Historial — INTENTADO 29-jul, chocó un muro real

Hoy `auth` (Supabase Auth) vive DENTRO del proyecto `condomanager`
(`twkuidnjwhopbjnrhnxp`). Si ese proyecto se borra, **se cae el login de TODO el
ecosistema.** (El riesgo de PÉRDIDA está cubierto por backups Pro + solo 4
usuarios basura: gina, puntablanca, eco.ec, andres-pa — NO migrarlos, los reales
se registran frescos.)

### Lo hecho el 29-jul

- ✅ Creado proyecto **`sorsabsa-identity`** = `gyqgorgfstffbgazhbnb` (+$10/mes,
  ACTIVE). **Aún NO está conectado a nada** — decidir si se usa o se borra.

### 🧱 EL MURO (verificado empíricamente — no volver a intentarlo a ciegas)

La idea era: identity firma los tokens, y condomanager confía en ellos SIN
refactor (browser-RLS sigue igual). **No se puede por llave asimétrica compartida:**

- Supabase **asigna el `kid` él mismo al importar una llave** y NO acepta un `kid`
  propio (import falla). Dos proyectos que importan la MISMA llave reciben **kids
  distintos**.
- La validación de Supabase es **estricta por kid**: token firmado con el kid de
  identity → condomanager responde **401 "No suitable key"** (probado minteando el
  token y golpeando `/rest/v1`). Sin kid coincidente, no valida.
- **Third-Party Auth NO sirve**: solo Firebase/Clerk/WorkOS/Auth0/Cognito, sin
  opción "Custom"/OIDC genérico para un Supabase→Supabase.

### Los dos caminos REALES (elegir con la usuaria)

- **A) Secreto HS256 compartido** entre los dos proyectos: esquiva el kid (HS256
  no usa kid), CondoManager NO se refactoriza, desuelda ya. **Pero** es el camino
  **deprecado** por Supabase → puente temporal, no "de raíz".
- **B) Verificación server-side** (patrón agente24siete: cada producto valida el
  token contra el JWKS de identity en su backend). **Correcto, escalable, sin
  deuda.** **Pero** exige refactorizar la capa de datos de CondoManager/DomusCRM
  (hoy browser-RLS) → trabajo real, sesión aparte.

### Estado y método

- **NADA roto:** auth-sorsabsa sigue apuntando a condomanager; solo se
  experimentó con llaves "standby" que se revirtieron. Login en vivo intacto.
- **Regla dura:** el próximo intento se **verifica en aislado** (mintear tokens de
  prueba + golpear las APIs) ANTES de tocar el dashboard en vivo. No más descubrir
  la mecánica sobre la marcha en producción.

### Lo verificado el 30-jul — ticket con Supabase y estado medido

📋 **EL PLAN, EN ORDEN, ESTÁ EN [`PLAN-DESOLDADO.md`](PLAN-DESOLDADO.md)** —
con el criterio de "hecho" de cada paso y lo que está decidido no hacer.
**Empezar por ahí.** El paso 0 (sacar el plano al repo) es bloqueante.

✅ **RESUELTO EL 31-jul-2026 — Supabase respondió y hay camino soportado.**
El muro de abajo sigue siendo cierto (no se puede compartir llave ni `kid`),
pero **sí se puede desoldar**: identity actúa como **issuer OIDC** y el producto
lo registra como **proveedor OIDC personalizado**, sin tocar el RLS de los tres
productos. La respuesta íntegra, la corrección de lo que creíamos sobre el
`kid`, y el plan por pasos están en
[`supabase-ticket-jwt-signing-keys.md`](supabase-ticket-jwt-signing-keys.md).
**Empezar por ahí.** ⛔ La llave revocada NO se puede liberar: bloqueada hasta el
28-ago-2026 y el soporte no puede saltarlo.

**Se abrió ticket con el soporte de Supabase** (atiende Gabriel). Sus logs de la
Management API confirman el muro con códigos exactos, y añaden un dato que no
teníamos:

- `POST /config/auth/signing-keys` → **201** (23:37:16Z): la llave importada
  SIN `kid` entra bien; Supabase le asigna `b156c393-…`.
- `POST` con el `kid` de identity forzado → **409** *"Failed to create new
  signing key in standby status for project"*, repetido de 23:55:13Z a
  00:09:03Z — **también después** de moverla a *previously used* (PATCH 200,
  23:54:30Z) y **después de revocarla** (PATCH 200, 23:57:05Z).
- `DELETE` → **422**: *"This signing key cannot be removed at this time. Try
  again after 2026-08-28T23:57:02.736Z"*. ⚠️ **Una llave revocada queda
  bloqueada 30 días.** Cada intento futuro deja residuo un mes: por eso el
  próximo test va contra `sorsabsa-identity` (vacío), NO contra el proyecto que
  sirve el login.

❓ **Hipótesis, no dato:** que el 409 lo cause el `kid`. No se probó importar una
llave con material NUEVO forzando `kid`, ni reimportar el mismo material sin
`kid`. Podría ser material duplicado o una restricción temporal. Preguntado al
soporte; hasta que respondan, no afirmarlo.

**Estado medido el 30-jul (no recordado):**

- JWKS de `condomanager`: **una sola llave**, `9e498800-…`, la de siempre. La
  `b156c393` no aparece (revocada = fuera del JWKS). **Nada se desalineó**: el
  material de firma quedó como estaba.
- JWKS de `sorsabsa-identity`: dos llaves (`36d36a4a-…`, `3bb19761-…`).
- Usuarios: **4 en condomanager, 0 en identity**. La migración nunca empezó.
- API de condomanager, 24 h: **cero 401**. La llave `anon` legacy sigue activa
  (`disabled: false`) → ninguna app perdió credencial.
- ⚠️ **El login no está probado, solo no falla:** el último inicio de sesión real
  fue el **23-jul**. "No hay errores" ≠ "funciona".
- `auth.sorsabsa.com` pide el JWKS **de condomanager** (log de auth, 00:39Z).
  Esa es la soldadura, visible en vivo.

**Third-Party Auth — reconfirmado en la documentación oficial el 30-jul:** solo
Clerk, Firebase Auth, Auth0, AWS Cognito y WorkOS. No hay OIDC genérico ni
"Custom", así que **no hay Supabase→Supabase**. Además, la documentación de Clerk
describe el patrón deprecado usando *"a configurable JWT secret"* — señal de que
el camino A (HS256) existe, con los motivos de su deprecación escritos por
Supabase: compartir el secreto con un tercero es mala práctica y rotarlo provoca
caída. Sigue **sin verificar** si hoy se puede FIJAR ese secreto a un valor dado
en dos proyectos.

## 2. ✅ HECHO — JustiRed al SSO central

**Hecho (29-jul-2026):** JustiRed se unificó al proyecto central
`twkuidnjwhopbjnrhnxp` como schema `justired` (mismo patrón que domus). El
frontend ya redirige al SSO (login propio eliminado) y apunta al central con
`db.schema='justired'`. Se descubrió que jywrjk estaba **vacío** (0 filas, 0
usuarios) y que las edge functions de notif/pago **ya eran proxies correctos** a
los compartidos — no reimplementaban nada. Se recrearon en el central: schema +
bucket `justired-legal-documents` (con RLS, el origen la tenía apagada), 4 edge
functions proxy (3 notif → notificaciones-sorsabsa, 1 pago → pagos-sorsabsa) +
`ingesta-legal`. Frontend redesplegado en Vercel apuntando al central → **el
login SSO ya funciona.** Proyecto `jywrjk` dado de baja (vacío, borrado del
dashboard).

**Cerrado 08-ago-2026 — los 2 pasos manuales que faltaban, hechos por Gina y
verificados con peticiones reales (no por el check del dashboard):**

1. **Schema `justired` expuesto** en Settings → API → Exposed schemas.
   Verificado: `GET /rest/v1/leyes` con `Accept-Profile: justired` → `200`
   con datos reales; sin ese header → `404` (correcto, no existe en `public`).
2. **Los 5 secrets de Edge Functions cargados.** Verificado sin tocar datos
   reales (cada función revisa el secret ANTES de cualquier efecto):
   - `INGESTA_LEGAL_TOKEN`: `500 not configured` → `401 Unauthorized`.
   - `NOTIFICACIONES_API_URL`/`KEY`: pasó el chequeo de "no configurado" →
     `401 token inválido` (esperado, se probó con la anon key, no una sesión
     real).
   - `PAGOS_API_URL`/`PAGOS_API_KEY_JUSTIRED`: pasó el chequeo de "no
     configurado" → `400 faltan campos`.

**Nota para cuando se retome la biblioteca legal:** `scraper/scraper.py`
(legaltech) escribe HOY directo con `SUPABASE_SERVICE_ROLE_KEY` al schema
`justired` — **no llama a `ingesta-legal` ni usa `INGESTA_LEGAL_TOKEN`**.
Repuntar el scraper a la edge function es trabajo aparte, sin empezar, sin
urgencia (JustiRed no está lanzado). Hasta entonces, `INGESTA_LEGAL_TOKEN`
no necesita coincidir con nada en Railway — no tiene consumidor todavía.

## 3. ✅ HECHO — cutover de pagos (fuera de Vercel)

pagos-sorsabsa corre en Railway (SORSABSA-DATA), verificado. Los 3 llamadores
(agente24siete, condomanager, domuscrm) repuntados a
`https://pagos-sorsabsa-production.up.railway.app`. Variable estandarizada a
**`PAGOS_API_URL`** en todos (antes agente24siete usaba `PAGOS_SERVICE_URL`;
condo/domus ya usaban `PAGOS_API_URL`). Proyecto pagos-sorsabsa borrado de Vercel.

## 4. ✅ HECHO — notificaciones-sorsabsa → Railway

Mismo patrón que pagos. Corre en Railway, verificado (POST /api/listar → 200).
Llamadores (condomanager, domuscrm) repuntados a
`https://notificaciones-sorsabsa-production.up.railway.app` con `NOTIFICACIONES_API_URL`.
Proyecto borrado de Vercel. (agente24siete todavía no llama a notificaciones —
está en su TODO `alertarAdmin()`.)

## 4-bis. Limpieza menor en agente24siete

Al estandarizar, el fix quedó también en la rama `auditoria/ciclo-operativo`
(commit duplicado 4bc591b) y hay un `git stash` sin aplicar en esa rama. main
quedó correcto y desplegado. Revisar/limpiar la rama y el stash cuando se retome
ese repo. El repo quedó con `main` checked out.

## 5. ✅ HECHO — RLS activado en las 4 tablas expuestas (seguridad)

`public.unidad_fotos`/`domus.invitations` (`twkuidnjwhopbjnrhnxp`) y
`public.planes`/`public.movimientos_saldo` (`nwcqaginlnzjlkgwifas`, con datos
reales detrás: 50 `conversaciones`, 4 `negocios`, 1 usuario) tenían RLS
DESACTIVADO — cualquiera con la anon key leía/escribía todo.

**Cerrado 08-ago-2026, con la regla de negocio de Gina y aplicado en vivo vía
Supabase MCP** (no solo escrito — `apply_migration` real, verificado después
con `get_advisors`: las 4 tablas ya no aparecen en el listado de RLS
desactivado):

- `unidad_fotos`: el residente sube/ve las fotos de su propia unidad; el
  admin del condominio solo ve (no sube — eso es `asociaciones.logo`,
  aparte). Migración: `condomanager` commit `ad7cb10`.
- `domus.invitations`: el admin que envió la invitación la ve (para saber
  cuáles quedan pendientes); solo el invitado ve la suya, por su email.
  Verificado con dato real que `domus.users.id = auth.users.id` antes de
  escribir la política. Migración: `domuscrm` commit `8ccce4d`.
- `planes`: catálogo público de solo lectura (para decidir si contratan).
  `movimientos_saldo`: solo el dueño de su propio negocio. Migración:
  `agente24siete` commit `28d1981`.

**Hallazgo aparte, sin resolver — ver pendiente #12:** revisando
`unidad_fotos` apareció que la subida de fotos va a Supabase Storage
(`condomanager-inmuebles`), no a R2 como dice `ARQUITECTURA-ECOSISTEMA.md`.

## 6. ✅ HECHO — proyecto Supabase huérfano borrado

`sorsabsa_ecosystem` (`tkkpqbelzwoenmeynjvw`) — verificado 08-ago-2026 con
`list_projects` real: ya no aparece. Los 3 proyectos del org `SORSABSA_Corp`
son `condomanager`, `sorsabsa-identity`, `agente24siete`.

## 7. SorsabsaForensic → Fase 0 antes de Railway

Es PyQt5 (app de escritorio), no un servicio. Antes de Railway: poblar
`core/orchestrator.py` (vacío), sacar el renderizador de informe fuera de Qt,
quitar rutas absolutas, Dockerfile. Ver `PLAN_MATERIALIZACION.md` §2.

## 8. Probar CondoManager end-to-end (Punta Blanca)  🔴 SIGUIENTE — 08-ago-2026

Nunca se verificó el flujo real: admin entra, crea condominio, carga residentes,
emite alícuota, residente paga. El doc de arquitectura §6 lo marca sin probar.
Esto es lo que convierte "plomería lista" en "producto que funciona para un
cliente".

**Se vuelve bloqueante para el Paso 3 de `PLAN-DESOLDADO.md`** (cada producto
a su propio proyecto): Gina decidió no separar hasta probar esto — separar
cuesta $20/mes reales y no hay apuro (`public`/`domus` sin filas operativas
hoy), así que mejor encontrar bugs de producto en el entorno ya estable que
mezclados con una migración recién hecha.

## 9. Auditar reuso de sistemas compartidos (graphify)

Correr graphify sobre el ecosistema (merge de repos) para ver quién reusa
auth/pagos/notificaciones/design-system y quién reinventó. Sostiene el principio
de arriba con datos.

## 10. Login con Google (mejora, no bloquea nada)  🔵 apuntado 08-ago-2026

Agregar "Continuar con Google" como segundo método de acceso. Es una
ampliación del Paso 1 de `PLAN-DESOLDADO.md` (identity ya es el emisor real
con email/contraseña) — no depende del Paso 3 ni lo bloquea, se puede hacer
en cualquier momento.

Pasos:

1. **Gina, en Google Cloud Console:** crear OAuth Client ("Web application"),
   Redirect URI = `https://gyqgorgfstffbgazhbnb.supabase.co/auth/v1/callback`
   (el de **identity**, uno solo para todo el ecosistema — no por producto).
2. **Gina, en Supabase Dashboard** → proyecto `sorsabsa-identity` →
   Authentication → Sign In/Providers → Google: cargar Client ID/Secret.
3. **Código:** botón "Continuar con Google" en `auth-sorsabsa`
   `/oauth/consent` (la única pantalla real de credenciales) →
   `identityClient.auth.signInWithOAuth({provider: 'google'})`, mismo patrón
   que ya usa `/auth/login` para federarse contra identity.

## 11. agente24siete: /portal sin login real + cascarón viejo sin borrar  🟡 08-ago-2026

Al re-verificar "un solo portero" (Paso 2 de `PLAN-DESOLDADO.md`) más allá de
los 3 productos nombrados ahí, agente24siete quedó afuera del criterio
original aunque vive en el mismo proyecto consolidado. Revisado con el mismo
rigor — dos hallazgos, uno limpiado y uno pendiente de decidir:

- ✅ **`/admin` — confirmado, mismo portero.** `LoginGate.tsx` →
  `auth.sorsabsa.com/auth/login?app=agente24siete`, igual que los otros tres.
- ✅ **Limpiado:** el login local muerto que la migración de Fase 3 (16-jul)
  dejó sin desenchufar — `pages/api/admin/login.js` y
  `pages/api/admin/cambiar-password.js` (borrados, commit `447b1bb` en
  `agente24siete`).
- 🟡 **`/portal` (panel de CLIENTE) no tiene login real.** Es un placeholder:
  pide pegar a mano un access token de Supabase. El backend sí valida bien
  (JWKS) — no es una brecha, solo que nunca se construyó el flujo. Falta el
  mismo `LoginGate.tsx` que ya tiene `/admin`.
- 🟡 **Sin decidir:** `pages/api/admin/index.js` y `pages/api/portal/index.js`
  — la versión completa PRE-Fase-3 de ambos paneles (HTML+JS autocontenido,
  ~950 y ~600 líneas), todavía servida en `/api/admin` y `/api/portal`. Ya
  está efectivamente muerta (su login apuntaba a los dos archivos borrados
  arriba, y usa una clave de `localStorage` distinta a la del panel nuevo),
  pero es 10 veces más código que la limpieza ya hecha — se dejó sin tocar
  hasta que Gina decida. Ver `agente24siete/README.md` y `todo.md` (Fase 3).

## 12. 🟡 Código listo — falta el bucket/credenciales reales de R2

`ARQUITECTURA-ECOSISTEMA.md` dice R2 = objetos, y el patrón ya estaba probado
(`legaltech/scraper/r2.py`, JustiRed) — CondoManager nunca se alineó:
`mis-unidades/page.tsx` subía directo a
`supabase.storage.from('condomanager-inmuebles')`.

**Código corregido 08-ago-2026 (`condomanager` commit `232111e`)**, reusando
el MISMO patrón que ya existe en TypeScript
(`crm_inmobiliario/backend/src/lib/storage.ts`: URLs prefirmadas, el archivo
va del navegador directo a R2) en vez de inventar uno nuevo — y los mismos
nombres de variable `S3_*` de ese repo, para no sumar una tercera
convención. `next build` compila limpio, las 2 rutas nuevas registradas.

**Falta lo que solo se hace en Cloudflare (Gina):**

1. R2 → crear el bucket `condomanager-inmuebles` (o el nombre que prefiera).
2. Crear un token de API de R2 con acceso a ese bucket → da Account ID,
   Access Key ID, Secret Access Key.
3. Habilitar acceso público al bucket (dominio público r2.dev, o un dominio
   propio) → esa URL es `S3_PUBLIC_BASE_URL`.
4. Cargar en Vercel (proyecto `condomanager`) y en `.env.local`:
   `S3_ENDPOINT` (`https://<account_id>.r2.cloudflarestorage.com`),
   `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
   `S3_PUBLIC_BASE_URL`.

**No probado de punta a punta** — sin credenciales reales no hay forma de
probarlo con una petición real, y no se prueba con "se ve bien" en pantalla.

---

## Hecho (para no re-hacer)

- ✅ pagos + notificaciones: **datos** migrados a Railway (SORSABSA-DATA).
- ✅ pagos-sorsabsa: **código** corriendo en Railway, verificado end-to-end.
- ✅ Convertidor backend, IoT: en Railway.
- ✅ Expedientes forenses (1.5 GB, 2296 archivos) respaldados en R2 privado, íntegros.
- ✅ Supabase Pro activado → núcleo `condomanager` encendido y sin pausarse.
