'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { Tag } from './Tag';
import { Avatar } from './Avatar';
import { Toast } from './Toast';

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  brand: { name: string };
  title?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  status?: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' };
  aside?: ReactNode;
  footer?: ReactNode;
}

export function AppShell({
  brand,
  title,
  primaryAction,
  secondaryAction,
  status,
  aside,
  footer,
  className = '',
  children,
  ...rest
}: AppShellProps) {
  return (
    <div className={`min-h-screen bg-brand-background font-brand text-brand-text ${className}`} {...rest}>
      <header className="sticky top-0 z-30 border-b border-brand-border/60 bg-brand-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Wordmark className="text-xl font-bold" />
            {status && <Tag tone={status.tone ?? 'info'} size="sm">{status.label}</Tag>}
          </div>
          <div className="flex items-center gap-2">
            {secondaryAction}
            {primaryAction && <Button size="sm">{primaryAction}</Button>}
            <Avatar initials={brand.name[0]?.toUpperCase()} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {aside && (
          <aside className="hidden lg:block">
            {aside}
          </aside>
        )}
      </div>

      <main className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {title && (
            <div className="space-y-1">
              <h1 className="font-brand-heading text-3xl font-bold tracking-tight text-brand-text">{title}</h1>
              <p className="text-sm text-brand-muted">Área principal con fondo, elevación y tokens de marca.</p>
            </div>
          )}
          {children}
        </div>
      </main>

      {footer && (
        <footer className="border-t border-brand-border/60 bg-brand-background">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{footer}</div>
        </footer>
      )}
    </div>
  );
}
