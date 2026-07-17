/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../tailwind-preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Los componentes REALES viven en ../src (código fuente, no
    // node_modules): sin escanear aquí, sus clases (elevación de
    // `Card interactive`, lift de `Button`…) aparecen en el HTML pero su
    // CSS nunca se genera — mismo incidente documentado en el README raíz
    // ("Checklist del consumidor — Tailwind v3 vs v4"), adaptado a que acá
    // el origen es una ruta relativa fuera de node_modules.
    '../src/**/*.{ts,tsx}',
  ],
};
