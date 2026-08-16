import { urlDeSalida } from './portero';

/**
 * Lo que estas pruebas cuidan no es el string: es la REGLA. Que la URL no
 * lleve `next` es justamente lo que hace que el portero aplique el
 * `redirectUrl` de cada app (web propia si la tiene, la app misma —y de ahí
 * al login— si no). El día que alguien "mejore" esto agregándole un destino,
 * cada producto vuelve a decidir por su cuenta a dónde sale y se rompe el
 * estándar sin que nada falle a la vista.
 */
describe('urlDeSalida', () => {
  it('apunta al logout central del ecosistema', () => {
    expect(urlDeSalida('condomanager')).toBe(
      'https://auth.sorsabsa.com/auth/logout?app=condomanager',
    );
  });

  it('NO manda next: el destino lo decide el portero con el redirectUrl de la app', () => {
    expect(urlDeSalida('agente24siete')).not.toContain('next');
  });

  it('solo lleva next cuando el producto es multi-tenant y pasa un destino', () => {
    expect(urlDeSalida('domuscrm', 'https://ecoinmobiliaria.domuscrm.app/')).toBe(
      'https://auth.sorsabsa.com/auth/logout?app=domuscrm' +
        '&next=https%3A%2F%2Fecoinmobiliaria.domuscrm.app%2F',
    );
  });

  it('escapa el nombre de la app', () => {
    expect(urlDeSalida('a b')).toBe('https://auth.sorsabsa.com/auth/logout?app=a%20b');
  });
});
