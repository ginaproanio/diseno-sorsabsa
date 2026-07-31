# Arquitectura del ecosistema SORSABSA

Levantado el 2026-07-26 recorriendo repos, bases de datos y despliegues.

**Cada afirmación lleva su origen.** ✅ = comprobado en vivo (consulta SQL,
petición HTTP, lectura del código). ⚠️ = inferido de despliegues o commits, sin
abrir el código. ❓ = no verificado, solo se sabe que existe.

Este documento existe porque nada de esto estaba escrito, y cada sesión de
trabajo lo redescubría desde cero — a veces rompiendo algo en el intento.

---

## 1. Inventario

### Productos (lo que un cliente compra)

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

### Servicios compartidos (no se venden solos)

| Servicio | Repo | Estado |
|---|---|---|
| Pagos | `pagos-sorsabsa` | ⚠️ 20/20 despliegues verdes; su base depende de CondoManager (§3) |
| SSO | `auth-sorsabsa` | ⚠️ 16/16 verdes; 5 apps registradas |
| Notificaciones | `notificaciones-sorsabsa` | ❓ |
| Geo | `geo-sorsabsa` | ❓ |
| Design system | `diseno-sorsabsa` (`@sorsabsa/ui`) | ✅ v0.1.36 |

---

## 2. Los dos planos

El ecosistema necesita **dos** tipos de plataforma. Hoy solo existe uno, y ese
es el origen de que lo pericial nunca haya salido a producción.

### Plano web — Vercel ✅ correcto

Agente24Siete · DomusCRM · CondoManager · SPA de JustiRed · auth · pagos ·
notificaciones.

Todo es petición → respuesta, sin binarios. Vercel es la herramienta adecuada.

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

### Estado ✅ verificado en SQL el 2026-07-30

| Proyecto | Ref | Estado | Qué contiene |
|---|---|---|---|
| `condomanager` | `twkuidnjwhopbjnrhnxp` | ACTIVO | **TRES esquemas de producto: `public` (40 tablas, CondoManager) · `domus` (27, DomusCRM) · `justired` (6, JustiRed)** + `auth` (23 tablas, **4 usuarios**) + `storage` |
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
- notificaciones-sorsabsa, geo-sorsabsa, SORSABSA Forensic: sin revisar.

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

Lo que se intentó: importar la MISMA llave privada EC P-256 como *standby* en
los dos proyectos, para que CondoManager siguiera validando los tokens que emite
`sorsabsa-identity`. Comprobado en vivo el 2026-07-29/30:

- ✅ Un token firmado por identity, presentado a la API de CondoManager, devuelve
  **401 `No suitable key`**. La validación es **por `kid`**: cada proyecto solo
  conoce los `kid` de sus propias llaves.
- ✅ Al importar esa misma llave privada en CondoManager, Supabase **le asigna un
  `kid` propio** (no el de identity). `POST /config/auth/signing-keys` → 201.
- ✅ Al reimportarla forzando el `kid` de identity dentro del JWK, la API
  responde **409 `Failed to create new signing key in standby status for
  project`** — también después de mover la anterior a *previously used* y
  después de revocarla. (Confirmado por los logs de la Management API que
  entregó el soporte de Supabase, ticket abierto el 2026-07-30.)
- ✅ Una llave revocada **no se puede borrar durante 30 días**: `DELETE` → 422
  *"Try again after 2026-08-28T23:57:02.736Z"*. Queda listada como historial.
  Es inofensiva —nunca firmó un token— pero no se va.
- ✅ Nada de esto tocó el login en vivo: todo ocurrió sobre llaves *standby*,
  que no firman hasta que se rotan. CondoManager sigue firmando con su llave
  de siempre.

❓ **Lo que NO está probado, y no debe afirmarse:** que el 409 lo cause el `kid`.
No se probó importar una llave con material NUEVO forzando `kid`, ni reimportar
el mismo material sin `kid`. El 409 puede ser por el `kid`, por material
duplicado o por una restricción temporal tras revocar. Está preguntado al
soporte de Supabase; hasta que respondan, es hipótesis.

**Las dos salidas reales** (elegir antes de tocar nada):

1. **Secreto HS256 compartido** (el legacy, que no usa `kid`). Esquiva el
   problema y no exige refactorizar CondoManager, pero es el mecanismo que
   Supabase está deprecando → puente temporal. ❓ Sin verificar si Supabase
   permite hoy **fijar** el secreto legacy a un valor dado en dos proyectos.
2. **Verificación server-side** (el patrón que ya usa agente24siete): el
   producto valida el token contra el JWKS de identity en su propia capa de
   servidor, y deja de depender de que PostgREST lo haga por él. Es la
   arquitectura correcta y sin deuda, pero **exige refactorizar la capa de
   datos de CondoManager** — es un proyecto aparte, no un cambio de config.

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
