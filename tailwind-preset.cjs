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
        // Semáforo de estados (StatusBadge): verde/ámbar semánticos, no de marca
        'brand-success': 'rgb(var(--brand-success) / <alpha-value>)',
        'brand-warning': 'rgb(var(--brand-warning) / <alpha-value>)',
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
