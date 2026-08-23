# Grafo de conocimiento (graphify) generado por CI

> Infraestructura del ecosistema SORSABSA. Montado el 18 jul 2026.
> Reemplaza los hooks locales (dependían de una máquina, se apagaban en
> silencio) por generación en la nube (GitHub Actions).

## Qué es

Cada repo de código genera un **grafo de conocimiento** (nodos = funciones/
archivos/componentes, aristas = llamadas/imports/contención) con
[graphify](https://github.com/safishamsi/graphify) (paquete PyPI: `graphifyy`,
se importa como `graphify`). Sirve para navegar la arquitectura y detectar si
algo quedó desconectado, imports rotos o referencias huérfanas tras un cambio.

Es **estructural (AST)**: valida la topología del código, NO regresiones
visuales/runtime (eso lo cubren pruebas/verificación en navegador).

## Por qué CI y no un hook local

El modelo anterior (hook `post-commit` en cada máquina) tenía 3 fallas:
1. Corría solo en la máquina de quien lo instaló.
2. `graphify-out/` estaba gitignored → el grafo nunca salía de ese disco.
3. Si el hook se rompía, se apagaba **en silencio** (un repo estuvo con el
   grafo congelado varios días sin que nadie lo notara).

La solución (este setup): **GitHub Actions** genera el grafo en la nube en cada
push, lo **commitea de vuelta al repo**, y **falla ruidosamente** si algo se
rompe.

> **Precisión (23-ago-2026):** este documento decía "❌ + correo". **Ninguno de
> los 9 workflows tiene un paso de correo** — se comprobó uno por uno. El aviso
> por mail es la notificación que GitHub manda por defecto al dueño del repo
> cuando un workflow falla, que depende de la configuración de la cuenta y no
> de nada que esté escrito acá. No es lo mismo que un aviso configurado, como
> sí lo tienen los checks de conformidad y de modales.

## Cómo funciona

Workflow: [`.github/workflows/graphify.yml`](../.github/workflows/graphify.yml).
En cada push a `main` (o `workflow_dispatch` manual):

1. `pip install graphifyy`
2. `python -m graphify update <root>` — re-extrae el AST (sin LLM, sin API key).
3. Commitea `graph.json` + `GRAPH_REPORT.md` de vuelta, con `[skip ci]` en el
   mensaje para no entrar en loop. El push reintenta con `git rebase -X ours`
   si `main` avanzó (pushes concurrentes) — el grafo recién regenerado es
   canónico.
4. (Solo repos públicos) publica `graph.html` a **GitHub Pages**.

`PYTHONHASHSEED=0` hace el clustering determinista → grafo reproducible.

## Convención de `.gitignore`

Se **versiona** `graph.json` + `GRAPH_REPORT.md`; se **ignora** todo lo demás
(la viz `graph.html` va a Pages, no al repo; caché, manifest, backups y las
rutas de máquina `.graphify_*`):

```gitignore
# repos con grafo en la raíz:
graphify-out/*
!graphify-out/graph.json
!graphify-out/GRAPH_REPORT.md

# domuscrm, cuyo grafo vive en webs/ (patrón nivel-agnóstico):
**/graphify-out/*
!webs/graphify-out/graph.json
!webs/graphify-out/GRAPH_REPORT.md
```

> Nota gitignore: `graphify-out/*` (con `/` en medio) queda **anclado a la
> raíz**; NO alcanza subdirectorios. Por eso domuscrm usa `**/graphify-out/*`.

## Estado por repo

**Verificado en disco y contra la API de GitHub el 23-ago-2026.** La tabla
anterior estaba vencida: **no listaba a JustiRed**, daba a `qa_sorsabsa` como
"sin grafo" cuando lo tiene desde hace tiempo, y no mencionaba al Convertidor.

| Repo | Visibilidad | Root del grafo | Workflow | ¿Al día? |
|---|---|---|---|---|
| diseno-sorsabsa | **pública** | `.` | ✅ + Pages | ✅ |
| condomanager | privada | `.` | ✅ | ✅ |
| domuscrm (`crm_inmobiliario`) | privada | **`webs/`** ⚠️ | ✅ | ✅ |
| legaltech (JustiRed) | privada | `.` | ✅ | ✅ |
| agente24siete | privada | `.` | ✅ | ✅ |
| auth-sorsabsa | privada | `.` | ✅ | ✅ |
| pagos-sorsabsa | privada | `.` | ✅ | ✅ |
| notificaciones-sorsabsa | privada | `.` | ✅ | ✅ |
| qa_sorsabsa | privada | `.` | ✅ | ✅ |
| **convertidor** | privada | **`frontend/`** ⚠️ | 🔴 **NINGUNO** | 🔴 **grafo de julio** |
| geo-sorsabsa | pública | — | — | sin grafo (1 solo `.tsx`, no lo necesita) |

**"¿Al día?" no se leyó del campo `built_at_commit`**, que miente: graphify no
commitea nada cuando el grafo le sale igual, así que ese campo se queda atrás
en todo arreglo que no mueva símbolos. Leerlo crudo daba **6 de 10
desfasados**; preguntándole a la API si graphify corrió sobre el último commit
de código, la respuesta real es **9 de 10 al día**.

🔴 **El Convertidor no tiene workflow de graphify.** Su grafo existe y está
congelado en julio, lo cual es peor que no tenerlo: figura cubierto. Y ojo al
copiarle el `.yml` a otro repo — **el Convertidor está en `master`, no en
`main`**, así que el `branches: [main]` del template no dispararía.

## Cómo ver el grafo

- **Público (diseno-sorsabsa):** la URL de Pages de arriba, siempre fresca.
- **Privados:** abrir `graph.html` localmente tras `git pull` (se regenera; no
  se versiona). O consultar por CLI sin viz:
  `python -m graphify explain "NombreNodo"` / `python -m graphify path "A" "B"`.

## Añadir Pages a un repo privado (opcional, requiere GitHub Pro)

Pages en repos privados necesita plan pago. Para habilitarlo:

1. Habilitar Pages (source = GitHub Actions) en Settings, o vía API:
   `POST /repos/<owner>/<repo>/pages` con `{"build_type":"workflow"}`.
2. En el workflow, volver a añadir (ver la versión de diseno-sorsabsa como
   referencia):
   - permisos `pages: write` + `id-token: write`
   - forzar regeneración de `graph.html` antes de publicar:
     `rm -f <root>/graphify-out/graph.json <root>/graphify-out/graph.html` antes
     del `update` (si el grafo no cambió, graphify se salta escribir salidas y
     `graph.html` no existiría en un checkout limpio).
   - job `deploy` con `actions/upload-pages-artifact` + `actions/deploy-pages`.

## Bugs resueltos durante el piloto (lecciones)

El workflow se depuró en diseno-sorsabsa (falló 3 veces antes de quedar verde);
el template ya trae los fixes:

1. **Pages no auto-habilita.** `actions/configure-pages` con `enablement: true`
   no siempre puede crear el sitio; hay que habilitar Pages una vez (API/UI).
2. **Write-back frágil.** El `git push` fallaba si `main` avanzaba; se añadió
   reintento con `git rebase -X ours`.
3. **`graph.html` ausente en runs sin cambios.** graphify no reescribe salidas
   si el grafo no cambió; como `graph.html` está gitignored, no existía en el
   checkout. Fix: borrar `graph.json` antes del `update` para forzar
   regeneración completa.

---

## Auditoría del grafo — 23-ago-2026

Gina pidió *"pasearse por el grafo auditando"* para ver si de verdad está
configurado. Está configurado, y funciona en lo que hace. Lo que sigue es lo
que **no** hace, medido, porque es donde se han perdido sesiones enteras
creyendo lo contrario.

### Lo que sí funciona (verificado, no supuesto)

- **9 de 10 repos con el grafo al día**, confirmado preguntándole a la API si
  graphify corrió sobre el último commit de código de cada uno.
- **Cobertura de archivos: 100 %** en condomanager (248), JustiRed (75),
  agente24siete (82), auth-sorsabsa (24) y pagos-sorsabsa (21). Todo archivo
  `.ts/.tsx/.js/.jsx` versionado está en el grafo.
- **Pages solo en el repo público.** La regla que este documento declara se
  cumple: el único público es `diseno-sorsabsa` y es el único con Pages.
- El write-back con `[skip ci]`, el reintento con `rebase -X ours` y
  `PYTHONHASHSEED=0` están en los 9 workflows.

### 🔴 La costura interfaz ↔ API no existe para el grafo

En CondoManager:

| | |
|---|---|
| llamadas `fetch("/api/…")` en el código | **52**, en 32 archivos, 45 rutas distintas |
| aristas del grafo que las representan | **0** |
| archivos de ruta de API presentes como nodo | **41 de 41** |
| aristas `calls` que entran a un handler | 16 — **las 16 del mismo archivo** |

El grafo tiene **los dos extremos de la costura y ninguna cuerda entre ellos**.
`fetch("/api/x")` es una **cadena de texto**, no un import, y el AST no la
sigue.

**La consecuencia medida: las 41 rutas de API aparecen huérfanas. El 100 %.**
Y las 41 están vivas — las llama el navegador. O sea que *"no tiene quien lo
llame"* leído del grafo **no significa nada** para una ruta de API: no hay
señal, solo ruido.

Esto no es teórico. Es exactamente el mecanismo de dos errores reales:

- `/api/marcar-todas` en agente24siete: nombre equivocado, 404 silencioso,
  "marcar todas como leídas" no hacía nada. El grafo no podía verlo.
- Ocho endpoints de agente24siete "sin pantalla que los llame" — algunos lo
  estaban y otros no, y el grafo no distinguía un caso del otro.

> Este documento decía que el grafo sirve para *"detectar si algo quedó
> desconectado… o referencias huérfanas"*. **Para código que se llama por
> import, sí. Para todo lo que cruza por HTTP, no** — y ahí es donde vive la
> arquitectura de este ecosistema.

### 🔴 El SQL no existe para el grafo

En CondoManager hay **44 archivos `.sql`** —más que los `.md`, el tercer tipo
de archivo más común del repo— y **cero** están en el grafo.

Ahí vive la integración con EcoInmobiliaria: `trg_sync_domuscrm` y
`trg_sync_fotos_domuscrm`, triggers de Postgres con `pg_net` y una clave en
Supabase Vault. Es lógica de negocio en producción, funcionando, **invisible
para el grafo, para grep y para las auditorías**.

Es la causa exacta de haber concluido que la integración estaba muerta porque
`lib/domuscrm-sync.ts` no tenía quien lo llamara. Sí tenía: la base.

### 🔴 No hay grafo del ecosistema, y el ecosistema es lo que importa

Son **10 grafos separados, uno por repo**. Las llamadas entre servicios —lo
que de verdad sostiene la arquitectura— no están en ninguno:

| repo | llamadas a otro servicio | destinos |
|---|---|---|
| condomanager | 11 | `PAGOS_URL`, `NOTIF_URL` |
| domuscrm | 6 | `DOMUSCRM_URL`, `SUPABASE_URL` |
| justired | 4 | `NOTIFICACIONES_API_URL`, `PAGOS_API_URL` |
| agente24siete | 1 | `graph.facebook.com` |

**22 encontradas leyendo el código. 0 aristas en cualquier grafo.** Preguntas
como *"¿quién consume `pagos-sorsabsa`?"* o *"¿si cambio este contrato, a
quién rompo?"* —las que uno querría hacerle a un grafo de conocimiento— hoy no
se pueden hacer.

### 🟠 Un solo consumidor, una sola pregunta

En los 10 repos, lo único que lee `graph.json` mediante código es
`src/scripts/conformidad.mjs`, y le hace **una sola pregunta**: *¿este producto
redefine un símbolo que `@sorsabsa/ui` ya exporta?*

Diez repos reconstruyen su grafo en cada push para responder una pregunta. No
está mal que exista; está mal creer que cubre más de lo que cubre.

### 🟡 El 87 % de las aristas son estructura, no comportamiento

En CondoManager: `contains` 1019 + `imports`/`imports_from` 1050 = **2069 de
2386**. Las `calls` son **280 en 248 archivos**. Todas las aristas se declaran
`EXTRACTED` con confianza 1.0, o sea que el grafo **no distingue lo que sabe
de lo que infiere** — no hay forma de pedirle "mostrame solo lo seguro" porque
todo se presenta como seguro.

### Qué haría falta, en orden de valor

1. **Cerrar la costura HTTP.** Ya existe el check "costura interfaz ↔ API" en
   agente24siete: casa cada `fetch("/api/…")` con el archivo de ruta que le
   corresponde. Es la pieza que le falta al grafo, y hoy vive en un solo
   producto. Llevarla a los demás vale más que cualquier otra mejora de acá.
2. **Darle un `graphify.yml` al Convertidor** — recordando que su rama es
   `master`.
3. **Registrar las llamadas entre servicios**, aunque sea a mano: una tabla de
   quién llama a quién es más útil hoy que un grafo cross-repo perfecto.
4. **El SQL.** Mientras no entre, todo lo que viva en triggers hay que
   documentarlo a mano — como se hizo en
   `condomanager/docs/INTEGRACION-ECOINMOBILIARIA.md`.

### La regla que sale de esto

**El grafo responde bien "¿qué define este repo y qué importa de qué?". No
responde "¿esto se usa?" ni "¿quién llama a esto?" cuando la llamada cruza
HTTP, una cadena de texto o la base de datos.** Un nodo sin aristas entrantes
**no es evidencia de código muerto** — es lo normal para una ruta de API. Antes
de declarar algo muerto, hay que buscarlo como texto y preguntar si lo llama
alguien de afuera: el navegador, otro servicio o un trigger.
