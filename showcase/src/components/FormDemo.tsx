import { Input } from '../lib';

/** <Input> nombrado explícitamente en el objetivo del showcase junto a
 * Button/Card/Icon/StatusBadge/Wordmark/TypingDots — sus 4 props reales
 * (label, icon, error, hint) en vivo. */
export function FormDemo() {
  return (
    <div className="grid max-w-md gap-4">
      <Input label="Nombre" placeholder="Ej. Gina Proaño" />
      <Input label="Ubicación" icon="mapPin" placeholder="Buscar sector..." />
      <Input label="Correo" defaultValue="correo-mal-formado" error="Ingrese un correo válido" />
      <Input label="Teléfono" icon="phone" hint="Incluye código de país" placeholder="+593 ..." />
    </div>
  );
}
