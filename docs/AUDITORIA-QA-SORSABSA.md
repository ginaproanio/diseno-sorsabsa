# Auditoría — qa_sorsabsa

**Abierta y cerrada:** 10-ago-2026, en la misma sesión. **Regla que
gobierna esta auditoría:** [ESTANDAR-DESARROLLO.md](./ESTANDAR-DESARROLLO.md).

**Por qué existe:** Gina, después de ver que `qa_sorsabsa` era el único
repo del ecosistema sin grafo de conocimiento (`/graphify` corre por CI en
los otros 11, automático desde el 18-jul): *"vamos a auditar el
qa-sorsabsa, como esta es bastante simplona la auditoria, necesito ese qa
que mejore"* → *"audita y corrije a la vez"*.

**Método:** se montó `graphify` sobre el repo por primera vez (AST del
único archivo de código + extracción semántica de README.md/TODO.md/
qa.yml). El grafo, sin que se le pidiera nada más, marcó 5 nodos
`DISCREPANCY` — README.md y TODO.md tienen aristas `conflicts_via` hacia
las mismas 4 discrepancias, cada uno por su lado, señal de dos documentos
editados por separado que nunca se reconciliaron. A partir de ahí se
verificó cada hallazgo contra el código real de los 4 productos
(`condomanager`, `crm_inmobiliario/webs`, `agente24siete`, `legaltech`) y
en vivo contra producción (`curl`), no contra lo que decía cualquiera de
los dos documentos.

**Alcance:** `qa_sorsabsa` completo — `runner/run.mjs`, los 5
`checks/*.http` (18 checks), `.github/workflows/qa.yml`, `README.md`,
`TODO.md`.

---

## 🟠 MEDIO

### 🟠-1 — ✅ CORREGIDO 10-ago-2026 — La tabla de README.md no sumaba porque el conteo de DomusCRM estaba mal

`README.md` decía "DomusCRM: 5 checks" y un total de "18 checks" — pero
3+5+3+6+1+1 = 19, no 18. El grafo lo marcó como
`DISCREPANCY: README's own table doesn't add up`. Verificado contra el
archivo real (`grep -c '^###' checks/*.http`): DomusCRM tiene **4**
checks, no 5. Con 4 la tabla suma 18, que además coincide con el conteo
real de los 5 archivos (`3+4+3+6+2=18`) y con lo que corre de verdad en
producción (`node runner/run.mjs` → `18/18 en verde`, verificado en esta
misma auditoría). Corregido: la fila de DomusCRM ahora dice 4.

### 🟠-2 — ✅ CORREGIDO 10-ago-2026 — El bloque de estado de TODO.md describía un repo de hace 3 semanas, no el actual

El encabezado de `TODO.md` decía "12 checks sobre los 3 productos" y
"Productos cubiertos: CondoManager, DomusCRM y Agente24Siete" — sin
JustiRed, que tiene su propio archivo (`checks/justired.http`, 6 checks)
y aparece en README.md desde antes. El árbol de arquitectura de la
sección 4 tampoco listaba `justired.http` ni `ecosistema.http` (2 de los
5 archivos reales). Y la nota de calibración de pagos apuntaba a
`pagos-sorsabsa.vercel.app` — cierta el 17-jul-2026 cuando se escribió,
pero **pagos-sorsabsa migró de Vercel a Railway el 30-jul-2026**
(`ARQUITECTURA-ECOSISTEMA.md` §3, verificado ahí y en vivo con `curl` a
`pagos-sorsabsa-production.up.railway.app/api/crear-trial` → `401` como
se espera). El propio `runner/run.mjs` y `checks/ecosistema.http` ya
usaban el host de Railway — el código estaba al día, TODO.md no.

Es un riesgo real, no solo estético: la sección 8 de TODO.md le dice a
una futura sesión de IA que abra este archivo para "retomar esto en la
máquina nueva" — si el estado que lee ahí está desactualizado, arranca
con un mapa equivocado de qué ya existe. Corregido: bloque de estado,
"Productos cubiertos" y árbol de arquitectura actualizados; se agregó una
nota explícita de que el conteo por producto vive en README.md (una sola
fuente viva) para que estos dos documentos no vuelvan a desincronizarse
en silencio.

### 🟠-3 — ✅ CORREGIDO 10-ago-2026 — Un check de JustiRed aceptaba que el servidor reventara como resultado "válido"

`checks/justired.http`, check "Biblioteca Legal: ID inexistente no
revienta el servidor (404 es válido)": el assert era
`status in 404,500`. El propio nombre del check dice que un 500 (el
servidor reventando) es justo lo que se quiere detectar — pero el assert
lo aceptaba como resultado correcto, así que si JustiRed empezara a
devolver 500 en vez de 404 para un ID inexistente, este QA **nunca lo
vería como fallo**. Verificado en vivo antes de tocar nada
(`curl .../ley/00000000-...` → `404` en producción ahora mismo), así que
apretar el assert no iba a romper la próxima corrida. Corregido:
`status == 404` únicamente. Confirmado con una corrida completa del
runner después del cambio: `18/18 en verde`.

---

## Verificado, sin hallazgos

Los 18 checks (los 5 archivos completos) se revisaron uno por uno contra
el código real de cada producto — no solo contra lo que decían los
documentos:

- **CondoManager** (`condomanager.http`, 3): `/api/notificaciones` y
  `/api/webhooks/pagos-sorsabsa` existen en el repo real
  (`app/api/notificaciones/route.ts`, `app/api/webhooks/pagos-sorsabsa/route.ts`).
- **DomusCRM** (`domuscrm.http`, 4): `/api/geo` (24 provincias) y la
  puerta cerrada de `ecoinmobiliaria.domuscrm.app/api/properties` (401)
  responden como se espera.
- **Agente24Siete** (`agente24siete.http`, 3): las rutas usan Pages
  Router (`pages/api/admin/leads.js`, `pages/api/portal/dashboard.js`,
  no App Router — por eso una primera búsqueda en `app/api` no las
  encontraba). El texto exacto `"Autenticación requerida"` que el check
  busca en el body del 401 sale literal de `lib/adminAuth.js`.
- **JustiRed** (`justired.http`, 6): las 4 Edge Functions que prueba
  (`justired-payments-iniciar`, `justired-notifications-listar/
  -marcar-leida/-marcar-todas-leidas`) existen y están desplegadas en
  `legaltech/supabase/functions/`.
- **Transversales** (`ecosistema.http`, 2): `auth.sorsabsa.com/auth/login`
  y el rechazo sin clave de `pagos-sorsabsa` (`"No autorizado"`, texto
  literal de `lib/auth.js::autenticarProducto`) verificados en código y
  en vivo.
- **Contrato de hosts** (`runner/run.mjs::HOSTS_PERMITIDOS`): los 8 hosts
  declarados cubren exactamente los hosts usados en los 5 `.http` — sin
  huecos ni entradas muertas.

Corrida completa del runner al cierre de esta auditoría: **18/18 en
verde**, incluido el check recién endurecido.

---

## Recomendación, no ejecutada — pendiente de que Gina decida

Nada obliga hoy a que README.md y TODO.md digan lo mismo — por eso
se desincronizaron sin que nadie lo notara durante semanas. La corrección
de esta auditoría deja una nota explícita ("el conteo vive en README.md"),
pero eso depende de que la próxima persona (o sesión de IA) la respete.
Una opción más dura sería un check de CI que compare el total de
`grep -c '^###' checks/*.http` contra el número que dice README.md y
falle el build si no coinciden — no se construyó porque es una decisión
de alcance (¿vale la pena un guard más para un repo de 4 archivos de
texto?) que le corresponde a Gina, no algo para meter sin que lo pida.
