import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, TECNICO, crearBD, type BD } from './entorno';

let bd: BD;
beforeAll(async () => {
  bd = await crearBD();
}, 60_000);

/** Orden reparada y entregada (garantía de 30 días). */
async function ordenEntregada() {
  const o = await bd.crearOrden();
  await bd.como('authenticated', TECNICO);
  for (const e of ['diagnostico', 'en_reparacion', 'listo', 'entregado']) {
    await bd.db.query(`select cambiar_estado($1, $2::estado_orden)`, [o.id, e]);
  }
  return o;
}

describe('garantía', () => {
  it('reabre una orden entregada como orden hija sin cobro', async () => {
    const o = await ordenEntregada();
    const h = await bd.fila<{
      es_garantia: boolean;
      orden_padre_id: string;
      mano_obra_usd: string;
      presupuesto_usd: string;
      codigo: string;
    }>(`select * from reabrir_en_garantia($1, 'Vuelve a fallar el táctil')`, [o.id]);
    expect(h.es_garantia).toBe(true);
    expect(h.orden_padre_id).toBe(o.id);
    expect(Number(h.mano_obra_usd)).toBe(0);
    expect(Number(h.presupuesto_usd)).toBe(0);
    expect(h.codigo).not.toBe(o.codigo);

    const nota = await bd.fila<{ texto: string; visible_cliente: boolean }>(
      `select texto, visible_cliente from orden_eventos where orden_id = $1 and tipo = 'nota'`,
      [o.id],
    );
    expect(nota.texto).toContain(h.codigo);
    expect(nota.visible_cliente).toBe(false);
  });

  it('no permite dos reaperturas abiertas a la vez', async () => {
    const o = await ordenEntregada();
    await bd.db.query(`select reabrir_en_garantia($1, 'Primera reclamación')`, [o.id]);
    await expect(
      bd.db.query(`select reabrir_en_garantia($1, 'Segunda reclamación')`, [o.id]),
    ).rejects.toThrow(/Ya hay una orden de garantía abierta/);
  });

  it('rechaza órdenes sin entregar o con la garantía vencida', async () => {
    const pendiente = await bd.crearOrden();
    await expect(
      bd.db.query(`select reabrir_en_garantia($1, 'Falla de nuevo')`, [pendiente.id]),
    ).rejects.toThrow(/no tiene garantía activa/);

    const vieja = await ordenEntregada();
    await bd.como('postgres');
    await bd.db.query(
      `update ordenes_servicio set garantia_hasta = current_date - 1 where id = $1`,
      [vieja.id],
    );
    await bd.como('authenticated', ADMIN);
    await expect(
      bd.db.query(`select reabrir_en_garantia($1, 'Falla de nuevo')`, [vieja.id]),
    ).rejects.toThrow(/venció/);
  });

  it('exige describir la falla', async () => {
    const o = await ordenEntregada();
    await expect(bd.db.query(`select reabrir_en_garantia($1, '  ')`, [o.id])).rejects.toThrow(
      /Describa la falla/,
    );
  });
});
