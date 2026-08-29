# Auditoría del Convertidor — hallazgos de uso real

Abierto el **28-ago-2026**, convirtiendo el expediente Miraflores (15 cuerpos,
2.666 hojas escaneadas, 100% sin capa de texto) contra
`api.convertidor.sorsabsa.com` v1.6.0.

Existe porque el Convertidor se estaba puliendo con pruebas propias y con
JustiRed, que consume un solo tipo de documento. Un expediente judicial de
1992-2023 —máquina de escribir, manuscrito, fotocopias, oficios modernos— lo
somete a material que ninguna prueba cubría.

**Cada afirmación lleva su medición.** Sin medición, no entra.

---

## 🔴-1 — ⬜ El párrafo NO «vuelve a fluir»: buscar sobre la salida pierde hasta 2 de cada 3 apariciones

**Qué promete el motor.** `convertidor/estructura.py`, al final de
`estructurar()`:

> *«Renglones sueltos de un mismo párrafo se pegan con un salto simple, que en
> Markdown es un espacio: el párrafo vuelve a fluir.»*

**Qué pasa de verdad.** Eso es cierto para el Markdown **renderizado**. No lo es
para el **texto**, que es lo que lee todo consumidor programático — el
segmentador de JustiRed (`legaltech/scraper/actos.py`) y cualquier búsqueda.
`estructurar()` emite **una línea por renglón de OCR**; solo agrega líneas en
blanco entre párrafos y encabezados. Una frase sigue partida en 7 líneas.

**Medido** — mismo lote de 10 páginas (Cuerpo 10, págs. 1-10), dos llamadas
idénticas salvo el parámetro:

| | `estructurar=false` | `estructurar=true` |
|---|---:|---:|
| Caracteres | 15.963 | 15.933 |
| Líneas no vacías | 251 | **251** |
| Largo medio de línea | 62,3 | **62,3** |
| Encabezados | 8 | 9 |

Idénticos en lo que importa. Y el efecto sobre una búsqueda, sobre esa misma
salida:

| Frase | Apariciones en el texto tal cual | Tras normalizar espacios |
|---|---:|---:|
| «a qué unidad policial se encontraba designado» | 1 | **2** |
| «en el mes de Octubre del año de 1992» | 1 | **3** |
| «no existe o no se encuentra en sus archivos» | 2 | 2 |

**Por qué importa y a quién.** En este expediente la búsqueda no es una
comodidad: es cómo se ubica en qué foja consta cada dato que se va a citar en un
informe pericial. Una aparición que no se encuentra es una foja que no se cita.
El consumidor no tiene forma de saber que le faltó una — no hay error, hay
silencio.

Y no es de este caso: JustiRed corta por marcas de texto sobre esta misma
salida. Cualquier marca de más de una palabra puede caer en un corte de línea.

**Lo que NO es el arreglo.** Que cada consumidor haga
`re.sub(r"\s+", " ", texto)` por su cuenta —que es lo que hubo que hacer acá—
es la duplicación que el propio ecosistema ya marcó como defecto en
`AUDITORIA-PORTERO-SSO.md`: cada uno lo resuelve distinto y nadie lo arregla en
el origen.

**Lo que sí, a decidir por quien mantiene el motor:** que `estructurar()` una
los renglones de un mismo párrafo en **una sola línea de texto** (y no solo
visualmente), tratando el guion de corte de palabra a final de renglón. Es un
cambio de comportamiento en la salida: hay que ver antes qué le hace al
segmentador de JustiRed, que hoy vive con la salida partida.

---

## 🔴-3 — ⬜ El motor DESCARTA páginas en silencio, y no todas están en blanco

**El mecanismo.** `conversion.py` solo emite el encabezado de una página si esa
página devolvió texto:

```python
if text.strip():
    ocr_text.append(f"## Página {numero} (OCR-{motor})

{text}")
```

Una página de la que no se sacó nada **no aparece en la salida y no genera
ningún aviso**. El consumidor no puede distinguir «esta hoja está en blanco» de
«esta hoja no se pudo leer», porque las dos se ven igual: no están.

**Medido sobre el expediente completo.** De 2.666 hojas, el motor devolvió
2.111. Las 555 restantes, clasificadas midiendo la tinta sobre el PDF original
(fracción de píxeles por debajo de 200 en escala de grises):

| | Hojas |
|---|---:|
| Realmente en blanco (<0,5% de tinta) — reversos de foja | 501 |
| Dudosas (0,5–2%) | 25 |
| **Con contenido (>2%)** | **29** |

Once de esas 29 están entre **79% y 94% de tinta**.

**Una de ellas, abierta y mirada** (Cuerpo 5, pág. 109, 93,6% de tinta): es la
**tapa del «LIBRO DE VIDA POLICIAL» de GONZÁLEZ FLORES EDUARDO RENE** —un
teniente que figura en el proceso ratificando el informe investigativo— con
foliación manuscrita en el margen superior. La fotocopia salió oscura, pero el
título en relieve y el nombre **se leen sin esfuerzo**.

**Se intentó recuperarla tres veces y las tres volvieron vacías:**

1. Perfil `conversion` (Haiku), dentro del PDF → página descartada, en silencio.
2. Perfil `pericial` (Opus), la hoja sola → `OCR-EasyOCR` con 40 caracteres de
   basura (`27 ; . 012222 255844229`). O sea: la visión se consultó y no
   devolvió nada, y el motor cayó al tercer motor.
3. La misma hoja con **autocontraste** (recorte del 2% de cada cola del
   histograma), enviada como imagen → `HTTP 500: "No se pudo extraer texto
   significativo"`.

**Y ahí aparece la asimetría que más importa:** la MISMA hoja, enviada suelta
como imagen, devuelve un **error 500 explícito**; enviada dentro de un PDF de
varias páginas, **desaparece sin decir nada**. El camino que se usa en volumen
—que es el del scraper y el de cualquier conversión de expediente— es
justamente el silencioso.

**Por qué es 🔴 y no 🟡.** En un peritaje, una foja que falta sin dejar rastro
no es una degradación de calidad: es una prueba que nadie sabe que no está.
Acá fueron 29 sobre 2.666 (1,1%), y se encontraron **solo porque se contaron
las páginas contra el PDF original** — nada en la salida del motor lo insinuaba.

**Lo que haría falta:** que el motor emita la página igual cuando no pudo
leerla, con una marca explícita (`## Página N (SIN TEXTO)`), y que el JSON
devuelva la lista de páginas sin texto. Cuesta poco y convierte un silencio en
un dato. Mientras no exista, todo consumidor tiene que contar las páginas por
su cuenta — que es lo que hubo que hacer acá.

---

## 🟡-2 — ⬜ Dos motores, dos formatos, en el mismo documento

Con visión disponible y `estructurar=false` —la combinación por defecto, y la
que usa JustiRed— las páginas vuelven con **dos formas distintas** según qué
motor las leyó:

- **`OCR-Visión`**: Markdown estructurado, con encabezados y tablas. Medido en
  el piloto: la página 3 volvió con un `# FGE` y una tabla de 4 columnas.
- **`OCR-Tesseract`**: texto plano corrido, sin un solo `#`, porque ese camino
  llama a `image_to_string` y no a `estructurar()`
  (`conversion.py`: `text = estructura.estructurar(datos) if estructurar else
  pytesseract.image_to_string(...)`).

Quien recibe el documento recibe dos formatos mezclados sin haber pedido
ninguno, y qué párrafo sale en cuál depende de la confianza que Tesseract sacó
en esa hoja. No hay forma de pedir «dame todo con la misma forma».

---

## ✅ Lo que sí funcionó, medido

Se anota porque una auditoría que solo lista defectos no dice si la herramienta
sirve. **Sirve.**

- **El umbral de visión acierta.** Cifras de la corrida COMPLETA: de 2.111
  páginas con texto, solo **25 (1,2%)** cruzaron `UMBRAL_CONFIANZA=83`. No es
  que la visión estuviera caída: se comprobó abriendo páginas que ganó Tesseract
  (Cuerpo 10, pág. 41) y el texto es limpio y correcto. El gasto se concentró
  donde hacía falta —cuerpo 1, documentos de 1992 a máquina y manuscritos: 25 de
  135 hojas— y fue **cero** en los cuerpos 10 y 11, oficios modernos bien
  escaneados.
- **El costo real quedó muy por debajo de la estimación.** Se estimó $4-9 con
  Haiku para las 2.666 hojas. La corrida completa costó **$0,11**, porque el
  umbral mandó a visión 25 páginas y no 2.000.
- **`ocr_motivo` y la marca de motor por página valen.** Poder leer en la propia
  salida qué motor leyó cada hoja es lo que permitió descartar el fallo
  silencioso en un minuto, y es lo que hace auditable una cita en un informe
  pericial.
- **`perfil=pericial` hace lo que dice.** Sobre una hoja manuscrita ilegible
  devolvió `# [Documento manuscrito - Anotaciones]` y marcó lo dudoso, en vez de
  completar. En el material transcrito antes con ese perfil, un dígito dudoso
  salió como `PYA-08[2?]` — y esa marca de duda fue exactamente lo que permitió
  después establecer que esa placa venía de una nota adhesiva y no del
  expediente.

---

## Pendiente de medir

- Qué le hace a `legaltech/scraper/actos.py` unir los renglones (🔴-1). Hay que
  medirlo antes de cambiar el motor, no después.
- Si el techo duro de 50 MB por archivo es el correcto: los 15 cuerpos pesan
  entre 19 y 32 MB y pasaron, pero se enviaron en lotes de 20 páginas por el
  tiempo, no por el tamaño.
