'use client';

/**
 * Button — extraído de CondoManager (app/components/ui/Button.tsx).
 * Misma API (variant primary/secondary/destructive/ghost, href opcional),
 * con dos cambios de ingeniería:
 *  1. Colores fijos → tokens de marca (bg-brand-primary, etc.): el botón
 *     se pinta del color del producto que lo consuma vía BrandProvider.
 *  2. Estado `loading` con spinner (Lucide) y bloqueo de clics.
 * Sin acoplamiento a next/link: con `href` renderiza un <a> (funciona en
 * cualquier app React; Next lo intercepta igual con prefetch del navegador).
 */

import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 shadow-sm',
  secondary:
    'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 border border-brand-border',
  destructive:
    'bg-brand-destructive text-white hover:bg-brand-destructive/90',
  ghost: 'text-brand-text hover:bg-brand-muted/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-brand font-bold font-brand ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export type ButtonProps = CommonProps &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
  );

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...rest }, ref) {
    const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
    const content = (
      <>
        {loading && <Loader2 aria-hidden data-testid="button-spinner" className="h-4 w-4 animate-spin" />}
        {children}
      </>
    );

    if ('href' in rest && rest.href !== undefined) {
      const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-busy={loading || undefined}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }

    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={loading || buttonProps.disabled}
        aria-busy={loading || undefined}
        {...buttonProps}
      >
        {content}
      </button>
    );
  },
);
