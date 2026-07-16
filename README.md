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
```

`icon` en `Input` recibe un `IconName` (string del catálogo propio, ej.
`"mail"`), **no** un componente de lucide-react — la librería ya no
depende de lucide (16 jul 2026). Ver `src/icons/icon-paths.ts` para el
catálogo completo.

## Cómo funciona (la arquitectura de tokens)

1. **`tailwind-preset.cjs`** define colores semánticos (`bg-brand-primary`, `text-brand-text`, `rounded-brand`) que apuntan a **variables CSS**, no a valores fijos. Donde CondoManager decía "verde-600", ahora dice "el primario de la marca actual".
2. **`BrandProvider`** convierte la config de marca (hex) a tripletas RGB y las inyecta como variables en su subárbol (`--brand-primary: 22 163 74`). Las tripletas permiten opacidades Tailwind (`bg-brand-primary/10`).
3. **`BRANDS`** es la única fuente de verdad de identidades del ecosistema — el SSO (`auth-sorsabsa`) la reutiliza para el `?app=`.

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
