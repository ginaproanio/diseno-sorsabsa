# @sorsabsa/ui — Sistema de diseño whitelabel de SORSABSA

Ingeniería visual extraída de CondoManager, desacoplada como librería para que **todos** los productos del ecosistema (CondoManager, DomusCRM, Agente24Siete, y los que vengan) consuman los mismos componentes y cada uno se vea de su propia marca. Un fix o mejora aquí llega a todos los productos a la vez.

## Instalación en un producto

```bash
# opción local (monodisco): desde la carpeta del producto
npm install file:../../diseno-sorsabsa
# opción repo git (recomendada al subirlo a GitHub):
npm install git+https://github.com/ginaproanio/diseno-sorsabsa.git
```

`tailwind.config.js` del producto:

```js
const sorsabsa = require('@sorsabsa/ui/preset');

module.exports = {
  presets: [sorsabsa],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@sorsabsa/ui/src/**/*.{ts,tsx}', // ← clases de la librería
  ],
};
```

En el CSS global del producto: `@import '@sorsabsa/ui/tokens.css';`

## ⚠️ Checklist del consumidor — Tailwind v3 vs v4 (incidente real, 16 jul 2026)

Si el producto no escanea el CÓDIGO FUENTE de este paquete, las clases que
viven dentro de los componentes (elevación de `Card interactive`, lift de
`Button`…) aparecen en el HTML pero su CSS **nunca se genera** — todo se ve
plano sin ningún error. Le pasó a agente24siete en producción.

- **Tailwind v3** (webs de DomusCRM, auth-sorsabsa): el `content` del
  `tailwind.config` DEBE incluir
  `'./node_modules/@sorsabsa/ui/src/**/*.{ts,tsx}'` (ejemplo arriba).
- **Tailwind v4** (agente24siete): v4 **ignora node_modules por defecto**.
  Obligatorio en el CSS global, además del `@config` del preset:

  ```css
  @source "../node_modules/@sorsabsa/ui/src";
  ```

- **Fuentes de marca** (Fraunces, JetBrains Mono): via `<link>` estático en
  el layout — NUNCA `@import` en el CSS global (el bundler lo reordena y el
  navegador lo ignora en silencio; incidente Fraunces).

**Estado de los consumidores (16 jul 2026):** webs ✓ v3 bien configurado ·
auth-sorsabsa ✓ v3 bien configurado · agente24siete ✓ v4 con `@source` ·
CondoManager **aún no consume este paquete** (el sistema se extrajo de él,
pero nunca se volvió consumidor — migración pendiente de aprobación).

**¿Unificar versión de Tailwind?** Sí, a v4 a mediano plazo (v3 quedó en
mantenimiento), como migración planificada producto por producto — no de
golpe. Mientras convivan, este checklist es el contrato.

## Vestir la app con su marca

```tsx
import { BrandProvider, BRANDS, Button, Input, Icon, Card } from '@sorsabsa/ui';

// CondoManager se ve verde; cambia BRANDS.condomanager por BRANDS.domuscrm
// y TODO se vuelve azul — mismos componentes, cero recompilación.
export default function App({ children }) {
  return <BrandProvider brand={BRANDS.condomanager}>{children}</BrandProvider>;
}

// Uso normal:
<Button loading={saving}>Guardar</Button>
<Button variant="secondary" href="/panel">Ir al panel</Button>
<Input label="Correo" icon="mail" error={errores.email} />
<Icon name="trash" size={16} />
<Card variant="glass" interactive>…</Card>

// Componentes del 16 jul 2026:
<StatusBadge tone="success" size="lg">Activa</StatusBadge>  // semáforo SVG — JAMÁS emojis
<StatusBadge tone="warning" icon="clock">Período de prueba</StatusBadge>
<TypingDots />                                              // "está escribiendo…" del chat
<Wordmark />                                                // logo por partes con tonos por marca
```

`icon` en `Input` recibe un `IconName` (string del catálogo propio, ej.
`"mail"`), **no** un componente de lucide-react — la librería ya no
depende de lucide (16 jul 2026). Ver `src/icons/icon-paths.ts` para el
catálogo completo.

## Cómo funciona (la arquitectura de tokens)

1. **`tailwind-preset.cjs`** define colores semánticos (`bg-brand-primary`, `text-brand-text`, `rounded-brand`) que apuntan a **variables CSS**, no a valores fijos. Donde CondoManager decía "verde-600", ahora dice "el primario de la marca actual".
2. **`BrandProvider`** convierte la config de marca (hex) a tripletas RGB y las inyecta como variables en su subárbol (`--brand-primary: 22 163 74`). Las tripletas permiten opacidades Tailwind (`bg-brand-primary/10`).
3. **`BRANDS`** es la única fuente de verdad de identidades del ecosistema — el SSO (`auth-sorsabsa`) la reutiliza para el `?app=`.

## Showcase — auditoría visual en vivo de cada marca

`showcase/` es una app aparte (Vite + React, package.json propio) que
renderiza los componentes REALES (Button, Card, Input, Icon, StatusBadge,
Wordmark, TypingDots) de cada marca de `BRANDS` — paleta, contraste WCAG
calculado (no puesto a mano), tipografía, estados de Button, etc. Importa
`@sorsabsa/ui` desde `../src` (el código fuente, nunca desde npm): cambiar
un token en `brands.ts` se refleja ahí sin tocar la app del showcase ni
bumpear versión. Lo que NO existe todavía en la librería (ej. una escala
de espaciado) se marca "No implementado" en vez de disimularse.

```bash
cd showcase
npm install   # una sola vez
npm run dev
```

Deploy en Vercel como proyecto propio (Root Directory `showcase/`, o
`vercel --cwd showcase`) — no requiere bump de versión del paquete porque
no toca `src/` ni `package.json` de la librería.

## Pruebas

```bash
npm test
```

La suite verifica que el token de color primario inyectado llega **exacto** al DOM (sin colores quemados en los componentes), los estados del botón (loading/disabled/link) y el fallback de marca del SSO.

## Reglas de la librería

- **Prohibido** un color fijo (`bg-green-600`) dentro de un componente: solo tokens `brand-*`.
- Componentes sin lógica de negocio ni dependencias de framework (nada de next/link, supabase, etc.): son ladrillos.
- Antes de agregar un componente nuevo: la regla de tres — extrae solo lo que ya se repitió en ≥2 productos.
- **Bumpear `version` en `package.json` en TODO commit que un producto vaya a consumir.** No es cosmético — ver la sección de abajo, es lo que evita que un cambio real "no se refleje" en producción.

## ⚠️ Bumpear la versión en cada cambio real (16 jul 2026, incidente real)

Este paquete no vive en el registry de npm — cada producto lo instala
por **hash de commit** (`github:ginaproanio/diseno-sorsabsa#<hash>`).
`package.json` traía `"version": "0.1.0"` fijo desde que se creó el
repo, sin bumpear nunca pese a decenas de commits reales.

Consecuencia real: se cambió el `border-radius` de DomusCRM, se hizo
commit, se actualizó el pin en `webs/package.json`, se corrió
`npm install` y se hizo deploy — y el cambio **no se reflejó en
producción**. El pin apuntaba al commit correcto (confirmado), el
contenido en GitHub era correcto (confirmado), pero el build de Vercel
seguía sirviendo el valor viejo. Causa más probable: cachés que usan
`nombre@version` como llave (el build cache de Vercel entre otras)
tratan dos commits distintos como "el mismo paquete" cuando la versión
nunca cambia — así que un `node_modules` de un build anterior puede
sobrevivir sin refrescarse aunque el hash del pin sea otro.

**Fix aplicado:** bump de `0.1.0` a `0.1.6`. Confirmado con un reinstall
local limpio (`rm -rf node_modules/@sorsabsa/ui && npm install`) y un
build limpio (`rm -rf .next && npm run build`) que el HTML generado ya
trae el valor nuevo, y luego confirmado en producción tras el deploy.

**Regla desde ahora:** cualquier commit que un producto vaya a consumir
(no simples typos/comentarios) debe venir con un bump de versión —
`0.1.6` → `0.1.7`, etc. Es la señal más simple para que las cachés de
dependencias git (que no tienen un registry real detrás) sepan que hay
contenido nuevo.

## Publicar una versión (flujo desde 16 jul 2026 — sin copiar hashes)

Los productos ya no pinnean por hash de commit sino por etiqueta semver:

```json
"@sorsabsa/ui": "github:ginaproanio/diseno-sorsabsa#semver:^0.1.6"
```

npm resuelve contra las **etiquetas git** del repo y el lockfile del
producto guarda el commit exacto (build reproducible). Publicar un
cambio queda en dos pasos:

```bash
# 1 · Aquí (diseno-sorsabsa): bump + tag + push
#    (editar "version" en package.json, ej. 0.1.6 -> 0.1.7)
git commit -am "..." && git tag v0.1.7 && git push origin main --tags

# 2 · En cada producto que deba recibirlo:
npm update @sorsabsa/ui   # y commitear package-lock.json
```

Sin registry de npm de por medio (gratis, sin cuenta extra) y sin
copiar hashes de 40 caracteres a mano. **La etiqueta `vX.Y.Z` debe
coincidir con la `version` del package.json de ese commit.**

> Atajo: `npm version patch` hace las tres cosas (bump + commit + tag)
> en un solo comando; después solo `git push --follow-tags`.

## La regla ya NO depende de la memoria: hook pre-push

Desde el 16 jul 2026 existe [.githooks/pre-push](.githooks/pre-push):
si cambiaste `src/` o `package.json` desde el último tag y la versión
sigue igual (o falta el tag `vX.Y.Z`), **el push se bloquea** con el
mensaje de qué comando correr. Un push de solo documentación pasa sin
exigir nada.

Activación — una sola vez por clon (ya está activo en el clon de la
máquina principal):

```bash
git config core.hooksPath .githooks
```
