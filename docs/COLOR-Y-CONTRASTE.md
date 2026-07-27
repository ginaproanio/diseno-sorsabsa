# Color de marca y contraste

## La regla

**La identidad no se paga con accesibilidad.**

Si un color de marca no llega a 4.5:1 como texto, **no se cambia el color**: se
usa la variante calculada que existe para ese uso. El color de marca real se
conserva intacto en rellenos, bordes e iconos.

Esto se aprendió rompiéndolo. El 2026-07-26 se oscurecieron dos colores
oficiales para arreglar contraste —el ocre de Agente24Siete (`#c1701b`) y el
turquesa de DomusCRM (`#1db4a5`)— y hubo que revertir ambos el mismo día. Los
dos son identidad aprobada y documentada; el ocre tiene incluso una regla
explícita en el README de su producto prohibiendo tocarlo.

Hay un test que fija ambos valores (`BrandProvider.test.tsx`): si alguien los
vuelve a "arreglar", la prueba falla.

## Los cuatro tokens

`brandToCssVars` los calcula solos a partir de los colores de la marca. **Si un
color ya cumple, su token es idéntico al original** — CondoManager, por
ejemplo, no cambia en nada.

| Token | Cuándo usarlo | Cómo se calcula |
|---|---|---|
| `--brand-primary-text` | El primary pintado como TEXTO sobre el fondo | Se oscurece lo mínimo hasta 4.5:1 |
| `--brand-accent-text` | El acento pintado como TEXTO | Igual |
| `--brand-primary-foreground` | Texto SOBRE un relleno primary | Configurable por marca; blanco por defecto |
| `--brand-accent-foreground` | Texto SOBRE un relleno de acento | Blanco o casi-negro, el que más contraste dé |

En Tailwind: `text-brand-primary-text`, `text-brand-accent-text`,
`text-brand-accent-foreground`.

## Cuál usar

```
¿El color va como TEXTO sobre el fondo de la página?
   → text-brand-primary-text  /  text-brand-accent-text

¿El color va de RELLENO y encima hay texto?
   → bg-brand-accent + text-brand-accent-foreground
   → bg-brand-primary + text-brand-primary-foreground

¿El color va de relleno, borde o icono decorativo, sin texto encima?
   → bg-brand-accent, border-brand-primary…  el color crudo, sin tocar
```

**Nunca escribir `text-white` sobre un relleno de marca.** Funciona con los
colores oscuros y falla con los claros: blanco sobre el turquesa `#1db4a5` da
2.58:1. El token `*-foreground` decide por ti.

## Componentes que ya lo aplican

- `Button` — variantes `secondary` (texto sobre tinte) y `accent` (texto sobre
  relleno).
- `Tag` — tonos `primary` y `accent`.
- `Wordmark` — el logotipo es texto, y ahí el turquesa daba 2.43:1 en el "CRM"
  y el ocre 3.46:1 en el "24".

## Cómo comprobarlo

No basta con mirar. Auditoría real sobre la página servida, recorriendo cada
elemento con texto y su fondo efectivo:

```
scratchpad/contrast.py   (Playwright + fórmula WCAG 2.1)
```

Escanea `body *`, no `main`: hay páginas del ecosistema sin `<main>`, y
limitando el selector se auditó solo el footer sin notarlo.
