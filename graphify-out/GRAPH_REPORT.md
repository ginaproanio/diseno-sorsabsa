# Graph Report - diseno-sorsabsa  (2026-08-08)

## Corpus Check
- 69 files · ~31,765 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 473 nodes · 706 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b779b6d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- DomusLanding.tsx
- App.tsx
- BrandProvider.tsx
- Arquitectura del ecosistema SORSABSA
- Plan de desoldado del ecosistema SORSABSA
- compilerOptions
- Pendientes del ecosistema SORSABSA
- compilerOptions
- showcase/package.json
- devDependencies
- devDependencies
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- NotificationBell.tsx
- Grafo de conocimiento (graphify) generado por CI
- peerDependencies
- Color de marca y contraste
- vercel.json
- files
- dependencies
- lucide-react
- scripts
- pre-push
- @types/jest
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 16 edges
2. `compilerOptions` - 13 edges
3. `compilerOptions` - 13 edges
4. `BrandConfig` - 11 edges
5. `IconName` - 11 edges
6. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
7. `Arquitectura del ecosistema SORSABSA` - 11 edges
8. `resolveEffectiveColors()` - 9 edges
9. `brandToCssVars()` - 9 edges
10. `Icon` - 9 edges

## Surprising Connections (you probably didn't know these)
- `TokenAudit()` --calls--> `useBrand()`  [EXTRACTED]
  showcase/src/components/TokenAudit.tsx → src/brand/BrandProvider.tsx
- `resolveEffectiveColors()` --calls--> `brandToCssVars()`  [EXTRACTED]
  showcase/src/resolveColors.ts → src/brand/BrandProvider.tsx
- `App()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/App.tsx → showcase/src/resolveColors.ts
- `ColorPalette()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/components/ColorPalette.tsx → showcase/src/resolveColors.ts
- `ContrastReport()` --calls--> `contrastRatio()`  [EXTRACTED]
  showcase/src/components/ContrastReport.tsx → showcase/src/contrast.ts

## Import Cycles
- None detected.

## Communities (30 total, 3 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.05
Nodes (55): ButtonMatrix(), SHADOW, VARIANTS, DATA, TableDemo(), AppShell(), AppShellProps, Avatar() (+47 more)

### Community 1 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (30): CardStatusDemo(), SHADOW, TONES, DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES (+22 more)

### Community 2 - "App.tsx"
Cohesion: 0.08
Nodes (27): App(), BRAND_KEYS, AtomShowcase(), ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented() (+19 more)

### Community 3 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (27): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), contrastRatio() (+19 more)

### Community 4 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.06
Nodes (36): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26, 6. Lo que NO está verificado (+28 more)

### Community 5 - "Plan de desoldado del ecosistema SORSABSA"
Cohesion: 0.08
Nodes (21): auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026, ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado, ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados, Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices, Estado — hecho el 07-ago-2026, con un pendiente real, Lo que NO se hace (decidido, con razón escrita), Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero, Paso 1 — Identity como emisor OIDC (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 7 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.09
Nodes (22): 10. Login con Google (mejora, no bloquea nada)  🔵 apuntado 08-ago-2026, 11. agente24siete: /portal sin login real + cascarón viejo sin borrar  🟡 08-ago-2026, 12. CondoManager sube fotos a Supabase Storage, no a R2  🟡 08-ago-2026, 1. ✅ RESUELTO — separar auth a su propio proyecto (vía OIDC, no vía llave compartida), 2. JustiRed al SSO central  🟡 casi hecho — faltan 3 pasos manuales, 3. ✅ HECHO — cutover de pagos (fuera de Vercel), 4-bis. Limpieza menor en agente24siete, 4. ✅ HECHO — notificaciones-sorsabsa → Railway (+14 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 9 - "showcase/package.json"
Cohesion: 0.09
Nodes (21): dependencies, framer-motion, lucide-react, motion, react, react-dom, description, framer-motion (+13 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, postcss, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom (+9 more)

### Community 11 - "devDependencies"
Cohesion: 0.12
Nodes (17): jest, jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, @testing-library/react, ts-jest (+9 more)

### Community 12 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 13 - "package.json"
Cohesion: 0.17
Nodes (11): description, exports, ./preset, ./tokens.css, license, main, name, private (+3 more)

### Community 14 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 15 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 16 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 17 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 18 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 19 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 20 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, motion, motion

### Community 21 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 22 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, test, typecheck

## Knowledge Gaps
- **207 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Plan de desoldado del ecosistema SORSABSA`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `BrandConfig` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Pendientes del ecosistema SORSABSA` connect `Pendientes del ecosistema SORSABSA` to `Plan de desoldado del ecosistema SORSABSA`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053994732221246705 - nodes in this community are weakly interconnected._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06475485661424607 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0821256038647343 - nodes in this community are weakly interconnected._