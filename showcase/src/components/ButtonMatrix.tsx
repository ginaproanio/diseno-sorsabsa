import { Button, type ButtonVariant } from '../lib';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'destructive', 'ghost'];

const SHADOW = {
  flat: '0 1px 2px rgba(0,0,0,0.08)',
  soft: '',
};

export function ButtonMatrix({ shadowStyle }: { shadowStyle: 'flat' | 'soft' }) {
  const shadow = SHADOW[shadowStyle];
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] text-zinc-500">
        Componente real &lt;Button&gt; — pase el cursor sobre cualquiera para ver su :hover real (CSS del componente, no una captura).
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {VARIANTS.map((v) => (
          <div key={v} className="space-y-2 rounded border border-zinc-800 p-3">
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
