'use client';

/**
 * StatusBadge — el "semáforo" de estados del ecosistema, con íconos SVG del
 * catálogo propio (regla de Gina: JAMÁS emojis en la UI). Reemplaza a los
 * ✅/⏳/❌ y a las pills artesanales que cada producto armaba a mano.
 *
 * Tonos semánticos (no de marca): success (verde), warning (ámbar),
 * danger (rojo destructive), neutral (muted). Cada tono trae un ícono por
 * defecto que se puede cambiar con `icon` (ej. warning con "clock" para un
 * período de prueba).
 *
 * `size="sm"` (pill compacta, por defecto) · `size="lg"` (titular de estado,
 * ej. la licencia de la suscripción de CondoManager).
 */

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-brand-success/10 text-brand-success',
  warning: 'bg-brand-warning/10 text-brand-warning',
  danger: 'bg-brand-destructive/10 text-brand-destructive',
  neutral: 'bg-brand-muted/10 text-brand-muted',
};

const TONE_ICON: Record<StatusTone, IconName> = {
  success: 'check',
  warning: 'triangleAlert',
  danger: 'close',
  neutral: 'info',
};

export interface StatusBadgeProps {
  tone: StatusTone;
  /** Ícono del catálogo propio; por defecto el del tono. */
  icon?: IconName;
  size?: 'sm' | 'lg';
  className?: string;
  children: ReactNode;
}

export function StatusBadge({ tone, icon, size = 'sm', className = '', children }: StatusBadgeProps) {
  const esGrande = size === 'lg';
  return (
    <span
      className={`inline-flex items-center font-brand ${
        esGrande
          ? 'gap-1.5 text-xl font-bold'
          : 'gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold'
      } ${esGrande ? TONE_CLASS[tone].split(' ')[1] : TONE_CLASS[tone]} ${className}`}
    >
      <Icon name={icon ?? TONE_ICON[tone]} size={esGrande ? 20 : 14} />
      {children}
    </span>
  );
}
