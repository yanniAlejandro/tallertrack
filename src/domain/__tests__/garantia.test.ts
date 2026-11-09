import { describe, expect, it } from 'vitest';
import {
  calcularGarantiaHasta,
  esImeiValido,
  normalizarImei,
  puedeReabrirEnGarantia,
  situacionGarantia,
} from '../garantia';
import { diferenciaDias, hoyEnLaHabana, sumarDias } from '../fechas';

describe('cálculo de garantía', () => {
  it('suma los días configurados a la fecha de entrega', () => {
    expect(calcularGarantiaHasta('2026-11-09', 30)).toBe('2026-12-09');
    expect(calcularGarantiaHasta('2026-12-15', 30)).toBe('2027-01-14');
  });

  it('cero días significa sin garantía', () => {
    expect(calcularGarantiaHasta('2026-11-09', 0)).toBeNull();
  });

  it('cubre hasta el final del último día', () => {
    expect(situacionGarantia('2026-11-09', '2026-11-09')).toEqual({
      tipo: 'vigente',
      diasRestantes: 0,
      hasta: '2026-11-09',
    });
    expect(situacionGarantia('2026-11-09', '2026-11-10')).toMatchObject({
      tipo: 'vencida',
      diasVencida: 1,
    });
  });
});

describe('reapertura en garantía', () => {
  const base = {
    estado: 'entregado' as const,
    garantiaHasta: '2026-12-01',
    tieneGarantiaAbierta: false,
  };

  it('permite reabrir dentro del plazo', () => {
    expect(puedeReabrirEnGarantia(base, '2026-11-20')).toEqual({ ok: true });
  });

  it('rechaza órdenes no entregadas, vencidas o ya reabiertas', () => {
    expect(puedeReabrirEnGarantia({ ...base, estado: 'listo' }, '2026-11-20').ok).toBe(false);
    expect(puedeReabrirEnGarantia(base, '2026-12-02').ok).toBe(false);
    expect(puedeReabrirEnGarantia({ ...base, tieneGarantiaAbierta: true }, '2026-11-20').ok).toBe(
      false,
    );
    expect(puedeReabrirEnGarantia({ ...base, garantiaHasta: null }, '2026-11-20').ok).toBe(false);
  });
});

describe('IMEI', () => {
  it('normaliza espacios y guiones', () => {
    expect(normalizarImei(' 35-209900-176148-1 ')).toBe('352099001761481');
  });

  it('valida el dígito de control (Luhn)', () => {
    expect(esImeiValido('352099001761481')).toBe(true);
    expect(esImeiValido('352099001761482')).toBe(false);
    expect(esImeiValido('12345')).toBe(false);
  });
});

describe('fechas en La Habana', () => {
  it('usa la zona horaria de Cuba y no la del servidor', () => {
    // 03:00 UTC del 10/11 todavía es 9/11 en La Habana (UTC-5)
    expect(hoyEnLaHabana(new Date('2026-11-10T03:00:00Z'))).toBe('2026-11-09');
  });

  it('suma y resta días cruzando meses y años', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diferenciaDias('2026-02-27', '2026-03-01')).toBe(2);
  });
});
