import { describe, expect, it } from 'vitest';
import { cifrar, descifrar } from '../cripto-nucleo';

const clave = Buffer.alloc(32, 7);

describe('cifrado de datos de desbloqueo', () => {
  it('cifra y descifra (ida y vuelta)', () => {
    const c = cifrar('1-4-7-8-9', clave);
    expect(c.startsWith('v1.')).toBe(true);
    expect(c).not.toContain('1-4-7-8-9');
    expect(descifrar(c, clave)).toBe('1-4-7-8-9');
  });

  it('usa un IV distinto en cada cifrado', () => {
    expect(cifrar('1234', clave)).not.toBe(cifrar('1234', clave));
  });

  it('detecta manipulación del texto cifrado', () => {
    const [v, iv, tag, datos] = cifrar('mi-clave', clave).split('.');
    const alterado = [v, iv, tag, Buffer.from('otra-cosa').toString('base64url')].join('.');
    expect(datos).toBeDefined();
    expect(() => descifrar(alterado, clave)).toThrow();
  });

  it('falla con otra clave', () => {
    const c = cifrar('1234', clave);
    expect(() => descifrar(c, Buffer.alloc(32, 9))).toThrow();
  });

  it('exige una clave de 32 bytes', () => {
    expect(() => cifrar('x', Buffer.alloc(16))).toThrow(/32 bytes/);
  });
});
