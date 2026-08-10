/**
 * Mensaje de error para mostrar al usuario ante un fetch fallido a una API
 * propia del ecosistema.
 *
 * Encontrado 10-ago-2026 en agente24siete: 22 lugares en app/portal/** y
 * app/admin/** repetían `throw new Error(\`HTTP ${res.status}\`)`,
 * descartando el mensaje real que el backend ya manda en el body (ej.
 * {error: "Cuenta sin cliente asociado"}) — el usuario veía el texto
 * crudo "HTTP 401" en vez de una explicación. Encontrado también, ya
 * duplicado (sin estar roto: sí lee `data.error`, solo copiado 46 veces
 * en 31 archivos) en CondoManager — dos productos con la misma
 * necesidad ya confirma que es del paquete compartido, no de un
 * producto — mismo criterio que FormSection.
 */

/** Cuando el body YA se leyó (ej. porque también se usa en el camino
 *  exitoso) — no vuelve a tocar el Response, un body solo se lee una vez. */
export function mensajeDeErrorData(data: unknown, fallback = 'Ocurrió un error inesperado'): string {
  const error = (data as { error?: unknown })?.error;
  return typeof error === 'string' && error ? error : fallback;
}

/** Cuando el body todavía no se leyó — el caso más común (falla antes de
 *  necesitar los datos de éxito). */
export async function mensajeDeError(res: Response, fallback = 'Ocurrió un error inesperado'): Promise<string> {
  try {
    return mensajeDeErrorData(await res.json(), fallback);
  } catch {
    return fallback;
  }
}
