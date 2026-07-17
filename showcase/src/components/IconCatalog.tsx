import { Icon, ICON_PATHS, type IconName } from '../lib';

// Leído en vivo de ICON_PATHS (no una lista copiada a mano): si mañana se
// agrega o quita un ícono del catálogo real, esta grilla cambia sola.
const NAMES = Object.keys(ICON_PATHS) as IconName[];

export function IconCatalog() {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-zinc-500">
        {NAMES.length} íconos disponibles en el catálogo propio (stroke 1.75px, currentColor — hereda el color de marca).
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {NAMES.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-1 rounded border border-zinc-800 p-2 text-brand-primary"
          >
            <Icon name={name} size={20} />
            <span className="max-w-full truncate font-mono text-[9px] text-zinc-500">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
