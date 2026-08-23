'use client';

/**
 * Select — el desplegable del ecosistema.
 *
 * **Es la pieza cuya ausencia causó el desvío más caro del design system.**
 * JustiRed necesitaba un `select` y no había ninguno, así que instaló shadcn
 * entero: 48 componentes, de los cuales **usa 12** y **7 duplican** lo que
 * `@sorsabsa/ui` ya daba (button, input, card, avatar, badge, table, toast).
 * Nadie eligió duplicar: vinieron de arriba al traer la librería que sí tenía
 * el desplegable. CondoManager hizo lo suyo por el mismo motivo.
 *
 * Durante semanas el check de conformidad informó eso como *"JustiRed
 * reimplementa 18 símbolos"*, o sea como indisciplina del producto, porque
 * **mide en una sola dirección**: sabe decir "este producto duplica", nunca
 * "al design system le falta". Gina lo señaló tres veces antes de que alguien
 * preguntara *duplica para conseguir qué*.
 *
 * Se construye sobre el `<select>` nativo a propósito, no sobre un menú
 * flotante: el nativo ya trae teclado, lectores de pantalla y el selector de
 * rueda de iOS, que es mejor que cualquier lista que dibujemos nosotros. Lo
 * que aporta esto es la marca, el label, el error y el hint — el mismo
 * contrato que `Input`, para que un formulario no mezcle dos estilos.
 */

import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../icons/Icon';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Primera opción deshabilitada, para que el campo no arranque con un valor
   *  que la persona no eligió. Sin esto, un `select` sin `value` muestra la
   *  primera opción como si ya estuviera decidida. */
  placeholder?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, placeholder, className = '', id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;

  return (
    <div className="w-full font-brand">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-brand-text">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`w-full appearance-none rounded-brand border bg-brand-background px-3 py-2 pr-9 text-sm text-brand-text outline-none transition-colors focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? 'border-brand-destructive focus:border-brand-destructive focus:ring-brand-destructive'
              : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'
          } ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {/* La flecha propia: `appearance-none` quita la del sistema, que en
            Windows y en Android se ven distintas entre sí y ninguna respeta la
            marca. */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted">
          <Icon name="menu" size={14} />
        </span>
      </div>
      {(error || hint) && (
        <p
          id={messageId}
          className={`mt-1 text-xs ${error ? 'text-brand-destructive' : 'text-brand-muted'}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});
