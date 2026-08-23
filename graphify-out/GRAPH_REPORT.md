# Graph Report - diseno-sorsabsa  (2026-08-23)

## Corpus Check
- 97 files · ~135,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 925 nodes · 1212 edges · 67 communities (63 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `18300c8c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- DomusLanding.tsx
- BrandProvider.tsx
- Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)
- Modelo de trabajo de JustiRed
- devDependencies
- 🔴 CRÍTICO
- Plan — una persona en más de un condominio (CondoManager)
- Pendientes del ecosistema SORSABSA
- Plan — Identificación de unidades configurable por condominio
- Table.tsx
- index.ts
- compilerOptions
- 🟠 IMPORTANTE
- compilerOptions
- Almacenamiento del ecosistema: modelo, costos y cómo lo hacen otros
- Auditoría — CondoManager como aplicación (más allá del portero)
- Estándar de desarrollo — no parchear la arquitectura
- devDependencies
- Auditoría — JustiRed (legaltech)
- 21-bis. 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026
- AppShell.tsx
- Costeo del Convertidor — la prueba de Miraflores
- 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- package.json
- Arquitectura del ecosistema SORSABSA
- Grafo de conocimiento (graphify) generado por CI
- 24. 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)
- peerDependencies
- magnific-upscale.mjs
- Auditoría — DomusCRM, el portero y el alta de cuenta
- NotificationBell.tsx
- 4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026
- 7. Decisión de arquitectura (2026-07-26)
- Auditoría — geo-sorsabsa
- Auditoría — qa_sorsabsa
- Estándar de UI del ecosistema SORSABSA
- Color de marca y contraste
- modales.mjs
- 3. Mapa de bases de datos — LA TRAMPA
- 25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026)
- 27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)
- conformidad.mjs
- 🟠 IMPORTANTE
- 23. ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito
- 28. ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026
- scripts
- vercel.json
- 2. Los dos planos
- 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26
- 26. 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)
- files
- PropertyCarousel
- 1. Inventario
- 4-quater. Mapa de repos y el grafo — ✅ levantado 22-ago-2026
- dependencies
- lucide-react
- pre-push
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 32 edges
2. `Estándar de desarrollo — no parchear la arquitectura` - 20 edges
3. `IconName` - 17 edges
4. `Plan — una persona en más de un condominio (CondoManager)` - 16 edges
5. `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` - 16 edges
6. `Modelo de trabajo de JustiRed` - 15 edges
7. `Icon` - 14 edges
8. `Arquitectura del ecosistema SORSABSA` - 14 edges
9. `compilerOptions` - 13 edges
10. `compilerOptions` - 13 edges

## Surprising Connections (you probably didn't know these)
- `resolveEffectiveColors()` --calls--> `brandToCssVars()`  [EXTRACTED]
  showcase/src/resolveColors.ts → src/brand/BrandProvider.tsx
- `TokenAudit()` --calls--> `useBrand()`  [EXTRACTED]
  showcase/src/components/TokenAudit.tsx → src/brand/BrandProvider.tsx
- `SinAccesoProps` --references--> `IconName`  [EXTRACTED]
  src/components/SinAcceso.tsx → src/icons/icon-paths.ts
- `App()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/App.tsx → showcase/src/resolveColors.ts
- `ColorPalette()` --calls--> `resolveEffectiveColors()`  [EXTRACTED]
  showcase/src/components/ColorPalette.tsx → showcase/src/resolveColors.ts

## Import Cycles
- None detected.

## Communities (67 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (34): App(), BRAND_KEYS, AtomShowcase(), ButtonMatrix(), SHADOW, VARIANTS, ColorPalette(), TOKEN_ORDER (+26 more)

### Community 1 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (35): CardStatusDemo(), SHADOW, TONES, DomusLanding(), FEATURES, SOCIAL, IconCatalog(), NAMES (+27 more)

### Community 2 - "BrandProvider.tsx"
Cohesion: 0.07
Nodes (38): TokenAudit(), TOKENS, BRAND_FONT_IMPORTS, BrandColors, BrandContext, BrandProvider(), brandToCssVars(), contrastRatio() (+30 more)

### Community 3 - "Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)"
Cohesion: 0.05
Nodes (42): 10. Plazo real y calendario, 11. Dominio, 12. Decisiones pendientes, 1. Los dos perfiles y el modelo de negocio, 2. Lo que se reusa del ecosistema (regla dura del tracker), 3.a Navegación: gestión ≠ ejecución (pedido de Gina, 15-ago-2026), 3. Acceso al contenido de las plataformas — lo único que cambia en `core/`, 3.b Editor de texto enriquecido — requisito, no mejora futura (+34 more)

### Community 4 - "Modelo de trabajo de JustiRed"
Cohesion: 0.05
Nodes (40): 10. Reglas de trabajo que salieron de los defectos, 1. Inventariar — ✅, 1. Las unidades de trabajo, 2. Adquirir — ✅ separado el 17-ago-2026, 2. Clasificaciones que importan, 3. Cómo clasifican las empresas del sector, 3. Extraer — ✅ desde el 19-ago-2026, 4. El inventario (+32 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, postcss, dependencies, framer-motion, lucide-react, motion, react, react-dom (+30 more)

### Community 6 - "🔴 CRÍTICO"
Cohesion: 0.05
Nodes (37): 🟠-10 — ⬜ CondoManager muestra un rechazo de negocio cuando lo que falló es la red — encontrado 16-ago-2026, 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-11 — 🔧 DomusCRM y agente24siete corregidos 10-ago-2026; JustiRed corregido en código 15-ago-2026, pendiente de deploy — El portero está mal implementado en los 4 productos web, y de tres maneras distintas, 🔴-12 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — agente24siete verificaba su sesión contra el proyecto Supabase equivocado — causa real del bucle que 🔴-1/🟠-3 nunca cerraron, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio (+29 more)

### Community 7 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.06
Nodes (29): auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026, ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado, ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados, Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices, Estado — hecho el 07-ago-2026, con un pendiente real, Lo que NO se hace (decidido, con razón escrita), Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero, Paso 1 — Identity como emisor OIDC (+21 more)

### Community 8 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.08
Nodes (25): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+17 more)

### Community 9 - "Plan — Identificación de unidades configurable por condominio"
Cohesion: 0.08
Nodes (23): Alcance real, verificado leyendo cada archivo (no asumido), Causa raíz, Decidido y ejecutado (ya no está pendiente), Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`), Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`), Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar, Fase 4 — Verificación y cierre — 🔧 casi cerrada (15-ago-2026), Fases (+15 more)

### Community 10 - "Table.tsx"
Cohesion: 0.11
Nodes (23): DATA, ALIGN, HIDE_CLASSES, hideClass(), ResponsiveBreakpoint, SIZE_CELL_PADDING, SIZE_HEADER_TEXT, Table() (+15 more)

### Community 11 - "index.ts"
Cohesion: 0.14
Nodes (16): Checkbox, CheckboxProps, ConfirmarAccion(), ConfirmarAccionProps, FooterEcosistema(), FooterEcosistemaProps, SectionHeader(), SectionHeaderProps (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): ../src/**/*.test.ts, ../src/**/*.test.tsx, vite.config.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+14 more)

### Community 13 - "🟠 IMPORTANTE"
Cohesion: 0.09
Nodes (21): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — No existe botón de cerrar sesión en ningún panel — y la versión ingenua repetiría un bug ya corregido en CondoManager e identity, 🟡-1 — ⬜ El `refresh_token` se descarta: la sesión dura 60 minutos y se "renueva" con una vuelta completa por el portero. Encontrado 16-ago-2026, 🔴-1 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager, 22-ago-2026 — el punto 9 se ejecutó por fin, seis días después, y el fix estaba a la mitad, 🟠-2 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — `LoginGate` valida presencia de token, nunca vigencia — deja pasar sesiones vencidas al shell completo, 🔴-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@16ef1db` — Los 11 endpoints de `pages/api/admin/` llamaban a `autenticarAdmin` sin `await`: el `if (!usuario) return` nunca se cumplía y el cuerpo del handler se ejecutaba con la sesión rechazada, 🟡-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@d168078` — El portero se reejecutaba en CADA clic del menú, y mientras tanto la pantalla decía "Redirigiendo al acceso…" aunque no fuera a ningún lado, 🔴-3 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@bd3a7a6` — El producto nunca preguntaba QUIÉN SOS: decidía "administradora o clienta" mirando la URL pedida, y `usuarios`/`clientes` solo servían para rechazarte después (+13 more)

### Community 14 - "compilerOptions"
Cohesion: 0.09
Nodes (20): jest, @testing-library/jest-dom, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module (+12 more)

### Community 15 - "Almacenamiento del ecosistema: modelo, costos y cómo lo hacen otros"
Cohesion: 0.10
Nodes (21): 0 · Lo primero, porque cambia el planteo, 1 · Los tres tipos de almacenamiento — la pregunta de Gina, 2 · Método: dónde va cada cosa, y por qué, 3 · Cuánto cuesta — las cuentas hechas, 4 · Lo que sí puede doler: el que paga un mes y se va, 5 · Lo que hay que decidir, 6 · Qué hay que construir, en orden, 7 · El riesgo que no es de costo, y es el más grande (+13 more)

### Community 16 - "Auditoría — CondoManager como aplicación (más allá del portero)"
Cohesion: 0.10
Nodes (20): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026, 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026 (+12 more)

### Community 17 - "Estándar de desarrollo — no parchear la arquitectura"
Cohesion: 0.10
Nodes (20): Antes de cada fix — responder internamente, Criterio de aceptación, Criterio de aceptación de la parte II, Estándar de desarrollo — no parchear la arquitectura, Fuente única de verdad, "Funciona" no es lo mismo que "está bien diseñado", PARTE I — No parchear la arquitectura, PARTE II — Lo que existe y no funciona (+12 more)

### Community 18 - "devDependencies"
Cohesion: 0.11
Nodes (19): jest-environment-jsdom, devDependencies, jest, jest-environment-jsdom, @testing-library/jest-dom, @testing-library/react, ts-jest, @types/jest (+11 more)

### Community 19 - "Auditoría — JustiRed (legaltech)"
Cohesion: 0.11
Nodes (18): 10-ago-2026 — Estado real, adónde debe llegar, y los transversales que esta auditoría todavía no cubrió, 15-ago-2026 — Qué se ejecutó, qué falta, 🟠-1 — ✅ Corregido en código 15-ago-2026 (ver `AUDITORIA-PORTERO-SSO.md` 🔴-11), 🔴-1 — ✅ RESUELTO 15-ago-2026 — El panel de Control de Calidad no hace nada: RLS bloquea la tabla para cualquier usuario, la UI lo esconde con un "éxito" falso, 🔴-2 — 🔧 El portero central tiene a JustiRed registrada en un dominio que NO EXISTE: todo login termina en `justired.app` (NXDOMAIN), 🔴-3 — ✅ RESUELTO 15-ago-2026 — La cola de revisión no gateaba nada: toda ley capturada era pública desde el primer segundo, aprobada o no, Auditoría — JustiRed (legaltech), Cambiado en código, SIN desplegar — lo decide Gina (+10 more)

### Community 20 - "21-bis. 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026"
Cohesion: 0.12
Nodes (17): 1 · Síntoma, 21-bis. 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026, 2 · Causa inmediata — cuatro cortes independientes en la misma cadena, 3 · Causa raíz, 4 · Componente responsable, 5 · Código afectado, 6 · Solución de raíz (no parche), 7 · Código a eliminar — ✅ hecho (+9 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.15
Nodes (13): AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE, SIZE, Tag() (+5 more)

### Community 22 - "Costeo del Convertidor — la prueba de Miraflores"
Cohesion: 0.13
Nodes (14): 1 · Qué se probó, 2 · El problema de negocio, en una línea, 3-bis · Lo que la prueba sintética NO mostraba, 3 · Qué se midió, y cómo, 4 · Lo que NO cuesta, 5 · Las opciones de precio, 6 · El detalle que no es de costeo pero salió de la misma prueba, A · Cambiar el modelo de visión (+6 more)

### Community 23 - "4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)"
Cohesion: 0.15
Nodes (13): 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), API tokens de R2 activos — ✅ dados por Gina 08-ago-2026, Auditoría del inventario de Railway, 10-ago-2026, Cómo conectarse a Cloudflare/R2 desde una sesión de Claude Code — ✅ SÍ SE PUEDE, verificado 15-ago-2026, El proyecto de Google Cloud (`sorsabsaecosystem`) — ✅ confirmado por Gina: Calendar de agente24siete, Geo: NO usa la API de Google Maps (la que factura), Herramientas de una sesión: qué se puede ejecutar y por dónde — verificado 19-ago-2026, Lo que wrangler NO puede hacer: crear el token que necesita un contenedor (+5 more)

### Community 24 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 25 - "package.json"
Cohesion: 0.17
Nodes (11): description, exports, ./preset, ./tokens.css, license, main, name, private (+3 more)

### Community 26 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.18
Nodes (11): 4. Almacenamiento, 5. Roturas verificadas el 2026-07-26, 6. Lo que NO está verificado, 8. Por qué Vercel para la web y Railway para el resto, 9. Pendientes, en orden, Abiertos, en orden, Arquitectura del ecosistema SORSABSA, Cerrados el 2026-07-30 (+3 more)

### Community 27 - "Grafo de conocimiento (graphify) generado por CI"
Cohesion: 0.20
Nodes (9): Añadir Pages a un repo privado (opcional, requiere GitHub Pro), Bugs resueltos durante el piloto (lecciones), Convención de `.gitignore`, Cómo funciona, Cómo ver el grafo, Estado por repo, Grafo de conocimiento (graphify) generado por CI, Por qué CI y no un hook local (+1 more)

### Community 28 - "24. 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)"
Cohesion: 0.20
Nodes (10): 24.10-bis · Por qué agente24siete no puede tener autoservicio, y qué haría falta, 24. 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026), 🟠 Cobro incompleto, 🟡 Convertidor, 🟡 Datos que mienten, 🟡 Deuda del motor financiero, ✅ El aviso de vencimiento ya llega — en CondoManager (22-ago-2026), Lo que quedó funcionando ✅ (+2 more)

### Community 29 - "peerDependencies"
Cohesion: 0.20
Nodes (10): framer-motion, react, react-dom, framer-motion, react, react-dom, peerDependencies, framer-motion (+2 more)

### Community 30 - "magnific-upscale.mjs"
Cohesion: 0.36
Nodes (9): __dirname, loadEnvLocal(), main(), parseArgs(), pollTask(), REPO_ROOT, safeJson(), sleep() (+1 more)

### Community 31 - "Auditoría — DomusCRM, el portero y el alta de cuenta"
Cohesion: 0.22
Nodes (8): 🟡-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — Formulario "Crear mi cuenta": falta un campo de apellido separado, 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 · fix #2 etapa 1 CORREGIDA 15-ago-2026 (etapas 2-3 pendientes) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador, 🟡-2 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — "Las dos contraseñas no están en la misma fila": Gina tenía razón, no era caché ni mobile, Auditoría — DomusCRM, el portero y el alta de cuenta, 🔴 CRÍTICO, Estado 10-ago-2026, Estado 15-ago-2026, 🟡 MEDIO

### Community 32 - "NotificationBell.tsx"
Cohesion: 0.28
Nodes (6): Notificacion, NotificationBell(), NotificationBellProps, TYPE_COLOR, TYPE_ICON, useOnClickOutside()

### Community 33 - "4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026"
Cohesion: 0.25
Nodes (8): 4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026, El catálogo de productos ✅ y lo que sigue pendiente, El circuito completo, cerrado el 22-ago-2026 ✅, El portero: `/auth/login` es un pasillo, no una pantalla, PayPhone: los cuatro hechos que cuestan un día si no están escritos, Quién cobra a quién — modelo fijado por Gina, 22-ago-2026, Railway: las variables selladas no se leen, ni desde la sesión, Un cobro fallido ya deja rastro — antes se evaporaba

### Community 34 - "7. Decisión de arquitectura (2026-07-26)"
Cohesion: 0.25
Nodes (8): 7. Decisión de arquitectura (2026-07-26), Objetivo de capacidad: ~3000 usuarios (no "por el momento"), Orden de migración, por urgencia, Por qué R2 y dos cubos, Railway y no un VPS pelado, Riesgos aceptados, Se elimina, Verificado 2026-07-28: qué base va a Railway y qué se queda en Supabase

### Community 35 - "Auditoría — geo-sorsabsa"
Cohesion: 0.25
Nodes (7): 🔵-1 — ✅ CORREGIDO 10-ago-2026 — El propio README del servicio decía que nadie lo consumía, dato desactualizado desde el 08-ago, 🔴-1 — 🟡 CORREGIDO EN CÓDIGO 15-ago-2026, FALTA DESPLEGAR — `/resolver` acepta cualquier URL, sin dominio permitido ni autenticación — SSRF real, sin control de abuso, Auditoría — geo-sorsabsa, 🔵 BAJO, 🔴 CRÍTICO, Pendiente de decidir con Gina antes de ejecutar, Resuelto, verificado, no tocar

### Community 36 - "Auditoría — qa_sorsabsa"
Cohesion: 0.25
Nodes (7): 🟠-1 — ✅ CORREGIDO 10-ago-2026 — La tabla de README.md no sumaba porque el conteo de DomusCRM estaba mal, 🟠-2 — ✅ CORREGIDO 10-ago-2026 — El bloque de estado de TODO.md describía un repo de hace 3 semanas, no el actual, 🟠-3 — ✅ CORREGIDO 10-ago-2026 — Un check de JustiRed aceptaba que el servidor reventara como resultado "válido", Auditoría — qa_sorsabsa, 🟠 MEDIO, Recomendación, no ejecutada — pendiente de que Gina decida, Verificado, sin hallazgos

### Community 37 - "Estándar de UI del ecosistema SORSABSA"
Cohesion: 0.25
Nodes (7): 1. Prohibidos los diálogos del NAVEGADOR, 2. La campana de notificaciones, 3. El requisito de cuenta se pide para servir, no para cobrar, 4. Toda pantalla de acceso ofrece crear cuenta, Cómo se vigila esta regla (desde el 23-ago-2026), Estándar de UI del ecosistema SORSABSA, Qué se hace en su lugar

### Community 38 - "Color de marca y contraste"
Cohesion: 0.29
Nodes (6): Color de marca y contraste, Componentes que ya lo aplican, Cuál usar, Cómo comprobarlo, La regla, Los cuatro tokens

### Community 39 - "modales.mjs"
Cohesion: 0.29
Nodes (3): IGNORAR, PATRONES, raices

### Community 40 - "3. Mapa de bases de datos — LA TRAMPA"
Cohesion: 0.33
Nodes (6): 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, ⚠️ Acoplamiento que sigue vivo, El límite de 2 proyectos ya no existe — y la separación sigue sin hacerse, Estado ✅ verificado en SQL el 2026-07-30 — nombre y ocupantes actualizados 08-ago-2026, Qué cambió desde el 2026-07-26

### Community 41 - "25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026)"
Cohesion: 0.33
Nodes (6): 25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026), ✅ Cerrado el 22-ago-2026 — los cinco productos, Corrección del 22-ago-2026 y decisión de Gina, Lo hecho ✅, Lo que falta 🟡, Lo que había — auditado el 22-ago-2026

### Community 42 - "27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)"
Cohesion: 0.33
Nodes (6): 27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026), El hueco: código escrito que nadie ejecutaba, Lo hecho ✅ — `app/admin/clientes`, Lo que la pantalla dice y el sistema antes se callaba, Lo que queda 🟡, 🔴 Y el agujero que apareció al leer los endpoints

### Community 44 - "🟠 IMPORTANTE"
Cohesion: 0.40
Nodes (5): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@13d9176` — La pantalla de "sin empresa" no tiene marca — coincide con el reporte de "pantalla en blanco", 🟠-2 — 🔧 Parcialmente corregido 10-ago-2026 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11, 🟠-3 — ✅ CORREGIDO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Una falla de nuestra base de datos se le reportaba al usuario como "no pagaste", 🟠-4 — ✅ CORREGIDO 15-ago-2026, commit `domuscrm@479ea1b`; la pantalla pasa al componente compartido 16-ago-2026 (`domuscrm@449e7c3`) — El panel le decía "Iniciar sesión" a alguien que ya tenía la sesión iniciada, 🟠 IMPORTANTE

### Community 45 - "23. ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito"
Cohesion: 0.40
Nodes (5): 23. ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito, Estado real, relevado el 16-ago-2026 (no supuesto), ⚠️ Este CRM NO es DomusCRM — no confundirlos nunca, Lo que se pierde mientras tanto — dicho y aplazado a conciencia, Orden sugerido cuando se retome

### Community 46 - "28. ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026"
Cohesion: 0.40
Nodes (5): 28.1 · CondoManager → EcoInmobiliaria (lo más cerca de valer dinero), 28.2 · agente24siete — el alta que antes no existía, 28.3 · Lo que arrastra de días anteriores, 28. ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026, Lo que NO está en esta lista, a propósito

### Community 47 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, conformidad, conformidad:local, test, typecheck

### Community 48 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 49 - "2. Los dos planos"
Cohesion: 0.50
Nodes (4): 2. Los dos planos, Plano de proceso — NO EXISTE ❌, Plano de proceso — YA EXISTE, parcialmente ✅ (corrección 2026-07-30), Plano web — Vercel ✅ correcto

### Community 50 - "6-bis. Plano de DNS y correo ✅ verificado 2026-07-26"
Cohesion: 0.50
Nodes (4): 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26, Hostinger, Limitaciones y minas, Quién manda qué correo — reescrito 09-ago-2026, con los dos consumidores reales verificados

### Community 52 - "26. 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)"
Cohesion: 0.50
Nodes (4): 26. 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026), El estado real, producto por producto, La lección de método, que es la que se repitió todo el día, Lo que bloquea cada uno, en orden de cercanía a una venta

### Community 53 - "files"
Cohesion: 0.50
Nodes (4): files, src, README.md, tailwind-preset.cjs

### Community 55 - "1. Inventario"
Cohesion: 0.67
Nodes (3): 1. Inventario, Transversales (no se venden solos — cruzan todos los verticales), Verticales (lo que un cliente compra)

### Community 56 - "4-quater. Mapa de repos y el grafo — ✅ levantado 22-ago-2026"
Cohesion: 0.67
Nodes (3): 4-quater. Mapa de repos y el grafo — ✅ levantado 22-ago-2026, El grafo de conocimiento — **consúmelo ANTES de investigar**, Producto ↔ carpeta ↔ repo ↔ rama

### Community 57 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, motion, motion

### Community 58 - "lucide-react"
Cohesion: 0.67
Nodes (3): lucide-react, lucide-react, lucide-react

## Knowledge Gaps
- **516 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Pendientes del ecosistema SORSABSA` connect `Pendientes del ecosistema SORSABSA` to `Plan — una persona en más de un condominio (CondoManager)`, `25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026)`, `27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)`, `23. ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito`, `28. ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026`, `21-bis. 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026`, `26. 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)`, `24. 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026`, `7. Decisión de arquitectura (2026-07-26)`, `Plan — una persona en más de un condominio (CondoManager)`, `3. Mapa de bases de datos — LA TRAMPA`, `2. Los dos planos`, `6-bis. Plano de DNS y correo ✅ verificado 2026-07-26`, `1. Inventario`, `4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)`, `4-quater. Mapa de repos y el grafo — ✅ levantado 22-ago-2026`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` connect `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` to `Plan — una persona en más de un condominio (CondoManager)`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058001397624039136 - nodes in this community are weakly interconnected._
- **Should `BrandProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07088989441930618 - nodes in this community are weakly interconnected._