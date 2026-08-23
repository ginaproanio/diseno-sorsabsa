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

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactElement,
} from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 shadow-sm hover:shadow-md',
  // `primary-text` y `accent-foreground` en vez de `primary` y
  // `primary-foreground`: el color de marca crudo no garantiza 4.5:1 como
  // texto y estas dos variantes lo pintan sobre fondo claro.
  secondary:
    'bg-brand-primary/10 text-brand-primary-text hover:bg-brand-primary/15 border border-brand-border',
  // 23-ago-2026 — `outline` es borde sin relleno, y NO es lo mismo que
  // `secondary`, que lleva un tinte del 10%. Se agrega porque JustiRed la
  // usaba 8 veces con su propio Button y migrarla a `secondary` habría
  // cambiado el aspecto de ocho botones de su sitio. Es el mismo caso que
  // `Select`: la pieza faltaba, y por faltar el producto mantenía su versión.
  outline:
    'bg-transparent text-brand-text border border-brand-border hover:bg-brand-muted/10',
  accent:
    'bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 shadow-sm hover:shadow-md',
  destructive:
    'bg-brand-destructive text-white hover:bg-brand-destructive/90',
  ghost: 'text-brand-text hover:bg-brand-muted/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

// El "lift" al hover (subir 1px + sombra) viene de la landing original de
// agente24siete y se adopta como micro-movimiento estándar del ecosistema.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-brand font-bold font-brand ' +
  'transition-all duration-150 hover:-translate-y-px active:translate-y-0 ' +
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /**
   * Renderiza el HIJO con los estilos del botón, en vez de dibujar un `<button>`
   * o un `<a>` propio. Para cuando el destino lo maneja otro componente: el
   * `<Link>` de react-router, el de Next, o un `<a>` con atributos propios.
   *
   * Existe desde el 23-ago-2026 y es lo que destrabó retirar el Button propio
   * de JustiRed. Ahí `asChild` envuelve `<Link to=...>` de react-router;
   * cambiarlo por el `href` de este componente habría producido un `<a>`
   * común, o sea **recarga completa de la página en vez de navegación del lado
   * del cliente** — una regresión de verdad, no cosmética. La alternativa era
   * dejarle su botón propio, que es justo lo que se está eliminando.
   *
   * Sin dependencias nuevas: se clona el hijo y se le suma la clase. Si el hijo
   * ya trae `className`, se conserva y se concatena.
   */
  asChild?: boolean;
}

export type ButtonProps = CommonProps &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
  );

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading = false, asChild = false, className = '', children, ...rest },
    ref,
  ) {
    const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
    const content = (
      <>
        {loading && <Loader2 aria-hidden data-testid="button-spinner" className="h-4 w-4 animate-spin" />}
        {children}
      </>
    );

    if (asChild && isValidElement(children)) {
      const hijo = children as ReactElement<{ className?: string }>;
      return cloneElement(hijo, {
        className: `${classes} ${hijo.props.className ?? ''}`.trim(),
      });
    }

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

