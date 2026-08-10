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

### 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 (fix #2 sigue pendiente) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador

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

**Lo que todavía no está confirmado con datos (no adivinar):** por qué el
resultado del segundo chequeo (`sin_suscripcion`, entidad SÍ resuelta) fue
distinto al primero (que dejó pasar hacia DomusCRM, consistente con
`bypass: true`, entidad NO resuelta). Candidatos, sin descartar ninguno
todavía: (a) rotación de refresh token de Supabase entre el primer y
segundo `setSession()` con el mismo token ya usado, cambiando qué ve
`getUser()` la segunda vez; (b) alguna condición de carrera en
`resolve_company_for_user()`. **Pendiente de Gina:** repetir el flujo con
las herramientas de desarrollador abiertas (pestaña Network) y capturar el
cuerpo de las dos respuestas de `/api/entitlements` — sin eso, cualquier
causa que se escriba acá sería una suposición, no un hecho verificado.

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

**Fix #2 — ⬜ sigue pendiente:** evaluar si el chequeo de "sin_suscripcion"
(`auth/complete`) y el de "sin_empresa" (DomusCRM) deberían fusionarse en
un solo gate, o al menos compartir un mismo vocabulario de error — hoy son
dos preguntas que en la práctica significan lo mismo para DomusCRM ("¿esta
cuenta tiene acceso real?") pero con dos textos y dos productos distintos
respondiendo. Requiere decisión de arquitectura, no es un fix chico — no
se toca sin su propio análisis.

**Código a eliminar:** ninguno — el fix #1 fue aditivo.

**Riesgo de regresión:** bajo, confirmado — una línea, mismo patrón ya
probado en el propio repo, typecheck y tests limpios.

**Validación:** repetir el flujo completo (login → error → atrás) y
confirmar que la segunda vez ya no re-ejecuta el chequeo — debería quedar
en una pantalla neutra o volver a `/auth/login`, no repetir la verificación
con tokens viejos.

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
- ⬜ `AdminLayout` sigue dibujando el `<aside>` sin condición — quedó sin
  tocar a propósito: con el middleware ya validando en vivo, el caso común
  que disparaba `LoginGate` (sesión vencida) ya no llega a esta pantalla.
  El caso residual (la API devuelve 401 por otra razón, con el middleware
  ya conforme) sigue mostrando `LoginGate` dentro del chasis — más raro
  ahora, pero no imposible. No se resolvió porque cambiar cómo
  `AdminLayout` decide qué dibujar es un cambio de forma, no solo de
  seguridad, y no estaba en el lote de fixes chicos y seguros de hoy.

---

## 🟡 MEDIO

### 🟡-1 — ⬜ Formulario "Crear mi cuenta": falta un campo de apellido separado

- **Archivo:** `crm_inmobiliario/webs/src/app/register/page.tsx:18-26`
- **Código:** `FormData` solo tiene `nombreCompleto: string` — un único
  campo de texto libre, sin separar nombre de apellido.
- **Por qué importa:** cualquier lugar del sistema que necesite tratar el
  apellido por separado (saludos formales, ordenar por apellido en listas
  de equipo, exportes) no puede hacerlo sin parsear un string libre — un
  problema que un segundo campo evita desde el origen.
- **Fix propuesto (no ejecutado):** dividir en `nombre` + `apellido` en el
  formulario y en `/api/registro-agencia`; sigue siendo "un solo insert
  atómico" como pide `ESTANDAR-DESARROLLO.md`, solo con un campo más.
- **Riesgo:** bajo — es alta de cuenta nueva, no migra datos existentes.
  Si `domus.users`/`company_users` ya tiene una columna `full_name` en vez
  de `first_name`/`last_name`, el fix incluye esa migración — a confirmar
  antes de tocar código.

### 🟡-2 — ⬜ Reporte "las dos contraseñas no están en la misma fila" — no reproducido en el código, necesita una captura

- **Archivo:** `crm_inmobiliario/webs/src/app/register/page.tsx:124-127`
- **Código actual:** `<div className="grid grid-cols-2 gap-3">` envolviendo
  ambos campos de contraseña — están codificados para verse en la misma
  fila, sin ningún breakpoint que los apile en mobile (`grid-cols-2` sin
  prefijo aplica en cualquier ancho de pantalla).
- **Por qué no se cierra como "confirmado":** el código dice una cosa, el
  reporte de Gina dice otra — no se descarta el reporte, se pide evidencia
  para no perseguir un bug que quizás no está donde se supone. Candidatos:
  (a) estaba viendo una versión cacheada del sitio antes del último
  deploy (`domuscrm@1338477`, 10-ago-2026); (b) en una pantalla angosta
  las dos columnas se ven tan comprimidas (ícono + label + hint de un solo
  campo) que parecen dos filas aunque técnicamente sean una — un problema
  real, pero de legibilidad en mobile, no de layout roto.
- **Pendiente de Gina:** una captura de pantalla del formulario tal como lo
  ve, o confirmar si recargó forzado (`Ctrl+Shift+R`) antes de mirar.

---

## Pendiente de decidir con Gina antes de ejecutar

- 🔴-1 fix #1 (limpiar el fragment en `auth/complete`) es chico y seguro,
  aplica independiente de todo lo demás — podría ejecutarse ya.
- 🔴-1 fix #2 (fusionar o unificar el vocabulario de los dos gates) es un
  cambio de arquitectura — necesita su propio análisis, no mezclarlo con
  el fix chico.
- 🟠-1 (marca en la pantalla de "sin empresa") es chico y seguro.
- 🟡-1 (nombre/apellido) necesita confirmar primero si hay que migrar una
  columna existente.
- 🟡-2 necesita una captura de Gina antes de tocar nada — evidencia antes
  que código, mismo principio que 🟠-3 de `AUDITORIA-AGENTE24SIETE.md`.
