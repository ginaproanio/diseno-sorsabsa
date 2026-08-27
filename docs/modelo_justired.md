# Modelo de trabajo de JustiRed

**Qué es este documento y para qué sirve.** Es el **manual de dirección del
proyecto**: describe cómo se toma el dato, cómo se digitaliza, cómo se convierte
y cómo se trabaja, de manera que alguien que no escribió el código pueda juzgar
si el procedimiento es defendible.

Tiene dos capas superpuestas, y esa es su utilidad:

1. **El modelo del sector** — cómo resuelven este problema las bibliotecas
   legales establecidas (Lexis, vLex, Westlaw, el BOE, el estándar ELI). Es el
   marco de referencia.
2. **Dónde está JustiRed de verdad**, pieza por pieza: si lo hacemos, si no lo
   hacemos, si lo hacemos mal, o si lo hacemos mejor.

**La regla del documento es una sola: cada afirmación sobre JustiRed va con su
evidencia y su fecha.** Lo que no está medido se dice que no está medido, y lo
que está mal se dice que está mal — incluidos los defectos introducidos por
quien escribe. Un manual que describe lo que uno quisiera tener no sirve ni para
dirigir el trabajo ni para sostenerlo ante nadie.

**Por dónde entrar, según qué se busque:**

| Si busca… | Vaya a |
|---|---|
| El marco conceptual y la unidad de análisis | §1 y §2 |
| **El procedimiento: cómo se obtiene, se digitaliza y se convierte el dato** | **§5-bis** |
| Qué se conserva y qué se pierde en la conversión | §5-bis D |
| Reproducibilidad y auditabilidad | §5-bis E |
| Consideraciones legales y éticas | §5-bis F |
| El estado real del sistema, con cifras | «Resumen en una pantalla», abajo |
| Qué falta y en qué orden | §9 |
| **Qué se tira, y cuándo** | **§9-bis** |

Última verificación contra la base de producción: **19-ago-2026**, con una
remedición parcial el **26-ago-2026** (cifras abajo).

> **Remedición del 26-ago-2026.** Las cifras del cuerpo del documento son del
> 19-ago y **la mayoría siguen siendo ciertas**. Cambiaron tres, y ninguna
> cambia una conclusión:
>
> | | 19-ago | 26-ago |
> |---|---|---|
> | Gacetas procesadas | 82 | **87** |
> | Artículos | 4.565 | **4.781** |
> | Esperando proceso | 5.822 | 5.822 |
> | Publicados (aprobados por una persona) | 0 | **0** |
>
> Y aparecieron dos cifras que este documento no tenía porque nunca las había
> preguntado: **0 abogados, 0 clientes y 0 solicitudes**. La cañería avanza; el
> lado del producto sigue en cero, que es el dato que manda sobre el orden de
> §9 y que está desarrollado en `legaltech/docs/mesa-de-trabajo-del-abogado.md`.

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
| Extraer | ✅ | Convierte y **guarda el texto** (19-ago). Falta llenarlo hacia atrás: 5.906 sin markdown |
| Estructurar | ⚠️ | Corta artículos, no actos. Y los corta mal |
| Enriquecer | ⚠️ | Clasifica la gaceta, que es justo lo que el modelo prohíbe |
| Validar | ✅ | Mide forma del texto y estado del sistema |
| Curar | ⭐ | Mejor que el modelo: motivo, destino y procedencia |
| **Publicar** | ❌ | **No es compuerta. Los 87 están públicos sin aprobar** |
| Vigencia y relaciones | ❌ | Nada. Ni columna |
| **Llegar al panel** | ✅ | **Corregido el 26-ago. Ver §10.8: durante semanas `/calidad` no tuvo un solo enlace** |
| Cobertura a la vista | ✅ | La biblioteca dice «87 de 5.913» desde el 26-ago (§8) |

---

## 1. Las unidades de trabajo

```text
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

```text
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

#### 3. Extraer — ✅ desde el 19-ago-2026
El Convertidor 1.3.0 (Railway) decide solo si hace falta OCR midiendo la
proporción de caracteres ilegibles. Funciona: los 6 documentos que estaban
ilegibles pasaron a **0,00%** al reprocesarlos. El detalle del procedimiento y
de la calibración está en §5-bis C.

**Hasta esa fecha el texto se usaba y se tiraba.** No había dónde guardarlo, así
que solo sobrevivía el resultado ya segmentado — y el modelo del sector dice, con
razón, que «el texto queda inmutable».

Lo encontró un trabajo concreto: para medir el corte por acto había que **bajar
el original de R2 y reconvertirlo**, porque el segmentador viejo descarta todo lo
anterior al primer «ARTÍCULO» —la portada, el sumario, y el encabezado y los
considerandos del primer acto—. Cada experimento sobre el texto costaba una
reconversión completa: ~13 s por documento, **~21 h el archivo entero**.

Ahora el markdown se archiva en `texto/AAAA/NOMBRE.md` junto a la versión del
motor que lo produjo, y hay un modo (`extraer`) que ejecuta esta etapa **sola**,
sin estructurar ni publicar.

> ⚠️ **Falta llenarlo hacia atrás.** Los 5.906 originales ya archivados todavía
> no tienen su texto guardado. `justired.pendiente_de_extraer` los cuenta.

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

## 5-bis. El procedimiento técnico, paso a paso

Esta sección responde a la pregunta que hace un director de tesis: **de dónde
sale el dato, cómo se toma, en qué se convierte, qué se conserva y qué se
pierde.** Cada decisión va con el criterio que la justifica y con la medición
que la respalda, porque un procedimiento que no se puede auditar tampoco se
puede defender.

### El recorrido, con sus artefactos

```text
FUENTE (registroficial.gob.ec)
   │  listado navegable por año y mes; cada ficha declara
   │  número, fecha, páginas y URL del PDF
   ▼
[1] INVENTARIAR ─────────► justired.inventario     (una fila por documento que EXISTE)
   │                        no descarga nada
   ▼
[2] ADQUIRIR ────────────► R2: registros-oficiales/2026/RO_No_340.pdf
   │                        + SHA-256          ORIGINAL INMUTABLE, nunca se borra
   ▼
[3] EXTRAER ─────────────► R2: texto/2026/RO_No_340.md
   │  api.convertidor.sorsabsa.com               TEXTO, derivado y recalculable
   ▼
[4..8] ESTRUCTURAR, ENRIQUECER, VALIDAR, CURAR, PUBLICAR
       trabajan SOLO sobre el markdown. El PDF no se vuelve a abrir.
```

Las tres primeras etapas se ejecutan **por separado**, cada una con su propia
entrada en el flujo de trabajo automatizado. No es una comodidad: adquirir
depende de un tercero que puede caerse o reorganizar su archivo, y procesar es
barato y repetible sobre un original que ya está en casa. Atarlas obligaría a
hacer las dos o ninguna.

### A. Delimitación del corpus — etapa 1

**Universo.** El Registro Oficial del Ecuador publica un archivo navegable por
año y mes. Cada ficha del listado declara, **sin descargar el PDF**, el número
de edición, la fecha, el total de páginas y la URL del documento.

**Procedimiento.** Se recorre el árbol y se registra una fila por documento que
existe. Recorrer 26 años cuesta minutos; descargarlos cuesta horas. Esa asimetría
es la que permite **dimensionar el corpus antes de constituirlo**.

**Estado actual (19-ago-2026):** 5.906 documentos inventariados, 26 años,
**0 huecos** en la numeración.

**Por qué importa metodológicamente.** Sin una lista de lo que existe, «no hay
nada nuevo» y «no estoy mirando donde debería» son indistinguibles. En este
proyecto lo fueron durante seis semanas: faltaban las ediciones Nº 277 y
Nº 316–328 y nada lo señalaba. La completitud del corpus **se comprueba, no se
supone**.

**Rastreo responsable.** El recorrido respeta `robots.txt` —comprobado en cada
petición, no de palabra—, aplica un tope de tasa con pausas irregulares
(*jitter*) para no imponer carga a la fuente, y guarda su progreso para poder
reanudar. `registroficial.gob.ec/robots.txt` permite todo salvo `/wp-admin/`.

### B. Adquisición y garantía de autenticidad — etapa 2

Se descarga el PDF, se calcula su **SHA-256** y se archiva en almacenamiento de
objetos (Cloudflare R2) bajo una ruta estable: `registros-oficiales/AAAA/RO_No_XXX.pdf`.

Tres propiedades, y las tres son metodológicas antes que técnicas:

1. **El original nunca se borra ni se modifica.** Es la prueba de autenticidad y
   la fuente de la verdad de todo lo demás.
2. **La huella permite identificar el documento por su contenido**, no por su
   URL — que es lo que detecta que dos direcciones distintas sirven el mismo
   archivo.
3. **Tener el original se verifica con fecha.** «Archivado» era una afirmación
   sin fecha —cierta el día que se subió, y nadie volvía a mirar— y así se
   perdieron 17 originales durante 17 días sin que nada lo notara. Hoy se
   comprueba antes de cada escaneo y la pérdida vuelve a ser cola de trabajo.

**Estado actual:** 5.902 originales archivados (20,8 GB), verificados.

### C. Extracción de texto — etapa 3

**Un solo servicio, y no es código de este proyecto.** La conversión la hace el
**Convertidor** (`api.convertidor.sorsabsa.com`), un servicio propio del
ecosistema desplegado en Railway, que es el mismo motor que usa la aplicación
web `convertidor.sorsabsa.com`. El scraper **no tiene una sola línea de análisis
de PDF**: se lo pide por HTTP. No hay dos implementaciones que puedan divergir.

**Todo documento pasa por el mismo camino**, tenga o no capa de texto. No existe
una vía alterna: el Convertidor recibe el PDF y decide **internamente** qué hacer.

**La decisión, en tres pasos:**

1. Abre el PDF y extrae la capa de texto que el archivo ya trae (PyMuPDF,
   `get_text("text")`), página por página.
2. **Evalúa si esa capa es confiable.** Tres motivos la descartan:

| Motivo | Criterio | Qué significa |
|---|---|---|
| `poco_texto` | menos de 100 caracteres | el PDF es una imagen escaneada |
| `texto_ilegible` | **> 0,5%** de caracteres en `U+0100–U+024F` | el PDF trae capa de texto y está rota |
| `forzado` | lo pidió una persona | un revisor vio algo que la medición no ve |

**Y el tercer paso:** si hay motivo, **descarta lo extraído** y relee el
documento entero por imagen con OCR (Tesseract). Si aun así el resultado tiene
menos de 50 caracteres, responde con error en vez de entregar un texto de
disculpa que el consumidor guardaría como si fuera el documento.

**Calibración del umbral — esto es lo que lo hace defendible.** No es una
intuición: se midió sobre 78 documentos reales.

| | |
|---|---|
| Documentos sanos | 0,0% – 0,1% de caracteres en ese rango |
| Documentos con la capa rota | 1,7% o más |
| Zona gris | **ninguna** — por eso el umbral puede ir en el medio |
| Afectados en el corpus | 6 de 78 |

**El fenómeno.** Ocurre cuando la fuente tipográfica viene incrustada sin su
tabla `ToUnicode`: el extractor emite los códigos internos de la fuente en vez
de las letras.

```text
ƌƵŝĚĂĐŽŶůĂƉĂƌƚŝĐŝƉĂĐŝſŶĚĞƚŽĚĂƐ      ← lo que devolvía
...truida con la participación de todas     ← lo que dice el papel
```

No es OCR fallando —eso da palabras borrosas, no una sustitución sistemática— y
no hay tabla de conversión posible, porque cada PDF trae su propia codificación
arbitraria. La única salida es releer por imagen. El rango elegido **excluye
deliberadamente** las tildes del español (`U+00C0–U+00FF`) y la tipografía
habitual de un PDF (comillas `U+2018/2019`, rayas `U+2013/2014`, puntos
suspensivos `U+2026`), para que un documento correcto en español nunca dispare
la regla.

**Resultado comprobado sobre los 6 documentos reales:** forzando OCR, el texto
ilegible pasó a **0,00%** en los seis, sin perder contenido, y con **más
artículos detectados en todos (hasta +83%)** — porque el texto roto también
escondía las marcas «Artículo N» de cualquier segmentador.

**La salida es siempre la misma.** Con OCR o sin OCR, el Convertidor devuelve
markdown con un encabezado por página. Cuando pasó por OCR el encabezado lo dice
—`## Página 12 (OCR-Tesseract)` en vez de `# Página 12`—, así que el propio
texto declara cómo se obtuvo. **Ninguna etapa posterior sabe ni necesita saber
cuál de los dos caminos se usó.**

**Desde el 19-ago-2026 ese texto se conserva** en `texto/AAAA/NOMBRE.md`, junto
con la versión del motor que lo produjo. Antes se usaba y se descartaba, y cada
experimento sobre el texto obligaba a reconvertir: ~13 s por documento, ~21 h
para el archivo completo.

### D. Qué conserva y qué pierde la conversión

Declararlo es parte del método: **lo que el texto no trae no se puede analizar,
y hay que decirlo antes de que alguien lo eche de menos.**

**Se conserva:**

| | |
|---|---|
| El contenido literal | íntegro, en orden de lectura |
| La división en páginas | `# Página N`, que permite ubicar cada acto en su página impresa |
| Los encabezados y pies corridos | la fecha y el número de edición de cada página |
| La procedencia | si hubo OCR y por qué motivo |

**Se pierde:**

| | Consecuencia |
|---|---|
| Justificación y alineación | el texto sale sin justificar y sin centrar. Es la razón de que un documento se vea como una tira larga en la pantalla: **no es un defecto de la biblioteca, es lo que la conversión devuelve** |
| Columnas | el texto se aplana a una sola columna en orden de lectura |
| Negritas, cursivas, tamaños | no sobreviven a `get_text("text")` |
| Tablas | se aplanan a líneas de texto; **no se extraen como estructura** |
| Imágenes, sellos, firmas gráficas | no se conservan en el texto |

**Dónde queda lo perdido.** En el PDF original, que sigue íntegro en R2 y es la
versión fidedigna. La biblioteca puede —y debe— ofrecerlo junto al texto: **el
texto sirve para buscar, citar y analizar; el PDF, para acreditar.** Es el mismo
reparto que hacen los repositorios legales serios.

> ⚠️ **Anomalía detectada al escribir esto (19-ago-2026):** la columna
> `justired.leyes.tablas` **no contiene tablas**. Guarda una copia truncada de
> los primeros 50 artículos (500 caracteres cada uno), es decir un duplicado
> parcial de `justired.articulos` con un nombre que engaña. No se usa para nada
> y hay que retirarla en la migración al acto.

### E. Reproducibilidad

Es la propiedad que sostiene todo lo demás, y conviene enunciarla como tal:

> **Original inmutable + versión del motor + código versionado = cualquier
> derivado se puede volver a calcular.**

En concreto: el texto, la segmentación, la clasificación por materia y el resumen
se han recalculado varias veces —tres en un solo día— **sin volver a pedirle
nada a la fuente**. Esto tiene dos consecuencias metodológicas:

1. **Un error en una etapa derivada no destruye datos.** Se corrige la regla y
   se recalcula. Lo único irrecuperable sería perder el original, y por eso es
   lo único que se protege con verificación fechada.
2. **Los resultados son auditables.** Cualquiera con el original y la versión
   del motor obtiene el mismo texto, porque la conversión es determinista.

Guardar la **versión del motor** junto al texto es lo que permite saber qué hay
que reconvertir cuando el motor mejora: sin ese dato, «tengo el texto» no dice
si está al día.

### F. Consideraciones legales y éticas

| | |
|---|---|
| Naturaleza del material | documentos oficiales de publicación obligatoria, de dominio público |
| Datos personales | los que el propio Registro Oficial publica; no se agregan ni se cruzan con otras fuentes |
| Carga sobre la fuente | tope de tasa, pausas irregulares y `robots.txt` respetado en cada petición |
| Almacenamiento | cubo público para documentos oficiales; los materiales sensibles de otros productos del ecosistema viven en un cubo distinto y privado |
| Integridad | el original se conserva sin modificar, con su huella criptográfica |

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
| **Saber si lo que NO encontró falta o no existe** | ✅ desde el 26-ago: la biblioteca dice «87 de 5.913» y cuántos esperan proceso |

> **Por qué esa última fila importa más de lo que parece.** Las siete de arriba
> son funciones que faltan; esa es una **afirmación implícita que el producto
> estaba haciendo sin querer**. Una biblioteca que muestra 87 documentos y no
> dice nada más está diciendo «esto es el Registro Oficial». Con el 1,5 % de
> cobertura, eso es falso, y el que lo descubre es un abogado que buscó una
> norma, no la encontró, y ya decidió que la herramienta no sirve.

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

## 9-bis. Deuda a retirar

Migrar al acto **no es rehacer el sistema**: de seis bloques, cuatro no se
tocan, uno crece y uno se rehace. Pero lo que se reemplaza hay que borrarlo, y
esta lista existe porque si no se escribe, no se borra nunca.

`ESTANDAR-DESARROLLO.md` pregunta, antes de cada cambio: *«¿qué código existente
debería ELIMINARSE como consecuencia de esta solución?»*. **Esta sección es
donde vive esa respuesta para JustiRed.** Contestarla en una conversación no
sirve: la conversación se termina y el código se queda.

> **Nada de esto está borrado todavía, y es deliberado.** El segmentador viejo
> es lo único que produce el corpus actual de 82 documentos, que es el corpus de
> prueba. Retirarlo antes de que exista la tabla `actos` dejaría el sistema sin
> nada que mirar. El orden es: construir el reemplazo → medirlo → migrar →
> borrar.

| Qué se retira | Por qué | Se borra cuando |
|---|---|---|
| `scraper.py: _segmentar_articulos()` y `_RE_ARTICULO` | Lo reemplaza `scraper/actos.py`. Corta artículos de una gaceta que contiene 5 normas distintas, y por eso el `Nº 340` tiene `ARTÍCULO 6` dos veces | exista la tabla `actos` y la migración esté hecha |
| `scraper/test_segmentacion.py` | Prueba el segmentador que se va. Su reemplazo es `test_actos.py` | con lo anterior, **en el mismo commit** |
| `justired.leyes.tablas` (jsonb) | **No contiene tablas.** Guarda una copia truncada de los primeros 50 artículos (500 caracteres cada uno): un duplicado parcial de `justired.articulos` con un nombre que engaña. No lo consume nadie | con la migración al acto |
| `justired.leyes.ente_emisor` y `.categoria` | 2 valores distintos en 82 documentos: es la FUENTE, no el ente que emitió nada. El dato útil —58 entes distintos— pertenece al acto | exista `actos.ente` |
| Renombrar `justired.leyes` → `gacetas` | La tabla no contiene leyes: contiene gacetas. El nombre es de cuando el modelo era otro y hoy engaña a quien lee el esquema | con la migración |
| `leyes.materia` / `.materias[]` a nivel de gaceta | Se mueven al acto. 1,30 materias forzadas sobre 5 normas independientes | exista `actos.materias` |

**Lo que NO se retira, y conviene decirlo para que nadie lo toque:** el
inventario, la adquisición y el archivo en R2, el Convertidor y su decisión de
OCR, el parser del sumario, el panel de calidad con sus motivos y su
procedencia, el catálogo de fuentes y el tablero de estado. Todo eso es
independiente del nivel al que se corte y sigue igual después de la migración.

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

   > ⚠️ **Incumplida y corregida el 26-ago-2026, del lado de las funciones.**
   > Tres Edge Functions —`justired-cuenta`, `justired-solicitudes` y
   > `justired-registro`— corrían en producción **sin una sola línea en el
   > repo**: se habían creado directamente contra Supabase. Son justo las tres
   > que deciden quién entra a qué. Rescatadas a
   > `legaltech/supabase/functions/`, con su porqué en el README de esa carpeta.
   > La regla valía para el SQL desde el 19-ago y nadie la había extendido al
   > código que corre al lado.

8. **Una pantalla sin enlace es una pantalla que no existe.** Es la regla 1 de
   arriba —«un script sin modo es un script que no se puede ejecutar»— aplicada
   a la interfaz, y hubo que aprenderla de nuevo por separado.

   El 26-ago-2026 Gina dijo: *«no hay una interface para el curador, no hay algo
   que me diga tienes 5000 pendientes»*. **Las dos cosas existían.** `/calidad`
   lleva semanas funcionando y su franja «Estado del sistema» dice 5.822 desde
   el 19-ago. Lo que no existía era **la puerta**: `grep` sobre `src/` devolvía
   **cero enlaces** hacia `/calidad`. Se llegaba escribiendo la URL de memoria.

   Y la variante más cara del mismo defecto: `justired-cuenta` devolvía
   `destino: '/abogado'` y `destino: '/mis-casos'` desde el 23-ago hacia **dos
   rutas que no estaban declaradas**. El primer abogado aprobado y el primer
   cliente registrado habrían aterrizado en el 404 genérico en su primer
   segundo dentro del producto. No se cobró porque hay cero de cada uno — que
   es la peor razón para que un defecto no se note.

   **Lo que hay que comprobar, y no basta con mirar la pantalla:** que cada
   destino que el servidor puede devolver esté declarado como ruta, y que cada
   ruta con permiso tenga al menos un enlace desde donde vive quien lo tiene.

9. **Un número que sólo se ve desde adentro no informa a nadie.** El «5.822» era
   correcto y estaba medido desde el 19-ago; vivía únicamente dentro de
   `/calidad`, detrás de una comprobación de staff. Para cualquiera fuera de esa
   pantalla —incluido un abogado buscando una norma— la biblioteca de 87
   documentos se leía como *«esto es todo lo que hay»* en vez de *«esto es el
   1,5 % de lo que hay»*. Desde el 26-ago la cobertura se publica agregada en
   `justired.cobertura_biblioteca` y se muestra en la biblioteca misma.

---

## Fuentes de este documento

| Qué | Dónde |
|---|---|
| Infraestructura, despliegues, herramientas de sesión | `diseno-sorsabsa/docs/ARQUITECTURA-ECOSISTEMA.md` |
| Regla de desarrollo: no parchear (parte I) y lo que existe sin ejecutarse (parte II) | `diseno-sorsabsa/docs/ESTANDAR-DESARROLLO.md` |
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
