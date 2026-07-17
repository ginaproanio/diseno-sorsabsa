/**
 * Único punto de entrada a @sorsabsa/ui dentro del showcase: reexporta
 * TODO desde el código FUENTE real del repo (../../src), nunca desde npm —
 * así esta app siempre refleja el estado actual de brands.ts y de los
 * componentes sin publicar ni bumpear versión.
 *
 * El resto de archivos del showcase importa de aquí (`./lib`), no de
 * '../../src' directamente — evita repetir rutas relativas profundas
 * ("../../../src") propensas a error en cada componente nuevo.
 */
export * from '../../src';
