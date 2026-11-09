/**
 * Fechas de calendario en la zona horaria del taller (La Habana).
 * Se representan como 'AAAA-MM-DD' para evitar sorpresas con husos horarios.
 */

export const ZONA_HORARIA = 'America/Havana';

export type FechaISO = string;

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaIso(valor: string): valor is FechaISO {
  if (!FORMATO_ISO.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(valor);
}

/** Fecha de hoy en La Habana, sin importar dónde corra el servidor. */
export function hoyEnLaHabana(ahora: Date = new Date()): FechaISO {
  // en-CA produce exactamente AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diferenciaDias(desde: FechaISO, hasta: FechaISO): number {
  const a = Date.UTC(...partes(desde));
  const b = Date.UTC(...partes(hasta));
  return Math.round((b - a) / 86_400_000);
}

function partes(fecha: FechaISO): [number, number, number] {
  const [a, m, d] = fecha.split('-').map(Number);
  return [a ?? 1970, (m ?? 1) - 1, d ?? 1];
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2026-11-09' → '09/11/2026' */
export function formatearFecha(fecha: FechaISO): string {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

/** '2026-11-09' → '9 nov' (compacto para listas en móvil). */
export function formatearFechaCorta(fecha: FechaISO): string {
  const [, m, d] = partes(fecha);
  return `${d} ${MESES[m]}`;
}

/** Timestamp ISO → '09/11/2026 14:35' en hora de La Habana. */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  const f = new Intl.DateTimeFormat('es', {
    timeZone: ZONA_HORARIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha);
  const v = (t: Intl.DateTimeFormatPartTypes) => f.find((p) => p.type === t)?.value ?? '';
  return `${v('day')}/${v('month')}/${v('year')} ${v('hour')}:${v('minute')}`;
}

/** Convierte un timestamp ISO a la fecha de calendario de La Habana. */
export function fechaDeTimestamp(iso: string): FechaISO {
  return hoyEnLaHabana(new Date(iso));
}
