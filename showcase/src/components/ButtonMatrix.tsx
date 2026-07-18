import { Button, type ButtonVariant } from '../lib';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'destructive', 'ghost'];

const SHADOW = {
  flat: '0 1px 2px rgba(0,0,0,0.08)',
  soft: '',
};

export function ButtonMatrix({ shadowStyle }: { shadowStyle: 'flat' | 'soft' }) {
  const shadow = SHADOW[shadowStyle];
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-zinc-600">
        Componente real <span className="font-semibold text-brand-primary">&lt;Button&gt;</span> — pase el cursor sobre cualquiera para ver su <span className="text-zinc-800">:hover</span> real.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {VARIANTS.map((v) => (
          <div key={v} className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{v}</div>
            <Button
              variant={v}
              className="w-full"
              style={shadow ? { boxShadow: shadow } : undefined}
            >
              Normal
            </Button>
            <Button
              variant={v}
              loading
              className="w-full"
              style={shadow ? { boxShadow: shadow } : undefined}
            >
              Cargando
            </Button>
            <Button
              variant={v}
              disabled
              className="w-full"
              style={shadow ? { boxShadow: shadow } : undefined}
            >
              Deshabilitado
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
