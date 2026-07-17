import { Card, CardHeader, CardTitle, CardContent, StatusBadge, type StatusTone } from '../lib';

// Los 4 tonos SÍ existen en el componente real (StatusBadge.tsx).
const TONES: StatusTone[] = ['success', 'warning', 'danger', 'neutral'];

export function CardStatusDemo() {
  return (
    <Card variant="glass" interactive className="max-w-md">
      <CardHeader>
        <CardTitle>Card variant=&quot;glass&quot; interactive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-brand-muted">
            StatusBadge size=&quot;sm&quot;
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
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-brand-muted">
            StatusBadge size=&quot;lg&quot;
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
