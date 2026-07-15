'use client';

/**
 * Icon — catálogo de iconos propio del ecosistema (reemplaza lucide-react
 * y emoji usados como icono). Stroke uniforme 1.75px, puntas redondeadas,
 * 20 o 24px, currentColor: hereda el color de texto de su contenedor, así
 * que se pinta solo con cualquier color de marca sin tocar el componente.
 */

import { forwardRef, type SVGAttributes } from 'react';
import { ICON_PATHS, type IconName } from './icon-paths';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'name'> {
  name: IconName;
  /** 20/24 son los tamaños de uso más común (nav, botones); cualquier otro
   *  número también es válido (ej. iconos grandes de estado vacío). */
  size?: number;
  strokeWidth?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 24, strokeWidth = 1.75, className = '', ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
});

export type { IconName };
export { ICON_PATHS };
