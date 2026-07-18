import type { ReactNode } from 'react';

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
    <section className="mb-6 last:mb-0">
      <h3 className="mb-1 text-sm font-semibold text-zinc-900 tracking-tight">
        {title}
      </h3>
      {description && <p className="mb-2 text-xs text-zinc-500 max-w-2xl">{description}</p>}
      <div>{children}</div>
    </section>
  );
}
