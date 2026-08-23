'use client';

/**
 * El disparador de avisos del ecosistema — la pieza que faltaba.
 *
 * **Por qué existe (23-ago-2026).** `Toast` existía desde hacía tiempo, pero
 * **no había forma de decir "mostrá este aviso" desde una pantalla**: ni
 * provider ni hook. Así que el componente estaba y nadie podía usarlo, y cada
 * producto resolvía el aviso por su cuenta — JustiRed conservando el sistema
 * entero de shadcn (`toast.tsx`, `use-toast.ts`, `toaster.tsx`, `sonner.tsx`),
 * y el resto cayendo en `alert()` del navegador, que `ESTANDAR-UI.md` §1
 * prohíbe.
 *
 * Es exactamente el patrón que hizo que JustiRed "se saliera del estándar":
 * **el producto no eligió duplicar, duplicó porque la pieza compartida no
 * alcanzaba** (ver `ESTANDAR-UI.md` §5). Se repitió estando el patrón ya
 * identificado, y por eso esto se construye antes de pedirle a nadie que
 * migre.
 *
 * **Un toast NO es un modal**, y la regla lo dice explícito: avisa sin
 * bloquear ni tapar. La pila se dibuja en una esquina, no captura el foco, no
 * detiene el hilo, y el resto de la página sigue usable — por eso el
 * contenedor lleva `pointer-events-none` y solo cada aviso recupera el clic.
 *
 * Uso:
 *
 *     // una vez, envolviendo la app
 *     <ToastProvider>{children}</ToastProvider>
 *
 *     // en cualquier pantalla
 *     const { toast } = useToast();
 *     toast({ title: 'Guardado', tone: 'success' });
 *     toast({ title: 'No se pudo guardar', children: msg, tone: 'danger' });
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Toast, type ToastProps } from './Toast';

export interface AvisoNuevo {
  title?: ReactNode;
  children?: ReactNode;
  tone?: ToastProps['tone'];
  /** Milisegundos hasta que se va solo. `0` lo deja hasta que lo cierren. */
  duracion?: number;
}

interface Aviso extends AvisoNuevo {
  id: number;
}

interface ContextoToast {
  toast: (aviso: AvisoNuevo) => number;
  dismiss: (id: number) => void;
}

const Contexto = createContext<ContextoToast | null>(null);

/** Un error de tono `danger` se lee más despacio que un "Guardado". */
const DURACION_POR_TONO: Record<string, number> = {
  info: 4000,
  success: 3000,
  warning: 6000,
  danger: 8000,
};

export type PosicionToast =
  | 'abajo-derecha'
  | 'abajo-izquierda'
  | 'arriba-derecha'
  | 'arriba-izquierda';

const POSICION: Record<PosicionToast, string> = {
  'abajo-derecha': 'bottom-4 right-4 items-end',
  'abajo-izquierda': 'bottom-4 left-4 items-start',
  'arriba-derecha': 'top-4 right-4 items-end',
  'arriba-izquierda': 'top-4 left-4 items-start',
};

export interface ToastProviderProps {
  children: ReactNode;
  posicion?: PosicionToast;
  /** Cuántos se ven a la vez. Los de más viejos se van al llegar al tope. */
  maximo?: number;
}

export function ToastProvider({
  children,
  posicion = 'abajo-derecha',
  maximo = 4,
}: ToastProviderProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(1);
  // Los temporizadores se guardan para poder limpiarlos al desmontar: sin esto,
  // un componente que se va deja pendiente un setState sobre algo que ya no
  // existe.
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = temporizadores.current.get(id);
    if (t) {
      clearTimeout(t);
      temporizadores.current.delete(id);
    }
    setAvisos((previos) => previos.filter((a) => a.id !== id));
  }, []);

  const toast = useCallback(
    (aviso: AvisoNuevo) => {
      const id = siguienteId.current++;
      setAvisos((previos) => [...previos, { ...aviso, id }].slice(-maximo));
      const duracion = aviso.duracion ?? DURACION_POR_TONO[aviso.tone ?? 'info'] ?? 4000;
      if (duracion > 0) {
        temporizadores.current.set(
          id,
          setTimeout(() => dismiss(id), duracion),
        );
      }
      return id;
    },
    [dismiss, maximo],
  );

  const temporizadoresAlDesmontar = temporizadores.current;
  useEffect(
    () => () => {
      for (const t of temporizadoresAlDesmontar.values()) clearTimeout(t);
      temporizadoresAlDesmontar.clear();
    },
    [temporizadoresAlDesmontar],
  );

  const valor = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {/* `aria-live` para que un lector de pantalla lo anuncie sin que nadie
          tenga que ir a buscarlo. `pointer-events-none` en el contenedor y
          `auto` en cada aviso: la pila no puede robarle un clic a la página
          que hay debajo — eso es lo que separa un aviso de un modal. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className={`pointer-events-none fixed z-50 flex max-w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 ${POSICION[posicion]}`}
      >
        {avisos.map((a) => (
          <Toast
            key={a.id}
            tone={a.tone}
            title={a.title}
            className="pointer-events-auto flex w-full items-start gap-3"
          >
            {a.children}
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              aria-label="Cerrar aviso"
              className="ml-auto shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </Toast>
        ))}
      </div>
    </Contexto.Provider>
  );
}

/**
 * Falla ruidosamente si no hay provider.
 *
 * Devolver un `toast` que no hace nada dejaría al producto creyendo que avisó
 * cuando no avisó — el mismo fallo silencioso que ya costó caro con
 * "marcar todas como leídas". Mejor romper en desarrollo que callar en
 * producción.
 */
export function useToast(): ContextoToast {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error(
      'useToast() necesita un <ToastProvider> más arriba en el árbol. ' +
        'Envolvé la app una sola vez, normalmente en el layout raíz.',
    );
  }
  return ctx;
}
