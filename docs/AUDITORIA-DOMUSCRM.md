# Auditoría — DomusCRM, el portero y el alta de cuenta

**Abierta:** 10-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo se
corrige sin presentar antes el análisis de 9 puntos (síntoma, causa
inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Por qué existe:** mismo pedido que abrió `AUDITORIA-AGENTE24SIETE.md` y
el hallazgo 🔴-11 de `AUDITORIA-PORTERO-SSO.md` — Gina, probando el flujo
real de DomusCRM (landing → "Ingresar" → Google → panel), reportó tres
síntomas en la misma sesión de prueba. Esta auditoría los documenta con
código, no los corrige — corrección pendiente de su confirmación, uno por
uno.

**Alcance:** `crm_inmobiliario/webs` (`app/login/page.tsx`,
`app/auth/callback/page.tsx`, `app/register/page.tsx`,
`app/api/auth/reconciliar-perfil/route.ts`, `middleware.ts`,
`components/LoginGate.tsx`) + `auth-sorsabsa` (`app/auth/complete/page.tsx`,
`api/entitlements/route.ts`, `lib/entity-resolver.ts`,
`lib/blocked-message.ts`) — el gate de sesión de DomusCRM ya tiene su
entrada propia en `AUDITORIA-PORTERO-SSO.md` 🔴-11 (sidebar sin condicionar
+ middleware que solo mira presencia de cookie, no vigencia); acá no se
repite, solo se referencia.

---

## 🔴 CRÍTICO

### 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 · fix #2 etapa 1 CORREGIDA 15-ago-2026 (etapas 2-3 pendientes) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador

**Síntoma, textual (Gina):** entra a la landing, presiona "Ingresar" → Google
→ inicia sesión con una cuenta real sin ninguna agencia asociada → llega a
una pantalla que dice *"Tu cuenta no está asociada a ninguna inmobiliaria...
Necesitás una invitación del administrador"*. Presiona **atrás** en el
navegador para volver a la landing y en vez de eso queda parada en
`auth.sorsabsa.com/auth/complete` con un mensaje **distinto**: *"Sin
suscripción activa. Tu cuenta existe, pero no tiene una suscripción de tu
producto. Contáctanos para activarla."*

**Causa inmediata:** son dos pantallas de dos gates distintos, en dos
apps distintas, que preguntan cosas relacionadas pero no idénticas:

1. `auth-sorsabsa/auth/complete` — ANTES de dejar pasar a DomusCRM, llama a
   `/api/entitlements` con `{app: 'domuscrm'}`. Esto resuelve una ENTIDAD
   pagadora (`resolveEntitySubject('domuscrm', userId)` en
   `entity-resolver.ts`, vía `resolve_company_for_user()`), y si esa
   entidad no tiene suscripción activa en `pagos-sorsabsa`, corta acá con
   `reason: 'sin_suscripcion'` → el texto que vio en el segundo intento
   (`blocked-message.ts::mensajeDeBloqueo`).
2. `crm_inmobiliario/webs/auth/callback` — YA del lado de DomusCRM, llama a
   `/api/my-company`: si el usuario no pertenece a ninguna empresa
   (`domus.company_users`), muestra el texto de "sin inmobiliaria" que vio
   primero.

**Por qué dio dos resultados distintos para la MISMA cuenta:**
`auth/complete/page.tsx` lee los tokens del login (`#access_token=...`) del
fragment de la URL, pero **nunca lo limpia** (no hay ningún
`window.history.replaceState` en todo el archivo, a diferencia de
`crm_inmobiliario/webs/auth/callback/page.tsx` que sí lo hace después de
guardar la sesión). Al presionar "atrás", el navegador vuelve a esa misma
URL con el fragment ORIGINAL todavía en la barra de direcciones, y el
`useEffect` del componente se ejecuta de nuevo desde cero: reinstala la
sesión con tokens ya usados y repite TODO el chequeo de suscripción una
segunda vez. La página no es segura contra un replay por navegación — algo
que un botón de "atrás" hace constantemente y sin que el usuario sepa que
está repitiendo una operación.

**Por qué el segundo chequeo dio distinto que el primero — 15-ago-2026,
dos candidatos MECÁNICOS que reemplazan a los de antes.** Los originales
("rotación de refresh token", "alguna condición de carrera") eran
descripciones vagas. Leyendo el código de punta a punta aparecieron dos
explicaciones concretas, cada una verificable:

- **(A) El estado cambió entre las dos corridas, y lo cambió DomusCRM.**
  El `/auth/callback` del producto llama a `/api/auth/reconciliar-perfil`,
  que hace el `INSERT` en `domus.company_users` a partir de
  `domus.registros_pendientes`. Secuencia: 1ª pasada del portero → todavía
  no hay fila → `resolve_company_for_user` devuelve NULL → bypass → entra;
  DomusCRM reconcilia y CREA la fila; "atrás" → 2ª pasada → ahora SÍ hay
  entidad → pagos-sorsabsa no tiene suscripción para esa empresa →
  `sin_suscripcion`. No hace falta ningún token rotado: la base cambió en
  el medio. Requiere que existiera un `registros_pendientes` para ese email.
- **(B) La resolución falló en la segunda corrida.** Ver 🟠-3: cualquier
  excepción en la consulta producía el sujeto inventado
  `__resolucion_fallida__<userId>`, y pagos-sorsabsa responde
  `sin_suscripcion` para todo sujeto que no tenga fila
  (`api/entitlements.js:32`). O sea: una falla de base de datos se veía
  EXACTAMENTE como el mensaje que reportó Gina.

Se distinguen con dos consultas:
`SELECT * FROM domus.registros_pendientes WHERE email = '<el suyo>'` y
`SELECT status FROM domus.company_users WHERE user_id = '<el suyo>'`. Si hay
o hubo fila, es (A). (B) quedó corregido igual, porque es un defecto
independiente de si ocurrió ese día.

**Componente responsable:** `auth-sorsabsa/src/app/auth/complete/page.tsx`
(no limpia el fragment) es la causa inmediata; el diseño de dos gates
separados sin una única fuente de verdad es la causa de fondo.

**Fix #1 — ✅ CORREGIDO 10-ago-2026, commit `auth-sorsabsa@a3e9c97`:**
`window.history.replaceState(null, '', window.location.pathname + window.location.search)`
agregado inmediatamente después de leer `access_token`/`refresh_token` del
fragment, antes de `setSession()` — mismo patrón que ya usaba el callback
de DomusCRM. Un "atrás" del navegador ya no encuentra tokens crudos
reutilizables en la URL. typecheck limpio, jest 15/15 (de paso, corregido
un valor de color de marca desactualizado en `login.test.tsx`, sin
relación con este fix, encontrado al correr la suite).

**Fix #2 — la causa de fondo, con su análisis (15-ago-2026).** No son dos
gates: son **tres consultas a la misma tabla** `domus.company_users`, con
tres predicados distintos, en dos repos y dos esquemas.

| # | Dónde | Predicado | Si no encuentra |
| --- | --- | --- | --- |
| 1 | `public.resolve_company_for_user` (condomanager/supabase/migrations, l.195) — lo usa el portero | `WHERE user_id = $1 LIMIT 1` — **sin filtro de status** | NULL → bypass → **deja entrar** |
| 2 | `domus.company_lookup_for_user` (crm_inmobiliario/supabase/migrations, l.63) — lo usa `/api/my-company` | `status='active'` **+ JOIN `agent_sites` `is_active`** | 0 filas → `sin_empresa` → **bloquea** |
| 3 | `authorizePanel` (webs/src/lib/auth-guard.ts) — lo usa cada API del panel | `status='active'`, acotado a ESE tenant | null → **401** → `LoginGate` |

Se contradicen en estados reales: sin ninguna fila, (1) deja entrar y (2)
bloquea; con membresía activa pero `agent_sites` inactivo, (1) cobra y (2)
dice "sin inmobiliaria". La causa raíz es que el portero convierte "no
encontré entidad" en "no hay nada que cobrar → pasa" — el *fallback
peligroso* que `ESTANDAR-DESARROLLO.md` prohíbe textualmente ("si no existe
autorización → permitir"). No puede distinguir *superadmin sin entidad* de
*persona sin ninguna membresía*: son la misma fila ausente.

**La restricción que impide el fix obvio (verificada, y es la razón de que
esto se haga por etapas):** si el portero bloqueara con entidad NULL, **toda
agencia recién registrada quedaría afuera para siempre**. Su fila en
`domus.company_users` la crea el propio producto DESPUÉS del portero
(`/auth/callback` → `/api/auth/reconciliar-perfil`, desde
`registros_pendientes`). Bloquear antes = nunca llegan a la página que las
da de alta. Por eso el bypass "funciona" hoy.

**Etapa 1 — ✅ CORREGIDA 15-ago-2026, commit `auth-sorsabsa@bc38ca1`:**

- El modelo de cobro se declara en `auth-sorsabsa/src/lib/apps.ts` (`cobro:
  {modo:'entidad'|'persona'|'sin_cobro'}`), no en el resolver. Se eliminaron
  las **cuatro excepciones por nombre de producto** (`if (app === 'iot')`,
  `'convertidor'`, `'agente24siete'`, `'sorsabsaforensic'`) que vivían en
  `entity-resolver.ts` — exactamente la señal de alarma "no crear una
  excepción para el producto que expuso el bug". El resolver quedó genérico:
  no menciona ninguna app. Los motivos reales de cada producto se movieron
  como comentarios al lado de su declaración, no se perdieron.
- `bypass: true` (un solo estado para dos hechos distintos) se partió en
  `sin_cobro` y `sin_entidad`. **`sin_entidad` sigue dejando pasar** — eso
  es la etapa 2 — pero ahora tiene nombre propio, viaja en el cuerpo de
  `/api/entitlements` (visible en la pestaña Network) y su `return` está
  marcado en el código con la restricción de arriba.
- 🟠-3 corregido (abajo).

**Etapa 2 — ⬜ pendiente, es la decisión de fondo:** que `sin_entidad`
bloquee con el MISMO texto que ya usa DomusCRM. Exige primero resolver el
orden: la reconciliación de identidad tiene que ocurrir antes del gate, o
`registros_pendientes` tiene que ser visible para él.

**Etapa 3 — ⬜ pendiente:** una sola función de membresía, un solo
predicado, consumida por las tres. Elimina `public.resolve_company_for_user`
— que vive en el esquema de CondoManager leyendo tablas de DomusCRM, y que
`crm_inmobiliario/supabase/roles.sql:15` ya declara temporal.

**Código eliminado en la etapa 1:** las cuatro ramas por producto del
resolver y la rama `__resolucion_fallida__`. **Riesgo:** bajo y verificado —
nadie que entra hoy deja de entrar; lo único que cambia para un usuario es
que una falla nuestra ya no se le presenta como falta de pago.
**Validación:** typecheck limpio, jest 20/20 en auth-sorsabsa (5 tests
nuevos en `src/lib/entity-resolver.test.ts`, uno por cada estado de la tabla
de arriba, incluido "la consulta falla → no se inventa un sujeto").

---

## 🟠 IMPORTANTE

### 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@13d9176` — La pantalla de "sin empresa" no tiene marca — coincide con el reporte de "pantalla en blanco"

- **Archivo:** `crm_inmobiliario/webs/src/app/auth/callback/page.tsx:122-137`
- **Código:** el estado `sin_empresa` (y `error`) se renderiza dentro de un
  `<main>` con estilos inline (`fontFamily: 'system-ui'`), sin
  `BrandProvider`, sin `Card`, sin logo — literalmente el único texto
  visible en una página en blanco. Comparar con la pantalla equivalente de
  `auth-sorsabsa/auth/complete` (`payment_blocked`), que sí usa
  `BrandProvider` + `Card` + `Button` con la marca de DomusCRM.
- **Por qué importa:** es la primera pantalla que ve alguien a quien
  todavía no se invitó — el peor momento para que el producto se vea roto.
  No es cosmético: refuerza la sensación de "esto no funciona" en el
  instante exacto en que alguien decide si vale la pena escribirle al
  dueño de la agencia pidiendo una invitación.
- **Fix ejecutado:** los tres estados de `Callback()` ahora envueltos en el
  mismo `BrandProvider`/`Card` que ya usa `LoginGate.tsx` del mismo repo —
  patrón ya existente, no se inventó nada nuevo. typecheck y jest limpios.
- **Riesgo:** bajo, confirmado — página de solo lectura sin lógica de
  negocio, sin cambios de comportamiento.

### 🟠-2 — 🔧 Parcialmente corregido 10-ago-2026 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11

El gate de sesión propiamente dicho de DomusCRM ya quedó documentado ahí,
como parte del consolidado de los 4 productos. Estado tras esta sesión:

- ✅ `middleware.ts` ya no solo mira si `sb-access-token` existe — valida
  la sesión en vivo contra Supabase (commit `domuscrm@13d9176`). Esto
  cierra el camino más común hacia "sidebar completo + error adentro": una
  sesión vencida ahora se corta ANTES de renderizar el panel, no cuando la
  API responde 401 más tarde.
- ✅ Botón de "Salir" agregado al sidebar y al menú móvil (mismo commit),
  con el contrato central de logout — hasta hoy no existía ninguno.
- ✅ 15-ago-2026 · **El "caso residual" tenía nombre y no era el `<aside>`:
  era 🟠-4** (abajo). Lo que hacía aparecer `LoginGate` con el middleware ya
  conforme era el 401 que la API devolvía para "sesión válida sin membresía"
  — un 403 disfrazado. Corregido eso, ese camino ahora muestra
  `AccesoDenegado`, que dice la verdad y ofrece una salida real.
- ⬜ `AdminLayout` sigue dibujando el `<aside>` sin condición. Queda sin
  tocar: cambiar cómo decide qué dibujar es un cambio de forma, y el estado
  de sesión hoy lo decide cada página por su cuenta (`needsLogin` en cuatro
  lugares) — eso sí es duplicación real, pero se resuelve subiendo el estado
  al layout, no parcheando el `<aside>`.

### 🟠-3 — ✅ CORREGIDO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Una falla de nuestra base de datos se le reportaba al usuario como "no pagaste"

- **Archivo:** `auth-sorsabsa/src/lib/entity-resolver.ts` (rama `catch`).
- **Qué hacía:** ante cualquier excepción al resolver la entidad, devolvía
  el sujeto **inventado** `__resolucion_fallida__<userId>` y se lo mandaba
  igual a pagos-sorsabsa. Pagos responde `sin_suscripcion` para todo sujeto
  sin fila (`pagos-sorsabsa/api/entitlements.js:32`), así que la persona
  leía *"Tu cuenta existe, pero no tiene una suscripción de tu producto.
  Contáctanos para activarla"* — con `esNuestro: false`, o sea, se le
  cobraba la culpa de una consulta nuestra que falló.
- **Lo llamativo:** el vocabulario correcto ya existía. `blocked-message.ts`
  documenta `verificacion_no_disponible` en un comentario (l.25) y lo
  traduce a *"No pudimos verificar tu cuenta… no es necesariamente un tema
  de pago"*. **Nadie lo emitía nunca** — el motivo estaba escrito pero no
  conectado.
- **Fix:** el resolver devuelve `{subject: null, motivo:
  'verificacion_no_disponible'}` y `/api/entitlements` lo traduce a 503 con
  ese `reason`. Falla-cerrado se mantiene: no se autoriza el acceso.
- **Por qué importa más de lo que parece:** este es el candidato (B) del
  🔴-1. Una falla transitoria de base producía EXACTAMENTE el mensaje que
  reportó Gina.
- **Riesgo:** bajo, confirmado — typecheck limpio, 5 tests nuevos, uno de
  ellos afirma que ningún resultado del resolver puede volver a contener un
  sujeto fabricado.

### 🟠-4 — ✅ CORREGIDO 15-ago-2026, commit `domuscrm@479ea1b`; la pantalla pasa al componente compartido 16-ago-2026 (`domuscrm@449e7c3`) — El panel le decía "Iniciar sesión" a alguien que ya tenía la sesión iniciada

> **16-ago-2026 — `AccesoDenegado.tsx` ya no es propio.** El relevamiento de
> `AUDITORIA-PORTERO-SSO.md` 🟠-7 encontró que este mismo caso terminaba de
> seis maneras distintas en el ecosistema. **Esta era la mejor de las seis y
> fue la referencia para armar el componente compartido** (`SinAcceso` de
> `@sorsabsa/ui`) — y aun así se reemplazó: el estándar solo existe si nadie
> conserva la suya. El componente queda como la capa que traduce el motivo de
> DomusCRM (sin acceso / rol insuficiente) a esa pantalla, con lo propio del
> producto en los argumentos: qué cookies limpiar, y el destino de salida —
> que acá es el subdominio o dominio del inquilino, no `domuscrm.app`, y es
> la única excepción documentada del estándar.

- **Archivos:** `crm_inmobiliario/webs/src/lib/auth-guard.ts` + los ~15
  llamadores del panel.
- **Qué pasaba:** `authorizePanel` devolvía `null` tanto para "no hay token"
  como para "el token es válido pero esta cuenta no tiene membresía activa
  en ESTE tenant", y todos los llamadores mapeaban ese `null` a **401**. El
  front lee 401 como "no hay sesión" y muestra `LoginGate` — cuya única
  acción es rehacer el SSO completo para volver al mismo 401. Un callejón
  sin salida con un cartel que miente.
- **Lo llamativo, otra vez:** el propio docstring de `auth-guard.ts`
  afirmaba *"un usuario de otra inmobiliaria recibe 403 aunque su sesión sea
  válida"*. Ese 403 **no existía en ninguna parte del código**. La
  documentación describía el comportamiento correcto; la implementación
  nunca lo tuvo.
- **Alcance real, más ancho de lo que parecía:** el mismo 401 cubría también
  "sos de esta agencia pero no sos owner/admin" en equipo e invitaciones —
  o sea, a un agente normal que abría *Equipo* se le ofrecía iniciar sesión.
  Y el 403 ya era el patrón del repo para ese caso (`api/profile`,
  `api/properties/[id]`): la inconsistencia estaba dentro del mismo producto.
- **Fix:** `authorizePanel` → `autorizarPanel`, que devuelve una unión
  discriminada (`{ok:true, auth}` | `{ok:false, motivo:'sin_sesion' |
  'sin_membresia'}`). El **cambio de nombre es deliberado**: un `if (!auth)`
  que sobreviviera contra un objeto siempre truthy dejaría pasar a cualquiera
  sin que el compilador dijera nada; al cambiar el nombre, el llamador que no
  se migró no compila. Las respuestas HTTP quedaron en un solo lugar
  (`respuestaNegada` / `respuestaSinPermiso`), en vez del mismo
  `NextResponse.json({error:'UNAUTHORIZED'},{status:401})` copiado en cada
  archivo. En el front, un 403 ahora renderiza `AccesoDenegado`
  (`components/AccesoDenegado.tsx`), con las dos salidas que sí sirven:
  cambiar de cuenta (Salir) o volver a donde la persona sí tiene permiso.
- **De paso:** `api/invitations` autorizaba DOS VECES la misma petición
  (`guard()` y después otra llamada cruda, solo para leer el email de quien
  invita) — dos validaciones de token y dos consultas de membresía por
  invitación. Ahora autoriza una sola vez.
- **Riesgo:** medio por superficie (15 archivos), bajo por naturaleza: el
  cambio es de forma de retorno, no de regla. Ninguna condición de
  autorización se relajó — un acceso que antes se negaba se sigue negando,
  con otro código. typecheck limpio, jest 18/18 con 6 tests nuevos que fijan
  el contrato (`src/lib/__tests__/auth-guard.test.tsx`).

---

## 🟡 MEDIO

### 🟡-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — Formulario "Crear mi cuenta": falta un campo de apellido separado

- **Archivo:** `crm_inmobiliario/webs/src/app/register/page.tsx`
- **Confirmado antes de tocar código:** `domus.users`/`registros_pendientes`
  solo tienen `full_name` (una sola columna, `supabase/migrations/00000000000000_baseline_schema.sql`)
  — nada abajo espera `first_name`/`last_name` separados hoy.
- **Fix:** el formulario ahora pide `nombre` + `apellido` (en fila, mismo
  patrón que las contraseñas), y se concatenan en `nombreCompleto` justo
  antes de enviar a `/api/registro-agencia` — **cero cambios en el API ni
  en el esquema**, cero riesgo de migración. Si en el futuro algo necesita
  el apellido por separado de verdad, ahí sí se justifica tocar la base.
- **Riesgo:** confirmado bajo — typecheck y jest limpios, un solo insert
  atómico como pide `ESTANDAR-DESARROLLO.md`.

### 🟡-2 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — "Las dos contraseñas no están en la misma fila": Gina tenía razón, no era caché ni mobile

- **Causa real, confirmada con la captura de Gina + el CSS servido en
  producción (no adivinada):** `crm_inmobiliario/webs/src/app/globals.css`
  tenía una regla `.grid` propia (línea 56, cuadrícula de tarjetas de
  propiedad) que **nunca se borró** cuando ese layout migró a `.ei-grid`
  (línea 123, mismo propósito). `.grid` choca de nombre con la utilidad
  `.grid` de Tailwind (`display:grid`) — misma especificidad (una sola
  clase), y en el CSS compilado la regla propia aparecía DESPUÉS de
  `.grid-cols-2`, así que ganaba la cascada y pisaba
  `grid-template-columns` con `repeat(auto-fill, minmax(260px,1fr))` en
  vez de `repeat(2, minmax(0,1fr))` — con el ancho del formulario, eso
  colapsa a una sola columna. Verificado bajando el CSS real de
  `www.domuscrm.app` y comparando el orden de las dos reglas byte a byte.
- **Alcance real, más ancho de lo que parecía:** esta colisión pisaba
  CUALQUIER `grid grid-cols-N` **sin** prefijo de breakpoint en todo el
  sitio, no solo el formulario de registro — `admin/properties/page.tsx:243`
  (`grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4`, el grid de
  propiedades del panel) tenía el mismo problema en su layout base/mobile.
  Se corrige solo con este fix, sin tocar ese archivo.
- **Fix:** se borró la regla `.grid` de `globals.css` — confirmado sin
  ningún consumidor real (`grep` de `className="grid"` bare: cero
  resultados en todo `src/`). No se renombró porque no hacía falta
  conservarla.
- **Riesgo:** confirmado bajo — typecheck y jest limpios; el layout de
  tarjetas de propiedad sigue intacto porque usa `.ei-grid`, nunca `.grid`.

---

## Estado 15-ago-2026

Sesión de "avancemos con lo pendiente". Se corrigió la **etapa 1 del fix #2**
(🔴-1) y **🟠-4**, y aparecieron dos hallazgos nuevos al verificar el código,
🟠-3 y 🟠-4, ninguno de los dos reportado por síntoma — salieron de leer el
camino completo.

Hilo que une todo lo de hoy: **el sistema tenía escrito el comportamiento
correcto y no lo ejecutaba.** `verificacion_no_disponible` estaba nombrado en
un comentario y nadie lo emitía; el 403 para "otra inmobiliaria" estaba en un
docstring y no existía en el código. No fue diseño ausente, fue diseño
desconectado.

**Pendiente real:** etapas 2 y 3 del fix #2 — que `sin_entidad` bloquee, y una
sola fuente de membresía para las tres consultas. Ambas necesitan resolver
antes el orden de la reconciliación de identidad, que está documentado arriba.

**Commits:** `auth-sorsabsa@bc38ca1`, `domuscrm@479ea1b`, desplegados. Se
pushea ANTES de la validación en vivo a propósito: no hay ningún tenant real
todavía (EcoInmobiliaria es un nombre de ejemplo en tests y en el `?ctx=` del
login, no una agencia creada), así que no hay a quién romperle nada, y las
pruebas de abajo se hacen sobre el sitio desplegado.

**Validación automatizada de hoy:** auth-sorsabsa typecheck limpio, jest
20/20 (5 nuevos), `next build` OK. DomusCRM typecheck limpio, jest 18/18
(6 nuevos), `next build` OK.

**Falta la validación en vivo (Gina):**

1. Entrar a DomusCRM con una cuenta sin agencia: debe seguir viendo "Sin
   inmobiliaria asociada", igual que antes — nadie que entraba deja de entrar.
2. Con sesión válida, abrir el subdominio de OTRA inmobiliaria: antes salía
   "Ingresa a tu panel" (mentira); ahora debe salir "Tu cuenta no tiene acceso
   a esta inmobiliaria" con el botón de Salir.
3. Con una cuenta de rol `agent`, abrir *Equipo*: mismo cambio, con "Volver a
   mi inventario".
4. En la pestaña Network de `/api/entitlements`, el cuerpo ahora trae `motivo`
   — es lo que faltaba capturar para cerrar del todo el 🔴-1.

## Estado 10-ago-2026

Corregidos hoy, en orden de prioridad ("vamos a empezar a corregir" /
"necesito estabilizarlo"): middleware con validación real, botón de Salir,
replay bug de `auth/complete`, marca en "sin empresa", colisión de `.grid`
(contraseñas + el mismo bug en `admin/properties`), y nombre/apellido
separado. Commits: `domuscrm@13d9176`, `auth-sorsabsa@a3e9c97`,
`domuscrm@407c277`.

**Único pendiente real de esta auditoría:** 🔴-1 fix #2 — fusionar o
unificar el vocabulario de los dos gates de suscripción/empresa. Sigue
siendo un cambio de arquitectura, no un fix chico — necesita su propio
análisis antes de tocarlo, no se mezcla con el resto.

---

## 23-ago-2026 — Medido por primera vez: 7 modales del navegador y un tipo duplicado

DomusCRM entró en el barrido de `ESTANDAR-UI.md` §1 y en el check de
conformidad del ecosistema. **No se tocó código acá**: se midió, y esto
es lo que hay.

### 7 modales nativos, ninguno corregido todavía

| archivo | qué |
|---|---|
| `webs/src/app/admin/network/page.tsx` | `alert()` ×2 (líneas 123, 225) |
| `webs/src/app/admin/clients/new/page.tsx` | `alert()` (181) |
| `webs/src/app/admin/properties/new/components/GeoLocation.tsx` | `prompt()` (111) |
| `webs/src/app/admin/properties/new/components/PortalPublish.tsx` | `alert()` (60) |
| `webs/src/app/admin/properties/page.tsx` | `confirm()` (165) |
| `webs/src/app/admin/team/page.tsx` | `confirm()` (111) |

Los `confirm()` son borrados: al convertirlos hay que **conservar la
protección**, no solo quitar el cuadro. En CondoManager ese fue el error
real de esta tanda —dos borrados quedaron sin confirmación alguna— y está
documentado en `AUDITORIA-CONDOMANAGER.md` 🟠-5. El `prompt()` de
`GeoLocation` pide un dato: necesita un campo en la pantalla, no un botón.

La pieza para hacerlo ya existe y no hay que escribirla:
`ConfirmarAccion` en `@sorsabsa/ui` desde v0.1.56.

### `Notificacion` declarado de nuevo

`webs/src/hooks/useNotifications.ts` declara `interface Notificacion` con
**exactamente los mismos cinco campos** que `@sorsabsa/ui` ya exporta
(`id`, `tipo`, `mensaje`, `leida`, `created_at`). No es un defecto de
comportamiento: es la misma forma mantenida en dos lugares, y el día que
cambie el servicio de notificaciones habrá que acordarse de los dos. Lo
mismo pasa en JustiRed (idéntico) y en CondoManager (que además le suma
`condominio_id` y `usuario_id`, o sea que debería **extender**, no
repetir).

### Lo que sí quedó verificado en verde

Fuera de eso, DomusCRM **no redefine ningún componente** del design
system: no tiene un sistema en paralelo como los que hubo que retirar en
JustiRed (48 componentes) y CondoManager (9).

Pendientes con su plan en `PENDIENTES-ECOSISTEMA.md` §29.
