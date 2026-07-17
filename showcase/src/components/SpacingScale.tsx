import { NotImplemented } from './NotImplemented';

/** Verificado contra tailwind-preset.cjs (theme.extend solo trae colors,
 * borderRadius.brand y fontFamily.brand/brand-heading) y tokens.css (sin
 * variables de espaciado): no existe una escala de espaciado propia del
 * ecosistema. Es igual para las 5 marcas — no es un dato por marca, es un
 * gap de la librería. */
export function SpacingScale() {
  return <NotImplemented feature="escala de espaciado (ni en theme.extend.spacing de tailwind-preset.cjs, ni en tokens.css)" />;
}
