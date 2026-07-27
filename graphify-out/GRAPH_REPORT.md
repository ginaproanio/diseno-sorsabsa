# Graph Report - diseno-sorsabsa  (2026-07-27)

## Corpus Check
- 64 files · ~18,272 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 383 nodes · 616 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eddeb62c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- App.tsx
- BrandProvider.tsx
- devDependencies
- compilerOptions
- compilerOptions
- package.json
- showcase/package.json
- IconName
- devDependencies
- ContrastReport.tsx
- CardStatusDemo.tsx
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- NotificationBell.tsx
- Grafo de conocimiento (graphify) generado por CI
- vercel.json
- pre-push
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 13 edges
2. `compilerOptions` - 13 edges
3. `BrandConfig` - 11 edges
4. `IconName` - 11 edges
5. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
6. `resolveEffectiveColors()` - 9 edges
7. `brandToCssVars()` - 9 edges
8. `Icon` - 9 edges
9. `Grafo de conocimiento (graphify) generado por CI` - 9 edges
10. `Wordmark()` - 8 edges

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

## Communities (22 total, 2 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.06
Nodes (50): DATA, TableDemo(), AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE (+42 more)

### Community 1 - "App.tsx"
Cohesion: 0.07
Nodes (22): BRAND_KEYS, AtomShowcase(), ButtonMatrix(), SHADOW, VARIANTS, DomusLanding(), FEATURES, SOCIAL (+14 more)

### Community 2 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (28): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (32): jest, jest-environment-jsdom, devDependencies, framer-motion, jest, jest-environment-jsdom, lucide-react, react (+24 more)

### Community 4 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 6 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, motion, description, exports, ./preset, ./tokens.css, files, motion (+13 more)

### Community 7 - "showcase/package.json"
Cohesion: 0.09
Nodes (21): dependencies, framer-motion, lucide-react, motion, react, react-dom, description, framer-motion (+13 more)

### Community 8 - "IconName"
Cohesion: 0.16
Nodes (15): IconCatalog(), NAMES, SHADOW, InputProps, MobileNav(), MobileNavItem, MobileNavProps, StatusBadge() (+7 more)

### Community 9 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, postcss, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom (+9 more)

### Community 10 - "ContrastReport.tsx"
Cohesion: 0.22
Nodes (12): App(), ColorPalette(), TOKEN_ORDER, ContrastReport(), channelLinear(), contrastRatio(), hexToRgb(), relativeLuminance() (+4 more)

### Community 11 - "CardStatusDemo.tsx"
Cohesion: 0.15
Nodes (12): CardStatusDemo(), SHADOW, TONES, Card(), CardContent(), CardHeader(), CardHeaderProps, CardProps (+4 more)

### Community 12 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.17
Nodes (11): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes), Reglas de la librería (+3 more)

### Community 13 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 14 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 15 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **140 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BrandConfig` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`, `ContrastReport.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `Wordmark()` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0597567424643046 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06976744186046512 - nodes in this community are weakly interconnected._
- **Should `BrandProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._