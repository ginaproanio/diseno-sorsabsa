# Modelo de trabajo de JustiRed

**Qué es este documento.** El modelo con el que trabajan las bibliotecas
legales serias —Lexis, vLex, Westlaw, el BOE, el estándar ELI— y, al lado de
cada pieza, **dónde está JustiRed de verdad**: si lo hacemos, si no lo hacemos,
si lo hacemos mal, o si lo hacemos mejor.

Está pensado como manual, así que la regla es una sola: **cada afirmación sobre
JustiRed va con su evidencia y su fecha.** Lo que no está medido se dice que no
está medido. Un manual que describe lo que uno quisiera tener no sirve para
trabajar.

Última verificación contra la base de producción: **19-ago-2026.**

---

## Cómo leer el estado

| Marca | Significa |
|---|---|
| ✅ | Hecho y verificado |
| ⚠️ | Existe pero está mal, o está a medias |
| ❌ | No existe |
| ⭐ | Hacemos algo que el modelo del sector no contempla, y hace falta |

### Resumen en una pantalla

| Pieza | Estado | En una línea |
|---|---|---|
| Fuente | ✅ | Catálogo `justired.fuentes` con clave foránea (19-ago) |
| Publicación / gaceta | ✅ | 5.906 inventariadas, 5.902 con original en R2 |
| **Acto** | ❌ | **No existe como entidad. Es el hueco central de todo el sistema** |
| Artículo | ⚠️ | 4.565 filas, pero cuelgan de la gaceta y están mal cortadas |
| Inventariar | ✅ | 26 años, 0 huecos de numeración |
| Adquirir | ✅ | Separado de procesar desde el 17-ago |
| Extraer | ⚠️ | Convierte bien; **tira el texto y hay que reconvertir** |
| Estructurar | ⚠️ | Corta artículos, no actos. Y los corta mal |
| Enriquecer | ⚠️ | Clasifica la gaceta, que es justo lo que el modelo prohíbe |
| Validar | ✅ | Mide forma del texto y estado del sistema |
| Curar | ⭐ | Mejor que el modelo: motivo, destino y procedencia |
| **Publicar** | ❌ | **No es compuerta. Los 82 están públicos sin aprobar** |
| Vigencia y relaciones | ❌ | Nada. Ni columna |

---

## 1. Las unidades de trabajo

```
Fuente
  └── Publicación / Contenedor (Gaceta, Registro Oficial, Boletín)
        └── Acto / Norma individual          ← unidad canónica
              └── Artículos / Disposiciones
```

| Nivel | Qué es | Ejemplo | Para qué sirve |
|---|---|---|---|
| **Fuente** | Origen institucional | Registro Oficial, Asamblea Nacional, Corte Constitucional | Inventario y permisos de rastreo |
| **Publicación** | El número o ejemplar publicado | R.O. Año II – Nº 340 | Autenticidad, PDF original, cita de publicación |
| **Acto** | La norma jurídica individual | Resolución SB-2026-2277 de la Superintendencia de Bancos | Búsqueda, filtro, consolidación y cita |
| **Artículo** | Fragmento interno del acto | Art. 5 de esa Resolución | Búsqueda fina y consolidación |

> **Regla de oro del sector.** El usuario trabaja y cita **el acto**. La gaceta
> es el **vehículo de publicación**. El artículo es la granularidad de lectura y
> de consolidación.

### Dónde está JustiRed

**Fuente — ✅ hecho el 19-ago-2026.** `justired.fuentes` declara cada fuente y
si su listado permite inventariar sin descargar (`tiene_etapa_1`). `leyes` e
`inventario` la referencian por clave foránea.

Nació de un defecto: la misma fuente estaba escrita `registroficial` (74 filas)
y `registroficial.gob.ec` (6). Cualquier `join` por (fuente, url) perdía esas 6,
y estuvieron 19 días fuera de todo sin que nada lo señalara. La lección quedó
escrita en la migración: **lo que se sabe y no se puede deducir, se declara.**

**Publicación — ✅.** Es lo que hoy vive en `justired.leyes` y en
`justired.inventario`. 5.906 publicaciones conocidas, 5.902 con su PDF original
archivado en R2.

> ⚠️ **Aviso de nomenclatura.** La tabla se llama `leyes` y **no contiene
> leyes**: contiene gacetas. El nombre es de cuando el modelo era otro y hoy
> engaña a quien lee el esquema. Renombrarla es parte de la migración al acto.

**Acto — ❌ no existe.** No hay tabla, ni columna, ni identificador. Es el hueco
del que cuelgan casi todos los demás problemas de este documento.

Lo que sí hay, desde el 19-ago-2026: `scraper/actos.py`, el cortador, con 26
pruebas en CI y un modo de medición (`medir-actos`) que corre sin publicar nada.
Escrito, probado y **sin conectar**.

#### Cuántos actos hay de verdad — medido, no estimado

El modelo del sector dice que «una gaceta de 80–120 páginas suele contener 20–40
actos independientes». **Eso no se cumple en Ecuador**, y conviene saberlo antes
de dimensionar nada.

Medición del 19-ago-2026 sobre los **64 sumarios reales** que tenemos guardados,
parseados con `scraper/sumario.py`:

| | |
|---|---|
| Actos declarados en total | 316 |
| Media por gaceta | **4,9** |
| Distribución | 3 a 7 (mediana 5); dos casos raros de 0 y 1 |
| Páginas por edición | 32 a 118, media 64 |
| **Entes emisores distintos** | **58** |
| Tipos de acto distintos | 4 (`RESOLUCIONES` 180, `ACUERDOS` 133, `EXTRACTOS` 1) |

O sea: ~13 páginas por acto. El Registro Oficial ecuatoriano publica **pocos
actos y largos**, no muchos y cortos como el BOE.

**Lo que eso cambia:**

- El corpus actual de 82 gacetas produciría **~400 actos**, no miles.
- El archivo completo de 5.906 gacetas produciría **~30.000 actos**.
- Los 58 entes emisores confirman que **el ente sí es una lista finita y
  cerrada**, que es lo que lo hace la señal de clasificación más fiable — y el
  contraste con los 2 valores que hoy guardamos mide exactamente lo que estamos
  perdiendo.

> ⚠️ **Defecto menor detectado al medir:** el tipo llega en singular y en plural
> sin normalizar (`ACUERDOS` 120 y `ACUERDO` 13 son el mismo tipo). Hay que
> normalizarlo antes de que sea un filtro de la biblioteca, o el usuario verá
> dos opciones para lo mismo.

**Artículo — ⚠️ existe y está mal.** Medido el 19-ago sobre 80 documentos:

| | |
|---|---|
| «Artículos» extraídos | 4.565 |
| De menos de 200 caracteres | 448 (10%) |
| De menos de 80 caracteres | 60 |
| El bloque más grande | **229.932 caracteres** |

Y el caso que lo explica: el **R.O. Nº 340** tiene 34 «artículos», entre ellos
`ARTÍCULO 6` **dos veces** y `ARTÍCULO 2` **dos veces**. No es un fallo de
extracción: cada acto reinicia su numeración en 1, y al meter cuatro actos en
una sola bolsa los números chocan. Uno de esos «artículos» mide 55.740
caracteres porque se comió todo lo que venía detrás.

> ❌ **`justired.articulos` no tiene columna de orden.** El orden de lectura de
> una norma depende hoy del `created_at` de la inserción. No es un detalle: un
> articulado desordenado no es un articulado.

---

## 2. Clasificaciones que importan

| Clasificación | Nivel | Ejemplo | ¿Obligatoria? |
|---|---|---|---|
| Tipo de norma | Acto | Ley, Decreto, Resolución, Acuerdo, Sentencia | Sí |
| Ente emisor | Acto | Asamblea Nacional, Superintendencia de Bancos | Sí |
| Materia / tema | Acto (multi-etiqueta) | Tributario, Civil, Administrativo, Ambiental | Sí |
| Estado de vigencia | Acto | Vigente, Derogada, Parcialmente derogada | Sí, con el tiempo |
| Fecha de publicación | Publicación + Acto | 2026-08-04 | Sí |
| Fecha de efecto | Acto | Puede diferir de la de publicación | Sí |
| Número / identificador oficial | Acto | Resolución 123-2026 | Sí |
| Relaciones | Acto | Reforma a, Deroga a, Reglamenta a | Sí, para consolidar |
| Jerarquía / rango | Acto | Constitucional, Legal, Reglamentario | Recomendable |

La materia casi nunca es una sola. Un acto puede ser «Tributario +
Administrativo». Una gaceta es **siempre** multi-materia, porque contiene muchos
actos.

### Dónde está JustiRed

| Clasificación | Estado | Evidencia (19-ago-2026) |
|---|---|---|
| Tipo de norma | ❌ | No existe a nivel de acto |
| Ente emisor | ⚠️ **inútil** | `leyes.ente_emisor` tiene **2 valores distintos en 82 documentos**: «Registro Oficial» (80) y «Asamblea Nacional del Ecuador» (2) |
| Materia | ⚠️ nivel equivocado | 81 de 82 clasificadas (99%), taxonomía cerrada de 14 términos + 26 siglas en `scraper/materia.py`, multi-etiqueta real. Pero **1,30 materias por gaceta** sobre 5 actos de media |
| Estado de vigencia | ❌ | Ni columna |
| Fecha de publicación | ✅ | En `leyes` y en `inventario` |
| Fecha de efecto | ❌ | Ni columna |
| Número / identificador | ⚠️ | `numero_ley` es el número de **gaceta**, no del acto |
| Relaciones | ❌ | Ni columna |
| Jerarquía / rango | ❌ | Ni columna |

**Lo que enseña la fila del ente emisor.** Dos valores distintos en 82
documentos significa que el campo **no filtra nada**. Y no está mal calculado:
está bien calculado sobre el objeto equivocado. El ente emisor de una gaceta
*es* el Registro Oficial; el dato que sirve —Superintendencia de Bancos,
Ministerio de Agricultura— pertenece al acto, que no existe.

**Lo que enseña la fila de la materia.** El clasificador está bien construido:
lista cerrada, umbral, tope de 3, y la mitad de sus pruebas comprueban que
vocabulario corriente («abogado», «normativa») **no** clasifique nada. Aun así,
1,30 materias sobre 5 actos independientes es una etiqueta forzada, y el caso que lo mostró
es el `Nº 340`: quedó como «Civil» porque una de sus normas la emite la
**Dirección General del Registro Civil** —el nombre de una institución, no una
materia—. Medido: el 43% de las menciones de «civil» en el corpus son nombres
de institución.

> **Conclusión del capítulo:** no hay que arreglar la clasificación. Hay que
> moverla de nivel. Clasificar la gaceta es, literalmente, el error que este
> modelo existe para evitar.

---

## 3. Cómo clasifican las empresas del sector

1. **Primero segmentan por acto**, no por gaceta.
2. Asignan **tipo** y **ente** con reglas muy fiables: están en el encabezado.
3. Asignan **materia** con:
   - taxonomía controlada (lista cerrada, no se inventan al vuelo);
   - señales fuertes: título del acto + sumario + tipo + ente;
   - el cuerpo del texto solo como refuerzo;
   - multi-etiqueta por defecto.
4. **Vigencia y relaciones** se construyen después, cuando el acto ya está
   identificado y se pueden detectar «reforma», «deroga», «sustitúyase».
5. **Humano solo** en los casos de baja confianza o conflicto.

No clasifican la gaceta entera para después adivinar. Clasifican el acto.

### Dónde está JustiRed

Los puntos 2, 3 y 5 están construidos; el 1 falta y el 4 no existe. Y sin el
punto 1, los otros trabajan sobre el objeto equivocado.

**Lo que ya está a favor, y es más de lo que parece.** El Registro Oficial
**publica el índice**: cada número abre con un SUMARIO que declara, acto por
acto, la función del Estado, el tipo, el ente emisor, el código, el título y
**la página de inicio**. Está en el 96% de las ediciones y ya lo parseamos
(`scraper/sumario.py`, 23 pruebas, fixture de la primera página real del
Nº 340). Hoy lo tenemos guardado en 64 de 82 documentos.

O sea: **la segmentación por acto ya viene hecha por el editor oficial.** El
sistema la estaba tirando porque el resumen se cortaba a 600 caracteres.

**Cómo se corta** (`scraper/actos.py`, 19-ago-2026). El cuerpo trae la frontera
escrita, en tres piezas que hacen cosas distintas:

- **el pie corrido** —`Martes 4 de agosto de 2026 / Registro Oficial Nº 340 / 12`—
  da la **página impresa**, que es a la que apunta el sumario. Después se quita:
  aparece también en medio de un acto, así que es mobiliario, no frontera;
- **el encabezado** en su propio renglón: `Resolución Nro. DIGERCIC-2026-0008-R`.
  En minúscula-título, no en mayúsculas —la primera versión de la expresión
  buscaba `RESOLUCIÓN No.` y encontraba uno donde hay dos—;
- **la confirmación**: `CONSIDERANDO`, `RESUELVE`, `ACUERDA`, `DECRETA`. Sin
  ella, una cita dentro de un considerando («mediante Resolución Nro.
  SB-2020-0119 de 3 de mayo…») abre un acto falso. **Esa es la causa de las 448
  piezas de menos de 200 caracteres**, y por eso la mitad de las pruebas del
  módulo son negativas: comprueban que una cita *no* corte.

---

## 4. El inventario

El inventario es una tabla de **lo que existe en la fuente**, no de lo que ya se
bajó. Es la diferencia entre «no hay nada nuevo» y «no estoy mirando donde
debería», que sin esta tabla son indistinguibles.

```
Fuente → Año → Mes / Número → URL → Estado
```

Estados típicos del sector: `conocido` · `descargado` · `extraído` ·
`estructurado` · `enriquecido` · `validado / observado` · `publicado`.

> **La pregunta que el inventario debe contestar en un segundo:**
> «De la fuente X, del año Y, ¿qué números me faltan?»

### Dónde está JustiRed — ✅, y con dos cosas de más

`justired.inventario`, 5.906 filas, 26 años recorridos. Contesta la pregunta:
`Inventario.huecos()` devuelve **0 huecos** de numeración hoy.

Su origen fue exactamente el problema que el inventario resuelve: la biblioteca
tenía 80 documentos, se esperaban más de 300, y **faltaban las ediciones Nº 277
y Nº 316–328 sin que nada lo señalara durante seis semanas.**

**Diferencia respecto del modelo:** nuestros estados de inventario son cuatro
—`conocido`, `adquirido`, `original_perdido`, `descartado`— y no siete. Los
otros tres (extraído, estructurado, enriquecido) no se inventaron como columnas
porque nadie los escribía todavía; el estado real se compone en la vista
`justired.documento_etapa`, que junta inventario y biblioteca en una fila por
documento. Es deliberado: **una columna de estado que nadie escribe es peor que
no tenerla**, porque parece que funciona.

⭐ **Dos cosas que el modelo del sector no contempla y hacen falta:**

**a) `original_perdido`.** «Adquirido» era una afirmación sin fecha: cierta el
día que se subió el archivo, y nadie volvía a mirar. Así se perdieron **17
originales durante 17 días** —`archivar()` devolvía la clave cuando solo había
copiado el PDF al disco efímero del runner— y ninguna tabla lo notaba. Ahora
hay un estado propio, distinto de `conocido`, porque volver a «nunca se trajo»
borraría la información de que **hubo un fallo**, que es justo lo que hay que
conservar.

**b) `original_verificado_en`.** Cuándo se comprobó por última vez que el objeto
sigue en R2. Se verifica antes de cada escaneo diario, y la corrida solo se pone
en rojo si se perdió alguno **nuevo**: una alarma que suena todos los días es
una alarma que se ignora.

---

## 5. El proceso completo

```
1. INVENTARIAR   Recorrer cada fuente y registrar qué publicaciones existen,
                 sin descargar todavía.

2. ADQUIRIR      Bajar el PDF original + hash + almacenamiento inmutable.
                 Esta etapa se puede correr sola durante días o semanas.

3. EXTRAER       PDF → texto (OCR solo si hace falta). El texto queda inmutable.

4. ESTRUCTURAR   a) Cortar la publicación en ACTOS
                 b) Dentro de cada acto, cortar en ARTÍCULOS

5. ENRIQUECER    Por acto: tipo, ente, número, fechas, materias, relaciones.

6. VALIDAR       Reglas automáticas → válido u observado.

7. CURAR         Humano, solo lo observado. Nunca el 100%.

8. PUBLICAR      Solo lo validado. Publicar es una COMPUERTA,
                 no un efecto secundario del procesamiento.
```

### Dónde está JustiRed, etapa por etapa

#### 1. Inventariar — ✅
Modo `inventariar` del workflow. No descarga: lee las fichas del listado, así
que cubre años enteros en minutos y permite **dimensionar el trabajo antes de
hacerlo**. 5.906 publicaciones.

#### 2. Adquirir — ✅ separado el 17-ago-2026
Modo `adquirir`. Es la separación que el modelo señala entre paréntesis y que
resultó ser estructural, porque las dos etapas tienen **urgencias opuestas**:

- adquirir es lento, caro y depende de un tercero que puede caerse o
  reorganizar su archivo — **lo que no se baje hoy puede no estar mañana**;
- procesar es barato y repetible sobre un original inmutable — de hecho ya se
  rehízo tres veces en un día.

Resultado: 26 años de originales archivados en una corrida de 4 h 33 min
(5.892 objetos, 20,8 GB), sin generar de paso miles de documentos mal
segmentados. Hoy: **5.822 esperando proceso**, a propósito.

#### 3. Extraer — ⚠️ convierte bien y tira el texto
El Convertidor 1.3.0 (Railway) decide solo si hace falta OCR midiendo la
proporción de caracteres ilegibles. Funciona: los 6 documentos que estaban
ilegibles pasaron a **0,00%** al reprocesarlos.

> ❌ **Pero el texto extraído no se guarda en ningún lado.** No hay columna de
> markdown en `leyes`. Solo sobrevive el resultado ya segmentado. El modelo dice
> «el texto queda inmutable» y nosotros lo descartamos.
>
> Consecuencia práctica, encontrada el 19-ago al escribir `medir_actos.py`: para
> medir el corte por acto hay que **bajar el original de R2 y reconvertirlo**,
> porque el segmentador actual tira todo lo anterior al primer «ARTÍCULO» —la
> portada, el sumario, y el encabezado y los considerandos del primer acto—.
> Cada experimento sobre el texto cuesta una reconversión completa.

#### 4. Estructurar — ⚠️ mitad hecha, mitad mal
- **a) Cortar en actos: ❌.** El módulo existe y está probado; no está conectado.
- **b) Cortar en artículos: ⚠️.** Se hace, y mal, por la razón del capítulo 1:
  corta artículos de una gaceta que contiene 5 normas distintas de media.

#### 5. Enriquecer — ⚠️ en el nivel equivocado
Ver capítulo 2. Materia sí (99%, bien construida), tipo y ente no, fechas de
efecto no, relaciones no.

#### 6. Validar — ✅ y creciendo
Dos capas, las dos verificables en pantalla:

**Forma del texto** (`justired.calidad_documentos`): artículos, caracteres,
densidad por página, dominancia del bloque mayor y proporción de caracteres
ilegibles —esta última una columna generada, calculada en la base—. El panel las
ordena por gravedad. Hoy: 13 de 82 con defectos graves.

**Estado del sistema** (`justired.estado_del_sistema`, 19-ago): una fila por
etapa, contadas en la base, **como partición que suma el total**. Los números
sueltos que se solapan no se pueden verificar; una partición sí — si no cuadra,
es un defecto que se ve.

Junto a las etapas van **diagnósticos** que no suman al total y solo aparecen
cuando hay algo: «inventariado sin unir a su texto», «procesado sin inventario»,
«adquirido sin anotar dónde». La regla es explícita: *una alerta que siempre
suena no es una alerta.*

> **Lo que todavía NO valida:** «¿tiene tipo y ente?» (no existen), y los huecos
> de numeración se calculan pero **nadie recibe un aviso** cuando aparecen.

#### 7. Curar — ⭐ mejor que el modelo
El panel `/calidad` es la pantalla de curación, y tiene tres cosas que el modelo
del sector no menciona y que resultaron indispensables:

**a) Rechazar exige motivo, y el motivo decide el destino.** Antes «rechazar»
significaba dos cosas opuestas: una `AGENDA PARLAMENTARIA` no es una norma y hay
que descartarla; el `Nº 302` sí es una norma capturada mal y hay que
recuperarla. Las dos terminaban en el mismo silencio. Hoy los cinco motivos
viven en una tabla (`justired.motivos_rechazo`) que declara si el documento se
descarta, si se puede reprocesar tal como está el sistema hoy, si hay que forzar
OCR y si hay que volver a descargar. La leen el panel, el reproceso y una clave
foránea: **una sola verdad**.

Lo que enseña ese catálogo es la distinción entre «hay algo que hacer» y «hay
algo que esperar»: `mal_segmentado` **no** es reprocesable, porque el segmentador
es el mismo y devolvería lo mismo. *Una cola que gira sin avanzar parece
trabajo.*

**b) Corregir a mano, y que la corrección sobreviva.** El modelo dice «humano
solo en baja confianza» y no dice qué pasa con ese trabajo en el siguiente
reproceso — que es donde se pierde. `leyes.campos_corregidos` guarda **quién**
puso cada dato y **cuándo**, y la regla del reproceso tiene tres escalones:

1. un valor vacío nunca pisa uno que ya existe;
2. un valor calculado nunca pisa uno corregido a mano;
3. una persona puede volver a corregir cuando quiera.

**Qué no se puede editar, y no es una omisión:** el texto de los artículos. Se
deriva del original inmutable; editarlo rompe la reproducibilidad y abre la
puerta a que la biblioteca diga algo que el Registro Oficial no dice.

**c) Solo se envía lo que cambió.** Marcar como «corregido a mano» un campo que
nadie tocó lo congelaría frente a cualquier mejora futura del proceso
automático. Esa cautela evitó un daño real: durante un día el formulario mostró
vacíos el número y la fecha —la vista no los exponía— y reescribirlos los habría
congelado en 80 documentos.

#### 8. Publicar — ❌ no es compuerta
**Los 82 documentos de la biblioteca están públicos y ninguno está aprobado.**
Los 82 figuran en estado `pendiente`.

Es una decisión consciente del 15-ago-2026 —«lo rechazado desaparece; lo
pendiente sigue visible mientras se revisa»— tomada para que «Rechazar» ganara
efecto real sin vaciar la biblioteca de 80 a 0. Y funciona como paso
intermedio.

Pero hay que decirlo con todas las letras: **hoy publicar es un efecto
secundario del procesamiento, exactamente lo que el modelo dice que no debe
ser.** Cerrar la compuerta solo es viable cuando exista un flujo de curación que
no deje la biblioteca vacía; es decir, después del acto.

---

## 6. Cómo se manejan varias fuentes

Cada fuente tiene su propio conector de inventario y adquisición:

| Fuente | Qué produce | Particularidad | En JustiRed |
|---|---|---|---|
| Registro Oficial | Publicaciones numeradas con muchos actos | Multi-acto por número | ✅ inventario + adquisición + proceso |
| Asamblea Nacional | Leyes, códigos, agendas | Suele ser un acto por documento | ⚠️ 2 documentos; **sin etapa 1** y no puede tenerla: su listado no declara ficha |
| Corte Constitucional | Sentencias | Unidad = sentencia | ❌ no conectada |
| Otras (SRI, superintendencias) | Resoluciones, circulares | Variable | ❌ no conectadas |

Todas terminan en el mismo modelo —`Publicación → Acto → Artículos`— con los
mismos campos de clasificación. Así el buscador y los filtros funcionan igual
sin importar de dónde vino el documento.

**Cómo lo declara JustiRed.** `justired.fuentes.tiene_etapa_1` dice si la fuente
se puede inventariar sin descargar. Que la Asamblea no lo permita **no es un
defecto y está escrito como tal**: sus documentos legítimamente no tienen fila
de inventario, y las alertas del panel los excluyen por catálogo.

Esa distinción hay que declararla, no deducirla. Cuando estuvo deducida
—«fuentes que aparecen en el inventario»— una fuente mal escrita se coló por la
misma puerta y tapó 6 documentos rotos durante 19 días.

---

## 7. Cómo se le da materia al archivo

1. Se clasifica **el acto**, no la gaceta.
2. Lista **controlada** de materias; no se inventan al vuelo.
3. Se priorizan **señales fuertes**: título + tipo + ente.
4. Se acepta **multi-materia**.
5. Si la confianza es baja → sin materia o a revisión. **Nunca se fuerza una
   etiqueta dudosa.**
6. El recálculo se puede hacer siempre, porque el texto original es inmutable.

### Dónde está JustiRed

| Punto | Estado |
|---|---|
| 1. Clasificar el acto | ❌ clasifica la gaceta |
| 2. Lista controlada | ✅ 14 términos + 26 siglas, cerrada, en `scraper/materia.py` |
| 3. Señales fuertes | ⚠️ usa título y cuerpo; **falta tipo y ente**, que no existen |
| 4. Multi-materia | ✅ `leyes.materias[]`, tope de 3 |
| 5. No forzar | ✅ hay umbral, y quien no llega queda sin materia |
| 6. Recálculo siempre | ✅ el original está en R2 y se recalculó tres veces en un día |

**Por qué una materia falsa es peor que ninguna:** es un filtro que **esconde**
el documento de quien lo busca. Por eso la mitad de las pruebas del clasificador
comprueban que vocabulario corriente no clasifique nada.

Cuando el acto exista, el punto 3 mejora solo: el ente emisor es una lista
finita y cerrada —**58 entes distintos**, medidos sobre los 64 sumarios que
tenemos guardados— y casar contra una lista es
mucho más fiable que puntuar palabras del cuerpo, que es la señal más ruidosa
que hay.

---

## 8. Visión final de la biblioteca

El usuario debería poder:

| Capacidad | Estado |
|---|---|
| Buscar por texto libre | ⚠️ busca por título, no por contenido |
| Filtrar por tipo de norma | ❌ el tipo no existe |
| Filtrar por ente emisor | ❌ el campo existe con 2 valores: no filtra nada |
| Filtrar por materia | ⚠️ funciona, pero sobre la gaceta |
| Filtrar por rango de fechas | ⚠️ el dato está; el filtro no |
| Ver el acto completo + sus artículos | ❌ no hay actos |
| Ver en qué gaceta se publicó, y el PDF original | ✅ el original está en R2, íntegro |
| Versión consolidada e historial de reformas | ❌ requiere relaciones y vigencia |

Nada de esto es alcanzable mientras la unidad canónica sea la gaceta. **No es
que falten funciones de búsqueda: falta el objeto sobre el que buscar.**

---

## 9. Orden de construcción

### Hecho

| # | Qué | Cuándo |
|---|---|---|
| 1 | Separar adquirir de procesar | 17-ago-2026 |
| 2 | Inventario + barrido histórico solo-adquisición (26 años) | 16–18-ago-2026 |
| 3 | Curación real: motivo, destino y procedencia | 17–19-ago-2026 |
| 4 | Catálogo de fuentes con clave foránea | 19-ago-2026 |
| 5 | Tablero de estado del sistema como partición | 19-ago-2026 |
| 6 | Cortador por acto: módulo + pruebas + modo de medición | 19-ago-2026 |

### Siguiente

| # | Qué | Por qué en este orden |
|---|---|---|
| 7 | **Medir** el corte por acto sobre los 82 reales, sin publicar | El sumario predice ~400 actos; hay que ver cuántos encuentra el cortador y con qué calidad |
| 8 | Tabla `actos` + gaceta como contenedor (`publicado_en`, páginas) | La unidad canónica |
| 9 | Guardar el texto extraído | Hoy cada experimento cuesta una reconversión |
| 10 | Artículos colgando del acto, **con orden** | Un articulado desordenado no es un articulado |
| 11 | Tipo y ente por acto contra lista controlada | Desbloquea el buscador y mejora la materia |
| 12 | Mover la materia al acto | Sale casi gratis con el 11 |
| 13 | Migrar biblioteca y buscador al acto | Recién acá cambia la cara pública |
| 14 | Publicar como compuerta | Viable cuando la curación no vacíe la biblioteca |
| 15 | Vigencia y relaciones | Requiere el acto identificado |
| 16 | Avisos cuando una validación encuentra algo | Hoy nadie se entera |

---

## 10. Reglas de trabajo que salieron de los defectos

No son teoría: cada una nació de algo que se rompió y costó tiempo.

1. **Un script sin modo en un workflow es un script que no se puede ejecutar.**
   `reparar_inventario.py` vivió dos días en el repo sin que nada lo llamara —y
   además roto—; `Inventario.marcar_adquirido()` existió meses sin que nadie la
   invocara mientras el inventario informaba «152 pendientes» sobre 78 ya
   publicados.

2. **Lo que se sabe y no se puede deducir, se declara.** Deducir «esta fuente no
   se inventaría» de los datos parecía más robusto que escribirlo. Un error de
   tipeo se disfrazó de fuente nueva y la deducción lo bendijo.

3. **Una alerta que siempre suena no es una alerta.** Y su reverso: una etapa en
   cero **sí** se muestra, porque «para reprocesar: 0» es información y una fila
   que falta se lee como que la etapa no existe.

4. **Fallar cerrado se aplica a la acción que depende de la pieza rota, no a la
   pantalla que la contiene.** Faltó un catálogo y el panel entero apareció en
   cero, cuando solo «rechazar» lo necesitaba.

5. **Una prueba que solo mira los casos buenos no prueba nada.** `test_r2.py`
   pasaba en verde mientras 17 originales se perdían. Por eso la mitad de las
   pruebas del cortador y del clasificador son **negativas**.

6. **Un número sin documentos detrás solo se puede creer.** Toda cifra del
   panel tiene que poder abrirse y mostrar sus filas.

7. **La base ejecuta, el repo explica.** El SQL se guarda siempre en
   `supabase/migrations/` con su fecha y su porqué, aunque se aplique por otra
   vía.

---

## Fuentes de este documento

| Qué | Dónde |
|---|---|
| Infraestructura, despliegues, herramientas de sesión | `diseno-sorsabsa/docs/ARQUITECTURA-ECOSISTEMA.md` |
| Regla de desarrollo: auditar si la solución es un parche | `diseno-sorsabsa/docs/ESTANDAR-DESARROLLO.md` |
| Etapas de la ingesta | `legaltech/docs/arquitectura-ingesta.md` |
| Biblioteca legal y sus fallos históricos | `legaltech/docs/biblioteca-legal.md` |
| Cortador por acto | `legaltech/scraper/actos.py` · `test_actos.py` |
| Sumario del Registro Oficial | `legaltech/scraper/sumario.py` · `test_sumario.py` |
| Clasificador de materia | `legaltech/scraper/materia.py` · `test_materia.py` |
| Inventario | `legaltech/scraper/inventario.py` · `test_inventario.py` |
| Esquema y decisiones de base | `legaltech/supabase/migrations/` |

Las cifras de este documento se midieron contra la base de producción el
**19-ago-2026**. Antes de repetirlas en otro sitio, conviene volver a medirlas:
un número copiado envejece y nadie lo actualiza.
