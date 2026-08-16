# Almacenamiento del ecosistema: modelo, costos y cómo lo hacen otros

**Fecha:** 16-ago-2026 · **Pedido por Gina:** *"no solo es el pago, sino además
el alojamiento permanente… necesito incluso ver costos de almacenamiento,
método de almacenamiento, una cosa es mi espacio y otra de los clientes por
producto"*.

> ## ⚖️ DECISIÓN TOMADA, 16-ago-2026 — el Convertidor NO vende espacio
>
> Gina, después de leer este análisis: *"convertidor en freemium no se queda, se
> descarga y se borra, espacio para convertidor no, que sea la **capacidad de
> conversión** lo que se vende"*.
>
> **Queda decidido así, y este documento sostiene esa decisión con sus propios
> números** (§0 y §7 apuntaban justamente ahí):
>
> - **No se crea el cubo `convertidor-clientes`.** El §1 tipo C —"espacio
>   vendido"— **no se implementa en el Convertidor**. La sección se conserva
>   porque el modelo de los tres tipos sigue siendo válido para el ecosistema, y
>   porque el día que otro producto quiera vender espacio, acá está la cuenta
>   hecha.
> - **Se vende capacidad**, que es lo que el producto YA cobra: tamaño de
>   archivo (5 vs 50 MB), OCR, formatos HTML/JSON y lote. No hay que construir
>   un modelo de negocio nuevo — hay que dejar de construir el que sobraba.
> - **Lo que sigue vigente de este documento:** §2 (Railway procesa, R2 guarda —
>   y la subida directa que destraba el techo de 4,5 MB de Vercel), §4 aplicado
>   al cómputo en vez del disco, y §6 pasos 1 y 2, que ahora son **lo único**
>   que bloquea el archivo grande.
> - **Lo que muere con esta decisión:** las decisiones 1, 2 y 4 del §5 (cuánto
>   espacio, qué pasa al cancelar, si se vende en otros productos) y los pasos
>   3, 4 y 5 del §6 (cubo, ciclo de vida, cuota).
>
> **Lo que NO desaparece, y hay que resolver igual** — está detallado al final,
> en §8: sigue haciendo falta una ventana de descarga y sigue haciendo falta
> recordar una conversión pagada.

Este documento **no reemplaza a [`ARQUITECTURA-ECOSISTEMA.md`](ARQUITECTURA-ECOSISTEMA.md)**:
ahí vive la decisión de plataforma (Vercel = frontends · Railway = contenedores
y binarios · R2 = objetos · Supabase = solo identidad) y la regla de *un cubo y
un token por producto*. Esto es lo que faltaba: **cuánto cuesta, qué tipos de
almacenamiento hay que no mezclar, y qué hace la competencia.**

Todos los precios están verificados contra las páginas oficiales el 16-ago-2026
(fuentes al final), no de memoria.

> **Punto de partida, comprobado y no supuesto (16-ago-2026):** en R2 hay
> **tres cubos** —`sorsabsa-expedientes`, `condomanager-inmuebles`,
> `justired-registros-oficiales`— y **tres tokens**, uno por cada uno.
> **El Convertidor no tiene nada: ni cubo, ni token, ni un byte guardado.**
> Hoy convierte en memoria y no almacena, así que no es una falta; es
> literalmente el punto cero desde el que se construye todo lo de este
> documento. Verificado con `wrangler r2 bucket list` y contra la pantalla de
> tokens de Cloudflare.

---

## 0 · Lo primero, porque cambia el planteo

**El producto que Gina tomó como referencia no almacena nada.**

- **iLovePDF borra los archivos a las 2 horas.** Su única excepción es la firma
  electrónica, que guarda 5 años por obligación legal (eIDAS).
- **Smallpdf borra en 1 hora** sin cuenta; 24 horas con plan Pro.
- **Smallpdf Pro cuesta ~$9/mes — el mismo precio que el Pro del Convertidor —
  y da 2 GB de espacio.** No 50, no 100: dos.
- **Adobe sí vende espacio (100 GB), y cuando dejás de pagar te baja a 2 GB.**

O sea: en este mercado **el almacenamiento no es el producto, es un accesorio
chico**, y el que lo vende tiene resuelto qué pasa cuando el cliente se va. Los
conversores puros borran rápido a propósito: cada archivo guardado es
responsabilidad legal, no un activo.

Esto **no invalida** la idea de Gina —vender espacio es un negocio legítimo y
diferencia al producto— pero sí fija la vara: **si Smallpdf da 2 GB por $9,
ofrecer 50 GB por $9 no es competir, es regalar.** Y el problema no será el
costo (§3: es bajísimo), será lo de §7.

---

## 1 · Los tres tipos de almacenamiento — la pregunta de Gina

*"una cosa es mi espacio y otra de los clientes por producto"*. Son **tres**
cosas distintas, y la diferencia no es técnica: es de **quién es el dato, quién
paga, y qué pasa el día que alguien se va o pide que lo borren.**

| | **A · Operativo de SORSABSA** | **B · Dato del cliente en custodia** | **C · Espacio vendido como producto** |
| --- | --- | --- | --- |
| Qué es | Lo que el sistema necesita para funcionar | Lo que el cliente sube para que el sistema haga su trabajo | El espacio ES lo que se compró |
| Ejemplo hoy | `justired-registros-oficiales` (leyes raspadas), `sorsabsa-expedientes` (peritajes) | `condomanager-inmuebles` (fotos de unidades) | **No existe todavía** — sería el Convertidor Pro |
| De quién es el archivo | De SORSABSA | Del condominio / la agencia | De la persona |
| Quién lo paga | SORSABSA | Va incluido en la suscripción del producto | Es el producto |
| Si el cliente se va | No aplica | Se entrega o se borra según lo pactado | Cuota reducida o borrado tras N días |
| Si pide "bórrenme todo" | No aplica | Hay que poder hacerlo | Hay que poder hacerlo |
| Crece con | El negocio de Gina | La cantidad de clientes | **Sin techo, salvo que se le ponga** |

### La regla que sale de esta tabla

**A y C nunca comparten cubo.** No por prolijidad: A es el registro del negocio
de Gina —lo tiene que conservar— y C es dato personal de un tercero —lo tiene
que poder borrar a pedido—. En el mismo cubo, "borrar los datos de este
cliente" es una operación peligrosa; en cubos separados es una operación
aburrida, que es como tienen que ser las operaciones peligrosas.

Es la extensión natural de la regla que ya existe en
`ARQUITECTURA-ECOSISTEMA.md` (*"un token por producto — no se comparten"*),
nacida del intento de que SorsabsaForensic usara el token de CondoManager.
Mismo razonamiento, un nivel más adentro.

---

## 2 · Método: dónde va cada cosa, y por qué

### Railway y R2 no compiten — hacen cosas distintas

| | **Volumen de Railway** | **R2** |
| --- | --- | --- |
| Almacenamiento | **$0,00216 / GB-mes** (7× más barato) | $0,015 / GB-mes |
| Salida de datos (egress) | **$0,05 / GB** | **Gratis** |
| Escrituras | incluido | $4,50 / millón (Clase A) |
| Lecturas | incluido | $0,36 / millón (Clase B) |
| Alcance | Atado a UN contenedor | Global, con URL firmada |

**Dónde está el cruce:** guardar 1 GB en Railway ahorra $0,0128/mes frente a
R2. **Descargarlo UNA vez cuesta $0,05.** O sea, si un archivo se baja aunque
sea una vez cada cuatro meses, R2 ya salió más barato. Para documentos que la
gente descarga, R2 gana siempre.

**Conclusión, que es exactamente lo que propuso Gina:** Railway para
**procesar** (área de trabajo temporal que nunca sale del contenedor), R2 para
**guardar**. El volumen de Railway no es un competidor de R2: es el escritorio
donde el motor abre el archivo mientras lo convierte.

### El detalle que además destraba el bloqueo de los 50 MB

En [`PENDIENTES-ECOSISTEMA.md`](PENDIENTES-ECOSISTEMA.md) 21-bis quedó anotado
que **Vercel corta el cuerpo de la petición en ~4,5 MB** (medido: 4 MB pasa,
5 MB da `413`), así que el plan Pro promete 50 MB y por esa ruta no entran ni 5.

**Subir directo del navegador a R2 con URL firmada no pasa por Vercel, así que
no tiene ese techo.** El patrón ya existe en el ecosistema: CondoManager hace
*presign + PUT directo del navegador* desde el 08-ago-2026.

O sea que la idea de Gina resuelve dos cosas a la vez, y por eso conviene
tratarlas juntas y no como dos proyectos.

⚠️ **Pero ojo con el plan gratis:** si el archivo de ≤5 MB sigue subiendo por
`/api/convert` en Vercel, **se rompe en 4,5 MB igual**. El camino gratis
también tiene que dejar de pasar por Vercel — sube directo al motor de Railway
o a R2. Y hoy `api.convertidor.sorsabsa.com` **no pide credencial ninguna**
(verificado: responde `422` a un POST sin archivo, no `401`), así que abrirlo al
navegador exige ponerle autenticación primero. Eso no es opcional.

### Cómo quedan los cubos

Un cubo por finalidad, no por cliente. **R2 admite hasta 1.000.000 de cubos**,
así que cubo-por-cliente es posible — y es mala idea igual: los tokens de R2 se
limitan **a nivel de cubo**, no de prefijo, así que un cubo por cliente
significa un token por cliente, y eso no se administra. La recomendación de
Cloudflare para multi-tenant es **prefijo por cliente dentro de un cubo**.

```text
convertidor-clientes/          ← tipo C: espacio vendido
    u/<userId>/…                 espacio permanente del suscriptor
    tmp/<userId>/<pagoId>/…      pago único: se borra a los 5 días

sorsabsa-expedientes/          ← tipo A: de Gina (ya existe)
justired-registros-oficiales/  ← tipo A: de Gina (ya existe)
condomanager-inmuebles/        ← tipo B: custodia (ya existe)
```

**Consecuencia que hay que saber, no asumir:** como el token es por cubo y no
por prefijo, **lo único que impide que un cliente lea la carpeta de otro es el
código de la aplicación.** Es aceptable con URLs firmadas emitidas en el
servidor —cada firma habilita un objeto concreto y caduca—, pero deja de serlo
el día que se le entregue la credencial de R2 a un cliente o al navegador. No
hacer eso.

### El borrado a los 5 días se hace solo

R2 tiene **reglas de ciclo de vida por prefijo** (hasta 1000 por cubo): se
declara una vez sobre `tmp/` con vencimiento a 5 días y R2 borra sin que nadie
corra un cron. Borrar no cuesta nada.

**Matiz que hay que decir en la letra chica del producto:** el borrado es
*eventual*, no al minuto — Cloudflare borra **dentro de las 24 h** siguientes al
vencimiento. Se promete "5 días", no "5 días exactos".

**Sin esta regla, "5 días" se convierte en "para siempre" por accidente**, que
es el modo en que estas cosas fallan de verdad: nadie nota que no se borró.

---

## 3 · Cuánto cuesta — las cuentas hechas

R2 regala por mes: **10 GB de almacenamiento, 1 millón de escrituras, 10
millones de lecturas.** Las cuentas de abajo ya descuentan esos 10 GB.

### El pago único (retención 5 días): cuesta nada

Un archivo de 20 MB guardado 5 días = 20 MB × (5/30) = 0,0033 GB-mes
→ **$0,00005 por archivo.**

**Mil archivos de esos al mes cuestan $0,05.** Y esas mil subidas son mil
operaciones Clase A, contra el millón gratis. **El almacenamiento del pago único
es económicamente irrelevante.** Lo que cuesta ahí es el cómputo del OCR en
Railway, no el disco.

### El espacio permanente por suscriptor: la regla de bolsillo

A $9/mes por suscriptor y $0,015/GB-mes:

> **Cada GB que se le regala a un suscriptor cuesta el 0,17% de su suscripción.**
> 6 GB ≈ 1%. 60 GB ≈ 10%.

En plata, según cuánto espacio se ofrezca:

| Espacio por suscriptor | 10 subs | 50 subs | 200 subs | % de los ingresos |
| --- | --- | --- | --- | --- |
| **2 GB** (lo que da Smallpdf) | $0,15 | $1,35 | $5,85 | ~0,3% |
| **10 GB** | $1,35 | $7,35 | $29,85 | ~1,7% |
| **25 GB** | $3,60 | $18,60 | $74,85 | ~4,2% |
| **50 GB** | $7,35 | $37,35 | $149,85 | ~8,3% |

*(Ingresos: $90, $450 y $1.800/mes respectivamente.)*

**Lectura honesta de esta tabla: el costo no es el problema.** Incluso
regalando 50 GB, el almacenamiento se come menos del 9% de la suscripción. Con
el presupuesto de hoy (cero clientes, sin ingresos), **cualquiera de estas
filas es prácticamente gratis en términos absolutos.**

Por eso la decisión de cuánto espacio ofrecer **no se toma por costo — se toma
por posicionamiento** (§0: Smallpdf da 2 GB por el mismo precio) **y por §7.**

---

## 4 · Lo que sí puede doler: el que paga un mes y se va

Es el único riesgo económico real, y no aparece en la tabla de arriba porque no
es un costo por mes: **es un pasivo que no se apaga.**

Alguien paga $9, sube 20 GB, cancela. El ingreso se terminó; el archivo sigue
ahí. A $0,015/GB-mes son $0,30/mes **para siempre**: a los 30 meses ese cliente
pasó a costar más de lo que pagó, y sigue sumando.

Adobe resuelve esto de forma explícita y vale copiarlo: **al cancelar, la cuota
baja a 2 GB** (de 100). No borra: reduce, y avisa. La persona conserva acceso a
lo esencial y tiene un motivo para volver o para bajarse sus archivos.

**Sin una regla de cancelación escrita, el espacio vendido es el único
componente del ecosistema cuyo costo crece para siempre con clientes que ya no
pagan.**

---

## 5 · Lo que hay que decidir

Ninguna es técnica; las cuatro son de negocio y son de Gina.

| # | Decisión | Opciones | Recomendación |
| --- | --- | --- | --- |
| 1 | **Cuánto espacio incluye el Pro** | 2 GB (paridad con Smallpdf) · 10 GB · 25 GB+ | **10 GB.** Cuesta 1,7% de la suscripción, supera claramente a Smallpdf y sigue siendo un número que se puede sostener |
| 2 | **Qué pasa al cancelar** | Borrar a los N días · Bajar la cuota (Adobe) · Dejar todo | **Bajar la cuota**, con aviso por `notificaciones-sorsabsa` antes. Es lo que cierra §4 |
| 3 | **Precio del pago único** | por archivo · por tramo de tamaño | **Por archivo, precio único.** El costo real no depende del tamaño (§3); cobrar por tramos complica la venta sin reflejar nada |
| 4 | **Si el espacio se vende también en los otros productos** | Solo Convertidor · Todo el ecosistema | **Solo Convertidor por ahora.** Los demás tienen almacenamiento tipo B (custodia), que es otra cosa y ya está incluido |

---

## 6 · Qué hay que construir, en orden

El orden importa porque cada paso destraba el siguiente:

1. ✅ **Autenticar el motor de Railway — HECHO 16-ago-2026**
   (`convertidor@1d38b2a`, `legaltech@4279fbc`). `POST /convert` exige
   `Authorization: Bearer` y **falla cerrado**: sin `CONVERTIDOR_API_KEY` en el
   servidor, toda petición muere con 500 en vez de dejar el motor abierto.
   `GET /` sigue sin credencial porque es el healthcheck de Railway.

   Verificado contra producción: sin credencial `401`, con credencial
   incorrecta `401`, con la correcta convierte, y la web sigue funcionando
   porque Vercel manda la cabecera sola. Variable cargada en Railway y en
   Vercel (sensible, nunca `NEXT_PUBLIC_`).

   **Falta una sola cosa, y no la puedo hacer yo** (el token de GitHub da 403
   sobre Actions secrets): crear el secreto `CONVERTIDOR_API_KEY` en
   `ginaproanio/legaltech`, con el mismo valor que la variable del servicio
   CONVERTIDOR en Railway. Sin eso, el scan de JustiRed de las 08:00 UTC
   convierte cero documentos y lo dice con 401 en el log.
2. **Subida directa con URL firmada** (patrón de CondoManager). Es lo que
   elimina el techo de 4,5 MB de Vercel — sin esto, nada de lo demás sirve.
3. **Cubo `convertidor-clientes` + su token propio** (a mano en el panel de
   Cloudflare: `wrangler` no puede emitir tokens, ver ARQUITECTURA §R2).
4. **Regla de ciclo de vida sobre `tmp/` a 5 días.**
5. **Cuota por suscriptor**, verificada en el servidor. Mismo criterio que el
   plan: el cliente no decide cuánto espacio tiene.
6. **Webhook de pago → crédito**, que es la Decisión 2 de 21-bis y ahora tiene
   dónde apoyarse.

---

## 7 · El riesgo que no es de costo, y es el más grande

**Guardar documentos ajenos es una responsabilidad, no un activo.**

iLovePDF borra a las 2 horas por diseño, y no es tacañería: **es el archivo que
no tenés el que no te pueden pedir, filtrar ni obligar a entregar.** Cada
archivo que el Convertidor conserve entra en un régimen distinto al de una
herramienta que convierte y olvida.

Y en este ecosistema el contenido no es cualquiera: por el Convertidor pasan
**escritos judiciales (JustiRed), evidencia pericial (SorsabsaForensic) e
informes de inspección (IOT)**. Un espacio permanente para esos documentos
implica, como mínimo:

- Poder responder "bórrenme todo" y demostrar que se hizo.
- Cifrado y control de quién accede — hoy la separación entre clientes la
  sostiene solo el código de la aplicación (§2).
- Saber qué obliga la **LOPDP** ecuatoriana sobre datos personales en custodia,
  y qué pasa si un tercero los reclama judicialmente.

**Esto no lo puedo decidir yo y no es una opinión técnica**: es lo que hay que
consultar antes de prometer alojamiento permanente de documentos legales.
Vender 10 GB es fácil; responder por lo que hay adentro es el negocio de
verdad. Gina trabaja en legaltech, así que es la persona indicada para medirlo —
pero tiene que medirlo **antes** de anunciar el espacio, no después.

---

## Fuentes

Verificadas el 16-ago-2026:

- [Cloudflare R2 — Pricing](https://developers.cloudflare.com/r2/pricing/) — $0,015/GB-mes, egress gratis, Clase A $4,50/M, Clase B $0,36/M, capa gratuita 10 GB + 1M + 10M.
- [Cloudflare R2 — Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) — reglas por prefijo, máx. 1000 por cubo, borrado dentro de 24 h del vencimiento.
- [Cloudflare R2 — API tokens](https://developers.cloudflare.com/r2/api/tokens/) — alcance **por cubo, no por prefijo**.
- [Cloudflare — Data isolation para SaaS](https://developers.cloudflare.com/use-cases/saas/data-isolation) — prefijo por cliente como patrón recomendado; límite de 1.000.000 de cubos por cuenta.
- [Railway — Pricing](https://railway.com/pricing) — volúmenes $0,00216/GB-mes, egress $0,05/GB, cómputo $0,0278/vCPU-h.
- [Is iLovePDF Safe? 2026 Privacy Review](https://www.raptorpdf.com/blog/is-ilovepdf-safe-privacy-review.html) y [gethonestpdf](https://www.gethonestpdf.com/blog/is-ilovepdf-safe-for-confidential-documents) — borrado a las 2 h; excepción de 5 años para firma electrónica (eIDAS).
- [Is Smallpdf Safe in 2026?](https://www.gethonestpdf.com/blog/is-smallpdf-safe-2026) y [RaptorPDF](https://www.raptorpdf.com/blog/is-smallpdf-safe-privacy-review.html) — borrado en 1 h sin cuenta.
- [Smallpdf — Pricing 2026](https://pricingnow.com/question/smallpdf-pricing/) — Pro ~$9/mes con **2 GB** y retención de 24 h.
- [Adobe Cloud Storage Pricing 2026](https://josephnilo.com/blog/adobe-cloud-storage-pricing-explained/) y [Adobe Document Cloud FAQ](https://helpx.adobe.com/document-cloud/faq.html) — 100 GB incluidos; **al cancelar baja a 2 GB**.

> Los precios de plataforma salen de la documentación oficial. Los datos de
> iLovePDF/Smallpdf/Adobe salen de reseñas y comparativas de 2026, no de sus
> políticas de privacidad leídas de punta a punta: sirven para fijar el orden de
> magnitud del mercado, y conviene confirmarlos en la fuente antes de usarlos en
> material comercial comparativo.

---

## 8 · Lo que la decisión de "no guardar" NO resuelve

Añadido el 16-ago-2026, después de la decisión de arriba. Son dos cosas que
suenan a almacenamiento pero no lo son, y por eso no se van con él.

### 8.1 · "Se descarga y se borra" igual necesita una ventana de descarga

Entre que el motor termina y que la persona hace clic en *Descargar* pasa
tiempo: la conversión de un PDF escaneado grande con OCR **no termina dentro de
una petición HTTP**. Alguien cierra la pestaña, vuelve, el celular pierde
señal. Así que hay que responder: **¿cuánto tiempo vive el resultado?**

Eso **no es vender espacio** — es el mismo *"borramos a las 2 horas"* de
iLovePDF, que no es una política de almacenamiento sino la ventana de descarga.
Guardarlo cero minutos no es una opción: obliga a que la descarga sea parte de
la misma petición y hace que un corte de red pierda una conversión ya pagada.

Recomendación: **1 hora, borrado automático por regla de ciclo de vida.** Es la
más corta del mercado comparable (iLovePDF 2 h, Smallpdf 1 h sin cuenta) y
mantiene la promesa que Gina quiere hacer: *no nos quedamos con tu documento*.

Costo: nulo. Un resultado de 20 MB durante 1 hora son 0,000027 GB-mes,
$0,0000004. No es una cifra que haya que optimizar.

Dónde: un cubo `convertidor-transito` con la regla de vida más corta que R2
permite, **o** el volumen de Railway si la descarga sale por el mismo motor
(ahí el egress de $0,05/GB sí cuenta, pero a 20 MB por conversión son $0,001).
La diferencia es menor; se elige junto con §6 paso 2.

**Un cubo de tránsito no contradice la decisión: está vacío por diseño.** Nadie
tiene "su carpeta", no hay cuota, no hay qué devolver al cancelar y no hay dato
que borrar a pedido, porque a la hora ya no está.

### 8.2 · Una conversión pagada hay que recordarla

La Decisión 2 de [`PENDIENTES-ECOSISTEMA.md`](PENDIENTES-ECOSISTEMA.md) 21-bis
**se achica muchísimo pero no desaparece**: ya no es "dónde viven los archivos
del cliente" sino **"cómo se recuerda que esta persona pagó una conversión que
todavía no usó"**.

Sigue haciendo falta porque el pago vuelve por una redirección y la conversión
ocurre después. Y sobre todo porque **la conversión puede fallar**: sin nada
anotado, un cobro aprobado seguido de un OCR que revienta deja a la persona
pagando por nada y a Gina atendiendo el reclamo a mano. Es exactamente la
objeción que este documento ya le hacía a la opción "se paga y se convierte en
el acto".

Pero lo que hay que guardar ahora es **una fila diminuta** —quién, cuánto pagó,
si ya la usó— no archivos. Eso cabe en el Supabase que el producto ya usa para
identidad y **no necesita cubo, ni token de R2, ni cuota, ni ciclo de vida.**

### 8.3 · Con esto, "capacidad de conversión" tiene un costo que sí crece con el uso

El almacenamiento se pagaba por mes y crecía con los clientes **aunque no
usaran nada**. El cómputo se paga por segundo y crece **con el uso real**: un
plan Pro "sin límite de conversiones" es una promesa cuyo costo sube cuando el
cliente la aprovecha. A los precios de Railway ($0,0278/vCPU-hora) un OCR de
cinco minutos cuesta $0,0023 y hacen falta ~3.900 conversiones de esas para
gastar los $9 de una suscripción, así que **hay muchísimo margen** — pero el
riesgo cambia de forma: ya no es el que se va, es el que se queda y usa mucho.

Y por eso el paso 1 del §6 —**autenticar el motor de Railway**— deja de ser
higiene y pasa a ser lo que protege el margen: hoy `api.convertidor.sorsabsa.com`
acepta cualquier POST sin credencial, así que el cómputo que ahora ES el
producto está abierto a quien encuentre la URL.
