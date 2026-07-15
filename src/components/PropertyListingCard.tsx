'use client';

/**
 * PropertyListingCard — tarjeta de propiedad para catálogos públicos
 * (DomusCRM y cualquier otro producto que liste inmuebles). Inspirada en el
 * nivel de pulido de tarjetas tipo Airbnb (imagen grande, badges, hover con
 * elevación) pero con semántica inmobiliaria: sin rating de estrellas (no
 * aplica a bienes raíces), con badge de operación (Venta/Arriendo) y de
 * "Destacada" en su lugar, y una fila de datos (hab./baños/m²) con los
 * iconos del catálogo central en vez de texto plano separado por "·".
 *
 * Sin acoplamiento a next/image ni next/link — un <a> plano (mismo patrón
 * que Button/MobileNav), funciona en cualquier app React.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../icons/Icon';
import { Card } from './Card';

export interface PropertyListingCardProps {
  href: string;
  /** URL de la foto de portada. Sin foto: se muestra un placeholder sobrio. */
  coverPhoto?: string | null;
  title: string;
  /** Precio ya formateado por el consumidor (locale/moneda propios del producto). */
  price: string;
  /** Sufijo del precio, ej. "/mes" para arriendo. */
  pricePeriodSuffix?: string;
  /** Etiqueta de operación, ej. "Venta" | "Arriendo". */
  operationLabel?: string;
  featured?: boolean;
  location?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  className?: string;
}

function Placeholder() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-muted/10 text-brand-muted">
      <Icon name="home" size={32} />
    </div>
  );
}

function Stat({ icon, children }: { icon: 'bed' | 'bath' | 'ruler'; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon name={icon} size={16} className="text-brand-muted" />
      {children}
    </span>
  );
}

export function PropertyListingCard({
  href,
  coverPhoto,
  title,
  price,
  pricePeriodSuffix,
  operationLabel,
  featured = false,
  location,
  bedrooms,
  bathrooms,
  areaM2,
  className = '',
}: PropertyListingCardProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`block ${className}`}
    >
      <Card interactive className="overflow-hidden p-0">
        <div className="relative">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto} alt={title} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <Placeholder />
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {featured && (
              <span className="rounded-brand bg-brand-primary px-2 py-1 text-xs font-semibold text-brand-primary-foreground">
                Destacada
              </span>
            )}
            {operationLabel && (
              <span className="rounded-brand bg-white/90 px-2 py-1 text-xs font-semibold text-brand-text backdrop-blur-sm">
                {operationLabel}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5 p-4">
          <p className="text-lg font-bold text-brand-primary">
            {price}
            {pricePeriodSuffix && (
              <span className="text-sm font-normal text-brand-muted"> {pricePeriodSuffix}</span>
            )}
          </p>
          <h3 className="truncate text-sm font-semibold text-brand-text">{title}</h3>
          {location && <p className="truncate text-xs text-brand-muted">{location}</p>}
          {(bedrooms != null || bathrooms != null || areaM2 != null) && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-brand-text">
              {bedrooms != null && <Stat icon="bed">{bedrooms}</Stat>}
              {bathrooms != null && <Stat icon="bath">{bathrooms}</Stat>}
              {areaM2 != null && <Stat icon="ruler">{areaM2} m²</Stat>}
            </div>
          )}
        </div>
      </Card>
    </motion.a>
  );
}
