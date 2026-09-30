# Graph Report - diseno-sorsabsa  (2026-09-30)

## Corpus Check
- 108 files · ~167,885 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 1186 nodes · 1760 edges · 85 communities (75 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac3793e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DomusLanding.tsx
- conformidad.mjs
- main
- BrandProvider.tsx
- Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)
- Modelo de trabajo de JustiRed
- Contexto — Pericia QUITUMBE: adquisición del indicio USB
- showcase/package.json
- Auditoría — JustiRed (legaltech)
- 🔴 CRÍTICO
- costura.mjs
- index.ts
- Auditoría del portero — ¿valida por dónde entra?
- Pendientes del ecosistema SORSABSA
- package.json
- IconName
- Almacenamiento del ecosistema: modelo, costos y cómo lo hacen otros
- Estándar de desarrollo — no parchear la arquitectura
- ref_react
- Auditoría — CondoManager como aplicación (más allá del portero)
- TableDemo.tsx
- 21-bis. 🗄️ 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026
- resolveColors.ts
- Plan — una persona en más de un condominio (CondoManager)
- devDependencies
- compilerOptions
- Costeo del Convertidor — la prueba de Miraflores
- NotificationBell.tsx
- compilerOptions
- App.tsx
- Auditoría — agente24siete, el portero (sesión/autenticación)
- Plan de desoldado del ecosistema SORSABSA
- Plan — Identificación de unidades configurable por condominio
- @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA
- 29. 🗄️ 🟡 Lo que queda del barrido de UI del 23-ago-2026 — 18 modales, 8 desvíos y un sistema de avisos sin disparador
- Cierre del ecosistema SORSABSA — 29-sep-2026
- 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)
- 29.7 · Autoauditoría de esta tanda contra `ESTANDAR-DESARROLLO.md`
- scripts
- IconCatalog.tsx
- Toast
- 24. 🗄️ 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)
- Plan — Reordenar Configuración/Parametrización de CondoManager
- ToastProvider.tsx
- Auditoría — DomusCRM, el portero y el alta de cuenta
- Button.tsx
- BrandPanel
- 4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026
- 7. Decisión de arquitectura (2026-07-26)
- 🟠 IMPORTANTE
- Auditoría — geo-sorsabsa
- Auditoría — qa_sorsabsa
- Estándar de UI del ecosistema SORSABSA
- Arquitectura del ecosistema SORSABSA
- Auditoría del Convertidor — hallazgos de uso real
- Notificacion
- ButtonMatrix.tsx
- lib.ts
- 3. Mapa de bases de datos — LA TRAMPA
- 27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)
- 30. 🗄️ 🟡 Las cuatro comprobaciones que sí encuentran cosas — y el grafo, que no (23-ago-2026)
- 23. 🗄️ ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito
- 28. 🗄️ ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026
- 31. 🗄️ 🔵 El "quién soy" está escrito dos veces, y las copias ya divergieron — 23-ago-2026
- 32. 🗄️ ⬜ DECISIÓN DE ARQUITECTURA — ¿la app de IoT escribe sola en R2, o el respaldo es manual? (29-ago-2026)
- peerDependencies
- NotificationDemo.tsx
- useBrand
- TypingDotsDemo.tsx
- vercel.json
- 2. Los dos planos
- 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26
- 9. Pendientes, en orden
- mensajeDeError
- 26. 🗄️ 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)
- Cómo conectarse a Cloudflare/R2 desde una sesión de Claude Code — ✅ SÍ SE PUEDE, verificado 15-ago-2026
- exports
- @testing-library/jest-dom
- dependencies

## God Nodes (most connected - your core abstractions)
1. `Pendientes del ecosistema SORSABSA` - 36 edges
2. `Icon` - 27 edges
3. `Estándar de desarrollo — no parchear la arquitectura` - 21 edges
4. `IconName` - 19 edges
5. `BrandPanel()` - 17 edges
6. `BrandProvider()` - 17 edges
7. `Card()` - 16 edges
8. `Wordmark()` - 16 edges
9. `Plan — una persona en más de un condominio (CondoManager)` - 16 edges
10. `Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Pendientes conocidos` --references--> `main()`  [INFERRED]
  docs/ARQUITECTURA-ECOSISTEMA.md → scripts/magnific-upscale.mjs
- `Los cuatro tokens` --references--> `brandToCssVars()`  [INFERRED]
  docs/COLOR-Y-CONTRASTE.md → src/brand/BrandProvider.tsx
- `✅ Cerrado el 22-ago-2026 — los cinco productos` --references--> `BrandProvider()`  [INFERRED]
  docs/PENDIENTES-ECOSISTEMA.md → src/brand/BrandProvider.tsx
- `Cómo funciona (la arquitectura de tokens)` --references--> `BrandProvider()`  [INFERRED]
  README.md → src/brand/BrandProvider.tsx
- `7 modales nativos, ninguno corregido todavía` --references--> `ConfirmarAccion()`  [INFERRED]
  docs/AUDITORIA-DOMUSCRM.md → src/components/ConfirmarAccion.tsx

## Import Cycles
- None detected.

## Communities (85 total, 10 thin omitted)

### Community 0 - "DomusLanding.tsx"
Cohesion: 0.06
Nodes (50): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@13d9176` — La pantalla de "sin empresa" no tiene marca — coincide con el reporte de "pantalla en blanco", 🟠-2 — 🔧 Parcialmente corregido 10-ago-2026 — Ver `AUDITORIA-PORTERO-SSO.md` 🔴-11, 🟠-3 — ✅ CORREGIDO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Una falla de nuestra base de datos se le reportaba al usuario como "no pagaste", 🟠-4 — ✅ CORREGIDO 15-ago-2026, commit `domuscrm@479ea1b`; la pantalla pasa al componente compartido 16-ago-2026 (`domuscrm@449e7c3`) — El panel le decía "Iniciar sesión" a alguien que ya tenía la sesión iniciada, 🟠 IMPORTANTE, 🟠-10 — ⬜ CondoManager muestra un rechazo de negocio cuando lo que falló es la red — encontrado 16-ago-2026, 🟠-1 — ✅ Excepción hardcodeada `app === 'iot'` en /auth/complete — RESUELTO 08-ago-2026, 🟠-2 — ✅ RESUELTO 15-ago-2026, commit `auth-sorsabsa@bc38ca1` — Bypass de entitlements hardcodeado por nombre de producto (+42 more)

### Community 1 - "conformidad.mjs"
Cohesion: 0.06
Nodes (29): vite, @vitejs/plugin-react, __dirname, AQUI, grafoAtrasado(), pedirGitHub(), tokenGitHub(), ultimoCommitDeCodigo() (+21 more)

### Community 2 - "main"
Cohesion: 0.05
Nodes (42): 4-quater. Mapa de repos y el grafo — ✅ levantado 22-ago-2026, Cómo se REGISTRA alguien en un producto — la regla, para no volver a buscarla, Dónde vive el grafo de cada repo, y qué lo regenera, El destino del correo de confirmación: SIEMPRE al portero, El grafo de conocimiento — **consúmelo ANTES de investigar**, El patrón, cuando el producto registra, La dependencia que hay que dejar puesta, Producto ↔ carpeta ↔ repo ↔ rama (+34 more)

### Community 3 - "BrandProvider.tsx"
Cohesion: 0.09
Nodes (30): 22-ago-2026 — el punto 9 se ejecutó por fin, seis días después, y el fix estaba a la mitad, 🟠-4 — ✅ CERRADO 22-ago-2026 en DOS pasos (`agente24siete@61760c5` + `agente24siete@628c84a`) — "Salir" no sacaba. Primero por la cookie; después, descubierto al ejecutar por fin el punto 9, porque borraba UNA de las DOS llaves de sesión. Encontrado 16-ago-2026, cerrado el 22-ago-2026, @testing-library/react, BRAND_FONT_IMPORTS, BrandConfig, BrandContext, BrandProvider(), brandToCssVars() (+22 more)

### Community 4 - "Plan — SorsabsaForensic a la web (herramienta de perito + servicio público)"
Cohesion: 0.05
Nodes (42): 10. Plazo real y calendario, 11. Dominio, 12. Decisiones pendientes, 1. Los dos perfiles y el modelo de negocio, 3.a Navegación: gestión ≠ ejecución (pedido de Gina, 15-ago-2026), 3. Acceso al contenido de las plataformas — lo único que cambia en `core/`, 3.b Editor de texto enriquecido — requisito, no mejora futura, 3.c Tres fallos silenciosos que salieron al operar la interfaz (+34 more)

### Community 5 - "Modelo de trabajo de JustiRed"
Cohesion: 0.05
Nodes (40): 10. Reglas de trabajo que salieron de los defectos, 1. Inventariar — ✅, 1. Las unidades de trabajo, 2. Adquirir — ✅ separado el 17-ago-2026, 2. Clasificaciones que importan, 3. Cómo clasifican las empresas del sector, 3. Extraer — ✅ desde el 19-ago-2026, 4. El inventario (+32 more)

### Community 6 - "Contexto — Pericia QUITUMBE: adquisición del indicio USB"
Cohesion: 0.05
Nodes (38): 1. El caso, 2.1 DESCARTADO: bloqueo de escritura por registro de Windows, 2.2 NO hace falta comprar hardware, 2.3 CAMINO ELEGIDO: live USB forense, 2.4 Lo que sostiene la pericia es la cadena de hashes, 2.5 Reglas de orden — no son opcionales, 2. Decidido y verificado — no volver a discutir, 3.1 El ensayo — se puede hacer hoy, sobre un USB propio (+30 more)

### Community 7 - "showcase/package.json"
Cohesion: 0.05
Nodes (36): autoprefixer, postcss, tailwindcss, dependencies, framer-motion, lucide-react, motion, react (+28 more)

### Community 8 - "Auditoría — JustiRed (legaltech)"
Cohesion: 0.07
Nodes (29): 10-ago-2026 — Estado real, adónde debe llegar, y los transversales que esta auditoría todavía no cubrió, 15-ago-2026 — Qué se ejecutó, qué falta, 🟠-1 — ✅ Corregido en código 15-ago-2026 (ver `AUDITORIA-PORTERO-SSO.md` 🔴-11), 🔴-1 — ✅ RESUELTO 15-ago-2026 — El panel de Control de Calidad no hace nada: RLS bloquea la tabla para cualquier usuario, la UI lo esconde con un "éxito" falso, 23-ago-2026 — Por qué JustiRed "iba por otro camino": la respuesta, a la tercera vez que Gina lo preguntó, 26-ago-2026 — Las tres puertas que no existían, y el estado medido, 🔴-2 — 🔧 El portero central tiene a JustiRed registrada en un dominio que NO EXISTE: todo login termina en `justired.app` (NXDOMAIN), 🔴-3 — ✅ RESUELTO 15-ago-2026 — La cola de revisión no gateaba nada: toda ley capturada era pública desde el primer segundo, aprobada o no (+21 more)

### Community 9 - "🔴 CRÍTICO"
Cohesion: 0.07
Nodes (27): 🔴-10 — ✅ Confirmar cuenta daba "No se pudo instalar la sesión" — RESUELTO 09-ago-2026, completa a 🔴-7, 🔴-11 — 🔧 DomusCRM y agente24siete corregidos 10-ago-2026; JustiRed corregido en código 15-ago-2026, pendiente de deploy — El portero está mal implementado en los 4 productos web, y de tres maneras distintas, 🔴-12 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — agente24siete verificaba su sesión contra el proyecto Supabase equivocado — causa real del bucle que 🔴-1/🟠-3 nunca cerraron, 🔴-13 — ⬜ NO QUEDA UNA SOLA CUENTA EN `auth.users` DE NINGÚN PROYECTO DEL ECOSISTEMA — encontrado 26-ago-2026, 🔴-1 — ✅ Alta de usuarios no gobernada: el pipeline de registro de cada producto no sabe que identity existe — RESUELTO 09-ago-2026, 🟡-1 — ✅ Eliminación manual de cuentas reales vía SQL directo — reconocido, no repetir, 🔵-1 — ⬜ `iot.redirectUrl` es una URL cruda de Railway, no dominio propio, 🔴-2 / 🔴-3 — ✅ Fallback que trata "no configurado" como estado válido, en el motor de cobros — PAGOS_API_KEY rotada y verificada (+19 more)

### Community 10 - "costura.mjs"
Cohesion: 0.12
Nodes (25): aBarras(), cfg, descubrirLlamadas(), descubrirRutas(), entrada, ENV_SERVICIOS, esDir(), existe() (+17 more)

### Community 11 - "index.ts"
Cohesion: 0.13
Nodes (21): Checkbox, CheckboxProps, SectionHeader(), SectionHeaderProps, SegmentedControl(), SegmentedControlProps, SegmentedOption, ALIGN (+13 more)

### Community 12 - "Auditoría del portero — ¿valida por dónde entra?"
Cohesion: 0.08
Nodes (23): Análisis · Por qué deja pasar sin membresía, y qué cuesta, Auditoría del portero — ¿valida por dónde entra?, Convertidor: el costo-beneficio, medido, El desacuerdo entre los dos gates, El problema de negocio del Convertidor no es el freemium, Excepciones por producto en el portero, Google y Facebook: mismo camino, mismo resultado, Hallazgos (+15 more)

### Community 13 - "Pendientes del ecosistema SORSABSA"
Cohesion: 0.09
Nodes (23): 10. ✅ Login social: Google ✅ cerrado — Facebook ✅ funciona, Revisión de Meta APROBADA, 11. ✅ HECHO — agente24siete: login real en /portal + cascarón viejo borrado, 12. 🗄️ 🟡 R2 desplegado y verificado — falta el clic real de un residente, 13. ✅ HECHO — geo-sorsabsa/service desplegado, verificado y consumido por los dos periciales, 14. ✅ HECHO — iot consume el portero central (auth-sorsabsa), 15. 🗄️ 🔴 WhatsApp de agente24siete: TODAS las cuentas del portafolio, baneadas — dos pistas separadas, 16. 🗄️ 🟡 Estandarizar pagos/suscripciones/referidos en TODOS los productos — JustiRed sin nada, y una idea de "créditos de IA" todavía sin desarrollar, 17. 🗄️ 🟡 Gobernanza de correo masivo por tenant (activación de residentes, alícuotas) — diseño acordado, infraestructura sin construir (+15 more)

### Community 14 - "package.json"
Cohesion: 0.09
Nodes (22): description, files, framer-motion, lucide-react, motion, react, react-dom, @types/react (+14 more)

### Community 15 - "IconName"
Cohesion: 0.16
Nodes (14): FormSectionProps, InputProps, MobileNavItem, MobileNavProps, SinAccesoProps, StatusBadgeProps, StatusTone, TONE_CLASS (+6 more)

### Community 16 - "Almacenamiento del ecosistema: modelo, costos y cómo lo hacen otros"
Cohesion: 0.10
Nodes (21): 0 · Lo primero, porque cambia el planteo, 1 · Los tres tipos de almacenamiento — la pregunta de Gina, 2 · Método: dónde va cada cosa, y por qué, 3 · Cuánto cuesta — las cuentas hechas, 4 · Lo que sí puede doler: el que paga un mes y se va, 5 · Lo que hay que decidir, 6 · Qué hay que construir, en orden, 7 · El riesgo que no es de costo, y es el más grande (+13 more)

### Community 17 - "Estándar de desarrollo — no parchear la arquitectura"
Cohesion: 0.10
Nodes (21): Antes de cada fix — responder internamente, Criterio de aceptación, Criterio de aceptación de la parte II, Estándar de desarrollo — no parchear la arquitectura, Fuente única de verdad, "Funciona" no es lo mismo que "está bien diseñado", PARTE I — No parchear la arquitectura, PARTE II — Lo que existe y no funciona (+13 more)

### Community 18 - "ref_react"
Cohesion: 0.13
Nodes (14): AppShell(), AppShellProps, Avatar(), AvatarProps, getInitials(), SIZE, ConfirmarAccionProps, Select (+6 more)

### Community 19 - "Auditoría — CondoManager como aplicación (más allá del portero)"
Cohesion: 0.11
Nodes (18): 🔵-1 — ✅ Artefactos compilados (`scratch/dist/**/*.js`) commiteados al repo — RESUELTO 09-ago-2026, 🟠-1 — ✅ Chequeo de rol/autorización reimplementado en al menos 13 rutas, sin fuente única — RESUELTO 09-ago-2026, 🟠-2 — ✅ `resolverPostLogin`: un error de consulta se trata igual que "usuario sin perfiles todavía" — RESUELTO 09-ago-2026, 🔵-2 — ✅ Unidad fantasma auto-creada en cada registro de admin — RESUELTO 09-ago-2026, 🔵-3 — ✅ `codigo_predial` sin garantía de unicidad — RESUELTO 09-ago-2026, 🔴-3 — ✅ `registros_pendientes` y `campanas_masivas` sin GRANT ni RLS — service_role no podía usarlas — RESUELTO 09-ago-2026, 🟠-3 — ✅ Ubicación y Contacto escribían las mismas columnas sin saberlo — pérdida de datos real — RESUELTO 09-ago-2026, 🔵-4 — ✅ `deudas.rubro_id`: UI decía "opcional", la base exigía `NOT NULL`, y un `LEFT JOIN` faltante lo hacía peor — RESUELTO 09-ago-2026 (+10 more)

### Community 20 - "TableDemo.tsx"
Cohesion: 0.16
Nodes (10): DATA, TableDemo(), hideClass(), Table(), TableBody(), TableCell(), TableEmpty(), TableHead() (+2 more)

### Community 21 - "21-bis. 🗄️ 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026"
Cohesion: 0.12
Nodes (17): 1 · Síntoma, 21-bis. 🗄️ 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026, 2 · Causa inmediata — cuatro cortes independientes en la misma cadena, 3 · Causa raíz, 4 · Componente responsable, 5 · Código afectado, 6 · Solución de raíz (no parche), 7 · Código a eliminar — ✅ hecho (+9 more)

### Community 22 - "resolveColors.ts"
Cohesion: 0.23
Nodes (12): ColorPalette(), TOKEN_ORDER, ContrastReport(), LevelBadge(), channelLinear(), contrastRatio(), hexToRgb(), relativeLuminance() (+4 more)

### Community 23 - "Plan — una persona en más de un condominio (CondoManager)"
Cohesion: 0.12
Nodes (16): Alcance real — corregido 09-ago-2026, Apéndice — utilidades de reset para la ronda manual, Causa raíz, Fase 0.5 — Gestión de asociaciones — ✅ RESUELTO 09-ago-2026 (`condomanager@8ebb812`), Fase 0 — Confirmado, no se repite, Fase 1 — Esquema — ✅ RESUELTO 09-ago-2026, Fase 2 — RLS y funciones SQL — ✅ RESUELTO 09-ago-2026 (Opción B), Fase 3 — "Condominio activo": un solo mecanismo — ✅ RESUELTO 15-ago-2026 (+8 more)

### Community 24 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, framer-motion, jest, jest-environment-jsdom, lucide-react, react, react-dom, @testing-library/jest-dom (+8 more)

### Community 25 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module, moduleResolution (+7 more)

### Community 26 - "Costeo del Convertidor — la prueba de Miraflores"
Cohesion: 0.13
Nodes (14): 1 · Qué se probó, 2 · El problema de negocio, en una línea, 3-bis · Lo que la prueba sintética NO mostraba, 3 · Qué se midió, y cómo, 4 · Lo que NO cuesta, 5 · Las opciones de precio, 6 · El detalle que no es de costeo pero salió de la misma prueba, A · Cambiar el modelo de visión (+6 more)

### Community 27 - "NotificationBell.tsx"
Cohesion: 0.17
Nodes (11): 25. ✅ La campana es LA MISMA en todos los productos (cerrado 22-ago-2026), ✅ Cerrado el 22-ago-2026 — los cinco productos, Corrección del 22-ago-2026 y decisión de Gina, Lo hecho ✅, Lo que falta 🟡, Lo que había — auditado el 22-ago-2026, NotificationBell(), NotificationBellProps (+3 more)

### Community 28 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 29 - "App.tsx"
Cohesion: 0.18
Nodes (4): App(), BRAND_KEYS, AtomShowcase(), Section()

### Community 31 - "Auditoría — agente24siete, el portero (sesión/autenticación)"
Cohesion: 0.15
Nodes (12): 🟡-1 — ⬜ El `refresh_token` se descarta: la sesión dura 60 minutos y se "renueva" con una vuelta completa por el portero. Encontrado 16-ago-2026, 🔴-1 — ✅ RESUELTO Y VALIDADO EN VIVO 10-ago-2026 — El portero de agente24siete es 100% client-side — sin `middleware.ts`, a diferencia del patrón ya estabilizado en CondoManager, 🔴-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@16ef1db` — Los 11 endpoints de `pages/api/admin/` llamaban a `autenticarAdmin` sin `await`: el `if (!usuario) return` nunca se cumplía y el cuerpo del handler se ejecutaba con la sesión rechazada, 🟡-2 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@d168078` — El portero se reejecutaba en CADA clic del menú, y mientras tanto la pantalla decía "Redirigiendo al acceso…" aunque no fuera a ningún lado, 🔴-3 — ✅ CORREGIDO 22-ago-2026, commit `agente24siete@bd3a7a6` — El producto nunca preguntaba QUIÉN SOS: decidía "administradora o clienta" mirando la URL pedida, y `usuarios`/`clientes` solo servían para rechazarte después, 🟡-3 — ⬜ No existe ningún registro de accesos NI de rechazos: el único rastro es un campo que se pisa. Encontrado 22-ago-2026, Auditoría — agente24siete, el portero (sesión/autenticación), 🔴 CRÍTICO (+4 more)

### Community 32 - "Plan de desoldado del ecosistema SORSABSA"
Cohesion: 0.15
Nodes (13): auth-sorsabsa reapuntado — commit `212f8b9`, 07-ago-2026, ✅ Cerrado el 07-ago-2026 — login OIDC real, de punta a punta, token verificado, ✅ Cerrado el 07-ago-2026 — probado en proyecto vacío real, con dos bugs reales encontrados y arreglados, Estado — 07-ago-2026: la federación funciona; el criterio de "hecho" hay que leerlo con matices, Estado — hecho el 07-ago-2026, con un pendiente real, Lo que NO se hace (decidido, con razón escrita), Paso 0 — Sacar el plano ⛔ BLOQUEANTE, va primero, Paso 1 — Identity como emisor OIDC (+5 more)

### Community 33 - "Plan — Identificación de unidades configurable por condominio"
Cohesion: 0.15
Nodes (13): Causa raíz, `condominios`, Decisión de diseño (a partir de la corrección de Gina), Diseño de datos, Dónde se configura, Estado — 15-ago-2026, Fases, Inventario completo — los 23 archivos, categorizados (+5 more)

### Community 34 - "@sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA"
Cohesion: 0.15
Nodes (12): ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real), ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026), Cómo funciona (la arquitectura de tokens), Instalación en un producto, ⚠️ La etiqueta tiene que ser ANOTADA, La regla ya NO depende de la memoria: hook pre-push, Pruebas, Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes) (+4 more)

### Community 35 - "29. 🗄️ 🟡 Lo que queda del barrido de UI del 23-ago-2026 — 18 modales, 8 desvíos y un sistema de avisos sin disparador"
Cohesion: 0.26
Nodes (12): 🟠-5 — 🔧 56 modales del navegador, nunca contados: 46 fuera, 10 vivos — 23-ago-2026, 🔵-6 — ✅ El sistema de componentes en paralelo, retirado — y tres "duplicados" que no lo eran — 23-ago-2026, Próximo paso (actualizado, al final del documento — ver también la nota de Próximo paso más arriba, en el cuerpo del documento), 5. Si un producto duplica, preguntar qué necesitaba, 29.1 · 18 modales del navegador, 29.4 · La deuda que se retira se escribe (regla 6, parte II), 29.5 · Los tres checks afirmaban cosas que no habían mirado (`diseno@68fbdc0`), 29.6 · Cómo correr estas comprobaciones (+4 more)

### Community 36 - "Cierre del ecosistema SORSABSA — 29-sep-2026"
Cohesion: 0.17
Nodes (12): 1.1 · El respaldo de IoT del 29-sep, 1 · Datos reales — lo único de este cierre que es urgente, 2 · Trabajo pericial real — no es software, no se archiva con él, 3 · Lo que sí funcionó (verificado en su momento, no supuesto), 4 · Estado final de cada pendiente de `PENDIENTES-ECOSISTEMA.md`, 5 · Planes, 6 · Auditorías — los 16 hallazgos que quedaron abiertos, 7 · Repositorios al 29-sep (+4 more)

### Community 37 - "4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)"
Cohesion: 0.18
Nodes (11): 4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08), API tokens de R2 activos — ✅ dados por Gina 08-ago-2026, Auditoría del inventario de Railway, 10-ago-2026, El proyecto de Google Cloud (`sorsabsaecosystem`) — ✅ confirmado por Gina: Calendar de agente24siete, Geo: NO usa la API de Google Maps (la que factura), Herramientas de una sesión: qué se puede ejecutar y por dónde — verificado 19-ago-2026, Inventario de repositorios — dónde vive cada uno · levantado 29-ago-2026, R2: quién ya migró y quién no (+3 more)

### Community 38 - "29.7 · Autoauditoría de esta tanda contra `ESTANDAR-DESARROLLO.md`"
Cohesion: 0.18
Nodes (11): 29.7 · Autoauditoría de esta tanda contra `ESTANDAR-DESARROLLO.md`, 🔴 A-1 — La guardia de frescura fallaba ABIERTA (pregunta 10), 🔴 A-2 — Verifiqué todo a mano (pregunta 17, reglas 1 a 3), 🟠 A-3 — La lista de productos vivía en cinco lugares (pregunta 6), 🟠 A-4 — El dato estaba en `ARQUITECTURA-ECOSISTEMA.md` y no lo abrí. Dos veces, 🟠 A-5 — El check de modales vive en el repo equivocado (regla 2), 🟡 A-6 — Dije "el ecosistema" midiendo 7 de 11 repos (regla 4), 🟡 A-7 — Probé mutando el repo real de Gina (pregunta 11) (+3 more)

### Community 39 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, conformidad, conformidad:local, costura, costura:ecosistema, huerfanos, huerfanos:local, modales (+3 more)

### Community 40 - "IconCatalog.tsx"
Cohesion: 0.22
Nodes (5): IconCatalog(), NAMES, SHADOW, NotImplemented(), SpacingScale()

### Community 41 - "Toast"
Cohesion: 0.27
Nodes (9): 1. Inventario, Transversales (no se venden solos — cruzan todos los verticales), Verticales (lo que un cliente compra), 29.3 · El design system tiene `Toast` pero no cómo dispararlo, @testing-library/user-event, Toast(), Disparador(), ToastProvider() (+1 more)

### Community 42 - "24. 🗄️ 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)"
Cohesion: 0.20
Nodes (10): 24.10-bis · Por qué agente24siete no puede tener autoservicio, y qué haría falta, 24. 🗄️ 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026), 🟠 Cobro incompleto, 🟡 Convertidor, 🟡 Datos que mienten, 🟡 Deuda del motor financiero, ✅ El aviso de vencimiento ya llega — en CondoManager (22-ago-2026), Lo que quedó funcionando ✅ (+2 more)

### Community 43 - "Plan — Reordenar Configuración/Parametrización de CondoManager"
Cohesion: 0.20
Nodes (10): Alcance real, verificado leyendo cada archivo (no asumido), Causa raíz, Decidido y ejecutado (ya no está pendiente), Fase 1 — ✅ RESUELTO 09-ago-2026 (`condomanager@5267329`), Fase 2 — ✅ RESUELTO 09-ago-2026 (`condomanager@e9dcf0f`), Fase 3 — ✅ RESUELTO 09-ago-2026 (`condomanager@2d9c0a9`) — Reagrupar el sidebar, Fase 4 — Verificación y cierre — 🔧 casi cerrada (15-ago-2026), Fases (+2 more)

### Community 44 - "ToastProvider.tsx"
Cohesion: 0.24
Nodes (9): ToastProps, Aviso, AvisoNuevo, Contexto, ContextoToast, DURACION_POR_TONO, POSICION, PosicionToast (+1 more)

### Community 45 - "Auditoría — DomusCRM, el portero y el alta de cuenta"
Cohesion: 0.22
Nodes (8): 🟡-1 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — Formulario "Crear mi cuenta": falta un campo de apellido separado, 🔴-1 — 🔧 Fix #1 CORREGIDO 10-ago-2026 · fix #2 etapa 1 CORREGIDA 15-ago-2026 (etapas 2-3 pendientes) — Dos gates independientes para "¿esta cuenta tiene acceso?" dan respuestas distintas para el mismo hecho, según el historial del navegador, 🟡-2 — ✅ CORREGIDO 10-ago-2026, commit `domuscrm@407c277` — "Las dos contraseñas no están en la misma fila": Gina tenía razón, no era caché ni mobile, Auditoría — DomusCRM, el portero y el alta de cuenta, 🔴 CRÍTICO, Estado 10-ago-2026, Estado 15-ago-2026, 🟡 MEDIO

### Community 46 - "Button.tsx"
Cohesion: 0.22
Nodes (6): ButtonProps, ButtonSize, CommonProps, SIZES, VARIANTS, PropertyCarouselProps

### Community 47 - "BrandPanel"
Cohesion: 0.25
Nodes (5): BrandPanel(), MOCK_PROPERTIES, MockProperty, PropertyCarouselDemo(), PropertyCarousel()

### Community 48 - "4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026"
Cohesion: 0.25
Nodes (8): 4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026, El catálogo de productos ✅ y lo que sigue pendiente, El circuito completo, cerrado el 22-ago-2026 ✅, El portero: `/auth/login` es un pasillo, no una pantalla, PayPhone: los cuatro hechos que cuestan un día si no están escritos, Quién cobra a quién — modelo fijado por Gina, 22-ago-2026, Railway: las variables selladas no se leen, ni desde la sesión, Un cobro fallido ya deja rastro — antes se evaporaba

### Community 49 - "7. Decisión de arquitectura (2026-07-26)"
Cohesion: 0.25
Nodes (8): 7. Decisión de arquitectura (2026-07-26), Objetivo de capacidad: ~3000 usuarios (no "por el momento"), Orden de migración, por urgencia, Por qué R2 y dos cubos, Railway y no un VPS pelado, Riesgos aceptados, Se elimina, Verificado 2026-07-28: qué base va a Railway y qué se queda en Supabase

### Community 50 - "🟠 IMPORTANTE"
Cohesion: 0.25
Nodes (8): 🟠-1 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — No existe botón de cerrar sesión en ningún panel — y la versión ingenua repetiría un bug ya corregido en CondoManager e identity, 🟠-2 — ✅ CORREGIDO 10-ago-2026, commit `agente24siete@c6f2578` — `LoginGate` valida presencia de token, nunca vigencia — deja pasar sesiones vencidas al shell completo, 🟠-3 — ✅ RESUELTO 10-ago-2026 (era la hipótesis (b): configuración) — ¿el mensaje de Gina fue realmente por vencimiento, o hay un problema de configuración?, 🟠-5 — ⬜ El `next` de agente24siete no apunta a su propio `/auth/callback`: el login solo termina por una cadena de fallbacks, con una vuelta entera de más por el portero. Encontrado 16-ago-2026, 🟠-6 — ✅ CORREGIDO Y ESTANDARIZADO 16-ago-2026 — La pantalla terminal encerraba a la persona: sin salir, sin volver a la web, sin poder pedir el alta, 🟠-7 — ✅ CORREGIDO 22-ago-2026 (`6684e54`) · **síntoma de 🔴-3** — Las dos pantallas de rechazo nunca dicen CON QUÉ CUENTA te está rechazando, y con una identidad compartida eso vuelve indistinguible "te rechacé" de "estoy roto", 🟠-8 — ✅ CORREGIDO 22-ago-2026 (`6b9a69a`, **el fix fue un parche; lo reemplazó 🔴-3 en `bd3a7a6`**) — El producto tiene DOS poblaciones y la web UNA sola puerta: la administradora entra por la de clientes, es rechazada con razón, y sale a un callejón cerrado en círculo, 🟠 IMPORTANTE

### Community 51 - "Auditoría — geo-sorsabsa"
Cohesion: 0.25
Nodes (7): 🔵-1 — ✅ CORREGIDO 10-ago-2026 — El propio README del servicio decía que nadie lo consumía, dato desactualizado desde el 08-ago, 🔴-1 — 🟡 CORREGIDO EN CÓDIGO 15-ago-2026, FALTA DESPLEGAR — `/resolver` acepta cualquier URL, sin dominio permitido ni autenticación — SSRF real, sin control de abuso, Auditoría — geo-sorsabsa, 🔵 BAJO, 🔴 CRÍTICO, Pendiente de decidir con Gina antes de ejecutar, Resuelto, verificado, no tocar

### Community 52 - "Auditoría — qa_sorsabsa"
Cohesion: 0.25
Nodes (7): 🟠-1 — ✅ CORREGIDO 10-ago-2026 — La tabla de README.md no sumaba porque el conteo de DomusCRM estaba mal, 🟠-2 — ✅ CORREGIDO 10-ago-2026 — El bloque de estado de TODO.md describía un repo de hace 3 semanas, no el actual, 🟠-3 — ✅ CORREGIDO 10-ago-2026 — Un check de JustiRed aceptaba que el servidor reventara como resultado "válido", Auditoría — qa_sorsabsa, 🟠 MEDIO, Recomendación, no ejecutada — pendiente de que Gina decida, Verificado, sin hallazgos

### Community 53 - "Estándar de UI del ecosistema SORSABSA"
Cohesion: 0.25
Nodes (7): 1. Prohibidos los diálogos del NAVEGADOR, 2. La campana de notificaciones, 3. El requisito de cuenta se pide para servir, no para cobrar, 4. Toda pantalla de acceso ofrece crear cuenta, Cómo se vigila esta regla (desde el 23-ago-2026), Estándar de UI del ecosistema SORSABSA, Qué se hace en su lugar

### Community 54 - "Arquitectura del ecosistema SORSABSA"
Cohesion: 0.29
Nodes (7): 4. Almacenamiento, 5. Roturas verificadas el 2026-07-26, 6. Lo que NO está verificado, 8. Por qué Vercel para la web y Railway para el resto, Arquitectura del ecosistema SORSABSA, Defectos verificados, Pendientes conocidos

### Community 55 - "Auditoría del Convertidor — hallazgos de uso real"
Cohesion: 0.29
Nodes (6): 🔴-1 — ⬜ El párrafo NO «vuelve a fluir»: buscar sobre la salida pierde hasta 2 de cada 3 apariciones, 🟡-2 — ⬜ Dos motores, dos formatos, en el mismo documento, 🔴-3 — ⬜ El motor DESCARTA páginas en silencio, y no todas están en blanco, Auditoría del Convertidor — hallazgos de uso real, ✅ Lo que sí funcionó, medido, Pendiente de medir

### Community 56 - "Notificacion"
Cohesion: 0.29
Nodes (7): 23-ago-2026 — Medido por primera vez: 7 modales del navegador y un tipo duplicado, 7 modales nativos, ninguno corregido todavía, Lo que sí quedó verificado en verde, `Notificacion` declarado de nuevo, Lo que queda vivo, y por qué, 29.2 · 8 desvíos de conformidad — de los cuales 1 es falso positivo, Notificacion

### Community 57 - "ButtonMatrix.tsx"
Cohesion: 0.29
Nodes (4): ButtonMatrix(), SHADOW, VARIANTS, ButtonVariant

### Community 58 - "lib.ts"
Cohesion: 0.38
Nodes (3): SummaryCard(), SummaryCards(), TypographyDemo()

### Community 59 - "3. Mapa de bases de datos — LA TRAMPA"
Cohesion: 0.33
Nodes (6): 3-bis. NO HAY DATOS DE CLIENTES. Punto., 3. Mapa de bases de datos — LA TRAMPA, ⚠️ Acoplamiento que sigue vivo, El límite de 2 proyectos ya no existe — y la separación sigue sin hacerse, Estado ✅ verificado en SQL el 2026-07-30 — nombre y ocupantes actualizados 08-ago-2026, Qué cambió desde el 2026-07-26

### Community 60 - "27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)"
Cohesion: 0.33
Nodes (6): 27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026), El hueco: código escrito que nadie ejecutaba, Lo hecho ✅ — `app/admin/clientes`, Lo que la pantalla dice y el sistema antes se callaba, Lo que queda 🟡, 🔴 Y el agujero que apareció al leer los endpoints

### Community 61 - "30. 🗄️ 🟡 Las cuatro comprobaciones que sí encuentran cosas — y el grafo, que no (23-ago-2026)"
Cohesion: 0.33
Nodes (6): 30.1 · Por qué el grafo no se gana el puesto, 30.2 · Con qué se lo reemplaza, 30.3 · ✅ Triado — de 17 "rutas sin llamador" quedó UNA, y no era lo que dije, 30.4 · Lo que falta del lado de las herramientas, 30. 🗄️ 🟡 Las cuatro comprobaciones que sí encuentran cosas — y el grafo, que no (23-ago-2026), ⚠️ Corrección — lo que dije de `/api/pagos/consultar/[id]` estaba mal

### Community 62 - "23. 🗄️ ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito"
Cohesion: 0.40
Nodes (5): 23. 🗄️ ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito, Estado real, relevado el 16-ago-2026 (no supuesto), ⚠️ Este CRM NO es DomusCRM — no confundirlos nunca, Lo que se pierde mientras tanto — dicho y aplazado a conciencia, Orden sugerido cuando se retome

### Community 63 - "28. 🗄️ ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026"
Cohesion: 0.40
Nodes (5): 28.1 · CondoManager → EcoInmobiliaria (lo más cerca de valer dinero), 28.2 · agente24siete — el alta que antes no existía, 28.3 · Lo que arrastra de días anteriores, 28. 🗄️ ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026, Lo que NO está en esta lista, a propósito

### Community 64 - "31. 🗄️ 🔵 El "quién soy" está escrito dos veces, y las copias ya divergieron — 23-ago-2026"
Cohesion: 0.40
Nodes (5): 31. 🗄️ 🔵 El "quién soy" está escrito dos veces, y las copias ya divergieron — 23-ago-2026, ⚠️ Antes de unificarlo, mirarlo de cerca, Lo que se repite, medido, Qué es compartible y qué NO, Ya divergieron, que es el argumento de peso

### Community 65 - "32. 🗄️ ⬜ DECISIÓN DE ARQUITECTURA — ¿la app de IoT escribe sola en R2, o el respaldo es manual? (29-ago-2026)"
Cohesion: 0.40
Nodes (5): 32. 🗄️ ⬜ DECISIÓN DE ARQUITECTURA — ¿la app de IoT escribe sola en R2, o el respaldo es manual? (29-ago-2026), Las tres opciones, con lo que cuesta cada una, Lo que hay que decidir antes de escribir una línea, Lo que HOY existe, y sus límites, Lo que NO hay que discutir

### Community 66 - "peerDependencies"
Cohesion: 0.40
Nodes (5): peerDependencies, framer-motion, lucide-react, react, react-dom

### Community 68 - "useBrand"
Cohesion: 0.50
Nodes (3): TokenAudit(), TOKENS, useBrand()

### Community 70 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 71 - "2. Los dos planos"
Cohesion: 0.50
Nodes (4): 2. Los dos planos, Plano de proceso — NO EXISTE ❌, Plano de proceso — YA EXISTE, parcialmente ✅ (corrección 2026-07-30), Plano web — Vercel ✅ correcto

### Community 72 - "6-bis. Plano de DNS y correo ✅ verificado 2026-07-26"
Cohesion: 0.50
Nodes (4): 6-bis. Plano de DNS y correo ✅ verificado 2026-07-26, Hostinger, Limitaciones y minas, Quién manda qué correo — reescrito 09-ago-2026, con los dos consumidores reales verificados

### Community 73 - "9. Pendientes, en orden"
Cohesion: 0.50
Nodes (4): 9. Pendientes, en orden, Abiertos, en orden, Cerrados el 2026-07-30, Reglas que ya no dependen de la memoria

### Community 74 - "mensajeDeError"
Cohesion: 0.83
Nodes (3): 🔵-5 — ✅ RESUELTO 10-ago-2026 — extracción de mensaje de error de fetch duplicada en ~31 archivos, mensajeDeError(), mensajeDeErrorData()

### Community 75 - "26. 🗄️ 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)"
Cohesion: 0.50
Nodes (4): 26. 🗄️ 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026), El estado real, producto por producto, La lección de método, que es la que se repitió todo el día, Lo que bloquea cada uno, en orden de cercanía a una venta

### Community 76 - "Cómo conectarse a Cloudflare/R2 desde una sesión de Claude Code — ✅ SÍ SE PUEDE, verificado 15-ago-2026"
Cohesion: 0.67
Nodes (3): Cómo conectarse a Cloudflare/R2 desde una sesión de Claude Code — ✅ SÍ SE PUEDE, verificado 15-ago-2026, Lo que wrangler NO puede hacer: crear el token que necesita un contenedor, Regla dura: un token por producto — no se comparten

### Community 77 - "exports"
Cohesion: 0.67
Nodes (3): exports, ./preset, ./tokens.css

## Knowledge Gaps
- **650 isolated node(s):** `name`, `version`, `description`, `license`, `private` (+645 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 704 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Pendientes del ecosistema SORSABSA` connect `Pendientes del ecosistema SORSABSA` to `DomusLanding.tsx`, `31. 🗄️ 🔵 El "quién soy" está escrito dos veces, y las copias ya divergieron — 23-ago-2026`, `32. 🗄️ ⬜ DECISIÓN DE ARQUITECTURA — ¿la app de IoT escribe sola en R2, o el respaldo es manual? (29-ago-2026)`, `29. 🗄️ 🟡 Lo que queda del barrido de UI del 23-ago-2026 — 18 modales, 8 desvíos y un sistema de avisos sin disparador`, `main`, `24. 🗄️ 🟡 El cobro del ecosistema quedó vivo — lo que falta después (21/22-ago-2026)`, `26. 🗄️ 🔴 ¿Puede un usuario comprar y recibir lo que compró? (22-ago-2026)`, `21-bis. 🗄️ 🟠 Lo que bloquea el cobro del Convertidor — analizado y resuelto a medias, 16-ago-2026`, `CIERRE-ECOSISTEMA.md`, `NotificationBell.tsx`, `27. ✅ agente24siete ya se puede dar de alta — y el agujero que apareció al hacerlo (22-ago-2026)`, `30. 🗄️ 🟡 Las cuatro comprobaciones que sí encuentran cosas — y el grafo, que no (23-ago-2026)`, `23. 🗄️ ⬜ Consola del negocio y CRM de ventas de SORSABSA — anotado 16-ago-2026, aplazado a propósito`, `28. 🗄️ ⬜ PENDIENTE DE GINA — las pruebas en vivo que quedaron del 22-ago-2026`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Why does `main()` connect `main` to `Arquitectura del ecosistema SORSABSA`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Why does `Arquitectura del ecosistema SORSABSA` connect `Arquitectura del ecosistema SORSABSA` to `main`, `4-bis. Georreferenciación y R2 — estado real (verificado 2026-08-08)`, `2. Los dos planos`, `6-bis. Plano de DNS y correo ✅ verificado 2026-07-26`, `Toast`, `9. Pendientes, en orden`, `4-ter. El cobro y el portero — ✅ verificado en vivo 22-ago-2026`, `7. Decisión de arquitectura (2026-07-26)`, `3. Mapa de bases de datos — LA TRAMPA`, `CIERRE-ECOSISTEMA.md`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _650 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DomusLanding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05734767025089606 - nodes in this community are weakly interconnected._
- **Should `conformidad.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05656108597285068 - nodes in this community are weakly interconnected._
- **Should `main` be split into smaller, more focused modules?**
  _Cohesion score 0.05454545454545454 - nodes in this community are weakly interconnected._