import { useEffect } from 'react';
import type { BrandConfig } from '../lib';

/**
 * Carga fontImport (si existe) inyectando un <link> real en <head> — NO un
 * @import de CSS (ver README raíz: el bundler reordena @import y el
 * navegador lo ignora en silencio; esa regla aplica a CSS procesado por el
 * build, no a un <link> de DOM real inyectado en runtime como este, que es
 * exactamente lo que necesita un preview que cambia de marca en vivo).
 * Se limpia al cambiar de marca para no acumular <link> de pestañas viejas.
 */
export function TypographyDemo({ brand }: { brand: BrandConfig }) {
  useEffect(() => {
    if (!brand.fontImport) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = brand.fontImport;
    link.dataset.showcaseFont = brand.name;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [brand.fontImport, brand.name]);

  const headingFont = brand.headingFont || brand.fontFamily || 'inherit';
  const bodyFont = brand.fontFamily || 'system-ui, sans-serif';

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-[11px] text-zinc-500">Titulares</div>
        <p className="text-2xl font-semibold leading-tight" style={{ fontFamily: `'${headingFont}', system-ui, sans-serif` }}>
          {brand.displayName} — abcdefghij ABCDEFGHIJ 0123456789
        </p>
      </div>
      <div>
        <div className="mb-1 text-[11px] text-zinc-500">Cuerpo</div>
        <p className="text-base leading-relaxed" style={{ fontFamily: bodyFont }}>
          Cuerpo de texto real — {brand.displayName} — abcdefghij ABCDEFGHIJ 0123456789
        </p>
      </div>
    </div>
  );
}
