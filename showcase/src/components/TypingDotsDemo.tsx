import { TypingDots } from '../lib';

/** Nombrado explícitamente en el objetivo del showcase junto a
 * Button/Card/Input/Icon/StatusBadge/Wordmark. Requiere que tokens.css real
 * esté importado (ver styles.css) para que la animación se vea — si no,
 * quedaría como 3 puntos estáticos aunque el componente "funcione". */
export function TypingDotsDemo() {
  return (
    <div className="inline-flex items-center gap-2 rounded-brand border border-brand-border bg-brand-surface px-3 py-2 text-brand-muted">
      <TypingDots />
      <span className="font-mono text-[11px]">escribiendo…</span>
    </div>
  );
}
