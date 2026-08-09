# Graph Report - diseno-sorsabsa  (2026-08-09)

## Corpus Check
- 72 files · ~52,171 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 543 nodes · 774 edges · 31 communities (28 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7dca7a2d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- App.tsx
- DomusLanding.tsx
- Arquitectura del ecosistema SORSABSA
- devDependencies
- BrandProvider.tsx
- Pendientes del ecosistema SORSABSA
- Plan — una persona en más de un condominio (CondoManager)
- 🔴 CRÍTICO
- compilerOptions
- compilerOptions
- devDependencies
- Auditoría — CondoManager como aplicación (más allá del portero)
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- Button.tsx
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
1. `Pendientes del ecosistema SORSABSA` - 20 edges
2. `Plan — una persona en más de un condominio (CondoManager)` - 15 edges
3. `compilerOptions` - 13 edges
4. `compilerOptions` - 13 edges
5. `Arquitectura del ecosistema SORSABSA` - 12 edges
6. `BrandConfig` - 11 edges
7. `IconName` - 11 edges
8. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
9. `Estándar de desarrollo — no parchear la arquitectura` - 11 edges
10. `🔴 CRÍTICO` - 10 edges

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

## Communities (31 total, 3 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.06
Nodes (52): MOCK, NotificationDemo(), DATA, AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials() (+44 more)

### Community 1 - "App.tsx"
Cohesion: 0.08
Nodes (28): App(), BRAND_KEYS, AtomShowcase(), ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented() (+20 more)

### Community 2 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (30): CardStatusDemo(), SHADOW, TONES, DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES (+22 more)

### Community 3 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (44): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26 (+36 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 5 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (27): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandContext, BrandProvider(), brandToCssVars(), contrastRatio() (+19 more)

### Community 6 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.06
Nodes (33): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+25 more)

### Community 7 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.07
Nodes (26): Antes de cada fix — responder internamente, Criterio de aceptación, Estándar de desarrollo — no parchear la arquitectura, Fuente única de verdad, "Funciona" no es lo mismo que "está bien diseñado", Principio fundamental, Prohibido compensar defectos de código modificando datos reales, Qué debe presentarse antes de tocar código (+18 more)

### Community 8 - "🔴 CRÍTICO"
Cohesion: 0.07
Nodes (29): 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio, 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada, 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto, 🔵-2 — ⬜ Fallback basado en el texto de un error de un proveedor externo (+21 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 11 - "devDependencies"
Cohesion: 0.12
Nodes (17): jest, jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, @testing-library/react, ts-jest (+9 more)

### Community 12 - "Auditoría — CondoManager como aplicación (más allá del portero)"
Cohesion: 0.14
Nodes (14): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, Auditoría — CondoManager como aplicación (más allá del portero), 🔴 CRÍTICO (+6 more)

### Community 13 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 14 - "package.json"
Cohesion: 0.17
Nodes (11): description, exports, ./preset, ./tokens.css, license, main, name, private (+3 more)

### Community 15 - "Button.tsx"
Cohesion: 0.18
Nodes (10): ButtonMatrix(), SHADOW, VARIANTS, Button, ButtonProps, ButtonSize, ButtonVariant, CommonProps (+2 more)

### Community 16 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 17 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 18 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 19 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 20 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 21 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, motion, motion

### Community 22 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 23 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, test, typecheck

## Knowledge Gaps
- **265 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+260 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Pendientes del ecosistema SORSABSA`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `BrandConfig` connect `App.tsx` to `index.ts`, `BrandProvider.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Auditoría — portero SSO del ecosistema SORSABSA` connect `🔴 CRÍTICO` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _265 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06475485661424607 - nodes in this community are weakly interconnected._