import { describe, expect, it } from 'vitest';
import { gananciaPieza, nivelStock, totalesOrden, validarUsoPieza } from '../inventario';
import { esCodigoValido, normalizarCodigo } from '../codigo-orden';
import { parsearPatron, validarDesbloqueo } from '../desbloqueo';

describe('inventario', () => {
  it('clasifica el nivel de stock', () => {
    expect(nivelStock(0, 2)).toBe('agotado');
    expect(nivelStock(2, 2)).toBe('bajo');
    expect(nivelStock(5, 2)).toBe('ok');
  });

  it('no deja usar más piezas de las que hay', () => {
    expect(validarUsoPieza(3, 2)).toEqual({ ok: true, stockRestante: 1 });
    expect(validarUsoPieza(1, 2)).toMatchObject({ ok: false });
    expect(validarUsoPieza(0, 1)).toEqual({ ok: false, motivo: 'No queda stock de esta pieza.' });
    expect(validarUsoPieza(5, 0).ok).toBe(false);
    expect(validarUsoPieza(5, 1.5).ok).toBe(false);
  });

  it('calcula totales y ganancia de una orden', () => {
    const t = totalesOrden(
      [
        { cantidad: 1, costoUnitUsd: 28, precioUnitUsd: 45 },
        { cantidad: 2, costoUnitUsd: 1.5, precioUnitUsd: 4 },
      ],
      10,
    );
    expect(t).toEqual({
      piezasUsd: 53,
      costoPiezasUsd: 31,
      manoObraUsd: 10,
      totalUsd: 63,
      gananciaUsd: 32,
    });
  });

  it('en garantía la pieza cuesta pero no se cobra', () => {
    const t = totalesOrden([{ cantidad: 1, costoUnitUsd: 28, precioUnitUsd: 0 }], 0);
    expect(t.gananciaUsd).toBe(-28);
  });

  it('calcula la ganancia por pieza', () => {
    expect(gananciaPieza(18.5, 30)).toEqual({ gananciaUsd: 11.5, margen: 38.3 });
  });
});

describe('código de orden', () => {
  it('valida el formato', () => {
    expect(esCodigoValido('TF-2611-7K4Q')).toBe(true);
    expect(esCodigoValido('TF-2611-7K0Q')).toBe(false); // 0 no está en el alfabeto
  });

  it('normaliza lo que el cliente teclea', () => {
    expect(normalizarCodigo('tf26117k4q')).toBe('TF-2611-7K4Q');
    expect(normalizarCodigo(' TF 2611 7K4Q ')).toBe('TF-2611-7K4Q');
    expect(normalizarCodigo('TF-26I1-7K4Q')).toBe('TF-2611-7K4Q');
    expect(normalizarCodigo('XX-2611-7K4Q')).toBeNull();
    expect(normalizarCodigo('TF-2611')).toBeNull();
  });
});

describe('desbloqueo', () => {
  it('acepta patrones de 4 a 9 puntos sin repetir', () => {
    expect(parsearPatron('1-4-7-8-9')).toEqual([1, 4, 7, 8, 9]);
    expect(parsearPatron('1 2 3')).toBeNull();
    expect(parsearPatron('1-2-2-3')).toBeNull();
    expect(parsearPatron('1-2-3-10')).toBeNull();
  });

  it('valida cada tipo', () => {
    expect(validarDesbloqueo('ninguno', 'x')).toEqual({ ok: true, valor: null });
    expect(validarDesbloqueo('pin', '1234')).toEqual({ ok: true, valor: '1234' });
    expect(validarDesbloqueo('pin', '12a4').ok).toBe(false);
    expect(validarDesbloqueo('patron', '1,5,9,6')).toEqual({ ok: true, valor: '1-5-9-6' });
  });
});
