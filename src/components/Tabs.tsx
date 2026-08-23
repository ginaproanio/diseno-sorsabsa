'use client';

/**
 * Tabs — secciones dentro de una misma pantalla.
 *
 * La tercera pieza que faltaba y que cada producto resolvió por su cuenta:
 * CondoManager tiene `app/components/ui/Tabs.tsx` y JustiRed trajo el de
 * shadcn. Es además la alternativa honesta al modal en muchos casos: buena
 * parte de lo que se abre en un diálogo cabe en una pestaña, sin tapar nada.
 *
 * Controlado a propósito (`valor` + `alCambiar`): quien lo usa casi siempre
 * necesita saber en qué pestaña está —para cargar datos, para el `?tab=` de la
 * URL, para volver a la misma después de guardar—. Un componente que se guarda
 * ese estado adentro obliga a levantarlo después, y ese "después" nunca llega.
 *
 * Es una barra de botones, no enlaces: cambiar de pestaña no cambia de página.
 * Si un producto necesita que sí, usa enlaces y marca `activa` — para eso
 * `alCambiar` es opcional.
 */

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface Pestana {
  id: string;
  label: ReactNode;
  icono?: IconName;
  /** Número al lado del nombre: cuántos elementos, cuántos pendientes. */
  contador?: number;
  disabled?: boolean;
}

export interface TabsProps {
  pestanas: Pestana[];
  valor: string;
  alCambiar?: (id: string) => void;
  className?: string;
}

export function Tabs({ pestanas, valor, alCambiar, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 overflow-x-auto border-b border-brand-border font-brand ${className}`}
    >
      {pestanas.map((p) => {
        const activa = p.id === valor;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activa}
            disabled={p.disabled}
            onClick={() => !p.disabled && alCambiar?.(p.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
              activa
                ? 'border-brand-primary font-semibold text-brand-primary'
                : p.disabled
                  ? 'cursor-not-allowed border-transparent text-brand-muted/50'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            {p.icono && <Icon name={p.icono} size={14} />}
            {p.label}
            {typeof p.contador === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  activa ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-muted/15 text-brand-muted'
                }`}
              >
                {p.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
