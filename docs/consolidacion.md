
---

# Validación de modificaciones

Se ejecutan cada vez que se intenta insertar o activar una modificación.
**Una sola modificación incorrecta corrompe toda la consolidación futura de esa
norma**, así que este es el punto de control más importante del sistema.

## Principios

- **Bloqueantes** rechazan la inserción. **Observadas** entran pero quedan en
  `estado = 'observada'` y no se muestran como vigencia confiable.
- Se ejecutan **dentro de una transacción**, antes del `INSERT` definitivo.
- Viven en una función `validar_modificacion(mod)` que devuelve errores y
  advertencias — no en el código que llama, para que no haya dos caminos de
  entrada con reglas distintas.

## Bloqueantes

| # | Validación | Motivo |
| --- | --- | --- |
| 1 | Las referencias existen (`norma_afectada`, `norma_modificatoria`, `documento_modificatorio`) | Integridad referencial |
| 3 | Campos obligatorios según el tipo (tabla abajo) | Evita modificaciones incompletas |
| 4 | Offsets válidos: `0 ≤ desde < hasta ≤ length(texto)` del documento modificatorio | Punteros rotos = texto inventado o vacío |
| 4-bis | **La cita también es un puntero y se valida igual** | Ver corrección 3 |
| 5 | Una norma no puede derogarse a sí misma antes de su propia vigencia | Lógica básica |
| 7 | `derogacion_total` no trae `articulo_afectado` ni `articulos_afectados` | Consistencia de tipo |
| 8 | Los nuevos punteros no se solapan con otros artículos del mismo documento | Sostiene el invariante de porción contigua única |

> Los números 2 y 6 del diseño original **salieron de esta lista** — ver
> correcciones 1 y 2.

### Campos obligatorios por tipo

```text
derogacion_total       | (ninguno extra)
derogacion_parcial     | articulos_afectados (array con al menos 1)
reforma / sustitucion  | articulo_afectado + nuevo_desde + nuevo_hasta
adicion                | nuevo_numero + nuevo_desde + nuevo_hasta
renumeracion           | mapa_renumeracion (JSONB no vacío)
fe_de_erratas          | articulo_afectado + nuevo_desde + nuevo_hasta
```

## Observadas — entran, pero marcadas

| # | Qué detecta |
| --- | --- |
| 2 | `fecha_efecto` anterior a la publicación de la norma modificatoria (retroactividad, ver corrección 1) |
| 6 | El artículo afectado no existía en la norma en esa fecha (ver corrección 2) |
| 9 | Se reforma un artículo que en esa fecha ya estaba derogado |
| 10 | Se deroga un artículo ya derogado |
| 11 | Hay otras modificaciones de la misma norma el mismo día sin `orden` claro |
| 12 | El texto nuevo es 3× más largo o más corto que el anterior — probable error de segmentación |
| 13 | El `mapa_renumeracion` genera colisiones: dos artículos con el mismo número |
| 15 | Detectada automáticamente con `confianza < 0.85` |

## Consistencia temporal avanzada

Más caras: requieren simular estado. Corren de forma asíncrona, no en el
`INSERT`.

- **Simulación**: correr la consolidación hasta `fecha_efecto` *sin* esta
  modificación y comprobar que el estado resultante admite lo que pretende hacer.
- **Ciclos**: que no se arme una cadena circular de reformas.
- **Cobertura**: tras una derogación parcial, que no queden huecos lógicos
  graves en la numeración.

## Pseudocódigo

```python
def validar_modificacion(mod) -> ResultadoValidacion:
    errores, avisos = [], []

    # --- Bloqueantes: baratas, sin simular estado ---
    if not existe_norma(mod.norma_afectada_id):
        errores.append("norma_afectada_id no existe")
    if not existe_norma(mod.norma_modificatoria_id):
        errores.append("norma_modificatoria_id no existe")

    if mod.tipo in ("reforma", "sustitucion", "adicion", "fe_de_erratas"):
        if not offsets_validos(mod.documento_modificatorio_id,
                               mod.nuevo_desde, mod.nuevo_hasta):
            errores.append("offsets del texto nuevo inválidos")

    # La cita es tan puntero como el texto nuevo (corrección 3)
    if not offsets_validos(mod.documento_modificatorio_id,
                           mod.cita_desde, mod.cita_hasta):
        errores.append("offsets de la cita inválidos")

    # --- Observadas: incluyen las que dependen del estado ---
    if mod.fecha_efecto < fecha_publicacion(mod.norma_modificatoria_id):
        avisos.append("efecto retroactivo declarado: verificar")

    if mod.tipo in ("reforma", "sustitucion", "derogacion_parcial", "fe_de_erratas"):
        if not articulo_existe_en_fecha(mod.norma_afectada_id,
                                        mod.articulo_afectado, mod.fecha_efecto):
            avisos.append(f"el artículo {mod.articulo_afectado} no consta vigente en esa fecha")

    if hay_modificaciones_mismo_dia(mod) and mod.orden is None:
        avisos.append("otras modificaciones el mismo día sin orden definido")

    if errores:
        return Rechazada(errores)
    return Observada(avisos) if avisos else Aprobada()
```

## Dónde se ejecuta cada capa

| Capa | Qué corre | Por qué ahí |
| --- | --- | --- |
| **Base de datos** (CHECK + trigger) | Bloqueantes 1, 3, 4, 4-bis, 5, 7 | Baratas y sin estado: no pueden esquivarse ni desde una consola |
| **Aplicación** | Observadas 9–13, 15 | Necesitan consultar otras filas |
| **Job asíncrono** | Simulación, ciclos, cobertura, y **revalidación** | Caras y dependientes del orden de ingesta |

## Severidad

| Severidad | Acción | Ejemplos |
| --- | --- | --- |
| **Bloqueante** | Rechaza el `INSERT` | Offsets inválidos, tipo mal formado, cita fuera del documento |
| **Observada** | Inserta con `estado = 'observada'`, **no se publica como vigente** | Retroactividad, artículo no vigente, baja confianza, cambio de tamaño raro |
| **Informativa** | Solo registro | Renumeraciones complejas, muchas modificaciones el mismo día |

---

## Cinco correcciones a las validaciones

### 1 · 🔴 La regla 2 rechazaría normas legalmente válidas — y se contradice con la 15

El diseño la ponía como **bloqueante**: *"`fecha_efecto` no puede ser anterior a
la `fecha_publicacion` de la norma modificatoria — una norma no puede reformar
algo antes de existir"*.

Dos problemas:

**a) La retroactividad existe.** En materia tributaria y administrativa una
norma puede declarar efectos desde una fecha anterior a su publicación. La regla
tal como está **hace que el sistema no pueda representar derecho real** — y el
fallo aparece como "no puedo cargar esta reforma", sin decir que la culpa es de
una regla nuestra.

**b) La regla 14 del mismo diseño describe esta misma condición como
observada.** El mismo hecho no puede ser bloqueante y advertencia a la vez.

**Queda como observada.** Es rarísima y merece que alguien la mire; no merece
que el sistema se niegue a registrarla.

### 2 · 🔴 La regla 6 no puede ser bloqueante: crea dependencia del ORDEN DE CARGA

*"El artículo afectado debe existir en la norma en la `fecha_efecto`"* suena
obvio, y como bloqueo en el `INSERT` rompe el caso normal de un barrido
histórico.

**Al cargar el archivo no se ingesta en orden cronológico.** Si una reforma de
2023 toca un artículo que agregó una adición de 2021 todavía no cargada, la
validación la rechaza — y el dato correcto queda afuera por el orden en que se
leyeron los PDF. Peor: el resultado depende de en qué edición estaba cada una,
o sea es irreproducible.

Además **contradice la sección 4 del propio diseño**, que pone la simulación de
estado en la capa asíncrona por costosa. No puede ser bloqueante en el `INSERT`
y asíncrona al mismo tiempo.

**Queda como observada**, y la revalidación (corrección 5) la resuelve sola
cuando llega la pieza que faltaba.

### 3 · 🟠 La cita también es un puntero, y nadie la estaba validando

Las validaciones de offsets cubrían `nuevo_desde`/`nuevo_hasta` y se olvidaban
de `cita_desde`/`cita_hasta`. Una cita con offsets rotos apunta a un fragmento
vacío o a otro párrafo: **la modificación parece respaldada y no lo está**, que
es exactamente lo que la cita venía a impedir.

Se valida igual, contra el mismo `documento_modificatorio_id`.

### 4 · 🟠 Falta la regla de duplicados — y la cita la resuelve gratis

Nada impedía que la misma modificación se registrara dos veces al re-correr la
detección sobre el mismo documento. Dos filas del mismo hecho jurídico se
aplican **dos veces** en la consolidación.

**Una modificación queda identificada por su cita**: la frase que la enuncia es
única dentro del documento que la contiene.

```sql
CREATE UNIQUE INDEX uq_modificaciones_cita
    ON modificaciones(documento_modificatorio_id, cita_desde, cita_hasta);
```

Con eso, **re-detectar es idempotente**: la segunda pasada choca contra el
índice en vez de duplicar el hecho. Es la misma propiedad que hace seguro
relanzar el barrido histórico.

### 5 · 🟡 `estado` no es un veredicto del `INSERT`: se recalcula

El diseño trata la validación como algo que pasa una vez, al entrar. Pero las
correcciones 1 y 2 dejan modificaciones observadas **por falta de contexto**,
no por estar mal — y ese contexto llega después, cuando se carga el resto del
archivo.

Si `estado` se congela en el `INSERT`, esas modificaciones quedan observadas
para siempre y alguien las revisa a mano sin necesidad: **la cola de curación
se llena de casos que el propio sistema podría cerrar.** Es el mismo defecto de
la cola de 80 en la ingesta.

El job asíncrono **revalida** y mueve el estado en las dos direcciones —
`observada → activa` cuando aparece la pieza faltante, y `activa → observada`
si una carga posterior invalida un supuesto. La revisión humana recibe solo lo
que sigue observado después de eso.
