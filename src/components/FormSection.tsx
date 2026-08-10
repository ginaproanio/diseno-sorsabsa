'use client';

/**
 * FormSection — agrupa visualmente un bloque de campos relacionados dentro
 * de un formulario largo (ej. "Tu cuenta" / "Tu agencia" en un alta de
 * cuenta+empresa). Nace de PENDIENTES-ECOSISTEMA.md #18: los formularios de
 * onboarding de DomusCRM y CondoManager arman sus secciones a mano — un
 * <p> de texto suelto o nada — sin ningún componente que las agrupe, así
 * que todos los campos quedan con el mismo peso visual.
 *
 * Deliberadamente NO es un <fieldset>: varios navegadores aplican estilos
 * de reset inconsistentes a fieldset/legend que pelean con el padding y el
 * grid de los campos hijos (mismo motivo por el que Card tampoco lo usa).
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface FormSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  className = '',
  ...rest
}: FormSectionProps) {
  return (
    <div
      className={`rounded-brand border border-brand-border bg-brand-background/60 p-4 font-brand ${className}`}
      {...rest}
    >
      <div className="mb-3 flex items-center gap-1.5">
        {icon && <Icon name={icon} size={14} className="text-brand-primary" />}
        <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">{title}</p>
      </div>
      {description && <p className="-mt-2 mb-3 text-xs text-brand-muted">{description}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
