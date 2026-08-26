# Estándar de desarrollo — no parchear la arquitectura

**Vigente desde:** 09-ago-2026. Aplica a **todo** el ecosistema SORSABSA
(auth-sorsabsa, iot, condomanager, domuscrm, justired, agente24siete,
convertidor) — no es específico de un repo.

**Por qué existe:** el 08 y 09 de agosto de 2026, la integración SSO de IOT
se corrigió siete veces en menos de 24 horas — cada arreglo resolvía el
síntoma visible y producía el siguiente. Ver la auditoría completa de esa
cadena y sus hallazgos clasificados en el historial de la sesión que
originó este documento (auth-sorsabsa + iot, 09-ago-2026): cuentas creadas
en el proyecto equivocado, bypasses hardcodeados por nombre de producto,
lógica de autorización duplicada en dos archivos, un fallback que convierte
"no configurado" en "todo permitido" en el motor de cobros, y un logout que
no cerraba sesión porque un producto nunca usó el logout central que ya
existía. Ninguno de los siete parches era la causa. Este documento existe
para que la próxima vez, la primera reacción sea encontrar la causa, no
tapar el síntoma.

**Ampliado el 19-ago-2026** con la parte II. Todo lo de la parte I siguió
siendo correcto —varios arreglos de esa semana fueron aplicaciones directas
de sus reglas— pero apareció una **familia de fallos distinta** que no
cubría. La parte I previene *escribir código malo*; la parte II previene
*código bueno que nadie ejecuta* y *mediciones que engañan con
naturalidad*. Los dos producen fallos silenciosos, que es lo que este
documento persigue, pero entran por puertas distintas.

---

## PARTE I — No parchear la arquitectura

## Principio fundamental

**No optimizar para que el caso actual funcione. Optimizar para que el
sistema funcione correctamente como sistema.**

Una solución NO es válida solo porque compila, pasa el test, hace
desaparecer el error, permite entrar a un usuario, o funciona en
producción para un caso específico. Debe además respetar la arquitectura,
los contratos entre componentes y las responsabilidades establecidas.

## Antes de cada fix — responder internamente

1. ¿Cuál es el síntoma?
2. ¿Cuál es la causa inmediata?
3. ¿Cuál es la causa raíz?
4. ¿Qué componente es responsable de resolverla?
5. ¿Existe ya otro componente que haga esta función?
6. ¿Existe una implementación duplicada?
7. ¿Estoy agregando una excepción?
8. ¿Estoy agregando un bypass?
9. ¿Estoy hardcodeando un usuario, producto, ID, email o comportamiento?
10. ¿Estoy usando un fallback para convertir un estado inválido en uno válido?
11. ¿Estoy modificando datos para compensar un problema de código?
12. ¿Estoy creando una solución que solo funciona para este caso?
13. ¿Estoy creando una nueva dependencia entre componentes?
14. ¿Este cambio puede producir una regresión arquitectónica?
15. ¿Qué código existente debería ELIMINARSE como consecuencia de esta solución?

Y desde el 19-ago-2026, tres más — ver la parte II:

16. ¿**Quién ejecuta** esto, y cuándo? Si la respuesta es "alguien, alguna
    vez", no está resuelto.
17. ¿Qué prueba **fallaría** si el defecto volviera mañana?
18. Si esto se apoya en una medición: ¿de dónde sale el **denominador**, y
    está completo?

Si cualquiera revela un problema: **no implementar el fix todavía.**
Auditar la arquitectura primero.

## Señales de alarma — detenerse al estar por escribir

- **Hardcode:** `if email == "..."`, `if app == "iot"`, `if userId == "..."`.
  Si la respuesta a "¿por qué el sistema necesita conocer a esto
  específicamente?" es autorización/configuración/negocio/identidad, debe
  existir una fuente de datos apropiada — no una constante en código.
- **Excepciones por producto:** `if app === "iot"`. No aceptar
  automáticamente. Determinar si el producto realmente necesita un
  comportamiento distinto, o si el mecanismo común está incompleto — y si
  es lo segundo, corregir el mecanismo común. **No crear una excepción
  para el producto que expuso el bug.**
- **Bypass:** cualquier `bypass`/`skip`/`force`/`allowAnyway`/`ignore`/
  `except`/`temporary`/`workaround` es sospechoso por defecto.
- **Fallback peligroso:** "si no existe configuración → continuar", "si no
  existe autorización → permitir", "si no existe identidad → usar otro
  identificador". Un sistema debe distinguir "no configurado" de
  "configurado y válido" — nunca convertir lo primero en lo segundo para
  evitar que falle visiblemente.
- **Y su espejo — fallar cerrado DE MÁS** (19-ago-2026): **fallar cerrado se
  aplica a la ACCIÓN que depende de la pieza rota, no a la pantalla que la
  contiene.** Caso real: faltaba aplicar el catálogo de motivos de rechazo y
  la función respondía 500 antes de cualquier acción, así que el panel de
  calidad entero apareció en cero —ni un documento a la vista, un cartel
  rojo— cuando solo *rechazar* necesitaba ese catálogo; *listar*, *corregir*
  y *aprobar* no lo usaban para nada. Un sistema que se apaga entero por una
  pieza que casi ninguna acción usa no es prudente, es frágil. La pregunta a
  hacerse: *¿qué operaciones dependen REALMENTE de lo que falta?* Las demás
  siguen, con un aviso visible de lo que no está disponible.
- **Duplicación:** la misma regla en dos archivos, o en producto A y
  producto B. No copiar la corrección a los dos lugares — encontrar la
  fuente única de verdad y que ambos la usen.
- **Fix sobre fix:** `bug → fix → nuevo bug → fix → nuevo bug → fix`. Al
  reconocer esta cadena, no agregar otro eslabón — retroceder hasta la
  primera decisión arquitectónica incorrecta.

## Prohibido compensar defectos de código modificando datos reales

Crear usuarios de nuevo, eliminar usuarios, mover cuentas a mano,
modificar permisos a mano, cambiar datos de producción, insertar/borrar
registros para "volver a probar" — ninguno de estos es un sustituto de
corregir el flujo de software. Puede ser una operación administrativa
controlada y explícita, pero nunca el mecanismo para ocultar un defecto
arquitectónico.

## "Funciona" no es lo mismo que "está bien diseñado"

Si algo funciona solo porque una cookie/sesión previa existía, un usuario
ya estaba creado, una redirección ocurrió en cierto orden, o un proveedor
externo tuvo un comportamiento accidental (ej. una librería que detecta
sesión en cualquier página sin que el código lo pida explícitamente) —
eso es deuda arquitectónica, no una solución.

## Responsabilidad del componente

Para cada problema: ¿quién debería ser responsable de esto?

- Problema de autenticación central → corregir el portero, no cada producto.
- Problema de autorización → fuente central de autorización, no usuarios
  hardcodeados en el producto.
- Ya existe un servicio central para algo (logout, identidad, sesiones) →
  usarlo. No implementar una versión local paralela.

## Fuente única de verdad

Para identidad, autenticación, autorización, roles, permisos, sesiones,
logout, productos, configuración, suscripciones y entitlements debe
existir una única autoridad. Si dos componentes deciden distinto sobre el
mismo concepto, eso es en sí mismo un hallazgo arquitectónico a reportar
— no una coincidencia a ignorar.

## Qué debe presentarse antes de tocar código

1. Síntoma
2. Causa inmediata
3. Causa raíz
4. Componente responsable
5. Código afectado (archivos y funciones)
6. Fix propuesto
7. Código que debe eliminarse (workaround/duplicación/bypass/excepción que deja de ser necesario)
8. Riesgo de regresión
9. Validación (cómo demostrar que funciona correctamente, no solo que "pasa")

## Criterio de aceptación

Una solución es correcta solo si: **funciona + respeta la arquitectura +
elimina la causa raíz + no crea una excepción + no duplica lógica + no
requiere intervención manual + funciona para todos los casos
equivalentes.** Cumplir únicamente "funciona para este caso" no alcanza.

## Regla final

Ante la duda entre un parche pequeño y detenerse a revisar la
arquitectura: **detenerse.** Es preferible reportar "encontré una
inconsistencia arquitectónica, antes de tocar código necesito corregir la
fuente de verdad" que introducir otro workaround.

---

## PARTE II — Lo que existe y no funciona

**Vigente desde:** 19-ago-2026.

**Por qué existe.** La parte I nació de siete parches sobre el mismo bug en
24 horas: el problema era *código mal escrito*. Entre el 15 y el 19 de
agosto de 2026, trabajando la ingesta legal de JustiRed, apareció una
familia distinta y peor de encontrar. Ningún componente estaba mal
escrito. Estaban **bien escritos y sin ejecutar**, o **midiendo mal**.

Los cuatro casos que originaron esta parte:

| Qué pasó | Cuánto duró sin que nadie lo notara |
|---|---|
| `Inventario.marcar_adquirido()` existía desde que nació el módulo y **nadie la llamaba**. El inventario informaba "152 pendientes" incluyendo 78 documentos ya descargados, convertidos y publicados | meses |
| `reparar_inventario.py` estaba en el repo y **ningún modo del flujo de trabajo lo invocaba** — y además su comprobación final estaba rota | 2 días |
| ESLint tenía configurada la regla de hooks de React, con el mensaje exacto del defecto, y **CI nunca la corría**. `tsc` y el build pasaron en verde con la pantalla en blanco | hasta que la usuaria apretó un documento |
| `test_r2.py` **pasaba en verde mientras 17 originales se perdían**, porque la prueba estaba escrita desde el código y afirmaba justo lo que el código hacía mal | 17 días |

Ninguno de estos habría sido detenido por la parte I. No hay hardcode, no
hay bypass, no hay duplicación, no hay fallback peligroso. Hay cosas que
**parecen funcionar y no hacen nada**.

## Regla 1 — Código que no se puede ejecutar no existe

Todo componente que RESUELVE algo —un script de reparación, un método, un
modo de mantenimiento— debe llegar con su **disparador declarado en el
mismo commit**: una entrada en el flujo de trabajo, una llamada desde
donde corresponde, o un cron. No en el siguiente commit, no "cuando haga
falta".

- Si al terminar no se puede responder **"lo ejecuta X, cuando Y"**, el
  trabajo no está hecho.
- Un método nuevo en una clase que nadie invoca es lo mismo que un archivo
  vacío, con el agravante de que parece resuelto.
- **Buscar quién lo llama antes de darlo por hecho.** Un `grep` del nombre
  habría ahorrado los meses de `marcar_adquirido()`.

## Regla 2 — Una comprobación desconectada es una comprobación que no existe

Toda herramienta de verificación configurada tiene que estar **conectada a
algo que la ejecute**, y ese algo tiene que correr sin que nadie se
acuerde.

- Una regla de linter que CI no corre no protege nada.
- Dos comprobaciones distintas no se sustituyen: el compilador de tipos no
  ve un hook mal colocado y el linter no ve un tipo mal. Las dos pasaron en
  verde con la pantalla vacía.
- Ante un defecto que llegó a producción, la pregunta no es solo *"¿qué
  comprobación falta?"* sino **"¿había una comprobación que existía y no se
  ejecutaba?"**. Es lo más común.

## Regla 3 — Una prueba que pasa no es una prueba que sirve

- **La mitad de las pruebas de una regla deben ser NEGATIVAS**: comprobar
  que lo que no debe pasar, no pasa. Un clasificador se prueba sobre todo
  con vocabulario que **no** debe clasificar nada; un cortador de texto,
  con citas que **no** deben abrir un corte.
- **No escribir la prueba desde el código que prueba.** `test_r2.py`
  afirmaba `if devuelta != key: FALLA`, que era exactamente lo que el
  código hacía mal: comprobaba que el componente hiciera lo que hacía, no
  lo que debía hacer. Escribir la prueba desde el REQUISITO —"el original
  tiene que estar en el almacén, no solo la clave anotada"— la habría hecho
  fallar el primer día.
- **Probar contra datos REALES.** Una suite entera pasaba en verde con
  oraciones inventadas mientras 29 de 81 documentos quedaban sin clasificar
  en producción. Los fixtures se capturan de la fuente, con fecha.

## Regla 4 — Medir mal es peor que no medir

Una medición equivocada **no falla**: entrega una conclusión con toda
naturalidad, y esa conclusión dirige el trabajo.

- **Antes de concluir, mirar el denominador.** ¿De dónde sale, y está
  completo? Caso real: una medición comparó 450 elementos hallados contra
  377 "declarados" e informó 175 falsos positivos. Los 175 eran correctos;
  el denominador estaba truncado por un defecto en otro componente. Sin
  comprobar el denominador, la conclusión habría sido "arreglar" algo que
  funcionaba bien.
- **Un resultado inesperado se investiga antes de aceptarlo**, sobre todo
  cuando confirma lo que uno temía.
- **Correr la medición dos veces** antes de darla por buena. Es lo que
  reveló una falsa alarma que se disparaba en cada corrida.
- **Una alerta que siempre suena no es una alerta**, y una que nunca puede
  sonar tampoco. Toda excepción escrita para un caso legítimo hay que
  probarla contra un caso ilegítimo: una excepción para "esta fuente no se
  inventaría" se tragó una fuente mal escrita durante 19 días.

## Regla 5 — Lo que se declara no se deduce

Cuando una regla del negocio se puede escribir en una tabla, **escribirla**,
aunque parezca deducible de los datos. Deducirla parece más robusto —no hay
lista que mantener— y es lo contrario: un error de tipeo se disfraza de
caso nuevo y la deducción lo bendice.

Es la misma exigencia de *fuente única de verdad* de la parte I, aplicada
antes de que exista el problema: si dos componentes tienen que saber lo
mismo, eso es una tabla, no una constante ni una inferencia.

## Regla 5-bis — Si tuviste que leer OTRO repo para saberlo, va a la arquitectura

**Vigente desde el 23-ago-2026.** Gina, después de un mes: *"ya te he dicho
cientos de veces en el mes: documenta la arquitectura cuando sales con estas
mismas preguntas, y dices que sí registras y no lo cumples"*.

Tiene razón, y el mismo día se repitió tres veces: el nombre del repo de
DomusCRM en GitHub, dónde vive el grafo del Convertidor, y cómo registra un
usuario un producto del ecosistema. Las tres respuestas existían — en el código
de otro repo, no en un documento— así que hubo que ir a buscarlas de nuevo. Una
de las tres terminó en un hallazgo falso publicado en una auditoría.

**La regla, con su disparador:**

> Si para responder una pregunta de arquitectura tuviste que **abrir el código
> de otro producto**, esa respuesta va a `ARQUITECTURA-ECOSISTEMA.md` **antes de
> seguir con la tarea**. No al final, no "cuando cierre esto".

Por qué antes y no después: al final ya funcionó, la urgencia se fue, y el
documento no se escribe. Es exactamente lo que pasó las cientos de veces.

**Cómo se reconoce el disparador.** Cualquiera de estas es la señal:

- Estás por correr `grep` sobre un repo que **no es** en el que trabajás.
- Vas a preguntar *"¿cómo lo hace \<otro producto\>?"*.
- La respuesta empieza con *"CondoManager usa…"* o *"en agente24siete está…"*.

**Qué se escribe:** la regla, quién la cumple hoy y quién no, y el archivo de
referencia real. No un resumen del código — un resumen envejece; la regla y el
puntero, no.

**Y lo que NO alcanza:** anotarlo en la auditoría del producto, en PENDIENTES o
en un comentario. Son documentos que se leen cuando ya sabés que existen. La
arquitectura es la que se abre para preguntar.

## Regla 6 — La deuda que se retira se escribe

La pregunta 15 —*"¿qué código debería eliminarse?"*— necesita **un lugar
donde vivir**. Una respuesta dada en una conversación no sobrevive a la
conversación, y el código que iba a retirarse se queda para siempre.

Cada proyecto mantiene una lista visible de **deuda a retirar**: qué,
por qué, y con qué hito se borra. En JustiRed vive en
`diseno-sorsabsa/docs/modelo_justired.md`.

## Criterio de aceptación de la parte II

Una solución está terminada solo si además: **se puede ejecutar + hay algo
que la ejecuta + existe una prueba que fallaría si el defecto volviera + si
se apoya en una medición, el denominador está comprobado + lo que reemplaza
quedó anotado para retirarse.**
