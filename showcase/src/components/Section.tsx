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
    <section className="mb-10 last:mb-0">
      <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">
        {title}
      </h3>
      {description && <p className="mt-1 text-xs text-zinc-400 max-w-2xl">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}