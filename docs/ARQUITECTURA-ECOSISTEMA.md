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
| Convertidor | `convertidor` | Vercel (frontend) | ✅ backend NO desplegado, ver §4 |

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

Supabase, organización `wzhfxbqvalgipuixcugg`.

| Proyecto | Ref | Qué contiene |
|---|---|---|
| `agente24siete` | `nwcqaginlnzjlkgwifas` | ✅ `auth`, `public` (15 tablas), `storage`. Nada más |
| `condomanager` | `twkuidnjwhopbjnrhnxp` | ✅ **además del suyo, el esquema `pagos` de pagos-sorsabsa** |
| `domuscrm` | `owilvzdcdipmrzeaeznw` | ❓ |
| `justired` | `jywrjkfamdtcoehlsiup` | ❓ |
| `sorsabsa_ecosystem` | `tkkpqbelzwoenmeynjvw` | ❓ |

### ⚠️ Acoplamiento crítico

`pagos-sorsabsa/README.md:9` — *"del proyecto Supabase consolidado
(`twkuidnjwhopbjnrhnxp`)"*. Ese ref **es CondoManager**.

**Pausar CondoManager apaga el cobro de los cuatro productos.** Ocurrió el
2026-07-26 y nadie lo notó: pagos-sorsabsa seguía marcando despliegues verdes
porque el código compila igual — lo que estaba caído era su base.

Un servicio compartido por cuatro productos **no puede vivir dentro de uno de
ellos**. La consolidación se hizo, con toda probabilidad, para caber en el
límite de 2 proyectos activos del plan gratuito. Es un ahorro que compra un
acoplamiento invisible.

**Arreglo estructural:** `pagos` en su propio proyecto. Cuesta una casilla más,
o sea plan de pago.

### Límite de 2 proyectos activos

El plan gratuito permite 2 activos. Comprobado en vivo: activar agente24siete
obligó a pausar CondoManager. Con 5 productos + 1 servicio compartido que
necesita casilla, **tres estarán siempre apagados**.

No es deuda técnica. Es que la arquitectura no cabe en el plan contratado.

---

## 4. Almacenamiento

Los tres productos con subida de archivos usan **Supabase Storage**, ninguno
escribe en disco ✅ — correcto, en Vercel el sistema de archivos es efímero.

- DomusCRM → bucket `property-media`
- CondoManager → firmas
- JustiRed → biblioteca legal

**Consecuencia del §3:** Storage vive DENTRO del proyecto. Pausar un producto
apaga también sus fotos y sus firmas, no solo su base.

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
