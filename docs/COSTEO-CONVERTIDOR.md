# Costeo del Convertidor — la prueba de Miraflores

**21-ago-2026.** Gina, después de convertir un expediente de 71 fotos con la
ruta de visión recién construida:

> *"pagan $9 mensuales y en 71 archivos ya se acabaron casi la mitad del saldo,
> no le veo negocio"*

Tiene razón, y este documento existe para contestarlo con números medidos en
vez de estimados. **La conclusión corta: con el modelo que se desplegó por
defecto no hay negocio; cambiando una variable de entorno, sí lo hay.**

---

## 1 · Qué se probó

Un expediente judicial real fotografiado hoja por hoja —`iot/cases/miraflores/2`,
71 fotos de teléfono de 4160×3120— convertido por el motor de producción
(`api.convertidor.sorsabsa.com`, 1.5.0) con la ruta de visión encendida.

Es deliberadamente **el peor material posible**: papel curvado con sombra,
sellos encima, anotaciones manuscritas al margen y fotocopias de fotocopias. No
representa a un usuario promedio; representa el techo del gasto.

| | |
|---|---|
| Hojas | 71 de 71, ninguna falló |
| Resueltas por Tesseract (gratis) | 2 |
| Resueltas por visión (con costo) | 69 |
| Tiempo | 37 min |
| **Costo del modelo** | **≈ $3,00** |

Contra la conversión previa solo con Tesseract: **+60,4% de palabras útiles**
(13.163 → 21.107). La mejora es real y el costo también.

## 2 · El problema de negocio, en una línea

El plan Pro son **$9/mes**. Con Opus 5 como motor de visión, el usuario agota
la suscripción entera en **285 páginas** — y eso es costo puro, sin margen, sin
Railway, sin Vercel, sin impuestos.

Un solo expediente como el de la prueba consume **un tercio de la mensualidad**.
Dos expedientes y el cliente cuesta más de lo que paga.

## 3 · Qué se midió, y cómo

Comparar modelos sobre las fotos reales no serviría: no hay verdad de
referencia contra la cual medir el acierto. Así que se fabricó una.

Se tomó una página del **Registro Oficial Nº 256 que SÍ tiene capa de texto**,
se guardó ese texto como verdad, y se rasterizó y degradó hasta parecer una
foto de teléfono: inclinada 1,6°, con sombra lateral, desenfoque, ruido de
sensor y a la mitad de resolución. La misma imagen degradada fue a los tres
modelos, y el costo salió de `response.usage` — los tokens que informa la
propia API, no una estimación.

| Modelo | Léxico | Orden | Tokens ent. | Tokens sal. | US$/pág | **Págs por $9** |
|---|---|---|---|---|---|---|
| `claude-opus-5` | 100,0% | 94,6% | 1.875 | 887 | 0,0316 | **285** |
| `claude-sonnet-5` | 99,8% | 98,7% | 1.875 | 737 | 0,0167 | **539** |
| `claude-haiku-4-5` | 99,3% | 98,3% | 1.796 | 557 | 0,0046 | **1.964** |

> **léxico** = qué proporción de las palabras verdaderas reconoció, sin importar
> el orden. Mide si LEE.
> **orden** = cuánto coincide la secuencia. Mide si además sirve para segmentar.

**Haiku 4.5 cuesta 7 veces menos que Opus 5 y pierde 0,7 puntos de léxico.**

Una advertencia sobre la columna `orden`: Opus sale más bajo (94,6%) no porque
lea peor, sino porque **reestructura más** — agrega encabezados y reordena las
dos columnas del Registro Oficial a un orden de lectura correcto. La métrica
compara contra un texto lineal, así que castiga precisamente lo que puede ser
mejor salida. No usar esa columna sola para descartar Opus.

## 4 · Lo que NO cuesta

Conviene tenerlo presente antes de sobredimensionar el problema: **la ruta de
visión solo se dispara donde Tesseract falla.**

El motor mide la confianza media de Tesseract por página y solo paga la
relectura si cae por debajo de `UMBRAL_CONFIANZA` (83). Ese corte está medido:

- escaneo limpio: 88,6 – 92,5
- foto difícil: 61,0 – 78,1

Consecuencias reales:

- Un **PDF con capa de texto** (la mayoría de lo que se convierte) no toca el
  OCR siquiera. Costo del modelo: **$0**.
- Un **escaneo limpio** lo resuelve Tesseract. Costo: **$0**.
- Los 84 documentos publicados de JustiRed: **$0**, ninguno cruza el umbral.
- En la prueba de Miraflores, que es el peor caso, **2 de 71 hojas** las
  resolvió Tesseract sola.

O sea: el costo no es por conversión, es por **página ilegible**. El expediente
fotografiado es el caso extremo, no el típico.

## 5 · Las opciones de precio

Ninguna está decidida. Se listan con su aritmética para que la decisión sea
informada.

### A · Cambiar el modelo de visión

Una variable de entorno: `VISION_MODEL=claude-haiku-4-5`. El costo del
expediente de la prueba pasa de **$3,00 a $0,33**, y el plan Pro soporta ~1.964
páginas de modelo antes de agotarse. Con un objetivo de 70% de margen bruto,
alcanza para incluir **~590 páginas/mes** — un producto viable.

Es el cambio de mayor efecto y el de menor esfuerzo. **No está aplicado**: el
código sigue con Opus 5 por defecto, porque elegir el modelo es decidir el
precio y esa decisión no es del código.

### B · Cuota de páginas con visión dentro del plan

Incluir N páginas de visión al mes en Pro y cortar o cobrar el excedente. Hace
predecible el costo por cliente, que es lo que hoy no lo es. Requiere contar
páginas por usuario — hoy el motor no lleva esa cuenta.

### C · La visión como complemento medido, fuera de Pro

Pro incluye la conversión (Tesseract, costo marginal cero) y la relectura con
visión se cobra aparte por página. Es lo más honesto respecto del costo real y
lo que peor se vende: nadie quiere un precio variable.

### D · Dejarla apagada por defecto y que el usuario la pida

`VISION_FALLBACK=false` y un interruptor en la web, como el de OCR. El que no
la pide no la paga, y quien la enciende sabe que es la función cara. Se combina
bien con A.

**Recomendación:** A + D. El modelo barato baja el piso siete veces, y el
interruptor pone el gasto bajo control del que lo provoca. B se puede sumar
después, cuando haya clientes de verdad que contar.

## 6 · El detalle que no es de costeo pero salió de la misma prueba

La primera versión de la instrucción al modelo era la **pericial**: *"si un
fragmento es ilegible, escribe [ilegible]. No adivines"*. Gina la corrigió:

> *"ese ilegible no debería operar en convertidor, porque el que paga para
> convertir necesita que lea lo que más pueda o intente leerlo, mientras que en
> pericias no debe alterarlo"*

Son dos productos opuestos y estaban compartiendo una sola regla. `vision.py`
tiene ahora dos perfiles —`conversion` (el de defecto, lee todo lo que pueda) y
`pericial` (no completa nada, porque el texto puede acabar en un expediente
judicial)— y quien llama elige. La transcripción de Miraflores usó el perfil
correcto para su uso, que es el pericial.

---

## Cómo reproducir esto

```bash
# La tabla de costo por modelo
python scratchpad/ocr-lab/costo.py

# La prueba completa del expediente
python scratchpad/miraflores_vision.py <carpeta-de-salida>
```

Los umbrales y su justificación viven en el código, no acá:
`convertidor/conversion.py` (`UMBRAL_CONFIANZA`) y `convertidor/vision.py`
(modelo, perfiles y el porqué de cada uno).
