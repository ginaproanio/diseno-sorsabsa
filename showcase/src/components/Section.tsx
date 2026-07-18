import type { ReactNode } from 'react';

/**
 * Envoltorio de sección del SHELL del showcase (no de ninguna marca): por
 * eso usa colores fijos zinc/neutros de Tailwind en vez de tokens brand-*
 * — la regla "prohibido color fijo, solo tokens brand-*" del README es
 * para los componentes de @sorsabsa/ui; este es el panel de auditoría que
 * los envuelve, y debe permanecer neutro a propósito (punto 5 del pedido).
 */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10 last:mb-0">
      <h3 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
      {description && <p className="mb-3 max-w-2xl font-mono text-[11px] text-zinc-500">{description}</p>}
      <div>{children}</div>
    </section>
  );
}
