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

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 font-mono text-[11px] text-zinc-500">
          fontFamily:{' '}
          {brand.fontFamily ? (
            <span className="text-zinc-300">{brand.fontFamily}</span>
          ) : (
            <span className="text-amber-500">no definido (usa system-ui, -apple-system, 'Segoe UI', sans-serif)</span>
          )}
        </div>
        <p className="font-brand text-lg text-brand-text">
          Cuerpo de texto real — {brand.displayName} — abcdefghij ABCDEFGHIJ 0123456789
        </p>
      </div>
      <div>
        <div className="mb-1 font-mono text-[11px] text-zinc-500">
          headingFont:{' '}
          {brand.headingFont ? (
            <span className="text-zinc-300">{brand.headingFont}</span>
          ) : (
            <span className="text-amber-500">no definido (usa fontFamily / system-ui)</span>
          )}
        </div>
        <p className="font-brand-heading text-3xl font-bold text-brand-text">Titular real — {brand.displayName}</p>
      </div>
      <div className="font-mono text-[11px] text-zinc-500">
        fontImport:{' '}
        {brand.fontImport ? (
          <span className="break-all text-zinc-300">{brand.fontImport}</span>
        ) : (
          <span className="text-amber-500">no definido — sin fuente externa que cargar</span>
        )}
      </div>
    </div>
  );
}
