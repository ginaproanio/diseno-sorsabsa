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
- **`resolve_condominio_for_user()`** — función SQL huérfana en
  `00000000000000_baseline_schema.sql`, mismo defecto
  (`... LIMIT 1`), pero no la llama nada del código actual. Limpieza, no
  riesgo activo.

No se afirma que esta lista sea definitiva — es lo que apareció con este
segundo barrido. Puede haber más; se trata como una lista viva, no
cerrada.

---

## Fase 0 — Confirmado, no se repite

Punta Blanca = 1 fila en `asociaciones`, 5 condominios debajo. Sin esto,
la Fase 6 sería otra (construir un selector nuevo para condominios sin
asociación en común, en vez de destrabar el que existe).

## Fase 1 — Esquema

`perfiles` deja de tener `user_id` como llave primaria. Pasa a tener un
`id` propio, con:
- índice único `(user_id, condominio_id)` para el caso normal.
- índice único parcial `(user_id) WHERE condominio_id IS NULL` — cubre al
  superadmin (verificado: su única fila hoy tiene `condominio_id = NULL`;
  una llave compuesta normal lo hubiera roto).
- restricción `UNIQUE(residente_id) WHERE residente_id IS NOT NULL` —
  hoy no existe a nivel de base, solo se respeta por convención en el
  código.

## Fase 2 — RLS y funciones SQL

Las políticas de `perfiles`/`residentes` (`perfiles_select`,
`perfiles_write`, `residentes_select`, `residentes_write`) pasan de "¿tu
única fila coincide?" a "¿existe ALGUNA de tus filas que coincida con
esta?" (patrón `EXISTS`, estándar para RLS multi-pertenencia).
`current_rol()`, `current_condominio_id()`, `current_residente_id()`
dejan de tener sentido como "la" respuesta — se reescriben para recibir
el condominio como parámetro, igual que `is_modulo_activo()` ya hace bien
desde el principio (no se toca). Se elimina `resolve_condominio_for_user()`
(huérfana).

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

Nada implementado todavía. Antes de tocar código en Fase 1: presentar el
análisis de 9 puntos de `ESTANDAR-DESARROLLO.md` para el cambio de llave
primaria de `perfiles` — es el más riesgoso de tocar primero porque todo
lo demás depende de él.
