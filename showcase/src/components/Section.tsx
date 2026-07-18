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
    <section className="mb-12 last:mb-0 animate-fade-in-up">
      <h3 className="section-title mb-1">{title}</h3>
      {description && <p className="section-desc mb-4 max-w-2xl">{description}</p>}
      <div>{children}</div>
    </section>
  );
}
