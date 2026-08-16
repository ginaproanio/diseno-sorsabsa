'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  initials?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<string, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

function getInitials(name?: string, fallback?: string): string {
  if (fallback) return fallback;
  const limpio = name?.trim();
  if (!limpio) return '?';
  // `filter(Boolean)` y no `split` a secas: un nombre de solo espacios
  // devolvía [''] y terminaba en `'  '.toUpperCase()` — dos espacios dentro
  // del círculo en vez del '?'. Y con noUncheckedIndexedAccess, `parts[0][0]`
  // no compilaba: era el mismo hueco visto por el compilador.
  const partes = limpio.split(/\s+/).filter(Boolean);
  const [primera, segunda] = partes;
  if (!primera) return '?';
  if (segunda) return (primera[0]! + segunda[0]!).toUpperCase();
  return primera.slice(0, 2).toUpperCase();
}

export function Avatar({ initials, name, size = 'md', className = '', ...rest }: AvatarProps) {
  const text = getInitials(name, initials);
  return (
    <div
      className={`flex items-center justify-center rounded-full font-brand font-bold bg-brand-primary text-brand-primary-foreground ${SIZE[size]} ${className}`}
      aria-label={name ?? 'Avatar'}
      {...rest}
    >
      {text}
    </div>
  );
}
