import { describe, expect, it } from 'vitest';
import {
  esTasaValida,
  formatearCup,
  formatearDoble,
  formatearUsd,
  margenPorcentaje,
  multiplicarUsd,
  sumarUsd,
  usdACup,
} from '../dinero';

describe('conversión USD → CUP', () => {
  it('convierte con la tasa indicada', () => {
    expect(usdACup(25, 360)).toBe(9000);
    expect(usdACup(0, 360)).toBe(0);
  });

  it('acepta tasas con decimales', () => {
    expect(usdACup(10, 355.5)).toBe(3555);
  });

  it('redondea hacia arriba al peso entero', () => {
    expect(usdACup(0.01, 360)).toBe(4); // 3.6 CUP → 4
    expect(usdACup(12.99, 360)).toBe(4677); // 4676.4 → 4677
  });

  it('no arrastra errores de coma flotante', () => {
    // 0.1 + 0.2 en float da 0.30000000000000004
    expect(usdACup(sumarUsd(0.1, 0.2), 100)).toBe(30);
    expect(usdACup(19.9, 100)).toBe(1990);
  });

  it('permite redondear a múltiplos de 5 o 10 CUP', () => {
    expect(usdACup(12.99, 360, 10)).toBe(4680);
    expect(usdACup(12.99, 360, 5)).toBe(4680);
    expect(usdACup(12.5, 360, 10)).toBe(4500);
  });

  it('rechaza tasas y montos inválidos', () => {
    expect(() => usdACup(10, 0)).toThrow(RangeError);
    expect(() => usdACup(10, Number.NaN)).toThrow(RangeError);
    expect(() => usdACup(-1, 360)).toThrow(RangeError);
    expect(esTasaValida(360)).toBe(true);
    expect(esTasaValida(0.5)).toBe(false);
    expect(esTasaValida(20_000)).toBe(false);
  });
});

describe('aritmética en USD', () => {
  it('suma y multiplica en centavos', () => {
    expect(sumarUsd(0.1, 0.2)).toBe(0.3);
    expect(multiplicarUsd(19.99, 3)).toBe(59.97);
  });

  it('calcula el margen sobre el precio', () => {
    expect(margenPorcentaje(30, 45)).toBe(33.3);
    expect(margenPorcentaje(10, 0)).toBe(0);
  });
});

describe('formato', () => {
  it('formatea USD con separador de miles', () => {
    expect(formatearUsd(1234.5)).toBe('$1 234.50');
    expect(formatearUsd(8)).toBe('$8.00');
    expect(formatearUsd(-3.2)).toBe('-$3.20');
  });

  it('formatea CUP sin decimales', () => {
    expect(formatearCup(9000)).toBe('9 000 CUP');
    expect(formatearCup(450)).toBe('450 CUP');
  });

  it('muestra ambas monedas', () => {
    expect(formatearDoble(25, 360)).toBe('$25.00 · 9 000 CUP');
  });
});
