import { describe, expect, it } from 'vitest';
import {
  esquemaCliente,
  esquemaEquipo,
  esquemaOrden,
  esquemaPieza,
  esquemaTasa,
} from '../esquemas';

describe('esquema de cliente', () => {
  it('normaliza el teléfono y deja el carné opcional', () => {
    const r = esquemaCliente.parse({ nombre: '  Osmany Pupo Leyva ', telefono: '+53 5 234 5678' });
    expect(r).toEqual({
      nombre: 'Osmany Pupo Leyva',
      telefono: '52345678',
      carne: null,
      municipio: null,
      notas: null,
    });
  });

  it('valida el carné de 11 dígitos', () => {
    const r = esquemaCliente.safeParse({ nombre: 'Ana Díaz', telefono: '52345678', carne: '8501' });
    expect(r.success).toBe(false);
    expect(
      esquemaCliente.parse({ nombre: 'Ana Díaz', telefono: '52345678', carne: '850101 12345' })
        .carne,
    ).toBe('85010112345');
  });

  it('rechaza teléfonos que no son cubanos', () => {
    expect(esquemaCliente.safeParse({ nombre: 'Ana Díaz', telefono: '305 555 1234' }).success).toBe(
      false,
    );
  });
});

describe('esquema de equipo', () => {
  it('normaliza el IMEI', () => {
    const r = esquemaEquipo.parse({
      tipo: 'celular',
      marca: 'Xiaomi',
      modelo: 'Redmi Note 11',
      imei_serie: '35 209900 176148 1',
    });
    expect(r.imei_serie).toBe('352099001761481');
  });
});

describe('esquema de orden', () => {
  const base = { falla_reportada: 'No carga', dias_garantia: '30' };

  it('convierte montos y fechas de los formularios', () => {
    const r = esquemaOrden.parse({
      ...base,
      presupuesto_usd: '25.499',
      fecha_prometida: '2026-11-12',
      tecnico_id: '',
    });
    expect(r.presupuesto_usd).toBe(25.5);
    expect(r.fecha_prometida).toBe('2026-11-12');
    expect(r.tecnico_id).toBeNull();
    expect(r.accesorios).toEqual([]);
  });

  it('exige describir la falla y limita la garantía a un año', () => {
    expect(esquemaOrden.safeParse({ ...base, falla_reportada: 'x' }).success).toBe(false);
    expect(esquemaOrden.safeParse({ ...base, dias_garantia: '400' }).success).toBe(false);
  });
});

describe('esquema de pieza y tasa', () => {
  it('avisa si el precio de venta es menor que el costo', () => {
    const r = esquemaPieza.safeParse({
      sku: 'pan-sa12',
      nombre: 'Pantalla A12',
      categoria: 'pantalla',
      costo_usd: '20',
      precio_usd: '15',
      stock_minimo: '2',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(['precio_usd']);
  });

  it('pone el SKU en mayúsculas', () => {
    const r = esquemaPieza.parse({
      sku: 'pan-sa12',
      nombre: 'Pantalla A12',
      categoria: 'pantalla',
      costo_usd: '14',
      precio_usd: '25',
      stock_minimo: '2',
    });
    expect(r.sku).toBe('PAN-SA12');
  });

  it('valida el rango de la tasa', () => {
    expect(esquemaTasa.safeParse({ cup_por_usd: '360' }).success).toBe(true);
    expect(esquemaTasa.safeParse({ cup_por_usd: '0' }).success).toBe(false);
  });
});
