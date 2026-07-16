import { render, screen } from '@testing-library/react';
import { BrandProvider } from '../brand/BrandProvider';
import { BRANDS } from '../brand/brands';
import { Wordmark } from './Wordmark';

describe('Wordmark (logotipo con la identidad real de la marca)', () => {
  it('CondoManager: "Condo" en oro (accent) + "Manager" en verde (primary)', () => {
    render(<BrandProvider brand={BRANDS.condomanager!}><Wordmark /></BrandProvider>);
    const condo = screen.getByText('Condo');
    const manager = screen.getByText('Manager');
    expect(condo.className).toContain('text-brand-accent');   // oro
    expect(manager.className).toContain('text-brand-primary'); // verde
  });

  it('usa la tipografía de titulares de la marca (Fraunces en CondoManager)', () => {
    const { container } = render(
      <BrandProvider brand={BRANDS.condomanager!}><Wordmark /></BrandProvider>,
    );
    const wrapper = container.querySelector('[data-brand="condomanager"]') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--brand-heading-font')).toContain('Fraunces');
  });

  it('DomusCRM: "Domus" + "CRM" con su propio par de tonos', () => {
    render(<BrandProvider brand={BRANDS.domuscrm!}><Wordmark /></BrandProvider>);
    expect(screen.getByText('Domus')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
  });

  it('agente24siete: "agente"+"siete" en VERDE (accent) y SOLO "24" en ocre (primary) — definido por Gina', () => {
    render(<BrandProvider brand={BRANDS.agente24siete!}><Wordmark /></BrandProvider>);
    expect(screen.getByText('agente').className).toContain('text-brand-accent');
    expect(screen.getByText('24').className).toContain('text-brand-primary');
    expect(screen.getByText('siete').className).toContain('text-brand-accent');
  });
});
