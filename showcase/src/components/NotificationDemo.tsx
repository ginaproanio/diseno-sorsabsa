import { useState } from 'react';
import { NotificationBell, type Notificacion } from '../lib';

const MOCK: Notificacion[] = [
  {
    id: '1',
    tipo: 'NUEVO_RESIDENTE',
    mensaje: 'Juan Pérez solicitó acceso al condominio. Unidad A-101.',
    leida: false,
    created_at: '2026-07-17T10:30:00Z',
  },
  {
    id: '2',
    tipo: 'PAGO',
    mensaje: 'Pago recibido de María Gómez por concepto de mantenimiento Julio 2026.',
    leida: false,
    created_at: '2026-07-17T09:15:00Z',
  },
  {
    id: '3',
    tipo: 'APROBACION',
    mensaje: 'La solicitud de reserva de amenidad #4471 fue aprobada por administración.',
    leida: true,
    created_at: '2026-07-16T18:45:00Z',
  },
  {
    id: '4',
    tipo: 'SUSCRIPCION',
    mensaje: 'El plan Premium del condominio se renovó automáticamente.',
    leida: true,
    created_at: '2026-07-16T12:00:00Z',
  },
  {
    id: '5',
    tipo: 'PAGO',
    mensaje: 'Pago pendiente de Carlos Ruiz — vence en 2 días.',
    leida: false,
    created_at: '2026-07-16T08:20:00Z',
  },
];

export function NotificationDemo() {
  const [notifications, setNotifications] = useState<Notificacion[]>(MOCK);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <div className="space-y-4">
      <p className="section-desc">
        Componente &lt;NotificationBell&gt; de @sorsabsa/ui — dropdown expandible con animación, badge de no leídas, ícono por tipo y acciones de marcar leída.
      </p>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col items-center gap-2">
          <NotificationBell
            notificaciones={notifications}
            unreadCount={unreadCount}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
          <span className="font-mono text-[10px] text-zinc-500">Click para abrir</span>
        </div>

        <div className="flex-1 min-w-[240px] space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Estado actual</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-zinc-400">Total</span>
              <span className="font-mono text-sm font-semibold text-zinc-200">{notifications.length}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-zinc-400">Sin leer</span>
              <span className="font-mono text-sm font-semibold text-brand-accent">{unreadCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-400">Leídas</span>
              <span className="font-mono text-sm font-semibold text-zinc-500">{notifications.length - unreadCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
