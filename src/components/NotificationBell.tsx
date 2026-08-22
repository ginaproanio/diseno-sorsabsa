'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, UserPlus, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

export type Notificacion = {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
};

export interface NotificationBellProps {
  notificaciones: Notificacion[];
  unreadCount?: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  emptyText?: string;
  className?: string;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  NUEVO_RESIDENTE: UserPlus,
  PAGO: DollarSign,
  SUSCRIPCION: CreditCard,
  APROBACION: CheckCircle,
};

const TYPE_COLOR: Record<string, string> = {
  NUEVO_RESIDENTE: 'text-blue-500',
  PAGO: 'text-emerald-500',
  SUSCRIPCION: 'text-purple-500',
  APROBACION: 'text-emerald-500',
};

/**
 * Campana de notificaciones del ecosistema. Va SIEMPRE arriba a la derecha,
 * antes del perfil, en todos los productos — ver `docs/ESTANDAR-UI.md` §2.
 *
 * **22-ago-2026: pasó a tokens de marca.** Estaba pintada a mano en gris
 * oscuro (`bg-zinc-900`, `border-zinc-700`, `text-emerald-400`, `font-mono`),
 * o sea que el componente compartido ignoraba el propio design system: puesto
 * en CondoManager (verde y oro) o DomusCRM (azul) se veía como un panel ajeno
 * pegado encima. Las implementaciones locales que reemplaza sí usaban los
 * tokens, así que "unificar" habría sido un retroceso visual.
 *
 * Ahora hereda del `BrandProvider` de cada producto: misma campana, mismo
 * comportamiento, la marca de quien la muestra. Que es lo que se pedía —
 * reconocible igual en todos, no idéntica en color.
 *
 * Es puramente presentacional: los datos y el marcar-leído los pone cada
 * producto por props, desde su propio `useNotifications`.
 */
export function NotificationBell({
  notificaciones,
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  emptyText = 'No hay notificaciones',
  className = '',
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(() => setIsOpen(false), containerRef);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
  };

  const handleItemClick = (notif: Notificacion) => {
    if (!notif.leida && onMarkRead) {
      onMarkRead(notif.id);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        title="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-brand border border-brand-border bg-brand-surface text-brand-text hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-brand-destructive text-white border-2 border-brand-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-brand border border-brand-border bg-brand-surface shadow-brand-lg overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <span className="font-brand text-xs font-semibold uppercase tracking-wider text-brand-text">
                Notificaciones
              </span>
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllRead();
                  }}
                  className="flex items-center gap-1 font-brand text-[11px] text-brand-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="px-4 py-8 text-center font-brand text-xs text-brand-muted">
                  {emptyText}
                </div>
              ) : (
                <div className="py-1">
                  {notificaciones.map((notif) => {
                    const IconComponent = TYPE_ICON[notif.tipo] || Bell;
                    const iconColor = TYPE_COLOR[notif.tipo] || 'text-brand-muted';

                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleItemClick(notif)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          !notif.leida
                            ? 'bg-brand-primary/10 hover:bg-brand-primary/15'
                            : 'hover:bg-brand-muted/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-brand bg-brand-background ${iconColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-brand text-[11px] font-semibold text-brand-text">
                                {notif.tipo.replace(/_/g, ' ')}
                              </span>
                              {!notif.leida && (
                                <span className="font-brand text-[10px] px-1.5 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent-text font-medium">
                                  Nueva
                                </span>
                              )}
                              <span className="font-brand text-[10px] text-brand-muted ml-auto">
                                {new Date(notif.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-brand-text line-clamp-2">
                              {notif.mensaje}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
