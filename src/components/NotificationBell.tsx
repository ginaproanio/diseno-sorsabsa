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
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white border-2 border-zinc-900">
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
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                Notificaciones
              </span>
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllRead();
                  }}
                  className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="px-4 py-8 text-center font-mono text-xs text-zinc-400">
                  {emptyText}
                </div>
              ) : (
                <div className="py-1">
                  {notificaciones.map((notif) => {
                    const IconComponent = TYPE_ICON[notif.tipo] || Bell;
                    const iconColor = TYPE_COLOR[notif.tipo] || 'text-zinc-400';

                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleItemClick(notif)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          !notif.leida
                            ? 'bg-zinc-800/80 hover:bg-zinc-800'
                            : 'hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg bg-zinc-800 ${iconColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-semibold text-zinc-100">
                                {notif.tipo.replace(/_/g, ' ')}
                              </span>
                              {!notif.leida && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                                  Nueva
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-zinc-500 ml-auto">
                                {new Date(notif.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
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
