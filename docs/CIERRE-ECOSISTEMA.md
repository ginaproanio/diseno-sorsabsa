# Cierre del ecosistema SORSABSA — 29-sep-2026

> **Este documento manda sobre todos los demás de `docs/`.** Desde el
> 29-sep-2026 el desarrollo está archivado. Todo pendiente que seguía abierto
> en esta carpeta queda cerrado acá como **🗄️ archivado sin terminar** — no
> como hecho. Los documentos originales no se reescriben: cada uno lleva un
> aviso arriba que apunta a este.

## Por qué se cierra

- Gina dejó de pagar GitHub, Supabase, Meta, Railway y otros servicios.
- En sus palabras, el motivo **no es el pago**: los sistemas no llegaron a
  servir para lo que eran. El registro más claro ya estaba escrito en el #26 de
  `PENDIENTES-ECOSISTEMA.md` (22-ago): de seis productos, **uno solo** podía
  venderse y entregarse de punta a punta.
- La prueba que habría convertido la plomería en producto —CondoManager de
  punta a punta con un cliente real, Punta Blanca (#8)— **nunca se hizo**. Se
  invirtió mucho más en auditar y re-auditar la infraestructura que en recorrer
  el camino de un cliente hasta que recibiera lo que compró.

---

## 1 · Datos reales — lo único de este cierre que es urgente

Los documentos se pueden reconstruir; esto no.

| Qué | Dónde vive | Riesgo | Hecho el 29-sep | Falta |
|---|---|---|---|---|
| **Casos de IoT** — 4 casos, 1.102 archivos, 1,4 GB, incluida la *Causa Penal 17294-2026-00142 (Tumbaco)*, el caso activo de Patricio | Volumen `iot-volume` de Railway (servicio **aún en línea** el 29-sep) | Railway sin pago → el volumen se puede perder. **La copia local en `c:/iot/iot/cases/` NO alcanzaba**: al caso de Tumbaco le faltaban 42 de sus 61 archivos, y dos casos (`caso-26-01-vh-7089035` y el de María Susana) no tenían ninguna copia fuera de Railway | Volumen descargado entero — ver §1.1 | Sacar la copia de esta máquina |
| **Expedientes forenses** — 30 GB | `c:/sorsabsa/expedientes_forenses`, **solo esta máquina**, fuera de git | Si la máquina se entrega o falla, se pierden. El respaldo en R2 (`sorsabsa-expedientes`, 1,62 GB) está desactualizado desde agosto (#7) | Nada — no cabe en GitHub | **Copiar a un disco externo** |
| **Biblioteca procesada de JustiRed** (leyes, artículos, inventario) y las cuentas de Patricio y Susana | Supabase `verticales_sorsabsa` y `sorsabsa-identity`, **pausados** | Hay facturas impagas: `restore_project` devolvió `PaymentRequiredException` el 25-sep. Sin reactivar, no se puede exportar desde una sesión | — | Si se quiere conservar: Supabase → Billing. Verificar ahí si el backup de un proyecto pausado se puede descargar sin saldar |
| PDFs del Registro Oficial (JustiRed), Miraflores al 29-ago, expedientes viejos | Cloudflare R2 — 4 cubos, 24,7 GB (§1.2) | **Sigue cobrando** (~$0,22/mes). Guarda respaldos de expedientes reales: si se deja de pagar Cloudflare, también se pueden perder | Medido el 29-sep | Decidir si se mantiene (§1.2) |
| El **esquema** de las tres bases | Commiteado en cada repo como migración base (Paso 0 de `PLAN-DESOLDADO.md`, probado en un proyecto vacío real el 07-ago) | Ninguno | — | — |

### 1.1 · El respaldo de IoT del 29-sep

`C:\respaldo-iot-railway-2026-09-29\iot-volumen-completo-2026-09-29.tgz` —
`tar czf` de `/mnt/data/cases` y `/mnt/data/docs` del volumen de producción,
bajado por `railway ssh`. Antes se probó el canal con el caso más chico para
confirmar que no corrompía binarios.

**Verificado contra producción el mismo día:** 1.102 de 1.102 archivos, caso
por caso idéntico (61 Tumbaco · 34 María Susana · 982 Patricio · 24
`caso-26-01-vh-7089035` · 1 registro), `gzip -t` íntegro, 1,27 GB. SHA-256
`add416906bae0a509816d78f3c81086eaac0e225aaf3e646ee7a70565f994a29` — está en
el `.sha256` de al lado, con un `LEEME.txt` que explica cómo comprobar una
copia.

⚠️ **Está en la misma máquina que se va a entregar.** No es un respaldo hasta
que esté en otro lado.

### 1.2 · R2 y Resend — lo que siguen costando y guardando (medido el 29-sep)

**Cloudflare R2 — 24,7 GB en 4 cubos.** Los primeros 10 GB son gratis y el
resto cuesta $0,015 por GB-mes (precio oficial, verificado ese día): **~$0,22
por mes, ~$2,65 por año.** Es lo más barato de todo el ecosistema, y es donde
viven respaldos de expedientes reales.

| Cubo | Qué guarda | Objetos | Tamaño |
|---|---|---|---|
| `justired-registros-oficiales` | PDFs del Registro Oficial que bajó el scraper de JustiRed | 5.926 | 22,4 GB |
| `sorsabsa-expedientes` | respaldo parcial y viejo de los 30 GB de `expedientes_forenses` | 2.335 | 1,73 GB |
| `iot-expedientes` | caso Miraflores, foto del 29-ago | 212 | 600 MB |
| `condomanager-inmuebles` | nada — nunca se usó | 0 | 0 |

El scraper es lo único que hace crecer R2, y **hoy no sube nada**. Antes de
escanear corre `scraper/test_conexion.py`, que prueba Supabase, R2 y el
Convertidor. El 29-sep Supabase no respondía a una petición real, así que esa
prueba falla y el escaneo no arranca. Ver §10.

**Resend — plan gratuito, $0.** Cuatro correos enviados en septiembre, cero
contactos (no guarda datos de personas), cero webhooks. Queda configurado el
dominio verificado `auth.sorsabsa.com` —sus registros DNS viven en Hostinger—
y **una sola llave de API activa**, `sorsabsa`, repartida en las variables de
entorno de los servicios. Al ser la única, todo correo del ecosistema sale por
ella, incluido el reseteo de contraseña del portero.

**Decisiones de Gina, 29-sep-2026:**

1. **R2 se mantiene** (~$0,22 al mes).
2. **El respaldo de IoT no se sube a R2.** La única copia fuera de Railway
   queda en esta máquina (§1.1).
3. **El scraper de JustiRed sigue encendido**, *"por si algún día decido seguir
   por mi cuenta"*. Mientras Supabase esté pausado, falla cada día y GitHub
   avisa por correo. Ver §10.
4. **La llave de Resend no se revoca.**

---

## 2 · Trabajo pericial real — no es software, no se archiva con él

- **Causa Penal 17294-2026-00142 (Tumbaco)** — caso activo de Patricio en IoT.
  IoT sigue en línea en Railway, pero **hoy nadie puede entrar**: el login pasa
  por `sorsabsa-identity` y se verifica contra `verticales_sorsabsa`, y los dos
  están pausados por la factura. Esto sí es consecuencia directa de dejar de
  pagar Supabase. Los archivos están a salvo (§1.1); el acceso, no.
- **Pericia de Quitumbe** — **cerrada: el juez cambió de perito**, nunca se
  ejecutó (Gina, 29-sep-2026). `CONTEXTO-PERICIA-QUITUMBE.md` queda como
  registro.
- **Pericia arbitral 019-25** — su estado vive en su propio expediente, no en
  este repo.

---

## 3 · Lo que sí funcionó (verificado en su momento, no supuesto)

Se deja escrito porque quien retome esto necesita saber qué no hay que rehacer.

- **IoT** — el único producto con usuarios reales. El caso Miraflores (Arguello)
  se trabajó ahí y se entregó. Funcionó hasta la pausa de Supabase.
- **Convertidor** — la única venta de punta a punta verificada: pago real de $9
  el 22-ago, recibido y entregado (#24, #26).
- **Portero central (`auth-sorsabsa` + `sorsabsa-identity`)** — un solo login
  para los seis productos, OIDC, probado con peticiones reales
  (`PLAN-DESOLDADO.md` Pasos 1 y 2).
- **Scraper de JustiRed** — capturaba el Registro Oficial solo, cada día, a R2.
- **Design system (`@sorsabsa/ui`)** — seis productos con la misma base.
  Verificado el 29-sep con el check propio del ecosistema: **cero modales del
  navegador en los ocho repos con UI**.
- **QA cíclico** — 18 checks cada 2 horas; encontró fallas reales que la
  lectura de código no veía.

---

## 4 · Estado final de cada pendiente de `PENDIENTES-ECOSISTEMA.md`

| # | Tema | Estado final |
|---|---|---|
| 1–6 | Auth vía OIDC, JustiRed al SSO, cutover de pagos, notificaciones a Railway, RLS, proyecto huérfano | ✅ Hechos |
| 7 | SorsabsaForensic → web | 🗄️ Fases 0–3 y 4-bis hechas (15-ago). **Sin hacer:** Fase 4 (procesadores) y Fase 5 (cobro). La app de escritorio sigue siendo la que funciona |
| 8 | CondoManager end-to-end (Punta Blanca) | 🗄️ **Nunca se hizo.** Era la prueba que decidía si había producto. Además bloqueaba el Paso 3 del desoldado |
| 9–11 | Auditoría de reuso, login social, portal de agente24siete | ✅ Hechos |
| 12 | Fotos de unidades a R2 | 🗄️ Funciona por script (presign → PUT → GET). Nunca se probó con el clic de un residente |
| 13–14 | geo-sorsabsa, IoT al portero central | ✅ Hechos |
| 15 | WhatsApp de agente24siete | 🗄️ **Todas** las cuentas del portafolio siguen baneadas por Meta. Sin canal, agente24siete no puede entregar lo que vende |
| 16 | Pagos/suscripciones/referidos en todos los productos | 🗄️ CondoManager hecho. DomusCRM sin página de pago. JustiRed: el `sujeto` estable del pago se corrigió en código el 25-sep (`legaltech@c170913`, subido el 29-sep) — **nunca probado en vivo**: Supabase ya estaba pausado. El modelo de negocio de JustiRed (persona natural/jurídica, créditos de IA) nunca se definió |
| 17 | Correo masivo por tenant | 🗄️ Diseñado con Gina, nunca construido |
| 18 | Patrón visual de los onboarding | ✅ Hecho |
| 19 | Guard README/TODO de qa_sorsabsa | 🗄️ No construido — la decisión de alcance nunca se tomó |
| 20 | Magnific | 🗄️ Script listo; la API key nunca se consiguió |
| 21 | Convertidor como producto | 🗄️ Web y motor desplegados. **Sin hacer:** catálogo de herramientas, notificaciones |
| 21-bis | Cobro del Convertidor | 🗄️ Gate freemium y `sujeto` estable hechos y desplegados. La decisión 2 (pago único por archivo grande) nunca se tomó |
| 22 | ¿Forensic duplica al Convertidor? | 🗄️ Pregunta anotada, nunca analizada |
| 23 | Consola del negocio / CRM de ventas | 🗄️ Aplazado a propósito, nunca empezado |
| 24 | Lo que faltaba después del cobro | 🗄️ Todo abierto: `pagos.comercios` vacía → Capa 2 imposible (24.1); DomusCRM y Forensic sin código de cobro (24.2); referidos sin conversión (24.3); deuda del motor (24.4–24.7); filas de prueba que inflan métricas (24.8–24.9); portero (24.10–24.11); Convertidor (24.12–24.14); check de JustiRed en rojo sin diagnosticar (24.15) |
| 25 | Campana unificada | ✅ En cuatro productos. agente24siete y el Convertidor quedaron sin campana |
| 26 | ¿Puede un usuario comprar y recibir lo que compró? | 🗄️ Respuesta final: **solo en el Convertidor** |
| 27 | Alta de agente24siete | ✅ Hecha. Sin canal de entrega (#15) y sin guard para el `await` perdido |
| 28 | Pruebas en vivo de Gina (22-ago) | 🗄️ **Nunca se hicieron**: CondoManager→EcoInmobiliaria, alta de agente24siete, aviso de vencimiento, campanas |
| 29 | Barrido de UI | 🗄️ **29.1 (modales): cerrado de verdad** — el check `modales:local` dio cero en todo el ecosistema el 29-sep; el "18 vivos" del tracker quedó viejo después de los commits del 23-ago. 29.2 (desvíos): **no verificable al cierre** — el check de conformidad necesita la API de GitHub y el token está vencido; falla cerrado en vez de inventar. 29.3–29.7: abiertos |
| 30 | Comprobaciones vs. grafo | 🗄️ Conclusión de Gina: el grafo no se gana el puesto. El workflow reutilizable por producto y las pruebas de `costura`/`conformidad` nunca se hicieron |
| 31 | "Quién soy" escrito dos veces | 🗄️ Anotado, nunca unificado |
| 32 | ¿IoT escribe sola en R2? | 🗄️ Decisión nunca tomada. Se reemplaza, de hecho, por el respaldo manual del 29-sep (§1.1) |

## 5 · Planes

| Documento | Estado final |
|---|---|
| `PLAN-DESOLDADO.md` | 🗄️ Pasos 0, 1 y 2 hechos y probados. **Paso 3 nunca se ejecutó**: los tres productos siguen compartiendo una base |
| `PLAN-MULTI-CONDOMINIO.md` | 🗄️ Fases 0–3 hechas. Fases 4–8 no. Consecuencia que queda: 60 `.single()` sobre `perfiles` fallan el día que una persona tenga dos unidades — el censo real de Punta Blanca las tiene |
| `PLAN-CONFIGURACION-CONDOMINIO.md` | ✅ Hecho. Solo faltó la validación en vivo |
| `PLAN-IDENTIFICACION-UNIDADES.md` | ✅ Completo |
| `PLAN-SORSABSAFORENSIC-WEB.md` | 🗄️ Ver #7 |

## 6 · Auditorías — los 16 hallazgos que quedaron abiertos

Contados el 29-sep por encabezado con `⬜` y sin `✅`. CondoManager, DomusCRM,
geo-sorsabsa y qa_sorsabsa cerraron **todos** sus hallazgos.

- **`AUDITORIA-PORTERO-SSO.md` (9):** 🔴-13 — las ~7 cuentas de los tres
  proyectos desaparecieron entre el 23 y el 26-ago. **Causa, contada por Gina
  al cierre (29-sep):** le pidió a una sesión de Claude *«borra los datos
  basura»* y la sesión borró todo, incluidas las cuentas reales; después hubo
  que recrear a mano la de Patricio y las de Gina. Casi todas eran de prueba,
  porque el producto nunca tuvo usuarios reales. · 🟠-4, 🟠-6, 🟠-10; 🟡-2,
  🟡-3; 🔵-1, 🔵-2, 🔵-4.
- **`AUDITORIA-CONVERTIDOR.md` (3):** 🔴-1 (el párrafo no vuelve a fluir), 🔴-3
  (el motor descarta páginas en silencio), 🟡-2.
- **`AUDITORIA-AGENTE24SIETE.md` (3):** 🟠-5, 🟡-1, 🟡-3.
- **`AUDITORIA-JUSTIRED.md` (1):** la lista "Pendiente, en orden".

## 7 · Repositorios al 29-sep

- **Los 13 repos quedaron subidos a GitHub el 29-sep, cero commits
  pendientes** (comprobado con `git rev-list @{u}..HEAD` en cada uno). Incluye
  el fix de JustiRed del 25-sep, que no se había podido subir ese día.
  **GitHub Free sigue guardando repos privados sin costo.**
- Lo que sí está vencido es el token de la herramienta `gh` (*"The token in
  keyring is invalid"*); `git push` funciona con la credencial que guarda
  Windows. Solo importa para comandos `gh` — ver §8.
- **Tareas programadas apagadas** (ya aplicado, se subió): el QA cada 2 horas
  y los avisos diarios de vencimiento. Ambas iban a fallar sin parar contra
  servicios caídos — el QA abriendo issues y mandando correo cada vez.
  **El scraper de JustiRed sigue encendido**, por decisión de Gina: estaba en
  `PLAN-DESOLDADO.md` y la reconfirmó el 29-sep para poder retomar JustiRed por
  su cuenta (§1.2, §10).
- **Archivos que quedaron fuera de git, a propósito:**
  - `camara-sorsabsa/tv-server.js` y lo que lo acompaña — tiene una **contraseña
    de cámara escrita en el código**. Commitearlo la dejaría en el historial
    para siempre. Hay que moverla a un `.env` antes.
  - `diseno-sorsabsa/blender_*` (8 archivos, 700 KB) — no son del design
    system, y todo lo que se commitea acá lo descarga cada `npm install` de cada
    producto.

## 8 · GitHub, de acá en adelante

Todo está subido (§7). Si más adelante hay algo nuevo que subir, `git push`
desde cada repo alcanza. Para usar la herramienta `gh` (issues, workflows,
estado de Actions) hay que renovar su token una vez:

```bash
gh auth login -h github.com
```

## 9 · Si algún día se retoma

- **La pregunta pendiente no es técnica.** Es el #26: ¿puede alguien comprar y
  recibir lo que compró? Retomar es tomar **un** producto y recorrerlo de punta
  a punta con un cliente real antes de construir nada más.
- **Lo mínimo para devolverle el acceso a IoT:** saldar la factura de Supabase y
  reactivar `sorsabsa-identity` y `verticales_sorsabsa`. IoT no necesita el
  tercero (`agente24siete`).
- El orden de lectura para retomar: este documento, `ARQUITECTURA-ECOSISTEMA.md`,
  `PENDIENTES-ECOSISTEMA.md` #26 y #8, `ESTANDAR-DESARROLLO.md`.

## 10 · JustiRed — lo que necesita para seguir trabajando

Gina decidió dejarla encendida para poder retomarla por su cuenta (§1.2). Esto
es lo que hace falta para que vuelva a trabajar sola.

**Estado el 29-sep, con peticiones reales:**

| Pieza | Dónde | Estado |
|---|---|---|
| Sitio público `www.justired.com` | Vercel | ✅ responde |
| PDFs del Registro Oficial (`archivo.justired.com`) | R2 | ✅ responde — se sigue pagando (§1.2) |
| Base de datos: biblioteca, inventario, cuentas | Supabase `verticales_sorsabsa` | ❌ **no responde** — pausada, factura impaga |
| Motor del Convertidor (PDF → texto, OCR) | Railway | ✅ responde **por ahora** — Railway mantiene el plan hasta el fin del período pagado, y después no hay garantía |
| El scraper | GitHub Actions, todos los días a las 03:00 de Ecuador | ⚠️ encendido, pero falla en la prueba de conexión |

**Lo mínimo para que el scraper vuelva a capturar leyes solo:**

1. **Supabase:** saldar la factura impaga y reactivar `verticales_sorsabsa`. La
   organización ya está en el plan gratuito, así que después de saldar no
   debería cobrar mensualidad.
2. **Railway, solo el servicio del Convertidor:** el plan más barato es Hobby,
   $5 al mes con $5 de uso incluido (precio oficial, 29-sep). El gratuito da
   0,5 GB por servicio; casi seguro no alcanza para el OCR, que carga torch.
   No se probó.
3. **R2:** ya se mantiene.
4. **GitHub Actions:** gratis.

Con esas cuatro piezas, el scraper debería retomar solo en su próxima corrida
diaria: el cron sigue encendido y no hay que tocar código. Para que abogados,
clientes y el curador puedan **entrar** hace falta además
`sorsabsa-identity`, el segundo proyecto de Supabase.

**Dónde está todo para retomarla:** código en el repo `legaltech` (GitHub
`ginaproanio/legaltech`). Scraper en `scraper/`, con su `README.md`; qué
comprueba antes de escanear, en `scraper/test_conexion.py`. Modelo de datos en
`docs/modelo_justired.md` de este repo. Hallazgos en `AUDITORIA-JUSTIRED.md`.
