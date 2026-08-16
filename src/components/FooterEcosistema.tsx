'use client';

/**
 * El pie de página de los productos del ecosistema — uno solo.
 *
 * Gina, 16-ago-2026: *"el footer también tenía un formato y el formato que le
 * pones a la web de convertidor difiere del resto de productos que ya manejan
 * un formato para el footer"*. Tenía razón, y la causa es la de siempre:
 * nunca fue un componente. El formato se definió en agente24siete
 * (`app/page.tsx`, commit `e9ae1bd`) y desde entonces cada producto lo
 * reescribió a su manera — Convertidor puso un icono de Lucide, su propio
 * texto y ni siquiera la línea de copyright.
 *
 * El formato, tal como quedó aprobado en agente24siete:
 *
 *   [Wordmark]                        [contacto]  [facebook]
 *   ─────────────────────────────────────────────────────────
 *   <Producto> | © <año> Sorsabsa. Todos los derechos reservados.
 *
 * con "Sorsabsa" enlazando a sorsabsa.com, sin subrayado, cambiando de color
 * al pasar el mouse. Todo lo que varía por producto entra por props; el
 * formato, no.
 *
 * Sin `next/link` a propósito, igual que `Button`: el paquete lo consumen
 * apps Next (agente24siete, condomanager, convertidor) y apps Vite (JustiRed,
 * showcase). Un `<a>` funciona en las dos.
 */

import { Wordmark } from './Wordmark';
import { Icon } from '../icons/Icon';

export interface FooterEcosistemaProps {
  /** Nombre visible del producto, el que va antes del "|" en el copyright.
   *  Ej: "Agente24Siete", "SORSABSA Convertidor". */
  producto: string;
  /** Correo de contacto del producto. Opcional: no todos publican uno. */
  correo?: string;
  /** Página de Facebook del producto. Opcional por el mismo motivo. */
  facebook?: string;
  /** Enlaces propios del producto (ej. "Planes", "Términos"), a la izquierda
   *  de los de contacto. */
  enlaces?: { texto: string; href: string }[];
  className?: string;
}

export function FooterEcosistema({
  producto,
  correo,
  facebook,
  enlaces,
  className,
}: FooterEcosistemaProps) {
  return (
    <footer
      className={
        className ??
        'mt-auto flex flex-col gap-4 border-t border-brand-border px-4 py-10 text-sm text-brand-muted'
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
        <Wordmark className="text-lg" />
        <div className="flex items-center gap-4">
          {enlaces?.map((e) => (
            <a key={e.href} href={e.href} className="transition-colors hover:text-brand-text">
              {e.texto}
            </a>
          ))}
          {correo && (
            <a href={`mailto:${correo}`} className="transition-colors hover:text-brand-text">
              {correo}
            </a>
          )}
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${producto} en Facebook`}
              className="transition-colors hover:text-brand-text"
            >
              <Icon name="facebook" size={16} />
            </a>
          )}
        </div>
      </div>
      <p className="mx-auto w-full max-w-7xl text-xs">
        {producto} | © {new Date().getFullYear()}{' '}
        <a
          href="https://sorsabsa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline transition-colors hover:text-brand-text"
        >
          Sorsabsa
        </a>
        . Todos los derechos reservados.
      </p>
    </footer>
  );
}
