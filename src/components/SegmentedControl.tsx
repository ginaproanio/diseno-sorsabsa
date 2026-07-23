'use client';

/**
 * SegmentedControl — selector compacto de 2+ opciones mutuamente excluyentes
 * (reemplaza radios sueltos que estiran toda la fila y dejan huecos). Ocupa el
 * mínimo indispensable; el segmento activo se pinta con `brand-primary`.
 */

import type { ReactNode } from 'react';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
}

export function SegmentedControl({ value, onChange, options, className = '' }: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-brand border border-brand-border bg-brand-surface p-0.5 font-brand ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-[calc(var(--brand-radius)-0.15rem)] px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-primary text-brand-primary-foreground'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
