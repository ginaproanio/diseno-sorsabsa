'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const TONE: Record<string, string> = {
  primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  accent: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
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
