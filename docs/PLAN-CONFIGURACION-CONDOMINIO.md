# Plan — Reordenar Configuración/Parametrización de CondoManager

Nace de una pregunta de Gina sobre si se puede compartir una URL directa a
un condominio, que llevó a revisar el menú de Configuración completo.
Confirmado con lectura de código, no supuesto — ver hilo en el chat del
09-ago-2026 y [AUDITORIA-CONDOMANAGER.md](AUDITORIA-CONDOMANAGER.md) 🔵-4
y siguientes para el resto de hallazgos de esa sesión.

## Causa raíz

Dos reglas que nunca existieron:

1. **No hay criterio de agrupación de pantallas.** 14 pantallas de un solo
   formulario repartidas en dos menús (`Configuración`, `Parametrización`)
   sin una regla — cada una se agregó donde había espacio cuando se
   construyó. Ejemplo que lo delata: "Seguridad" (2FA, sesión) vive en
   `Parametrización` junto a Rubros y Morosidad, pero es tan "cuenta" como
   Identidad Visual, que vive en `Configuración`.
2. **No hay política de dónde vive un dato.** Unas pantallas escriben
   columnas propias de `condominios` (Generales, Legales, Ubicación,
   Contacto); otras escriben dentro de `condominios.configuracion`
   (JSONB), cada una en su propia llave (Facturación, Identidad,
   Seguridad, Reportes, Morosidad, Residentes-parametrización). Las que
   usan JSONB con llave propia están aisladas por construcción — nunca se
   pisan entre sí, porque cada handleSubmit hace "leer todo el JSON →
   fusionar solo su llave → guardar". Las que usan columnas planas
   (Ubicación, Contacto) no tienen ese aislamiento.

De (2) sale un bug real, no solo estético: **Ubicación y Contacto escriben
las mismas 3 columnas** (`direccion`, `latitud`, `longitud`) de
`condominios`, cada una con su propio formulario que no sabe del otro. Si
actualizás la dirección en Ubicación y después guardás cualquier cambio en
Contacto (aunque sea solo el teléfono), Contacto reescribe
`direccion`/`latitud`/`longitud` con la copia vieja que cargó al abrir esa
pantalla — **se pierde el cambio, sin ningún error visible.**

De (1)+(2) sale la duplicación de captura que vio Gina: "Datos Legales del
Emisor (SRI)" en Facturación vuelve a pedir razón social y dirección, ya
capturadas en Legales/Ubicación, guardadas en un lugar distinto de la
base (JSONB vs. columnas), sin ningún vínculo entre ambos.

## Alcance real, verificado leyendo cada archivo (no asumido)

- **Ubicación ↔ Contacto**: comparten `direccion`/`latitud`/`longitud` en
  `condominios`. Bug de pérdida de datos activo hoy.
- **Facturación → `lib/facturacion/service.ts`** (el generador real del
  PDF de factura) ya tiene fallback para 2 de los 3 campos duplicados:
  - `direccion_facturacion` → cae a `condominio.direccion` si está vacío. ✅ ya correcto.
  - `email_facturacion` → cae a `condominio.email` si está vacío. Gina
    confirmó que es un caso de uso real y distinto (correo de
    contabilidad ≠ correo de acceso al sistema) — **se queda, no se
    toca.**
  - `nombre_facturacion` → cae a `condominio.nombre` (el nombre simple de
    Generales) si está vacío. **Esto está mal**: existe
    `condominios.nombre_comercial` (capturado en Legales, pensado
    exactamente para esto) que **nadie lee en ningún lugar del código** —
    confirmado con grep, cero consumidores. Es dato muerto hoy.
- **Superadmin tiene su propia pantalla de "Facturación"**
  (`app/(dashboard)/panel/superadmin/configuracion/page.tsx`, tabla
  `global_config`, campos con los mismos nombres) — pero es la
  facturación de **SORSABSA a los condominios** (plataforma → cliente,
  para cobrar la suscripción), no la de condominio → residente. Mismo
  patrón de campos por coincidencia, alcance completamente distinto.
  **Fuera de este plan** — lo registro para que quede constancia de que
  no se pasó por alto, no que se ignoró.
- **`residentes` / `datos_facturacion`**: revisado completo
  (`nuevo`/`[id]/editar`). **No requiere cambios** — ya tiene el checkbox
  "Usar los mismos datos del residente para facturación", con espejo
  automático mientras está marcado y campos independientes reales solo
  cuando se desmarca a propósito (caso "facturar a nombre de otra
  persona"). Es el patrón correcto; el problema es específico del nivel
  condominio.
- **Los 4 campos de numeración SRI** (Establecimiento, Punto Emisión,
  Siguiente Secuencial, Ambiente SRI) — **no se tocan.** Tienen que seguir
  siendo editables a mano: un condominio que ya facturaba con otro
  sistema necesita poder continuar su numeración real, no reiniciar en 1.

## Fases

### Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`)

Fusionar Ubicación + Contacto + Identidad Visual + Generales en "Perfil del condominio"

La más urgente: es la que tenía el bug de pérdida de datos activo.

**Ajuste sobre el plan original, a pedido de Gina:** no un formulario
plano de 14 campos — organizado en pestañas (General / Ubicación /
Contacto) dentro de un único `<form>`, con un solo botón Guardar visible
sin importar la pestaña activa. Sigue siendo un solo `formData` y un
solo `handleSubmit` (el bug se elimina igual, por construcción), solo
que presentado sin abrumar. Tabs extraído a un componente reutilizable
(`app/components/ui/Tabs.tsx`) porque ya era el segundo lugar que
necesitaba el mismo patrón que Facturación tenía inline.

También aclaró Gina: "Nombre Comercial" y "Razón Social" (en Legales)
son campos reales y distintos establecidos por el SRI ecuatoriano — no
son duplicados entre sí, no se tocan en ninguna fase de este plan.

- Nueva ruta `app/(dashboard)/panel/admin/configuracion/perfil/page.tsx`:
  un solo `formData`, una sola carga (`cargarDatos`), un solo
  `handleSubmit` con un único `.update()` que incluye todos los campos:
  `nombre` (solo lectura, ya lo es hoy), `slug`, `pais`, `provincia`,
  `ciudad`, `sector`, `direccion`, `latitud`, `longitud`, `email`,
  `telefono`, `sitio_web` — más `logo_url`/`eslogan` (siguen en
  `configuracion.identidad`, mismo patrón fetch-merge-write que ya usan
  las pantallas JSONB, no cambia de lugar).
- Borrar `ubicacion/page.tsx`, `contacto/page.tsx`, `identidad/page.tsx`.
  `generales/page.tsx` se fusiona también (nombre + slug ya están cubiertos
  arriba).
- Compatibilidad: `/configuracion/{ubicacion,contacto,identidad,generales}`
  quedan como `redirect()` a `/configuracion/perfil`, para no romper
  enlaces guardados o accesos directos que ya existan.
- Sidebar (`DashboardShell.tsx`): las 4 entradas actuales se reemplazan
  por una sola, "Perfil del condominio", primera del grupo (es lo primero
  que se configura al crear un condominio).
- Por qué esto elimina el bug por construcción, no lo parcha: al no
  existir dos `formData` independientes para las mismas columnas, no hay
  forma de que uno pise al otro — no es una regla nueva a recordar, es
  que la segunda copia deja de existir.

### Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`)

Facturación: quitar los campos duplicados, arreglar el fallback roto

- Quitar del formulario de Facturación: `nombre_facturacion` y
  `direccion_facturacion` (los 2 campos de "Datos Legales del Emisor
  (SRI)" que repetían Legales/Perfil). Se queda `email_facturacion` tal
  cual, y los 4 campos de numeración SRI intactos.
- `lib/facturacion/service.ts`, función que arma `emisorData`:
  - `nombre_comercial`: cambia de `configFact.nombre_facturacion ||
    condominio.nombre` a `condominio.nombre_comercial ||
    condominio.nombre` — arregla el bug de que "Nombre Comercial" de
    Legales nunca se leía en ningún lado.
  - `direccion`: cambia de `configFact.direccion_facturacion ||
    condominio.direccion || "Quito, Ecuador"` a `condominio.direccion ||
    "Quito, Ecuador"` — se quita el nivel intermedio que ya no existe.
  - `email` no cambia.
- Backfill antes de borrar el campo del formulario: verificar por SQL
  cuántos condominios reales tienen
  `configuracion.facturacion.nombre_facturacion` o `direccion_facturacion`
  con un valor distinto de `nombre_comercial`/`direccion` — si hay alguno,
  copiar ese valor a la columna correspondiente antes de quitar el campo
  de la UI, para no perderlo. (Verificar con SQL antes de asumir "no hay
  datos", como en 🔵-3/🔵-4 — no repetir el error de asumir.)

**Ejecutado:** verificado por SQL antes de tocar código — el condominio
real ya tenía `nombre_comercial`/`direccion` completos (vienen de
Legales/Perfil) y `nombre_facturacion`/`direccion_facturacion` nunca se
habían llenado. Cero backfill necesario.

Primer intento (`condomanager@e9dcf0f`): la sección pasó de "Datos
Legales del Emisor (SRI)" (3 campos editables) a "Identidad del
Emisor" — un resumen de **solo lectura** de razón social/nombre
comercial/dirección, con link a dónde editarlos de verdad.

Gina lo corrigió el mismo día: "pero para que repetir otra vez los
datos que ya aparecen en otra ficha, solo debería pedir el correo de
facturación" — mostrar el dato de solo lectura seguía siendo mostrarlo
dos veces. **Corregido a `condomanager@feee488`:** Facturación pide
únicamente el correo de facturación (el único campo real y propio de
esta pantalla, caso de uso legítimo y distinto del correo de contacto
general). Ni un valor de razón social/nombre comercial/dirección se
repite en ningún lado — solo un link de texto a Datos Fiscales/Perfil
del condominio, sin mostrar los valores.

### Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar

Sin bug de por medio, es la parte de "eficiencia del menú" que preguntó
Gina. Antes de tocar código se le explicó en texto plano (sin código) el
estado real del sidebar y la propuesta, porque la primera vez no pudo
evaluarla en abstracto — con eso confirmó.

Grupos finales (Gina pidió "Identidad", no "Identidad y legal"):

- **Identidad**: Perfil del condominio, Legales, Facturación, Medios de
  Pago, Notificaciones. Marketplace/Suscripción queda fuera — ya era un
  ítem independiente del acordeón, no parte de Configuración/
  Parametrización (verificado en el código antes de escribir esto, la
  primera versión de este plan lo tenía mal incluido).
- **Operación**: Rubros y Cobros, Morosidad, Reportes, Residentes.
- **Cuenta**: Seguridad — el único ítem que cambia de grupo, se muda
  desde `Parametrización`.

Cambió solo el sidebar (`DashboardShell.tsx`): título de los 2
acordeones (`Configuración`→`Identidad`, `Parametrización`→`Operación`)
más un tercero nuevo (`Cuenta`), `AdminSection` y
`getAdminSectionFromPath` actualizados para que el acordeón correcto
siga abriéndose solo según la URL. Ninguna ruta ni pantalla se tocó.
Verificado: typecheck limpio, eslint 0 errores/warnings.

### Fase 4 — Verificación y cierre — 🔧 casi cerrada (15-ago-2026)

- ✅ `npx tsc --noEmit`: limpio sobre el proyecto completo (reverificado
  15-ago-2026).
- ✅ Entrada en la auditoría: ya existe —
  [AUDITORIA-CONDOMANAGER.md](AUDITORIA-CONDOMANAGER.md) 🟠-3, "Ubicación y
  Contacto escribían las mismas columnas sin saberlo — pérdida de datos
  real", marcada RESUELTO 09-ago-2026. Se anotó como pendiente acá por
  duplicado; ya estaba hecho.
- ✅ SQL antes/después de la Fase 2: verificado en su momento — el
  condominio real tenía `nombre_comercial`/`direccion` completos y
  `nombre_facturacion`/`direccion_facturacion` nunca se habían llenado, así
  que no hubo nada que respaldar ni migrar.
- ⬜ **Único pendiente real:** validación en vivo — Gina entra a "Perfil del
  condominio" y a "Facturación" y confirma que ve sus datos actuales tal
  cual estaban.

## Orden recomendado

Fase 1 primero (bug activo de pérdida de datos, la más urgente) → Fase 2
(duplicación real + bug del fallback, sin pérdida de datos pero con
consecuencia legal en la factura) → Fase 3 (reordenar sidebar, cosmético,
se puede hacer junto con 1 y 2 en el mismo PR o después, no tiene apuro) →
Fase 4 en cada fase, no solo al final.

## Decidido y ejecutado (ya no está pendiente)

Esta sección preguntaba dos cosas que la Fase 3 ya resolvió y ejecutó el
09-ago-2026; se cierran acá el 15-ago-2026 para que el documento no invite
a rediscutirlas:

- **¿Fase 3 en el mismo lote que 1 y 2?** No: fue por separado, en
  `condomanager@2d9c0a9`, después de explicarle el sidebar en texto plano.
- **Nombre de los grupos:** Gina eligió **Identidad** (no "Identidad y
  legal") / **Operación** / **Cuenta**.
