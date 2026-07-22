'use client';

'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: ReactNode;
}

const TONE: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
};

export function Toast({ tone = 'info', title, className = '', children, ...rest }: ToastProps) {
  return (
    <div
      role="status"
      className={`rounded-brand border ${TONE[tone]} ${className}`}
      {...rest}
    >
      {title && <p className="text-sm font-semibold">{title}</p>}
      {children && <p className="text-sm opacity-90">{children}</p>}
    </div>
  );
}
