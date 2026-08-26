# Auditoría del portero — ¿valida por dónde entra?

**26-ago-2026.** Pedida por Gina con una pregunta concreta:

> *"Si ingreso por JustiRed, ¿se verifica que tengo cuenta en JustiRed, sí o no?
> Si ingreso en CondoManager, ¿se verifica si tengo cuenta en CondoManager, sí o
> no? No puede ser que un usuario registrado en CondoManager pueda ingresar a
> ningún otro producto. Es como si se registrara al ecosistema, y yo no vendo el
> ecosistema: vendo cada producto."*

---

## La respuesta: NO

**El portero no verifica que tengas cuenta en el producto por el que entrás.**
Y no es una omisión escondida: está escrito en su propio código, en
`src/app/api/entitlements/route.ts`.

> ```
> // `sin_entidad` NO es correcto y hoy deja pasar igual — AUDITORIA-DOMUSCRM.md
> // 🔴-1 fix #2, etapa 2. Es la mitad del desacuerdo entre los dos gates:
> // acá una persona sin ninguna membresía entra, y el producto la bloquea
> // dos pantallas después con otro texto.
> ```
> ```ts
> return NextResponse.json({ active: true, motivo: resolved.motivo, app });
> ```

**`sin_entidad` devuelve `active: true`.** Sin membresía, pasa.

### Por qué está así, según el propio comentario

Bloquear ahí **encerraría a toda agencia recién registrada**: su fila de
membresía la crea el producto **después** de este chequeo
(`crm_inmobiliario /auth/callback → /api/auth/reconciliar-perfil`), así que
nunca llegaría a la pantalla que la da de alta.

Es un motivo real, no un descuido. Pero deja el efecto que Gina describe: **una
cuenta del ecosistema entra a cualquier producto**, y el bloqueo —cuando
existe— lo pone el producto dos pantallas más tarde, con otro texto.

---

## Qué comprueba hoy, en orden

| # | paso | quién | qué decide |
|---|---|---|---|
| 1 | ¿quién sos? | portero (`/oauth/consent`) | credenciales contra **identity** |
| 2 | ¿autorizás a este producto? | portero | **se aprueba solo**, sin pantalla: son productos propios |
| 3 | ¿podés entrar? | portero (`/api/entitlements`) | **solo suscripción**, según el modo de cobro |
| 4 | ¿tenés cuenta acá? | **el producto** | cada uno por su cuenta, o ninguno |

**El paso 4 no es del portero.** Y por eso cada producto lo resuelve distinto:

| producto | ¿comprueba membresía? | cómo |
|---|---|---|
| agente24siete | sí | `LoginGate` → *"Cuenta sin cliente asociado"* |
| CondoManager | sí | `perfiles` en `post-login.ts` y `requireRole.ts` |
| DomusCRM | sí | pantalla de "sin empresa" |
| JustiRed | **no lo tenía** | agregado el 23-ago-2026 (`justired-cuenta`) |
| Convertidor · IoT | sin verificar | — |

---

## Los modos de cobro, y qué bloquea cada uno

De `auth-sorsabsa/src/lib/apps.ts`:

| producto | modo | qué exige el portero para dejar entrar |
|---|---|---|
| DomusCRM | `entidad` | suscripción activa **de la empresa** |
| CondoManager | `entidad` | suscripción activa **del condominio** |
| JustiRed | `freemium` | **nada**: `active` siempre verdadero, el plan viaja aparte |
| Convertidor | `freemium` | **nada** |
| agente24siete | `sin_cobro` | **nada** (su gate real es "¿tiene saldo?") |
| IoT · SorsabsaForensic | `sin_cobro` | **nada** |
| *(default)* | `persona` | suscripción activa de la persona |

**Cuatro de siete no bloquean nada en el portero.** Para esos, entrar al portero
es entrar — y lo único que separa un producto de otro es lo que el producto
compruebe después.

---

## Google y Facebook: mismo camino, mismo resultado

`signInWithOAuth` se da de alta **en identity**, nunca en el proyecto de un
producto. Vuelve a `/oauth/consent`, y desde ahí el recorrido es **idéntico** al
de una contraseña: aprueba la autorización y sigue al paso 3.

**No hay diferencia de validación entre entrar con Google, con Facebook o con
contraseña.** Lo único que cambia es cómo se probó la identidad.

Consecuencia directa, y es el 404 que Gina reportó: alguien entra con Google a
JustiRed sin tener cuenta ahí, **pasa** —porque JustiRed es `freemium` y el
portero no mira membresía— y aterriza en el producto. Si el producto no tiene
una pantalla que lo diga, la persona ve un 404 y cree que el sitio está roto.

---

## El desacuerdo entre los dos gates

Hay **dos** compuertas y no se hablan:

- **La del portero** — mira suscripción, no membresía. Sin membresía, pasa.
- **La del producto** — mira membresía, y bloquea con su propio texto.

Resultado: la misma persona recibe **dos respuestas distintas al mismo hecho**,
en dos pantallas seguidas, con dos redacciones. Es lo que
`ESTANDAR-DESARROLLO` llama fuente única de verdad, y acá hay dos.

---

## Excepciones por producto en el portero

Se auditaron todas. **Hay una sola**, y es de presentación:

| excepción | dónde | qué hace |
|---|---|---|
| `registroPropio` | `apps.ts` → `consent/page.tsx` | JustiRed no muestra "Crear cuenta" en la pantalla de ingreso, porque tiene sus dos puntos de registro en su portada |

Está **declarada en la tabla de apps**, no cableada con un `if (app === 'justired')`.
Ese `if` existió unas horas el 23-ago-2026 y se corrigió el mismo día:
`ESTANDAR-DESARROLLO` prohíbe las excepciones por producto cableadas.

El resto de lo que parece "personalizado" —`registerUrl`, `cobro.modo`,
`callbackUrl`, la marca— **no son excepciones**: son campos que **todos** los
productos declaran, con valores distintos. Un producto nuevo los llena y no toca
el portero.

---

## Hallazgos

### 🔴 P-1 · El portero no valida membresía, y por eso una cuenta entra a cualquier producto

Lo que Gina describe. `sin_entidad` devuelve `active: true`.

**Está reconocido en el código como pendiente** (`AUDITORIA-DOMUSCRM.md` 🔴-1
fix #2, etapa 2) y con un motivo real: hoy la membresía se crea **después** del
chequeo, así que bloquear encerraría a los recién registrados.

**El orden es el problema, no el chequeo.** Mientras la membresía nazca después
de la compuerta, la compuerta no puede exigirla.

**Para cerrarlo** hay que decidir una de dos:

- **(a)** El portero pregunta al producto *"¿esta persona tiene cuenta acá?"* y
  el producto responde — un contrato nuevo, un endpoint por producto.
- **(b)** El portero **no** valida membresía nunca, y se acepta que su trabajo es
  identidad + cobro. Cada producto pone su compuerta, **y todos la tienen**
  (hoy faltan Convertidor e IoT).

**(b) es lo que ya está construido en cuatro de seis productos**, y es más
simple: el portero no tiene que conocer el vocabulario de nadie. Lo que falta no
es cambiar el portero: es que **los seis** productos tengan su compuerta y que
las dos digan lo mismo.

### 🔴 P-2 · La contraseña puede estar en el proyecto equivocado, y el reseteo no lo arregla

Medido el 26-ago-2026 sobre las cuentas reales:

| cuenta | clave en el producto | clave en identity | ¿entra con contraseña? |
|---|---|---|---|
| `gina.proanio76@gmail.com` | sí | **no** | **NO** |
| `puntablanca.ecuador@hotmail.com` | sí | **ni existe ahí** | **NO** |
| `eco.ec` · `patricio` · `sorsabsa@hotmail` · `susi` | — | sí | sí |

El login valida **solo contra identity**. Estas dos cuentas tienen su clave en el
proyecto de producto, que quedó del modelo anterior.

**Y el reseteo no lo corrige.** `/auth/reset` manda el pedido a **los dos**
proyectos. Si la persona abre el correo del proyecto de producto, cambia una
contraseña **que el login ya no lee** — y la pantalla le dice que funcionó.

Le costó a Gina la suscripción de CondoManager: intentó entrar, no pudo, pidió
reseteo, el reseteo "funcionó", el login siguió fallando y el producto caducó.

**Para cerrarlo:** cuando la cuenta no tiene clave en identity, el reseteo tiene
que **repararla ahí**, no resetear la del producto. Requiere que el portero
pueda actuar como administrador de identity, y hoy **no puede**: no hay ninguna
`SERVICE_ROLE` de identity en su código (verificado).

### 🟠 P-3 · La sesión del portero no caduca nunca

`not_after` es `null` en las 10 sesiones más recientes. Combinado con la
aprobación automática del paso 2, una sesión ajena en un navegador **captura
todos los ingresos siguientes**, en todos los productos, hasta que alguien
cierre sesión a mano.

### 🟡 P-4 · Ningún producto ofrece "entrar con otra cuenta"

Consecuencia del anterior: no hay forma visible de decir *"yo no soy esa
persona"*. La salida existe (`auth.sorsabsa.com/auth/logout`, que cierra las dos
sesiones) pero ningún producto la ofrece como tal.

---

## Lo que el portero SÍ hace bien

No todo está mal, y conviene no romperlo:

- **Una sola identidad** para el ecosistema, con la clave viviendo en un solo
  lugar. Es lo que evita cuatro cuentas para la misma persona.
- **`fallar cerrado con nombre propio`**: cuando la verificación no está
  disponible responde `verificacion_no_disponible` y el mensaje dice *"no
  pudimos verificar tu cuenta"*, **no** *"no pagaste"*. Esa distinción se ganó
  con un bug real (`AUDITORIA-DOMUSCRM.md` 🟠-3).
- **`freemium` separa dos preguntas** —"¿puede entrar?" y "¿qué plan tiene?"— en
  vez de colapsarlas. Sin eso, JustiRed no podría dejar entrar a un cliente que
  por diseño no paga nunca.
- **El destino de vuelta se conserva** en toda la cadena, incluido el correo de
  confirmación del registro.
