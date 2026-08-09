# Arquitectura del ecosistema SORSABSA

Levantado el 2026-07-26 recorriendo repos, bases de datos y despliegues.

**Cada afirmación lleva su origen.** ✅ = comprobado en vivo (consulta SQL,
petición HTTP, lectura del código). ⚠️ = inferido de despliegues o commits, sin
abrir el código. ❓ = no verificado, solo se sabe que existe.

Este documento existe porque nada de esto estaba escrito, y cada sesión de
trabajo lo redescubría desde cero — a veces rompiendo algo en el intento.

---

## 1. Inventario

### Verticales (lo que un cliente compra)

| Producto | Repo | Plataforma | Estado verificado |
|---|---|---|---|
| Agente24Siete | `agente24siete` | Vercel | ✅ pila completa; canal WhatsApp baneado por Meta |
| DomusCRM | `crm_inmobiliario` (remoto: `domuscrm`) | Vercel | ⚠️ despliega; base pausada |
| CondoManager | `condomanager` | Vercel | ❓ solo se revisó su landing |
| JustiRed | `legaltech` | Vercel | ✅ SPA sano; su motor de OCR no vive aquí |

> **Convertidor — NO es producto hoy (decisión 2026-07-30).** Nació y sigue
> siendo herramienta interna para el trabajo forense/pericial (OCR de evidencia
> escaneada). Hay un frontend Next.js (tienda, plan Pro, pagos) construido con la
> idea *futura* de exponerlo como web pública tipo iLovePDF para traer tráfico —
> pero **falta mucho y hoy no se sostiene**. El proyecto Vercel `convertidor`
> llevaba 10/10 despliegues en ERROR (nunca sirvió una página), así que se elimina
> para no gastar cupo ni recibir correos de fallo. El código del front queda
> **aparcado, no muerto**, en el repo `ginaproanio/convertidor`; cuando se retome
> la idea se re-importa a Vercel apuntando a `frontend/` (y antes hay que sacar el
> servicio `backend` del `vercel.json`, que es lo que rompía el build). Hoy queda
> solo el backend OCR (§2), en contenedor (Railway) o local, invocado directo.
> **No re-desplegar en Vercel por ahora.**

### Transversales (no se venden solos — cruzan todos los verticales)

Terminología fijada por Gina, 09-ago-2026: **vertical** = producto que un
cliente contrata (Agente24Siete, DomusCRM, CondoManager, JustiRed —
crecen agregando funciones DENTRO de su propio dominio). **Transversal**
= sistema que ningún vertical vende por sí solo, pero que TODOS
consumen igual (Pagos, Suscripciones, Notificaciones, SSO, Geo...) — un
cambio ahí afecta a todos los verticales a la vez, por eso vive fuera de
cualquiera de ellos. Antes tabulado como "Servicios compartidos"; mismo
contenido, nombre corregido para que quede claro que la relación es de
cruce (todo vertical depende de cada transversal), no de jerarquía.

| Servicio | Repo | Estado |
|---|---|---|
| Pagos | `pagos-sorsabsa` | ⚠️ 20/20 despliegues verdes; base propia en Railway (Postgres, proyecto `SORSABSA-DATA`) desde la migración del 30-jul-2026 (§3) — **ya no depende de CondoManager**, corregido 09-ago-2026 (afirmación vieja de esta misma fila) |
| Suscripciones | *(sin repo propio — hoy vive dentro de `pagos-sorsabsa`)* | ⚠️ Sistema **conceptualmente independiente** de Pagos — "¿quién tiene acceso a qué?" es una pregunta distinta de "¿cómo se procesó este cobro?" — aunque hoy comparten repo, base y schema Postgres (`pagos.suscripciones`, junto a `pagos.pagos`/`pagos.comercios`/`pagos.referido_*`). Expone su propio contrato HTTP (`/api/entitlements`, `/api/crear-trial`, `/api/extender-suscripcion`) que ya es, de hecho, un servicio aparte — solo falta que la infraestructura lo refleje. Ver `AUDITORIA-PORTERO-SSO.md` 🔴-6: el gap real hoy es que ningún producto (ni agente24siete) se integra con este sistema como un contrato propio — o lo ignora del todo, o lo trata como tablas internas de pagos-sorsabsa. |
| SSO | `auth-sorsabsa` | ⚠️ 16/16 verdes; 6 apps registradas (domuscrm, condomanager, agente24siete, justired, convertidor, `iot` — este último desde 08-ago-2026, ver PENDIENTES-ECOSISTEMA.md #14) |
| Notificaciones | `notificaciones-sorsabsa` | ❓ |
| Geo | `geo-sorsabsa` (`@sorsabsa/geo`) | ✅ v0.1.0, Leaflet + OpenStreetMap, sin API key — ver §4-bis |
| Design system | `diseno-sorsabsa` (`@sorsabsa/ui`) | ✅ v0.1.36 |
| QA cíclico (monitor, no producto) | `qa_sorsabsa` | ✅ Nunca documentado acá hasta 08-ago-2026 (Gina: "debería estar en el ecosistema"). Runner Node puro sin dependencias, cero IA/tokens en runtime — GitHub Actions cron cada 2h + push a main + botón manual, contra `condomanager.vip`, `domuscrm.app`, `agente24siete.app`, `justired.com`, `auth.sorsabsa.com`, `pagos-sorsabsa` en Railway. Al fallar: 1 reintento, evidencia a `evidence/` (artifact 14 días), issue automático (`qa-fallo`). README dice 18 checks/6 objetivos; `TODO.md` (su propio doc) quedó con la cabecera de una fase anterior — 12 checks, sin JustiRed — típico de un repo con dos documentos que no se actualizan juntos. **✅ Verificado en vivo 08-ago-2026 con `gh run list`: corriendo cada ~2h como está diseñado, 8/8 últimas corridas en verde**, última a las 14:24 UTC. |
| Generador de contenido (Facebook + YouTube) | `ginaproanio/news` (local: `sorsabsa-content`, en unidad `D:\` con poco espacio — no asumir que existe local, todo lo que importa ya está en el repo) | ✅ desplegado en Railway, proyecto `contenido-sorsabsa`. `ANTHROPIC_API_KEY` sigue pendiente de configurar en Railway (la del `.env` local está inválida y ese archivo no está en git a propósito). **Detalle de fases y estrategia en `docs/plan.md` y `docs/youtube.md` DENTRO del repo** (se movieron ahí el 2026-08-06 porque solo vivían en la unidad local sin respaldo). Banco de casos reales verificados por categoría de CPM (Finanzas/Gaming/Tecnología/Negocios/Cripto/Lujo) ya implementado en `main.py` (`HISTORIAS_BANCO`), con regla dura de no reclamar autoría de casos ajenos a SORSABSA. Pendiente: subida automática a YouTube (Fase 3, YouTube Data API v3 sin construir — hoy todo se sube manual), pipeline de video real con Motion (marca/logo ya preparados, esperando acreditación de pago), y persistencia/analítica de qué guion tuvo mejor rendimiento por categoría (no existe todavía, cada guion se genera al vuelo y no se guarda). |

---

## 2. Los dos planos

El ecosistema necesita **dos** tipos de plataforma. Hoy solo existe uno, y ese
es el origen de que lo pericial nunca haya salido a producción.

### Plano web — Vercel ✅ correcto

Agente24Siete · DomusCRM · CondoManager · SPA de JustiRed · auth.

Todo es petición → respuesta, sin binarios. Vercel es la herramienta adecuada.

> **Corregido el 2026-08-07:** esta lista traía `pagos` y `notificaciones`,
> desactualizado desde el cutover del 30-jul (§7): ambos se movieron **por
> completo** a Railway —API y base— y sus proyectos en Vercel ya no existen.
> No quedan en el plano web. `auth` sí sigue acá: su API (`auth-sorsabsa`) es
> Vercel, la base de identidad es Supabase — no tiene nada que ver con
> Railway (ver §9 pendiente y `PLAN-DESOLDADO.md`).

### Plano de proceso — YA EXISTE, parcialmente ✅ (corrección 2026-07-30)

> **El Convertidor ya está en Railway y su OCR funciona.** Verificado el
> 2026-07-30 con peticiones reales, no por lectura de repo:
>
> `https://convertidor-production-7ca8.up.railway.app`
> · `GET /` → `200 {"status":"online","service":"convertidor","version":"1.2.0"}`
> · `POST /convert` → `200 {markdown, pages, ocr_used, size}`
> · `POST /convert?force_ocr=true` → `ocr_used: true` — **Tesseract instalado en
> el contenedor**
> · `GET /health` → `404`: ese endpoint no existe, comprobar con `GET /`
>
> Con esto, el pendiente nº 1 de §9 —el único con fecha, por estar solo en la
> máquina vendida— **está cumplido**. El scraper de JustiRed sigue fuera de
> Railway; lo que le impide funcionar ya no es infraestructura sino cuatro
> defectos en su código, documentados en `legaltech/docs/biblioteca-legal.md`.
>
> **También están en Railway `pagos-sorsabsa` y `notificaciones-sorsabsa`**
> (proyecto `SORSABSA-DATA`), verificado el 2026-07-30: los dos responden 200 y
> comparten el Postgres del mismo proyecto. No fueron por binarios —son Node
> puro— sino para vivir **junto a su base** y dejar de depender del proyecto
> Supabase de CondoManager (§3).
>
> **Lección de método:** la primera versión de este análisis dedujo "no está
> desplegado" de la ausencia de `railway.toml` en el repo local. Railway se
> configura entero desde su panel, así que esa ausencia no prueba nada. **El
> estado de un servicio se comprueba con una petición, no con un `grep`.**

El resto de la sección describe el estado anterior a esa corrección:

### Plano de proceso — NO EXISTE ❌

Necesita contenedores (Railway, VPS, Fly): binarios, procesos largos,
navegadores headless, conexiones persistentes.

| Componente | Por qué no cabe en Vercel |
|---|---|
| Convertidor backend | `pytesseract` (binario Tesseract) + `easyocr` (arrastra PyTorch) ✅ |
| Scraper de JustiRed | `playwright` = Chromium, ~150MB ✅ |
| SORSABSA Forensic | pericial, hoy local ❓ |
| IoT | conexiones persistentes ❓ |

**Se comunican por HTTP.** El frontend en Vercel llama al backend en el
contenedor. No hay que mover la capa web: hay que **añadir** la segunda.

---

## 3. Mapa de bases de datos — LA TRAMPA

Supabase, organización `SORSABSA_Corp` (`wzhfxbqvalgipuixcugg`), **plan Pro**
✅ comprobado por API el 2026-07-30.

### Estado ✅ verificado en SQL el 2026-07-30 — nombre y ocupantes actualizados 08-ago-2026

⚠️ **El proyecto de abajo YA NO se llama `condomanager` en el Dashboard.**
Gina lo renombró a **`verticales_sorsabsa`** el 08-ago-2026 — el `ref`
(`twkuidnjwhopbjnrhnxp`), la URL y las API keys no cambian, es solo el
nombre visible. El cambio refleja que dejó de ser "la base de
CondoManager con inquilinos": ya tenía tres productos antes (ver fila),
y ese mismo día se sumó un cuarto, `iot` (auth-only, sin schema propio —
detalle en pendiente #14 de `PENDIENTES-ECOSISTEMA.md`), sin que quedara
anotado acá en su momento. Si algún texto más abajo en este documento
todavía dice "proyecto de CondoManager", es narración histórica de
cuando ese era el nombre real — no se reescribió retroactivamente, pero
la fila de esta tabla es la que manda para el estado actual.

| Proyecto | Ref | Estado | Qué contiene |
|---|---|---|---|
| `verticales_sorsabsa` (antes `condomanager`) | `twkuidnjwhopbjnrhnxp` | ACTIVO | **TRES esquemas de producto: `public` (40 tablas, CondoManager) · `domus` (27, DomusCRM) · `justired` (6, JustiRed)** + `auth` (23 tablas, **4 usuarios + 2 de `iot`, sumados 08-ago-2026 — recuento sin reverificar**) + `storage` |
| `sorsabsa-identity` | `gyqgorgfstffbgazhbnb` | ACTIVO | **vacío**: `public` sin tablas, `auth` con **0 usuarios**. Creado el 2026-07-29 y nunca poblado |
| `agente24siete` | `nwcqaginlnzjlkgwifas` | ACTIVO | ✅ `public` (15), `auth`, `storage`. Un solo dueño |

**Son tres. No hay más.** Los proyectos `justired` (`jywrjkfamdtcoehlsiup`) y
`sorsabsa_ecosystem` (`tkkpqbelzwoenmeynjvw`) que listaba la versión anterior de
este documento ya no existen, y `domuscrm` (`owilvzdcdipmrzeaeznw`) **lo borró
Gina el 2026-07-30** — confirmado por API después del borrado. Si algún
documento, variable o memoria menciona alguno de esos tres refs, está viejo.

### Qué cambió desde el 2026-07-26

- ✅ **`pagos` y `notificaciones` salieron de aquí.** Contenedor y base están en
  Railway (§7). Los esquemas que quedaban en Supabase se borraron el 2026-07-30
  —migración `retirar_pagos_y_notificaciones_migrados_a_railway`— junto con los
  roles `pagos_runtime` y `notificaciones_runtime`. **El acoplamiento que dejó
  sin cobro ni avisos a los cuatro productos está roto.**

  > Comprobado antes de borrar: 0 FK entrantes, 0 vistas dependientes, 0
  > objetos propiedad de esos roles y ningún repo consultando esos esquemas
  > (los productos llaman por HTTP a `PAGOS_API_URL` / `NOTIFICACIONES_API_URL`).
  > Eso es lo que importaba: que nada apunte ahí.
  >
  > **Regla de método al informar: las filas se cuentan con `COUNT(*)`.**
  > `pg_stat_user_tables.n_live_tup` da **0 para todos los esquemas de esta
  > base** —incluidos `domus`, que tiene 262 filas, y `public`, que tiene 133—
  > porque autovacuum nunca corrió. Quien lo use va a decir "está vacío" de algo
  > que no lo está. No es riesgo de datos (§3-bis): es riesgo de afirmar
  > falsedades en un informe.
- ✅ **Se borró el proyecto `domuscrm` (`owilvzdcdipmrzeaeznw`).** Era el
  cascarón que DomusCRM dejó al migrar al schema `domus` del consolidado el
  9-jul-2026 (`crm_inmobiliario/backend/sql/006_consolidacion_sorsabsa.md`).
  Llevaba 21 días pausado, su host ni siquiera resolvía en DNS, y DomusCRM en
  producción respondía normal sin él. Causaba una sola cosa: confusión sobre
  cuál era la base viva. **La base viva de DomusCRM es el schema `domus` del
  proyecto de CondoManager.**
- ⚠️ **Entró `justired`.** JustiRed abandonó su proyecto propio y se consolidó
  como schema dentro del proyecto de CondoManager — `legaltech/.env:1` apunta a
  `twkuidnjwhopbjnrhnxp`. Se quitó un inquilino y se metió otro.

### ⚠️ Acoplamiento que sigue vivo

Dentro del proyecto de **CondoManager** conviven todavía tres productos
(`public`, `domus`, `justired`) **y la identidad de todo el ecosistema**
(`auth`, con los 4 usuarios). Pausar o romper ese proyecto tumba a la vez
CondoManager, DomusCRM, JustiRed y **el login de todos**.

Un servicio compartido por todos —la identidad— **no puede vivir dentro de un
producto**. Y ya no hay razón de plataforma para que siga ahí (ver abajo).

### 3-bis. NO HAY DATOS DE CLIENTES. Punto.

**Regla dura, dictada por Gina el 2026-07-30 tras tener que repetirla:**

> Ningún entorno del ecosistema tiene información de clientes. Lo que haya en
> cualquier base —CondoManager, DomusCRM, JustiRed, pagos, notificaciones— es
> **dato de prueba, dato basura**. Precisamente por eso se están haciendo ahora
> las migraciones y los movimientos: **este es el momento en que mover cosas no
> cuesta nada.**

**Consecuencias operativas, para no volver a discutirlo:**

- **No frenar una migración, un borrado de schema o el borrado de un proyecto
  por miedo a perder datos.** No hay nada que perder.
- **No proponer respaldos, restauraciones ni ventanas de retención** como paso
  previo a mover o borrar. Sobra.
- Lo que sí hay que verificar antes de borrar **no es el contenido, es el
  cableado**: que ninguna variable de entorno, ningún `DATABASE_URL`, ningún
  valor por defecto en el código y ninguna FK apunte a lo que se va a borrar.
  Ese es el riesgo real — romper un despliegue, no perder un registro.
- Esta regla caduca sola: **deja de valer el día que entre el primer cliente
  real** (Punta Blanca en CondoManager, EcoInmobiliaria en DomusCRM). Ese día
  hay que volver aquí y tacharla.

### El límite de 2 proyectos ya no existe — y la separación sigue sin hacerse

La consolidación original se hizo para caber en el límite de **2 proyectos
activos del plan gratuito**: activar agente24siete obligaba a pausar
CondoManager. Ese límite **ya no aplica**: la organización está en Pro.

Lo que cuesta ahora es el cómputo de cada proyecto adicional: **$10/mes por
proyecto nuevo** ✅ (cifra devuelta por la API de Supabase el 2026-07-30; el
costo base de la suscripción Pro no se verificó aquí).

**Pagar Pro no separa nada por sí solo.** Quita la restricción; mover cada
schema a su proyecto es trabajo manual (crear proyecto, migrar schema,
repuntar `DATABASE_URL`/llaves). Hoy la suscripción está pagada, el proyecto de
identidad `sorsabsa-identity` está **creado y vacío**, y los 4 usuarios siguen
dentro de CondoManager. **Se está pagando la capacidad de separar sin haber
separado** — ese es el estado real, y el pendiente nº3 del §9.

---

## 4. Almacenamiento

Los tres productos con subida de archivos usan **Supabase Storage**, ninguno
escribe en disco ✅ — correcto, en Vercel el sistema de archivos es efímero.

Los cinco cubos ✅ contados el 2026-07-30, todos en el proyecto consolidado
`twkuidnjwhopbjnrhnxp`:

| Cubo | Público | Objetos |
|---|---|---|
| `condomanager-certificados` | no | 1 |
| `property-media` (DomusCRM) | sí | 0 |
| `condomanager-firmas` | sí | 0 |
| `condomanager-inmuebles` | sí | 0 |
| `justired-legal-documents` | sí | 0 |

**Consecuencia del §3:** Storage vive DENTRO del proyecto. Pausar el proyecto de
CondoManager apaga las fotos y las firmas de los tres productos, no solo su base.

⚠️ **Cuatro de los cinco cubos son públicos**, incluidos `condomanager-firmas`
—firmas de directiva— y `justired-legal-documents`. Un cubo público sirve por
URL directa y adivinable. Cuando entre contenido real, firmas y documentos de
identidad tienen que estar en el cubo PRIVADO de R2 con enlace firmado (§7); hoy
no hay fuga porque están vacíos, pero la configuración ya está mal puesta.

### Defectos verificados

- ✅ `webs/src/app/api/upload/route.ts` limita a **4MB por archivo** (techo del
  cuerpo de una función en Vercel: 4.5MB). Una foto de celular pesa 5-12MB: en
  un CRM inmobiliario se rechaza buena parte de las fotos reales. El arreglo no
  es subir el límite, es que el navegador suba **directo a Supabase Storage**
  con URL firmada, sin pasar por Vercel.
- ✅ Ese mismo archivo cae por defecto a `twkuidnjwhopbjnrhnxp` (CondoManager)
  si falta `NEXT_PUBLIC_SUPABASE_URL`. En producción está puesta, así que no
  dispara — pero en previews escribiría en el proyecto equivocado.

---

## 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)

Gina preguntó por qué esto no estaba documentado, viendo abierto en el
navegador `console.cloud.google.com/apis/library?project=sorsabsaecosystem`.
Se revisó código, no se adivinó — esto es lo que hay:

### Geo: NO usa la API de Google Maps (la que factura)

`@sorsabsa/geo` (`geo-sorsabsa`) es el paquete compartido de mapas — mismo
patrón de publicación que `@sorsabsa/ui` (source `.tsx` crudo, consumido por
tag de GitHub). ✅ Verificado leyendo su código: usa **Leaflet +
OpenStreetMap**, explícito en su propio README (`<LocationPicker>`, *"sin API
key, sin facturación"*).

**Quién lo consume hoy:** solo `crm_inmobiliario/webs` (DomusCRM, ubicación de
inmuebles en la web pública) tiene `@sorsabsa/geo` en su `package.json`.
CondoManager **no** lo consume todavía.

### SorsabsaForensic SÍ usa Google Maps — pero no la API pagada, y es un módulo aparte

Repo real: `ginaproanio/sorsabsaforensic`, local en `c:/sorsabsa/SorsabsaForensic`
(no confundir con la carpeta `Sorsabsa2`, que está vacía y ni es un repo git —
error propio en esta misma sesión, corregido antes de escribir esto).

`core/processors/georeferencia/processor.py` (✅ leído completo) es un módulo
de georreferenciación forense real y sofisticado: resuelve enlaces cortos de
Google Maps registrando CADA salto de redirección, extrae coordenadas del
lugar (no del encuadre — distinción deliberada, con caso real citado en el
código), captura con Playwright las vistas de mapa/satélite/calle con hash
SHA-256 de cada una, y mide distancia+rumbo entre puntos (haversine, radio
declarado) para sostener afirmaciones de proximidad en un informe pericial.

Es **independiente de `@sorsabsa/geo`** — no podría ser de otra forma:
`@sorsabsa/geo` es un paquete React/TypeScript (`import` de npm) y
SorsabsaForensic es Python/PyQt5, no puede consumirlo directo. Y usa las URLs
**públicas y documentadas** de Google Maps (`developers.google.com/maps/documentation/urls`),
sin clave — el propio código lo declara: *"para que cualquiera pueda
reconstruirlas"*. No pasa por la API de pago (Maps JavaScript / Geocoding /
Places), que es la que se habilita y factura desde Cloud Console.

✅ Comprobado con grep en todo `SorsabsaForensic`: cero referencias a
`GOOGLE_MAPS_API_KEY`, `GEOCODING_API` ni `maps.googleapis.com` (el dominio de
la API con clave; las URLs que usa son `google.com/maps/...`, sin `api`).

### El proyecto de Google Cloud (`sorsabsaecosystem`) — ✅ confirmado por Gina: Calendar de agente24siete

**Dos correcciones seguidas sobre este párrafo, ambas por especular en vez de
encontrar el repo correcto primero — queda anotado para no repetirlo:** la
primera versión decía que probablemente era para el login de Google
(pendiente #10); la segunda, que era para la Static Maps API de `iot`.
Las dos eran suposiciones. **Gina lo confirmó directo: es "Sorsabsa Bot -
Calendar"** — la agenda de citas de agente24siete.

✅ Verificado en código después, no antes: `agente24siete/lib/calendar.js`
usa el paquete `googleapis` contra **Google Calendar API v3**, autenticado
por **cuenta de servicio** (`GOOGLE_SERVICE_ACCOUNT_JSON`, JWT — no OAuth de
usuario) con scope `calendar`. Es lo que le permite a agente24siete agendar
citas reales (horario comercial Ecuador UTC-5, `HORARIO_COMERCIAL` por día).
Esto es lo que había detrás de "Sorsabsa Bot": el nombre de la cuenta de
servicio.

**Nota aparte, no relacionada con `sorsabsaecosystem`:** al buscar esto se
encontró que `iot` (`c:/iot/iot`, producción Railway
`iot-production-d29b.up.railway.app` — repo no listado antes en este
documento) SÍ usa `GOOGLE_MAPS_API_KEY` contra la Static Maps API
(`report_service.py`, confirmado configurado en Railway por `todo.md:25`).
Puede ser el mismo proyecto de Cloud Console con dos APIs habilitadas, o uno
distinto — **no verificado, no asumir**. Nombre engañoso: **"IOT" es
"Inspección Ocular Técnica"**, un producto pericial, no dispositivos
IoT/sensores (el §2 de este documento lo mencionaba junto a "conexiones
persistentes" dando a entender lo segundo — corregir si se retoma esa
sección).

**Un tercer uso, sumado 08-ago-2026:** Gina decidió reusar este mismo
proyecto (`sorsabsaecosystem`) para el login con Google del pendiente #10
(`PENDIENTES-ECOSISTEMA.md`) — un ID de cliente OAuth nuevo ahí, sin tocar
la Calendar API que ya tiene. Facebook, en cambio, no puede compartir este
proyecto: es una plataforma de Meta, no de Google, necesita su propia app en
developers.facebook.com. Detalle completo del alta de los dos proveedores
en `PENDIENTES-ECOSISTEMA.md` #10.

✅ **Revisión de Meta de la app "Sorsabsa Identity" — APROBADA.** Enviada
08-ago-2026, aprobada el mismo día a las 18:55 GMT-5 ("Solicitud aprobada —
Completamos la revisión y se aprobaron las solicitudes y la configuración
de la app"), muy por debajo de los ~20 días estimados. App ID
`1851084815870458`. Con esto el login social (Google + Facebook) de
`sorsabsa-identity` queda en producción para cualquier usuario, no solo
administradores/testers. Detalle completo en `PENDIENTES-ECOSISTEMA.md` #10
— **no confundir con la revisión, aparte y todavía en curso, de la app
"Sorsabsa Asistente"** (WhatsApp de agente24siete, `PENDIENTES-ECOSISTEMA.md`
§ "En curso, 08-ago-2026").

### Tres implementaciones de geo independientes, una de ellas duplicada dos veces

Encontrado a partir de la pregunta de Gina de si el grafo cubría
`geo-sorsabsa` y de si debía "estandarizarse en base a lo que SorsabsaForensic
necesita, con los demás consumiéndolo" — y la evidencia le da la razón:

1. **`@sorsabsa/geo`** — picker de mapa (Leaflet/OSM, sin clave). Consumido
   por DomusCRM. Es un widget de UI, nada de cómputo geográfico.
2. **SorsabsaForensic** (`core/processors/georeferencia/processor.py`) —
   resuelve enlaces de Google Maps (cadena completa de redirecciones),
   extrae coordenadas del lugar, calcula distancia+rumbo (haversine). Sin
   clave, URLs públicas documentadas. El más completo y riguroso de los tres.
3. **`iot`** (`report_service.py::_maps_replace`) — **repite la misma
   extracción de coordenadas** que SorsabsaForensic (`regex @(-?\d+\.\d+),(-?\d+\.\d+)`
   sobre un enlace de Google Maps), pero de forma más simple, sin la cadena de
   redirecciones ni la distinción lugar-vs-encuadre que SorsabsaForensic sí
   hace (y que su propio código explica que importa: un error de decenas de
   metros). Escrita de forma independiente — cero código compartido con
   SorsabsaForensic pese a resolver el mismo problema.

**Por qué esto es un riesgo real, no solo duplicación:** SorsabsaForensic y
`iot` son los dos productos periciales — sus informes sostienen afirmaciones
ante un tribunal (`processor.py` cita una causa real, 096-2026-TCE). Si sus
dos extracciones de coordenadas divergen para el mismo enlace, dos informes
sobre el mismo caso podrían reportar ubicaciones distintas. Eso no es un
defecto de estilo, es un riesgo de que un informe sea impugnable.

**Por qué la solución no puede ser un paquete npm más (como `@sorsabsa/ui`):**
SorsabsaForensic e `iot` son Python; `@sorsabsa/geo` es React/TypeScript. Un
paquete de código fuente compartido (el patrón de `@sorsabsa/ui`/`@sorsabsa/geo`)
no cruza esa frontera de lenguaje. El patrón que sí lo resuelve ya existe en
el ecosistema: **un servicio HTTP en Railway** (el mismo molde de
`pagos-sorsabsa`/`notificaciones-sorsabsa`) — cualquier lenguaje lo llama por
HTTP. Propuesta, sin empezar a implementar todavía:

- Extraer de SorsabsaForensic (la versión más rigurosa) la resolución de
  enlaces + extracción de coordenadas + distancia/rumbo a un servicio
  `geo-sorsabsa` en Railway.
- SorsabsaForensic e `iot` pasan a LLAMARLO en vez de tener su propia copia —
  `iot` deja de repetir una versión más débil de la misma lógica.
- `@sorsabsa/geo` (el paquete npm) sigue existiendo tal cual, sin tocar: es
  un widget de UI, un problema distinto, no necesita este servicio.
- Si conviene, el mismo servicio puede centralizar la llave de
  `GOOGLE_MAPS_API_KEY` (hoy solo en `iot`) para que no quede repetida si
  algún otro producto también necesita imagen estática de mapa.

**✅ Arrancado 08-ago-2026** — `geo-sorsabsa` commit `09cf93d`
(`geo-sorsabsa/service/`). Escrito, probado, sin desplegar todavía:

- `geo_core.py` porta `resolver_enlace` + `datos_del_enlace` +
  `distancia_y_rumbo` de SorsabsaForensic (no la captura con Playwright ni
  la resolución en navegador de enlaces por CID — gaps documentados en el
  README del servicio, no silenciosos).
- FastAPI, mismo molde que `convertidor/backend` (Dockerfile + `serve.py`
  con `$PORT`).
- Probado: 8/8 tests unitarios sin red + en vivo contra Google real
  (extracción de coordenadas correcta sobre una URL real, cadena de
  redirecciones de 2 saltos real). **Bug real encontrado y arreglado en el
  camino**: una URL con tilde/ñ sin percent-encoding (copiar la barra de
  direcciones directo, plausible en Ecuador) tumbaba `urllib` con
  `UnicodeEncodeError` — no estaba en el original, y no se portó de vuelta a
  SorsabsaForensic todavía (decisión aparte, ese repo no se tocó).

**✅ Desplegado y verificado en vivo, 08-ago-2026** —
`https://geo-sorsabsa-production.up.railway.app` (proyecto Railway
`passionate-grace`, root directory `service/`). `/`, `/distancia` y
`/resolver` responden bien en producción, incluido el caso real con tilde
sin codificar. Tropiezo real en el despliegue: el puerto indicado al
generar el dominio público (`8010`, el de la Dockerfile) no coincidía con
el `$PORT` real que Railway asigna en runtime (`8080`, que el código sí lee
bien vía `os.getenv`) — 502 hasta corregirlo. Diagnosticado con
`railway logs` (CLI instalada y con sesión iniciada).

**✅ Cerrado del todo, 08-ago-2026** — SorsabsaForensic (commit `f40b08d`) e
`iot` (commit `49548dd`) ya llaman al servicio, probados contra producción
real. Detalle completo en `PENDIENTES-ECOSISTEMA.md` #13. Hallazgo real en
el camino, no solo deduplicación: la extracción vieja de `iot` tomaba el
centro del encuadre (`/@`) en vez de la coordenada del lugar (`!3d/!4d`) —
~22 metros de diferencia en la URL de prueba. `iot` reportaba la posición
equivocada; ya no.

### R2: quién ya migró y quién no

El §7 documenta la DECISIÓN (R2 reemplaza Supabase Storage). Esto es el
ESTADO REAL producto por producto, que la tabla de cubos del §4 no cuenta
porque solo lista los cubos de Supabase:

| Producto | Qué sube | Dónde vive HOY |
|---|---|---|
| CondoManager, `unidad_fotos` | fotos de unidad (residente) | ✅ **R2**, cubo `condomanager-inmuebles` — migrado 08-ago-2026 (pendiente #12), presign+PUT directo del navegador |
| CondoManager, certificados/firmas | `condomanager-certificados`, `condomanager-firmas` | Supabase Storage, sin migrar |
| DomusCRM, `webs/api/upload` | fotos de inmueble (público) | Supabase Storage (`property-media`) — sigue con el tope de 4MB del §4; el patrón R2 existe en `backend/src/lib/storage.ts` pero ese backend no sirve tráfico real todavía |
| JustiRed, scraper | PDFs de leyes | ✅ **R2** directo (`legaltech/scraper/r2.py`, boto3) — esto NO es nuevo de hoy, ya funcionaba antes de este documento. El cubo Supabase `justired-legal-documents` (§4, 0 objetos) parece un cascarón sin usar |
| SorsabsaForensic | expedientes periciales (1.5GB, 2296 archivos) | ✅ **R2 privado**, respaldados e íntegros (`PENDIENTES-ECOSISTEMA.md`, "Hecho") |

### API tokens de R2 activos — ✅ dados por Gina 08-ago-2026

Vistos directo en el dashboard de Cloudflare (no hay MCP de Cloudflare para
verificarlo por API desde acá — esto es lo que ella reportó, tal cual):

| Token | Aplicado a | Permiso | Emitido | Estado |
|---|---|---|---|---|
| `condomanager-vercel` | `condomanager-inmuebles` | Object Read & Write | 08-ago-2026 | Active |
| `R2 Account Token` | `justired-registros-oficiales` | Object Read & Write | 31-jul-2026 | Active |

✅ El segundo coincide exacto con el default de código:
`legaltech/scraper/r2.py:89` — `os.getenv("R2_BUCKET", "justired-registros-oficiales")`.
No es el mismo bucket que `justired-legal-documents` de la tabla de Supabase
Storage del §4 (ese es el cascarón vacío sin usar); son dos cubos distintos,
uno por plataforma.

Solo dos tokens activos, uno por consumidor real (CondoManager, JustiRed) —
ninguno de más pagando sin uso, al menos en R2. DomusCRM no tiene token
todavía porque no ha migrado (arriba).

**Conclusión:** R2 no es "un plan futuro sin empezar" — tres de cinco flujos
ya corren ahí. Lo que falta es DomusCRM (el de mayor volumen esperado, ~3000
usuarios subiendo fotos de lotes — objetivo del §7) y los dos cubos de
CondoManager que quedaron atrás.

### Token de GitHub Actions — acceso de lectura para este asistente

Dado por Gina el 08-ago-2026 para que las sesiones de Claude Code puedan
consultar corridas de CI/CD (`gh run list`, `gh run view`) sin pedírselo a
ella cada vez — así se verificó en vivo, por ejemplo, que `qa_sorsabsa`
corre cada ~2h como está diseñado (arriba, tabla de servicios compartidos).

| Dato | Valor |
|---|---|
| Nombre | `token-IA-acciones` |
| Tipo | Personal Access Token de grano fino (`gh auth login --with-token`) |
| Alcance | **Actions: Read-only**, habilitado para **todos los repositorios** de la cuenta `ginaproanio` |
| Emitido | 08-ago-2026 |
| Expira | 07-sep-2026 |

**El valor del token NO se guarda en ningún archivo de ningún repo** —vive
solo en la sesión donde `gh auth login` lo consumió (config local de `gh`
CLI, fuera de git). Este documento registra que existe y su alcance, no el
secreto. Al expirar (07-sep-2026) hay que pedirle uno nuevo a Gina si
todavía hace falta consultar Actions desde una sesión.

---

## 5. Roturas verificadas el 2026-07-26

| Dónde | Qué | Estado |
|---|---|---|
| agente24siete | 5 fallos de compilación del commit `0a37c9f`; producción sirvió un build viejo 5 días | ✅ arreglado |
| agente24siete | `Textarea` importado de `@sorsabsa/ui` — no existe; `/admin/negocios` reventaba en runtime | ✅ arreglado |
| agente24siete | Landing con 98px de desborde horizontal en móvil | ✅ arreglado |
| agente24siete | Conmutador de tema que guardaba preferencia y no cambiaba nada | ✅ eliminado |
| DomusCRM | Landing: 3 defectos de maquetación y 6 fallos de contraste AA | ✅ arreglado |
| `@sorsabsa/ui` | `brandToCssVars` colapsaba los 3 tokens de sombra a uno | ✅ arreglado v0.1.36 |
| `@sorsabsa/ui` | Suite de tests inejecutable: 0 pruebas corrían | ✅ arreglado, 17 pasan |

### Pendientes conocidos

- `agente24siete/next.config.mjs`: `typescript.ignoreBuildErrors: true`. Es la
  razón de que un fallo de tipos no detenga el build.
- Dos portales en agente24siete: `/api/portal` (HTML a mano, 598 líneas, **con
  login real y 8 pantallas**) y `/portal` (React, con el design system, **sin
  login**: pide pegar un token). La landing enlaza al primero.
- Ningún repo usa despliegues de **preview**. Todo va directo a `main`. Ver
  `agente24siete/docs/FLUJO-DE-TRABAJO.md`.
- Versiones de `@sorsabsa/ui` dispersas: agente24siete `^0.1.6`, condomanager
  `^0.1.10`, justired `^0.1.23`, domuscrm `v0.1.35`. La última es `v0.1.36`.

---

## 6. Lo que NO está verificado

Para que nadie —incluida una sesión futura de Claude— dé por auditado lo que
no lo está:

- CondoManager: solo se miró su landing. No se probó su ingreso ni su panel.
- DomusCRM: se rediseñó la landing y se comprobó que compila. **No se probó el
  panel, el registro, el multi-tenant, las alianzas MLS ni la publicación en
  redes.**
- JustiRed: solo se comprobó que el SPA no contiene OCR.
- pagos-sorsabsa y auth-sorsabsa: solo historial de despliegues. **Nunca se
  comprobó que cobren ni que autentiquen de verdad.** Un despliegue verde solo
  dice que compiló.
- notificaciones-sorsabsa: sin revisar.
- geo-sorsabsa: ✅ revisado 2026-08-08, ver §4-bis.
- SORSABSA Forensic: solo se revisó su módulo de georreferenciación (§4-bis).
  El resto (`core/orchestrator.py`, procesadores de imagen/video/redes) sigue
  sin revisar.

---

## 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26

Funciona y no hay que tocarlo. Se documenta porque no estaba en ninguna parte.

```
Hostinger   →  DNS de sorsabsa.com
                 CNAME  auth          → cname.vercel-dns.com  (el SSO en Vercel)
                 TXT    resend._domainkey.auth                (DKIM, verificado)
                 MX/TXT send.auth      → feedback-smtp.sa-east-1.amazonses.com
                                                               (SPF, verificado)
Cloudflare  →  DNS de agente24siete.app, domuscrm.app, condomanager.vip
                 + buzones de ENTRADA por negocio (contactenos@, notificaciones@)
Resend      →  SALIDA de correo transaccional desde auth.sorsabsa.com
                 región sa-east-1 (São Paulo). Receiving deshabilitado.
```

**Entrada por Cloudflare, salida por Resend.** División correcta, no se pisan.

### Quién manda qué correo

- **Resend NO lo usa `notificaciones-sorsabsa`.** Ese servicio es la campana
  dentro de la app (`crear`, `listar`, `marcar-leida`); sus únicas variables
  son `NOTIFICACIONES_API_KEY` y `DATABASE_URL`. No manda correo.
- Resend está enganchado como **SMTP de Supabase Auth**. Por eso el remitente
  es `auth.sorsabsa.com` y lo que sale son *"Restablece tu contraseña"* y
  *"Confirma tu cuenta"*. Verificado: entrega real el 2026-07-23.

Son dos planos distintos y ambos están vivos: campana en la app, correo fuera.

### Limitaciones y minas

- **Un solo dominio verificado en Resend, y está bien así.** Todo sale desde
  `auth.sorsabsa.com`, pero el SSO **marca el mensaje segun el producto**: un
  reseteo en CondoManager llega como CondoManager, uno en DomusCRM como
  DomusCRM (`auth-sorsabsa/lib/apps.ts` + `BRANDS`). Un dominio verificado con
  N plantillas marcadas es mejor que N dominios con N juegos de DNS que
  mantener. **No hay que verificar los dominios de producto.**
- ⚠️ `auth.sorsabsa.com` es un CNAME. Resend puso SPF y MX en `send.auth`, un
  nombre aparte, precisamente por eso. **Poner un MX directamente sobre
  `auth.sorsabsa.com` rompería el SSO**: un CNAME no admite otros registros en
  el mismo nombre.
- ✅ `agente24siete/pages/api/lead-web.js` avisa de los leads **por WhatsApp**
  (`ADMIN_WHATSAPP_NUMBER`), canal baneado, y el fallo se traga con `.catch()`.
  Un lead entra en `leads_web` y nadie se entera. Debe salir por correo.

### Hostinger

El plan compartido está pagado por un año y **sí cumple una función**: es la
autoridad DNS de `sorsabsa.com`, o sea de la capa de identidad de la que
dependen los cinco productos. No es un gasto muerto. Lo que no puede hacer es
correr binarios ni servir Next.js con soltura — para eso está Railway (§7).


## 7. Decisión de arquitectura (2026-07-26)

Cuatro piezas. El objetivo es dejar de pagar planes que además imponen los
límites que hoy rompen el ecosistema.

```
Vercel          →  los 5 frontends
Railway         →  Postgres gestionado
                   + Convertidor (Tesseract, EasyOCR)
                   + scraper de JustiRed (Playwright)
                   + procesamiento pericial e IoT
Cloudflare R2   →  cubo PÚBLICO: fotos de inmuebles
                   cubo PRIVADO: peritajes, cédulas, contratos, firmas
Supabase        →  SOLO identidad (el SSO que ya funciona)
```

### Verificado 2026-07-28: qué base va a Railway y qué se queda en Supabase

El "Supabase = SOLO identidad" de arriba tiene un recorte que la evidencia
obliga. Se clasificó cada componente por su acoplamiento a `auth.users` / RLS
(leído del código, no de memoria):

| Componente | Usos de RLS / `auth.uid()` / `auth.users` | Acceso a la base | Hogar |
|---|---|---|---|
| auth (identidad) | ES Supabase Auth | — | **Supabase** |
| CondoManager | **89** (12 archivos con `supabase-js`) | supabase-js + RLS | **Supabase** |
| pagos | 0 | Postgres crudo (`DATABASE_URL`) | **Railway** |
| notificaciones | 0 | Postgres crudo (`DATABASE_URL`) | **Railway** |
| JustiRed | 0 | — | **Railway** |
| agente24siete | 1 (trivial) | Postgres crudo (psql pooler) | **Railway** |
| DomusCRM | 3 (uno es doc, uno SQL) | leve | **Railway** |

**Principio que gobierna:** lo que tiene llaves foráneas a `auth.users` o usa
RLS con `auth.uid()` está casado con Supabase Auth y no puede salir sin
reescribir su autorización. Lo que no las tiene, es libre y se muda a Railway
cambiando su `DATABASE_URL`.

**CORRECCIÓN 2026-07-28 (verificada en SQL):** una primera versión de esta
sección dijo que auth estaba "soldado a CondoManager por RLS" y que debían
quedar juntos. **Es falso.** El SQL de CondoManager tiene:

```
FK duras (REFERENCES auth.users):  0
Referencias a la tabla auth.users:  0
auth.uid()  [lee del JWT, no de la tabla]: 20
```

CondoManager NO tiene ninguna llave foránea a `auth.users`. Su RLS usa
`auth.uid()`, que lee del **token JWT**, no de la tabla. Por lo tanto **auth NO
tiene que vivir dentro de CondoManager y debe salir a su propio proyecto.**

**Regla corregida — identidad es su propio proyecto aislado.** auth (el SSO de
todo el ecosistema) va a un **proyecto de identidad propio**: no depende de
ningún producto, y todos dependen de él. Que CondoManager —el producto— pegue o
no, deja de tocar el login de nadie.

Hoy todo está mal metido en `twkuidnjwhopbjnrhnxp`: auth + CondoManager + pagos
+ notificaciones + `domus` (DomusCRM). Deben separarse: **auth a su proyecto de
identidad; pagos/notificaciones/domus fuera; CondoManager a su propio proyecto.**

**Requisito para separar auth — ⛔ CORREGIDO el 2026-07-30.** La versión
anterior de este documento decía que el requisito único era *"compartir el
secreto del JWT, es config y no reescritura"*. **Eso era falso** por la vía que
se intentó (llave asimétrica compartida). Sigue siendo cierto que no hay FK que
romper ni migración de esquema forzada; lo que no es cierto es que baste alinear
la firma.

En una frase: **Supabase asigna el `kid` él mismo y valida estricto por `kid`**,
así que dos proyectos no pueden compartir una llave asimétrica (probado: 401
`No suitable key`), y Third-Party Auth solo admite Clerk/Firebase/Auth0/Cognito/
WorkOS — no Supabase→Supabase. Quedan dos caminos: **HS256 compartido**
(deprecado) o **verificación server-side** por producto (refactor).

📍 **El detalle vivo, la evidencia con códigos y timestamps, el estado medido y
el método del próximo intento están en
[`PENDIENTES-ECOSISTEMA.md`](PENDIENTES-ECOSISTEMA.md) § 1.** Ese es el documento
que manda sobre este tema; aquí solo se corrige la frase que era falsa, para que
nadie vuelva a planificar sobre ella. **No duplicar el detalle en este archivo:**
dos copias divergen y esto ya costó una vez.

**Por qué importa con carga real (no es teoría):** entran ~600 lotes en 5
condominios (Asociación Punta Blanca) a CondoManager, publicados en la aliada
EcoInmobiliaria (DomusCRM). Con el cableado actual, pausar `condomanager` —que
el plan gratuito OBLIGA a hacer— tumba a la vez el **cobro** (pagos), el
**login** (auth) y los **avisos** (notificaciones) de los cuatro productos. Con
clientes dentro, sería no poder operar. Sacar pagos+notificaciones de ese
proyecto elimina la caída en cadena.

### Objetivo de capacidad: ~3000 usuarios (no "por el momento")

El requisito real no es que funcione hoy, sino que **resista ~3000 personas
vendiendo sus lotes** en EcoInmobiliaria (DomusCRM), con Punta Blanca (~6000 de
comunidad) gestionada en CondoManager. Esto NO es negociable a nivel de tier:

1. **Base de datos de PAGO, obligatorio.** El plan gratuito (500MB, CPU
   compartida, auto-pausa) no sostiene 3000 usuarios. No hay camino gratis a
   esa escala — es la primera realidad de costo a asumir.
2. **Pooler de conexiones obligatorio** (Supavisor en Supabase / PgBouncer en
   Railway). 3000 usuarios sin pooler agotan las conexiones directas.
3. **Fotos de lotes → R2 en subida DIRECTA del navegador** (enlace firmado),
   nunca por una función de Vercel (tope 4.5MB rechaza fotos de celular). Con
   3000 vendedores subiendo imágenes, este es el golpe de carga principal.
4. **Frontends en Vercel**: escalan solos, sin cambio.
5. **Validación por prueba de carga ANTES del lanzamiento.** Simular la
   concurrencia esperada; si revienta, se ajusta antes de meter gente, no
   después. Es la única forma de afirmar "resiste" sin adivinar.

**Secuencia, menor riesgo primero:**
1. ~~`pagos` + `notificaciones` → Railway~~ ✅ **HECHO** (verificado 2026-07-30):
   ambos corren en el proyecto Railway `SORSABSA-DATA` contra su Postgres
   (`tokaido.proxy.rlwy.net:31720`, base `railway`, `search_path` por servicio),
   responden 200, y sus proyectos en Vercel **ya no existen**. Los esquemas
   vacíos que quedaban en Supabase se borraron (§3). Acoplamiento mortal, muerto.
2. JustiRed, agente24siete, DomusCRM → Railway cuando toque. **JustiRed va en
   dirección contraria**: hoy es un schema dentro del proyecto de CondoManager.
3. **auth → `sorsabsa-identity`, su propio proyecto.** El proyecto ya existe
   (creado 2026-07-29) pero está **vacío**: los 4 usuarios siguen en el proyecto
   de CondoManager. Requisito único: compartir el secreto del JWT (arriba).
4. CondoManager → se queda en Supabase. Ese proyecto debe estar **siempre
   activo**.

> **Sobre el plan Pro.** El paso 3 ya no está bloqueado por plataforma: la
> organización está en Pro ✅ (comprobado 2026-07-30) y el límite de 2 proyectos
> activos desapareció. Un proyecto adicional cuesta **$10/mes** de cómputo ✅
> (API de Supabase, 2026-07-30). La versión anterior de este documento decía
> "pasa a Pro cuando la carga lo justifique, no antes": **Pro ya está pagado**,
> así que lo que queda no es una decisión de gasto sino trabajo pendiente. Pagar
> el plan no mueve ningún schema — mientras no se ejecute el paso 3, se paga la
> capacidad de separar sin separar.

### Railway y no un VPS pelado

La primera versión de esta decisión decía "VPS de ~€5/mes" y descartaba
Railway por redundante. **Se revisó el mismo día**: optimizaba coste cuando la
restricción real es otra.

Con un VPS pelado, la administración es propia: parches del sistema,
cortafuegos, TLS y su renovación, Docker, respaldos, vigilar el disco. Con cero
clientes, vendiendo el equipo de trabajo y sin margen, esa carga no es
asumible — y un servidor desatendido con expedientes periciales dentro es un
riesgo, no un ahorro.

Railway cuesta del orden del doble (~$10-20/mes frente a ~€7) y a cambio da
contenedores **sin dar un servidor**: mismas imágenes Docker, mismos binarios,
pero actualizaciones, seguridad y TLS son suyos, y se despliega con `git push`.

Su **Postgres gestionado reemplaza las bases de Supabase**, con lo que
desaparece el límite de 2 proyectos activos, se acaba el prender/apagar para
trabajar, y `pagos` deja de vivir dentro de CondoManager (§3).

### Se elimina

- **Supabase como base de datos de producto**: queda solo para identidad.
- **Supabase Storage**: lo reemplaza R2.
- **Amazon S3**: descartado. Cobra egress, y el modelo de negocio es gente
  mirando fotos repetidamente en sitios públicos. R2 no cobra egress.

R2 sigue haciendo falta aunque haya Railway: los expedientes y las fotos no van
en el disco de la aplicación.

### Por qué R2 y dos cubos

Los objetos no son homogéneos y no pueden compartir cubo:

- **Público**: fotos de listados. URL directa, cacheada, egress gratis.
- **Privado**: expedientes periciales, documentos de identidad, contratos,
  firmas. **Nunca URL pública** — enlaces firmados con caducidad. Un documento
  de identidad con URL adivinable es una fuga de datos personales.

Subir del navegador directo a R2 con enlace firmado elimina además el tope de
4.5MB del cuerpo de las funciones de Vercel (§4).

### Orden de migración, por urgencia

1. ~~**Convertidor a Railway.**~~ ✅ **HECHO** (verificado 2026-07-30, §2):
   `https://convertidor-production-7ca8.up.railway.app`, con Tesseract dentro.
   Salvado el motor pericial. La biblioteca de JustiRed sigue sin llenarse, pero
   ya no por esto → `legaltech/docs/biblioteca-legal.md`.
2. ~~**`pagos` fuera de CondoManager** a su propia base (§3).~~ ✅ **HECHO**
   (verificado 2026-07-30): `pagos` y `notificaciones` en el Postgres de
   Railway; los esquemas vacíos de Supabase, borrados.
3. **`auth` a `sorsabsa-identity`** — el proyecto está creado y vacío (§3).
   Es el acoplamiento que queda, y el único que tumba el login de todos.
4. **Objetos a R2.**
5. **El resto de bases**, un producto por vez.

### Riesgos aceptados

- Los respaldos de datos siguen siendo propios (Railway cubre el sistema, no el
  contenido). Mitigación: `pg_dump` diario por cron hacia R2.
- Punto único de fallo. Aceptable sin clientes; se revisa cuando los haya.
- **Pericial**: si la cadena de custodia exige control físico de los originales
  o jurisdicción concreta, es una decisión legal, no técnica. Sin resolver.
- Los precios citados son de memoria y **están sin confirmar**.

---

## 8. Por qué Vercel para la web y Railway para el resto

Pregunta legítima y recurrente: *¿por qué no consolidar todo en Railway?* Se
puede — Railway corre Next.js sin problema. La razón de no hacerlo es coste y
encaje, no dogma:

| | Vercel | Los 5 frontends en Railway |
|---|---|---|
| Coste | **$0** hoy | 5 contenedores encendidos, ~1GB RAM: +$10-20/mes |
| Next.js | plataforma de referencia | funciona, pero sin CDN, sin optimización de imágenes, ISR a mano |
| `*.domuscrm.app` | SSL comodín automático | configuración manual |
| Sitios públicos de inmuebles | servidos desde el borde | desde una sola región |

Los frontends son ligeros y de lectura: Vercel los sirve gratis y escala a
cero. Railway cobraría por tenerlos encendidos para hacer lo mismo peor.

**El argumento a favor de consolidar existe** —una factura, un panel, un modelo
mental— y es legítimo si la dispersión pesa más que el coste. Pero conviene
separar dos cosas: el daño real de este ecosistema no vino de usar dos
plataformas, sino de **cuatro esquemas conviviendo en una base sin que nadie lo
supiera** (§3). Eso lo arregla el Postgres de Railway, no mudar los frontends.

---

## 9. Pendientes, en orden

### Cerrados el 2026-07-30

- ✅ **Convertidor a un contenedor** — en Railway con OCR funcionando (§2). Lo
  que queda de la biblioteca legal de JustiRed son defectos de su scraper, no de
  infraestructura: `legaltech/docs/biblioteca-legal.md`.
- ✅ **`pagos` y `notificaciones` fuera del proyecto de CondoManager** (§3):
  contenedor y base en Railway, esquemas borrados de Supabase, proyectos de
  Vercel eliminados. Era el acoplamiento que dejó a los cuatro productos sin
  cobro ni avisos el 2026-07-26.
- ✅ **Proyecto Supabase `domuscrm` (`owilvzdcdipmrzeaeznw`) borrado** — cascarón
  de la migración del 9-jul, solo generaba confusión sobre cuál era la base viva
  de DomusCRM (§3).

### Abiertos, en orden

1. **Sacar `auth` a `sorsabsa-identity`** (§3, §7). El proyecto está creado
   desde el 2026-07-29 y **vacío**; los 4 usuarios siguen dentro del proyecto
   de CondoManager, así que romper CondoManager sigue tumbando el login de
   todos. Ya no hay límite de plataforma que lo impida: la organización está
   en Pro, y no hay FK que migrar. ⛔ **Pero ya NO es "el más barato de
   arreglar": la vía de la llave compartida está bloqueada** (§7, corrección
   del 2026-07-30). Antes de mover un usuario hay que elegir entre el puente
   HS256 y la verificación server-side, y esa segunda opción es un refactor de
   CondoManager. **Bloqueado a la espera del soporte de Supabase.**
2. **Reponer el aislamiento por rol en el Postgres de Railway.** `pagos` y
   `notificaciones` entran hoy como `postgres` (superusuario) y solo los separa
   el `search_path`, que **no es una frontera de seguridad** — basta calificar
   el nombre (`pagos.pagos`) para cruzarla. En Supabase tenían roles
   `*_runtime` con permisos solo sobre su schema; eso se perdió en la
   migración. ✅ verificado el 2026-07-30: `current_user = postgres` en ambos.
3. **Decidir la casa de `justired`.** Se consolidó como schema dentro del
   proyecto de CondoManager (`legaltech/.env:1`): un producto viviendo dentro de
   otro, el mismo patrón que causó el problema de §3.
4. **Objetos a R2**, dos cubos (§7). Arregla de paso el tope de 4MB en las
   fotos de inmuebles y los **cuatro cubos públicos** que hoy incluyen firmas y
   documentos legales (§4).
5. **Aviso de leads por correo.** `agente24siete/pages/api/lead-web.js` avisa
   por WhatsApp, canal baneado, y el error se traga con `.catch()`: el lead se
   guarda y nadie se entera. Resend ya está montado y el whitelabel por
   producto funciona (§6-bis) — es reusar lo que hay.
6. **Subir agente24siete de `^0.1.6` a la última.** Son más de 30 versiones de
   deriva: merece rama y preview antes de main
   (`agente24siete/docs/FLUJO-DE-TRABAJO.md`).
7. **Quitar `typescript.ignoreBuildErrors: true`** de agente24siete cuando
   compile limpio. Es lo que dejó pasar un build roto cinco días.
8. **Unificar los dos portales de agente24siete** (§5). Sin prisa: el que
   funciona con login real es el HTML, y el React sigue sin autenticación.

### Reglas que ya no dependen de la memoria

- `docs/COLOR-Y-CONTRASTE.md` — la identidad no se paga con accesibilidad.
- `README.md` §Publicar — las etiquetas deben ser anotadas o no se suben.
- `.githooks/pre-push` — bloquea publicar `src/` sin subir versión.
- `agente24siete/docs/FLUJO-DE-TRABAJO.md` — previews antes de main.
