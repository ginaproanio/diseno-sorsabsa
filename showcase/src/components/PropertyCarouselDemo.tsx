import { useState } from 'react';
import { PropertyCarousel, PropertyListingCard } from '../lib';

interface MockProperty {
  id: string;
  title: string;
  price: string;
  pricePeriodSuffix?: string;
  operationLabel: string;
  featured?: boolean;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number;
  coverPhoto: string;
}

const MOCK_PROPERTIES: MockProperty[] = [
  {
    id: '1',
    title: 'Departamento con vista al valle',
    price: '$185,000',
    operationLabel: 'Venta',
    featured: true,
    location: 'Cumbayá, Quito',
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 145,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-1/600/450',
  },
  {
    id: '2',
    title: 'Casa esquinera con jardín',
    price: '$920',
    pricePeriodSuffix: '/mes',
    operationLabel: 'Arriendo',
    location: 'Samborondón, Guayaquil',
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 210,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-2/600/450',
  },
  {
    id: '3',
    title: 'Suite moderna amoblada',
    price: '$620',
    pricePeriodSuffix: '/mes',
    operationLabel: 'Arriendo',
    featured: true,
    location: 'La Mariscal, Quito',
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 48,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-3/600/450',
  },
  {
    id: '4',
    title: 'Penthouse con terraza',
    price: '$340,000',
    operationLabel: 'Venta',
    location: 'Puerto Santa Ana, Guayaquil',
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 190,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-4/600/450',
  },
  {
    id: '5',
    title: 'Casa de campo con piscina',
    price: '$275,000',
    operationLabel: 'Venta',
    location: 'Nayón, Quito',
    bedrooms: 5,
    bathrooms: 4,
    areaM2: 320,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-5/600/450',
  },
  {
    id: '6',
    title: 'Local comercial en plaza',
    price: '$1,450',
    pricePeriodSuffix: '/mes',
    operationLabel: 'Arriendo',
    location: 'Urdesa, Guayaquil',
    bedrooms: null,
    bathrooms: 1,
    areaM2: 80,
    coverPhoto: 'https://picsum.photos/seed/sorsabsa-6/600/450',
  },
];

export function PropertyCarouselDemo() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1']));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4" id="propiedades-demo">
      <p className="section-desc">
        Componente <span className="shell-accent">&lt;PropertyCarousel&gt;</span> de @sorsabsa/ui — fila de{' '}
        <span className="shell-accent">&lt;PropertyListingCard&gt;</span> con scroll horizontal nativo
        (scroll-snap), flechas de navegación y favoritos.
      </p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <PropertyCarousel title="Propiedades destacadas" viewAllHref="#propiedades-demo">
          {MOCK_PROPERTIES.map((p) => (
            <PropertyListingCard
              key={p.id}
              href="#"
              coverPhoto={p.coverPhoto}
              title={p.title}
              price={p.price}
              pricePeriodSuffix={p.pricePeriodSuffix}
              operationLabel={p.operationLabel}
              featured={p.featured}
              location={p.location}
              bedrooms={p.bedrooms}
              bathrooms={p.bathrooms}
              areaM2={p.areaM2}
              isFavorite={favorites.has(p.id)}
              onToggleFavorite={() => toggleFavorite(p.id)}
            />
          ))}
        </PropertyCarousel>
      </div>

      <span className="font-mono text-[10px] text-zinc-500">
        {favorites.size} de {MOCK_PROPERTIES.length} marcadas como favoritas — arrastre, use el trackpad o las
        flechas para desplazar.
      </span>
    </div>
  );
}
