import { describe, expect, it } from 'vitest';
import {
  enlaceWhatsApp,
  mensajeSegunEstado,
  normalizarTelefonoCuba,
  type DatosAviso,
} from '../whatsapp';
import { ESTADOS_ORDEN } from '../estados';

describe('teléfonos cubanos', () => {
  it.each([
    ['52345678', '5352345678'],
    ['5 234 5678', '5352345678'],
    ['+53 5234 5678', '5352345678'],
    ['0053 52345678', '5352345678'],
    ['63456789', '5363456789'],
    ['78301234', '5378301234'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarTelefonoCuba(entrada)).toBe(esperado);
  });

  it.each(['1234', '42345678', '+1 305 555 1234', ''])('rechaza %s', (entrada) => {
    expect(normalizarTelefonoCuba(entrada)).toBeNull();
  });
});

const datos: DatosAviso = {
  clienteNombre: 'Yanelis Rodríguez Pérez',
  codigo: 'TF-2611-7K4Q',
  equipo: 'Samsung Galaxy A32',
  estado: 'listo',
  totalUsd: 35,
  tasa: 360,
  fechaPrometida: '2026-11-12',
  garantiaHasta: null,
  urlEstado: 'https://tallertrack.vercel.app/estado/TF-2611-7K4Q',
  negocio: 'TecnoFix',
  direccion: 'Calzada del Cerro 1520, Cerro',
};

describe('mensaje de aviso', () => {
  it('saluda por el primer nombre y trata de usted', () => {
    const msg = mensajeSegunEstado(datos);
    expect(msg).toContain('Hola, Yanelis.');
    expect(msg).toContain('Puede pasar a recogerlo');
  });

  it('incluye el total en USD y CUP cuando el equipo está listo', () => {
    expect(mensajeSegunEstado(datos)).toContain('$35.00 · 12 600 CUP');
  });

  it('pide aprobación del presupuesto', () => {
    const msg = mensajeSegunEstado({ ...datos, estado: 'esperando_aprobacion' });
    expect(msg).toContain('¿Nos confirma');
  });

  it('genera un mensaje con enlace de seguimiento para todos los estados', () => {
    for (const estado of ESTADOS_ORDEN) {
      const msg = mensajeSegunEstado({ ...datos, estado });
      expect(msg).toContain(datos.codigo);
      expect(msg).toContain(datos.urlEstado);
    }
  });

  it('construye el enlace wa.me con el texto codificado', () => {
    const url = enlaceWhatsApp('5234 5678', 'Hola, ¿qué tal?');
    expect(url).toBe('https://wa.me/5352345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F');
    expect(enlaceWhatsApp('123', 'x')).toBeNull();
  });
});
