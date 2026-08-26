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

---

## Análisis · Por qué deja pasar sin membresía, y qué cuesta

Gina, 26-ago-2026: *"¿te das cuenta de la basura de información que empiezo a
recibir? Miles de usuarios ingresan y yo me chanto ese espacio, ¿y regalarle los
servicios? En el Convertidor estoy de acuerdo con un freemium, pero analiza el
costo-beneficio."*

### Por qué deja pasar — la causa real, no la excusa

**Un problema de ORDEN, no de criterio.** La membresía se crea **después** de la
compuerta:

```
portero comprueba  →  entra al producto  →  el producto le crea la membresía
       ↑                                              ↓
       └──────── si acá exigiera membresía, nunca llegaría ahí
```

En DomusCRM la fila de `company_users` la crea el propio producto en
`/auth/callback → /api/auth/reconciliar-perfil`, o sea **dos pantallas después**
del chequeo. Si el portero exigiera membresía, **ninguna agencia recién
registrada podría entrar a la pantalla que la da de alta.**

Por eso `sin_entidad` devuelve `active: true`. No es que alguien decidiera
regalar acceso: es que **la compuerta está antes de la puerta que da el
permiso.**

**El arreglo no es endurecer el portero.** Es que la membresía nazca en el
registro —no después del primer login— y ahí el portero sí puede exigirla. Es
justo lo que se acaba de construir en JustiRed: el alta crea la fila **en el
mismo acto**, sin esperar a un primer ingreso.

### Qué consume realmente alguien sin membresía

Depende del producto, y **la exposición NO está repartida**:

| producto | qué puede consumir sin ser cliente | costo por uso |
|---|---|---|
| CondoManager · DomusCRM | nada — `entidad` exige suscripción | — |
| agente24siete | nada — su gate real es el **saldo** | — |
| IoT · SorsabsaForensic | nada — interno | — |
| JustiRed | la biblioteca, **que ya es pública** | ~0 |
| **Convertidor** | **conversiones reales** | **dinero por página** |

**Toda la exposición está en un solo producto.** Y ahí sí hay que mirar el
número.

### Convertidor: el costo-beneficio, medido

De `COSTEO-CONVERTIDOR.md`, con tokens reales de la API:

| | Opus 5 | Sonnet 5 | Haiku 4.5 |
|---|---|---|---|
| US$/página | 0,0316 | 0,0167 | **0,0046** |
| Páginas por $9 | 285 | 539 | **1.964** |
| Léxico | 100,0% | 99,8% | **99,3%** |

**Haiku cuesta 7 veces menos que Opus y pierde 0,7 puntos de lectura.**

#### Lo que protege hoy al plan gratis

Verificado en `frontend/src/app/api/convert/route.ts`:

- ✅ **El OCR es de pago.** `permiteOcr(plan)` bloquea con **402** al gratis, y
  también bloquea convertir imágenes —*"una imagen se transcribe con OCR"*—.
  **La ruta cara no está abierta al gratis.**
- ✅ Tamaño limitado a **5 MB** (Pro: 50 MB).

#### Lo que NO protege

- ❌ **No hay tope de cantidad.** Ni conversiones por mes, ni páginas, ni
  contador de uso. Verificado: cero menciones de conversiones, mensual o
  contador en la ruta.

**Conclusión sobre la exposición real:** una cuenta gratis **no puede** disparar
el gasto de modelo, porque el OCR exige plan. Lo que sí puede hacer es consumir
**cómputo de Railway sin límite** — conversiones de PDF con capa de texto,
ilimitadas, gratis. Eso cuesta, pero es **dos órdenes de magnitud menos** que el
OCR: no es el agujero que parecía.

> **La afirmación "regalás los servicios" es cierta solo a medias, y conviene
> saber cuál mitad.** El servicio caro —la visión— ya está cerrado. El barato
> —cómputo— está abierto sin tope.

#### El problema de negocio del Convertidor no es el freemium

Es el modelo por defecto. Con Opus, **un solo expediente consume un tercio de la
mensualidad**, y dos expedientes hacen que el cliente **cueste más de lo que
paga**. Eso le pasa al **cliente que SÍ paga**, no al que entra gratis.

**Cambiar el motor a Haiku multiplica el margen por 7** perdiendo 0,7 puntos de
lectura. Es una variable de entorno.

### La "basura de información"

Hoy: **11 cuentas** en el proyecto compartido, **7** en identity. La
preocupación es válida a escala, no ahora.

Pero el mecanismo que la produce ya existe: cualquiera con Google entra, queda
en `auth.users` **y en ninguna otra tabla**. No ensucia datos de negocio —no hay
condominio, ni empresa, ni cliente— pero sí infla el padrón de identidad, y con
`not_after: null` (P-3) esas sesiones **no caducan nunca**.

### Recomendación, en orden de retorno

1. **Cambiar el motor del Convertidor a Haiku.** Una variable de entorno,
   **×7 de margen**, 0,7 puntos de lectura. Es la única acción de esta lista que
   cambia el negocio hoy.
2. **Tope de cantidad en el plan gratis del Convertidor** (p. ej. N conversiones
   al mes). Cierra el cómputo ilimitado; hoy es lo único abierto.
3. **Que la membresía nazca en el registro**, como ya hace JustiRed. Es lo que
   permite endurecer el portero después, y sin eso el punto 4 no se puede hacer.
4. **Recién entonces**, que `sin_entidad` deje de devolver `active: true`.
5. **Caducar las sesiones del portero** (P-3).

**No recomiendo empezar por 4.** Hoy encerraría a todo recién registrado de
DomusCRM y CondoManager — el problema que el comentario del código ya
documenta.
