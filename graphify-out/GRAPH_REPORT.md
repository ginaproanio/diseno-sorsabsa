# Graph Report - diseno-sorsabsa  (2026-08-16)

## Corpus Check
- 87 files · ~100,328 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 743 nodes · 1019 edges · 43 communities (38 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca8301b7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- BrandProvider.tsx
- Estándar de desarrollo — no parchear la arquitectura
- Arquitectura del ecosistema SORSABSA
- Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)
- Pendientes del ecosistema SORSABSA
- devDependencies
- 🔴 CRÍTICO
- index.ts
- Plan — una persona en más de un condominio (CondoManager)
- Plan — Identificación de unidades configurable por condominio
- IconName
- compilerOptions
- compilerOptions
- Auditoría — JustiRed (legaltech)
- devDependencies
- AppShell.tsx
- CardStatusDemo.tsx
- 🟠 IMPORTANTE
- Auditoría — DomusCRM, el portero y el alta de cuenta
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- NotificationBell.tsx
- Grafo de conocimiento (graphify) generado por CI
- peerDependencies
- magnific-upscale.mjs
- Color de marca y contraste
- vercel.json
- files
- PropertyCarousel
- lucide-react
- exports
- scripts
- apiError.ts
- pre-push
- @testing-library/react
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 25 edges
2. `Plan — una persona en más de un condominio (CondoManager)` - 16 edges
3. `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` - 16 edges
4. `IconName` - 15 edges
5. `compilerOptions` - 13 edges
6. `compilerOptions` - 13 edges
7. `Icon` - 12 edges
8. `Arquitectura del ecosistema SORSABSA` - 12 edges
9. `🔴 CRÍTICO` - 12 edges
10. `BrandConfig` - 11 edges

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

## Communities (43 total, 5 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (36): App(), BRAND_KEYS, AtomShowcase(), ButtonMatrix(), SHADOW, VARIANTS, ColorPalette(), TOKEN_ORDER (+28 more)

### Community 1 - "BrandProvider.tsx"
Cohesion: 0.06
Nodes (39): DomusLanding(), FEATURES, SOCIAL, BRAND_FONT_IMPORTS, BrandColors, BrandConfig, BrandContext, BrandProvider() (+31 more)

### Community 2 - "Estándar de desarrollo — no parchear la arquitectura"
Cohesion: 0.04
Nodes (43): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026, 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026 (+35 more)

### Community 3 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.04
Nodes (48): 1. Inventario, 2. Los dos planos, 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, 4. Almacenamiento, 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), 5. Roturas verificadas el 2026-07-26, 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26 (+40 more)

### Community 4 - "Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)"
Cohesion: 0.05
Nodes (42): 10. Plazo real y calendario, 11. Dominio, 12. Decisiones pendientes, 1. Los dos perfiles y el modelo de negocio, 2. Lo que se reusa del ecosistema (regla dura del tracker), 3.a Navegación: gestión ≠ ejecución (pedido de Gina, 15-ago-2026), 3. Acceso al contenido de las plataformas — lo único que cambia en `core/`, 3.b Editor de texto enriquecido — requisito, no mejora futura (+34 more)

### Community 5 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.05
Nodes (40): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+32 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 7 - "🔴 CRÍTICO"
Cohesion: 0.05
Nodes (37): 🟠-10 — ⬜ CondoManager muestra un rechazo de negocio cuando lo que falló es la red — encontrado 16-ago-2026, 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-11 — 🔧 DomusCRM y agente24siete corregidos 10-ago-2026; JustiRed corregido en código 15-ago-2026, pendiente de deploy — El portero está mal implementado en los 4 productos web, y de tres maneras distintas, 🔴-12 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — agente24siete verificaba su sesión contra el proyecto Supabase equivocado — causa real del bucle que 🔴-1/🟠-3 nunca cerraron, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio (+29 more)

### Community 8 - "index.ts"
Cohesion: 0.11
Nodes (29): DATA, SectionHeader(), SectionHeaderProps, SegmentedControl(), SegmentedControlProps, SegmentedOption, ALIGN, HIDE_CLASSES (+21 more)

### Community 9 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.06
Nodes (29): auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026, ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado, ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados, Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices, Estado — hecho el 07-ago-2026, con un pendiente real, Lo que NO se hace (decidido, con razón escrita), Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero, Paso 1 — Identity como emisor OIDC (+21 more)

### Community 10 - "Plan — Identificación de unidades configurable por condominio"
Cohesion: 0.08
Nodes (23): Alcance real, verificado leyendo cada archivo (no asumido), Causa raíz, Decidido y ejecutado (ya no está pendiente), Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`), Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`), Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar, Fase 4 — Verificación y cierre — 🔧 casi cerrada (15-ago-2026), Fases (+15 more)

### Community 11 - "IconName"
Cohesion: 0.13
Nodes (18): FooterEcosistema(), FooterEcosistemaProps, FormSection(), FormSectionProps, InputProps, MobileNav(), MobileNavItem, MobileNavProps (+10 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 14 - "Auditoría — JustiRed (legaltech)"
Cohesion: 0.11
Nodes (18): 10-ago-2026 — Estado real, adónde debe llegar, y los transversales que esta auditoría todavía no cubrió, 15-ago-2026 — Qué se ejecutó, qué falta, 🟠-1 — ✅ Corregido en código 15-ago-2026 (ver `AUDITORIA-PORTERO-SSO.md` 🔴-11), 🔴-1 — ✅ RESUELTO 15-ago-2026 — El panel de Control de Calidad no hace nada: RLS bloquea la tabla para cualquier usuario, la UI lo esconde con un "éxito" falso, 🔴-2 — 🔧 El portero central tiene a JustiRed registrada en un dominio que NO EXISTE: todo login termina en `justired.app` (NXDOMAIN), 🔴-3 — ✅ RESUELTO 15-ago-2026 — La cola de revisión no gateaba nada: toda ley capturada era pública desde el primer segundo, aprobada o no, Auditoría — JustiRed (legaltech), Cambiado en código, SIN desplegar — lo decide Gina (+10 more)

### Community 15 - "devDependencies"
Cohesion: 0.12
Nodes (17): jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, ts-jest, @types/jest, @types/react (+9 more)

### Community 16 - "AppShell.tsx"
Cohesion: 0.15
Nodes (13): AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE, SIZE, Tag() (+5 more)

### Community 17 - "CardStatusDemo.tsx"
Cohesion: 0.16
Nodes (11): CardStatusDemo(), SHADOW, TONES, Card(), CardContent(), CardHeader(), CardHeaderProps, CardProps (+3 more)

### Community 18 - "🟠 IMPORTANTE"
Cohesion: 0.13
Nodes (14): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — No existe botón de cerrar sesión en ningún panel — y la versión ingenua repetiría un bug ya corregido en CondoManager e identity, 🟡-1 — ⬜ El `refresh_token` se descarta: la sesión dura 60 minutos y se "renueva" con una vuelta completa por el portero. Encontrado 16-ago-2026, 🔴-1 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager, 🟠-2 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — `LoginGate` valida presencia de token, nunca vigencia — deja pasar sesiones vencidas al shell completo, 🟠-3 — ✅ RESUELTO 10-ago-2026 (era la hipótesis (b): configuración) — ¿el mensaje de Gina fue realmente por vencimiento, o hay un problema de configuración?, 🟠-4 — 🔧 CORREGIDO 16-ago-2026, commit `agente24siete@61760c5`, falta la prueba en vivo de Gina — "Salir" borra el `localStorage` pero deja viva la cookie de sesión — el gate del SERVIDOR sigue viendo sesión válida hasta 60 minutos después de cerrarla. Encontrado 16-ago-2026, 🟠-5 — ⬜ El `next` de agente24siete no apunta a su propio `/auth/callback`: el login solo termina por una cadena de fallbacks, con una vuelta entera de más por el portero. Encontrado 16-ago-2026, 🟠-6 — ✅ CORREGIDO Y ESTANDARIZADO 16-ago-2026 — La pantalla terminal encerraba a la persona: sin salir, sin volver a la web, sin poder pedir el alta (+6 more)

### Community 19 - "Auditoría — DomusCRM, el portero y el alta de cuenta"
Cohesion: 0.14
Nodes (13): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@13d9176` — La pantalla de "sin empresa" no tiene marca — coincide con el reporte de "pantalla en blanco", 🟡-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — Formulario "Crear mi cuenta": falta un campo de apellido separado, 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 · fix #2 etapa 1 CORREGIDA 15-ago-2026 (etapas 2-3 pendientes) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador, 🟡-2 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — "Las dos contraseñas no están en la misma fila": Gina tenía razón, no era caché ni mobile, 🟠-2 — 🔧 Parcialmente corregido 10-ago-2026 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11, 🟠-3 — ✅ CORREGIDO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Una falla de nuestra base de datos se le reportaba al usuario como "no pagaste", 🟠-4 — ✅ CORREGIDO 15-ago-2026, commit `domuscrm@479ea1b`; la pantalla pasa al componente compartido 16-ago-2026 (`domuscrm@449e7c3`) — El panel le decía "Iniciar sesión" a alguien que ya tenía la sesión iniciada, Auditoría — DomusCRM, el portero y el alta de cuenta (+5 more)

### Community 20 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 21 - "package.json"
Cohesion: 0.17
Nodes (11): dependencies, motion, description, motion, license, main, name, private (+3 more)

### Community 22 - "NotificationBell.tsx"
Cohesion: 0.21
Nodes (8): MOCK, NotificationDemo(), Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 23 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 24 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 25 - "magnific-upscale.mjs"
Cohesion: 0.36
Nodes (9): __dirname, loadEnvLocal(), main(), parseArgs(), pollTask(), REPO_ROOT, safeJson(), sleep() (+1 more)

### Community 26 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 27 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 28 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 30 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

### Community 31 - "exports"
Cohesion: 0.67
Nodes (3): exports, ./preset, ./tokens.css

### Community 32 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, test, typecheck

## Knowledge Gaps
- **392 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` connect `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Pendientes del ecosistema SORSABSA` connect `Pendientes del ecosistema SORSABSA` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _392 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06170598911070781 - nodes in this community are weakly interconnected._
- **Should `BrandProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06352087114337568 - nodes in this community are weakly interconnected._
- **Should `Estándar de desarrollo — no parchear la arquitectura` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._