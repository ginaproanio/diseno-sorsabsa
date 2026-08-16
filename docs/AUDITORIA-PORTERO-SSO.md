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
como referencia del patrón ya establecido. **10-ago-2026:** agregado el
gate propio (middleware/LoginGate/logout) de `domuscrm` (`crm_inmobiliario/webs`)
y `justired` (`legaltech`) — ver 🔴-11. **No auditado todavía:** `convertidor`
(no es producto hoy, ver `ARQUITECTURA-ECOSISTEMA.md`), pagos-sorsabsa en sí.

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

### 🔴-6 — ✅ RESUELTO 09-ago-2026 (falta solo probar en vivo un mensaje real) — el bypass de 🔴-5 desconecta el único uso real de `pagos.suscripciones` — los días ganados por el programa de referidos

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
- **Decisión de Gina, 09-ago-2026 (ninguno de los 3 candidatos de
  abajo — más simple):** agente24siete debe tener una suscripción REAL,
  igual que el resto de los productos — no una que module el markup del
  saldo (candidato a), ni que se traduzca a saldo (candidato b), ni que
  desbloquee cupos del plan (candidato c). Dos capas independientes,
  compuestas, no una sustituyendo a la otra: **suscripción = si el
  cliente tiene cuenta activa** (igual que CondoManager/DomusCRM/
  JustiRed), **saldo = consumo de IA, recargable en cualquier momento**
  (ya funciona, no se toca). Con esto, un día ganado por referir vuelve
  a significar exactamente lo mismo que en cualquier otro producto:
  un día más antes de que la suscripción venza — sin inventar una
  conversión especial para agente24siete. Ver `ARQUITECTURA-ECOSISTEMA.md`
  §1 (fila Suscripciones) para el modelo de 3 primitivos completo
  (Suscripciones + Créditos/Saldo + Referidos) y `PENDIENTES-ECOSISTEMA.md`
  #16 para el plan de construcción.
- *(Candidatos descartados, dejados para no repetir el análisis si se
  reconsidera):* (a) `registrarConsumo` aplica `markup_uso = 1` (sin
  recargo) mientras la suscripción esté activa, (b) los días ganados se
  traducen a saldo acreditado directo (mismo mecanismo que
  `webhook-recarga`), (c) desbloquean `negocios_incluidos` extra del
  plan.
- **Qué bloquea exactamente una suscripción vencida/inexistente —
  decidido y construido:** no se revirtió el bypass del login (🔴-5) —
  sigue correcto, un cliente sin suscripción activa debe poder entrar
  igual para recargar saldo o invitar referidos. El gate real quedó
  DENTRO de agente24siete: `lib/brain.js`, `generarRespuesta()` consulta
  `pagos.suscripciones` (vía `tieneSuscripcionActiva()`, nuevo en
  `lib/pagosCliente.js`) ANTES de llamar a Claude — si no está activa, no
  se gasta ni se cobra, se responde `SUSCRIPCION_INACTIVA_MESSAGE`
  (`config/prompts.js`) en vez de generar una respuesta real.
- **Construido (`agente24siete@57cfd58`):** alta nueva llama
  `crear-trial` (15 días); `tieneSuscripcionActiva()` falla-cerrado
  (niega por defecto si no puede verificar, mismo principio que ya
  declara `pagos-sorsabsa/api/entitlements.js` y que ya usa CondoManager
  para este mismo chequeo). Script `scripts/backfill-suscripciones.mjs`
  para los clientes que ya existían (dry-run por defecto, `--confirm`
  para escribir, idempotente).
- **Backfill corrido en vivo, 09-ago-2026, por Gina:** `1 clientes
  encontrados... [backfillado, 365d] 4 — COMITE PRO MEJORAS SECTOR 46 DE
  PUNTA BLANCA... Resumen: 0 ya activos, 1 backfillados, 0 fallidos.` El
  único cliente real de agente24siete (Punta Blanca, que además de
  CondoManager también es cliente de agente24siete) tiene ahora su fila
  real en `pagos.suscripciones`, sin que se le cortara el servicio.
- **Hallazgo aparte, en el camino — 3 variables de entorno marcadas
  "Sensitive" en Vercel bloquearon el proceso más de lo esperado:**
  `DATABASE_URL`, `PAGOS_API_URL` y `PAGOS_API_KEY` de `agente24siete`
  estaban marcadas "Sensitive" en Vercel — `vercel env pull` nunca
  entrega el valor real de una variable Sensitive, siempre baja el
  placeholder literal `"[SENSITIVE]"`, sin avisarlo (no hay ningún error
  ni warning distinto a como se ve un valor real). Causó una ronda larga
  de diagnóstico persiguiendo un `getaddrinfo ENOTFOUND base` que en
  realidad era pg intentando parsear la palabra `[SENSITIVE]` como
  cadena de conexión. Gina reemplazó los 3 valores a mano (leyéndolos
  del propio dashboard de Vercel, que sí los revela) tanto en el archivo
  local como en Vercel Production/Preview, con redeploy. **Vale la pena
  recordar esto la próxima vez que un `vercel env pull` para una var
  Sensitive dé un error que no tiene sentido — no es que el valor
  guardado esté mal, es que el CLI nunca lo entrega.**
- **Bloqueado, no por esto — ver #15 de `PENDIENTES-ECOSISTEMA.md`:**
  la prueba en vivo (mandar un WhatsApp real a Punta Blanca) no se puede
  hacer todavía porque TODAS las cuentas de WhatsApp del portafolio
  siguen desactivadas por Meta (baneo, no relacionado con este hallazgo).
  Código e infraestructura de 🔴-6 quedan **completos y verificados** sin
  esa prueba — la validación de producto queda en espera de que #15 se
  resuelva, no se vuelve a preguntar por esto hasta entonces.
- **10-ago-2026 — auditoría de transversales, pedido explícito de Gina
  ("no hicimos auditoria hasta la relación que establece con los
  transversales"), extendida después a DomusCRM, CondoManager y JustiRed
  aprovechando que salió muy barata en tokens. Primer hallazgo (parcial,
  corregido más abajo):** `agente24siete/pages/api/portal/referidos.js`
  solo llama a `/api/referidos-resumen` y `/api/referidos-invitar` —
  nunca a un paso de "convertir". Igual en DomusCRM
  (`referrals/route.ts`, mismo patrón, y sin ninguna ruta de upgrade-a-
  pago en todo el repo). Se buscó el mismo paso en CondoManager asumiendo
  que ahí sí estaría conectado (`registro-admin/route.ts` sí llama a
  `referidos-registrar` en el alta) — y ahí apareció el hallazgo real,
  más de fondo que el de arriba:
- **La causa raíz no es de ningún producto — es que el paso de "convertir"
  nunca se construyó en `pagos-sorsabsa`, para nadie.**
  `ls pagos-sorsabsa/api | grep referido` → solo existen
  `referidos-codigo.js`, `referidos-invitar.js`, `referidos-registrar.js`,
  `referidos-resumen.js`. **No existe ningún endpoint de conversión.**
  `referidos-registrar.js` (leído completo): inserta/actualiza
  `pagos.referido_invitaciones` con `estado='registrado'` — nunca toca
  `recompensa_dias`, nunca pone `estado='convertido'`. El propio
  comentario del archivo lo admite: *"Este endpoint NO acredita
  recompensas: eso ocurre al CONVERTIR"* — pero ese "CONVERTIR" no
  corresponde a ningún archivo real. **`recompensa_dias` está en el
  esquema de la tabla, se lee en `referidos-resumen.js`, pero no hay
  ningún código en todo el ecosistema que alguna vez lo escriba.** Ni
  CondoManager (el que se creía cerrado de punta a punta) tiene el
  premio funcionando — nadie lo tiene, porque la pieza no existe.
- **Corrige una afirmación ya escrita y pusheada hoy mismo** (en
  `ARQUITECTURA-ECOSISTEMA.md`, fila Referidos): decía "solo CondoManager
  tiene el premio conectado de punta a punta" — **no es cierto**, se
  corrige en el mismo commit que esta nota.
- **Hallazgo aparte, en JustiRed, verificado con código — matiza (no
  descarta) lo que decía `AUDITORIA-JUSTIRED.md`:** `lawyer_subscriptions`
  NO está 100% aislado de `pagos.suscripciones` como se sospechaba —
  `justired-payments-iniciar` pasa `suscripcion: {plan, dias, sujeto}` a
  `pagos-sorsabsa/api/iniciar`, y `api/confirmar.js` SÍ extiende
  `pagos.suscripciones` automáticamente al confirmar el pago (mecanismo
  genérico, no específico de JustiRed). **Pero el `sujeto` que manda es
  `clientTransactionId`** — un string aleatorio nuevo en CADA pago
  (`justired-${Date.now()}-${random}`), no una identidad estable del
  abogado. Como `pagos.suscripciones` extiende por `(producto, sujeto)`,
  cada pago mensual de un mismo abogado crea una fila nueva y
  desconectada en vez de extender la suscripción existente — la
  suscripción del abogado nunca se "acumula", cada mes es, para el
  sistema, una entidad distinta que paga por primera vez. Bug real,
  no ejecutado — el fix es usar un identificador estable del abogado
  (ej. su email o un id propio en `lawyer_subscriptions`) como `sujeto`,
  no el id de la transacción.
- **Nada de esto se ejecutó — todo pendiente de decisión de Gina:**
  (1) construir el endpoint de conversión en `pagos-sorsabsa` (el hueco
  real, afecta a los 4 productos por igual); (2) decidir el evento de
  "conversión" en agente24siete y DomusCRM, que hoy no tienen ni
  siquiera el punto donde engancharlo (ver más abajo, sigue siendo un
  hallazgo real aunque ya no sea "el único"); (3) corregir el `sujeto`
  de `justired-payments-iniciar` para que las renovaciones de un abogado
  se acumulen en la misma fila.

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
- **⚠️ Auto-auditoría, 09-ago-2026 (Gina: "no puede ser que siga en lo
  mismo"): este fix estaba INCOMPLETO — es exactamente el patrón "fix
  sobre fix" que ESTANDAR-DESARROLLO.md prohíbe.** El reenvío de
  `condomanager/login` a `/auth/callback` asumía que cualquier
  `#access_token` llegado ahí ya estaba federado al producto — cierto en
  el camino normal de SSO, falso para un enlace de correo directo, cuyos
  tokens son de identity en crudo. Resultado real, en producción, con
  Gina probando: "No se pudo instalar la sesión." Corregido recién en
  🔴-10 — no se marca como un hallazgo nuevo separado, es la continuación
  de este mismo. La causa de fondo del "fix sobre fix": al escribir este
  fix no distinguí los DOS tipos de sesión que pueden llegar a `/login`
  (ya federada vs. identity cruda) — modelar esa distinción explícitamente
  desde el principio hubiera evitado el segundo síntoma.
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

### 🔴-8 — ⬜ El Send Email Hook de `sorsabsa-identity` NUNCA existió — todo correo automático de identity llega sin marca

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
- **Causa raíz real, confirmada con screenshot de Gina — no la hipótesis
  anterior de esta entrada:** Authentication → Auth Hooks del proyecto
  `sorsabsa-identity` está **completamente vacío** ("Create an auth hook",
  cero hooks configurados). No es que se haya desactivado por los fallos de
  la key vieja (esa fue mi primera hipótesis, verificada como INCORRECTA
  apenas Gina mandó la captura de pantalla real) — **nunca se creó.** La
  frase de `ARQUITECTURA-ECOSISTEMA.md` de que estaba "configurado en los
  dos proyectos" era falsa para identity desde el principio; describía la
  intención de diseño, nunca se verificó en el dashboard real.
- **Por qué importa más de lo que parece:** desde 🔴-1 (hoy), TODO alta y
  reseteo real pasa a nacer/resolverse en identity — sin este hook, todo
  correo automático de identity sale sin marca desde que existe el proyecto,
  no desde hoy.
- **Fix — fuera de mi alcance con las herramientas actuales, acción de
  Gina:** Supabase Dashboard → `sorsabsa-identity` → Authentication → Auth
  Hooks → Add a new hook → **Send Email**, tipo HTTPS, URL
  `https://auth.sorsabsa.com/api/auth-hook/send-email`. Supabase genera un
  secreto nuevo al crearlo — copiarlo a `SEND_EMAIL_HOOK_SECRET` en Vercel
  (auth-sorsabsa, Production+Preview) y redeployar.
- **Sin verificar todavía, a propósito — no repetir el mismo error dos
  veces:** si `verticales_sorsabsa` (el proyecto de producto) SÍ tiene el
  hook configurado. No hay evidencia real de ninguno de los dos lados
  todavía — pendiente de otra captura de pantalla antes de afirmar nada.

### 🔴-9 — ✅ El registro de admin creaba una fila de residente que nadie pidió — RESUELTO 09-ago-2026

- **Síntoma real (Gina, 09-ago-2026):** al registrar un condominio nuevo,
  quedaba creada como `admin_condominio` **y como residente**, con el mismo
  correo, marcada "pasivo" en el dashboard de activación — sin haber
  pedido nunca ser residente de ninguna unidad.
- **Causa inmediata:** `registro-admin/route.ts`, paso "3. Crear residente
  (el admin también es residente)" — insertaba una fila en `residentes`
  para todo admin nuevo, incondicionalmente, con `rol_pendiente:
  "admin_condominio"`.
- **Causa raíz:** el modelo de datos conflaba dos roles distintos
  (administrador del condominio / residente de una unidad) porque
  `residentes` era la única tabla de "personas" disponible para guardar el
  nombre a mostrar y el `rol_pendiente` hasta el primer login. No es un bug
  de hoy — es una decisión de diseño previa a esta sesión (confirmado con
  `git show` sobre el código anterior al fix de 🔴-1), nunca cuestionada.
  El propio código de `mi-perfil/page.tsx` ya asumía lo contrario ("admin_
  condominio y superadmin no tienen fila en residentes") — contradicción
  interna real entre dos archivos, no solo una preferencia de Gina.
- **Por qué la fila creada no tenía sentido, más allá de no haberse
  pedido:** `residentes` no tiene `unidad_id` — la fila del admin quedaba
  flotando, sin unidad asignada, imposible de vincular a nada real.
- **Componente responsable:** `condomanager/app/api/registro-admin/route.ts`
  (creaba la fila) y `app/api/auth/reconciliar-perfil/route.ts` (forzaba
  `residente_id` en el perfil para cualquier rol, sin distinguir).
- **Fix:** el admin ya no tiene fila en `residentes`. `condominios` ganó
  `admin_pendiente_email`/`admin_nombres`/`admin_apellidos` — mismo patrón
  que `residentes.rol_pendiente`, pero para el admin fundador, sin tocar la
  tabla de residentes. `reconciliar-perfil` gana un tercer caso: si el
  email no es residente, busca `admin_pendiente_email` y crea el perfil con
  `residente_id: null`. El nombre a mostrar (`panel/admin/page.tsx`,
  `DashboardShell.tsx`) ahora sale de `condominios.admin_*` cuando no hay
  `residente_id`, en vez de depender de una fila que ya no existe.
  Si en el futuro un admin SÍ quiere ser también residente de una unidad,
  es una acción explícita separada (registro/alta de residente normal) —
  no un efecto colateral automático del alta.
- **Código eliminado:** el paso 3 completo de `registro-admin/route.ts`
  (insert a `residentes` + su rollback).
- **Riesgo de regresión revisado:** grep completo de `residente_id` en el
  repo — todos los demás usos ya estaban condicionados a `rol === "residente"`
  o a que `residente_id` no sea null; ninguno asumía que un admin_condominio
  tuviera uno. `resolverPostLogin` (post-login.ts) ya filtraba el chequeo de
  estado pendiente/rechazado solo para `rol === "residente"` — sin cambios
  ahí.
- **Validación:** typecheck limpio en condomanager. Migración
  `20260809150000_admin_condominio_sin_residente.sql` aplicada en vivo.
  Confirmado en vivo (09-ago-2026): registro de prueba real → cero filas
  nuevas en `residentes`.
- **❌ CORRECCIÓN, 09-ago-2026 — la nota de abajo estaba mal, no la dejo
  para que alguien la crea vigente:** ~~"Revisado contra ESTANDAR-DESARROLLO.md
  §6 — NO es una violación... unificarlas sería sobre-ingeniería"~~. Gina
  preguntó explícitamente "identifica si acaso alguien más ya cumple su
  función" y la respuesta era que SÍ: `domus.registros_pendientes`
  (crm_inmobiliario) ya resolvía este problema exacto — cuenta creada en
  identity, sin vínculo local hasta el primer login — de forma GENÉRICA
  (`email, company_id, role, ...`), horas antes de este mismo commit. No
  era "sobre-ingeniería anticipando un tercer caso": ya existía la
  solución correcta, sin necesidad de anticipar nada. **Fix real:**
  `condominios.admin_pendiente_email` se reemplazó por
  `public.registros_pendientes`, mismo nombre y forma que
  `domus.registros_pendientes`. `admin_nombres`/`admin_apellidos` se
  quedan en `condominios` (nombre a mostrar, dato permanente — eso sí
  estaba bien ahí), pero ahora se llenan al reconciliar, copiados desde
  `registros_pendientes`, no al registrar. Commit `condomanager@8259ff9`.
  typecheck limpio.
- `residentes.rol_pendiente` (para residentes reales) sigue aparte de
  `registros_pendientes` (para el admin) — mayor superficie de cambio,
  deferido a propósito. **Disparador para migrarlo también:** cuando se
  toque `registro-residente`/censo/activación masiva por otra razón real,
  no antes — no abrir ese cambio solo por simetría.

### 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7

**No es un hallazgo independiente — es 🔴-7 terminado de resolver.** Ver la
nota de auto-auditoría en esa entrada: el fix original ahí no distinguía
sesión ya federada de sesión de identity cruda, y ese es exactamente el
bug de acá. Mismo registro de prueba en vivo, tres síntomas seguidos hasta
llegar a la causa real:

1. El enlace de confirmación rebotaba a la pantalla genérica
   "Bienvenida a SORSABSA" — `condomanager.vip` no estaba en el allowlist
   de Redirect URLs de `sorsabsa-identity` (confirmado generando el mismo
   enlace con una cuenta desechable: pedí `redirect_to=condomanager.vip/login`,
   Supabase devolvió `redirect_to=https://auth.sorsabsa.com`). Corregido
   por Gina en el dashboard.
2. Con el dominio ya permitido, el enlace llegaba a `condomanager.vip/login`
   pero daba **"No se pudo instalar la sesión."**

- **Causa real:** `/auth/callback` instala la sesión con el cliente del
  PROYECTO DE PRODUCTO (`setSession`), pero los tokens que trae un enlace
  de confirmación de correo son de IDENTITY en crudo — nunca pasaron por
  la federación OIDC. El propio fix de 🔴-7 (`login/page.tsx`, hoy más
  temprano) reenviaba CUALQUIER `#access_token` detectado a
  `/auth/callback`, asumiendo que ya estaba federado — cierto en el camino
  normal de SSO (que nunca aterriza en `/login` con un hash, siempre llega
  directo a `/auth/callback` desde `/auth/complete`), falso para un enlace
  de correo directo.
- **Fix:** `registro-admin`/`registro-residente` — el `redirectTo` del
  enlace de confirmación apunta DIRECTO a `auth.sorsabsa.com/auth/login`
  (mismo patrón ya probado de DomusCRM), no a `condomanager.vip/login` —
  esa pantalla ya sabe instalar una sesión de identity cruda antes de
  arrancar la federación (mismo fix de hoy que resuelve esto para
  DomusCRM). `login/page.tsx` corregido también, por los enlaces ya
  enviados con el `redirectTo` viejo: el reenvío de `#access_token` ahora
  va a `auth.sorsabsa.com/auth/login`, no a `/auth/callback` local.
- **Commit:** `condomanager@5d49efb`. typecheck limpio.
- **Regla nueva para el futuro (pregunta real de Gina):** ningún otro
  producto necesita su dominio en el allowlist de identity HOY —
  verificado que solo CondoManager tiene código que le pide a Supabase
  volver directo al dominio del producto (`registro-admin`/
  `registro-residente`); todo lo demás (DomusCRM, reseteo, activación
  masiva) ya vuelve a `auth.sorsabsa.com`. El día que otro producto arme
  un registro propio con el mismo patrón directo-al-dominio, va a
  necesitar (a) su dominio en el Redirect URLs allowlist de identity y
  (b) que su `redirectTo` apunte a `auth.sorsabsa.com/auth/login?app=X`,
  no directo a su propio dominio — para no repetir este mismo problema en
  dos pasos.

### 🔴-11 — 🔧 DomusCRM y agente24siete corregidos 10-ago-2026; JustiRed corregido en código 15-ago-2026, pendiente de deploy — El portero está mal implementado en los 4 productos web, y de tres maneras distintas

> **15-ago-2026 — JustiRed (falla nº 3 de las tres):** corregido en
> `legaltech/src/hooks/useAuth.ts`, pendiente de deploy. **No es una copia del
> fix de CondoManager:** ahí el `signOut()` local se *reemplazó* por el logout
> central; en JustiRed hacen falta **los dos, en orden**. Es una SPA y su sesión
> vive en el `localStorage` de `www.justired.com`, que `auth.sorsabsa.com` no
> puede tocar — sin el `signOut()` local, el `access_token` ya emitido sigue ahí
> y `getSession()` lo da por bueno hasta que expire, o sea la app se ve logueada
> después de "salir". Primero se limpia lo local, después el logout central
> cierra identity (que es lo que impide el auto-reingreso silencioso).
>
> **Y al corregirlo apareció la causa de por qué el login de JustiRed no podía
> funcionar:** `apps.ts` la tenía registrada en `justired.app`, un dominio
> **NXDOMAIN** (el real es `www.justired.com`). Análisis completo de 9 puntos en
> [AUDITORIA-JUSTIRED.md](./AUDITORIA-JUSTIRED.md) 🔴-2 — el fix vive en este
> repo (`auth-sorsabsa/src/lib/apps.ts`) y **el logout de JustiRed no se puede
> validar hasta que ese deploy ocurra**: su `next` no pasa la allowlist.

**Origen:** Gina, tras el bug de agente24siete (🔴 en `AUDITORIA-AGENTE24SIETE.md`):
*"por lo visto el portero esta mal implementado en todos los productos, cuando
te dije implementa lo único que hiciste fue conectarlo sin importar como se
conectaba pero implementar es operar y esto no opera"*. Pidió explícitamente
la auditoría completa, no soluciones parciales producto por producto. Esta
entrada cierra el "no auditado todavía: domuscrm, justired" que quedaba
abierto en la cabecera de este documento.

**Método:** mismo chequeo en los 4 productos con panel/área privada:
¿existe `middleware.ts` (gate servidor, antes de renderizar)? ¿valida
presencia o vigencia real de la sesión? ¿el "no autorizado" reemplaza toda
la pantalla o aparece dentro del chasis (sidebar) ya dibujado? ¿existe un
botón de salir, y a dónde apunta?

| Producto | `middleware.ts` | Qué valida | "No autorizado" se ve | Logout |
| --- | --- | --- | --- | --- |
| **CondoManager** | ✅ existe | Sesión real (`getUser()` contra Supabase — vigencia, no solo presencia) | Redirige antes de servir HTML — nunca se ve el panel | ✅ `SignOutButton.tsx` → `auth.sorsabsa.com/auth/logout` |
| **DomusCRM** | ✅ existe (`webs/src/middleware.ts`) | ✅ **10-ago-2026:** ahora valida en vivo contra Supabase (`sesionVigente()`), no solo presencia — commit `domuscrm@13d9176` | ✅ **15-ago-2026:** el "caso residual" tenía nombre y no era el `<aside>` — era un 401 que mentía. `authorizePanel` devolvía `null` tanto para "no hay sesión" como para "sesión válida sin membresía en este tenant", y todo el panel lo leía como lo primero. Corregido en `domuscrm@479ea1b` (401 vs 403, pantalla `AccesoDenegado`); detalle en `AUDITORIA-DOMUSCRM.md` 🟠-4. El `<aside>` sin condicionar sigue igual, pero ya no es el camino por el que se llegaba ahí | ✅ **10-ago-2026:** `SignOutButton.tsx` agregado al sidebar y al menú móvil, mismo commit |
| **agente24siete** | ✅ **10-ago-2026:** `middleware.ts` nuevo, valida vigencia real | ✅ vigencia (middleware) + asociación a cliente/usuario (`whoami`, el caso que middleware no puede cubrir desde Edge) — commits `agente24siete@89429ff`/`63251761`/`87c5216`, causa de fondo cerrada en 🔴-12 | ✅ validado en vivo: cuenta sin cliente → una sola pantalla centrada, sin sidebar, sin bucle | ✅ `SignOutButton.tsx` → `auth.sorsabsa.com/auth/logout`, commit `agente24siete@c6f2578` |
| **JustiRed** | N/A — SPA pura (Vite, sin servidor propio que intercepte antes del HTML) | `supabase.auth.getSession()`/`setSession()` del SDK oficial — vigencia real, correcto para su arquitectura | N/A — no tiene panel privado gateado, solo personaliza el navbar si hay sesión | ✅ **15-ago-2026:** `useAuth.ts::signOut()` limpia el `localStorage` de la SPA y **después** redirige a `auth.sorsabsa.com/auth/logout?app=justired&next=<origin>`. Antes llamaba solo a `supabase.auth.signOut()`. Pendiente de deploy, y bloqueado por 🔴-2 de `AUDITORIA-JUSTIRED.md` (la allowlist apunta a un dominio inexistente) |

**No es un bug copiado 4 veces — son tres fallas distintas, y confirma la
sospecha de Gina sin ser una sola causa:**

1. **Gate ausente por completo** (agente24siete): ni siquiera existe el
   archivo. La causa raíz ya está en `AUDITORIA-AGENTE24SIETE.md` 🔴-1.
2. **Gate presente pero incompleto** (DomusCRM): SÍ hay `middleware.ts`
   real, corriendo en servidor, antes de renderizar — la mitad correcta del
   patrón de CondoManager. Pero solo comprueba que la cookie *exista*, no
   que siga siendo válida (`getUser()` nunca se llama ahí), y el layout de
   abajo dibuja el sidebar sin condición — por eso una sesión vencida (no
   ausente) reproduce el mismo síntoma "chasis + error adentro" que
   agente24siete, aunque por una causa distinta y más angosta.
3. **Logout local en vez de central** (JustiRed): el único de los 4 que SÍ
   tiene botón de salir, pero repite —en un producto que la auditoría
   original de esta cadena (arriba, "Fix 7") ya había encontrado y
   corregido en otro lado— el bug de que un `signOut()` puramente local dejaba
   viva la sesión de identity, causando auto-reingreso silencioso en el
   siguiente login. JustiRed nunca tuvo su propio "Fix 7".

**Lo que SÍ está bien y no hay que tocar:** el gate de JustiRed vía SDK de
Supabase (`getSession`/`setSession`, con auto-refresh) es el patrón correcto
para una SPA sin servidor propio — no necesita ni debe imitar
`middleware.ts`, que no existe como concepto en Vite. Confundir "todos los
productos están mal" con "todos necesitan el mismo fix" repetiría el error
que esta misma auditoría existe para evitar (ver la cadena de 7 parches al
inicio del documento).

**Fix por producto — DomusCRM corregido 10-ago-2026 (pedido de Gina: "en
orden de prioridad domus vamos a empezar a corregir"), agente24siete y
JustiRed siguen pendientes de confirmación, uno por uno, no en bloque:**

- **DomusCRM — ✅ (a) y (c) corregidos, commit `domuscrm@13d9176`:**
  middleware ahora valida sesión real vía Supabase (`/auth/v1/user`, mismo
  patrón que ya usaba `reconciliar-perfil/route.ts`, sin depender de
  `@supabase/ssr` en el middleware); botón "Salir" agregado con el mismo
  contrato central que `SignOutButton.tsx`, adaptado porque DomusCRM guarda
  su sesión en cookies planas (no httpOnly), así que el botón también las
  borra directo antes de redirigir. **(b) queda sin tocar, a propósito:**
  con (a) corregido, el caso común que disparaba `LoginGate` dentro del
  chasis ya no ocurre — cambiar cómo `AdminLayout` decide qué dibujar es
  un cambio de forma para un caso ahora residual, no entró en el lote de
  fixes chicos de hoy.
- **agente24siete — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026:** ver
  `AUDITORIA-AGENTE24SIETE.md` (🔴-1, 🟠-1, 🟠-2, 🟠-3) y 🔴-12 de este
  documento (causa de fondo: verificaba la sesión contra el proyecto
  Supabase equivocado).
- **JustiRed:** `useAuth.ts::signOut()` — antes de/en vez de
  `supabase.auth.signOut()`, redirigir a
  `https://auth.sorsabsa.com/auth/logout?app=justired&next=<destino>`. Es
  el fix más chico de los tres (una función), pero toca el flujo de sesión
  de un producto en producción — confirmar con Gina antes de tocarlo, igual
  que los demás.
- **CondoManager:** ninguno — es la referencia.

**Riesgo de tratarlo como "un solo fix para todos":** cada producto llegó a
este estado por una razón de arquitectura distinta (SSR con middleware vs.
SPA sin servidor), no por copiar código de otro. Un fix genérico (ej. "agregar
`middleware.ts` a JustiRed") sería una solución que no aplica a esa
arquitectura — exactamente el tipo de parche que ESTANDAR-DESARROLLO.md
prohíbe.

---

### 🔴-12 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — agente24siete verificaba su sesión contra el proyecto Supabase equivocado — causa real del bucle que 🔴-1/🟠-3 nunca cerraron

**Origen:** pedido explícito de Gina, 10-ago-2026, después de que el fix de
🔴-1 (middleware + `whoami`) no rompiera el bucle real: *"necesito que...
hagas una auditoria a c:/auth-sorsabsa para saber que esta pasando en
sorsabsa-identity con tanta metida de mano, porque estas personalizando
para cada producto bien pudo algo estar mal fixeado."* Tenía razón: había
algo mal fixeado, y no era chico.

**1. Síntoma:** después de corregir `AUDITORIA-AGENTE24SIETE.md` 🔴-1
(completo, con los 3 casos) y el bug de `next` relativo, el login seguía
en bucle. La consola del navegador mostró el dato decisivo:
`GET https://www.agente24siete.app/api/portal/whoami 401`.

**2. Causa inmediata:** `lib/clienteAuth.js`/`lib/adminAuth.js` verifican
el JWT con `jwtVerify(token, JWKS, { issuer: ISSUER, ... })` donde
`ISSUER = \`${process.env.SUPABASE_URL}/auth/v1\``. **Esa variable, en
Vercel, apuntaba (por indicación mía, en esta misma sesión, antes de este
hallazgo) al proyecto propio de agente24siete (`nwcqaginlnzjlkgwifas`).**
El token real que llega a `/auth/callback` nunca fue emitido por ese
proyecto — `jwtVerify` rechaza cualquier token cuyo `iss` no coincida
exactamente, así que TODO login, sin importar cuántas veces se reintente,
iba a fallar con "Sesión inválida o expirada" — el 🟠-3 que quedó abierto
desde el principio de esta auditoría, nunca diferenciado hasta ahora.

**3. Causa raíz, verificada con datos, no supuesta:**

- `auth-sorsabsa/src/lib/identity.ts` (comentario del propio autor): *"Hoy
  solo condomanager lo tiene dado de alta [el proveedor OIDC] — domus y
  justired son schemas del mismo proyecto, así que quedan cubiertos
  igual."* Y `auth-sorsabsa/.env.example`: `NEXT_PUBLIC_SUPABASE_URL=
  https://twkuidnjwhopbjnrhnxp.supabase.co` (verticales_sorsabsa,
  el proyecto de CondoManager) — es EL ÚNICO proyecto con
  `custom:sorsabsa-identity` registrado como proveedor OIDC. `/auth/login`
  inicia `signInWithOAuth` ahí, no en el proyecto de cada producto.
- Cuando ese login federa contra `sorsabsa-identity`
  (`gyqgorgfstffbgazhbnb`) y vuelve, la sesión que se instala y se
  traspasa por el fragment a CADA producto —incluido agente24siete— es
  **siempre una sesión de `verticales_sorsabsa`**, con `iss =
  https://twkuidnjwhopbjnrhnxp.supabase.co/auth/v1`.
- **Verificado con una consulta real a las dos bases:**
  `nwcqaginlnzjlkgwifas.auth.users` — CERO filas para
  `gina.proanio76@gmail.com`. `twkuidnjwhopbjnrhnxp.auth.users` — SÍ
  existe, `last_sign_in_at` coincidiendo al segundo con la prueba en vivo
  de Gina. La cuenta federada real nunca vivió en el proyecto propio de
  agente24siete — vive en `verticales_sorsabsa`, como el resto del
  ecosistema.
- **Por qué nadie lo había notado hasta ahora:** CondoManager, DomusCRM y
  JustiRed son *schemas dentro del mismo proyecto* `verticales_sorsabsa` —
  para ellos, "verificar contra el proyecto correcto" es automático, ni
  siquiera es una decisión. **agente24siete es el único producto del
  ecosistema con un proyecto Supabase propio y separado
  (`nwcqaginlnzjlkgwifas`)** — el único lugar donde "¿contra qué proyecto
  verifico el JWT?" es una pregunta real, y la única respuesta que existía
  en código (un comentario, no una fuente de verdad) estaba mal.
- **El comentario que indujo el error, corregido hoy:**
  `agente24siete/lib/supabaseAdminIdentity.js` decía *"proveedor OIDC
  registrado en el proyecto propio nwcqaginlnzjlkgwifas"* — copiado del
  mismo texto de `identity.ts` sin ajustar a la realidad de agente24siete.
  Ese comentario fue la fuente directa de mi propio error hoy: configuré
  `SUPABASE_URL`/`SUPABASE_JWKS_URL` de agente24siete contra su proyecto
  propio, confiando en un comentario en vez de verificar contra la fuente
  real (`identity.ts` + `.env.example` + datos). Exactamente el error que
  ESTANDAR-DESARROLLO.md pide evitar: "dos componentes deciden distinto
  sobre el mismo concepto" (§ Fuente única de verdad) — acá se resolvió
  confiando en el componente equivocado.

**4. Componente responsable:** `agente24siete/lib/clienteAuth.js` y
`lib/adminAuth.js` (verifican contra el proyecto equivocado); el
comentario de `supabaseAdminIdentity.js` que lo indujo, ya corregido
(commit `agente24siete@7f2d945`).

**5. Código afectado:** ninguno de lógica — es exclusivamente
configuración (`SUPABASE_URL`/`SUPABASE_JWKS_URL` en Vercel, proyecto
`agente24siete`) más el comentario ya corregido.

**6. Fix — NO ejecutado, valores verificados y listos:**

| Variable | Valor correcto |
| --- | --- |
| `SUPABASE_URL` | `https://twkuidnjwhopbjnrhnxp.supabase.co` |
| `SUPABASE_JWKS_URL` | `https://twkuidnjwhopbjnrhnxp.supabase.co/auth/v1/.well-known/jwks.json` |

Verificado que el endpoint JWKS responde 200. **Esto reemplaza al valor
que esta misma sesión indicó pegar antes** (`nwcqaginlnzjlkgwifas`),
confirmado incorrecto con los datos de arriba.

**7. Código a eliminar:** ninguno.

**8. Riesgo de regresión:** bajo — es corregir una variable de
configuración a un valor verificado con datos reales, no un cambio de
lógica. El comentario que indujo el valor equivocado ya no existe.

**9. Validación — ✅ hecha en vivo por Gina, 10-ago-2026:** valores
pegados en Vercel (Production y Preview), redeploy, login completo
repetido con la cuenta de prueba (sin cliente asociado). Resultado:
**una sola pantalla centrada, marca correcta, sin sidebar, sin volver a
rebotar contra `auth.sorsabsa.com`** — el mensaje `Cuenta sin cliente
asociado` apareciendo exactamente como debía, la primera vez en toda
esta cadena que el sistema se comportó como se diseñó.

**Segundo hallazgo, descubierto por este mismo fix (no antes posible):**
una vez que la verificación de JWT empezó a pasar, apareció un error
NUEVO y real detrás — `Error: getaddrinfo ENOTFOUND
db.nwcqaginlnzjlkgwifas.supabase.co` en `whoami`, `dashboard` y
`reconciliar-cliente` (confirmado con `get_runtime_errors` de Vercel, no
adivinado). Estaba oculto: antes de este fix, el login nunca pasaba de
la verificación de JWT, así que el código que consulta `clientes` jamás
se ejecutaba. **Causa:** `DATABASE_URL` usaba el hostname de conexión
directa (`db.<proyecto>.supabase.co`), que requiere IPv6 — las funciones
serverless de Vercel no siempre lo resuelven (gotcha documentado de
Supabase+Vercel, ya conocido en el ecosistema: ver la nota sobre "usar el
pooler, no la conexión directa" en `auth-sorsabsa/.env.example`, misma
lección, otro proyecto). **Fix — ✅ validado en vivo:** `DATABASE_URL`
reemplazada por la cadena del "Transaction pooler" de Supabase
(`aws-....pooler.supabase.com:6543`, pensado para funciones serverless
sin conexión persistente). Redeploy, y el login completó de punta a
punta.

**Nota aparte:** esto también resuelve 🟠-3 de
`AUDITORIA-AGENTE24SIETE.md`, que había quedado como "no diferenciado" —
era (b), un problema de configuración, no vencimiento natural.

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

### 🟠-2 — ✅ RESUELTO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Bypass de entitlements hardcodeado por nombre de producto

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
- ⚠️ **Cuarto nombre, 15-ago-2026:** `sorsabsaforensic` entró a la misma
  lista al sumarse al portero. Cuatro. La lista crecía una vez por producto
  nuevo, que es la definición de un antipatrón que se paga en cuotas.
- ✅ **RESUELTO 15-ago-2026** (llegó por otra puerta: la etapa 1 del fix #2
  de `AUDITORIA-DOMUSCRM.md` 🔴-1, que necesitaba lo mismo). El fix es el
  que este hallazgo prescribía, con un matiz que apareció al hacerlo: no
  alcanza un `billable: boolean`, porque los productos no se parten en dos
  grupos sino en **tres** — paga una ENTIDAD (domuscrm, condomanager), paga
  la PERSONA (justired, y el default histórico), o no se cobra en el login
  (iot, convertidor, agente24siete, sorsabsaforensic). Un booleano habría
  fusionado los dos primeros y perdido justamente la distinción que el
  resolver necesita. Quedó `cobro: {modo: 'entidad' | 'persona' |
  'sin_cobro'}` en `lib/apps.ts`, obligatorio: un producto nuevo no compila
  sin declarar cómo se le cobra. `entity-resolver.ts` ya no menciona ninguna
  app, y los motivos de cada producto se movieron como comentario al lado
  de su declaración — no se perdieron. Los cubren 5 tests nuevos en
  `src/lib/entity-resolver.test.ts`.

### 🟠-6 — ⬜ El logout de CondoManager calcula el destino correcto y el portero lo descarta en silencio — encontrado 16-ago-2026

- **Archivos:** `condomanager/app/components/SignOutButton.tsx` +
  `auth-sorsabsa/src/lib/apps.ts` (allowlist) +
  `auth-sorsabsa/src/lib/dynamic-hosts.ts`.
- **Síntoma esperable:** un residente de Punta Blanca cierra sesión y, en vez
  de aterrizar en `puntablancaecuador.com` (la regla de negocio escrita en el
  propio componente: "SIEMPRE se sale a la web, nunca al login"), termina en
  `condomanager.vip`. Sin ningún error: la redirección ocurre, solo que a
  otro lado.
- **Causa, verificada leyendo los tres archivos:** `SignOutButton` calcula
  bien el destino (asociación → condominio → portada) y lo manda como
  `next=` al logout central. `auth/logout/page.tsx` valida ese `next` con
  `/api/redirect-allowed`, o sea el mismo allowlist del login. El de
  `condomanager` es `['condomanager.vip', 'www.condomanager.vip',
  'condomanager-roan.vercel.app']` — la web de una asociación no está ahí. Y
  la allowlist dinámica no lo salva: `esDominioDeTenant()` arranca con
  `if (app !== 'domuscrm') return false` — hoy solo DomusCRM tiene dominios
  por cliente. Resultado: el destino cae al `redirectUrl` del producto.
- **Cómo llegó a estar así — no fue un descuido, fue una predicción que se
  cumplió.** `PENDIENTES-ECOSISTEMA.md` #10 anotó este riesgo textualmente
  ("ese redirect a un dominio arbitrario no está en el allowlist del logout
  compartido y hubiera roto esa regla de negocio") y por eso dejó
  `SignOutButton` sin tocar a propósito. Después se tocó igual
  (`condomanager@c9a2359`, "SignOutButton pasa por el logout compartido") —
  necesario, porque el logout local no cerraba la sesión de identity (🔴 #2
  de ese mismo punto) — pero sin resolver la mitad que el pendiente ya había
  advertido. El pendiente quedó marcado como "no se tocó" y nadie volvió.
- **Fix propuesto, sin implementar (necesita su análisis de 9 puntos):** lo
  correcto no es agregar `puntablancaecuador.com` a mano a la allowlist
  estática —sería el hardcode por cliente que `ESTANDAR-DESARROLLO.md`
  prohíbe— sino extender la allowlist DINÁMICA a CondoManager, con el mismo
  criterio que ya usa DomusCRM: aceptar el dominio solo si sale de la base y
  el producto lo tiene verificado. Hoy `asociaciones.sitio_web` /
  `condominios.sitio_web` se llenan a mano en un formulario, sin ninguna
  verificación de propiedad — o sea, la fuente existe pero **no cumple todavía
  la condición de seguridad** que hace segura la versión de DomusCRM
  (`agent_sites.domain_verified`). Ese es el trabajo real: verificación de
  dominio para CondoManager, no una excepción en el allowlist.
- **Riesgo mientras tanto:** bajo y cosmético (se sale a la portada del
  producto en vez de a la web del cliente), sin exposición de seguridad — el
  allowlist está haciendo exactamente lo que debe. Se documenta para que la
  regla de negocio escrita en el componente no siga afirmando algo que el
  sistema no cumple.

### 🟠-7 — 🔧 El portero no tenía estándar del lado del CONSUMIDOR: el mismo rechazo terminaba de seis maneras — encontrado 16-ago-2026

**Origen — Gina, después de quedar encerrada en agente24siete:** *"te había
pedido que el portero maneje un estándar, pero en cada producto le haces
trabajar de formas diferentes, entonces no hay estándar, el portero al día de
hoy ya debería estar listo... son varios sistemas por revisar y hasta ahora
no salimos del portero"*. Tenía razón, y la propia sesión lo probó: el fix de
ese encierro (`AUDITORIA-AGENTE24SIETE.md` 🟠-6) empezó siendo una variante
más, propia de ese producto.

**1. Síntoma:** el caso "tenés sesión válida, pero no tenés lugar en este
producto" terminaba distinto en cada uno. Relevado leyendo los seis repos:

| Producto | Pantalla | Salidas que ofrecía |
|---|---|---|
| DomusCRM | `AccesoDenegado.tsx` propio | Salir (logout central) + "Ver la web pública" |
| CondoManager | dentro de `DashboardShell.tsx`, muestra el email | "Cerrar sesión" (sin `next`) + "Reintentar" |
| agente24siete | propia, en cada `LoginGate` | **ninguna** — encerraba a la persona |
| IOT | ninguna: `requires_sso_auth` mandaba al login igual que si no hubiera sesión | ninguna; y el rechazo del callback ofrecía "Volver a intentar" → login |
| Convertidor | no filtra por cuenta | su `signOut()` era **local**, no pasaba por el logout central — y en la portada no había ni entrar ni salir |
| auth-sorsabsa | `payment_blocked` en `/auth/complete` | "Ir a pagos" + volver al login (con la sesión de identity ya cerrada) |

**2. Causa inmediata:** cada producto escribió su propia pantalla, su propio
botón y su propia URL de logout.

**3. Causa raíz:** el portero **sí** está estandarizado —un allowlist, un
`/auth/login`, un `/auth/logout`, un `/auth/complete`—; lo que nunca se
estandarizó es el lado del consumidor. `@sorsabsa/ui` repartía el chasis
(Card, Button, marca) pero no la pantalla ni la regla, así que cada caso
nuevo se arreglaba en un repo y los otros cinco quedaban igual. **Ese hueco
vivía en `diseno-sorsabsa`, no en los productos.**

**4. Componente responsable:** el paquete compartido.

**5. Código afectado:** `@sorsabsa/ui` + los seis consumidores.

**6. Regla, dictada por Gina y ahora implementada una sola vez:** *"si tiene
landing page debería dar mensaje de que no tiene cuenta y un botón para
salir, lo que le lleva a la web si es que la tiene; si no tiene web sale al
login"*. **No hace falta programarla por producto:** ya está en `apps.ts`
como `redirectUrl`, y `/auth/logout` la aplica cuando **no** se le manda
`next` — web propia si la tiene (`condomanager.vip`, `agente24siete.app`,
`domuscrm.app`, `www.justired.com`), la app misma si no (IOT, Convertidor),
que al no encontrar sesión manda al login.

**Construido — `@sorsabsa/ui` v0.1.49 (`diseno-sorsabsa@ab0fa9c`, tag
publicado):**

- `src/components/SinAcceso.tsx` — la pantalla terminal compartida. El
  producto solo aporta el texto de SU regla de negocio y, si existe de
  verdad, un segundo destino útil.
- `src/lib/portero.ts` — `urlDeSalida(app)` / `salirDelEcosistema(app,
  limpiar?)`. **No acepta destino**, y hay un test que cuida justo eso: el
  día que alguien le agregue un `next`, cada producto vuelve a decidir por su
  cuenta y se rompe el estándar sin que falle nada a la vista.
- Regla dura de la pantalla: **nunca ofrecer "volver a intentar el login"**.
  La cuenta sigue sin lugar después de reautenticar, y con identity
  auto-aprobando la autorización ya consentida, ese reintento ES el bucle.

**7. Código eliminado:** en agente24siete, sus dos pantallas terminales
propias y el `cerrarSesionCentral` que había durado unas horas (una quinta
forma de armar la misma URL).

**8. Riesgo de regresión:** bajo por producto (la pantalla no está en el
camino feliz), pero son seis repos: se adopta de a uno, verificando.

**9. Validación:** por producto, entrar con una cuenta sin lugar ahí y
confirmar que se ve la misma pantalla, que "Salir" lleva a la web (o al
login si no hay web), y que un login nuevo **pide credenciales** — la prueba
real de que cerró también la sesión de identity.

**Estado de adopción:**

- ✅ **agente24siete** — `agente24siete@c7102bf` + `da58090`. `tsc` y
  `next build` verificados contra el tag publicado, no contra una copia
  local.
- ✅ **IOT** — `iot@4400bee`. No puede consumir el componente (Flask/Jinja,
  otro stack): se comparte la regla y el contrato de salida, no el código.
  Detalle en 🟠-8.
- ✅ **CondoManager** — `condomanager@0b7d91c`. `tsc` y `next build` limpios.
- ✅ **DomusCRM** — `domuscrm@449e7c3`. Su `AccesoDenegado` era la MEJOR de
  las seis pantallas (fue la referencia para armar la compartida), y aun así
  se reemplazó: el estándar solo existe si nadie conserva la suya.
- ✅ **Convertidor** — `convertidor@616abcb`. `tsc` y `next build` limpios.
  Adopta el **contrato de salida**, no la pantalla: no rechaza a nadie por
  cuenta, así que no tiene el caso terminal que `SinAcceso` cubre. Detalle y
  lo que se decidió NO hacer, en 🟠-9.

**Los seis productos adoptados.** El estándar del portero del lado del
consumidor queda cerrado; lo que sigue abierto son hallazgos de cada producto
(🟠-8 IOT, 🟠-10 CondoManager), no el estándar.

**Dos correcciones al diseño de v0.1.49, encontradas al adoptar — o sea
leyendo los productos, no imaginándolos (v0.1.50, `diseno-sorsabsa@644a14c`):**

1. **`destino` opcional.** Dije que aceptar un destino rompía el estándar.
   Es cierto para los productos de una sola web, y falso para DomusCRM: es
   multi-tenant, y "la web" de un agente es la de SU inmobiliaria (subdominio
   o dominio propio), no `domuscrm.app`, que es la portada del SaaS que le
   vende a su agencia. Ahí `redirectUrl` no puede saber la respuesta y el
   producto sí. Queda admitido y documentado como exclusivo de ese caso.
2. **Acción secundaria por clic.** CondoManager pone `sinPerfil = true`
   también cuando la consulta a `perfiles` FALLA
   (`DashboardShell.tsx`, los dos `setSinPerfil`), así que su botón
   "Reintentar" no es decorativo: sin él, una desconexión momentánea deja a
   un residente real mirando "tu cuenta no pertenece a ningún condominio".
   Ver 🟠-10: que un fallo técnico se presente como un rechazo de negocio es
   un defecto propio, y ese botón lo tapa en vez de resolverlo.

### 🟠-10 — ⬜ CondoManager muestra un rechazo de negocio cuando lo que falló es la red — encontrado 16-ago-2026

- **Archivo:** `condomanager/app/(dashboard)/components/DashboardShell.tsx`
  — `setSinPerfil(true)` se ejecuta en tres situaciones que no son la misma:
  la consulta devolvió cero perfiles (rechazo real), la consulta devolvió
  `error`, y el `catch` de una excepción.
- **Consecuencia:** un residente con perfil válido, ante una desconexión
  momentánea, ve *"Tu cuenta no pertenece a ningún condominio"* — una
  afirmación falsa sobre su cuenta, no un error técnico. El botón
  "Reintentar" existe para eso, o sea el síntoma está mitigado y la causa no.
- **Es el mismo patrón que esta auditoría persigue en todos lados:** tratar
  un fallo técnico como un estado del negocio (y al revés). agente24siete
  resuelve el caso simétrico de la forma correcta: si `whoami` no responde
  por red, **deja pasar** — no castiga a nadie por una desconexión.
- **Fix propuesto, sin implementar:** separar los tres casos. Cero perfiles →
  `SinAcceso` (lo de hoy). Error/excepción → una pantalla distinta ("no
  pudimos verificar tu cuenta") con Reintentar, sin afirmar nada sobre a qué
  condominio pertenece. Una vez separados, `SinAcceso` en CondoManager ya no
  necesita acción secundaria.
- **Riesgo:** bajo. **Pendiente de decidir con Gina.**

### 🟠-8 — ✅ CORREGIDO 16-ago-2026, commit `iot@4400bee` — IOT trataba "esta cuenta no opera IOT" como "no hay sesión"

**Corrección sobre el diagnóstico inicial, escrita a propósito:** al reportar
esto dije que IOT estaba en un **bucle infinito** en producción. **No lo
estaba.** El ciclo automático ya se había cortado el 08-ago-2026 en
`/auth/callback`, que para y muestra el motivo. Lo que quedaba era real pero
menor: el ciclo a un clic.

1. **Síntoma:** una cuenta con sesión válida que no está en
   `IDENTIDADES_POR_EMAIL` (o sea, cualquiera que no sea Patricio o Susana)
   no veía ninguna explicación de por qué no entra, y la única acción que se
   le ofrecía —"Volver a intentar"— la devolvía a la misma pantalla: identity
   auto-aprueba la autorización ya consentida, así que reautenticar entra con
   la MISMA cuenta rechazada.
2. **Causa inmediata:** `identidad_actual()` devolvía `None` para dos estados
   distintos ("no hay sesión" y "hay sesión, sin acceso") y
   `requires_sso_auth` mandaba al portero en los dos.
3. **Causa raíz:** la misma de fondo que el bucle de agente24siete del
   10-ago — confundir un estado de SESIÓN con uno de NEGOCIO. Reautenticar
   arregla el primero y nunca el segundo.
4. **Componente responsable:** `iot_system/app/auth_sso.py`.
5. **Código afectado:** ese archivo, `editor.py` (el botón del callback) y
   una plantilla nueva.
6. **Fix:** `estado_de_sesion()` devuelve `SIN_SESION` / `SIN_ACCESO` /
   `CON_ACCESO`; solo el primero va al portero, el segundo renderiza
   `templates/sin_acceso.html` con un 403. La versión API pasa a 403 (no 401)
   en ese caso — mismo par de códigos que ya usan agente24siete y DomusCRM.
   El botón del callback pasa de "Volver a intentar" (login) a "Salir"
   (logout central).
7. **Código eliminado:** ninguno; `identidad_actual()` se conserva apoyada en
   la función nueva porque la usan 7 lugares de `editor.py`.
8. **Riesgo de regresión:** bajo — el camino de quien SÍ tiene acceso no
   cambia.
9. **Validación:** `py_compile` limpio y render real de la plantilla con
   Jinja (con y sin email), comprobando que lleva el logout central, que NO
   lleva `next` y que no ofrece volver al login. **Falta la prueba en vivo**:
   entrar a IOT con una cuenta ajena y ver la pantalla. Requiere desplegar a
   Railway — ojo con el antecedente de que su auto-deploy no se disparó solo
   (ver #14 de `PENDIENTES-ECOSISTEMA.md`).

### 🟠-9 — ✅ El "salir" de Convertidor no pasaba por el logout central — CORREGIDO 16-ago-2026

**Con esto, los seis productos usan el mismo contrato de salida.** Era el
último.

- **Archivo:** `convertidor/frontend/src/hooks/useAuth.ts` — `signOut()` hacía
  solo `supabase.auth.signOut()`.
- **Es el mismo bug ya corregido tres veces** (CondoManager 🟠-5, JustiRed
  🔴-11, agente24siete 🟠-1): cierra la sesión del producto y deja viva la de
  identity, que auto-aprueba el siguiente login sin pedir credenciales — o
  sea "cerrar sesión" no permite entrar con otra cuenta.
- **Corregido:** `salirDelEcosistema('convertidor', …)` de `@sorsabsa/ui`,
  **sin `destino`** — Convertidor no es multi-tenant, así que el destino lo
  resuelve el portero con el `redirectUrl` de `apps.ts`. Commit
  `convertidor@616abcb`. Su `signIn()` ya estaba bien (manda `next` a su
  propio `/auth/callback`, el patrón correcto) y no se tocó.
- **Lo que NO se hizo, a propósito: no se le agregó pantalla `SinAcceso`.**
  Convertidor no rechaza a nadie por cuenta —cualquiera con sesión convierte,
  el plan solo cambia límites—, así que una pantalla de rechazo que nunca se
  muestra sería inventar un caso de negocio para poder decir que "adoptó el
  estándar completo". El estándar aquí es la salida, y era lo que faltaba.

- **Hallazgo aparte, del mismo commit — por qué el arreglo del pie de página
  no se veía:** `app/page.tsx` (la portada) se copiaba a mano su propia barra
  y su propio pie en vez de usar `Navbar` y `Footer`, que ya existían. Por eso
  el pie del ecosistema que se corrigió esa misma mañana (`convertidor@73f6312`)
  llegó a `Footer.tsx` y la portada seguía mostrando el viejo, y por eso la
  portada era **la única pantalla del sitio sin sesión visible: ni entrar ni
  salir** — o sea el portero no existía justo en la página donde aterriza
  cualquiera. Encontrado descargando `convertidor.sorsabsa.com` y comparando
  el HTML servido contra el repo, no leyendo el código. Es la duplicación que
  persigue `ESTANDAR-DESARROLLO.md`: el arreglo llega a una copia y la otra
  sigue rota.

- **Queda abierto (no es de este hallazgo, pero toca el mismo archivo):**
  `useEntitlements` devuelve `{active:false, reason:'error'}` cuando la
  consulta falla, así que una desconexión momentánea le muestra los límites
  del plan gratis a alguien que paga Pro. Mismo patrón que 🟠-10 en
  CondoManager —confundir fallo técnico con estado del negocio— aunque acá
  degrada en vez de conceder, que es el lado seguro. Y el gate de tamaño es
  del lado del cliente: `/api/convert` acepta 50 MB sin verificar plan, así
  que el límite de 5 MB del plan gratis se salta llamando a la ruta directo.
  Eso es lo que bloquea el cobro y está anotado en `PENDIENTES-ECOSISTEMA.md`
  #21.

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

### 🟡-4 — ✅ CORREGIDO 15-ago-2026 — El registro del portero pedía "Nombre completo": el arreglo se hizo en un producto y no en el compartido

- **Archivo:** `auth-sorsabsa/src/app/auth/register/page.tsx`
- **Cómo apareció:** Gina, al ir a registrar su cuenta para
  SorsabsaForensic: *"sigue pidiendo nombre completo, cuando debe pedir
  nombres y apellidos, corrige esto en el portero, **no sé cuántas veces lo
  he dicho**"*.
- **Por qué se repetía:** porque ya estaba resuelto… en otro lado.
  `AUDITORIA-DOMUSCRM.md` 🟡-1 lo corrigió el 10-ago-2026
  (`domuscrm@407c277`) en el registro de DomusCRM, con el criterio ya
  aceptado. El portero —que es **la puerta de entrada de todos los
  productos**— nunca lo recibió. Arreglar el síntoma en el producto que lo
  expuso y no en el mecanismo común es exactamente el patrón que
  `ESTANDAR-DESARROLLO.md` señala; acá se ve el costo: la usuaria lo pidió
  varias veces porque cada vez lo veía en una pantalla distinta.
- **Fix:** mismo patrón que DomusCRM, sin inventar uno nuevo. Dos campos en
  fila (`Nombres` / `Apellidos`) que se concatenan en `full_name` justo
  antes del `signUp` — **cero cambios de esquema, cero migración**.
  Se sigue guardando un solo `full_name` a propósito: es lo que Supabase
  expone como claim `name` en la federación OIDC. Un `nombres`/`apellidos`
  en `user_metadata` no viajaría a los productos — la misma trampa que
  `identidad_iot` (🔴-2).
- **Por qué importa más que la estética:** partir un nombre después es
  ambiguo. "Gina Silvana Proaño Espinosa" puede ser dos nombres y dos
  apellidos, o uno y tres. En Ecuador los dos apellidos son la norma, y en
  un informe pericial el nombre de quien suscribe no admite adivinanzas.
- **Verificado:** typecheck limpio y la página abierta en el navegador —
  los campos son `Nombres`, `Apellidos`, `Correo electrónico`, `Contraseña`,
  sin errores de JavaScript.

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

### 🔵-3 — ✅ URL del SSO escrita a mano y repetida 4 veces en condomanager — RESUELTO 09-ago-2026

Encontrado en la auto-auditoría pedida por Gina contra ESTANDAR-DESARROLLO.md
(§5/§6, duplicación). `"https://auth.sorsabsa.com/auth/login?app=condomanager"`
estaba repetida sin fuente única en `registro-admin`, `registro-residente` y
dos veces en `login/page.tsx` (`irAlSSO()` y el reenvío de fragment de
🔴-10). **Fix:** `lib/auth/sso.ts` — `ssoLoginUrl(params?)`, único lugar
que arma esa URL, con params opcionales (`next`, `ctx`) para el caso que
ya los necesitaba. Commit `condomanager@62a444c`. Verificado con grep: cero
literales de esa URL fuera del helper. typecheck limpio.

### 🔵-4 — ⬜ Traducción de errores de Supabase duplicada entre repos, a propósito, con seguimiento

`condomanager/app/login/page.tsx` (`MENSAJES_HASH`/`traducirErrorHash`) y
`auth-sorsabsa/src/lib/traducir-error.ts` tienen el mismo par de entradas
(`otp_expired`, `access_denied`) en dos repos distintos — duplicación real
por la letra de ESTANDAR-DESARROLLO.md §6. **Por qué no se resuelve
ahora:** los dos consumen `@sorsabsa/ui` (github package, versionado) —
mover esto ahí es la fuente única correcta, pero implica publicar una
versión nueva y actualizar el rango en los dos repos, un cambio de mayor
riesgo/coreografía que el contenido (4-6 pares clave-valor, bajo riesgo de
desviarse) justifica en medio de un incidente activo. **Regla de
disparo:** si aparece una TERCERA copia, o si alguna de las dos empieza a
divergir del otro texto para el mismo código, ahí sí mover a
`@sorsabsa/ui` sin más demora — no esperar a que sea el mismo tipo de
cadena de "parche sobre parche" que ya costó caro hoy.

### 🔵-5 — ✅ Importar residentes insertaba fila por fila — inviable a la escala real de Punta Blanca — RESUELTO 09-ago-2026

- **Síntoma que lo destapó:** Gina, pensando en subir ~3500 residentes por
  condominio × 5 condominios de Punta Blanca, preguntó cuándo se resolvía
  esto — no es sobre nomenclatura de tablas, es sobre si la carga real
  iba a funcionar.
- **Causa real:** `residentes/importar/page.tsx` insertaba UNA fila a la
  vez desde el navegador (cliente, no server route), con 2-3 viajes de
  red por residente (`residentes` + `datos_facturacion` +
  `unidad_residente`). Con 3500 filas: miles de peticiones secuenciales,
  horas de duración en una sola pestaña, sin barra de progreso real y sin
  forma de reanudar si se corta la conexión a mitad de camino.
- **Fix:** lotes de 250 — un `insert()` masivo (un solo `INSERT` SQL con
  muchas filas) por lote para `residentes`, y otro para
  `datos_facturacion`/`unidad_residente` de ese lote usando los ids que
  devuelve el insert masivo. Si un lote entero falla (una fila mala tumba
  las ~250 buenas — es una sola sentencia SQL), reintenta de a una SOLO
  dentro de ese lote, para no perder el resto y seguir señalando
  exactamente cuál fila. Barra de progreso real (`X de Y`) en vez de un
  spinner ciego.
- **Commit:** `condomanager@bf0c11f`. typecheck limpio.
- **No verificado todavía con datos reales de esa escala** — recomendado
  antes de la carga real: una prueba con un CSV de unos cientos de filas
  primero.

---

## Próximo paso

🔴-1, 🔴-2/3, 🔴-4/🟠-1, 🔴-5, 🔴-7 (completado por 🔴-10, ver nota de
auto-auditoría en 🔴-7), 🔴-9, 🔴-10, 🟠-3, 🟠-5 y 🔵-3 cerrados y
verificados (09-ago-2026, registro real de punta a punta con Gina).
Abierto, requiere acción de Gina en el dashboard de Supabase (fuera del
alcance de las herramientas de esta sesión): 🔴-8, el Send Email Hook de
identity nunca se creó — todo correo automático de identity sale sin
marca; falta además confirmar si `verticales_sorsabsa` sí lo tiene. Queda
también 🔵-4 (traducción de errores duplicada entre repos), deferido a
propósito con regla de disparo escrita. 🔴-6 quedó ✅ resuelto y construido (09-ago-2026) — solo falta la prueba en
vivo de un mensaje real, bloqueada por el baneo de Meta a las cuentas de
WhatsApp (ver `PENDIENTES-ECOSISTEMA.md` #15; no volver a preguntar esto
hasta que ese bloqueo se levante). Quedan abiertos además, en orden de
severidad: **🔴-11 (10-ago-2026 — portero inconsistente en los 4 productos
web, tres fallas distintas; DomusCRM y agente24siete ya corregidos y
validados en vivo el mismo día — agente24siete además cerró 🔴-12, la
causa de fondo del bucle; JustiRed sigue pendiente de confirmación de
Gina)**, 🟠-2 (empeorado el
09-ago: 3 nombres hardcodeados en vez de 2 — el fix declarativo sigue
pendiente y ahora limpia más), 🟠-4, 🟡-2, 🟡-3 (debería poder eliminarse
ahora que 🔴-1 está cerrado — no debería haber más cuentas nuevas fuera de
identity, pendiente de confirmar con uso real), 🔵-1, 🔵-2. El fix de código
de 🔴-2/3 (falla-cerrado explícito por entorno) sigue pendiente — solo se
resolvió la credencial perdida que bloqueaba verificarlo, no el patrón de
fallback en sí. Pendiente aparte, bajo impacto: el cron
`limpiar-no-confirmados` de CondoManager solo mira el proyecto de
producto — desde el fix de 🔴-1 no va a encontrar los registros nuevos sin
confirmar (viven en identity).


**09-ago-2026, ampliación de alcance:** Gina pidió auditar CondoManager
como aplicación, no solo el portero. Esos hallazgos (duplicación de
chequeos de rol en 13 rutas, fallback peligroso en `resolverPostLogin`,
artefactos compilados commiteados) viven en
[AUDITORIA-CONDOMANAGER.md](./AUDITORIA-CONDOMANAGER.md) — documento
separado a propósito, para no mezclar identidad/federación con calidad del
producto.
