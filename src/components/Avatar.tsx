'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  initials?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<string, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

function getInitials(name?: string, fallback?: string): string {
  if (fallback) return fallback;
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ initials, name, size = 'md', className = '', ...rest }: AvatarProps) {
  const text = getInitials(name, initials);
  return (
    <div
      className={`flex items-center justify-center rounded-full font-brand font-bold bg-brand-primary text-brand-primary-foreground ${SIZE[size]} ${className}`}
      aria-label={name ?? 'Avatar'}
      {...rest}
    >
      {text}
    </div>
  );
}
