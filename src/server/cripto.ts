import 'server-only';
import { envServidor } from '@/lib/env';
import { cifrar, descifrar } from './cripto-nucleo';

/**
 * Cifrado de los datos de desbloqueo (PIN / contraseña / patrón).
 * La clave vive SOLO en la variable de entorno DEVICE_SECRET_KEY; la base
 * de datos guarda el texto cifrado, así una filtración de la BD no expone
 * las contraseñas de los clientes.
 */
function clave(): Buffer {
  return Buffer.from(envServidor().DEVICE_SECRET_KEY, 'hex');
}

export function cifrarDesbloqueo(texto: string): string {
  return cifrar(texto, clave());
}

export function descifrarDesbloqueo(cifrado: string): string {
  return descifrar(cifrado, clave());
}
