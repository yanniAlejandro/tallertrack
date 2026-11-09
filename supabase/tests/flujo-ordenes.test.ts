import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, TECNICO, crearBD, type BD } from './entorno';

let bd: BD;
beforeAll(async () => {
  bd = await crearBD();
}, 60_000);

describe('usuarios y ajustes', () => {
  it('crea el perfil automáticamente con el rol de los metadatos', async () => {
    await bd.como('postgres');
    const { rows } = await bd.db.query<{ id: string; rol: string }>(
      'select id, rol from perfiles order by rol',
    );
    expect(rows).toEqual([
      { id: ADMIN, rol: 'admin' },
      { id: TECNICO, rol: 'tecnico' },
    ]);
  });

  it('existe la fila inicial de ajustes y solo el admin la edita', async () => {
    await bd.como('authenticated', TECNICO);
    const t = await bd.db.query(`update ajustes set nombre_negocio = 'X' where id = 1`);
    expect(t.affectedRows).toBe(0);

    await bd.como('authenticated', ADMIN);
    const a = await bd.db.query(`update ajustes set nombre_negocio = 'TecnoFix' where id = 1`);
    expect(a.affectedRows).toBe(1);
  });
});

describe('validaciones de datos', () => {
  it('rechaza un carné que no tiene 11 dígitos', async () => {
    await bd.como('authenticated', ADMIN);
    await expect(
      bd.db.query(
        `insert into clientes (nombre, telefono, carne) values ('Ana Díaz', '52345678', '123')`,
      ),
    ).rejects.toThrow(/carne/);
  });

  it('exige el dato cifrado si el equipo tiene bloqueo', async () => {
    const o = await bd.crearOrden();
    await expect(
      bd.db.query(`update ordenes_servicio set desbloqueo_tipo = 'pin' where id = $1`, [o.id]),
    ).rejects.toThrow(/desbloqueo_coherente/);
  });
});

describe('flujo de estados', () => {
  it('genera un código público no secuencial y registra la recepción', async () => {
    const o = await bd.crearOrden();
    expect(o.codigo).toMatch(/^TF-\d{4}-[2-9A-HJKMNP-Z]{4}$/);
    const ev = await bd.fila<{ n: number }>(
      `select count(*)::int n from orden_eventos where orden_id = $1 and estado_nuevo = 'recibido'`,
      [o.id],
    );
    expect(ev.n).toBe(1);
  });

  it('el técnico avanza los estados y queda el historial', async () => {
    const o = await bd.crearOrden();
    await bd.como('authenticated', TECNICO);
    for (const e of ['diagnostico', 'en_reparacion', 'listo']) {
      await bd.db.query(`select cambiar_estado($1, $2::estado_orden, null, true)`, [o.id, e]);
    }
    const { rows } = await bd.db.query<{ estado_anterior: string; estado_nuevo: string }>(
      `select estado_anterior, estado_nuevo from orden_eventos
       where orden_id = $1 and tipo = 'cambio_estado' order by id`,
      [o.id],
    );
    expect(rows.map((r) => `${r.estado_anterior ?? '∅'}→${r.estado_nuevo}`)).toEqual([
      '∅→recibido',
      'recibido→diagnostico',
      'diagnostico→en_reparacion',
      'en_reparacion→listo',
    ]);
  });

  it('rechaza transiciones inválidas', async () => {
    const o = await bd.crearOrden();
    await expect(bd.db.query(`select cambiar_estado($1, 'entregado')`, [o.id])).rejects.toThrow(
      /No se puede pasar de recibido a entregado/,
    );
  });

  it('al entregar un equipo reparado calcula la garantía', async () => {
    const o = await bd.crearOrden();
    for (const e of ['diagnostico', 'en_reparacion', 'listo']) {
      await bd.db.query(`select cambiar_estado($1, $2::estado_orden)`, [o.id, e]);
    }
    const r = await bd.fila<{ garantia_hasta: Date | null; entregada_en: Date | null }>(
      `select garantia_hasta, entregada_en from cambiar_estado($1, 'entregado')`,
      [o.id],
    );
    expect(r.entregada_en).not.toBeNull();
    expect(r.garantia_hasta).not.toBeNull();
  });

  it('un equipo no reparable se entrega sin garantía', async () => {
    const o = await bd.crearOrden();
    await bd.db.query(`select cambiar_estado($1, 'diagnostico')`, [o.id]);
    await bd.db.query(`select cambiar_estado($1, 'no_reparable')`, [o.id]);
    const r = await bd.fila<{ garantia_hasta: Date | null }>(
      `select garantia_hasta from cambiar_estado($1, 'entregado')`,
      [o.id],
    );
    expect(r.garantia_hasta).toBeNull();
  });

  it('nadie puede escribir cambios de estado directamente en el historial', async () => {
    const o = await bd.crearOrden();
    await bd.como('authenticated', TECNICO);
    await expect(
      bd.db.query(
        `insert into orden_eventos (orden_id, tipo, estado_nuevo) values ($1, 'cambio_estado', 'listo')`,
        [o.id],
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('consulta pública por código (QR)', () => {
  it('el visitante anónimo no ve ninguna tabla', async () => {
    await bd.como('anon');
    const { rows } = await bd.db.query('select * from clientes');
    expect(rows).toHaveLength(0);
  });

  it('devuelve el estado sin datos sensibles ni notas internas', async () => {
    const o = await bd.crearOrden();
    await bd.db.query(
      `insert into orden_eventos (orden_id, tipo, texto, visible_cliente, autor_id)
       values ($1, 'nota', 'NOTA-INTERNA-SECRETA', false, $2),
              ($1, 'nota', 'Ya tenemos la pieza', true, $2)`,
      [o.id, ADMIN],
    );
    await bd.como('anon');
    const r = await bd.fila<{ j: Record<string, unknown> }>(`select estado_publico($1) j`, [
      o.codigo.toLowerCase(),
    ]);
    const texto = JSON.stringify(r.j);
    expect(r.j.estado).toBe('recibido');
    expect(r.j.cliente).toBe('Yanelis');
    expect(texto).toContain('Ya tenemos la pieza');
    expect(texto).not.toContain('NOTA-INTERNA-SECRETA');
    expect(texto).not.toContain('352099001761481'); // IMEI
    expect(texto).not.toContain('Pérez'); // apellidos
  });

  it('un código inexistente devuelve null', async () => {
    await bd.como('anon');
    const r = await bd.fila<{ j: unknown }>(`select estado_publico('TF-0000-AAAA') j`);
    expect(r.j).toBeNull();
  });
});
