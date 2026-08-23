'use client';

/**
 * ConfirmarAccion — la confirmación EN LÍNEA para una acción destructiva.
 * Reemplaza a `confirm("¿estás seguro?")`, prohibido por `ESTANDAR-UI.md` §1.
 *
 * El botón se convierte en la pregunta, en el mismo lugar: no aparece nada
 * encima, no se bloquea la pestaña, y **no se tapa la fila que estás por
 * borrar** — que es justo lo que uno quiere seguir viendo mientras decide. Un
 * `confirm()` del navegador hace exactamente lo contrario: oculta el dato y
 * pregunta a ciegas.
 *
 * **La confirmación no se elimina, se muda.** Sacar el `confirm()` y dejar que
 * se borre de un clic sería cambiar un problema de forma por uno de fondo: la
 * protección contra el borrado accidental es real y se conserva.
 *
 * Por qué vive acá (23-ago-2026): nació resolviendo los 56 modales de
 * CondoManager y, al segundo día, ya la necesitaban DomusCRM (7 sitios) y
 * JustiRed. Gina cortó el camino de dejarla en un producto: *"si sigo
 * esparciendo una pieza local, en dos días es «el componente de CondoManager»
 * y el próximo producto se hace el suyo"* — que es literalmente la historia de
 * los 48 componentes propios de JustiRed y los 9 de CondoManager.
 */

import { useState, type ReactNode } from 'react';

export interface ConfirmarAccionProps {
  /** La acción destructiva. Si devuelve una promesa, se espera antes de cerrar. */
  onConfirmar: () => void | Promise<unknown>;
  /** El botón normal — lo que se ve antes de preguntar. */
  children: ReactNode;
  pregunta?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  className?: string;
  disabled?: boolean;
}

export function ConfirmarAccion({
  onConfirmar,
  children,
  pregunta = '¿Confirmás?',
  textoConfirmar = 'Sí, continuar',
  textoCancelar = 'No',
  className = '',
  disabled = false,
}: ConfirmarAccionProps) {
  const [preguntando, setPreguntando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  if (!preguntando) {
    return (
      <span
        className={className}
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          setPreguntando(true);
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 font-brand text-xs ${className}`}>
      <span className="text-brand-muted">{pregunta}</span>
      <button
        type="button"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          try {
            await onConfirmar();
          } finally {
            // Si la acción falló, el error lo muestra la pantalla; acá solo se
            // vuelve al estado inicial para no dejar la fila trabada.
            setOcupado(false);
            setPreguntando(false);
          }
        }}
        className="rounded-brand bg-brand-destructive px-2 py-1 font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {ocupado ? '…' : textoConfirmar}
      </button>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => setPreguntando(false)}
        className="rounded-brand border border-brand-border px-2 py-1 text-brand-text hover:bg-brand-muted/10"
      >
        {textoCancelar}
      </button>
    </span>
  );
}
