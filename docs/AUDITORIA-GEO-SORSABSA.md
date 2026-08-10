# Auditoría — geo-sorsabsa

**Abierta:** 10-ago-2026. **Regla que gobierna esta auditoría:**
[ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md) — ningún hallazgo se
corrige sin presentar antes el análisis de 9 puntos.

**Por qué existe:** continuación de la auditoría del inventario de
Railway (mismo día) — Gina: *"ahora audita geo-sorsabsa."*

**Alcance:** `geo-sorsabsa/service/` (el servicio HTTP en Railway —
`main.py`, `geo_core.py`) y sus dos consumidores reales (`iot`,
`SorsabsaForensic`). `@sorsabsa/geo` (el paquete npm, `src/`,
`<LocationPicker>`) es un widget de UI sin relación con este servicio —
no auditado, no lo necesita.

---

## 🔴 CRÍTICO

### 🔴-1 — ⬜ `/resolver` acepta cualquier URL, sin dominio permitido ni autenticación — SSRF real, sin control de abuso

**1. Síntoma:** `POST /resolver` recibe `{"entrada": "<cualquier texto>"}`.
Si `entrada` empieza con `http://`/`https://`, el servicio hace una
petición HTTP real desde el servidor de Railway hacia esa URL, sigue
hasta 8 redirecciones, y devuelve la cadena completa. No hay ninguna
verificación de que la URL sea de Google Maps.

**2. Causa inmediata:** `geo_core.py::resolver_punto()` — la única
condición antes de llamar a `resolver_enlace(crudo)` es
`crudo.lower().startswith(("http://", "https://"))`. `main.py::resolver()`
tampoco valida el dominio. Ninguno de los dos endpoints
(`/resolver`, `/distancia`) exige autenticación de ningún tipo — ni
API key, ni verificación de origen.

**3. Causa raíz:** el servicio se diseñó (con razón) para NO acoplarse a
qué es un "producto" (mismo principio que `pagos-sorsabsa`: "este
servicio sigue sin saber qué es un condominio"), pero terminó sin
ninguna de las dos protecciones que sí tiene el resto de los servicios
compartidos del ecosistema: **`pagos-sorsabsa` exige una `PAGOS_API_KEY`
por producto** (`autenticarProducto`, `lib/auth.js`) — `geo-sorsabsa` no
exige nada equivalente. Es el único servicio transversal del ecosistema
sin autenticación.

**4. Componente responsable:** `geo-sorsabsa/service/main.py` (la capa
HTTP, donde debe vivir tanto la autenticación como la validación de
dominio — `geo_core.py` es lógica pura, no debería tener que saber de
llaves ni de quién llama).

**5. Código afectado:** `main.py` (los dos endpoints), `geo_core.py::
resolver_punto`/`resolver_enlace` (el fetch en sí).

**6. Fix propuesto (NO ejecutado):**

1. **Dominio permitido, antes que nada** — `resolver_enlace` solo debe
   seguir URLs cuyo host (o el de cada salto de redirección) sea
   `google.com`/`maps.google.com`/`maps.app.goo.gl`/`goo.gl` (los dominios
   reales que emite Google Maps al compartir un enlace) — no cualquier
   `http(s)://`. Esto cierra el SSRF de raíz: aunque alguien mande
   `http://169.254.169.254/...` o una URL interna de Railway, el
   servicio la rechaza antes de intentar pedirla.
2. **Autenticación**, mismo patrón que `pagos-sorsabsa`
   (`autenticarProducto`/`PAGOS_API_KEY_<PRODUCTO>`) — una llave por
   consumidor (`iot`, `SorsabsaForensic`, y `domuscrm` cuando se conecte,
   ver `ARQUITECTURA-ECOSISTEMA.md`), no una llave única compartida.
3. Ninguno de los dos cambios rompe a los consumidores actuales — ambos
   ya mandan enlaces reales de Google Maps; solo hay que agregar el
   header `Authorization` en `iot/report_service.py` y en
   `SorsabsaForensic/.../georeferencia/processor.py`.

**7. Código a eliminar:** ninguno — el fix es aditivo.

**8. Riesgo de regresión:** bajo si se hace en dos pasos (primero
autenticación con período de gracia/aviso, después bloquear sin llave) —
alto si se corta en seco sin coordinar el despliegue de los dos
consumidores al mismo tiempo. Requiere secuenciar los 3 repos
(`geo-sorsabsa`, `iot`, `SorsabsaForensic`), no es un cambio de un solo
archivo.

**9. Validación:** confirmar que una URL fuera del allowlist de dominio
se rechaza con 4xx sin intentar la petición HTTP (probarlo con una URL a
un servicio interno, no a internet real), y que los dos consumidores
reales siguen funcionando con la llave nueva.

---

## 🔵 BAJO

### 🔵-1 — ✅ CORREGIDO 10-ago-2026 — El propio README del servicio decía que nadie lo consumía, dato desactualizado desde el 08-ago

`geo-sorsabsa/service/README.md` tenía, sin fecha de corrección: *"⏳ Sin
repuntar ningún consumidor todavía. Ni SorsabsaForensic ni iot llaman a
este servicio."* — **contradecía directamente**
`ARQUITECTURA-ECOSISTEMA.md`, que ya documentaba (con commits reales)
que los dos SÍ lo consumen desde el 08-ago-2026. Verificado con el
código, no con ninguno de los dos textos: `iot` commit `49548dd`
(`report_service.py`, confirmado activo hoy) y `SorsabsaForensic`
(`core/processors/georeferencia/processor.py`, confirmado activo hoy)
llaman de verdad a `GEO_SERVICE_URL`. El README nunca se actualizó
después de cerrar la integración — exactamente el tipo de "dos fuentes
que no coinciden" que pide reportarse. Corregido en el mismo commit que
esta auditoría (`geo-sorsabsa/service/README.md`).

---

## Resuelto, verificado, no tocar

- **La integración con los dos consumidores es correcta y bien
  diseñada:** tanto `iot` como `SorsabsaForensic` llaman al servicio con
  un `try/except` que degrada con gracia (si el servicio no responde,
  el informe sigue con la URL visible en vez de mapa — el mapa es un
  plus, no un dato del que dependa la actuación pericial). No es un
  fallo-abierto peligroso: lo que se degrada es una imagen decorativa,
  no el contenido jurado del informe.
- **El bug real de `UnicodeEncodeError`** (URLs con tilde/ñ sin
  percent-encoding) ya está corregido en `geo-sorsabsa` — no portado de
  vuelta a `SorsabsaForensic` todavía, decisión ya documentada y
  aceptada, no un olvido.
- **`GOOGLE_MAPS_API_KEY` centralizada** — propuesta en
  `ARQUITECTURA-ECOSISTEMA.md` como "si conviene", nunca construida.
  Sigue solo en `iot`, para la Static Maps API (generar la imagen), un
  problema distinto de resolver coordenadas — no es duplicación con
  `geo-sorsabsa`, que nunca genera imágenes.
- **`@sorsabsa/geo` (paquete npm)** no tiene relación con este servicio
  ni con este hallazgo — no se tocó.

## Pendiente de decidir con Gina antes de ejecutar

- 🔴-1 necesita coordinar 3 repos (`geo-sorsabsa` + los 2 consumidores) —
  no es un fix de un archivo, aunque el cambio en sí sea chico.
- Al conectar DomusCRM a `geo-sorsabsa` (ya pendiente, ver
  `ARQUITECTURA-ECOSISTEMA.md`), debería nacer YA con autenticación —
  no agregarla después como un tercer consumidor sin llave.
