# Graph Report - diseno-sorsabsa  (2026-08-10)

## Corpus Check
- 75 files · ~57,927 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 577 nodes · 812 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3bbc180c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- Arquitectura del ecosistema SORSABSA
- IconName
- devDependencies
- BrandProvider.tsx
- Pendientes del ecosistema SORSABSA
- Plan — una persona en más de un condominio (CondoManager)
- 🔴 CRÍTICO
- Plan — Identificación de unidades configurable por condominio
- compilerOptions
- compilerOptions
- devDependencies
- Auditoría — CondoManager como aplicación (más allá del portero)
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- NotificationBell.tsx
- Grafo de conocimiento (graphify) generado por CI
- peerDependencies
- Color de marca y contraste
- vercel.json
- files
- lucide-react
- exports
- scripts
- pre-push
- @testing-library/react
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 21 edges
2. `Plan — una persona en más de un condominio (CondoManager)` - 16 edges
3. `compilerOptions` - 13 edges
4. `IconName` - 13 edges
5. `compilerOptions` - 13 edges
6. `Arquitectura del ecosistema SORSABSA` - 12 edges
7. `BrandConfig` - 11 edges
8. `@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA` - 11 edges
9. `Estándar de desarrollo — no parchear la arquitectura` - 11 edges
10. `Icon` - 10 edges

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

## Communities (34 total, 3 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (35): App(), BRAND_KEYS, AtomShowcase(), ButtonMatrix(), SHADOW, VARIANTS, ColorPalette(), TOKEN_ORDER (+27 more)

### Community 1 - "index.ts"
Cohesion: 0.06
Nodes (49): DATA, AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE, ButtonProps (+41 more)

### Community 2 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (44): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26 (+36 more)

### Community 3 - "IconName"
Cohesion: 0.08
Nodes (29): CardStatusDemo(), SHADOW, TONES, IconCatalog(), NAMES, SHADOW, Card(), CardContent() (+21 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 5 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (28): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+20 more)

### Community 6 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (34): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+26 more)

### Community 7 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.07
Nodes (27): Antes de cada fix — responder internamente, Criterio de aceptación, Estándar de desarrollo — no parchear la arquitectura, Fuente única de verdad, "Funciona" no es lo mismo que "está bien diseñado", Principio fundamental, Prohibido compensar defectos de código modificando datos reales, Qué debe presentarse antes de tocar código (+19 more)

### Community 8 - "🔴 CRÍTICO"
Cohesion: 0.07
Nodes (29): 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio, 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada, 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto, 🔵-2 — ⬜ Fallback basado en el texto de un error de un proveedor externo (+21 more)

### Community 9 - "Plan — Identificación de unidades configurable por condominio"
Cohesion: 0.08
Nodes (23): Alcance real, verificado leyendo cada archivo (no asumido), Causa raíz, Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`), Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`), Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar, Fase 4 — Verificación y cierre, Fases, Orden recomendado (+15 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 12 - "devDependencies"
Cohesion: 0.12
Nodes (17): jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, ts-jest, @types/jest, @types/react (+9 more)

### Community 13 - "Auditoría — CondoManager como aplicación (más allá del portero)"
Cohesion: 0.12
Nodes (16): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026, 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026 (+8 more)

### Community 14 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 15 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, motion, description, motion, license, main, name, private (+3 more)

### Community 16 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 17 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 18 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 19 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 20 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 21 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 22 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 23 - "exports"
Cohesion: 0.67
Nodes (3): exports, ./preset, ./tokens.css

### Community 24 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, test, typecheck

## Knowledge Gaps
- **288 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Pendientes del ecosistema SORSABSA`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Auditoría — portero SSO del ecosistema SORSABSA` connect `🔴 CRÍTICO` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `BrandConfig` connect `BrandProvider.tsx` to `App.tsx`, `index.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05737704918032787 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060655737704918035 - nodes in this community are weakly interconnected._
- **Should `Arquitectura del ecosistema SORSABSA` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._