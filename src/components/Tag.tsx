'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const TONE: Record<string, string> = {
  // Variantes legibles: el texto va sobre un tinte del 10%, o sea prácticamente
  // sobre el fondo. Con el color crudo, el turquesa de DomusCRM daba 2.43:1 y
  // el ocre de Agente24Siete 3.46:1. El borde y el relleno sí usan el color de
  // marca real. Mismo criterio que Button.
  primary: 'bg-brand-primary/10 text-brand-primary-text border-brand-primary/20',
  accent: 'bg-brand-accent/10 text-brand-accent-text border-brand-accent/20',
  info: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  danger: 'bg-brand-destructive/10 text-brand-destructive border-brand-destructive/20',
};

const SIZE: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Tag({ tone = 'primary', size = 'sm', className = '', children, ...rest }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-brand border font-medium font-brand ${TONE[tone]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
