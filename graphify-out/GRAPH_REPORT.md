# Graph Report - diseno-sorsabsa  (2026-08-09)

## Corpus Check
- 71 files · ~42,993 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 512 nodes · 743 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c2ff8c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- DomusLanding.tsx
- App.tsx
- Arquitectura del ecosistema SORSABSA
- devDependencies
- BrandProvider.tsx
- Estándar de desarrollo — no parchear la arquitectura
- devDependencies
- Pendientes del ecosistema SORSABSA
- compilerOptions
- compilerOptions
- package.json
- Plan de desoldado del ecosistema SORSABSA
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- NotificationBell.tsx
- Grafo de conocimiento (graphify) generado por CI
- Color de marca y contraste
- vercel.json
- pre-push
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 19 edges
2. `compilerOptions` - 13 edges
3. `compilerOptions` - 13 edges
4. `Arquitectura del ecosistema SORSABSA` - 12 edges
5. `BrandConfig` - 11 edges
6. `IconName` - 11 edges
7. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
8. `Estándar de desarrollo — no parchear la arquitectura` - 11 edges
9. `resolveEffectiveColors()` - 9 edges
10. `brandToCssVars()` - 9 edges

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

## Communities (24 total, 2 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.05
Nodes (54): ButtonMatrix(), SHADOW, VARIANTS, DATA, AppShell(), AppShellProps, Avatar(), AvatarProps (+46 more)

### Community 1 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (30): CardStatusDemo(), SHADOW, TONES, DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES (+22 more)

### Community 2 - "App.tsx"
Cohesion: 0.08
Nodes (27): App(), BRAND_KEYS, AtomShowcase(), ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented() (+19 more)

### Community 3 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (44): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26 (+36 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 5 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (28): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+20 more)

### Community 6 - "Estándar de desarrollo — no parchear la arquitectura"
Cohesion: 0.06
Nodes (32): 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ⬜ Excepción hardcodeada `app === 'iot'` en /auth/complete, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio, 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada, 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto, 🔵-2 — ⬜ Fallback basado en el texto de un error de un proveedor externo, 🟡-2 — ⬜ `PROFILE_CHOICES` con nombres reales hardcodeados en editor.py, 🟠-3 — ✅ Autorización duplicada en dos archivos de IOT — CORREGIDO 09-ago-2026 (+24 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (32): jest, jest-environment-jsdom, devDependencies, framer-motion, jest, jest-environment-jsdom, lucide-react, react (+24 more)

### Community 8 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.07
Nodes (27): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 1. ✅ RESUELTO — separar auth a su propio proyecto (vía OIDC) (+19 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 11 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, motion, description, exports, ./preset, ./tokens.css, files, motion (+13 more)

### Community 12 - "Plan de desoldado del ecosistema SORSABSA"
Cohesion: 0.15
Nodes (13): auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026, ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado, ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados, Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices, Estado — hecho el 07-ago-2026, con un pendiente real, Lo que NO se hace (decidido, con razón escrita), Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero, Paso 1 — Identity como emisor OIDC (+5 more)

### Community 13 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 14 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 15 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 16 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 17 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **239 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Pendientes del ecosistema SORSABSA`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `BrandConfig` connect `BrandProvider.tsx` to `index.ts`, `App.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05472636815920398 - nodes in this community are weakly interconnected._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06475485661424607 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._
- **Should `Arquitectura del ecosistema SORSABSA` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._