'use client';

/**
 * MobileNav — menú off-canvas para paneles con sidebar (CondoManager,
 * DomusCRM, etc.). En md+ no renderiza nada visible (el layout del producto
 * sigue mostrando su <aside> de escritorio con "hidden md:flex"); en móvil
 * (<768px) muestra una barra superior compacta con icono de hamburguesa que
 * abre un panel lateral con overlay, vestido con los tokens brand-* activos.
 *
 * Sin next/link ni lógica de negocio: los items son <a href> planos, igual
 * que el resto de la librería (ver Button.tsx).
 */

import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface MobileNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  logo: ReactNode;
  footer?: ReactNode;
}

export function MobileNav({ items, logo, footer }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between bg-brand-primary px-4 py-3.5 text-brand-primary-foreground">
        <div className="font-brand-heading text-[15px] font-extrabold tracking-tight">{logo}</div>
        <button
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
          className="rounded-brand p-1.5 text-brand-primary-foreground hover:bg-white/10"
        >
          <Icon name={open ? 'close' : 'menu'} size={24} />
        </button>
      </div>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col bg-brand-primary p-4 text-brand-primary-foreground shadow-xl">
            <div className="mb-6 font-brand-heading text-base font-extrabold tracking-tight">{logo}</div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.disabled ? undefined : item.href}
                  onClick={() => setOpen(false)}
                  aria-disabled={item.disabled}
                  className={`flex items-center gap-2.5 rounded-brand px-3 py-2.5 text-sm ${
                    item.disabled
                      ? 'cursor-default opacity-55'
                      : item.active
                        ? 'bg-white/15 font-semibold text-brand-primary-foreground'
                        : 'text-brand-primary-foreground/80 hover:bg-white/10'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  {item.label}
                  {item.badge && (
                    <em className="ml-auto rounded-full border border-white/30 px-1.5 py-0.5 text-[11px] not-italic">
                      {item.badge}
                    </em>
                  )}
                </a>
              ))}
            </nav>
            {footer && <div className="mt-auto pt-4 text-sm text-brand-primary-foreground/70">{footer}</div>}
          </aside>
        </>
      )}
    </div>
  );
}
