'use client';

/**
 * PropertyCarousel — envoltorio de fila horizontal para <PropertyListingCard>,
 * inspirado en el carousel-cards de Kokonut UI (21st.dev) pero adaptado para
 * ser agnóstico de framework: el original depende de next/image, y esta
 * librería la consume tanto CondoManager (Next.js) como showcase/ (Vite
 * puro).
 *
 * El scroll horizontal es CSS puro (scroll-snap-type + overflow-x-auto), no
 * un carrusel con estado de índice reimplementado en JS — el navegador ya
 * resuelve touch/trackpad/rueda correctamente. Las flechas solo empujan
 * scrollLeft el ancho de una tarjeta (leído del DOM, no hardcodeado).
 */

import { Children, useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PropertyCarouselProps {
  /** Título de la sección, ej. "Propiedades destacadas". */
  title: string;
  /** Si se define, muestra el link "Ver todas" junto a las flechas. */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Tarjetas <PropertyListingCard> a mostrar en la fila. */
  children: ReactNode;
  className?: string;
}

const ARROW_BUTTON_CLASSES =
  'flex h-8 w-8 items-center justify-center rounded-brand border border-brand-border text-brand-text ' +
  'transition-colors hover:bg-brand-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50';

export function PropertyCarousel({
  title,
  viewAllHref,
  viewAllLabel = 'Ver todas',
  children,
  className = '',
}: PropertyCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    const card = scroller?.firstElementChild as HTMLElement | null;
    if (!scroller || !card) return;
    const gap = parseFloat(getComputedStyle(scroller).columnGap || '0');
    scroller.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
  }

  const items = Children.toArray(children);

  return (
    <div className={`font-brand ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <a href={viewAllHref} className="text-sm font-medium text-brand-primary hover:underline">
              {viewAllLabel}
            </a>
          )}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Anterior"
              className={ARROW_BUTTON_CLASSES}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Siguiente"
              className={ARROW_BUTTON_CLASSES}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, index) => (
          <div key={index} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
