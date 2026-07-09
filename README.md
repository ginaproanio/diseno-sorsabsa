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
import { BrandProvider, BRANDS, Button, Input, Card } from '@sorsabsa/ui';
import { Mail } from 'lucide-react';

// CondoManager se ve verde; cambia BRANDS.condomanager por BRANDS.domuscrm
// y TODO se vuelve azul — mismos componentes, cero recompilación.
export default function App({ children }) {
  return <BrandProvider brand={BRANDS.condomanager}>{children}</BrandProvider>;
}

// Uso normal:
<Button loading={saving}>Guardar</Button>
<Button variant="secondary" href="/panel">Ir al panel</Button>
<Input label="Correo" icon={Mail} error={errores.email} />
<Card variant="glass" interactive>…</Card>
```

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
