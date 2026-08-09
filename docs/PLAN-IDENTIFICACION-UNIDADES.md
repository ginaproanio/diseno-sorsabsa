# Plan — Identificación de unidades configurable por condominio

Nace de una pregunta de Gina sobre dónde configurar "cómo asignar
unidades", que llevó a un caso real: Punta Blanca se organiza por
código predial, "Algarrobos de la Viña" se organiza por **casa** — un
campo que hoy no existe. Gina probó la idea de un "criterio" con una
pregunta directa: ¿serviría para todas las consultas, o rompería
pantallas que solo tienen casa o solo tienen predial? La respuesta,
verificada con grep, es que **rompería** — hoy `manzana`/`lote` están
escritos a mano en 23 archivos, ninguno sabe que puede haber otro
criterio.

## Causa raíz

El esquema de `unidades` asume que **todo** condominio se organiza por
manzana+lote — es la única combinación que hoy es `NOT NULL` real en la
base (decisión tomada la misma sesión, antes de conocer el caso de
Algarrobos). No es cierto: cada condominio tiene su propia convención
real de terreno, y forzar manzana/lote como obligatorio universal
significa que un condominio que se organiza por casa no podría registrar
ni una unidad sin inventarse un manzana/lote falso — el mismo tipo de
dato inventado para tapar un hueco que se vino evitando toda la sesión
(ver `AUDITORIA-CONDOMANAGER.md` 🔵-2, 🔵-3, 🔵-4).

## Decisión de diseño (a partir de la corrección de Gina)

No es una bandera fija por condominio con todo lo demás obligatorio.
Es: **el condominio configura cuál campo es su clave primaria de
unidad** (manzana+lote, código predial, o casa) — ese campo pasa a ser
obligatorio + único para ese condominio; **los otros dos se vuelven
opcionales**, no obligatorios como hoy. Reabre y reemplaza la decisión
de 🔵-3 ("manzana/lote siempre obligatorios") con esta nueva
información.

## Diseño de datos

### `condominios`

Nueva columna:

```sql
ALTER TABLE public.condominios
  ADD COLUMN criterio_identificacion_unidad text NOT NULL DEFAULT 'MANZANA_LOTE'
  CHECK (criterio_identificacion_unidad IN ('MANZANA_LOTE', 'CODIGO_PREDIAL', 'CASA'));
```

Columna propia, no `configuracion` JSONB — la política ya escrita en
[PLAN-CONFIGURACION-CONDOMINIO.md](PLAN-CONFIGURACION-CONDOMINIO.md)
("dato que más de una pantalla necesita → columna propia") aplica acá
en su versión más extrema: son 23 archivos, no 2 o 3.

### `unidades`

- Nueva columna `casa text` (nullable) — el campo que falta para
  Algarrobos de la Viña.
- `manzana`, `lote`, `codigo_predial` pasan de `NOT NULL` a nullable.
- Índices únicos parciales ya existen para manzana+lote y
  codigo_predial (`WHERE ... IS NOT NULL`) — se agrega el mismo patrón
  para `casa`.
- Trigger `BEFORE INSERT OR UPDATE ON unidades` que busca el
  `criterio_identificacion_unidad` del condominio de esa unidad y exige
  que el campo correspondiente esté lleno — la obligatoriedad real sigue
  viviendo en la base, no solo en la pantalla (mismo principio aplicado
  toda la sesión, ahora condicional al criterio en vez de fijo).

### Sin backfill hardcodeado

**Corregido a pedido de Gina** — la primera versión de este plan
proponía fijar Punta Blanca en `CODIGO_PREDIAL` a mano vía una
migración SQL. Es exactamente el "hardcode por cliente" que
`ESTANDAR-DESARROLLO.md` marca como parche. Se saca: Punta Blanca (y
cualquier condominio existente) arranca en el default del esquema
(`MANZANA_LOTE`) y el criterio se corrige, si hace falta, a través del
control real descrito abajo — la misma vía que va a usar cualquier
administrador, no una excepción para este caso.

## Dónde se configura

No en Configuración/Parametrización — vive en el módulo de Unidades.
Un control **siempre visible y editable** en `/panel/admin/unidades`
(no solo la primera vez): el administrador puede ver y cambiar el
criterio en cualquier momento, no queda bloqueado después de crear la
primera unidad. Si hay cero unidades, además se pide explícitamente
elegir un criterio antes de habilitar "Crear unidad"/"Importar" — un
empujón de onboarding, no la única vía.

Cambiar el criterio con unidades ya existentes no las rompe: el trigger
exige el campo nuevo para lo que se cree o edite de ahí en adelante, no
reescribe ni invalida filas viejas. Una unidad vieja que no tenga el
campo del criterio nuevo simplemente lo muestra vacío hasta que alguien
la edite y lo complete.

## Resolver único (reemplaza los 23 lugares que hoy arman el label a mano)

`lib/unidades/identificar.ts`:

- `identificadorUnidad(unidad, criterio): string` — arma "Manzana 3 -
  Lote 12" / "Predial 170650123456" / "Casa 45" según corresponda.
- Se usa en cada lugar de la lista de abajo que hoy hace
  `` `${manzana} - ${lote}` `` a mano.

## Inventario completo — los 23 archivos, categorizados

**A. Módulo Unidades (fuente — crear/editar/importar/listar/ver):**
requieren mostrar y validar el campo correcto según el criterio, no uno
fijo.
1. `app/(dashboard)/panel/admin/unidades/nuevo/page.tsx`
2. `app/(dashboard)/panel/admin/unidades/[id]/editar/page.tsx`
3. `app/(dashboard)/panel/admin/unidades/importar/page.tsx`
4. `app/(dashboard)/panel/admin/unidades/page.tsx` (lista, búsqueda, orden)
5. `app/(dashboard)/panel/admin/unidades/[id]/page.tsx` (detalle)

**B. Solo muestran un label de unidad ya existente** — pasan a usar
`identificadorUnidad()`:
6. `app/register/residente/page.tsx`
7. `app/pago-rapido/[id_unidad]/page.tsx`
8. `app/(dashboard)/panel/residente/mis-unidades/page.tsx`
9. `app/(dashboard)/panel/modulos/recaudacion/residente/pagos/page.tsx`
10. `app/(dashboard)/panel/modulos/recaudacion/admin/administrar/page.tsx`
11. `app/(dashboard)/panel/modulos/recaudacion/admin/administrar/individual/page.tsx`
12. `app/(dashboard)/panel/modulos/recaudacion/admin/administrar/generar/page.tsx`
13. `app/(dashboard)/panel/admin/residentes/[id]/page.tsx`
14. `app/(dashboard)/panel/admin/residentes/[id]/editar/page.tsx`
15. `app/(dashboard)/panel/admin/residentes/pendientes/page.tsx`
16. `app/(dashboard)/panel/admin/residentes/nuevo/page.tsx`
17. `app/(dashboard)/panel/admin/reportes/morosos/page.tsx`
18. `app/(dashboard)/panel/admin/configuracion/pagos/qr/page.tsx`
19. `app/(dashboard)/panel/admin/reportes/estado-cuenta/page.tsx`
20. `lib/facturacion/service.ts` (línea de dirección en la factura)

**C. Reporte con filtro propio por manzana** — el más grande de los 23,
tiene su propia UI de filtros (manzana/lote/predial como inputs
separados) que hay que rediseñar, no solo cambiar un label:
21. `app/(dashboard)/panel/admin/reportes/rubros-por-unidad/page.tsx`

**D. Matching por clave compuesta** (el más delicado — hoy arma
`` `${manzana}-${lote}` `` como llave de búsqueda fija):
22. `app/(dashboard)/panel/admin/residentes/importar/page.tsx` — matchea
    CSV de residentes contra unidades por manzana+lote. Con criterio
    configurable, tiene que matchear por el campo que el condominio use
    (columna del CSV cambia de significado según el criterio).

**E. Validación:**
23. `lib/unidades/validar.ts` — rediseño completo: hoy exige
    manzana+lote siempre y codigo_predial siempre; pasa a exigir solo
    el campo del criterio activo.

## Fases

- **Fase 0 — ✅ RESUELTO 09-ago-2026 (`condomanager@e64e9b0`) — Datos:**
  migración (`casa`, `criterio_identificacion_unidad` con default
  `MANZANA_LOTE`, relajar NOT NULL de manzana/lote/codigo_predial,
  trigger de obligatoriedad condicional). Sin backfill hardcodeado por
  condominio. Verificado con 7 pruebas transaccionales (rollback, sin
  dejar datos): rechaza campo faltante según criterio activo, acepta
  cuando está el campo correcto, rechaza `casa` duplicada, cambio de
  criterio no rompe filas existentes. Punta Blanca confirmada intacta,
  en el default `MANZANA_LOTE` hasta que se cambie desde el control
  real (Fase 1).
- **Fase 1 — Módulo Unidades (bucket A):** la fuente. Control siempre
  visible para elegir/cambiar el criterio; formularios de
  crear/editar/importar muestran y exigen solo el campo correspondiente.
- **Fase 2 — Resolver + bucket B (15 archivos):** `identificadorUnidad()`
  y reemplazo en los 15 lugares de solo-lectura.
- **Fase 3 — Bucket C (reportes/rubros-por-unidad):** rediseño de filtros.
- **Fase 4 — Bucket D (residentes/importar):** matching por criterio en
  vez de manzana-lote fijo — el más riesgoso, se hace con más cuidado y
  pruebas.
- **Fase 5 — Validación:** `lib/unidades/validar.ts`, typecheck, eslint,
  pruebas transaccionales del trigger, verificación con Gina en vivo.

## Resuelto con Gina (ya no está pendiente)

- **¿Se bloquea cambiar el criterio después de la primera unidad?** No.
  Es un control siempre visible y editable en el módulo de Unidades, no
  un gate de una sola vez — ver "Dónde se configura" arriba.
- **¿El nombre del campo `casa` es el correcto?** Sí, confirmado — y es
  alfanumérico (Algarrobos de la Viña pone número, otros condominios
  ponen texto), por eso el tipo es `text`, no `integer`.

## Pendiente de confirmar con Gina antes de ejecutar

- Orden de fases: propuesto 0→1→2→3→4→5 en ese orden porque cada fase
  depende de que la anterior exista, pero se puede pausar entre fases
  para probar en vivo.
