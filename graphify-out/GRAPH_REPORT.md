# Graph Report - diseno-sorsabsa  (2026-08-10)

## Corpus Check
- 78 files · ~65,664 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 842 edges · 35 communities (32 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf198dc3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- DomusLanding.tsx
- App.tsx
- Arquitectura del ecosistema SORSABSA
- Plan — una persona en más de un condominio (CondoManager)
- devDependencies
- BrandProvider.tsx
- Pendientes del ecosistema SORSABSA
- 🔴 CRÍTICO
- Plan — Identificación de unidades configurable por condominio
- compilerOptions
- compilerOptions
- Auditoría — CondoManager como aplicación (más allá del portero)
- devDependencies
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- Auditoría — DomusCRM, el portero y el alta de cuenta
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
9. `🔴 CRÍTICO` - 11 edges
10. `Estándar de desarrollo — no parchear la arquitectura` - 11 edges

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

## Communities (35 total, 3 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.05
Nodes (56): ButtonMatrix(), SHADOW, VARIANTS, DATA, AppShell(), AppShellProps, Avatar(), AvatarProps (+48 more)

### Community 1 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (32): CardStatusDemo(), SHADOW, TONES, DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES (+24 more)

### Community 2 - "App.tsx"
Cohesion: 0.08
Nodes (27): App(), BRAND_KEYS, AtomShowcase(), ColorPalette(), TOKEN_ORDER, ContrastReport(), FormDemo(), NotImplemented() (+19 more)

### Community 3 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (44): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26 (+36 more)

### Community 4 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.05
Nodes (36): 🔴-1 — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager, 🟠-1 — No existe botón de cerrar sesión en ningún panel — y la versión ingenua repetiría un bug ya corregido en CondoManager e identity, 🟠-2 — `LoginGate` valida presencia de token, nunca vigencia — deja pasar sesiones vencidas al shell completo, 🟠-3 — Pendiente de verificar en vivo, no descartado: ¿el mensaje de Gina fue realmente por vencimiento, o hay un problema de configuración?, Auditoría — agente24siete, el portero (sesión/autenticación), 🔴 CRÍTICO, 🟠 IMPORTANTE, Pendiente de decidir con Gina antes de ejecutar (+28 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 6 - "BrandProvider.tsx"
Cohesion: 0.10
Nodes (28): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+20 more)

### Community 7 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (34): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+26 more)

### Community 8 - "🔴 CRÍTICO"
Cohesion: 0.07
Nodes (30): 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-11 — 🔧 DomusCRM corregido 10-ago-2026, agente24siete y JustiRed pendientes — El portero está mal implementado en los 4 productos web, y de tres maneras distintas, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio, 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada, 🟠-2 — ⬜ Bypass de entitlements hardcodeado por nombre de producto (+22 more)

### Community 9 - "Plan — Identificación de unidades configurable por condominio"
Cohesion: 0.08
Nodes (23): Alcance real, verificado leyendo cada archivo (no asumido), Causa raíz, Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`), Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`), Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar, Fase 4 — Verificación y cierre, Fases, Orden recomendado (+15 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 12 - "Auditoría — CondoManager como aplicación (más allá del portero)"
Cohesion: 0.11
Nodes (18): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026, 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026 (+10 more)

### Community 13 - "devDependencies"
Cohesion: 0.12
Nodes (17): jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, ts-jest, @types/jest, @types/react (+9 more)

### Community 14 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 15 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, motion, description, motion, license, main, name, private (+3 more)

### Community 16 - "Auditoría — DomusCRM, el portero y el alta de cuenta"
Cohesion: 0.18
Nodes (10): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@13d9176` — La pantalla de "sin empresa" no tiene marca — coincide con el reporte de "pantalla en blanco", 🟡-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — Formulario "Crear mi cuenta": falta un campo de apellido separado, 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 (fix #2 sigue pendiente) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador, 🟡-2 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — "Las dos contraseñas no están en la misma fila": Gina tenía razón, no era caché ni mobile, 🟠-2 — 🔧 Parcialmente corregido 10-ago-2026 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11, Auditoría — DomusCRM, el portero y el alta de cuenta, 🔴 CRÍTICO, Estado 10-ago-2026 (+2 more)

### Community 17 - "NotificationBell.tsx"
Cohesion: 0.24
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 18 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 19 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 20 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 21 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 22 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 23 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 24 - "exports"
Cohesion: 0.67
Nodes (3): exports, ./preset, ./tokens.css

### Community 25 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, test, typecheck

## Knowledge Gaps
- **302 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Auditoría — portero SSO del ecosistema SORSABSA` connect `🔴 CRÍTICO` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Pendientes del ecosistema SORSABSA`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `Auditoría — CondoManager como aplicación (más allá del portero)` connect `Auditoría — CondoManager como aplicación (más allá del portero)` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0525879917184265 - nodes in this community are weakly interconnected._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.062040816326530614 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._