import { Tag, Avatar, SectionHeader, Toast } from '../../src';

export function AtomShowcase() {
  return (
    <div className="space-y-6">
      <div className="brand-section">
        <h2 className="font-brand-heading text-2xl font-bold text-brand-text">Átomos nuevos</h2>
        <p className="text-sm text-brand-muted">Componentes marca que dan textura sin lógica de negocio.</p>
      </div>

      <div className="brand-section">
        <SectionHeader title="Tag" description="Chips de categoría tintados por marca." />
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag tone="primary">Nueva propiedad</Tag>
          <Tag tone="accent">Destacado</Tag>
          <Tag tone="success">Activa</Tag>
          <Tag tone="warning">Pendiente</Tag>
          <Tag tone="danger">Vencida</Tag>
        </div>
      </div>

      <div className="brand-section">
        <SectionHeader title="Toast" description="Feedback inline con tono de marca." />
        <div className="mt-3 space-y-2">
          <Toast tone="info" title="Información">Se actualizó la publicación.</Toast>
          <Toast tone="success" title="Éxito">La visita se agendó.</Toast>
          <Toast tone="warning" title="Atención">Quedan 3 días de prueba.</Toast>
          <Toast tone="danger" title="Error">No se pudo guardar.</Toast>
        </div>
      </div>

      <div className="brand-section">
        <SectionHeader title="Avatar" description="Iniciales con fondo primario de marca." />
        <div className="mt-3 flex items-end gap-3">
          <Avatar name="Gina Proaño" />
          <Avatar initials="AP" />
          <Avatar name="Juan" size="sm" />
          <Avatar name="María" size="lg" />
        </div>
      </div>
    </div>
  );
}
