'use client';

/**
 * Input — el campo de texto estándar del ecosistema.
 * Replica el patrón visual de los formularios de CondoManager (borde limpio,
 * ring primario al enfocar) con: label integrado, ícono opcional (catálogo
 * propio, no lucide-react), mensaje de error estético y accesibilidad
 * completa (aria-invalid, aria-describedby).
 */

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, hint, className = '', id, ...rest },
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
        {icon && (
          <Icon
            name={icon}
            size={16}
            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
              error ? 'text-brand-destructive' : 'text-brand-muted'
            }`}
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`w-full rounded-brand border bg-brand-surface py-2 text-brand-text ` +
            `placeholder:text-brand-muted/70 transition-colors focus:outline-none focus:ring-2 ` +
            // Con ícono: pl-9 (deja sitio al ícono) + pr-3. Sin ícono: px-3.
            // Antes `px-3 ... pl-9` juntos → Tailwind hacía ganar a px-3 y el
            // ícono pisaba el texto (bug visible en todos los inputs con ícono).
            `${icon ? 'pl-9 pr-3 ' : 'px-3 '}` +
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
