const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Evita consultar la BD con ids mal formados que llegan por la URL. */
export function esUuid(valor: string): boolean {
  return PATRON_UUID.test(valor);
}
