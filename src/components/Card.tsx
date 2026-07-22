'use client';

/**
 * Card — el contenedor estándar (patrón "bg-card + border + shadow-sm" que
 * CondoManager repite en todos sus paneles), tokenizado y con dos variantes:
 *  - 'solid': bordes sutiles estilo shadcn (el look actual de CondoManager)
 *  - 'glass': glassmorphism (blur + translúcido) para superficies premium
 * `interactive` activa el hover con elevación (tarjetas clicables).
 */

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'glass';
  interactive?: boolean;
}

const VARIANTS = {
  solid: 'bg-brand-surface border border-brand-border shadow-sm',
  glass:
    'bg-brand-surface/60 border border-brand-border/60 backdrop-blur-md shadow-sm',
} as const;

export function Card({
  variant = 'solid',
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-brand font-brand text-brand-text ${VARIANTS[variant]} ${
        interactive
          ? 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-primary/40 cursor-pointer'
          : ''
      } ${className}`}
      {...rest}
    />
  );
}

export function CardHeader({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-brand-border px-6 py-5 ${className}`} {...rest} />;
}

export function CardTitle({ className = '', children }: { className?: string; children: ReactNode }) {
  return <h3 className={`text-base font-semibold text-brand-text ${className}`}>{children}</h3>;
}

export function CardContent({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-6 py-5 ${className}`} {...rest} />;
}
