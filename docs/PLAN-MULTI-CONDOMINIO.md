# Plan — una persona en más de un condominio (CondoManager)

**Abierto:** 09-ago-2026. **Origen:** Gina preguntó si el sistema deja
elegir a qué condominio entrar cuando una persona tiene propiedades en más
de uno — la respuesta, verificada contra el esquema real, fue que no: hay
código que lo sugiere (`post-login.ts`, páginas `selector-*`) pero es
inalcanzable, porque `perfiles.user_id` es llave primaria. Motivo real:
tiene ~120 personas con propiedades en más de uno de los 5 condominios de
Punta Blanca, censo todavía sin subir.

**Por qué este documento existe aparte de `AUDITORIA-CONDOMANAGER.md`:**
dejó de ser un hallazgo de auditoría — es un proyecto de varias fases con
cambio de esquema, RLS, backend y frontend. Mismo criterio que separa
`PLAN-DESOLDADO.md` de las auditorías.

**Decisión de negocio confirmada (09-ago-2026):** los 5 condominios de
Punta Blanca van a compartir una fila en `asociaciones`. Esto importa
porque el selector que ya existe (`selector-condominios`,
`selector-asociaciones`) fue diseñado para ese caso — no hay que construir
una pantalla nueva, hay que destrabar la que ya está.

**Estado:** ⬜ Fase 1 sin empezar. Nada de este plan se implementa sin
pasar antes por el análisis de 9 puntos de `ESTANDAR-DESARROLLO.md` en
cada fase — este documento es el mapa, no el permiso para tocar código.

---

## Causa raíz

`perfiles` tiene `PRIMARY KEY (user_id)`: una fila por cuenta de login,
para siempre. No hay forma de que la misma persona tenga un perfil en el
condominio A y otro en el B. `residentes` sí permite esto
(`UNIQUE(condominio_id, email)`, no por email solo) — el modelo de negocio
ya lo contemplaba ahí; `perfiles` se quedó atrás.

## Alcance real — corregido 09-ago-2026

Gina pidió explícitamente volver a revisar después de la primera versión
de este plan, porque el barrido original (🟠-1) solo buscaba
"verificación de rol duplicada" y se saltó todo lo que consulta `perfiles`
sin ese patrón exacto. Repetido con un criterio más amplio (cualquier
`.single()`/`.eq("user_id", ...)` contra `perfiles`), el alcance real es:

- **9 rutas de API más**, sin migrar a `requireRole()`, con el mismo
  `perfiles.eq(user_id).single()` crudo: `admin/suscripcion`,
  `admin/referidos`, `admin/config-pago/payphone`,
  `facturacion/[id]/ver`, `facturacion/[id]/pdf`,
  `configuracion/firma` (×2), `buscar-usuario`, `reservas/iniciar`. Más
  `reservas/disponibilidad`, ya conocida. Más
  `unidades/[id]/fotos/presign`, que llama `current_rol()` por RPC
  directo.
- **Las ~16 rutas ya migradas a `lib/auth/requireRole.ts`** (🟠-1) —
  el helper mismo asume una fila (`.single()`), hay que rediseñarlo, no
  descartarlo.
- **45 páginas del dashboard** (`app/(dashboard)/**`) consultan
  `perfiles` de forma independiente, incluida `DashboardShell.tsx` — el
  componente que envuelve todo el panel. Este último ya trae el arreglo
  completo (`.eq("user_id", ...)` sin `.single()`) pero después hace
  `const perfil = perfilesData[0]` — toma el primero sin mirar en qué
  condominio está la persona. Hoy no se nota porque solo puede existir
  una fila; con el fix, mostraría datos de un condominio arbitrario **sin
  error visible** — el peor tipo de bug.
- **`resolve_condominio_for_user()`** — ⚠️ **NO era huérfana.** Se
  marcó así, se borró en la Fase 2, y rompió el login de CondoManager en
  producción — ver nota en la Fase 2 más abajo. El grep que la declaró
  "sin uso" solo cubrió el repo de condomanager; la llama
  `auth-sorsabsa/src/lib/entity-resolver.ts` por SQL directo, desde OTRO
  repositorio. Restaurada.

No se afirma que esta lista sea definitiva — es lo que apareció con este
segundo barrido. Puede haber más; se trata como una lista viva, no
cerrada.

---

## Fase 0 — Confirmado, no se repite

Punta Blanca = 1 fila en `asociaciones`, 5 condominios debajo. Sin esto,
la Fase 6 sería otra (construir un selector nuevo para condominios sin
asociación en común, en vez de destrabar el que existe).

## Fase 1 — Esquema — ✅ RESUELTO 09-ago-2026

`perfiles` deja de tener `user_id` como llave primaria. Pasa a tener un
`id` propio, con:

- índice único `(user_id, condominio_id)` para el caso normal.
- índice único parcial `(user_id) WHERE condominio_id IS NULL` — cubre al
  superadmin (verificado: su única fila hoy tiene `condominio_id = NULL`;
  una llave compuesta normal lo hubiera roto).
- restricción `UNIQUE(residente_id) WHERE residente_id IS NOT NULL` —
  hoy no existe a nivel de base, solo se respeta por convención en el
  código.

**Hallazgo al ejecutar, no anticipado en el plan:** `crm_vendedores.perfil_id`
tenía una FK a `perfiles(user_id)` — quitarle la unicidad a `user_id` la
hubiera roto. Lo que esa columna en verdad necesita es "qué login es este
vendedor", no "qué perfil de condominio" — se redirigió a `auth.users(id)`,
que sigue siendo único por login para siempre. Tabla vacía (0 filas) al
momento del cambio, su RLS no depende de las 3 funciones de la Fase 2 —
verificado antes de tocarla, no asumido.

**Aplicado:** `condomanager@04a4ec6`. **Verificado con datos
transaccionales (rollback, sin dejar nada):** un segundo perfil para el
mismo `user_id` en otro condominio ahora se puede crear (antes la PK lo
rechazaba); un duplicado exacto (mismo `user_id`+`condominio_id`) sigue
rechazado; un `residente_id` repetido en dos perfiles sigue rechazado.

## Fase 2 — RLS y funciones SQL — ✅ RESUELTO 09-ago-2026 (Opción B)

**Antes de escribir la primera línea de esta fase se descubrió que el
alcance original estaba mal calculado.** No son 4 políticas en
`perfiles`/`residentes` — son **41 políticas en 24 tablas**
(`pagos`, `comprobantes`, `deudas`, `reservas`, `condominios`, `unidades`,
`mensajes`, `notificaciones`, `rubros`, `medios_pago`, `comunicados`,
`auditoria_log`, `miembros_directiva`, `condominio_modulos`,
`condominio_config_pago`, `condominio_evento_canales`, `unidad_fotos`,
`unidad_residente`, `amenidades`, `amenidad_mantenimientos`,
`deuda_detalle`, `pago_detalle`, `inmobiliaria_propiedades`, más
`perfiles`/`residentes`) que llaman a `current_rol()`,
`current_condominio_id()` o `current_residente_id()`. Verificado contra
`pg_policies` directo, no inferido. Cambiar la firma de esas funciones o
borrarlas —lo que decía la versión anterior de este plan— habría roto el
control de acceso de la aplicación entera, incluida la parte de dinero.
Se encontró antes de ejecutar, revisando `pg_policies` primero.

**Dos caminos reales, no uno:**

- **Opción A — reescribir las 41 políticas** a patrón `EXISTS` ("¿existe
  alguna fila mía que coincida con esta?" en vez de "¿coincide con mi
  única fila?"). Correcto, pero mucha superficie nueva tocando control de
  acceso en 24 tablas, incluidas `pagos`/`comprobantes`/`deudas`.
- **Opción B — ninguna de las 41 políticas se toca.** `current_rol()`,
  `current_condominio_id()`, `current_residente_id()` cambian por dentro:
  leen "cuál condominio está activo" de la sesión de Postgres (vía un
  pre-request hook de PostgREST que setea una GUC a partir de un header),
  mismo mecanismo que la Fase 3 ya iba a necesitar para el cookie de
  "condominio activo" — se funden en una sola pieza. Si no hay condominio
  activo en la sesión, cae al comportamiento actual (`LIMIT 1`), así que
  nada se rompe para quien no haya migrado todavía. Menos código nuevo,
  pero ese código nuevo usa un mecanismo (pre-request hook) que este
  proyecto no usa hoy — hay que probarlo con cuidado por ser nuevo, no por
  su volumen.

**Recomendada: Opción B** — mismo riesgo total más bajo (cero políticas
reescritas) y une Fase 2 con Fase 3 en un solo mecanismo. Confirmada por
Gina 09-ago-2026. `is_modulo_activo()` no se tocó — ya recibe el
condominio como parámetro.

**🔴 Incidente real, mismo día, causado por este fix:**
`resolve_condominio_for_user(p_user_id uuid)` se marcó "huérfana, nadie la
llamaba" y se eliminó. El grep que la declaró sin uso solo cubrió el repo
de `condomanager` — **la llama `auth-sorsabsa/src/lib/entity-resolver.ts`
por SQL directo** (`SELECT public.resolve_condominio_for_user($1::uuid)`,
vía un pool de Postgres propio, rol `app_runtime`), para resolver qué
condominio paga la suscripción de cada login. Al borrarla, esa consulta
empezó a tirar excepción en cada login de CondoManager; el `catch` de
`entity-resolver.ts` falla-cerrado a un sujeto sintético
(`__resolucion_fallida__...`), que pagos-sorsabsa correctamente reporta
sin suscripción — de ahí la pantalla "Sin suscripción activa" que Gina
vio al registrar un condominio nuevo y de prueba, cero clientes reales
afectados por suerte de timing, pero el login de CondoManager estuvo roto
en producción durante el tramo entre borrar la función y este arreglo.

**Causa raíz del error de auditoría:** verificar "¿quién llama esto?" con
un grep de UN SOLO repositorio, cuando el ecosistema tiene múltiples
repos que se conectan a la misma base por vías distintas (PostgREST desde
condomanager, un pool de `pg` directo desde auth-sorsabsa). "No encontré
llamadas" no es lo mismo que "no hay llamadas" — es "no busqué en todos
los lugares donde podría haber una".

**Restaurada** (`resolve_condominio_for_user`, misma definición
original — sin agregarle awareness de multi-condominio ahora, sería
resolver dos problemas a la vez con algo roto en producción; queda para
cuando se diseñe cómo el portero debe manejar entitlements con
multi-condominio, fuera de esta fase).

**Sospecha anterior, verificada y descartada:** se había anotado acá que
`entity-resolver.ts` podía estar resolviendo con el id de identity contra
`perfiles.user_id` (id local) — valores distintos por diseño, lo que
habría dejado el chequeo de suscripción en bypass permanente. Se dejó
"sin verificar" en vez de comprobarse contra el código real. Comprobado
ahora, leyendo `auth-sorsabsa/.env.local`: `NEXT_PUBLIC_SUPABASE_URL` de
auth-sorsabsa apunta al proyecto de PRODUCTO
(`twkuidnjwhopbjnrhnxp`), no a identity — hay una variable aparte,
`NEXT_PUBLIC_IDENTITY_SUPABASE_URL`, para lo que sí necesita identity. El
cliente que usa `entitlements/route.ts` (`createClient(NEXT_PUBLIC_SUPABASE_URL, ...)`)
valida el token contra el proyecto de producto — el mismo espacio de ids
que `perfiles.user_id`. No hay mezcla de ids: la sospecha no se sostiene.
No queda nada pendiente de esto.

**Implementado (`condomanager@04a4ec6`):** `current_rol()`,
`current_condominio_id()`, `current_residente_id()` ahora ordenan las
filas de `perfiles` del usuario por si el `condominio_id` coincide con la
GUC `app.condominio_activo` (la fila que coincide gana el `LIMIT 1`); sin
GUC, cae al mismo comportamiento arbitrario de siempre — cero regresión
para quien no haya migrado. La GUC la fija
`public.condomanager_pre_request()`, registrada en el rol `authenticator`
vía `pgrst.db_pre_request`, leyendo el header `x-condominio-activo`.

**Verificado en vivo, en dos niveles — no solo que "se aplicó":**

- SQL directo: con 2 perfiles de prueba (mismo `user_id`, condominios
  distintos) y la GUC seteada manualmente a cada uno, `current_rol()`/
  `current_condominio_id()` devuelven el rol y el condominio correctos de
  cada uno — no uno arbitrario.
- HTTP real, no solo SQL: `curl` contra el endpoint REST desplegado con
  el header `x-condominio-activo` puesto — el pre-request hook lo lee y
  fija la GUC de verdad, confirmado con una función de prueba temporal
  (creada y borrada en la misma sesión). Sin el header, cae a vacío como
  se diseñó.
- La revocación de `anon`/`PUBLIC` en estas 3 funciones (hecha antes en
  la misma sesión, por otro hallazgo) se confirmó intacta después del
  `CREATE OR REPLACE`.

**No probado todavía:** el flujo completo desde la app real (el cookie de
"condominio activo" que la Fase 3/5 van a fijar y que el cliente Supabase
del servidor tendría que reenviar como este header — hoy nada en
`lib/supabase/server.ts` lo hace todavía). Eso es trabajo de Fase 3 en
adelante, no de esta fase.

## Fase 3 — "Condominio activo": un solo mecanismo

Pieza que falta hoy por completo: nada sabe "en cuál condominio está
parada esta persona ahora mismo" porque nunca hizo falta. Se resuelve una
sola vez — una cookie (`condominio_activo`), fijada cuando la persona
elige en el selector — y la consumen **los dos lados** (Fase 4 y 5), no
cada uno por su cuenta. Es la fuente única de verdad de esta parte del
plan; sin esto, el backend y el frontend inventarían cada uno su propia
forma de saber "cuál" y volveríamos a duplicar.

## Fase 4 — Backend

`lib/auth/requireRole.ts` deja de asumir una fila: trae todas las del
usuario y, si la ruta opera sobre un condominio conocido (por la cookie
de Fase 3, o porque el recurso que toca ya lo trae — una reserva, un
residente, un pago), filtra por ese. Se migran las ~16 rutas ya
existentes (revisando cada una, no un reemplazo mecánico ciego) más las 9
nuevas encontradas más `presign`.

## Fase 5 — Frontend

Un hook nuevo (`usePerfilActivo()` o nombre similar) que lee la cookie de
Fase 3 y consulta `perfiles` UNA vez, centralizado — mismo principio que
`requireRole.ts` del lado del backend. `DashboardShell.tsx` se corrige
para dejar de tomar `perfilesData[0]` a ciegas y usar este hook. Las 45
páginas se clasifican en dos grupos: las que ya reciben el perfil desde
`DashboardShell` (context/props — no hay que tocarlas) y las que
consultan `perfiles` por su cuenta (esas sí, migradas al hook). Esa
clasificación todavía no se hizo — es el primer paso real de esta fase,
no un supuesto.

## Fase 6 — Selector

`selector-condominios` hoy solo funciona si viene con `?asociacion=` —
falla ("No se especificó la asociación") en el caso de condominios sin
asociación en común. Se corrige para listar directo en ese caso. Se
agrega un botón "cambiar de condominio" en el dashboard (escribe la
cookie de Fase 3, no un mecanismo nuevo).

## Fase 7 — `reconciliar-perfil`

El bug ya identificado: busca "la" fila de residente pendiente con
`.maybeSingle()`, que revienta en silencio si hay más de una para el
mismo correo. Se reescribe para procesar TODAS las pendientes de ese
correo en un mismo login — es la pieza que hace que, al subir el censo de
Punta Blanca, las 120 personas se resuelvan solas, sin backfill manual.

## Fase 8 — Validación de punta a punta

Con datos de prueba (transaccionales, sin tocar cuentas reales — hoy no
hay ningún caso real todavía): una persona con perfil en 2 condominios de
la misma asociación → login → selector → entra a uno → cambia al otro →
confirmar que RLS de verdad limita lo que ve en cada uno, no solo que la
pantalla cambia.

---

## Orden recomendado

1 → 2 se arman y prueban con SQL, sin tocar la app. 3 se decide antes de
4 y 5 porque ambos dependen de su forma exacta (nombre de cookie,
formato). 4 y 5 en paralelo una vez que 3 está firme. 6 depende de 3 y 5.
7 al final, justo antes de subir el censo real de Punta Blanca — es la
pieza que hace que ese censo no vuelva a dejar gente atrapada. 8 corre en
paralelo desde la Fase 1, no como un paso al final.

## Próximo paso

**Fase 1 y Fase 2 cerradas y verificadas** (09-ago-2026,
`condomanager@04a4ec6`) — la base ya soporta que una persona tenga perfil
en más de un condominio, y ni una de las 41 políticas RLS existentes se
tocó. Sigue Fase 3: decidir la forma exacta del cookie "condominio
activo" (nombre, cuándo se fija, cuánto dura) — de esa forma dependen
Fase 4 (backend, incluye hacer que `lib/supabase/server.ts` reenvíe el
header `x-condominio-activo` que la Fase 2 ya sabe leer) y Fase 5
(frontend). Nada de eso implementado todavía.

---

## Apéndice — utilidades de reset para la ronda manual

Dos funciones SQL para acelerar las pruebas repetidas (no expuestas a
anon/authenticated, solo accesibles con acceso directo a la base; quitar
cuando haya clientes reales):

- `public.reset_datos_prueba()` en `twkuidnjwhopbjnrhnxp` (guardada en
  `condomanager/supabase/migrations/20260809193000_reset_datos_prueba_utilidad.sql`) —
  borra todo lo condominio-scoped, deja solo el perfil de superadmin.
- `public.reset_cuentas_prueba(p_proteger text[])` en `gyqgorgfstffbgazhbnb`
  (identity, sin repo propio con carpeta de migraciones — documentada acá
  porque no tiene otro lugar natural) — borra toda cuenta de `auth.users`
  cuyo email no esté en la lista de protección. Default: el superadmin de
  condomanager + 2 cuentas de IOT + 3 cuentas de origen todavía no
  confirmado (`sorsabsa@gmail.com`, `gina.proanio@hotmail.com`,
  `eco.ec@outlook.com`) — protegidas por default hasta saber a qué
  producto pertenecen, no borradas sin confirmar.
