import type { BrandConfig } from '../lib';
import { resolveEffectiveColors } from '../resolveColors';

const TOKEN_ORDER = ['primary', 'accent', 'secondary', 'background', 'surface', 'text', 'muted', 'border'] as const;

export function ColorPalette({ brand }: { brand: BrandConfig }) {
  const resolved = resolveEffectiveColors(brand);

  const textColorFor = (hex: string) => {
    const c = hex.replace('#', '');
    const full = c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c;
    const n = parseInt(full, 16);
    if (full.length !== 6 || Number.isNaN(n)) return '#000000';
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#000000' : '#ffffff';
  };

  return (
    <div className="flex flex-wrap gap-3">
      {TOKEN_ORDER.map((key) => {
        const raw = brand.colors[key];
        const hex = resolved[key];
        const text = textColorFor(hex);
        return (
          <div
            key={key}
            className="swatch-block"
            style={{ background: hex, color: text }}
            title={hex.toUpperCase()}
          >
            <div className="swatch-label">{key}</div>
            <div className="swatch-hex">{hex.toUpperCase()}</div>
          </div>
        );
      })}
    </div>
  );
}
