/**
 * Dinero y multi-moneda. El precio base siempre es USD; el CUP se calcula
 * con la tasa vigente (CUP por 1 USD) que define el administrador.
 * Se trabaja en centavos enteros para evitar errores de coma flotante.
 */

export type RedondeoCup = 1 | 5 | 10;

export const TASA_MINIMA = 1;
export const TASA_MAXIMA = 10_000;

export function aCentavos(monto: number): number {
  return Math.round(monto * 100);
}

export function deCentavos(centavos: number): number {
  return centavos / 100;
}

/** Suma montos en USD sin arrastrar errores de coma flotante. */
export function sumarUsd(...montos: number[]): number {
  return deCentavos(montos.reduce((acc, m) => acc + aCentavos(m), 0));
}

export function multiplicarUsd(monto: number, cantidad: number): number {
  return deCentavos(aCentavos(monto) * cantidad);
}

export function esTasaValida(tasa: number): boolean {
  return Number.isFinite(tasa) && tasa >= TASA_MINIMA && tasa <= TASA_MAXIMA;
}

/**
 * Convierte USD a CUP. En el mostrador se cobran pesos enteros, por eso
 * el resultado se redondea hacia arriba al múltiplo indicado (por defecto, 1 CUP).
 */
export function usdACup(usd: number, tasa: number, redondeo: RedondeoCup = 1): number {
  if (!esTasaValida(tasa)) {
    throw new RangeError(`Tasa de cambio inválida: ${tasa}`);
  }
  if (!Number.isFinite(usd) || usd < 0) {
    throw new RangeError(`Monto en USD inválido: ${usd}`);
  }
  const cup = (aCentavos(usd) * Math.round(tasa * 100)) / 10_000;
  // Se corrige el ruido de coma flotante antes de redondear hacia arriba.
  const limpio = Math.round(cup * 100) / 100;
  return Math.ceil(limpio / redondeo) * redondeo;
}

function agruparMiles(entero: string): string {
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 1234.5 → "$1 234.50" (espacio fino como separador de miles). */
export function formatearUsd(monto: number): string {
  const signo = monto < 0 ? '-' : '';
  const [entero = '0', decimales = '00'] = Math.abs(monto).toFixed(2).split('.');
  return `${signo}$${agruparMiles(entero)}.${decimales}`;
}

/** 9000 → "9 000 CUP" (sin decimales: así se cobra en efectivo). */
export function formatearCup(monto: number): string {
  const signo = monto < 0 ? '-' : '';
  return `${signo}${agruparMiles(Math.round(Math.abs(monto)).toString())} CUP`;
}

/** Texto doble que se muestra al cliente: "$25.00 · 9 000 CUP". */
export function formatearDoble(usd: number, tasa: number): string {
  return `${formatearUsd(usd)} · ${formatearCup(usdACup(usd, tasa))}`;
}

/** Margen sobre el precio de venta, en porcentaje con 1 decimal. */
export function margenPorcentaje(costo: number, precio: number): number {
  if (precio <= 0) return 0;
  return Math.round(((precio - costo) / precio) * 1000) / 10;
}
