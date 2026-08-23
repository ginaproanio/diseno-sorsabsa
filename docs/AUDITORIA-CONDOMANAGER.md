# Auditoría — CondoManager como aplicación (más allá del portero)

**Abierta:** 09-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo de
esta lista se corrige sin presentar antes el análisis de 9 puntos (síntoma,
causa inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Por qué existe este doc separado de [AUDITORIA-PORTERO-SSO.md](./AUDITORIA-PORTERO-SSO.md):**
ese documento audita la federación de identidad (SSO) entre productos.
09-ago-2026, Gina pidió explícitamente ampliar el alcance: *"necesito
auditar condomanager como tal ya no solo el portero"* — la preocupación es
deuda acumulada en el producto mismo, no solo en el punto de entrada.

**Estado de esta auditoría:** ABIERTA.

**22-ago-2026 — segunda pasada, sobre la costura interfaz ↔ API.** Se revisaron
las **nueve** rutas de `app/api/**` que ninguna pantalla llama con un `fetch`,
una por una y con evidencia, para separar "externa por diseño" de "huérfana":

| ruta | quién la llama | dónde consta |
|---|---|---|
| `cron/limpiar-no-confirmados` · `cron/procesar-activaciones-masivas` | Vercel Cron | `vercel.json` |
| `onboarding/residente-registrado` | el registro de residente | `app/api/registro-residente/route.ts:178` |
| `pagos/confirmar` | PayPhone | es el `responseUrl` que se le envía |
| `pagos/consultar/[id]` | consulta de estado | `docs/PAGOS-ARQUITECTURA.md` |
| `pagos/reversar/[id]` | nadie, **declarado placeholder** | su cabecera y el ROADMAP |
| `webhooks/pagos-sorsabsa` · `webhooks/vencimiento` | pagos-sorsabsa | tabla `pagos.productos` |
| `facturacion/[id]/pdf` · `/ver` | la pantalla de comprobantes | `<a href>` + `next.config.ts` |

**Ninguna ruta huérfana.** El único hueco de esta pasada no era una ruta sino
una función que nadie llamaba: 🔴-4, la publicación en EcoInmobiliaria.

**Alcance cubierto en esta primera pasada:** las 35 rutas de
`app/api/**/route.ts`, `middleware.ts`, `lib/auth/post-login.ts`,
`lib/modulos/entitlement.ts`, `lib/crypto.ts`, `app/api/webhooks/*`,
búsqueda de patrones de riesgo (hardcode, bypass, fallback peligroso,
secretos embebidos) en todo `*.ts`/`*.tsx`.

**09-ago-2026, segunda pasada acotada a propósito:** Gina pidió
específicamente *"cómo interactúa el portero con esto: pagos/facturación,
RLS, crons — solo hasta ahí la auditoría"* antes de pasar a validación
manual. No es una auditoría completa de esos 3 subsistemas — es
específicamente el punto de contacto entre la sesión post-portero
(`auth.getUser()`, `perfiles.user_id`, RLS) y cada uno. Cubierto: RLS real
de `perfiles`/`residentes` vía `pg_policies` (antes solo se infería del
código), GRANTs reales de las tablas creadas hoy vía `pg_class.relacl`
(antes no se habían mirado), los 2 crons completos, y el patrón de
autenticación de `pagos/iniciar`, `pagos/confirmar`, `pagos/consultar`.

**NO cubierto todavía — no asumir que está limpio:** lógica de negocio
completa (montos, cálculos, reglas de facturación en sí) de `lib/pagos/*`
y `lib/facturacion/service.ts`, RLS de tablas fuera de
`perfiles`/`residentes`, y `lib/domuscrm-sync.ts`.

**09-ago-2026, aclarado a pedido directo de Gina — "¿fue auditada la
UI?":** No. Las ~150 páginas de `app/(dashboard)/**` NUNCA estuvieron en
el alcance de esta auditoría — el barrido buscó hardcodes/bypasses/RLS
mal conectado en rutas de servidor, no reglas de negocio mal puestas en
un formulario de cliente. Todo lo de 🔵-2 y 🔵-3 lo encontró Gina
usando la app, no un barrido de código. Confirmado que el patrón se
repite: el mismo defecto de `unidades` (obligatorio en pantalla, opcional
en la base, validación copiada en 3 pantallas que llaman a Supabase
directo sin pasar por ninguna API) se verificó también en `residentes`
(mismos 3 archivos: `nuevo`, `importar`, `[id]/editar`) — ver 🔵-3.
**No se puede afirmar que no haya más casos así** sin un barrido real de
la UI, todavía no hecho.

Leyenda de estado: ⬜ pendiente · 🔧 en análisis (9 puntos presentados, sin
código tocado) · ✅ corregido y verificado · ❌ descartado (no era un
problema real, con motivo).

---

## 🔴 CRÍTICO

### 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026

**1. Síntoma:** encontrado auditando "¿cómo interactúa el portero con RLS?".
Al verificar en vivo (no inferir del código) si `service_role` podía leer
`registros_pendientes` — la tabla de la que depende `reconciliar-perfil`
(el paso post-portero que crea el `perfil` del admin) — Postgres devolvía
`permission denied for table registros_pendientes`.

**2. Causa inmediata:** la tabla no tenía NINGÚN grant — ni siquiera para
`service_role` — y RLS estaba deshabilitado. `pg_class.relacl` mostraba
`null` (sin ACL) contra el `condominios=arwdDxtm/postgres,anon=...,
authenticated=...,service_role=...` que sí tiene cada tabla normal del
schema.

**3. Causa raíz, confirmada con SQL:** `select * from pg_default_acl where
defaclnamespace='public'::regnamespace` devuelve vacío — este proyecto NO
tiene `ALTER DEFAULT PRIVILEGES` configurado en `public`. Cada tabla nueva
necesita su propio `GRANT` explícito en su propia migración; si la
migración no lo incluye, la tabla queda invisible incluso para
`service_role` (que bypasea RLS pero sigue necesitando el GRANT — son dos
mecanismos independientes). Las migraciones de hoy
(`20260809160000_registros_pendientes.sql`,
`20260809140000_activacion_residentes.sql`) no lo incluyeron — yo no lo
incluí. Mismo patrón exacto en las dos, por la misma razón: no sabía que
este proyecto no tiene default privileges.

**4. Componente responsable:** cualquier migración que cree una tabla
nueva en este proyecto — debe incluir su propio `GRANT`.

**5. Código/impacto afectado — esto es lo grave:** con
`registros_pendientes` inaccesible, **todo alta de `admin_condominio`
desde que se aplicó esa migración fallaba** en el paso 2.1 de
`app/api/registro-admin/route.ts` (el insert a `registros_pendientes`),
disparando el rollback completo (borra el condominio y el usuario de
identity) y devolviendo 500. Registro de admin estuvo roto en producción
todo ese tiempo. Con `campanas_masivas` en el mismo estado,
`app/api/admin/activar-residentes-masivo/route.ts` también estaba roto —
la función construida hoy mismo para el caso de uso real de Punta Blanca.

**6. Fix aplicado:**

```sql
GRANT ALL ON public.registros_pendientes TO anon, authenticated, service_role;
GRANT ALL ON public.campanas_masivas TO anon, authenticated, service_role;
ALTER TABLE public.registros_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_masivas ENABLE ROW LEVEL SECURITY;
```

Sin policies para `anon`/`authenticated` a propósito — mismo patrón que el
resto del schema (grant + RLS), y ambas tablas solo las toca código
server-side con `supabaseAdmin`.

**7. Código que debe eliminarse:** ninguno.

**8. Riesgo de regresión:** ninguno — la tabla estaba completamente
inutilizable antes; el fix solo la habilita.

**9. Validación — hecha en vivo, no solo aplicada:**

- `set local role service_role; select count(*) from registros_pendientes;`
  → antes: `permission denied`. Después: `0` (sin error).
- Insert real transaccional como `service_role` (con `rollback` al final,
  sin dejar datos): confirmado que ahora puede escribir.
- Insert como `anon`: `42501 row-level security policy` — confirma que
  quedó bloqueado por RLS (no por falta de grant, que sería un error
  distinto) — el diseño "grant + RLS deniega" funciona como se esperaba.
- Mismas 3 pruebas repetidas para `campanas_masivas` — mismo resultado.
- `get_advisors(security)` después del fix: ambas tablas aparecen como
  "RLS enabled, no policies" (INFO, no error) — es el estado esperado, no
  un hallazgo nuevo.

**No se necesitó reparar datos** — el rollback de `registro-admin` ya
hacía su trabajo (borraba el condominio y el usuario de identity en cada
intento fallido), así que no quedó ningún condominio a medio crear.

**Validación real de punta a punta — hecha 09-ago-2026, por Gina:**
"solicitar demo" → registro de admin_condominio → confirmar correo →
login como admin → login como superadmin. Los 4 pasos funcionaron. Esto
cierra la validación en vivo que había quedado pendiente para 🔴-3 (y de
paso confirma el incidente de `resolve_condominio_for_user` — ver
`PLAN-MULTI-CONDOMINIO.md` — quedó resuelto: sin esa función, el login
fallaba en el chequeo de suscripción del portero).

---

## Resto de la pasada "portero × pagos/facturación/RLS/crons"

**RLS de `perfiles`/`residentes` — verificado en vivo, CORRECTO, sin
hallazgo.** `perfiles_select`/`perfiles_write`/`residentes_select`/
`residentes_write` usan `user_id = auth.uid()` y las funciones
`current_rol()`/`current_condominio_id()`/`current_residente_id()`/
`is_superadmin()` — exactamente el modelo post-🔴-1: `auth.uid()` es el id
LOCAL federado de este proyecto, que es lo que `perfiles.user_id` guarda.
No es una inferencia del código — se leyó `pg_policies` directo.

**Crons × portero:**

- `procesar-activaciones-masivas` — CORRECTO. Crea las cuentas de
  activación con `supabaseAdminIdentity` (identity), no con el proyecto de
  producto — mismo patrón que `registro-admin`.
- `limpiar-no-confirmados` — ✅ **RESUELTO** (`condomanager@0d961cc`).
  Usaba `supabaseAdmin.auth.admin.listUsers()` del proyecto de PRODUCTO;
  desde 🔴-1 las cuentas nuevas sin confirmar nacen en IDENTITY, así que
  era un no-op para toda cuenta nueva desde entonces (el email que un bot
  usaba quedaba ocupado en identity para siempre, sin liberarse nunca).
  Reescrito para escanear IDENTITY y emparejar por **email** (no por id de
  producto, que ya no existe para altas nuevas) contra
  `registros_pendientes`/`residentes.rol_pendiente`. Cuidado explícito con
  la frontera entre productos: identity es compartida con DomusCRM y
  JustiRed — un candidato sin ningún rastro en las tablas de CondoManager
  no se toca (podría ser un pendiente de otro producto; limpiarlo no es
  responsabilidad de este cron). Caso nuevo cubierto: una persona con
  residente en más de un condominio (uno pendiente-basura, otro real de
  censo) con el mismo email — la cuenta de identity solo se borra si
  ninguna fila real sigue esperándola. Verificado con datos de prueba
  transaccionales (rollback, sin dejar datos) para los 3 casos: admin
  pendiente, residente solo pendiente, y el caso mixto.

**Pagos/facturación × portero:** mecanismo CORRECTO (`auth.getUser()` →
`perfiles.select(rol)`, igual que el resto) en `pagos/iniciar` y
`pagos/consultar/[id]`. `pagos/confirmar` es el webhook de PayPhone —
correctamente NO usa sesión de usuario, reconfirma contra PayPhone como
fuente de verdad. `pagos/iniciar` y `pagos/consultar/[id]` migrados a
`requireRole()`/`getPerfilAutenticado()` — ✅ **RESUELTO**
(`condomanager@940e095`).

**Menor, pre-existente, no de hoy — ✅ RESUELTO** (`condomanager@12d3a84`):
`get_advisors` marcaba `current_rol()`, `current_condominio_id()`,
`current_residente_id()`, `is_modulo_activo()` e `is_superadmin()` como
`SECURITY DEFINER` ejecutables vía RPC por `anon`. Investigado (no se dejó
sin mirar): 4 de las 5 eran inofensivas para `anon` (`auth.uid()` es
`NULL` sin sesión, no matchean nada), pero `is_modulo_activo()` SÍ era
explotable — no depende de `auth.uid()` en absoluto, cualquiera con la
anon key (pública) podía pasar un `condominio_id` arbitrario y aprender
qué módulos pagos tiene activo cualquier condominio. `REVOKE EXECUTE ...
FROM anon` solo no bastó (seguían abiertas vía `PUBLIC`); revocado también
de `PUBLIC`. Verificado en vivo: `anon` bloqueado, `authenticated` sigue
funcionando sin cambios.

---

### 🔴-4 — ❌ HALLAZGO EQUIVOCADO. Retirado el 23-ago-2026 (`condomanager@460a13d`) — la integración NUNCA estuvo muerta: vive en triggers de Postgres. Lo que se encontró era una segunda implementación en desuso

> **Leer esto antes que nada.** El análisis de abajo llegó a una conclusión
> falsa y produjo código que hubo que retirar. Se conserva entero, sin
> maquillar, porque el modo de fallo es el hallazgo de verdad.
>
> **Lo cierto:** `lib/domuscrm-sync.ts` era código muerto — el grafo lo
> confirmó con cero llamadores, y la búsqueda de texto también.
>
> **Lo falso:** que por eso la integración no funcionara. La publicación la
> hacen `trg_sync_domuscrm` (sobre `unidades`) y `trg_sync_fotos_domuscrm`
> (sobre `unidad_fotos`), habilitados, con `pg_net` instalado y la clave en el
> **vault de Supabase** desde el 9-jul-2026. Nunca había publicado nada por un
> motivo trivial: la única unidad de la base está en BALDIO y el trigger no
> dispara.
>
> **El daño.** Se construyó un endpoint, un avisador y tres enganches que
> duplicaban lo que la base ya hacía —y peor que la base, que además desactiva
> el aviso cuando la unidad sale del mercado—. Y creyendo que el canal no tenía
> tráfico, se le dijo a Gina que rotar la clave era seguro: **eso sí rompió el
> mecanismo que funcionaba**, hasta que ella actualizó el vault.
>
> **Por qué se escapó, que es lo único que sirve de esto.** Una regla de
> negocio que vive en la base de datos es **invisible** para todo lo que usamos
> para entender un repo: el grafo mapea código, `grep` busca en archivos, las
> auditorías leen fuentes. Ninguna mira triggers. Y no estaba documentada en
> ningún lado — se verificó buscando en `condomanager/docs` y en
> `diseno-sorsabsa/docs`. El archivo `supabase/migrations/00000000000000_baseline_schema.sql`
> sí tenía la función, en el repo, y no se leyó.
>
> Ahora está escrito: [`condomanager/docs/INTEGRACION-ECOINMOBILIARIA.md`].
>
> **Lo que del fix se quedó, porque era real:** los cinco tipos de unidad
> nuevos (`lib/tipos-unidad.ts`, 🟠 más abajo) y el mapeo
> `tipo_unidad_a_domuscrm()` en Postgres — el trigger usaba `ELSE 'commercial'`
> y habría publicado un departamento como local comercial.

---

<details>
<summary>Análisis original, equivocado — se conserva como registro</summary>

### 🔴-4 (versión original) — La integración con EcoInmobiliaria estaba construida de los dos lados y nadie llamaba al emisor

**1. Síntoma.** Ninguno visible, y ese es el problema: la interfaz decía que
funcionaba. La pantalla de importación masiva dice, textual, *"la unidad se
publica automáticamente en EcoInmobiliaria (DomusCRM)"*, y la de editar unidad
titula su sección *"Comercialización (sincroniza con EcoInmobiliaria vía
DomusCRM)"*. Un dueño ponía su casa en venta con su precio y **del otro lado no
llegaba nada**, sin un error, sin un aviso, sin nada raro en pantalla.

**2. Causa inmediata.** `lib/domuscrm-sync.ts` existe desde hace meses,
completo y bien escrito —reintentos con backoff exponencial, tenant forzado a
`ecoinmobiliaria`, idempotencia por `externalId`, timeout, distinción entre 4xx
y 5xx—. Su punto de entrada, `onPropertyStatusChange()`, **no lo llamaba
nadie**.

Verificado con dos fuentes independientes, porque una sola no alcanzaba:

- el grafo de conocimiento: `onPropertyStatusChange` con **cero** aristas
  entrantes, y `syncPropertyToDomusCRM` con una sola, la del propio
  `onPropertyStatusChange`;
- búsqueda de texto: esas dos funciones aparecen **únicamente dentro de su
  propio archivo**.

**3. Causa raíz.** La integración se escribió como una biblioteca —con su
docblock diciendo *"Uso (tras el UPDATE del estado en la base)"*— y ese "uso"
nunca se escribió. Es exactamente la regla 1 de la parte II de
`ESTANDAR-DESARROLLO.md`: *código que no se puede ejecutar no existe*, y su
corolario, que el disparador tiene que llegar **en el mismo commit**.

Y había una razón técnica que lo volvía menos obvio, no un olvido tonto: las
**tres** pantallas que cambian el estado de una unidad —la del dueño
(`panel/residente/mis-unidades`), la del administrador
(`panel/admin/unidades/[id]/editar`) y la importación masiva— escriben directo
a Supabase **desde el navegador**. El emisor necesita `DOMUSCRM_WEBHOOK_KEY`,
un secreto que no puede viajar ahí. O sea que llamar a la función desde donde
ocurre el cambio era imposible, y hacía falta una pieza que no existía.

**4. Componente responsable.** Faltaba un punto de entrada del lado del
servidor. No era un `import` olvidado.

**5. Código afectado:** las tres pantallas citadas, más lo nuevo.

**6. Fix aplicado.**

- `app/api/unidades/[id]/sincronizar/route.ts`: recibe **solo el id**. Todo lo
  demás lo lee del servidor con la sesión de quien llama, así que **RLS es la
  autorización** — si esa persona no puede leer la unidad, no puede publicarla,
  y no hay una regla de permisos nueva corriendo en paralelo. Aceptar el precio
  o el título en el cuerpo habría dejado publicar inmuebles inventados, o al
  precio que quisiera cualquiera con sesión, en el portal de una empresa
  aliada.
- `lib/publicar-unidad.ts`: un solo avisador para las tres pantallas. Si cada
  una armara su propio `fetch`, la próxima lo olvidaría — que es literalmente
  cómo esto quedó sin llamar desde el principio.
- La regla de **cuándo** publicar sigue en `shouldSyncStatus`, una sola
  definición. Las pantallas solo dicen *"esta unidad cambió"*; el servidor
  decide.
- **Sin precio no se publica**, y no se inventa uno por defecto: eso sería
  convertir "no configurado" en "válido", y un inmueble sin precio en el portal
  de la aliada es peor que no estar.

**7. Código que debe eliminarse:** ninguno. `domuscrm-sync.ts` estaba bien; lo
que faltaba era quien lo llamara.

**8. Riesgo de regresión:** bajo. El aviso va **después** del guardado y sin
bloquearlo: si EcoInmobiliaria o DomusCRM están caídos, la unidad se guarda
igual y el dueño no se entera de un problema ajeno. `tsc` y `next build`
limpios.

**9. Validación.**

- ✅ Compila y las rutas nuevas aparecen en el listado del build.
- ⬜ **Falta configurar las claves, y lo hace Gina** (son secretos):
  `DOMUSCRM_WEBHOOK_KEY` en CondoManager con el mismo valor que
  `CONDOMANAGER_WEBHOOK_KEY` en DomusCRM. **Mientras no estén, no se publica
  nada.**
- ⬜ La prueba real: poner una unidad EN VENTA con precio y verla aparecer en
  el inventario de EcoInmobiliaria.
- ❌ Sin prueba automática (pregunta 17 de la parte II).

**Y una comprobación, porque esto puede volver a morir en silencio.** El emisor
devuelve sin publicar cuando falta la clave —escribe en el registro del
servidor y ya—, y para el dueño eso se ve idéntico a que haya salido bien.
Desde afuera tampoco se puede distinguir: DomusCRM responde 401 tanto con la
clave equivocada como sin configurarla de su lado (decisión de seguridad suya,
correcta, que deja a este lado ciego). Por eso
`GET /api/unidades/salud-publicacion` responde si está configurado **sin
revelar la clave** — mismo criterio que `salud-pasarela` de pagos-sorsabsa.

</details>

**Nota de método — cómo apareció, y qué falló al buscarlo.** No lo encontró
ninguna auditoría: apareció porque Gina no aceptó un "CondoManager está limpio"
que yo había afirmado. Ese veredicto era falso y venía de búsquedas ciegas:
**`rg` no está instalado en la máquina de trabajo**, y con los errores
redirigidos a `/dev/null`, "comando no encontrado" se veía exactamente igual
que "no hay coincidencias". Varias conclusiones de esa sesión —incluida
*"CondoManager no tiene función de publicar propiedades"*, falsa: tiene un
módulo inmobiliario completo— salieron de ahí. Se rehízo la revisión con
`grep`/Grep y el grafo, cruzando dos fuentes por hallazgo. Queda escrito
porque el modo de fallo es traicionero: una herramienta ausente no dice que
falta, devuelve vacío.

---

## 🟠 IMPORTANTE

### 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026

**1. Síntoma:** el mismo bloque — `auth.getUser()` → `perfiles.select("rol,
condominio_id").eq("user_id", user.id)` → comparar `rol` contra una lista
de valores permitidos → 401/403 si no calza — aparece copiado, casi letra
por letra, en al menos 13 archivos.

**2. Causa inmediata:** cada ruta nueva que necesitó "solo admin" o "solo
superadmin" escribió su propio chequeo en vez de importar uno existente.

**3. Causa raíz:** nunca se creó un `lib/auth/requireRole.ts` (o similar)
como fuente única. En 4 archivos incluso se llegó a nombrar la función
igual (`requireSuperadmin`) — evidencia de que el patrón se reconoció como
repetible, pero se resolvió copiando el archivo, no extrayendo un módulo.

**4. Componente responsable:** debería existir un único helper server-side
en `lib/auth/`, usado por toda ruta que necesite autorización por rol —
exactamente el principio que `ESTANDAR-DESARROLLO.md` nombra explícito:
*"Ya existe un servicio central para algo... usarlo. No implementar una
versión local paralela"* y *"debe existir una única autoridad. Si dos
componentes deciden distinto sobre el mismo concepto, eso es un hallazgo
arquitectónico."*

**5. Código afectado (13 sitios, mínimo):**
- `app/api/superadmin/admin-condominio/route.ts` — función nombrada `requireSuperadmin()`
- `app/api/superadmin/suscripcion-condominio/route.ts` — misma función, copiada
- `app/api/superadmin/notificaciones/enviar/route.ts` — misma función, copiada
- `app/api/superadmin/notificaciones/destinatarios/route.ts` — misma función, copiada
- `app/api/superadmin/firma/route.ts` — inline, ×2 (POST y DELETE)
- `app/api/reservas/aprobar/route.ts` — inline
- `app/api/reservas/cancelar/route.ts` — inline
- `app/api/reservas/rechazar/route.ts` — inline
- `app/api/reservas/mantenimiento/route.ts` — inline
- `app/api/reservas/disponibilidad/route.ts` — inline
- `app/api/residentes/aprobar/route.ts` — inline
- `app/api/residentes/rechazar/route.ts` — inline
- `app/api/admin/activar-residentes-masivo/route.ts` — inline

**6. Fix propuesto:** crear `lib/auth/requireRole.ts` con una función
`requireRole(rolesPermitidos: string[], opciones?: { scopeCondominio?: boolean })`
que centralice: obtener usuario, obtener perfil, comparar rol, y
(cuando aplica) devolver `condominio_id` para el scoping por condominio que
ya hacen `aprobar`/`rechazar`/`reservas` — ese scoping SÍ debe quedarse en
cada ruta (es lógica de negocio propia de cada endpoint), solo el chequeo
de identidad+rol se centraliza.

**7. Código que debe eliminarse:** las 4 copias literales de
`requireSuperadmin()` y los ~9 bloques inline equivalentes, reemplazados
por la importación del helper único.

**8. Riesgo de regresión:** bajo si se hace ruta por ruta con el mismo
contrato de retorno (401 sin sesión, 403 sin el rol), verificando cada
endpoint después del cambio. El riesgo real está en tocar 13 archivos en
una sola pasada sin probar cada uno — mejor en tandas chicas.

**9. Validación:** para cada ruta migrada, probar con 3 sesiones (sin
sesión, con sesión pero rol insuficiente, con sesión y rol correcto) y
confirmar que el código de estado no cambió respecto al comportamiento
anterior.

**No es un hallazgo de datos comprometidos** — cada copia, revisada
individualmente, chequea correctamente. El riesgo es a futuro: la próxima
vez que se corrija esta regla (ej. agregar un chequeo de suscripción activa
al gate), hay que acordarse de tocar 13 archivos, y basta con olvidar uno
para que quede una ruta con una regla de autorización distinta al resto —
exactamente el patrón que causó la cadena de 7 parches de IOT.

**Resuelto 09-ago-2026** (`condomanager@f60960d`): `lib/auth/requireRole.ts`
— `getPerfilAutenticado()`, `getPerfilOpcional()`, `requireRole(roles,
{mensajeError?})`. 11 rutas migradas a `requireRole()` (las 13 originales
menos `reservas/cancelar`, que no tiene un solo rol permitido — admin O
residente dueño — y usa `getPerfilAutenticado()` directo; y menos
`reservas/disponibilidad`, dejada sin tocar a propósito porque su chequeo
de perfil es opcional, no el mismo patrón de gate). Mensajes 403
específicos de cada ruta preservados vía `mensajeError`; los 401
(3 variantes del mismo significado, sin razón funcional) se normalizaron a
uno solo. El tipado nuevo (`condominio_id: string | null` en vez de `any`
implícito) sacó a la luz que `reservas/aprobar`, `rechazar` y
`mantenimiento` pasaban `perfil.condominio_id` a `moduloActivo()` sin
verificar que no fuera null dentro del bloque `admin_condominio` — se
agregó un guard explícito fail-closed en los 3 como parte de este mismo
fix. `tsc --noEmit` y `eslint` limpios.

---

### 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026

**1. Síntoma:** si la consulta a `perfiles` en `lib/auth/post-login.ts`
falla (error de red, timeout, etc.), el usuario es enviado a `/panel` sin
que se aplique el chequeo de residente `PENDIENTE`/`RECHAZADO`.

**2. Causa inmediata:**
[lib/auth/post-login.ts:43-45](../../condomanager/lib/auth/post-login.ts):
```ts
if (perfilesError || !perfiles || perfiles.length === 0) {
  return { ok: true, destino: "/panel" };
}
```
`perfilesError` (fallo real de la consulta) y `perfiles.length === 0`
(usuario legítimamente nuevo, sin perfiles) devuelven exactamente la misma
respuesta.

**3. Causa raíz:** el tipo de retorno (`PostLoginResultado`) solo tiene
`ok: true` / `ok: false` con un mensaje de negocio — no hay forma de
distinguir "no configurado todavía" (vacío, válido) de "no pude
verificarlo" (error, inválido). Es el mismo patrón que
`ESTANDAR-DESARROLLO.md` nombra explícito bajo "Fallback peligroso": *"Un
sistema debe distinguir 'no configurado' de 'configurado y válido' —
nunca convertir lo primero en lo segundo para evitar que falle
visiblemente."*

**4. Componente responsable:** `resolverPostLogin` mismo — es quien decide
el destino post-login.

**5. Código afectado:** `lib/auth/post-login.ts`, líneas 29-45. Consumido
por `app/auth/callback/page.tsx`.

**6. Fix propuesto:** separar el caso de error del caso vacío —
`if (perfilesError) return { ok: false, error: "No se pudo verificar tu cuenta. Intenta de nuevo." }`
y dejar `if (!perfiles || perfiles.length === 0) return { ok: true, destino: "/panel" }`
como el único camino permisivo real.

**7. Código que debe eliminarse:** ninguno — es una separación de un
`if` compuesto en dos, no una reescritura.

**8. Riesgo de regresión:** mínimo. El único cambio de comportamiento es
que un error de base de datos ahora bloquea con un mensaje en vez de dejar
pasar — es un endurecimiento, no una restricción nueva sobre casos que
antes funcionaban bien.

**9. Validación:** simular `perfilesError` (mock o desconectar
momentáneamente) y confirmar que ya no lleva a `/panel` sino al mensaje de
error.

**Nota de severidad:** esto NO es una fuga de datos — RLS sigue siendo la
barrera real sobre qué puede leer cada usuario en `/panel`; lo que se
salta es el mensaje de negocio ("tu solicitud está pendiente"). Por eso es
🟠 y no 🔴: el peor caso es una mala experiencia (alguien con acceso
pendiente ve una pantalla confusa en vez del mensaje claro), no acceso
indebido a datos de otro condominio.

**Resuelto 09-ago-2026** (`condomanager@e4a7051`): el `if` compuesto se
separó en dos, exactamente como se propuso en el punto 6 — `perfilesError`
ahora devuelve `{ ok: false, error: "No se pudo verificar tu cuenta.
Intenta de nuevo." }` en vez de `{ ok: true, destino: "/panel" }`.
`app/auth/callback/page.tsx` ya manejaba `ok: false` de forma genérica
(`setMensaje(resultado.error)`), sin acoplarse al texto — no hubo que
tocarlo. `tsc --noEmit` y `eslint` limpios. **Validación real (punto 9,
simular el error de red) todavía no hecha** — el cambio es mínimo y de
bajo riesgo, pero no se ha probado en vivo.

---

## 🔵 MENOR

### 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026

**Síntoma:** `scratch/dist/lib/crypto.js`, `scratch/dist/lib/facturacion/service.js`
y `scratch/dist/scratch/test_invoicing_flow.js` están trackeados en git —
es la salida compilada de `scratch/test_invoicing_flow.ts`, un script de
prueba manual.

**Causa raíz:** falta un `.gitignore` para `scratch/dist/` (o para todo
`scratch/`, si esa carpeta es exclusivamente de pruebas locales
desechables).

**Fix propuesto:** `git rm -r --cached scratch/dist` + entrada en
`.gitignore`. Si `scratch/test_invoicing_flow.ts` y `scratch/run-qa-suite.js`
siguen siendo útiles como script de QA manual, pueden quedarse trackeados
(son fuente, no build output) — a decidir con Gina.

**Resuelto 09-ago-2026** (`condomanager@5aaa1c7`): `git rm -r --cached
scratch/dist` + entrada en `.gitignore`. El fuente (`test_invoicing_flow.ts`,
`run-qa-suite.js`) se quedó trackeado.

**Riesgo:** ninguno funcional. Es exactamente el tipo de "basura que se va
quedando" que motivó esta auditoría — no cambia el comportamiento de la
app, pero ensucia el repo y el historial.

---

## Hallazgos ya cubiertos en AUDITORIA-PORTERO-SSO.md (no repetidos acá)

Para no duplicar: `residentes.rol_pendiente` vs `registros_pendientes`
(🔴-9), la duplicación de `MENSAJES_HASH` entre auth-sorsabsa y
condomanager (🔵-4), y todo lo de autenticación/federación SSO viven en
[AUDITORIA-PORTERO-SSO.md](./AUDITORIA-PORTERO-SSO.md).

## Próximo paso

**Auditoría "portero × pagos/facturación/RLS/crons" cerrada, todo lo
encontrado corregido** (09-ago-2026). De los 3 ítems que quedaron
anotados como "fast-follow"/"bajo impacto" sin subsanar, Gina preguntó
directamente por qué no se arreglaban ya — la respuesta correcta era que
2 de los 3 no tenían ningún motivo real para esperar (bajo riesgo,
mecánicos), y el tercero (el cron) sí merecía cuidado por tocar borrado de
datos cruzando proyectos, no por el estado actual (datos de prueba, cero
clientes) sino por el código en sí — así que se hizo, con el cuidado
puesto donde correspondía, no aplazado. Estado final:

- 🔴-3 (`condomanager@1ebebc3`) — el más serio: `registro-admin` y
  `activar-residentes-masivo` estaban rotos en producción.
- 🟠-1 (`@f60960d`), 🟠-2 (`@e4a7051`), 🔵-1 (`@5aaa1c7`).
- `pagos/iniciar`/`pagos/consultar` migrados (`@940e095`).
- 5 funciones RPC con `anon`/`PUBLIC` revocado (`@12d3a84`).
- `limpiar-no-confirmados` reescrito para identity + emparejamiento por
  email, con la frontera entre productos cuidada explícitamente
  (`@0d961cc`).

**Lo que SÍ falta — validación con sesión real de usuario, no solo SQL/
transacciones de prueba:** todo lo de arriba se verificó a nivel de base
de datos (`set local role`, inserts transaccionales con rollback) o
typecheck/lint, pero ninguno se probó todavía con el flujo completo real
por el navegador (`registro-admin` → confirmar correo → login →
`reconciliar-perfil`; las 3 rutas migradas en 🟠-1 con sesión de cada rol;
el cron disparado de verdad contra una cuenta de prueba vieja en
identity). Esa ronda de validación manual, agrupada, es el siguiente paso.

**09-ago-2026, hallazgo nuevo, no de un fix — de una pregunta de negocio:**
Gina preguntó si el sistema soporta que una persona tenga propiedades en
más de un condominio. La respuesta, verificada contra `perfiles` (llave
primaria en `user_id`, una fila por login para siempre), es que no —
afecta ~120 personas reales del censo de Punta Blanca todavía sin subir.
No es un fix de una ruta: es un proyecto de varias fases, con su propio
documento — [PLAN-MULTI-CONDOMINIO.md](./PLAN-MULTI-CONDOMINIO.md).

---

### 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026

**Síntoma:** Gina, probando la asignación de residentes, encontró
"Unidad 1" ya creada en un condominio recién registrado, sin haber
importado ni creado ninguna unidad. Su objeción, textual: *"si manejas
2000 unidades y te olvidas de asignarla te quedan unidades fantasma, no
le veo el sentido de crear una unidad."*

**Causa raíz (rastreada en git history, no asumida):** este paso nació
(numerado "5" originalmente) inmediatamente después de crear al
admin_condominio **como residente también** — el propósito real era
darle una unidad donde "vivir". Hoy mismo, más temprano en esta sesión,
se corrigió 🔴-9 (`AUDITORIA-PORTERO-SSO.md`) y se eliminó que el admin
naciera como residente — el paso de crear la unidad se quedó, renumerado
a "3", sin nada que lo necesitara. Punto 15 del estándar
(`ESTANDAR-DESARROLLO.md`: "¿qué código existente debería eliminarse
como consecuencia de esta solución?") que no se aplicó en su momento.

**Fix:** `condomanager@ee036e6` — eliminado el insert a `unidades` y su
bloque de rollback en `registro-admin/route.ts`; renumerados los pasos
restantes. `docs/NOTIFICACIONES-CORREO.md` también describía el flujo
viejo (admin creado como residente) — corregido de paso. La unidad
fantasma que ya existía en el condominio de prueba de Gina se borró
directo en la base (no hacía falta rehacer el registro).

typecheck + eslint limpios.

---

### 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026

**Síntoma:** Gina notó que `manzana`/`lote` son obligatorios para crear
una unidad, pero no son "el código principal" — debería serlo
`codigo_predial` (el código catastral oficial en Ecuador). Preocupación:
que el patrón esté repetido en varios lugares.

**Verificado:** `codigo_predial` ya existía en `unidades`, pero como
texto libre sin ninguna restricción — podían coexistir 2 unidades con el
mismo código predial en el mismo condominio sin que nada lo impidiera.
`manzana`+`lote` sí tienen `UNIQUE(condominio_id, manzana, lote)` — son
hoy la llave de identidad real de una unidad, no solo un campo obligatorio
suelto. Repetido en 3 lugares con la misma validación
(`unidades/nuevo`, `unidades/importar`, `unidades/[id]/editar`).
Revisado `lib/facturacion/service.ts` por si había una razón tributaria
(SRI) para depender de manzana/lote — no la hay, solo se usa como texto
de respaldo para mostrar una dirección.

**Decisión de Gina (por pregunta directa, no asumida):** de 3 opciones
presentadas, eligió la más conservadora — `codigo_predial` pasa a ser una
llave única real (cuando está presente), pero `manzana`/`lote` NO se
tocan, siguen obligatorios como hoy.

**Fix:** `condomanager@e2dbb2e` — `UNIQUE(condominio_id, codigo_predial)
WHERE codigo_predial IS NOT NULL` (verificado sin duplicados antes de
aplicar). Mensaje legible en los 3 formularios en vez del error crudo de
Postgres cuando se repite un código predial. Verificado con insert
transaccional duplicado (rechazado, rollback sin dejar datos). typecheck
limpio, eslint sin errores nuevos.

**Actualización 🔵-3, mismo día:** a pedido de Gina, se centralizó la
validación (`lib/unidades/validar.ts`) que estaba copiada, cada una con
su propia versión, en las 3 pantallas que tocan `unidades` directo desde
el navegador (crear, importar CSV, editar — ninguna pasa por una API).
De paso, viendo la UI real, Gina decidió que `codigo_predial` pase de
opcional a **obligatorio** — `*` en el label, `required` en el input,
`NOT NULL` en la base (verificado antes: tabla vacía, sin conflicto).
`condomanager@60d8456`. Se identificó un 4to lugar que toca `unidades`
(`panel/residente/mis-unidades/page.tsx`) — no duplica esta validación,
edita solo campos de comercialización (precio, redes sociales), no toca
manzana/lote/codigo_predial.

**Extensión del mismo patrón a `residentes`, mismo día
(`condomanager@6f42bc0`):** Gina preguntó directo si la UI había sido
auditada — no lo había sido (ver corrección de alcance más arriba). Se
verificó el mismo defecto en `residentes`: "Nombres, apellidos y email
son obligatorios" copiado en 3 pantallas (`nuevo`, `importar`,
`[id]/editar`), pero las 3 columnas eran opcionales en la base.
Confirmado con Gina: los 3 deben ser siempre obligatorios. Centralizado
en `lib/residentes/validar.ts`; `ALTER COLUMN ... SET NOT NULL` en
`nombres`/`apellidos`/`email` (verificado antes: tabla vacía, sin
conflicto). Verificados los 4 sitios que insertan `residentes`
(`importar`, `nuevo`, `registro-residente/route.ts`,
`scratch/test_invoicing_flow.ts`) — todos ya proveían los 3 campos,
ninguno se rompe. typecheck + eslint limpios.

---

### 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026

Marcado 🟠 (no 🔵) porque a diferencia de los hallazgos "obligatorio en
pantalla / opcional en base" anteriores, este SÍ podía borrar un dato ya
guardado, sin ningún error visible. Encontrado a raíz de una pregunta de
Gina sobre compartir la URL de un condominio, que llevó a revisar el
menú de Configuración completo — ver
[PLAN-CONFIGURACION-CONDOMINIO.md](PLAN-CONFIGURACION-CONDOMINIO.md)
para el análisis completo y las 4 fases.

**Síntoma:** `app/(dashboard)/panel/admin/configuracion/ubicacion` y
`.../contacto` eran 2 pantallas independientes, cada una con su propio
`formData` y su propio `handleSubmit`, escribiendo las **mismas 3
columnas** de `condominios` (`direccion`, `latitud`, `longitud`) sin
fetch-merge entre sí. Guardar en una, después de haber guardado un
cambio en la otra, reescribía esas 3 columnas con la copia vieja que esa
pantalla había cargado al abrirse — el cambio previo desaparecía en
silencio.

**Causa raíz:** no había política de dónde vive un dato de condominio.
Las pantallas que guardan dentro de `condominios.configuracion` (JSONB)
sí están aisladas por construcción — cada una hace fetch-merge-write
sobre su propia llave, nunca se pisan. Las que escriben columnas planas
(Ubicación, Contacto, también Generales/Identidad) no tenían ese
aislamiento porque cada una se armó por separado, sin una sola pantalla
dueña de esos datos.

**Fix (no un parche):** fusionadas Generales + Ubicación + Contacto +
Identidad Visual en una sola pantalla, "Perfil del condominio"
(`condomanager@5267329`, Fase 1 de
[PLAN-CONFIGURACION-CONDOMINIO.md](PLAN-CONFIGURACION-CONDOMINIO.md)).
Un solo `formData`, un solo `handleSubmit` — la segunda copia que podía
pisar a la primera deja de existir, no es una regla a recordar. Rutas
viejas (`generales`, `ubicacion`, `contacto`, `identidad`) quedan como
`redirect()` a `/configuracion/perfil`. Verificado: typecheck limpio,
eslint 0 errores, SQL confirma que el condominio real no perdió ningún
dato (cambio solo de UI/routing, sin migración de por medio).

**Extensión, mismo día (Fase 2, `condomanager@e9dcf0f`):** Gina notó que
Facturación seguía pidiendo razón social/nombre comercial/dirección —
"por que facturacion tiene datos legales, no dijimos que la idea es no
repetir". Mismo patrón, un nivel más: esos 2 campos se quitan del
formulario de Facturación (queda solo `email_facturacion`, caso de uso
real y distinto confirmado por Gina, más los 4 campos de numeración SRI
que tienen que seguir siendo editables a mano). De paso se corrigió un
fallback roto en `lib/facturacion/service.ts`: cuando el campo duplicado
estaba vacío, `nombre_comercial` caía a `condominio.nombre` (Generales)
en vez de a `condominio.nombre_comercial` (Legales) — que existía y
**nadie leía en ningún lugar del código**, confirmado con grep. Verificado
con SQL antes de tocar código que el condominio real no necesitaba
backfill (los campos duplicados nunca se habían llenado).

**Segunda corrección, mismo día (`condomanager@feee488`):** el fix
anterior seguía mostrando razón social/nombre comercial/dirección en
Facturación, aunque fuera de solo lectura. Gina: "pero para que repetir
otra vez los datos que ya aparecen en otra ficha, solo debería pedir el
correo de facturación" — mostrar el valor dos veces sigue siendo
repetirlo, aunque no se pueda editar ahí. Se quitó el resumen por
completo; Facturación pide solo el correo, con un link de texto (sin
mostrar ningún valor) a Datos Fiscales/Perfil del condominio. Ver
[PLAN-CONFIGURACION-CONDOMINIO.md](PLAN-CONFIGURACION-CONDOMINIO.md)
Fase 2 para el detalle completo.

---

### 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026

**Encontrado en el barrido sistemático** (ver "Próximo paso" resuelto
más abajo), no reportado por Gina probando.

**Síntoma potencial:** crear una "Deuda Individual" (multas, cargos
extraordinarios) sin elegir rubro reventaba con un error crudo de
Postgres — `individual/page.tsx` etiquetaba el campo "Rubro asociado
(opcional)", sin `required`, con opción "Sin rubro asociado"; pero
`deudas.rubro_id` es `NOT NULL` desde el esquema base
(`00000000000000_baseline_schema.sql`).

**Por qué no se resolvió solo relajando el `NOT NULL`:** la vista
`v_deudas_pendientes` — la que alimenta los totales
"pendientes/pagados/monto" de `app/(dashboard)/panel/admin/page.tsx`,
la página principal del admin — hace `JOIN` (no `LEFT JOIN`) contra
`rubros`. Si se permitía `rubro_id NULL`, una deuda sin rubro
desaparecía silenciosamente de esos totales: dinero que un residente
debe, sin ningún indicio en el dashboard de que existe. Encontrado
leyendo la vista y su único consumidor real en el código — no asumido.

**Decisión de Gina (por pregunta directa):** toda deuda debe tener
rubro — ninguna excepción "sin categoría".

**Fix (`condomanager@36882ab`):**

- Trigger `sembrar_rubro_cargos_varios()` (`AFTER INSERT ON
  condominios`) que crea un rubro catch-all "Cargos varios" para cada
  condominio nuevo — `rubros` es por-condominio (`condominio_id NOT
  NULL`), no puede ser un rubro global. Se sembró vía trigger, no
  duplicando el insert en cada lugar que crea un condominio, mismo
  patrón de fuente única aplicado ya a `validarUnidad`/`validarResidente`.
  Verificado: hoy solo `app/api/registro-admin/route.ts` crea
  condominios en producción — igual se eligió trigger sobre duplicar
  código en ese único punto, para no repetir el error de 🔴 (una función
  cross-repo borrada por asumir "solo hay un lugar que la llama").
- Backfill del único condominio ya existente (verificado con SELECT
  antes y después).
- `individual/page.tsx`: quitado "(opcional)", agregado `required` al
  `<select>`, quitado el fallback `rubro_id: formData.rubro_id || null`
  del insert, agregada validación explícita
  `if (!formData.rubro_id) throw ...` (mismo patrón que la validación
  de monto ya existente en el mismo archivo).
- Limpieza menor de paso: `unidades/nuevo` y `unidades/[id]/editar`
  todavía tenían `codigo_predial: formData.codigo_predial || null` de
  cuando el campo era opcional (🔵-3) — inofensivo porque
  `validarUnidad` ya bloquea el envío vacío antes de llegar ahí, pero
  contradecía la intención real del código. Cambiado a `.trim()`, igual
  que `manzana`/`lote`.

**Validación:** typecheck limpio, eslint sin errores nuevos (1 warning
preexistente no relacionado). Trigger probado con un insert
transaccional a `condominios` con `ROLLBACK` (no dejó datos), confirmó
que sembró exactamente 1 fila en `rubros`. Backfill confirmado con
SELECT: el condominio real ya tiene su "Cargos varios" (`INGRESO`,
`UNICO`, activo). 0 filas en `deudas` hoy — cero riesgo de datos.

---

### 🟠-4 — Los módulos SaaS por-condominio se activan sin ningún cobro real — NO RESUELTO, elevado a la auditoría 09-ago-2026

**Origen:** Gina, revisando cómo CondoManager maneja suscripciones (tras
el fix de 🟠-3-bis / pago self-service del plan general, ítem #16 de
`PENDIENTES-ECOSISTEMA.md`): "tampoco se dijo nada en auditoría,
documéntalo ahí". No es un hallazgo nuevo — ya estaba honestamente
autodocumentado en `condomanager/docs/modulos.md` §11/§18, pero nunca
se había cruzado hacia acá ni hacia `PENDIENTES-ECOSISTEMA.md`, así que
no aparecía en ningún lugar que Gina revisara de forma centralizada.

**1. Síntoma:** en `suscripcion/page.tsx`, `activarModulo()` (Recaudación,
Comunicados, Contabilidad, etc.) inserta/actualiza `condominio_modulos`
con `estado: "ACTIVO"` y `trial_expira = ahora + trial_dias` — un
`INSERT`/`UPDATE` directo a Supabase, sin llamar a `pagos-sorsabsa` en
ningún punto. Un admin puede "activar" cualquier módulo add-on
indefinidamente, en tandas de período de prueba, sin que nunca se
genere un cargo real.

**2. Causa inmediata:** el botón "Activar (N días prueba)" solo
implementa la capa de **entitlement** (¿tiene derecho a usarlo?), nunca
la de **billing** (¿está pagado?) — son capas distintas y el código solo
construyó una.

**3. Causa raíz — ya reconocida por el propio proyecto, no un hallazgo
ciego:** `condomanager/docs/modulos.md` §11 ("Modelo de 3 capas") ya
documenta esto como estado conocido: *Feature flag* ✅, *Entitlement*
⚠️ "falta enforcement", **Billing ❌ "falta"**. La tabla "Estado
honesto" (§18) es aún más explícita: *"Expiración automática de
prueba: ❌ Pendiente — `trial_expira` guardado, no aplicado"* y
*"Facturación / metering: ❌ Pendiente — sin medición ni cargos"*.
Es decir: el propio equipo ya sabía que faltaba el cobro — lo que
faltaba era que ese conocimiento llegara a un documento que Gina
consulta para decidir prioridades del ecosistema.

**4. Componente responsable:** `condominio_modulos` (entitlement local) +
la ausencia de una llamada a `pagos-sorsabsa/api/iniciar` (Capa 1, mismo
mecanismo que ya usa la suscripción del plan general desde el ítem #16 de
`PENDIENTES-ECOSISTEMA.md`) cuando el trial de un módulo vence.

**5. Código afectado:**

- `app/(dashboard)/panel/admin/configuracion/suscripcion/page.tsx` —
  `activarModulo()`/`desactivarModulo()`.
- `app/(dashboard)/components/DashboardShell.tsx` — sí verifica
  `trial_expira > ahora` para ocultar el módulo del menú una vez vencido
  (confirmado en código, esto SÍ funciona), pero ocultar el menú es UX,
  no seguridad: `docs/modulos.md` §12 ya advierte *"Sin esto,
  'Desactivar' solo esconde el menú: la data y las rutas siguen
  accesibles por URL/API"* — no se verificó en esta pasada si las rutas
  de cada módulo (`app/api/modulos/**`) ya aplican
  `is_modulo_activo()`/`assertModuloActivo()` en servidor o si eso
  también sigue pendiente; **queda sin confirmar, no asumir ninguna de
  las dos.**

**6. Fix propuesto (ya diseñado en `docs/modulos.md`, no inventado
acá):** al vencer `trial_expira`, mover `condominio_modulos.estado` a
`VENCIDO` (la máquina de estados de §13 ya contempla ese valor) y
ofrecer el mismo botón de pago self-service Capa 1 que ya existe para
el plan general — mismo patrón, mismo `producto: "condomanager"`, pero
con `sujeto` compuesto (condominio + módulo) en vez de solo el
condominio, para no pisar la suscripción del plan general en
`pagos.suscripciones`.

**7. Código a eliminar:** ninguno todavía — no se tocó código en este
hallazgo, es solo la elevación del hallazgo a este documento.

**8. Riesgo de regresión:** N/A, no resuelto todavía.

**9. Validación:** N/A. Queda como pendiente abierto — agregarlo también
a `PENDIENTES-ECOSISTEMA.md` si Gina decide priorizarlo.

---

## Próximo paso (actualizado, al final del documento — ver también la nota de Próximo paso más arriba, en el cuerpo del documento)

**✅ Barrido sistemático ejecutado 09-ago-2026** (el pendiente de más
arriba). Método: se extrajeron de la base todas las columnas `NOT NULL
sin default` de las 24 tablas de `public` (fuente de verdad real, no
supuesta), y se cruzaron contra los ~43 archivos de
`app/(dashboard)/**` que escriben directo a Supabase (`.insert`/
`.update`, sin pasar por una API) — no solo los que Gina ya había
tocado probando.

**Resultado:** de 43 archivos, uno tenía el defecto (`deudas.rubro_id`,
🔵-4 arriba) — y resultó tener una segunda víctima escondida
(`v_deudas_pendientes`) que ni el patrón "obligatorio en pantalla /
opcional en la base" original hubiera predicho. El resto — `unidades`,
`residentes` (ya resueltos antes), `condominios`, `rubros`,
`comunicados`, `amenidades`, `crm_oportunidades`, `crm_vendedores`,
`crm_actividades`, `inmobiliaria_propiedades`, `unidad_fotos`,
`miembros_directiva`, `evento_reglas`, `medios_pago`,
`condominio_modulos`, `datos_facturacion`, `unidad_residente`,
`mensajes`, `modulos`, `catalogo_rubros` — no repite el patrón: los
campos obligatorios en pantalla ya son obligatorios en la base (o
viceversa, sin fallback silencioso a `null`).

**No cubierto por este barrido:** solo miró escrituras directas del
navegador a Supabase. No revisó las rutas de API (`app/api/**`, que ya
tienen su propia validación de servidor) ni la lógica de lectura/
visualización de la UI (fuera del alcance de "obligatorio vs
nullable"). Si aparece un caso nuevo, el método queda documentado acá
para repetirlo: `information_schema.columns` con `is_nullable='NO' AND
column_default IS NULL`, cruzado contra grep de `.insert(\{`/
`.update(\{` en el árbol de páginas.

---

### 🔵-5 — ✅ RESUELTO 10-ago-2026 — extracción de mensaje de error de fetch duplicada en ~31 archivos

**Origen:** encontrado en agente24siete (10-ago-2026), no en CondoManager
directamente — Gina reportó un `HTTP 401` crudo mostrado al usuario en
vez de un mensaje humano ("Cuenta sin cliente asociado"). Al construir
el fix (`mensajeDeError`/`mensajeDeErrorData`, ahora en `@sorsabsa/ui`
v0.1.42) se verificó si CondoManager tenía el mismo problema.

**Diferencia real con agente24siete — esto NO es un bug acá:**
CondoManager sí lee `data.error` en sus 46 apariciones (31 archivos,
confirmado con grep) — el patrón `data.error || "mensaje de respaldo"`
se repite, pero no descarta el mensaje real del backend como pasaba en
agente24siete. Es duplicación de código, no un defecto de UX.

**Resuelto, mismo día (`condomanager@b032922`):** Gina pidió aprovechar
y corregirlo. De los ~32 sitios que hacían `data.error || "..."`
encontrados con grep, **20 archivos (24 apariciones) eran cliente
hacia usuario** — se migraron a `mensajeDeErrorData(data, fallback)` /
`mensajeDeError(res, fallback)`, mismo helper que ya resolvió el bug
real de agente24siete. **Los otros 5 (`app/api/**/route.ts`) NO se
tocaron a propósito** — son llamadas servidor-a-servidor (CondoManager
llamando a pagos-sorsabsa, o construyendo su propia respuesta de error),
una capa distinta de "qué le mostramos a un usuario"; mezclar ambas
hubiera sido forzar una reutilización que no encaja, no una limpieza
real. Verificado: `tsc --noEmit` limpio, `eslint` 0 errores nuevos en
los 20 archivos (solo warnings `exhaustive-deps` preexistentes).

**Extendido a DomusCRM, mismo día (`domuscrm@1338477`):** revisado
primero (sin tocar) a pedido de Gina; ella preguntó *"y por qué no
debería ser así? no debería estar estandarizado?"* — correcto, se
aplicó el mismo criterio. 3 archivos, 6 apariciones
(`app/admin/team/page.tsx` ×4, `app/register/[token]/page.tsx`,
`app/register/page.tsx`), ninguno con bug real (ya leían `data.error`).
`app/api/referrals/route.ts` (servidor-a-servidor) y `lib/notify.ts`
(solo `console.error`, nunca llega al usuario) tampoco se tocaron, mismo
criterio de capas que en CondoManager. Bump a `@sorsabsa/ui@0.1.42`.
Verificado: `tsc --noEmit` limpio.

---

### 🟠-5 — 🔧 56 modales del navegador, nunca contados: 46 fuera, 10 vivos — 23-ago-2026

**Síntoma (1).** Gina, con mayúsculas y por cuarta vez: *"ODIO LOS
MODALES, NO USAR MODALES DIJE HACE RATO"*. Y antes: *"ESTO ME HACE VER
QUE HA HABIDO TANTOS MODALES QUE SALEN DE PANTALLA O DE LA INTERFAZ QUE
LOCURA"*.

**Causa inmediata (2).** `alert()`, `confirm()` y `prompt()` repartidos
por todo el panel. Al medirlo por primera vez: **56 solo en
CondoManager**.

**Causa raíz (3).** No es que se hubieran escrito: es que **nadie los
contó nunca**. `ESTANDAR-UI.md` §1 los prohíbe desde su primera versión,
y se corregían de a uno, cuando alguien los veía en pantalla. Regla 2 de
la parte II de `ESTANDAR-DESARROLLO`: *una comprobación desconectada es
una comprobación que no existe* — no había ninguna que mirara esta regla.
El check de conformidad vigila duplicación de componentes, no uso de
modales. **La regla que Gina más veces tuvo que repetir era justamente la
única sin vigilancia automática.**

**Componente responsable (4).** El design system: la confirmación en
línea es una pieza compartida, no algo que cada pantalla resuelva.

**¿Existía ya? (5, 6).** CondoManager tenía un `ConfirmarAccion` local.
Se movió a `@sorsabsa/ui` (`4ddb6e6`) y la copia local se borró — el
componente sirve a los cinco productos, no a uno.

**Qué se eliminó (15).** 46 modales, en ocho tandas:
`b149e56` (reservas, 8) · `571c80b` (seis hooks) · `13c6fa3`
(automatizaciones, 5) · `3d904c2` (siete `alert()`) · `d21eafd` (medios
de pago) · `e49fa18` (superadmin y firma electrónica) · `ddce3c7` (dos
borrados sin confirmación — ver abajo) · `b1c8fd7` (residentes, unidades,
rubros). `tsc --noEmit` y `npm run build` limpios en cada una.

**El error propio, y por qué aparece acá (11, 14).** En `571c80b` se
quitó el `confirm()` de `useAmenidades` y `useMantenimientos` **sin poner
nada en su lugar**: borrar una amenidad con todas sus reservas pasó a ser
un clic sin vuelta atrás. No lo encontró ninguna prueba ni el check —
lo encontró Gina preguntando *"¿y si esto fue un error? ¿se puede
deshacer?"*. Corregido en `ddce3c7`. Queda escrito porque es el modo de
fallo natural de este trabajo: *quitar el modal* y *conservar la
protección* son dos tareas, y la segunda es invisible si solo se mira la
pantalla.

**Quién lo ejecuta ahora (16).** `src/scripts/modales.mjs` en
diseno-sorsabsa, con workflow propio (lunes 07:00 Ecuador y en cada push
que lo toque), correo por Resend y rojo en CI. `npm run modales:local`
para correrlo a mano.

**Qué falla si vuelve (17).** El check sale con 1 y el workflow se pone
en rojo. Comprobadas las cinco salidas ANTES de conectarlo: con modales →
1 · sin modales → 0 · ruta ilegible → 2 · sin argumentos → 2 · solo
comentarios → 0.

**Denominador (18).** 56 al empezar; **10 vivos al 23-ago-2026**,
verificados corriendo el check, no estimados:

| pantalla | qué queda |
|---|---|
| `admin/configuracion/suscripcion` | `alert()` ×2 + `confirm()` |
| `modulos/comunicados/admin/[id]` | `confirm()` + `alert()` |
| `admin/configuracion/facturacion` | `confirm()` |
| `admin/directiva` | `confirm()` |
| `superadmin/configuracion` | `confirm()` |
| `modulos/recaudacion/.../generar` | `confirm()` |
| `modulos/crm-vendedores/vendedor/[id]` | `prompt()` |

**No son todos mecánicos.** Dos necesitan diseño, no reemplazo:
`generar` pregunta *"Ya existe una deuda para este rubro en este período,
¿continuar?"* — es una advertencia con decisión, no un "¿estás seguro?".
Y `crm-vendedores` usa `prompt()` para pedir un dato: necesita un campo
en la pantalla, no un botón de confirmar.

---

### 🔵-6 — ✅ El sistema de componentes en paralelo, retirado — y tres "duplicados" que no lo eran — 23-ago-2026

**Origen.** Gina: *"QUE PARA ESTE MOMENTO PENSÉ QUE YA ESTÁBAMOS EN EL
DESIGN SYSTEM PARA EVITAR TENER 2 O 3 SISTEMAS EN PARALELO"*.

**Lo que había (6).** 9 componentes propios en `app/components/ui/`,
varios repitiendo algo que `@sorsabsa/ui` ya daba.

**Resuelto (`b88f1e3`):** de 9 a 7, cero duplicados según el check de
conformidad. Se borraron `Tabla.tsx`, `PasswordInput.tsx` y la copia
local de `ConfirmarAccion.tsx`.

**Lo que NO se migró, a propósito — y es el hallazgo real.** De cinco
candidatos, **tres no eran duplicados**, y solo se veía leyendo el
código:

- **`Button`** — con `href` renderiza `next/link`. El del design system
  dibuja un `<a>` común, y en Next.js eso es **recarga completa de la
  página** en vez de navegación de cliente. Migrar los 68 archivos a
  ciegas habría dejado 68 sitios navegando peor **sin que se notara
  mirando la pantalla**. Se resolvió al revés: se agregó `asChild` al
  design system (v0.1.59) y el `Button` local quedó como cola de
  integración con el enrutador, que es responsabilidad del producto (4).
- **`EstadoBadge`** — no dibuja: **traduce estados del negocio a tonos**
  (`APROBADO` → verde, `MOROSO` → rojo, `EN_VENTA` → azul). Ese mapa es
  conocimiento del producto; a JustiRed no le importan los estados de un
  condominio. Migrar habría obligado a escribir el tono en las 17
  llamadas — un retroceso disfrazado de unificación. Se retiró el
  **dibujo** (ahora delega en `StatusBadge`) y se conservó el mapa.
- **`Chip`** — no era duplicado. Se contó mal al medir.

**Consecuencia para el método (14).** El check de conformidad compara
**nombres de símbolos**. Eso encuentra candidatos, no duplicados: dos
cosas que se llaman igual pueden hacer cosas distintas, y algo que
comparte el 90% del dibujo puede tener el 10% que importa. **La lista
del check es el principio de la revisión, no su conclusión.** Se tocaron
24 archivos en vez de 114, y el resultado es mejor.

**Lo que el design system tuvo que crecer para permitirlo (5).** Cinco
versiones, cada una destrabando un caso concreto en vez de forzar al
producto a conformarse: `Select`, `Checkbox`, `Tabs` y `ConfirmarAccion`
(v0.1.56), variante `outline` (v0.1.58), `asChild` (v0.1.59) y
`CardDescription` (v0.1.60).
