import { diferenciaDias, sumarDias, type FechaISO } from './fechas';
import type { EstadoOrden } from './estados';

export const DIAS_GARANTIA_MAX = 365;

export function calcularGarantiaHasta(fechaEntrega: FechaISO, dias: number): FechaISO | null {
  if (!Number.isInteger(dias) || dias <= 0) return null;
  return sumarDias(fechaEntrega, Math.min(dias, DIAS_GARANTIA_MAX));
}

export type SituacionGarantia =
  | { tipo: 'sin_garantia' }
  | { tipo: 'vigente'; diasRestantes: number; hasta: FechaISO }
  | { tipo: 'vencida'; diasVencida: number; hasta: FechaISO };

/** La garantía cubre hasta el final del día indicado en `garantiaHasta`. */
export function situacionGarantia(
  garantiaHasta: FechaISO | null,
  hoy: FechaISO,
): SituacionGarantia {
  if (!garantiaHasta) return { tipo: 'sin_garantia' };
  const restantes = diferenciaDias(hoy, garantiaHasta);
  if (restantes >= 0) return { tipo: 'vigente', diasRestantes: restantes, hasta: garantiaHasta };
  return { tipo: 'vencida', diasVencida: -restantes, hasta: garantiaHasta };
}

export interface OrdenParaGarantia {
  estado: EstadoOrden;
  garantiaHasta: FechaISO | null;
  tieneGarantiaAbierta: boolean;
}

export type ResultadoReapertura = { ok: true } | { ok: false; motivo: string };

/** Replica las validaciones de `public.reabrir_en_garantia()` para la UI. */
export function puedeReabrirEnGarantia(
  orden: OrdenParaGarantia,
  hoy: FechaISO,
): ResultadoReapertura {
  if (orden.estado !== 'entregado') {
    return { ok: false, motivo: 'Solo se pueden reabrir órdenes entregadas.' };
  }
  const situacion = situacionGarantia(orden.garantiaHasta, hoy);
  if (situacion.tipo === 'sin_garantia') {
    return { ok: false, motivo: 'Esta orden no tiene garantía.' };
  }
  if (situacion.tipo === 'vencida') {
    return { ok: false, motivo: `La garantía venció hace ${situacion.diasVencida} día(s).` };
  }
  if (orden.tieneGarantiaAbierta) {
    return { ok: false, motivo: 'Ya existe una orden de garantía abierta para este equipo.' };
  }
  return { ok: true };
}

/**
 * Normaliza lo que el usuario escribe al buscar por IMEI/serie:
 * quita espacios, guiones y barras; mayúsculas para números de serie.
 */
export function normalizarImei(valor: string): string {
  return valor.replace(/[\s\-/]/g, '').toUpperCase();
}

/** Valida un IMEI de 15 dígitos con el algoritmo de Luhn. */
export function esImeiValido(imei: string): boolean {
  const limpio = normalizarImei(imei);
  if (!/^\d{15}$/.test(limpio)) return false;
  let suma = 0;
  for (let i = 0; i < 15; i++) {
    let digito = Number(limpio[i]);
    if (i % 2 === 1) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  }
  return suma % 10 === 0;
}
