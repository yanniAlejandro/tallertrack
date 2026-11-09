import { describe, expect, it } from 'vitest';
import {
  ESTADOS_ORDEN,
  TRANSICIONES,
  esEstadoOrden,
  estaCerrada,
  pasoProgreso,
  puedeTransicionar,
  siguientesEstados,
} from '../estados';

describe('máquina de estados', () => {
  it('sigue el camino feliz recibido → entregado', () => {
    const camino = ['recibido', 'diagnostico', 'en_reparacion', 'listo', 'entregado'] as const;
    for (let i = 0; i < camino.length - 1; i++) {
      expect(puedeTransicionar(camino[i]!, camino[i + 1]!)).toBe(true);
    }
  });

  it('no permite saltarse el diagnóstico', () => {
    expect(puedeTransicionar('recibido', 'en_reparacion')).toBe(false);
    expect(puedeTransicionar('recibido', 'listo')).toBe(false);
  });

  it('entregado es un estado final', () => {
    expect(siguientesEstados('entregado')).toEqual([]);
  });

  it('permite volver a reparación si el equipo falla en la prueba final', () => {
    expect(puedeTransicionar('listo', 'en_reparacion')).toBe(true);
  });

  it('una orden cancelada o no reparable solo puede entregarse (devolver el equipo)', () => {
    expect(siguientesEstados('cancelado')).toEqual(['entregado']);
    expect(siguientesEstados('no_reparable')).toEqual(['entregado']);
  });

  it('ningún estado transiciona a sí mismo ni a "recibido"', () => {
    for (const estado of ESTADOS_ORDEN) {
      expect(TRANSICIONES[estado]).not.toContain(estado);
      expect(TRANSICIONES[estado]).not.toContain('recibido');
    }
  });

  it('todos los estados son alcanzables desde "recibido"', () => {
    const visitados = new Set<string>(['recibido']);
    const cola = ['recibido' as const];
    while (cola.length) {
      const actual = cola.shift()!;
      for (const s of TRANSICIONES[actual]) {
        if (!visitados.has(s)) {
          visitados.add(s);
          cola.push(s as never);
        }
      }
    }
    expect([...visitados].sort()).toEqual([...ESTADOS_ORDEN].sort());
  });

  it('valida valores desconocidos', () => {
    expect(esEstadoOrden('listo')).toBe(true);
    expect(esEstadoOrden('reparado')).toBe(false);
    expect(esEstadoOrden(3)).toBe(false);
  });

  it('identifica órdenes cerradas', () => {
    expect(estaCerrada('entregado')).toBe(true);
    expect(estaCerrada('listo')).toBe(false);
  });

  it('el paso de progreso nunca retrocede en el camino feliz', () => {
    const pasos = ['recibido', 'diagnostico', 'en_reparacion', 'listo', 'entregado'].map((e) =>
      pasoProgreso(e as never),
    );
    expect(pasos).toEqual([1, 2, 3, 4, 5]);
  });
});
