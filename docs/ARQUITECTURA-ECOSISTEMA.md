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
| `condomanager` | `twkuidnjwhopbjnrhnxp` | ✅ **CUATRO esquemas: `public` (CondoManager), `domus` (DomusCRM), `pagos`, `notificaciones`** |
| `domuscrm` | `owilvzdcdipmrzeaeznw` | ❓ |
| `justired` | `jywrjkfamdtcoehlsiup` | ❓ |
| `sorsabsa_ecosystem` | `tkkpqbelzwoenmeynjvw` | ❓ |

### ⚠️ Acoplamiento crítico

`pagos-sorsabsa/README.md:9` y `notificaciones-sorsabsa/README.md:11` apuntan
ambos al "proyecto consolidado" `twkuidnjwhopbjnrhnxp`. Ese ref **es
CondoManager**, y dentro conviven cuatro esquemas de cuatro dueños distintos.

**Pausar CondoManager apaga, de golpe: CondoManager, los datos de DomusCRM, el
cobro de los cuatro productos y las notificaciones de todos.** Ocurrió el
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

1. **Convertidor al VPS.** Único con fecha: hoy solo existe en la máquina de
   Gina, que está vendida. Salva el motor pericial y la biblioteca de JustiRed.
2. **`pagos` fuera de CondoManager** a su propia base (§3).
3. **Objetos a R2.**
4. **El resto de bases**, un producto por vez.

### Riesgos aceptados

- La administración del VPS (actualizaciones, respaldos) pasa a ser propia.
  Mitigación: `pg_dump` diario por cron hacia R2.
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

1. **Convertidor a un contenedor.** Único con fecha: hoy solo existe en la
   máquina vendida (§2). Desbloquea además la biblioteca legal de JustiRed.
2. **Sacar `pagos` y `notificaciones` del proyecto de CondoManager** (§3). Es
   el acoplamiento que dejó sin cobro a los cuatro productos el 2026-07-26.
3. **Objetos a R2**, dos cubos (§7). Arregla de paso el tope de 4MB en las
   fotos de inmuebles (§4).
4. **Aviso de leads por correo.** `agente24siete/pages/api/lead-web.js` avisa
   por WhatsApp, canal baneado, y el error se traga con `.catch()`: el lead se
   guarda y nadie se entera. Resend ya está montado y el whitelabel por
   producto funciona (§6-bis) — es reusar lo que hay.
5. **Subir agente24siete de `^0.1.6` a la última.** Son más de 30 versiones de
   deriva: merece rama y preview antes de main
   (`agente24siete/docs/FLUJO-DE-TRABAJO.md`).
6. **Quitar `typescript.ignoreBuildErrors: true`** de agente24siete cuando
   compile limpio. Es lo que dejó pasar un build roto cinco días.
7. **Unificar los dos portales de agente24siete** (§5). Sin prisa: el que
   funciona con login real es el HTML, y el React sigue sin autenticación.

### Reglas que ya no dependen de la memoria

- `docs/COLOR-Y-CONTRASTE.md` — la identidad no se paga con accesibilidad.
- `README.md` §Publicar — las etiquetas deben ser anotadas o no se suben.
- `.githooks/pre-push` — bloquea publicar `src/` sin subir versión.
- `agente24siete/docs/FLUJO-DE-TRABAJO.md` — previews antes de main.
