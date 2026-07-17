import { Button, type ButtonVariant } from '../lib';

// Las 4 variantes SÍ existen en el componente real (Button.tsx: primary,
// secondary, destructive, ghost) — se muestran todas, sin condicional
// "si existe" porque ninguna falta.
const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'destructive', 'ghost'];

export function ButtonMatrix() {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] text-zinc-500">
        Componente real &lt;Button&gt; — pase el cursor sobre cualquiera para ver su :hover real (CSS del componente, no una captura).
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {VARIANTS.map((v) => (
          <div key={v} className="space-y-2 rounded border border-zinc-800 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{v}</div>
            <Button variant={v} className="w-full">
              Normal
            </Button>
            <Button variant={v} loading className="w-full">
              Cargando
            </Button>
            <Button variant={v} disabled className="w-full">
              Deshabilitado
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
