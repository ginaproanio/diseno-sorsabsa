/**
 * Contrato único de salida del ecosistema — el "Salir" de todos los productos.
 *
 * Regla (Gina, 16-ago-2026): *"si tiene landing page debería dar mensaje de
 * que no tiene cuenta y un botón para salir, lo que le lleva a la web si es
 * que la tiene; si no tiene web sale al login"*.
 *
 * Esa regla NO se programa por producto: ya está en
 * `auth-sorsabsa/src/lib/apps.ts` como `redirectUrl` de cada app, y
 * `/auth/logout` la aplica cuando NO se le manda `next` — por eso esta
 * función no acepta destino. Los productos con web propia salen a su web
 * (condomanager.vip, agente24siete.app, domuscrm.app, www.justired.com); los
 * que no la tienen (IOT, Convertidor) salen a su propia app, que al no
 * encontrar sesión manda al login. Un solo camino, sin ramas por producto.
 *
 * Y tiene que ser ESTE logout, no un enlace a la web: cierra las DOS
 * sesiones, la del producto y la de sorsabsa-identity. Cerrar solo la local
 * deja a identity "recordando" la cuenta y auto-aprobando la siguiente
 * autorización sin pedir credenciales — o sea el próximo "Ingresar" vuelve a
 * entrar con la MISMA cuenta, en silencio. El ecosistema ya pagó ese bug
 * tres veces (CondoManager, JustiRed, agente24siete): ver
 * `AUDITORIA-PORTERO-SSO.md` 🟠-5 y el comentario de
 * `auth-sorsabsa/src/app/auth/logout/page.tsx`.
 */
const PORTERO = 'https://auth.sorsabsa.com/auth';

/** URL del cierre de sesión universal para un producto. Sin `next` a
 *  propósito: el destino lo decide el portero con el `redirectUrl` de la app.
 *  Útil para un `href`; para un `onClick` usar `salirDelEcosistema`. */
export function urlDeSalida(app: string): string {
  return `${PORTERO}/logout?app=${encodeURIComponent(app)}`;
}

/**
 * Salir de verdad: primero la limpieza local del producto (si la tiene),
 * después el logout central.
 *
 * `limpiar` existe porque no todos guardan la sesión igual: los que usan el
 * SDK de Supabase no necesitan nada, pero agente24siete la guarda en
 * `localStorage` + cookie de su propio origen, y `auth.sorsabsa.com` no puede
 * tocar el almacenamiento de otro dominio. Lo que se limpia es asunto del
 * producto; que después se pase por el logout central, no.
 */
export function salirDelEcosistema(app: string, limpiar?: () => void | Promise<void>): void {
  void (async () => {
    try {
      await limpiar?.();
    } catch {
      /* que una limpieza local fallida no impida cerrar la sesión real */
    }
    window.location.href = urlDeSalida(app);
  })();
}
