'use client';

/**
 * Checkbox — la casilla del ecosistema, con su etiqueta clicable.
 *
 * CondoManager tenía la suya (`app/components/ui/Checkbox.tsx`) y JustiRed
 * trajo la de shadcn. Ninguno lo hizo por gusto: no había una acá. Es la
 * segunda pieza —después del `select`— cuya ausencia empujaba a cada producto
 * a resolverlo por su cuenta.
 *
 * Sobre el `<input type="checkbox">` nativo, no sobre un `div` con `role`: el
 * nativo ya trae teclado, foco, estados del sistema y el comportamiento
 * esperado dentro de un `<form>`. Lo que se agrega es la marca y que **la
 * etiqueta sea parte del área clicable**, que es el error más común al
 * hacerla a mano — una casilla de 16 píxeles es imposible de acertar en un
 * teléfono.
 */

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /** Texto secundario bajo la etiqueta, para explicar qué implica marcarla. */
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className = '', id, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={`font-brand ${className}`}>
      <label
        htmlFor={inputId}
        className={`flex items-start gap-2 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-brand-border text-brand-primary accent-brand-primary focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed"
          {...rest}
        />
        {label && <span className="text-sm text-brand-text">{label}</span>}
      </label>
      {hint && <p className="ml-6 mt-0.5 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
});
