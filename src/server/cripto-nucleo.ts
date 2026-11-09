import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Núcleo de cifrado AES-256-GCM, sin dependencias de Next ni de variables
 * de entorno, para poder testearlo de forma aislada.
 * Formato: "v1.<iv base64url>.<tag base64url>.<datos base64url>"
 */

const VERSION = 'v1';
const ALGORITMO = 'aes-256-gcm';

export function cifrar(texto: string, clave: Buffer): string {
  validarClave(clave);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITMO, clave, iv);
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, datos]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.');
}

export function descifrar(cifrado: string, clave: Buffer): string {
  validarClave(clave);
  const [version, iv, tag, datos] = cifrado.split('.');
  if (version !== VERSION || !iv || !tag || datos === undefined) {
    throw new Error('Formato de dato cifrado no reconocido');
  }
  const decipher = createDecipheriv(ALGORITMO, clave, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(datos, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function validarClave(clave: Buffer) {
  if (clave.length !== 32) {
    throw new Error('DEVICE_SECRET_KEY debe tener 32 bytes (64 caracteres hexadecimales)');
  }
}
