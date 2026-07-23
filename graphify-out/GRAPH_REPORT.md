# Graph Report - diseno-sorsabsa  (2026-07-23)

## Corpus Check
- 63 files · ~17,048 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 373 nodes · 592 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e61e2d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- App.tsx
- devDependencies
- devDependencies
- DomusLanding.tsx
- BrandProvider.tsx
- compilerOptions
- compilerOptions
- package.json
- CardStatusDemo.tsx
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- Button.tsx
- NotificationBell.tsx
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
7. `Icon` - 9 edges
8. `Grafo de conocimiento (graphify) generado por CI` - 9 edges
9. `Wordmark()` - 8 edges
10. `BrandProvider()` - 7 edges

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

### Community 0 - "index.ts"
Cohesion: 0.07
Nodes (45): DATA, TableDemo(), AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE (+37 more)

### Community 1 - "App.tsx"
Cohesion: 0.09
Nodes (25): App(), BRAND_KEYS, AtomShowcase(), ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented() (+17 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (32): jest, jest-environment-jsdom, devDependencies, framer-motion, jest, jest-environment-jsdom, lucide-react, react (+24 more)

### Community 4 - "DomusLanding.tsx"
Cohesion: 0.09
Nodes (20): DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES, SHADOW, Input, InputProps (+12 more)

### Community 5 - "BrandProvider.tsx"
Cohesion: 0.12
Nodes (21): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 8 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, motion, description, exports, ./preset, ./tokens.css, files, motion (+13 more)

### Community 9 - "CardStatusDemo.tsx"
Cohesion: 0.16
Nodes (11): CardStatusDemo(), SHADOW, TONES, Card(), CardContent(), CardHeader(), CardHeaderProps, CardProps (+3 more)

### Community 10 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.17
Nodes (11): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes), Reglas de la librería (+3 more)

### Community 11 - "Button.tsx"
Cohesion: 0.18
Nodes (10): ButtonMatrix(), SHADOW, VARIANTS, Button, ButtonProps, ButtonSize, ButtonVariant, CommonProps (+2 more)

### Community 12 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 13 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 14 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **139 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BrandConfig` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Wordmark()` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`, `DomusLanding.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06753246753246753 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._