import { Card, CardHeader, CardTitle, CardContent, StatusBadge, type StatusTone } from '../lib';

const TONES: StatusTone[] = ['success', 'warning', 'danger', 'neutral'];

const SHADOW = {
  flat: '0 1px 2px rgba(0,0,0,0.08)',
  soft: '',
};

export function CardStatusDemo({ shadowStyle }: { shadowStyle: 'flat' | 'soft' }) {
  const shadow = SHADOW[shadowStyle];
  return (
    <Card
      variant="glass"
      interactive
      className="max-w-md"
      style={shadow ? { boxShadow: shadow } : undefined}
    >
      <CardHeader>
        <CardTitle>Card variant=&quot;glass&quot; interactive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            StatusBadge size="sm"
          </div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <StatusBadge key={t} tone={t}>
                {t}
              </StatusBadge>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            StatusBadge size="lg"
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {TONES.map((t) => (
              <StatusBadge key={t} tone={t} size="lg">
                {t}
              </StatusBadge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
