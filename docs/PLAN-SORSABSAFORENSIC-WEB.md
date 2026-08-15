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

### Fase 0 — Rotar la llave y borrar `/ui` ⬜

La `API_KEY` del despliegue actual quedó expuesta en el historial de una
conversación. Se rota, y se borra la página `/ui` que se improvisó el
15-ago-2026: no debe quedar algo a medias que parezca el producto.

### Fase 1 — SSO central ⬜

`sorsabsaforensic` registrado en `auth-sorsabsa`. Dos roles. El alta de
perito exige subir la credencial (número de calificación del Consejo de la
Judicatura + vencimiento — el mismo dato que ya modela `peritos/` y
`gui_pyqt/perito_dialog.py`). **La verificación la hace Gina a mano**: es
quien sabe reconocer una acreditación válida, y automatizarlo sin criterio
sería un fallback que convierte "no verificado" en "válido"
(`ESTANDAR-DESARROLLO.md`).

### Fase 2 — El motor del informe fuera de Qt ⬜ **← la fase crítica**

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

### Fase 3 — Las tres pestañas ⬜

Reproducir la interfaz real, no una simplificación:

- **Casos** — panel lateral: listar, crear, abrir. `es_expediente()` reconoce
  un caso por su ESTRUCTURA, no por su nombre (ya resuelto en el código).
- **📎 Evidencias** — los **15 tipos** con sus formularios, generados desde
  `TIPOS_EVIDENCIA` (ya es un esquema declarativo), más los 4 bloques
  dinámicos: rangos de WhatsApp (fecha/hora), rangos de transcripción,
  fotogramas (con propósito: acredita edición/ubicación/contenido) y puntos
  de georreferenciación. Más "Editar" y "Vaciar caso" (que **nunca** toca
  `05_varios`).
- **⚙️ Procesadores** — ejecutar con log en vivo. El `QThread` + señales pasa
  a una cola con SSE; `set_progress_callback()` ya existe en cada procesador.
- **📄 Informe** — las 13 secciones, ficha del caso, medio de preservación,
  perfil del perito, factura, y el PDF de la Fase 2.

### Fase 4 — Procesadores, por grupo de dependencias ⬜

| Grupo | Procesadores | Qué necesita el contenedor |
|---|---|---|
| **A** | Correo, Documento escaneado, Google Sheets, Disco, Celular | Nada — ya corre |
| **B** | Transcripción de video, Materialización de video, Análisis de audio, Imagen forense | `ffmpeg`, `ffprobe`, `exiftool` + whisper/torch (imagen pesada) |
| **C** | Facebook, Instagram, TikTok, YouTube, Red X, capturas de georreferenciación | Playwright + xvfb (modo B: + noVNC) |

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

## 10. Decisiones pendientes

- **¿Cuándo entrega la máquina?** Cambia todo el orden de las fases.
- **¿La captura de pantalla del modo A se ofrece donde funciona sin cuenta
  (YouTube), o el perfil público se queda solo con canal oficial + material
  aportado?**
- **Verificación de la credencial de perito:** manual de entrada. ¿Se
  automatiza contra algún registro del Consejo de la Judicatura más adelante?
