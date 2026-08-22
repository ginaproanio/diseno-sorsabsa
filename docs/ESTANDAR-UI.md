# Estándar de UI del ecosistema SORSABSA

**Vigente desde:** 22-ago-2026. Aplica a **todos** los productos.

Complementa `ESTANDAR-DESARROLLO.md` (que gobierna el código) y
`COLOR-Y-CONTRASTE.md` (que gobierna la paleta). Este documento gobierna **cómo
se le habla al usuario**.

---

## 1. Nada de modales. Ninguno.

**Regla dura de Gina, 22-ago-2026:** *"odio los modales, eso nunca debes ni
siquiera considerar en usarlos"*.

Incluye, y esto es lo más grave, los del navegador: **`alert()`,
`confirm()` y `prompt()` están prohibidos.** Bloquean el hilo, no se pueden
diseñar, no se pueden traducir, no se pueden probar y no dicen a dónde ir.

**El caso real que originó la regla.** En el Convertidor, pulsar "Suscribirse"
sin sesión abría un `alert()` del navegador con el texto de un error 401. La
persona quedaba en un callejón sin salida **en la única pantalla que factura**:
el producto sabía perfectamente que le faltaba entrar y no hacía nada con esa
información. El arreglo no fue "un modal más bonito" — fue mandarla al portero
y devolverla a la compra.

### Qué se hace en su lugar

| En vez de… | Va… |
|---|---|
| `alert("error")` | Un mensaje **en la página**, junto a lo que falló, con `role="alert"` |
| `confirm("¿seguro?")` | Una acción con deshacer, o una confirmación en línea que no tapa la pantalla |
| Un modal que dice "necesitas cuenta" | **Llevar** a crear cuenta, y volver a donde estaba |
| Un modal de "cargando" | Estado en el propio botón o en la sección que carga |

**El principio detrás:** un modal casi siempre es una decisión que el producto
no quiso tomar. Si el sistema sabe lo que falta, que lo resuelva o que lleve al
sitio donde se resuelve — no que interrumpa para contarlo.

---

## 2. La campana de notificaciones

**Va siempre en la esquina superior derecha, antes del perfil del usuario, en
todos los productos**, y es **el mismo componente**: `NotificationBell` de
`@sorsabsa/ui`.

No es una preferencia estética. Es el canal por el que se avisa de una
**urgencia o un problema del ecosistema**, y un canal que no está en todos los
productos, o que no se reconoce igual en todos, no sirve para eso.

Lo que es de cada producto son **los datos** —de dónde salen y cómo se marcan
leídas—, y eso vive en su `useNotifications`. El componente recibe
`notificaciones`, `unreadCount`, `onMarkRead` y `onMarkAllRead`, y nada más:
cada producto lo usa como adaptador de pocas líneas, nunca reimplementándolo.

Estado y pendientes: `PENDIENTES-ECOSISTEMA.md` §25.

---

## 3. El requisito de cuenta se pide para servir, no para cobrar

Cuando una función es de pago, el momento de pedir la cuenta es **cuando la
persona choca con el límite** —con su archivo delante, en contexto—, no en el
paso del pago. Pedirla al pagar mete un trámite justo después de que decidió
comprar, que es el peor momento posible.

Y un límite alcanzado **nunca es un muro sin puerta**: un botón deshabilitado
que dice "Solo Pro" es exactamente eso. Ese mismo clic tiene que llevar a los
planes.

---

## 4. Toda pantalla de acceso ofrece crear cuenta

Si un producto admite autoservicio, su pantalla de acceso **tiene que ofrecer
crear cuenta**, con al menos el mismo peso visual que "iniciar sesión": quien
ya tiene cuenta sabe buscarla, quien no la tiene no.

Ojo con **dónde** se pone: `auth-sorsabsa/auth/login` se redirige sola al
cargar (es un pasillo, no una pantalla), así que cualquier enlace ahí parpadea y
desaparece. La única pantalla de acceso que el usuario ve de verdad es
`/oauth/consent`. Detalle en `ARQUITECTURA-ECOSISTEMA.md` §4-ter.
