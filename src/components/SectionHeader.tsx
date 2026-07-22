'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
}

export function SectionHeader({ title, description, right, className = '', ...rest }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between ${className}`} {...rest}>
      <div>
        <h3 className="font-brand-heading text-lg font-semibold text-brand-text">{title}</h3>
        {description && <p className="mt-1 text-sm text-brand-muted">{description}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
