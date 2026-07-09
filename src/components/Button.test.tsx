/**
 * SUITE DE CONTROL DE ALUCINACIÓN — Prompt 18.4
 * Verifica que el motor whitelabel realmente inyecta el token de color
 * primario que se le pasa, y que el Button lo consume y maneja sus estados.
 */

import { render, screen } from '@testing-library/react';
import { BrandProvider, hexToRgbTriplet, type BrandConfig } from '../brand/BrandProvider';
import { BRANDS, getBrand } from '../brand/brands';
import { Button } from './Button';

const marcaDePrueba: BrandConfig = {
  name: 'domuscrm',
  displayName: 'DomusCRM',
  colors: { primary: '#1d4ed8' },
  radius: '0.75rem',
};

function renderConMarca(ui: React.ReactElement, brand: BrandConfig = marcaDePrueba) {
  return render(<BrandProvider brand={brand}>{ui}</BrandProvider>);
}

describe('Motor whitelabel (BrandProvider + Button)', () => {
  it('inyecta el token de color primario recibido como variable CSS', () => {
    const { container } = renderConMarca(<Button>Guardar</Button>);
    const wrapper = container.querySelector('[data-brand="domuscrm"]') as HTMLElement;

    expect(wrapper).not.toBeNull();
    // #1d4ed8 → "29 78 216": el token viaja exacto, sin inventos
    expect(wrapper.style.getPropertyValue('--brand-primary')).toBe('29 78 216');
    expect(wrapper.style.getPropertyValue('--brand-radius')).toBe('0.75rem');
  });

  it('el Botón consume el token primario (clase bg-brand-primary), no colores fijos', () => {
    renderConMarca(<Button>Guardar</Button>);
    const boton = screen.getByRole('button', { name: 'Guardar' });

    expect(boton.className).toContain('bg-brand-primary');
    expect(boton.className).not.toMatch(/bg-(green|blue|red)-\d/); // cero colores quemados
  });

  it('cambiar de marca cambia el token sin tocar el componente', () => {
    const { container } = renderConMarca(<Button>Entrar</Button>, BRANDS.condomanager!);
    const wrapper = container.querySelector('[data-brand="condomanager"]') as HTMLElement;

    // Verde original de CondoManager (#16a34a → "22 163 74")
    expect(wrapper.style.getPropertyValue('--brand-primary')).toBe(
      hexToRgbTriplet('#16a34a'),
    );
  });

  it('maneja los estados: loading muestra spinner y deshabilita; disabled bloquea', () => {
    renderConMarca(<Button loading>Procesando</Button>);
    const boton = screen.getByRole('button', { name: /Procesando/ });

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('con href se vuelve enlace conservando la vestimenta de marca', () => {
    renderConMarca(<Button href="/panel">Ir al panel</Button>);
    const enlace = screen.getByRole('link', { name: 'Ir al panel' });

    expect(enlace).toHaveAttribute('href', '/panel');
    expect(enlace.className).toContain('bg-brand-primary');
  });

  it('getBrand cae a la identidad SORSABSA ante apps desconocidas (anti-fallo del SSO)', () => {
    expect(getBrand('app-inexistente').name).toBe('sorsabsa');
    expect(getBrand(null).name).toBe('sorsabsa');
    expect(getBrand('domuscrm').displayName).toBe('DomusCRM');
  });
});
