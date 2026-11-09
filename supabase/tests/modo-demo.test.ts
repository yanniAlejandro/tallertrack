import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, crearBD, type BD } from './entorno';

let bd: BD;
beforeAll(async () => {
  bd = await crearBD();
  await bd.crearOrden();
}, 60_000);

describe('modo demo', () => {
  it('ni el admin desde la app puede vaciar los datos', async () => {
    await bd.como('authenticated', ADMIN);
    await expect(bd.db.query('select vaciar_datos_demo()')).rejects.toThrow(/permission denied/);
  });

  it('la service role vacía los datos de negocio pero conserva usuarios y ajustes', async () => {
    await bd.como('service_role');
    await bd.db.query('select vaciar_datos_demo()');
    const r = await bd.fila<{
      ordenes: number;
      clientes: number;
      perfiles: number;
      ajustes: number;
    }>(
      `select (select count(*) from ordenes_servicio)::int ordenes,
              (select count(*) from clientes)::int clientes,
              (select count(*) from perfiles)::int perfiles,
              (select count(*) from ajustes)::int ajustes`,
    );
    expect(r).toEqual({ ordenes: 0, clientes: 0, perfiles: 2, ajustes: 1 });
  });
});
