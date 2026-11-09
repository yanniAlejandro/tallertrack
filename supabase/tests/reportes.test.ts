import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, TECNICO, crearBD, type BD } from './entorno';

let bd: BD;

beforeAll(async () => {
  bd = await crearBD();
  await bd.como('authenticated', ADMIN);
  const pieza = (
    await bd.fila<{ id: string }>(
      `insert into piezas (sku, nombre, categoria, costo_usd, precio_usd)
       values ('PAN-SA12', 'Pantalla A12', 'pantalla', 14, 25) returning id`,
    )
  ).id;
  await bd.db.query(`select ajustar_stock($1, 5, 'Compra')`, [pieza]);

  // Orden 1: pantalla ($25) + mano de obra $10, tasa 360 → entregada y luego reabierta.
  // Orden 2: solo mano de obra $8, tasa 350 → entregada.
  // Orden 3: en reparación (no cuenta como ingreso).
  const ordenes = [];
  for (const [mano, tasa] of [
    [10, 360],
    [8, 350],
    [5, 360],
  ] as const) {
    const o = await bd.crearOrden();
    await bd.como('postgres');
    await bd.db.query(
      `update ordenes_servicio set mano_obra_usd = $2, tasa_aplicada = $3 where id = $1`,
      [o.id, mano, tasa],
    );
    await bd.como('authenticated', TECNICO);
    ordenes.push(o);
  }
  const o1 = ordenes[0]!;
  const o2 = ordenes[1]!;
  const o3 = ordenes[2]!;
  await bd.db.query(`select cambiar_estado($1, 'diagnostico')`, [o1.id]);
  await bd.db.query(`select cambiar_estado($1, 'en_reparacion')`, [o1.id]);
  await bd.db.query(`select usar_pieza($1, $2, 1)`, [o1.id, pieza]);
  for (const o of [o1, o2]) {
    if (o === o2) {
      await bd.db.query(`select cambiar_estado($1, 'diagnostico')`, [o.id]);
      await bd.db.query(`select cambiar_estado($1, 'en_reparacion')`, [o.id]);
    }
    await bd.db.query(`select cambiar_estado($1, 'listo')`, [o.id]);
    await bd.db.query(`select cambiar_estado($1, 'entregado')`, [o.id]);
  }
  await bd.db.query(`select cambiar_estado($1, 'diagnostico')`, [o3.id]);
  await bd.db.query(`select reabrir_en_garantia($1, 'Volvió a fallar')`, [o1.id]);
  await bd.como('authenticated', ADMIN);
}, 60_000);

describe('reportes', () => {
  it('ingresos del mes en USD y en CUP con la tasa de cada orden', async () => {
    const r = await bd.fila<Record<string, string>>('select * from v_ingresos_mensuales');
    expect(Number(r.ordenes)).toBe(2);
    expect(Number(r.ingresos_usd)).toBe(43); // 35 + 8
    expect(Number(r.ingresos_cup)).toBe(35 * 360 + 8 * 350);
    expect(Number(r.costo_piezas_usd)).toBe(14);
    expect(Number(r.ganancia_usd)).toBe(29);
  });

  it('ganancia por pieza solo de equipos entregados', async () => {
    const r = await bd.fila<Record<string, string>>('select * from v_ganancia_piezas');
    expect(Number(r.unidades)).toBe(1);
    expect(Number(r.ganancia_usd)).toBe(11);
  });

  it('rendimiento por técnico con retornos en garantía', async () => {
    const r = await bd.fila<Record<string, string | number>>(
      'select * from v_rendimiento_tecnicos where tecnico_id = $1',
      [TECNICO],
    );
    expect(r.entregadas).toBe(2);
    expect(r.en_curso).toBe(2); // orden 3 + la reapertura
    expect(r.retornos_garantia).toBe(1);
    expect(Number(r.ingresos_usd)).toBe(43);
  });

  it('cuenta las órdenes por estado', async () => {
    const { rows } = await bd.db.query<{ estado: string; cantidad: number }>(
      'select * from v_ordenes_por_estado order by estado',
    );
    expect(Object.fromEntries(rows.map((r) => [r.estado, r.cantidad]))).toEqual({
      diagnostico: 1,
      entregado: 2,
      recibido: 1,
    });
  });

  it('las vistas respetan la RLS: el anónimo no ve nada', async () => {
    await bd.como('anon');
    const { rows } = await bd.db.query('select * from v_ingresos_mensuales');
    expect(rows).toHaveLength(0);
    await bd.como('authenticated', ADMIN);
  });
});
