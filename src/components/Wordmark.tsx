'use client';

/**
 * Wordmark — el logotipo de texto de la marca activa, con SU tipografía y
 * SUS dos tonos. Ej. CondoManager = "Condo" (oro) + "Manager" (verde) en
 * Fraunces. Toma la identidad del BrandProvider; no impone nada.
 *
 * Si la marca no define `wordmark`, cae a `displayName` en un solo tono.
 */

import { useBrand } from '../brand/BrandProvider';

export function Wordmark({ className = '' }: { className?: string }) {
  const brand = useBrand();
  const wm = brand.wordmark;

  return (
    <span
      className={`font-brand-heading font-extrabold tracking-tight ${className}`}
      style={{ fontFamily: 'var(--brand-heading-font)' }}
    >
      {wm ? (
        <>
          <span className="text-brand-accent">{wm.first}</span>
          <span className="text-brand-primary">{wm.second}</span>
        </>
      ) : (
        <span className="text-brand-primary">{brand.displayName}</span>
      )}
    </span>
  );
}
