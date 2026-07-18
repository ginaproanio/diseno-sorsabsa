import { Icon, ICON_PATHS, type IconName } from '../lib';

const NAMES = Object.keys(ICON_PATHS) as IconName[];

const SHADOW = {
  flat: '0 1px 2px rgba(0,0,0,0.08)',
  soft: '',
};

export function IconCatalog({ shadowStyle }: { shadowStyle: 'flat' | 'soft' }) {
  const shadow = SHADOW[shadowStyle];
  return (
    <div>
      <p className="mb-3 font-mono text-xs text-zinc-600">
        <span className="font-semibold text-brand-primary">{NAMES.length}</span> íconos disponibles en el catálogo propio <span className="text-zinc-500">(stroke 1.75px, currentColor)</span>.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {NAMES.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-1 rounded border border-zinc-200 bg-white p-2 text-brand-primary transition-all hover:translate-y-[-2px]"
            style={shadow ? { boxShadow: shadow } : undefined}
          >
            <Icon name={name} size={20} />
            <span className="max-w-full truncate font-mono text-[9px] text-zinc-500">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
