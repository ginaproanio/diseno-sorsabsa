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
push, lo **commitea de vuelta al repo**, y **falla ruidosamente** (❌ + correo)
si algo se rompe.

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

| Repo | Visibilidad | Root del grafo | Viz interactiva |
|---|---|---|---|
| diseno-sorsabsa | pública | `.` | **Pages**: https://ginaproanio.github.io/diseno-sorsabsa/ |
| condomanager | privada | `.` | local (`graph.html`) |
| domuscrm (crm_inmobiliario) | privada | `webs/` | local |
| agente24siete | privada | `.` | local |
| auth-sorsabsa | privada | `.` | local |
| pagos-sorsabsa | privada | `.` | local |
| notificaciones-sorsabsa | privada | `.` | local |

**Sin grafo aún** (decisión de alcance pendiente): `qa_sorsabsa`,
`SorsabsaForensic` (Python con datos forenses sensibles — definir scope antes).

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
