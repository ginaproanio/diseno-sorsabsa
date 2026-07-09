'use client';

/**
 * Input — el campo de texto estándar del ecosistema.
 * Replica el patrón visual de los formularios de CondoManager (borde limpio,
 * ring primario al enfocar) con: label integrado, ícono Lucide opcional,
 * mensaje de error estético y accesibilidad completa (aria-invalid,
 * aria-describedby).
 */

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon: Icon, error, hint, className = '', id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;

  return (
    <div className="w-full font-brand">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-brand-text">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              error ? 'text-brand-destructive' : 'text-brand-muted'
            }`}
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`w-full rounded-brand border bg-brand-surface px-3 py-2 text-brand-text ` +
            `placeholder:text-brand-muted/70 transition-colors focus:outline-none focus:ring-2 ` +
            `${Icon ? 'pl-9 ' : ''}` +
            `${
              error
                ? 'border-brand-destructive focus:ring-brand-destructive/30'
                : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary/30'
            } ${className}`}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`mt-1 text-xs ${error ? 'text-brand-destructive' : 'text-brand-muted'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
