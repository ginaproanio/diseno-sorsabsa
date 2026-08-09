# Auditoría — portero SSO del ecosistema SORSABSA

**Abierta:** 09-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo de
esta lista se corrige sin presentar antes el análisis de 9 puntos (síntoma,
causa inmediata, causa raíz, componente responsable, código afectado, fix
propuesto, código que se elimina, riesgo de regresión, validación).

**Estado de esta auditoría:** ABIERTA. Si esta sesión se corta, retomar
leyendo este archivo completo antes de tocar código — es la fuente de
verdad de qué está encontrado, qué está corregido, y qué falta.

**Alcance auditado hasta ahora:** `auth-sorsabsa` completo (login, consent,
complete, logout, reset, update-password, register, entity-resolver,
safe-redirect, redirect-allowed, entitlements, send-email hook, apps.ts,
invite-user.mjs) + `iot` (auth_sso.py, editor.py) + comparación contra
`condomanager` (SignOutButton, auth/callback) y `agente24siete/lib/adminAuth.js`
como referencia del patrón ya establecido. **No auditado todavía:**
domuscrm, justired, convertidor (código propio de cada uno, más allá de su
entrada en apps.ts), pagos-sorsabsa en sí.

Leyenda de estado: ⬜ pendiente · 🔧 en análisis (9 puntos presentados,
sin código tocado) · ✅ corregido y verificado · ❌ descartado (no era un
problema real, con motivo).

---

## La cadena que originó esta auditoría (no repetir)

```
IOT nace con Basic Auth propio
  → Fix 1 (08-ago): JWKS stateless + autorización por user_metadata.identidad_iot
    → cuentas de Susana/Patricio creadas EN EL PROYECTO EQUIVOCADO (producto, no identity)
      → Síntoma: bloqueada en /auth/complete ("no pudimos verificar tu cuenta")
        → Fix 2: bypass de entitlements hardcodeado por nombre de app
          → Síntoma: bucle (branding primero, luego el real: callbackUrl nunca se usaba)
            → Fix 3: excepción hardcodeada app==='iot' en /auth/complete
              → Síntoma: reset de contraseña no llegaba a cuentas fuera de identity
                → Fix 4: /auth/reset manda a los DOS proyectos (via=identity/via=producto)
                  → Síntoma: Susana resetea "bien" pero el login sigue fallando
                    → Fix 5: crear cuentas de nuevo en identity + BORRAR las de producto a mano
                      → Síntoma: la federación OIDC crea un usuario NUEVO sin identidad_iot
                        → Fix 6: mapear por email — hardcodeado, y solo en un archivo primero
                          → Síntoma: logout no cerraba nada (no usaba el logout universal)
                            → Fix 7: apuntar logout a /auth/logout
```

Siete parches sobre el mismo problema en menos de 24h. Ninguno era la causa.
La causa raíz es 🔴-1.

---

## 🔴 CRÍTICO

### 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026

**Esta es la causa raíz citada en la cadena de arriba — nunca se había
escrito, solo se nombraba.** Escrita hoy 09-ago-2026 al auditar por qué el
reseteo de contraseña de `puntablanca.ecuador@hotmail.com` (CondoManager)
no arreglaba su login.

- **Síntoma que la destapó:** Gina reseteó su contraseña, el correo llegó
  bien, la pantalla dijo "listo" — y el login siguió fallando con la clave
  nueva.
- **Evidencia real, no lectura de código:** `gyqgorgfstffbgazhbnb`
  (identity) tiene 6 usuarios reales (verificado vía Admin API). Ninguno es
  `puntablanca.ecuador@hotmail.com` ni `andres-pa@hotmail.com` — los dos
  únicos `admin_condominio` reales que existen en CondoManager (verificado
  contra `perfiles`/`residentes` de `twkuidnjwhopbjnrhnxp`).
- **Causa raíz real:** el 07-ago (commit `212f8b9`) se reapuntó el LOGIN de
  CondoManager a validar solo contra identity (Paso 2 de
  `PLAN-DESOLDADO.md`). **Nadie tocó el REGISTRO.** Grep confirmado sobre
  `condomanager/app/`: `registro-admin/route.ts`,
  `register/residente/page.tsx`, `residentes/aprobar/route.ts`,
  `superadmin/admin-condominio/route.ts` y `api/auth/solicitar-reset/route.ts`
  llaman todos a `supabaseAdmin.auth.admin.createUser()` /
  `generateLink()` contra el proyecto de producto (`twkuidnjwhopbjnrhnxp`).
  Cero de esos archivos menciona identity o `gyqgorgfstffbgazhbnb`.
- **Impacto real, no potencial:** no son cuentas viejas desfasadas — es
  **el pipeline activo, hoy**. Cualquier admin o residente que se registre
  en CondoManager ahora mismo queda creado en un proyecto que el login real
  nunca consulta. `auth-sorsabsa/src/app/auth/reset/page.tsx` (🟡-3) le puso
  un parche honesto — mandar el reseteo a los dos proyectos posibles — pero
  eso no crea la cuenta que falta en identity; solo evita filtrar cuál de
  los dos la tiene.
- **Verticales sin este problema, comprobado por grep, no por suposición:**
  `agente24siete`, `crm_inmobiliario/webs` (DomusCRM) y `legaltech`
  (JustiRed) no tienen código de login/registro propio — heredan identity
  sin una línea propia. **CondoManager es el único vertical con auth propio
  todavía vivo, y el único con producto real (Punta Blanca) — por eso es el
  único donde esto se manifestó.**
- **Fix implementado, condomanager commit `b28879c` (09-ago-2026):** el alta
  crea el usuario en identity (`lib/supabase-admin-identity.ts`).
  `perfiles.user_id` es FK local — no puede crearse en el alta — así que
  `residentes.rol_pendiente` (migración nueva) guarda el rol hasta el
  primer login real. `app/api/auth/reconciliar-perfil` (server-side,
  service role) crea o reapunta el `perfil` la primera vez que ese email
  llega federado a `/auth/callback` — cubre tanto el alta nueva como las
  cuentas reales pre-migración (perfil ya existente, `user_id` viejo).
  `app/reset-password` + `api/auth/solicitar-reset` (huérfanos, causa de la
  confusión que destapó esto) se borraron.
- **Validado con una petición real, no lectura de código:** registro de
  prueba contra producción (`qa-condomanager-…@sorsabsa.test`) → usuario
  confirmado en identity, ausente en producto, `residentes.rol_pendiente =
  'admin_condominio'`, sin `perfil`. Login federado simulado con un
  usuario producto real + magic link + token real → `reconciliar-perfil`
  devolvió `{"accion":"creado"}` → `perfiles` con el `user_id` federado
  correcto y `rol_pendiente` limpio. Datos de prueba borrados de ambos
  proyectos al terminar.
- **No resuelto todavía (fuera del alcance de este fix):** el cron
  `limpiar-no-confirmados` sigue listando usuarios no confirmados solo en
  el proyecto de producto — desde este fix, los nuevos registros no
  confirmados viven en identity, así que ese cron ya no los va a encontrar.
  Impacto bajo (housekeeping, no bloquea login), pendiente aparte.

### 🔴-5 — ✅ agente24siete: nadie puede loguearse, la federación con identity nunca se registró ahí — RESUELTO 09-ago-2026

- **Encontrado:** 09-ago-2026, al intentar armar una cuenta de prueba para
  la revisión de Meta (Sorsabsa Asistente / agente24siete).
- **Evidencia real:** `auth.sso_providers` vacío en el proyecto
  `nwcqaginlnzjlkgwifas` (agente24siete). Un solo usuario en toda la base
  (`puntablanca.ecuador@hotmail.com`, `provider: email`, último login
  27-jul-2026 — ANTES de este esquema). `lib/identity.ts` ya documentaba
  esto: *"Hoy solo condomanager lo tiene dado de alta... "* — nunca
  mencionó a agente24siete. `app/admin/LoginGate.tsx` y
  `app/portal/LoginGate.tsx` mandan directo a `auth.sorsabsa.com`, sin
  formulario propio de respaldo.
- **Impacto:** ahora mismo, **nadie nuevo puede loguearse en agente24siete**
  — ni un cliente real, ni un revisor de Meta para la App Review en curso.
  El README decía "re-verificado 08-ago-2026", pero solo se verificó que
  el CÓDIGO existe (JWKS, lib/adminAuth.js) — nunca que un login real
  hubiera funcionado de punta a punta. Cero evidencia de que alguna vez
  funcionó.
- **Bloquea:** la sección "Instrucciones de prueba" de la revisión de
  Meta para Sorsabsa Asistente — no se puede dar una cuenta de prueba
  funcional hasta que esto se resuelva.
- **Fix pendiente de decidir:** registrar el proveedor OIDC personalizado
  en el proyecto de agente24siete (Supabase Dashboard → Authentication →
  Sign In / Providers → Custom Providers, mismo paso que ya existe en
  condomanager) — no se pudo hacer por API/MCP, requiere el dashboard.
  Alternativa más rápida para desbloquear la revisión de Meta sin esperar
  ese fix: crear la cuenta de prueba directamente en el proyecto de
  agente24siete (como está la de Punta Blanca), sin pasar por identity —
  parche aceptable solo para esto, no la solución de fondo.
- **Cierre real, 09-ago-2026, verificado en vivo por Gina:** registrado el
  cliente OAuth en identity (`14c6cdd4-df0f-4a19-824c-8b08a915b4a8`,
  credenciales en `agente24siete/.env.admin.local`) y el proveedor
  `custom:sorsabsa-identity` en agente24siete, mismo patrón que
  condomanager. Cuenta de prueba `eco.ec@outlook.com` recreada en
  identity. En el camino, dos incidentes aparte que bloquearon la
  verificación (ninguno era esto — ver 🔴-2/3 arriba, entrada del
  09-ago-2026): `PAGOS_API_KEY` re-seteada sin necesidad (era 404, no
  401) y `PAGOS_API_URL` con un `/` de más causando el 404 real.
  Corregidos ambos. **Login real de Gina, incógnito, con
  `eco.ec@outlook.com`: llega hasta agente24siete y muestra
  correctamente "💳 Sin suscripción activa"** — el mensaje esperado para
  una cuenta sin plan pago, no un error técnico. Queda cerrado el login;
  para que la revisión de Meta pruebe funcionalidad completa (no solo
  login), falta decidir si esta cuenta necesita una suscripción activa
  de agente24siete o si "sin suscripción" es aceptable para lo que Meta
  revisa (permisos de WhatsApp, no funciones de pago).
- **Corrección real, mismo día — "sin suscripción" era en sí mismo el
  bug, no un estado válido para este producto.** Al preguntar por qué el
  botón "Ir a pagos" de esa pantalla no funcionaba (`sorsabsa.com/pagos`
  da 404, nunca existió), se encontró la causa de fondo:
  `entity-resolver.ts` chequeaba `pagos-sorsabsa.suscripciones` para
  agente24siete, pero el producto **nunca escribe ahí** — ni siquiera
  llama `crear-trial`. Su modelo real es saldo prepago por EMPRESA
  (`clientes.id`, tabla `movimientos_saldo`, compartido entre todos sus
  negocios/agentes — confirmado en `lib/saldo.js`), recargado vía
  Payphone en `/portal/recargas` — un flujo real que ya funciona, solo
  que nadie lo conectó con el gate de login. Efecto real: **bloqueaba el
  login del 100% de los clientes de agente24siete**, no solo la cuenta
  de prueba — nadie tuvo nunca una fila en `suscripciones`. Fix:
  `agente24siete` ahora bypasea ese chequeo (mismo patrón que
  `iot`/`convertidor`, razón distinta: no es que no haya nada que cobrar,
  es que se cobra por otro camino que no debe bloquear el login).
  `auth-sorsabsa` commit `4478657`. Verificado en vivo: la misma cuenta
  de prueba ahora da `200 {"active":true,"bypass":true}`.

### 🔴-6 — ⬜ IMPORTANTE, marcado por Gina: el bypass de 🔴-5 desconecta el único uso real de `pagos.suscripciones` — los días ganados por el programa de referidos

- **Encontrado:** 09-ago-2026, explicado por Gina al justificar por qué el
  login SÍ debía validar contra la suscripción — no era arbitrario.
- **Evidencia real, en el propio código:** `agente24siete/pages/api/portal/referidos.js`,
  comentario del archivo: *"quien arrienda el servicio es quien refiere:
  el sujeto es el CLIENTE del portal (la entidad que paga), resuelto de
  la sesión — **la recompensa son días de SU suscripción**."* Cuando un
  referido se convierte (primer pago real), `pagos-sorsabsa` extiende
  `suscripciones` para el referidor (mismo mecanismo que
  `api/extender-suscripcion.js` / `api/confirmar.js`).
- **El problema real:** en TODO agente24siete, el único consumidor de
  `pagos.suscripciones` era el gate de login en `auth-sorsabsa` — el
  mismo que 🔴-5 bypaseó porque bloqueaba al 100% de los clientes desde
  el día uno (nadie llama `crear-trial`, nadie tiene fila inicial). Con
  el bypass, cualquiera entra tenga o no días ganados por referir.
  `registrarConsumo` (lo que cobra el uso real de la IA, en
  `lib/saldo.js`) solo lee `clientes.plan_id` para el markup — **nunca
  lee `pagos.suscripciones`**. Los días de suscripción ganados por
  referir quedan registrados en la base, pero no producen ningún efecto
  visible o funcional en ningún lugar de la app.
- **No revertir 🔴-5** — sin el bypass, el bug original (100% de clientes
  reales bloqueados desde el primer login, antes de poder referir a
  nadie) vuelve. El login no es el lugar correcto para este chequeo de
  todas formas: un cliente sin suscripción/saldo necesita poder entrar
  igual para recargar o para invitar referidos — bloquearlo en el login
  bloquea el propio programa que se quiere premiar.
- **Fix pendiente de decidir (requiere a Gina — qué debe otorgar
  exactamente un día de suscripción ganado):** conectar
  `pagos.suscripciones` a algo real DENTRO de agente24siete en vez del
  login — candidatos, a definir: (a) `registrarConsumo` aplica
  `markup_uso = 1` (sin recargo) mientras la suscripción esté activa,
  (b) los días ganados se traducen a saldo acreditado directo (mismo
  mecanismo que `webhook-recarga`), (c) desbloquean `negocios_incluidos`
  extra del plan. Sin esta decisión, el programa de referidos de
  agente24siete no tiene ningún premio real hoy.

- **Archivo:** `auth-sorsabsa/scripts/invite-user.mjs` (el proceso) + `iot/auth_sso.py` (la consecuencia)
- **Problema:** ningún componente decide "esta persona debe existir en identity, con estos atributos, con acceso a este producto" — lo decide quien corre el script a mano.
- **Impacto:** causa raíz de toda la cadena de arriba. Pasó dos veces (Susana y Patricio).
- **Solución arquitectónica:** endpoint gobernado en el portero que garantice alta SIEMPRE en identity, con el rol/producto en una tabla real (no en `user_metadata` de un JWT), y que cada producto consulte esa tabla o reciba el claim vía un Custom Access Token Hook configurado explícitamente — nunca inventando su propio criterio.
- **Código a eliminar:** `invite-user.mjs` como mecanismo de alta real (puede quedar como utilidad de emergencia).

### 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada

- **Archivos:**
  `auth-sorsabsa/src/app/api/entitlements/route.ts:47-50` — `if (!pagosUrl) return { active: true, simulated: true }`
  `auth-sorsabsa/src/lib/entity-resolver.ts:27` — `if (!db) return { subject: userId }`
- **Estado de la investigación (09-ago-2026), corregido:** `PAGOS_API_URL` y
  `PAGOS_API_KEY` existen en Vercel producción, marcadas como "Sensitive"
  — Vercel devuelve el literal `[SENSITIVE]` en cualquier lectura (CLI,
  dashboard, incluso al dueño de la cuenta): el valor real es
  **irrecuperable por diseño**, no es que falte. El chequeo de "no empieza
  con https://" de la primera pasada medía ese placeholder, no el valor
  real — hallazgo descartado, no aplica.
- **Evidencia independiente de que SÍ está bien conectado:** `pagos-sorsabsa`
  es un servicio real, desplegado en Railway
  (`https://pagos-sorsabsa-production.up.railway.app`, activo desde
  29-jul-2026, confirmado respondiendo ahora — `200` en `/`, `405` en
  `/api/entitlements` vía GET, coherente con una ruta que exige POST+Bearer).
  Su propio README confirma que YA está integrado con código real:
  `condomanager/app/api/registro-admin/route.ts` y
  `condomanager/app/api/superadmin/suscripcion-condominio/route.ts` lo
  llaman en producción. No hay evidencia de que el fallback "simulated"
  esté disparándose hoy — probablemente el motor de pagos SÍ está conectado.
- **Lo que sigue siendo un hallazgo real (independiente de si hoy funciona):**
  el código en sí mismo no distingue "no configurado" de "configurado y
  válido" — si `PAGOS_API_URL` se borrara por accidente en Vercel mañana,
  el sistema empezaría a aprobar todo en silencio, sin ninguna alerta. Eso
  no depende de si hoy está bien seteada.
- **Fix propuesto (sin cambios):** distinguir "no configurado en
  desarrollo" de "falta en producción" por entorno explícito, no por
  ausencia de variable — en cualquier entorno no-desarrollo, sin
  `PAGOS_API_URL` debe bloquear con motivo claro, nunca aprobar.
- **Riesgo de regresión:** bajo — con la variable realmente seteada (como
  todo indica), este fix no cambia el comportamiento actual, solo lo que
  pasaría si la variable desapareciera.
- **Cierre real, 09-ago-2026:** en el camino se descubrió que nadie tenía
  `PAGOS_API_KEY` guardada en ningún lado recuperable (marcada "Sensitive"
  en Vercel Y en Railway — irrecuperable por diseño de ambas plataformas,
  ni para el dueño de la cuenta). Se roto: valor nuevo generado
  (`openssl rand -hex 32`), actualizado a la vez en los 3 lugares que lo
  necesitan (Railway `pagos-sorsabsa`, Vercel `auth-sorsabsa`, Vercel
  `condomanager`), con redeploy en los tres, y **verificado con una llamada
  real** a `pagos-sorsabsa/api/entitlements`: `401 No autorizado` (key
  vieja) → `200 {"active":false,"reason":"sin_suscripcion"}` (key nueva,
  aceptada). El fix de "falla-cerrado" en el código (distinguir entorno en
  vez de ausencia de variable) sigue pendiente — el hallazgo original del
  código no se tocó, solo se resolvió la credencial perdida que lo bloqueaba.
- **Incidente aparte, NO arquitectónico — 09-ago-2026, prueba real de
  agente24siete con `eco.ec@outlook.com`:** el login llegaba hasta
  `/auth/complete` y ahí fallaba con el mensaje genérico de bloqueo. Logs
  de Vercel mostraron `POST /api/entitlements 502` en cada intento. Primer
  diagnóstico (equivocado, corregido acá para no repetirlo): se sospechó
  de la clave otra vez y se re-seteó `PAGOS_API_KEY` sin necesidad. La
  causa real, encontrada reproduciendo la llamada real de punta a punta
  (sesión real vía Admin API + POST a `auth.sorsabsa.com/api/entitlements`,
  no un curl directo a pagos-sorsabsa que no reproduce el bug): la
  respuesta fue `404`, no `401` — `PAGOS_API_URL` en Vercel tenía un `/`
  de más al final, así que `route.ts` armaba
  `.../up.railway.app//api/entitlements` (doble slash), que Express
  resuelve como ruta inexistente. Corregido re-seteando `PAGOS_API_URL`
  sin el slash y redeploy; **verificado en vivo**:
  `200 {"active":false,"reason":"sin_suscripcion","app":"agente24siete"}`.
  No es un hallazgo nuevo de arquitectura — es un typo de configuración,
  efecto colateral de la rotación de arriba. Queda anotado solo para que
  quien reponga `PAGOS_API_URL` alguna vez sepa: **sin `/` al final.**

### 🔴-4 — ✅ "Funciona por casualidad", admitido en el propio código — RESUELTO 08-ago-2026

- **Archivo:** `auth-sorsabsa/src/app/auth/complete/page.tsx:106-110`
- **Cita textual del comentario:** *"Para las apps Next.js del ecosistema
  eso 'funcionaba' de pura casualidad: su propio cliente de Supabase
  detecta la sesión en CUALQUIER página."*
- **Impacto:** domuscrm, condomanager, justired, agente24siete y convertidor
  no funcionan porque el traspaso de sesión esté bien diseñado — funcionan
  porque `detectSessionInUrl: true` rescata cualquier fragmento por
  accidente. El día que eso cambie en cualquiera de esos clientes, reaparece
  el mismo bug que tuvo IOT, en un producto con clientes reales.
- **Cierre real, commit `c2653e4`:** en vez del `config.callbackUrl`
  incondicional que proponía esta entrada (que hubiera roto a condomanager
  — pisa su `next=` rico con `?redirect=&condominio=&asociacion=`), se usó
  la condición real: `sinDestinoEspecifico = destino === config.redirectUrl`.
  Cualquier producto que llegue sin un `next` específico (no solo iot)
  aterriza en su `callbackUrl` real. Verificado: typecheck/build limpios,
  condomanager preservado (confirmado leyendo su propio `app/login/page.tsx`
  antes de aplicar el fix). Mismo commit que cierra 🟠-1.

### 🔴-7 — ✅ Tres pantallas del portero perdían el resultado de un enlace de correo (fragment) — RESUELTO 09-ago-2026

- **Archivos:** `auth-sorsabsa/src/app/auth/login/page.tsx`,
  `auth-sorsabsa/src/app/oauth/consent/page.tsx`, `condomanager/app/login/page.tsx`.
- **Síntoma real (Gina, `puntablanca.ecuador@hotmail.com`):** clic en
  "Google" → `authorization not found` en pantalla, en inglés; funcionaba
  solo en incógnito. Registro nuevo → correo de confirmación en inglés
  ("Email not confirmed"), y al confirmarlo, la misma pantalla de error.
- **Causa raíz:** Supabase devuelve el resultado de un enlace de correo
  (confirmación, y cualquier cosa que redirija con sesión) como **fragment**
  de la URL (`#access_token=...` si funcionó, `#error=...` si el enlace ya
  venció o se usó — ej. el escáner de enlaces de Hotmail/Outlook
  consumiéndolo antes del clic humano) — nunca como query string. Tres
  pantallas usadas como `redirect_to`/`emailRedirectTo` real
  (`condomanager/login` por `registro-admin`, `auth-sorsabsa/auth/login`
  por el `signUp()` de DomusCRM) no miraban el fragment: lo pisaban con un
  reinicio ciego del login (`irAlSSO()` / `signInWithOAuth()`), perdiendo
  tanto la sesión válida como el error real. `/oauth/consent` además
  mostraba el `.message` crudo de Supabase sin traducir para cualquier
  error que no fuera "Invalid login credentials".
- **Componente responsable:** el portero, no cada producto — mismo patrón
  ya resuelto para IOT en `auth-sorsabsa/src/app/page.tsx` (08-ago-2026),
  nunca generalizado a las otras tres pantallas que tienen el mismo problema.
- **Fix:** las tres pantallas ahora inspeccionan el fragment antes de
  decidir algo — `access_token` reenvía a instalar sesión (en
  `condomanager/login`, a `/auth/callback`, que ya sabe reconciliar+resolver;
  en `auth-sorsabsa/auth/login`, se instala en `identityClient` antes de
  pedir la autorización del producto, así `/oauth/consent` la encuentra y
  aprueba sola); `error` muestra un mensaje traducido en vez de reiniciar a
  ciegas. `/oauth/consent`: si `getAuthorizationDetails`/`approveAuthorization`
  fallan porque la autorización murió (vencida/ya consumida/reabierta desde
  una pestaña o enlace viejo), reintenta UNA vez pidiendo una autorización
  nueva en `/auth/login` en vez de mostrar un callejón sin salida; el resto
  de mensajes de Supabase se traducen con una sola fuente
  (`auth-sorsabsa/src/lib/traducir-error.ts`, consolidó el mapa duplicado
  que ya tenía `page.tsx`).
- **Commits:** `auth-sorsabsa@3a157d7`, `condomanager@46d76fe`.
- **Validación:** typecheck limpio en los dos repos. Pendiente: reproducir
  en vivo con Gina (login normal, sin incógnito, y un registro nuevo con
  confirmación por correo) — no se forzó ningún login para no interferir
  con su propia prueba en curso.
- **JustiRed e IOT (Railway) — verificado que NO tienen este bug, no solo
  supuesto:** grep completo sobre `legaltech` e `iot` (los dos repos, todo
  el código fuente) — cero coincidencias de `signUp(`, `admin.createUser`,
  `generateLink` o `redirectTo`/`redirect_to`. Ninguno de los dos genera
  enlaces de correo propios; sus cuentas nacen solo por el script
  compartido `invite-user.mjs`, que ya apunta a `/auth/complete` — pantalla
  que YA leía el fragment correctamente antes de este fix (es su función:
  instalar `#access_token=...` o mostrar `error_description` si vino mal).
  Con esto, los 6 productos del ecosistema quedan cubiertos: los que tienen
  registro propio (CondoManager, DomusCRM) por el fix de hoy; los que no
  (agente24siete, JustiRed, IOT, Convertidor) porque su único punto de
  entrada por correo nunca tuvo el problema.

### 🔴-8 — ⬜ El Send Email Hook de `sorsabsa-identity` dejó de llamarse — todo correo automático de identity llega sin marca

- **Síntoma real (Gina, 09-ago-2026):** el correo de "recuperar contraseña"
  llegó con remitente/plantilla de Supabase, no de Resend/marca del producto.
- **Evidencia, no lectura de código:**
  1. `get_logs(gyqgorgfstffbgazhbnb, auth)`: evento `mail.send` de las 15:18:12
     (el reseteo de Gina) con `mail_from: noreply@mail.app.supabase.io`.
     Mismo patrón en un `mail.send` tipo `confirmation` de las 12:52:35 —
     **no es solo el reseteo, es todo correo automático que sale de identity**
     (`resetPasswordForEmail`, `signUp` público).
  2. Vercel runtime logs de `auth-sorsabsa`, ruta `/api/auth-hook/send-email`:
     a las 11:35:50 SÍ fue llamada y respondió 500 — `"Resend rechazó el
     envío: API key is invalid"` (la clave vieja de auth-sorsabsa,
     corregida hoy más temprano en esta misma sesión).
  3. A las 15:18:12 (14 min después de un redeploy de auth-sorsabsa que ya
     llevaba la clave corregida) **la ruta no aparece llamada — cero logs**.
- **Causa raíz probable (no verificable con las herramientas disponibles —
  el toggle del hook vive en Supabase Dashboard, no en Postgres ni en el
  repo):** los fallos repetidos de la clave vieja llevaron a Supabase a
  desactivar el Send Email Hook automáticamente (comportamiento documentado
  de Supabase para Auth Hooks que fallan seguido, para no bloquear
  login/reseteo real). Corregir la clave no lo reactiva solo.
- **Por qué importa más de lo que parece:** desde 🔴-1 (hoy), TODO alta y
  reseteo real pasa a nacer/resolverse en identity — este hook dejando de
  andar significa que, de acá en adelante, cada vez más correos de auth
  reales van a salir sin marca hasta que se reactive.
- **Fix — fuera de mi alcance con las herramientas actuales:** Supabase
  Dashboard → proyecto `sorsabsa-identity` → Authentication → Hooks →
  Send Email Hook → verificar que esté encendido (URL esperada:
  `https://auth.sorsabsa.com/api/auth-hook/send-email`, secreto =
  `SEND_EMAIL_HOOK_SECRET` de Vercel/auth-sorsabsa). Pendiente de que Gina
  lo confirme/reactive y de volver a verificar con un `mail.send` nuevo que
  ya no diga `noreply@mail.app.supabase.io`.
- **Corrige a `ARQUITECTURA-ECOSISTEMA.md`:** la sección "Quién manda qué
  correo" decía que el hook está "configurada idénticamente" en los dos
  proyectos — eso describe cómo se armó, no el estado actual. Ahora mismo,
  en identity, no está actuando.

---

## 🟠 ALTO

### 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026

- **Archivo:** `auth-sorsabsa/src/app/auth/complete/page.tsx:122`
- **Código (viejo):** `const destinoFinal = app === 'iot' && config.callbackUrl ? config.callbackUrl : destino;`
- **Causa raíz:** `callbackUrl` existe en `AppConfig` para los 6 productos,
  documentado como "el destino real tras el login", pero el código nunca lo
  consultaba para nadie. Se corrigió para uno solo en vez de arreglarlo
  para todos.
- **Componente responsable:** el portero (`/auth/complete`), no cada producto.
- **Cierre real, commit `c2653e4`:** eliminado el `app === 'iot' &&` —
  reemplazado por `sinDestinoEspecifico = destino === config.redirectUrl`
  (ver detalle en 🔴-4, mismo fix). Ya no hay ningún nombre de producto
  hardcodeado en esta condición.

### 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto

- **Archivo:** `auth-sorsabsa/src/lib/entity-resolver.ts:51`
- **Código:** `if (app === 'iot' || app === 'convertidor') { return { subject: null, bypass: true }; }`
- **Problema:** decisión de negocio ("este producto no cobra") implementada
  como lista de nombres en una función técnica.
- **Fix:** campo declarativo en `AppConfig` (ej. `billable: boolean`,
  default `true`).
- **Código a eliminar:** el `if` con nombres de producto en
  `entity-resolver.ts` y el gemelo en `api/entitlements/route.ts:42`.
- ⚠️ **Empeorado, no arreglado, 09-ago-2026:** el fix de 🔴-5 agregó
  `agente24siete` a esta MISMA lista (`if (app === 'agente24siete') {
  return { subject: null, bypass: true }; }`) — necesario en el momento
  para desbloquear el login real de un producto entero, pero es
  exactamente el mismo antipatrón que este hallazgo ya señalaba. Tres
  nombres hardcodeados ahora, no dos. El fix declarativo (`billable:
  boolean` en `AppConfig`) sigue siendo el correcto, y ahora limpia tres
  casos en vez de dos.

### 🟠-3 — ✅ Autorización duplicada en dos archivos de IOT — CORREGIDO 09-ago-2026

- **Archivos:** `iot/auth_sso.py` (`identidad_actual`) y `iot/editor.py` (`auth_callback_verify`)
- **Qué pasó:** dos copias independientes de la misma regla. Al arreglar la
  primera esta sesión, la segunda quedó rota un rato — confirmó el patrón
  en vivo.
- **Corregido:** ambas usan ahora `identidad_por_email()` en `auth_sso.py`
  como única fuente. Commits `8e7eef6`/`e75ef1f` en el repo `iot`.
- **Pendiente de este hallazgo:** ver 🟠-4 — la función única sigue
  hardcodeada, no es la solución final.

### 🟠-4 — ⬜ `IDENTIDADES_POR_EMAIL` hardcodea dos emails en código fuente

- **Archivo:** `iot/auth_sso.py`
- **Problema:** exactamente lo que la auditoría prohíbe — dos emails
  literales en una constante Python. Mejor que depender de un campo que no
  viaja (🟠-3), pero no es la solución arquitectónica.
- **Comparación con el estándar real:** `agente24siete/lib/adminAuth.js`
  resuelve la misma pregunta contra una **tabla real**
  (`SELECT id, email, nombre FROM usuarios WHERE email = $1`), no una
  constante en código.
- **Fix:** IOT necesita una tabla propia (o consultar una tabla central de
  autorizaciones en identity), no una constante — para que la 3ª persona
  con acceso no requiera un deploy de código.

### 🟠-5 — ✅ CondoManager tenía DOS logouts locales — ambos corregidos

- **Parte 1 (`DashboardShell.tsx`, pantalla "sin condominio"):** ya corregida
  el 08-ago-2026 (commit `b84f771`), antes de que esta auditoría empezara.
- **Parte 2 (`SignOutButton.tsx`, "Salir del sistema" de la barra lateral —
  el que usa cualquier residente/administrador normal):** encontrada HOY
  como bug real y activo (confirmado con `grep`: el componente sí está en
  uso). **Corregida 09-ago-2026, commit `677f478`.**
- **Lo que NO cambió, a propósito:** la regla de negocio de a dónde sale
  cada quien (asociación Punta Blanca → su dominio, condominio con web
  propia → su web, si no → portada) — eso lo sigue decidiendo CondoManager,
  como siempre. Solo cambió quién cierra la sesión de identity: antes nadie
  la tocaba desde este botón, ahora pasa por `/auth/logout?app=condomanager&next=<destino ya calculado>`.
- **Verificado:** typecheck limpio, desplegado, `condomanager.vip` responde.

---

## 🟡 MEDIO

### 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir

Until 09-ago-2026 para "resolver" las cuentas de Susana/Patricio en el
proyecto equivocado. Funcionó porque se verificó antes que no había foreign
keys de iot hacia esos UUIDs, pero es exactamente lo que la regla de
desarrollo prohíbe. Se resuelve de raíz cuando 🔴-1 esté cerrado — no debería
volver a ser necesario.

### 🟡-2 — ⬜ `PROFILE_CHOICES` con nombres reales hardcodeados en editor.py
`iot/editor.py:63-66`. Mismo síntoma que 🟠-4, para datos de negocio (PDF)
en vez de autenticación. Se resuelve junto con 🟠-4 si se migra a tabla.

### 🟡-3 — ⬜ Reset dual (via=identity/via=producto) normaliza el problema en vez de resolverlo
`auth-sorsabsa/src/app/auth/reset/page.tsx`. Honesto y no filtra
información, pero parte de aceptar como normal que una cuenta real exista
en cualquiera de los dos proyectos. Debería poder eliminarse cuando 🔴-1
esté resuelto y no existan más cuentas nuevas fuera de identity.

---

## 🔵 BAJO

### 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio
No es auth, es infraestructura. Ya documentado, no urgente.

### 🔵-2 — ⬜ Fallback basado en el texto de un error de un proveedor externo
`invite-user.mjs`: `if (error?.message?.includes('already been registered'))`.
Frágil por diseño, bajo impacto mientras el script sea manual.

---

## Próximo paso

🔴-1, 🔴-2/3, 🔴-4/🟠-1, 🔴-5, 🔴-7, 🟠-3 y 🟠-5 cerrados y verificados
(09-ago-2026; 🔴-7 pendiente de reproducir en vivo con Gina, ver su
entrada). Nuevo y abierto, requiere acción de Gina en el dashboard de
Supabase (fuera del alcance de las herramientas de esta sesión): 🔴-8, el
Send Email Hook de identity dejó de llamarse — todo correo automático de
identity sale sin marca. Quedan abiertos además, en orden de severidad:
🔴-6 (referidos de
agente24siete sin premio real — requiere decisión de Gina, marcado
importante), 🟠-2 (empeorado el 09-ago: 3 nombres hardcodeados en vez de
2 — el fix declarativo sigue pendiente y ahora limpia más), 🟠-4, 🟡-2,
🟡-3 (debería poder eliminarse ahora que 🔴-1 está cerrado — no debería
haber más cuentas nuevas fuera de identity, pendiente de confirmar con
uso real), 🔵-1, 🔵-2. El fix de código de 🔴-2/3 (falla-cerrado explícito
por entorno) sigue pendiente — solo se resolvió la credencial perdida que
bloqueaba verificarlo, no el patrón de fallback en sí. Pendiente aparte,
bajo impacto: el cron `limpiar-no-confirmados` de CondoManager solo mira
el proyecto de producto — desde el fix de 🔴-1 no va a encontrar los
registros nuevos sin confirmar (viven en identity).
