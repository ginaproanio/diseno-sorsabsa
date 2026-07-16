'use client';

/**
 * TypingDots — el "está escribiendo…" de un chat: tres puntos que rebotan
 * escalonados. Extraído de la landing original de agente24siete; útil en
 * cualquier producto con conversaciones (demo de la landing, inbox del
 * panel, portal). Respeta prefers-reduced-motion (ver tokens.css).
 */

export function TypingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="escribiendo…" role="status">
      {[0, 0.15, 0.3].map((retraso) => (
        <span
          key={retraso}
          className="sorsabsa-typing-dot h-1.5 w-1.5 rounded-full bg-brand-muted"
          style={{ animationDelay: `${retraso}s` }}
        />
      ))}
    </span>
  );
}
