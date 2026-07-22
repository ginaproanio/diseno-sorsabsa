/**
 * Preset de Tailwind de @sorsabsa/ui — LA ARQUITECTURA DE TOKENS
 *
 * En CondoManager los colores estaban fijos ("bg-green-600", o tokens
 * semánticos apuntando a verde). Aquí cada token apunta a una VARIABLE CSS
 * que inyecta el BrandProvider en runtime: el mismo componente se pinta de
 * verde en CondoManager, azul en DomusCRM o naranja en Agente24Siete sin
 * recompilar nada.
 *
 * Uso en cada producto (tailwind.config.js):
 *   const sorsabsa = require('@sorsabsa/ui/preset');
 *   module.exports = {
 *     presets: [sorsabsa],
 *     content: [
 *       './src/**\/*.{ts,tsx}',
 *       './node_modules/@sorsabsa/ui/src/**\/*.{ts,tsx}', // clases de la librería
 *     ],
 *   };
 *
 * Los valores son tripletas RGB ("18 118 189") para que los modificadores
 * de opacidad de Tailwind funcionen: bg-brand-primary/10, ring-brand-primary/40…
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': 'rgb(var(--brand-primary) / <alpha-value>)',
        'brand-primary-foreground': 'rgb(var(--brand-primary-foreground) / <alpha-value>)',
        'brand-secondary': 'rgb(var(--brand-secondary) / <alpha-value>)',
        'brand-accent': 'rgb(var(--brand-accent) / <alpha-value>)',
        'brand-surface': 'rgb(var(--brand-surface) / <alpha-value>)',
        'brand-background': 'rgb(var(--brand-background) / <alpha-value>)',
        'brand-text': 'rgb(var(--brand-text) / <alpha-value>)',
        'brand-muted': 'rgb(var(--brand-muted) / <alpha-value>)',
        'brand-border': 'rgb(var(--brand-border) / <alpha-value>)',
        'brand-destructive': 'rgb(var(--brand-destructive) / <alpha-value>)',
        'brand-success': 'rgb(var(--brand-success) / <alpha-value>)',
        'brand-warning': 'rgb(var(--brand-warning) / <alpha-value>)',
      },
      spacing: {
        'brand-1': 'var(--brand-space-1, 0.25rem)',
        'brand-2': 'var(--brand-space-2, 0.5rem)',
        'brand-3': 'var(--brand-space-3, 0.75rem)',
        'brand-4': 'var(--brand-space-4, 1rem)',
        'brand-5': 'var(--brand-space-5, 1.25rem)',
        'brand-6': 'var(--brand-space-6, 1.5rem)',
        'brand-8': 'var(--brand-space-8, 2rem)',
        'brand-10': 'var(--brand-space-10, 2.5rem)',
        'brand-12': 'var(--brand-space-12, 3rem)',
        'brand-16': 'var(--brand-space-16, 4rem)',
      },
      boxShadow: {
        'brand-sm': 'var(--brand-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))',
        'brand-md': 'var(--brand-shadow-md, 0 4px 12px -2px rgb(0 0 0 / 0.08))',
        'brand-lg': 'var(--brand-shadow-lg, 0 12px 40px -8px rgb(0 0 0 / 0.18))',
      },
      borderRadius: {
        brand: 'var(--brand-radius, 0.5rem)',
      },
      fontFamily: {
        brand: 'var(--brand-font, system-ui, sans-serif)',
        'brand-heading': 'var(--brand-heading-font, var(--brand-font, system-ui, sans-serif))',
      },
    },
  },
};
