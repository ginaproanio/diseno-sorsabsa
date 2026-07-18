import { Icon } from '../lib';

/**
 * Punto 4 del pedido: lo que NO existe todavía en @sorsabsa/ui se declara
 * así, en vez de disimularlo con un mockup — es un gap real a resolver,
 * no una limitación del showcase. Usa el <Icon> real del catálogo propio
 * (nunca emojis, regla del ecosistema — ver StatusBadge.tsx).
 */
export function NotImplemented({ feature }: { feature: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-dashed border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-800">
      <Icon name="triangleAlert" size={14} className="mt-0.5 shrink-0" />
      <span>
        No implementado en @sorsabsa/ui — <strong>{feature}</strong>
      </span>
    </div>
  );
}
