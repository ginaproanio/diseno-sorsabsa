# Graph Report - diseno-sorsabsa  (2026-07-18)

## Corpus Check
- 55 files · ~14,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 337 nodes · 520 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3cc2e7c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- devDependencies
- BrandProvider.tsx
- compilerOptions
- compilerOptions
- package.json
- package.json
- Icon.tsx
- devDependencies
- CardStatusDemo.tsx
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- Button.tsx
- Grafo de conocimiento (graphify) generado por CI
- vercel.json
- pre-push
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `compilerOptions` - 13 edges
3. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
4. `BrandConfig` - 10 edges
5. `IconName` - 10 edges
6. `resolveEffectiveColors()` - 9 edges
7. `Grafo de conocimiento (graphify) generado por CI` - 9 edges
8. `Icon` - 8 edges
9. `useBrand()` - 6 edges
10. `brandToCssVars()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `resolveEffectiveColors()` --calls--> `brandToCssVars()`  [EXTRACTED]
  showcase/src/resolveColors.ts → src/brand/BrandProvider.tsx
- `TokenAudit()` --calls--> `useBrand()`  [EXTRACTED]
  showcase/src/components/TokenAudit.tsx → src/brand/BrandProvider.tsx
- `App()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/App.tsx → showcase/src/resolveColors.ts
- `ColorPalette()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/components/ColorPalette.tsx → showcase/src/resolveColors.ts
- `ContrastReport()` --calls--> `contrastRatio()`  [EXTRACTED]
  showcase/src/components/ContrastReport.tsx → showcase/src/contrast.ts

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.09
Nodes (26): App(), BRAND_KEYS, ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented(), MOCK_PROPERTIES (+18 more)

### Community 1 - "index.ts"
Cohesion: 0.09
Nodes (35): MOCK, NotificationDemo(), DATA, TableDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR (+27 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (32): jest, jest-environment-jsdom, devDependencies, framer-motion, jest, jest-environment-jsdom, lucide-react, react (+24 more)

### Community 3 - "BrandProvider.tsx"
Cohesion: 0.12
Nodes (20): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandContext, BrandProvider(), brandToCssVars(), hexToRgbTriplet() (+12 more)

### Community 4 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 6 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, motion, description, exports, ./preset, ./tokens.css, files, motion (+13 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, framer-motion, lucide-react, motion, react, react-dom, description, framer-motion (+13 more)

### Community 8 - "Icon.tsx"
Cohesion: 0.16
Nodes (15): IconCatalog(), NAMES, SHADOW, InputProps, MobileNav(), MobileNavItem, MobileNavProps, StatusBadge() (+7 more)

### Community 9 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, postcss, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom (+9 more)

### Community 10 - "CardStatusDemo.tsx"
Cohesion: 0.16
Nodes (11): CardStatusDemo(), SHADOW, TONES, Card(), CardContent(), CardHeader(), CardProps, CardTitle() (+3 more)

### Community 11 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.17
Nodes (11): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes), Reglas de la librería (+3 more)

### Community 12 - "Button.tsx"
Cohesion: 0.18
Nodes (10): ButtonMatrix(), SHADOW, VARIANTS, Button, ButtonProps, ButtonSize, ButtonVariant, CommonProps (+2 more)

### Community 13 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 14 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **133 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BrandConfig` connect `App.tsx` to `index.ts`, `BrandProvider.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08985200845665962 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08748615725359911 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06854838709677419 - nodes in this community are weakly interconnected._