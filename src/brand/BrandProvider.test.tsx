import { brandToCssVars, type BrandConfig } from './BrandProvider';
import { BRANDS } from './brands';

const base: BrandConfig = {
  name: 'prueba',
  displayName: 'Prueba',
  colors: { primary: '#1746A2' },
};

describe('brandToCssVars — escala de sombras', () => {
  it('con shadowPreset declarado los tres niveles siguen siendo distintos', () => {
    // Regresión: antes cada token se resolvía con `map[preset ?? '<otro>']`,
    // y como el `??` solo actúa sobre undefined, declarar un preset colapsaba
    // sm/md/lg al mismo valor y borraba la escala de elevación.
    for (const preset of ['flat', 'soft', 'dramatic'] as const) {
      const v = brandToCssVars({ ...base, shadowPreset: preset }) as Record<string, string>;
      const niveles = [v['--brand-shadow-sm'], v['--brand-shadow-md'], v['--brand-shadow-lg']];
      expect(new Set(niveles).size).toBe(3);
    }
  });

  it('DomusCRM (shadowPreset: flat) tiene elevación creciente, no tres hairlines', () => {
    const v = brandToCssVars(BRANDS.domuscrm!) as Record<string, string>;
    expect(v['--brand-shadow-sm']).not.toBe(v['--brand-shadow-md']);
    expect(v['--brand-shadow-md']).not.toBe(v['--brand-shadow-lg']);
  });

  it('sin shadowPreset conserva los valores históricos (no rompe marcas existentes)', () => {
    const v = brandToCssVars(base) as Record<string, string>;
    expect(v['--brand-shadow-sm']).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
    expect(v['--brand-shadow-md']).toBe(
      '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
    );
    expect(v['--brand-shadow-lg']).toBe(
      '0 12px 40px -8px rgb(0 0 0 / 0.18), 0 4px 16px -4px rgb(0 0 0 / 0.12)',
    );
  });
});

describe('brandToCssVars — tokens de contraste calculados', () => {
  /** Contraste entre dos tripletas "r g b" tal como se inyectan en CSS. */
  function ratioEntre(a: string, b: string): number {
    const lum = (t: string) =>
      t
        .split(' ')
        .map(Number)
        .map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        })
        .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i]! * c, 0);
    const [la, lb] = [lum(a), lum(b)];
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  it('--brand-primary-text cumple AA sobre el fondo en TODAS las marcas', () => {
    for (const [nombre, marca] of Object.entries(BRANDS)) {
      const v = brandToCssVars(marca) as Record<string, string>;
      const ratio = ratioEntre(v['--brand-primary-text']!, v['--brand-background']!);
      // El nombre va en el mensaje para que un fallo diga QUÉ marca rompió.
      expect(`${nombre}: ${ratio.toFixed(2)}`).toBe(
        `${nombre}: ${Math.max(ratio, 4.5).toFixed(2)}`,
      );
    }
  });

  it('--brand-accent-foreground cumple AA sobre el acento en TODAS las marcas', () => {
    for (const marca of Object.values(BRANDS)) {
      const v = brandToCssVars(marca) as Record<string, string>;
      expect(ratioEntre(v['--brand-accent-foreground']!, v['--brand-accent']!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('no oscurece un primary que ya cumple (CondoManager se queda igual)', () => {
    const v = brandToCssVars(BRANDS.condomanager!) as Record<string, string>;
    expect(v['--brand-primary-text']).toBe(v['--brand-primary']);
  });
});

describe('brands — contraste del acento de DomusCRM', () => {
  /** Luminancia relativa WCAG de un hex. */
  function luminancia(hex: string): number {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      })
      .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i]! * c, 0);
  }

  it('el acento cumple AA (4.5:1) sobre blanco — el wordmark lo usa como texto', () => {
    const l = luminancia(BRANDS.domuscrm!.colors.accent!);
    const ratio = 1.05 / (l + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
