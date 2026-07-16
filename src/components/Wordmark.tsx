'use client';

/**
 * Wordmark — el logotipo de texto de la marca activa, con SU tipografía y
 * SUS tonos. Ej. CondoManager = "Condo" (oro) + "Manager" (verde) en
 * Fraunces; agente24siete = "agente"+"24"+"siete" donde SOLO "24" lleva
 * color (ocre), como su landing original. Toma la identidad del
 * BrandProvider; no impone nada.
 *
 * Si la marca no define `wordmark`, cae a `displayName` en un solo tono.
 */

import { useBrand } from '../brand/BrandProvider';
import type { WordmarkTone } from '../brand/BrandProvider';

const TONE_CLASS: Record<WordmarkTone, string> = {
  text: 'text-brand-text',
  primary: 'text-brand-primary',
  accent: 'text-brand-accent',
};

// Sin `tones` explícito se conserva el comportamiento histórico:
// primera parte en accent, segunda (y tercera) en primary.
const TONOS_POR_DEFECTO: WordmarkTone[] = ['accent', 'primary', 'primary'];

export function Wordmark({ className = '' }: { className?: string }) {
  const brand = useBrand();
  const wm = brand.wordmark;

  return (
    <span
      className={`font-brand-heading font-extrabold tracking-tight ${className}`}
      style={{ fontFamily: 'var(--brand-heading-font)' }}
    >
      {wm ? (
        [wm.first, wm.second, wm.third]
          .filter((parte): parte is string => parte !== undefined)
          .map((parte, i) => (
            <span key={i} className={TONE_CLASS[(wm.tones ?? TONOS_POR_DEFECTO)[i] ?? 'primary']}>
              {parte}
            </span>
          ))
      ) : (
        <span className="text-brand-primary">{brand.displayName}</span>
      )}
    </span>
  );
}
