# Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)

**Abierto:** 15-ago-2026. **Precedente de formato:** `PLAN-DESOLDADO.md`.
**Tracker que lo referencia:** `PENDIENTES-ECOSISTEMA.md` #7.

## Por qué existe este plan

Dos razones, en este orden:

1. **Gina entrega la computadora donde corre `main.py`.** Hoy SorsabsaForensic
   es una app de escritorio PyQt5 que solo funciona en esa máquina, con sus
   sesiones de navegador guardadas en disco. Sin la máquina, no hay sistema.
2. **Se busca vender la materialización digital como servicio.** Eso implica
   que lo consuma gente que no es Gina, lo que cambia el modelo de acceso a
   las plataformas (ver §3).

## REGLA DURA DE ESTE PLAN

**`core/` no se reescribe.** Son 13.683 líneas de lógica pericial con **cero
imports de Qt** (verificado 15-ago-2026: `grep -rn "^\s*\(from\|import\)\s.*PyQt5"
core/` → sin resultados). Los procesadores, los SHA-256, las limitaciones
declaradas, el `segundo_real` vs `segundo_solicitado`, el control de
luminancia, el log forense — todo eso ya es independiente de la interfaz y
**se conecta, no se reemplaza.**

Lo que se toca de `core/` es acotado y está enumerado en §3: las **4 llamadas**
que abren el navegador con el perfil persistente de Gina.

Mejorar la lógica es válido (ver §6). Perderla no. Cualquier paso de este plan
que exija reescribir un procesador está mal planteado y hay que replantearlo.

---

## 1. Los dos perfiles y el modelo de negocio

Definido por Gina, 15-ago-2026:

| Perfil | Precio | Alcance | Requisito de alta |
|---|---|---|---|
| **Perito** | **$80 por caso** | Varios procesadores dentro de UN caso — el flujo completo que Gina usa hoy | **Sube su credencial de perito** |
| **Público** | **$20–$30 por unidad** | **Una sola materialización por compra** | Solo cuenta |

Precios del perfil público: Facebook $20 · TikTok $20 · Correo $20 ·
**WhatsApp $30**.

**En la landing debe constar**, decisión de Gina: el servicio materializa,
pero **no sirve para un proceso judicial sin un perito que autentique la
prueba**. Ese es el gancho comercial hacia el perfil de arriba, no una
advertencia legal defensiva.

## 2. Lo que se reusa del ecosistema (regla dura del tracker)

`PENDIENTES-ECOSISTEMA.md` abre con: *"Todo producto DEBE usar los sistemas
compartidos del ecosistema"*. SorsabsaForensic es hoy el único que no lo hace.

| Sistema | Qué resuelve acá |
|---|---|
| **`auth-sorsabsa` (SSO)** | Login. Los dos perfiles son roles, no dos logins distintos. Registrar `sorsabsaforensic` en `src/lib/apps.ts` (mismo alta que `iot`, #14 del tracker) |
| **`pagos-sorsabsa`** | Los $80/caso y los $20–30/unidad. `/api/iniciar` ya cobra con PayPhone y ya lo usan condomanager, domuscrm, agente24siete y justired |
| **`@sorsabsa/ui`** | La interfaz web. Ya tiene `FormSection`, `Input`, `Card`, `Button`, `Icon` |
| **`notificaciones-sorsabsa`** | Avisar que un informe terminó (los procesadores tardan) |
| **R2 (`sorsabsa-expedientes`)** | Los expedientes. **No** el volumen de Railway: `ARQUITECTURA-ECOSISTEMA.md` dice "los expedientes no van en el disco de la aplicación" |
| **`geo-sorsabsa`** | Ya lo consume (commit `f40b08d`) |
| **`CONVERTIDOR`** | ⬜ **Pendiente — señalado por Gina 15-ago-2026: "es un producto que debe ser consumido por SorsabsaForensic".** Corre en Railway (`convertidor-production-7ca8.up.railway.app`) con Tesseract/EasyOCR dentro. Encaje natural: el procesador `documento` hoy renderiza un PDF a imágenes con PyMuPDF pero **no hace OCR** — el texto de un documento escaneado no queda buscable ni citable en el informe. Sin evaluar todavía cómo se conecta |

**Nada de esto se construye de nuevo.** Un "login propio" o un "cobro propio"
acá sería el error que el tracker previene explícitamente.

## 3. Acceso al contenido de las plataformas — lo único que cambia en `core/`

### El estado actual, verificado

Los 6 procesadores de navegador abren Chromium **visible** con el **perfil
persistente de Gina** (`data/*_profile`, 590 MB con sus sesiones), y si la
plataforma exige login, `_esperar_contenido()` espera hasta
`MAX_ESPERA_LOGIN = 600` segundos a que **un humano** se loguee en esa ventana.

**Ese diseño ya contempla "un humano se loguea acá".** Lo que cambia no es la
lógica: es **dónde se muestra esa ventana y de quién es la cuenta.**

### Los tres modos de acceso

| Modo | Quién se loguea | Dónde | Exposición de Gina | Riesgo para el usuario |
|---|---|---|---|---|
| **A — público** | Nadie | Navegador limpio, sin perfil ni cookies | Ninguna | Ninguno |
| **B — sesión propia** | El propio usuario | Ventana remota del contenedor (noVNC) | No almacena nada; las pulsaciones transitan | Aviso de "ubicación nueva", a veces verificación extra |
| **C — canal oficial** | Nadie | Petición HTTP a endpoints públicos | Ninguna | Ninguno |
| ~~D — formulario de contraseña~~ | — | — | **Total** | Alto | **DESCARTADO, no implementar nunca** |

**Corrección de rumbo anotada para no repetirla:** en la conversación que
originó este plan se descartó el modo B por "riesgo de sanción". Fue una
conclusión mal fundada: una alerta de inicio de sesión desde ubicación nueva
es una molestia, no una sanción. **El único modo realmente descartado es D**
(pedir la contraseña en un formulario propio), porque ahí sí Gina pasaría a
manejar credenciales ajenas.

### Cobertura medida en vivo (15-ago-2026, navegador limpio, URLs reales)

| Plataforma | Modo A (sin sesión) | Modo C (canal oficial) |
|---|---|---|
| YouTube | ✅ Completa (5.840 car., og completo) | ✅ oEmbed + Data API v3 |
| Instagram | ⚠️ Parcial (1.587 car., 9 publicaciones) | ✅ Open Graph |
| X | ⚠️ Parcial (1.923 car.) | ✅ Open Graph |
| Facebook | ❌ Muro de login | ✅ Open Graph |
| TikTok | ❌ Bloquea (196 car. aun con navegador visible) | ✅ **oEmbed: caption completo, autor, miniatura** |

**El modo C no reemplaza a la captura: la corrobora.** Un dato obtenido del
canal oficial de la plataforma es una fuente independiente del DOM raspado —
en un informe pericial eso suma. Y `facebook/processor.py` e
`instagram/processor.py` **ya leen etiquetas `og:`**, solo que desde dentro
del navegador logueado; el modo C obtiene lo mismo sin navegador ni sesión.

### El cambio concreto en `core/`

Las 4 llamadas que abren el navegador reciben un parámetro de modo:

- `core/processors/web_social/base.py:1135` (Instagram, YouTube)
- `core/processors/facebook/processor.py:590`
- `core/processors/red_x/processor.py:347`
- `core/processors/georeferencia/processor.py:904`

Modo A → `launch()` + `new_context()` limpio. Modo B → contexto efímero
mostrado por noVNC. **El resto del procesador —captura, hash, control de
luminancia, limitaciones— no se toca.**

---

## 4. Fases

### Fase 0 — Rotar la llave y borrar `/ui` ✅ **HECHA 15-ago-2026**

`sorsabsaforensic@6ac66c0`. Llave rotada vía `railway variable set --stdin`
(no pasó por el chat ni por el historial de comandos) y la página `/ui`
borrada. **Verificado en vivo:** `/ui` → 404, llave vieja → 401.

### Fase 1 — SSO central ✅ **HECHA Y VERIFICADA 15-ago-2026**

Gina lo pidió y tenía razón: *"por qué no incorporas auth-sorsabsa? antes
siempre me hacías la observación que todo sistema que entra al ecosistema
debe incorporar auth"*. La llave compartida provisional **ya no existe**:
una contraseña única para todo el que entrara es exactamente lo que el
portero existe para evitar, y quien suscribe un informe pericial tiene que
ser una persona identificada.

**Contra qué proyecto se verifica.** Contra `verticales_sorsabsa`
(`twkuidnjwhopbjnrhnxp`), **no** contra `sorsabsa-identity` — el dato de
arquitectura fijado el 10-ago-2026 (`ARQUITECTURA-ECOSISTEMA.md` §1,
`AUDITORIA-PORTERO-SSO.md` 🔴-12). Confundirlo costó una sesión entera de
bucles en agente24siete. Consecuencia práctica: **no hubo que crear ni
configurar nada en Supabase**, fue solo código.

**Quién puede entrar: el registro de peritos, no una lista en el código.**
`ESTANDAR-DESARROLLO.md` marca `if email == "..."` como señal de alarma —
si la respuesta a "¿por qué el sistema necesita conocer esto?" es
autorización, debe haber una fuente de datos. Esa fuente **ya existía**:
`PERITOS_DIR`, que además es donde vive el número del Consejo de la
Judicatura. Tener perfil ES ser perito. El emparejamiento es por **email**,
el claim OIDC estándar: un campo custom en `user_metadata` no sobrevive a
la federación, y confiar en él causó un bucle real en IOT el 09-ago-2026.

**Lo que NO se verifica en el login: el pago.** A propósito, y siguiendo el
criterio que `entity-resolver.ts` ya dejó escrito para agente24siete: *"El
gate correcto para este producto no es «¿tiene suscripción?» — es «¿tiene
saldo?», y ESE chequeo vive dentro del producto, al consumir, no en el
login."* SorsabsaForensic cobra por consumo ($80 el caso, $20-30 el
insumo), no por suscripción: preguntar por una suscripción mensual
bloquearía al 100 % de sus usuarios. Se registró como tal en
`entity-resolver.ts`.

Cambios: `auth-sorsabsa/src/lib/apps.ts` (alta del producto) ·
`entity-resolver.ts` (modelo de cobro) · `SorsabsaForensic/core/sso.py`
(nuevo) · `api.py` (`/auth/callback` GET+POST, `/auth/logout`) ·
`web/index.html` (sin formulario de llave).

**Sin puerta trasera de pruebas.** La comprobación automática no puede
loguearse contra el portero real, pero el servicio **no** lleva un
`MODO_PRUEBA` —bastaría desplegar con esa variable puesta para dejarlo
abierto—. El atajo vive en `tools/_servidor_de_prueba.py`, fuera del
servicio, usando `dependency_overrides` de FastAPI.

#### Lo que hay que hacer FUERA del código

**`sorsabsa@hotmail.com` no existe en el portero.** Comprobado en
`auth.users` de `gyqgorgfstffbgazhbnb`: las cuentas reales son
`gina.proanio76@gmail.com`, `sorsabsa@gmail.com` y
`gina.proanio@hotmail.com`. Pero Gina fijó el criterio (15-ago-2026):
*"sorsabsa@hotmail.com es la cuenta que consta registrada ante el consejo
de la judicatura, por ende con esta se debe usar para mis peritajes"* —
quien firma debe ser quien está registrado ante el CJ. Así que **la cuenta
se registra en el portero**, no se cambia el perfil:
`https://auth.sorsabsa.com/auth/register`. El perfil de perito ya declara
ese correo, así que registrarse alcanza para quedar autorizada.

**Orden de despliegue, no es indistinto:** primero `auth-sorsabsa` (Vercel)
y después SorsabsaForensic. Al revés, `app=sorsabsaforensic` todavía no
existe en el portero desplegado, cae en `APPS.default` y el login termina
en `sorsabsa.com` en vez de volver al producto.

#### Pendiente que abre esta fase

Con **dos o más** peritos registrados, `GeneradorInforme._cargar_perito()`
toma el PRIMER perfil de la carpeta, no el de quien está trabajando: el
informe saldría firmado por otra persona. Hoy no es un defecto —hay un
solo perfil— y `/api/perito` ya usa la identidad de la sesión. Se resuelve
junto con el alta de peritos de la Fase 5, y **no puede quedarse sin
resolver** cuando entre el segundo perito.

### Fase 2 — El motor del informe fuera de Qt ✅ **HECHA Y VERIFICADA 15-ago-2026**

**Resultado de la prueba de aceptación** (`sorsabsaforensic@82ddbec`):

```
entregado : 65 páginas, 55.979.693 bytes
regenerado: 65 páginas, 55.979.688 bytes
idénticas píxel a píxel               : 63/65
difieren SOLO en la fecha de generación:  2  (portada y ficha, por diseño)
difieren de verdad                     :  0
```

`report_panel.py` pasó de 5.249 a 889 líneas; el motor vive en
`core/report/generador.py`. El código se movió por rangos de líneas exactos
con el parser (`ast`), sin retipear. `ReportPanel` **hereda** de
`GeneradorInforme`, así que la app de escritorio y el servicio web usan el
mismo objeto de método — no hay dos copias que puedan divergir. La prueba
quedó como `tools/verificar_informe_identico.py` para poder repetirla.

**3 bugs reales que encontró esa prueba** (y por eso el criterio era
"idéntico", no "parecido"):

1. La extracción movió los métodos pero no los **atributos de clase**;
   `PROPOSITOS` quedó atrás y el generador reventaba.
2. `_extraer_cuerpo_html` quedó fuera por un **falso positivo del
   clasificador**: marcaba "Qt" por la mención a `QTextEdit` en su
   *docstring*, cuando el cuerpo es regex puro. Reclasificado por tokens,
   ignorando comentarios y literales de texto.
3. 🔴 **El más grave:** `_cargar_perito()` hacía
   `Path(__file__).parent.parent / "peritos"`. Desde `gui_pyqt/` eso daba la
   raíz; desde `core/report/` daba `core/peritos`, que no existe. **El
   informe se generaba igual pero SIN los datos de la perito** — sin nombre,
   sin cédula, sin número del Consejo de la Judicatura, con la profesión por
   defecto "Perito Forense". Un informe pericial sin identificar a quien lo
   suscribe. Corregido con `RAIZ_PROYECTO`, una constante con nombre, para
   que mover un archivo no vuelva a romperlo en silencio.

### ~~Fase 2~~ — planteo original (queda como referencia)

`gui_pyqt/report_panel.py` (5.248 líneas) → `core/report/`:

- `anexos.py` — los ~40 métodos `_anexo_*_html`. Son funciones que leen un
  JSON de procesador y devuelven HTML: portables casi tal cual.
- `render.py` — el armado de `html_completo` + weasyprint (`guardar_pdf`,
  línea 4967).
- Lo que queda atado a Qt (editor de texto enriquecido, diálogos, selección
  de imágenes) se reemplaza por su equivalente web, **sin tocar la generación
  del HTML**.

**Criterio de aceptación, innegociable:** regenerar un informe ya entregado
(p. ej. `caso-096-2026-TCE`) y que el PDF salga **idéntico** al que Gina
firmó. Sin eso no se avanza a la Fase 3. Es un documento que va a un
tribunal: no se da por bueno "parecido".

### Fase 3 — Las tres pestañas ✅ **HECHA Y VERIFICADA 15-ago-2026**

Reproducir la interfaz real, no una simplificación.

#### 3.a Navegación: gestión ≠ ejecución (pedido de Gina, 15-ago-2026)

El primer intento dejaba la columna «CASOS» fija a la izquierda y el trabajo
comprimido al lado. Gina lo rechazó con un criterio que vale para todo el
producto:

> «Casos = módulo de gestión/navegación. Caso abierto = contexto actual.
> Evidencias / Procesadores / Informe = espacio de ejecución de la pericia.»

No es esconder la columna con CSS: son **dos estados de navegación**.

| Estado | Qué se ve |
|---|---|
| Sin caso abierto | El módulo de casos ocupa la pantalla: buscar, crear, abrir, borrar |
| Con caso abierto | Espacio de trabajo al 100 % del ancho. Del caso queda un chip `CASO · PRUEBA001` y el botón **Cambiar caso** |
| Cambiar caso | El mismo módulo se abre como panel ENCIMA (con velo) y se cierra solo al elegir |

Medido en el navegador: el área de trabajo del informe usa **1364 de 1600 px
(85 %)** con el riel de secciones abierto, y **1600 px (100 %)** al plegarlo.
El módulo de casos **nunca** resta ancho: se superpone.

#### 3.b Editor de texto enriquecido — requisito, no mejora futura

Sobre `contenteditable` + `execCommand` con `styleWithCSS`, **sin librería
externa**: el HTML que se guarda es el mismo que WeasyPrint imprime, y un
peritaje no puede depender de que un CDN sirva un `.js`. Una librería con
modelo propio (Quill/ProseMirror) guardaría JSON, no el HTML que el
generador ya sabe componer.

Negrita · cursiva · subrayado · tachado · listas numeradas y con viñetas ·
sangrías · 4 alineaciones · tipo y tamaño de fuente (en **pt**, la unidad de
la hoja A4) · color de texto y resaltado · títulos y cita · **tablas con
edición** (fila/columna arriba-abajo-izquierda-derecha, quitar, encabezado,
ancho total, bordes) · **imágenes** subidas al caso, con ancho y alineación ·
pegar con formato desde Word · deshacer/rehacer · guardar (Ctrl+S) · ver y
corregir el HTML.

Las dos secciones que **no** son texto libre siguen siendo formulario, como
en la app de escritorio: `2. Ficha del caso` y `10. Medio de preservación`
(con su lista de fotos). Más los tres diálogos del panel de Qt: factura de
honorarios, capturas de video y **perito que firma** — este último es nuevo:
muestra nombre, cédula y credencial del CJ **antes** de generar el PDF,
porque un informe sin perito sale igual y el PDF no lo advierte.

#### 3.c Tres fallos silenciosos que salieron al operar la interfaz

Los tres se ven bien en pantalla y salen mal impresos. Ninguno lo detectó la
prueba de API: aparecieron manejando el navegador de verdad.

1. **`insertHTML` borra los estilos en línea que considera redundantes** con
   el CSS de la página. La tabla se guardaba con `<td>` pelado: bordes
   dibujados por la hoja de estilos de la web, **ausentes en el PDF**. Se
   reponen por DOM y `normalizarTablas()` corre también antes de guardar.
2. **`insertHTML` de un bloque `<table>` con el cursor dentro de un `<p>`
   parte la estructura**: el `<tbody>` quedaba como HERMANO de la tabla
   (`<tbody>…</tbody><table></table>`). Al volver a la sección la tabla
   estaba vacía y las filas sueltas. Ahora la tabla se construye por DOM y
   se inserta como hijo directo del editor.
3. Consecuencia del anterior: `celda.closest('table')` devolvía `null`,
   `refrescarContexto()` reventaba al posicionar la barra y **ningún botón
   de tabla respondía** — la barra aparecía, pero muerta.

#### 3.d Cómo se verifica

`prueba_ui.py` levanta uvicorn, abre Chromium y **opera la interfaz**: crea
el caso, escribe, aplica negrita, inserta lista, tabla e imagen, guarda,
recarga y comprueba que todo vuelve del servidor; después genera el PDF y
mira **dentro** con PyMuPDF: que el texto esté, que la tabla se dibuje con
sus bordes (57 trazos) y que la imagen esté incrustada. 40 comprobaciones,
cero errores de JavaScript.

### Fase 4 — Procesadores, **priorizados por uso real medido** ⬜

**Medido el 15-ago-2026 sobre los 11 expedientes reales** (contando las
carpetas de `02_procesamiento/`), no supuesto:

| Procesador | Usos reales | Grupo | Necesita |
|---|---|---|---|
| **Materialización de video** | **9** | B | `ffmpeg` ✅ |
| **Análisis de audio** | **8** | B | `ffmpeg` + numpy + matplotlib ✅ |
| **WhatsApp** | **5** | B | whisper (notas de voz) ✅ |
| **TikTok** | **5** | C | navegador |
| Imagen forense | 1 | B | `exiftool` |
| Facebook | 1 | C | navegador |
| Documento escaneado | 1 | A | PyMuPDF |
| Google Sheets, Disco, Celular, Instagram, YouTube, Red X, Georreferenciación | 0 | — | — |
| **Correo** | **0** | A | ya corre |

**Conclusión que reordena el plan:** video + audio + WhatsApp = **22 de 30
usos reales**, y los tres son del **grupo B** (`ffmpeg` + whisper), no del
grupo del navegador. El orden correcto es **B → C → A**, no el A → B → C que
tenía la versión anterior de este documento.

**Corrección anotada:** el 15-ago-2026 se construyó el procesador de correo
como primer paso "porque el caso activo lo necesita" — deducido de UN caso sin
arrancar, sin mirar los 11 cerrados. Es el procesador con **cero usos
históricos**. No es trabajo perdido (el caso 019-25 sí es de correos), pero no
era la prioridad. Mirar el uso real antes de priorizar, no inferirlo.

#### Grupo B — hecho el 15-ago-2026, con tres correcciones al propio plan

Corren en el servicio web: **Correo, Materialización de video, Análisis de
audio, WhatsApp y Transcripción de video** (5). Lo que se encontró al portarlos:

1. **«Análisis de audio» NO necesita whisper.** Esta tabla decía `ffmpeg +
   whisper` y era falso: ese procesador no transcribe una palabra. Mide la
   señal —piso de ruido, picos, flujo espectral, clics, cortes, zonas mudas—
   para sostener si el audio fue editado. Su `get_config()` siempre declaró
   `ffmpeg, ffprobe, numpy`. Costó **31 MB de numpy**, no los ~900 MB de
   whisper. Nadie había leído el procesador antes de anotarle la dependencia.
2. **No es un tipo de evidencia: es un segundo análisis sobre el video.** En
   los 8 expedientes reales `e-001_analisis_audio` convive con
   `e-001_materialización_de_video` y su `ruta_origen` apunta al mismo .mp4,
   con la misma huella SHA-256. Darle tipo propio habría obligado a subir el
   archivo dos veces y roto esa huella compartida. Se resolvió con
   `sobre: [...]` en el registro y un botón extra en la tarjeta de la
   evidencia. **Nada en el código lo instanciaba** —ni la app de escritorio—:
   se corría a mano.
3. **La carpeta de salida decide si el anexo existe.** El informe encuentra
   los anexos por el NOMBRE de la carpeta (`_carpetas_analisis_audio` busca
   la cadena `analisis_audio`). Con el nombre por defecto el anexo habría
   desaparecido del PDF sin un solo error. Por eso el procesador declara
   `carpeta` y el orquestador la respeta.

Además: `matplotlib` no la declaraba nadie y dibuja las 3 gráficas del anexo
(sin ella el informe salía sin su gráfica principal, con `generada: False` y
nadie mirando); la clave `Facebook` del registro nunca coincidía con el tipo
`Facebook Post`; y `Celular`/`Disco` decían "sin portar" cuando en realidad
**no se procesan** — se describen en el informe.

Verificado de punta a punta con un video construido con ediciones conocidas
(silencio digital de 2 s + dos empalmes): los detectó los 5 marcadores, las 3
gráficas se generaron, ambos procesadores compartieron huella de adquisición,
y el **anexo salió en el PDF** (11 páginas, 110 imágenes, 0 avisos). WhatsApp
se probó con un export real con dos notas de voz: transcritas correctas, con
su SHA-256 cada una.

**Coste en la imagen:** torch (CPU, no CUDA) 516 MB, llvmlite 108, numba 27,
numpy 31, matplotlib 32, yt-dlp 22 y el modelo `base` de whisper 139 ≈ **0,9
GB**. Con `pip install torch` a secas habrían sido ~2,5 GB de librerías de GPU
para una máquina sin GPU: el Dockerfile lo instala contra
`download.pytorch.org/whl/cpu`. El modelo va **horneado en la imagen**, no
descargado en la primera pericia.

| Grupo | Procesadores | Qué necesita el contenedor |
|---|---|---|
| **B (primero)** | Materialización de video, Análisis de audio, WhatsApp, Transcripción de video, Imagen forense | `ffmpeg`, `ffprobe`, `exiftool`, whisper/torch — imagen pesada |
| **C (después)** | TikTok, Facebook, Instagram, YouTube, Red X, capturas de georreferenciación | Playwright + xvfb (modo B: + noVNC) |
| **A (ya resuelto)** | Correo ✅, Documento escaneado, Google Sheets, Disco, Celular | Nada especial |

`.pst`/`.ost` quedan aparte: necesitan `pythonnet` + `XstReader.Api.dll` (una
DLL de Windows) bajo CoreCLR — sin confirmar que corra en Linux.

`.pst`/`.ost` quedan aparte: necesitan `pythonnet` + `XstReader.Api.dll` (una
DLL de Windows) bajo CoreCLR — sin confirmar que corra en Linux. Hoy el
servicio los rechaza con un error explícito.

### Fase 5 — Cobro y perfil público ⬜

`pagos-sorsabsa`: $80 desbloquea un caso (perito), $20–30 desbloquean una
materialización (público). El perfil público usa modos A y C, más la
exportación de datos que el propio usuario aporte.

---

## 5. Los expedientes

Van a **R2** (`sorsabsa-expedientes`), no al volumen de Railway — la regla
del §7 de `ARQUITECTURA-ECOSISTEMA.md`. El volumen que se creó el 15-ago-2026
es provisional y queda anotado como deuda.

**Ya subido y verificado (15-ago-2026):** `informes-finales/2026/<caso>.pdf`,
11 PDF, 103 MB — el último informe entregado de cada caso cerrado. El resto
de la evidencia cruda no se conserva (decisión de Gina).

## 5-bis. Pendientes levantados por Gina el 15-ago-2026

Anotados, **no** empezados. Se ejecutan en este orden dentro del plan.

### 5-bis.1 — Foliación automática del PDF final ⬜

Regla que fijó Gina, textual: **un folio es una HOJA FÍSICA completa —recto
y verso—, no una página del PDF.**

- El número va **solo en el recto**, esquina superior derecha.
- Correlativo desde la primera hoja: `1 (UNO)`, `2 (DOS)`, … `35 (TREINTA Y
  CINCO)` — en cifra y en letra.
- Hoja 1 = folio 1, hoja 2 = folio 2, aunque cada hoja tenga contenido en
  las dos caras. **El verso NO pasa a ser el folio siguiente.**
- **CD/DVD/USB:** la hoja de identificación del soporte recibe el folio que
  le toque por su ubicación. Si el contenido del CD queda en el **verso**
  del folio 6, sigue siendo folio 6 — **no se traslada** a la hoja
  siguiente solo para que quede junto al número. Se respeta el orden
  físico y documental del expediente.
- Se aplica sobre el **PDF definitivo**, con todos los anexos ya
  incorporados y ordenados. El PDF descargado ya sale foliado, sin
  intervención manual.

Nota técnica para cuando se implemente: el generador compone en A4 a una
cara, así que "hoja física" implica decidir el mapeo página→hoja (impresión
a doble faz). Esa correspondencia hay que fijarla con Gina **antes** de
escribir código: es lo que decide si la página 2 del PDF es el verso del
folio 1 o el recto del folio 2.

### 5-bis.2 — Correos de confirmación: llegan de Supabase, en inglés y sin marca ⬜

Gina: *"el mail de confirmación llegó por Supabase y en inglés. ¿Por qué se
consume de esa forma? CondoManager presenta su marca por correo, por ende
nunca llega en inglés y menos sin marca."*

Tiene razón y el ecosistema ya lo resolvió: `auth-sorsabsa` tiene
`src/app/api/auth-hook/send-email` y plantillas en `src/emails/` — el Send
Email Hook de Supabase, que sustituye el correo por defecto por uno propio,
en español y con la marca de la app. **El registro de SorsabsaForensic no
lo está usando**, o el hook no cubre el alta genérica. Hay que comprobar
cuál de las dos cosas es antes de tocar nada — no duplicar plantillas.

### 5-bis.3 — SorsabsaForensic no está en el Showcase ⬜

Falta integrarlo, como el resto de los productos.

### 5-bis.4 — Notificaciones: consumir `notificaciones-sorsabsa` ⬜

La campana ya está en la barra superior (15-ago-2026) como punto de
integración, y **declara que no está conectada** en vez de mostrar un cero
—"sin avisos" y "el servicio no responde" se ven igual, y confundirlos es
como se pierde el aviso de que un informe terminó—. Falta consumir el
transversal. Regla dura: este producto **no implementa avisos propios**.

---

## 6. Mejoras acordadas — mejorar la lógica, no perderla

### 6.1 WhatsApp: adjuntar los documentos al informe, no solo listarlos

**Hoy:** `_procesar_adjuntos()` extrae del ZIP los documentos
(`.pdf .docx .xlsx .pptx .doc .xls .txt`), los hashea y los copia a
`media_dir` — pero el informe **solo los lista con su hash**. Gina tiene que
abrirlos, imprimirlos y adjuntarlos a mano.

**El arreglo ya está construido en el propio sistema:**
`documento/processor.py` renderiza un PDF a imágenes por página con PyMuPDF
(`fitz`) a los dpi indicados, hasheando cada página; y `report_panel.py` ya
tiene `_anexo_documento_escaneado_html` (línea 4811) para pintarlas.

**Falta conectarlos:** pasar los documentos que WhatsApp ya extrajo por ese
renderizador y llevarlos al anexo. Cero lógica nueva — es reuso de dos piezas
propias. Elimina un paso manual de cada informe con WhatsApp, que además es
el producto más caro del perfil público ($30).

### 6.2 Canal oficial como corroboración

Modo C (§3) alimenta un bloque nuevo de "datos declarados por la plataforma",
independiente del DOM raspado. No sustituye ninguna captura.

## 7. Fuera de alcance, explícito

- **Reescribir cualquier procesador.** Ver la regla dura.
- **Modo D** (formulario pidiendo contraseñas de plataformas).
- **`.pst`/`.ost`** hasta confirmar `pythonnet` en Linux.
- **Proxies residenciales** para evitar el aviso de IP de datacenter en modo
  B: cuesta y abre otra discusión de ToS. Se avisa al usuario y decide él.
- **Migrar la app de escritorio.** Sigue siendo válida como herramienta de
  Gina mientras tenga una máquina; el servicio web no la reemplaza por
  decreto.

## 8. Riesgos reales

1. **La Fase 2 puede no dar idéntico.** `report_panel.py` mezcla render con
   edición en Qt. Si el PDF no sale igual, hay que resolverlo antes de seguir,
   no después.
2. **Las plataformas cambian su bloqueo sin avisar.** La tabla de cobertura
   del §3 es del 15-ago-2026 y hay que volver a medirla, no asumirla.
3. **Tamaño real.** Son semanas, no días. La Fase 2 sola es un trabajo
   grande. No prometer fechas antes de terminarla.
4. **Gina se queda sin máquina antes de que esto esté listo.** Si la fecha de
   entrega es próxima, hace falta un puente y hay que decidirlo ya.

## 9. Anotado para después — pericia móvil (NO en este plan)

**Decisión de Gina, 15-ago-2026:** *"esto significaría programar algo que haga
lo que hace MOBILedit, que es vender licencias para un solo celular, y a eso
no quiero entrar todavía; quiero que lo que ya tengo funcione primero."*
**No se toca hasta que las fases 0–5 estén cerradas.**

La idea, para cuando se retome: un procesador nuevo de "Extracción móvil" que
**no haga la extracción**, sino que **ingiera los artefactos** de las
herramientas libres que ya lo hacen bien, y les ponga encima lo que a ellas
les falta y SorsabsaForensic sí tiene (hashes, cadena de custodia,
limitaciones declaradas, informe pericial):

| Etapa | Herramienta libre |
|---|---|
| Extraer Android | `adb` (respaldo lógico), AFLogical |
| Extraer iOS | Respaldo de Finder/iTunes, `libimobiledevice` |
| Interpretar artefactos | **ALEAPP** (Android), **iLEAPP** (iOS) |
| Detectar spyware | **MVT** (Amnistía Internacional) — alcance acotado: detecta indicios de compromiso, NO hace extracción general |
| Armar el informe | **SorsabsaForensic** ← el hueco que llenamos |

Comprar MOBILedit con licencia sigue siendo válido cuando haya presupuesto:
es de las opciones comerciales más accesibles del rubro.

### 🚨 No volver a evaluar estos repositorios — son malware, no del fabricante

Revisados el 15-ago-2026 a pedido de Gina, que razonablemente los tomó por
material oficial puesto a disposición de desarrolladores. **No lo son:**

- `shadrian-21/MOBILedit-Forensic-Express-Pro-Full-Version`
- `mazlumbaydar/MOBILedit-Forensic-Express-Kullanma-Klavuzu/releases`
- `topics/mobiledit-forensic-express-key`
- `topics/mobiledit-forensic-express-manual`

Evidencia verificada en el propio repositorio: sin instrucciones reales de
instalación (solo marketing copiado), enlaces acortados y ofuscados hacia
`qsatx.top`, etiquetas `keygen`/`crack`/`torrent` puestas por el autor, y su
único issue abierto reporta *"exe crashs instantly and triggers dump log"* —
comportamiento típico de un dropper.

**Por qué importa más acá que en cualquier otro repo:** Gina es perito. Una
estación de trabajo comprometida no cuesta un programa: rompe la cadena de
custodia y habilita a la contraparte a impugnar **todo expediente procesado
en esa máquina**, incluidos los ya entregados. Encaja además con antecedentes
reales de que la están apuntando (dominio falso `ecuadorchequea.com`; otra IA
dándole diagnósticos inventados con formato de autoridad).

Los que **sí** son legítimos y se pueden consultar: `mvt-project/mvt`,
`yogsec/Digital-Forensics-Tools`, `garudaproject/digital-forensics-tools`.

## 10. Plazo real y calendario

**Gina entrega el equipo alrededor del 15-sep-2026 (un mes).** Confirmado el
15-ago-2026, junto con un dato que quita la urgencia destructiva: **el sistema
local sigue instalado y no se borró**, así que durante todo el mes tiene una
herramienta de trabajo funcionando. Eso permite hacer las cosas bien en vez de
a las apuradas — pero el respaldo caduca con la máquina.

| Semana | Qué |
|---|---|
| **1** (15–22 ago) | Fase 0 (rotar llave, borrar `/ui`) + arranque de Fase 2: extraer los ~40 `_anexo_*_html` a `core/report/` |
| **2** (22–29 ago) | Fase 2 completa + **verificación del PDF idéntico** contra `caso-096-2026-TCE`. Si no sale idéntico, se resuelve acá y el resto se corre |
| **3** (29 ago–5 sep) | Fase 3 (las tres pestañas) + Fase 1 (SSO, ~1 día: el patrón ya existe de `iot`) |
| **4** (5–12 sep) | Procesadores **grupo B**: video, audio, WhatsApp. Contenedor con `ffmpeg` + whisper |
| **Colchón** (12–15 sep) | TikTok (grupo C) si alcanza, y ajustes |

**Queda fuera del mes, y hay que decirlo ahora:** el resto del grupo C
(Facebook, Instagram, YouTube, Red X, georreferenciación) y la **Fase 5
completa (cobro y perfil público)**. El servicio comercial no es lo que
sostiene el trabajo de Gina; su herramienta de perito sí. Ese es el criterio
de corte si algo tiene que caerse.

## 11. Dominio

**`materializacion.sorsabsa.com`** — decidido por Gina, sin dominios genéricos
de Railway. Registrado en Railway el 15-ago-2026 (custom domain
`e5d83743-c0b6-4a48-be47-9e362e9673cd`).

El DNS de `sorsabsa.com` vive en **Hostinger** (`ns1/ns2.dns-parking.com`), no
en Cloudflare — los registros los crea Gina en su panel, no se pueden crear
desde acá. Mismo mecanismo que ya usó para `auth.sorsabsa.com` → Vercel.

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `materializacion` | `u3hswmuy.up.railway.app` |
| TXT | `_railway-verify.materializacion` | `railway-verify=a2463ecbbb1a45c27819d45f1585b751f7fead418442b40b4372acb579986394` |

## 12. Decisiones pendientes

- **¿La captura de pantalla del modo A se ofrece donde funciona sin cuenta
  (YouTube), o el perfil público se queda solo con canal oficial + material
  aportado?**
- **Verificación de la credencial de perito:** manual de entrada. ¿Se
  automatiza contra algún registro del Consejo de la Judicatura más adelante?
