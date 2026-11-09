import { describe, expect, it } from 'vitest';
import { generarDatosDemo, TOTAL_ORDENES } from '../generar';
import { PIEZAS_DEMO, USUARIOS_DEMO } from '../catalogo';
import { puedeTransicionar } from '@/domain/estados';
import { esImeiValido } from '@/domain/garantia';
import { esCodigoValido } from '@/domain/codigo-orden';
import { normalizarTelefonoCuba } from '@/domain/whatsapp';
import { hoyEnLaHabana } from '@/domain/fechas';

const ahora = new Date('2026-11-09T20:00:00Z');
const datos = generarDatosDemo(ahora);

describe('datos de la demo', () => {
  it('cumple las cantidades pedidas: 4 técnicos, 50 órdenes y 30 piezas', () => {
    expect(USUARIOS_DEMO.filter((u) => u.rol === 'tecnico')).toHaveLength(4);
    expect(datos.ordenes).toHaveLength(TOTAL_ORDENES);
    expect(PIEZAS_DEMO).toHaveLength(30);
    expect(new Set(PIEZAS_DEMO.map((p) => p.sku)).size).toBe(30);
  });

  it('es determinista para la misma fecha y semilla', () => {
    expect(generarDatosDemo(ahora)).toEqual(datos);
  });

  it('genera códigos, IMEI y teléfonos válidos', () => {
    expect(new Set(datos.ordenes.map((o) => o.codigo)).size).toBe(datos.ordenes.length);
    for (const o of datos.ordenes) expect(esCodigoValido(o.codigo)).toBe(true);
    for (const e of datos.equipos.filter((x) => x.tipo === 'celular')) {
      expect(esImeiValido(e.imei_serie!)).toBe(true);
    }
    for (const c of datos.clientes) expect(normalizarTelefonoCuba(c.telefono)).not.toBeNull();
  });

  it('ninguna fecha queda en el futuro', () => {
    const limite = ahora.toISOString();
    for (const o of datos.ordenes) expect(o.creado_en <= limite).toBe(true);
    for (const e of datos.eventos) expect(e.creado_en <= limite).toBe(true);
  });

  it('el historial de cada orden sigue transiciones válidas y termina en su estado', () => {
    for (const o of datos.ordenes) {
      const cambios = datos.eventos
        .filter((e) => e.orden_id === o.id && e.tipo === 'cambio_estado')
        .sort((a, b) => a.creado_en.localeCompare(b.creado_en));
      let actual = 'recibido' as const as Parameters<typeof puedeTransicionar>[0];
      for (const c of cambios) {
        expect(c.estado_anterior).toBe(actual);
        expect(puedeTransicionar(actual, c.estado_nuevo!)).toBe(true);
        actual = c.estado_nuevo!;
      }
      // Canceladas/no reparables antiguas acaban "entregado" (equipo devuelto)
      expect([o.estado, 'entregado']).toContain(actual);
    }
  });

  it('el stock nunca queda negativo y cuadra con las piezas usadas', () => {
    for (const p of PIEZAS_DEMO) {
      const usadas = datos.usos.filter((u) => u.sku === p.sku).reduce((s, u) => s + u.cantidad, 0);
      expect(datos.stockFinal[p.sku]).toBeGreaterThanOrEqual(0);
      expect(datos.stockInicial[p.sku]! - usadas).toBe(datos.stockFinal[p.sku]);
    }
  });

  it('las órdenes de garantía apuntan a una entregada con garantía vigente', () => {
    const garantias = datos.ordenes.filter((o) => o.es_garantia);
    expect(garantias.length).toBeGreaterThan(0);
    for (const g of garantias) {
      const padre = datos.ordenes.find((o) => o.id === g.orden_padre_id)!;
      expect(padre.estado).toBe('entregado');
      expect(padre.garantia_hasta! >= hoyEnLaHabana(ahora)).toBe(true);
      expect(g.mano_obra_usd).toBe(0);
    }
  });

  it('hay variedad de estados para que la demo se vea viva', () => {
    const estados = new Set(datos.ordenes.map((o) => o.estado));
    for (const e of ['recibido', 'diagnostico', 'en_reparacion', 'listo', 'entregado']) {
      expect(estados).toContain(e);
    }
  });
});
