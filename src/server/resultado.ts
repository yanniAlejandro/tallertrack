import type { z } from 'zod';

/** Respuesta uniforme de las Server Actions para los formularios. */
export type ResultadoAccion<T = undefined> =
  | { ok: true; mensaje?: string; datos?: T }
  | { ok: false; error: string; errores?: Record<string, string> };

export const ESTADO_INICIAL: ResultadoAccion = { ok: true };

/** Convierte los issues de Zod en { campo: primer mensaje }. */
export function erroresDeZod(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const clave = issue.path.join('.');
    if (clave && !errores[clave]) errores[clave] = issue.message;
  }
  return errores;
}

export function fallo(error: string, errores?: Record<string, string>): ResultadoAccion<never> {
  return errores ? { ok: false, error, errores } : { ok: false, error };
}

/**
 * Traduce errores de Postgres/Supabase a mensajes comprensibles. Los
 * mensajes que lanzan nuestras funciones SQL ya están en español.
 */
export function mensajeErrorBD(error: { code?: string; message: string }): string {
  switch (error.code) {
    case '23505':
      return error.message.includes('carne')
        ? 'Ya existe un cliente con ese carné de identidad.'
        : error.message.startsWith('duplicate')
          ? 'Ese registro ya existe.'
          : error.message;
    case '42501':
      return 'No tiene permiso para realizar esta acción.';
    case '23514':
    case '22023':
    case 'P0002':
      return error.message;
    case 'PGRST116':
      return 'No se encontró el registro.';
    default:
      console.error('[BD]', error);
      return 'No se pudo completar la operación. Inténtelo de nuevo.';
  }
}

/** Lee un FormData a un objeto plano (los campos repetidos se agrupan en arrays). */
export function formAObjeto(fd: FormData): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== 'string') continue;
    const previo = obj[k];
    if (previo === undefined) obj[k] = v;
    else obj[k] = Array.isArray(previo) ? [...previo, v] : [previo, v];
  }
  return obj;
}
