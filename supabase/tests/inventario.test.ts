import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, TECNICO, crearBD, type BD } from './entorno';

let bd: BD;
let pieza: string;

beforeAll(async () => {
  bd = await crearBD();
  await bd.como('authenticated', ADMIN);
  pieza = (
    await bd.fila<{ id: string }>(
      `insert into piezas (sku, nombre, categoria, costo_usd, precio_usd, stock)
       values ('PAN-SA12', 'Pantalla A12', 'pantalla', 14, 25, 0) returning id`,
    )
  ).id;
  await bd.db.query(`select ajustar_stock($1, 3, 'Compra a proveedor')`, [pieza]);
}, 60_000);

const stock = async () =>
  (await bd.fila<{ stock: number }>('select stock from piezas where id = $1', [pieza])).stock;

describe('inventario', () => {
  it('el admin registra entradas y queda el movimiento', async () => {
    expect(await stock()).toBe(3);
    const m = await bd.fila<{ n: number }>(
      `select count(*)::int n from movimientos_stock where pieza_id = $1 and tipo = 'entrada'`,
      [pieza],
    );
    expect(m.n).toBe(1);
  });

  it('un técnico no puede ajustar stock ni crear piezas', async () => {
    await bd.como('authenticated', TECNICO);
    await expect(bd.db.query(`select ajustar_stock($1, 10, 'x')`, [pieza])).rejects.toThrow(
      /Solo el administrador/,
    );
    await expect(
      bd.db.query(
        `insert into piezas (sku, nombre, categoria, costo_usd, precio_usd) values ('X-1', 'X', 'otro', 1, 2)`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('usar una pieza descuenta el stock y copia costo y precio', async () => {
    const o = await bd.crearOrden();
    await bd.como('authenticated', TECNICO);
    const r = await bd.fila<{ costo_unit_usd: string; precio_unit_usd: string }>(
      'select * from usar_pieza($1, $2, 1)',
      [o.id, pieza],
    );
    expect(Number(r.costo_unit_usd)).toBe(14);
    expect(Number(r.precio_unit_usd)).toBe(25);
    expect(await stock()).toBe(2);
  });

  it('no permite usar más piezas de las que hay', async () => {
    const o = await bd.crearOrden();
    await bd.como('authenticated', TECNICO);
    await expect(bd.db.query('select usar_pieza($1, $2, 5)', [o.id, pieza])).rejects.toThrow(
      /Stock insuficiente de Pantalla A12 \(disponible: 2\)/,
    );
    expect(await stock()).toBe(2);
  });

  it('devolver una pieza repone el stock', async () => {
    const o = await bd.crearOrden();
    await bd.como('authenticated', TECNICO);
    const op = await bd.fila<{ id: number }>('select id from usar_pieza($1, $2, 1)', [o.id, pieza]);
    expect(await stock()).toBe(1);
    await bd.db.query('select devolver_pieza($1)', [op.id]);
    expect(await stock()).toBe(2);
  });

  it('no se añaden piezas a una orden cerrada', async () => {
    const o = await bd.crearOrden();
    await bd.db.query(`select cambiar_estado($1, 'cancelado')`, [o.id]);
    await expect(bd.db.query('select usar_pieza($1, $2, 1)', [o.id, pieza])).rejects.toThrow(
      /cerrada/,
    );
  });

  it('el visitante anónimo no puede tocar el inventario', async () => {
    const o = await bd.crearOrden();
    await bd.como('anon');
    await expect(bd.db.query('select usar_pieza($1, $2, 1)', [o.id, pieza])).rejects.toThrow(
      /permission denied/,
    );
  });

  it('el stock nunca queda negativo con un ajuste', async () => {
    await bd.como('authenticated', ADMIN);
    await expect(bd.db.query(`select ajustar_stock($1, -50, 'Conteo')`, [pieza])).rejects.toThrow(
      /stock/,
    );
  });
});
