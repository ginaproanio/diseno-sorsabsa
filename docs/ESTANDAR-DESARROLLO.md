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

---

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
