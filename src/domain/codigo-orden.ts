/**
 * Código público de la orden: TF-AAMM-XXXX.
 * Lo genera la base de datos (`public.generar_codigo_orden()`); aquí solo
 * se normaliza lo que el cliente escribe o escanea.
 */

export const ALFABETO_CODIGO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const PATRON = /^TF-\d{4}-[2-9A-HJKMNP-Z]{4}$/;

export function esCodigoValido(codigo: string): boolean {
  return PATRON.test(codigo);
}

/**
 * Acepta variantes habituales al teclear: minúsculas, sin guiones, con
 * espacios, o confundiendo O/0 e I/L/1 (que el alfabeto no usa).
 */
export function normalizarCodigo(entrada: string): string | null {
  const limpio = entrada.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!limpio.startsWith('TF') || limpio.length !== 10) return null;
  // En la parte de fecha solo hay dígitos: se corrigen O→0 e I/L→1.
  const fecha = limpio.slice(2, 6).replace(/O/g, '0').replace(/[IL]/g, '1');
  // El sufijo nunca contiene 0/O/1/I/L: si aparecen, el código no es válido.
  const sufijo = limpio.slice(6);
  const codigo = `TF-${fecha}-${sufijo}`;
  return esCodigoValido(codigo) ? codigo : null;
}

/** Ruta pública de seguimiento a la que apunta el QR del ticket. */
export function rutaEstado(codigo: string): string {
  return `/estado/${encodeURIComponent(codigo)}`;
}
