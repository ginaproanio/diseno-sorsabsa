import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './ToastProvider';

/**
 * Pruebas del disparador de avisos.
 *
 * Las negativas son la mitad a propósito (regla 3 de la parte II de
 * ESTANDAR-DESARROLLO): lo que hay que garantizar de un toast no es solo que
 * aparezca, sino que **no se comporte como un modal** —que no tape la página
 * ni le robe los clics— y que **no mienta**: si no hay provider, el producto
 * tiene que enterarse, no creer que avisó.
 */

function Disparador({ tone, duracion }: { tone?: 'info' | 'danger'; duracion?: number }) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast({ title: 'Guardado', tone, duracion })}>
      avisar
    </button>
  );
}

describe('ToastProvider / useToast', () => {
  it('muestra el aviso al dispararlo', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Disparador />
      </ToastProvider>,
    );
    expect(screen.queryByText('Guardado')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'avisar' }));
    expect(screen.getByText('Guardado')).toBeInTheDocument();
  });

  it('se puede cerrar a mano', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Disparador duracion={0} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'avisar' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('se va solo cuando pasa su duración', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <Disparador duracion={1000} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'avisar' }));
    expect(screen.getByText('Guardado')).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.queryByText('Guardado')).toBeNull();
    jest.useRealTimers();
  });

  // NEGATIVA — la que separa un aviso de un modal. Si la pila capturara los
  // clics, taparía la página y sería justo lo que ESTANDAR-UI.md §1 combate.
  it('NO le roba los clics a la página que hay debajo', async () => {
    const user = userEvent.setup();
    const alHacerClic = jest.fn();
    render(
      <ToastProvider>
        <Disparador duracion={0} />
        <button type="button" onClick={alHacerClic}>debajo</button>
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'avisar' }));
    expect(screen.getByText('Guardado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'debajo' }));
    expect(alHacerClic).toHaveBeenCalledTimes(1);

    const pila = screen.getByText('Guardado').closest('[aria-live]');
    expect(pila?.className).toContain('pointer-events-none');
  });

  // NEGATIVA — un `toast` que no hace nada dejaría al producto creyendo que
  // avisó. Es el mismo fallo silencioso de "marcar todas como leídas".
  it('sin provider, useToast REVIENTA en vez de callarse', () => {
    const silencio = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Disparador />)).toThrow(/ToastProvider/);
    silencio.mockRestore();
  });

  // NEGATIVA — la pila no debe crecer sin límite y empujar la pantalla.
  it('no muestra más de `maximo` avisos a la vez', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider maximo={2}>
        <Disparador duracion={0} />
      </ToastProvider>,
    );
    const boton = screen.getByRole('button', { name: 'avisar' });
    await user.click(boton);
    await user.click(boton);
    await user.click(boton);
    expect(screen.getAllByText('Guardado')).toHaveLength(2);
  });
});
