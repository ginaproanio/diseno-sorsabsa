'use client';

/**
 * Pantalla terminal del portero: **tenés sesión válida, pero no tenés lugar
 * en este producto**. Una sola, compartida, para todo el ecosistema.
 *
 * Por qué existe (Gina, 16-ago-2026): *"te había pedido que el portero maneje
 * un estándar, pero en cada producto le haces trabajar de formas diferentes,
 * entonces no hay estándar"*. Tenía razón — relevado ese día, el mismo caso
 * terminaba de seis maneras distintas:
 *
 *   - DomusCRM: componente propio, con salir + "ver la web pública".
 *   - CondoManager: pantalla propia adentro de DashboardShell, con salir
 *     (sin `next`) + "reintentar".
 *   - agente24siete: pantalla propia SIN ninguna acción — encerraba a la
 *     persona (AUDITORIA-AGENTE24SIETE.md 🟠-6).
 *   - IOT: ni siquiera tiene pantalla, redirige al login otra vez → identity
 *     auto-aprueba la misma cuenta → bucle infinito.
 *   - Convertidor: no filtra por cuenta, pero su "salir" no pasa por el
 *     logout central.
 *   - auth-sorsabsa: su propia pantalla para el bloqueo por suscripción.
 *
 * La regla que unifica, de Gina: **mensaje de que no tiene cuenta + un botón
 * para salir, que lleva a la web del producto si la tiene y al login si no.**
 * El destino no se decide acá ni en cada producto: lo resuelve el portero con
 * el `redirectUrl` de `apps.ts` (ver `lib/portero.ts`).
 *
 * Lo único que cada producto aporta es QUÉ decir (su regla de negocio: "sin
 * cliente asociado", "no pertenece a ningún condominio", "no tenés acceso a
 * esta inmobiliaria") y, si de verdad existe, un segundo destino útil. Nunca
 * ofrecer "volver a intentar el login": la cuenta sigue sin lugar después de
 * reautenticar, y con identity auto-aprobando, eso ES el bucle.
 */

import type { ReactNode } from 'react';
import { BrandProvider } from '../brand/BrandProvider';
import { getBrand } from '../brand/brands';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { Icon, type IconName } from '../icons/Icon';
import { salirDelEcosistema } from '../lib/portero';

export interface SinAccesoProps {
  /** Clave del producto en el ecosistema ('condomanager', 'agente24siete'…).
   *  Define la marca de la pantalla y a dónde sale el logout. */
  app: string;
  /** El rechazo, en los términos del producto. Ej: "Tu cuenta no pertenece a
   *  ningún condominio". */
  titulo: string;
  /** Qué pasó y qué puede hacer la persona. Acepta nodos para poder resaltar
   *  el email con el que entró. */
  mensaje: ReactNode;
  /** `triangleAlert` (no tenés cuenta acá) o `lock` (tenés cuenta, pero no
   *  permiso para esta sección). */
  icono?: IconName;
  /** Limpieza local del producto antes de salir (localStorage, cookies
   *  propias). Los que usan el SDK de Supabase no necesitan nada. */
  alSalir?: () => void | Promise<void>;
  /** Segunda acción REAL, solo si existe. Dos formas legítimas:
   *
   *  - `href`: otro lugar del producto donde la persona SÍ tiene lugar
   *    ("Volver a mi inventario", DomusCRM con rol insuficiente).
   *  - `alHacerClic`: reintentar la consulta que falló. CondoManager marca
   *    "sin perfil" también cuando la consulta a `perfiles` da error de red,
   *    así que su "Reintentar" es la salida de un fallo técnico, no del
   *    rechazo — sin eso, una desconexión momentánea deja a un residente real
   *    mirando "tu cuenta no pertenece a ningún condominio".
   *
   *  Lo que NO va acá: enlaces a la web o a "crear cuenta" (salir ya lleva a
   *  la web, que es donde eso vive) ni "volver a intentar el LOGIN" — la
   *  cuenta sigue sin lugar después de reautenticar y eso es el bucle. */
  secundaria?: { texto: string; href: string } | { texto: string; alHacerClic: () => void };
  textoSalir?: string;
  /** Solo productos multi-tenant — ver `urlDeSalida` en lib/portero.ts. */
  destino?: string;
  className?: string;
}

export function SinAcceso({
  app,
  titulo,
  mensaje,
  icono = 'triangleAlert',
  alSalir,
  secundaria,
  textoSalir = 'Salir',
  destino,
  className,
}: SinAccesoProps) {
  return (
    <BrandProvider
      brand={getBrand(app)}
      className={className ?? 'grid min-h-screen place-items-center px-4 font-brand'}
    >
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
            <Icon name={icono} size={24} className="text-brand-primary" />
          </span>
          <h1 className="mt-3 text-lg font-bold text-brand-text">{titulo}</h1>
          <div className="mt-2 text-sm text-brand-muted">{mensaje}</div>
          <div className="mt-6 flex flex-col gap-2">
            <Button className="w-full" onClick={() => salirDelEcosistema(app, alSalir, destino)}>
              {textoSalir}
            </Button>
            {secundaria &&
              ('href' in secundaria ? (
                <Button variant="ghost" size="sm" className="w-full" href={secundaria.href}>
                  {secundaria.texto}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="w-full" onClick={secundaria.alHacerClic}>
                  {secundaria.texto}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>
    </BrandProvider>
  );
}
