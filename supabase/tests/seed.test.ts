/**
 * Inserta los datos de la demo en un Postgres real con las restricciones y
 * triggers de las migraciones, siguiendo los mismos pasos que sembrarDemo().
 * Si un CHECK, una FK o un trigger rechaza algo, el seed fallaría en Supabase.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { crearBD, type BD } from './entorno';
import { generarDatosDemo } from '@/seed/generar';
import { AJUSTES_DEMO, PIEZAS_DEMO, USUARIOS_DEMO } from '@/seed/catalogo';
import { cifrar } from '@/server/cripto-nucleo';

let bd: BD;
const datos = generarDatosDemo(new Date());
const clave = Buffer.alloc(32, 1);

async function insertar(tabla: string, filas: object[]) {
  await bd.db.query(
    `insert into public.${tabla} select * from jsonb_populate_recordset(null::public.${tabla}, $1)`,
    [JSON.stringify(filas)],
  );
}

beforeAll(async () => {
  bd = await crearBD();
  await bd.como('postgres');
  await bd.db.query('select vaciar_datos_demo()');
  await bd.db.query('delete from auth.users'); // quitar los usuarios propios del entorno de pruebas

  // Usuarios demo (el trigger crea los perfiles)
  const ids: string[] = [];
  for (const u of USUARIOS_DEMO) {
    const r = await bd.fila<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
      [u.email, JSON.stringify({ nombre: u.nombre, rol: u.rol, telefono: u.telefono })],
    );
    ids.push(r.id);
  }
  const [admin, ...tecnicos] = ids as [string, ...string[]];
  const tecnico = (i: number) => tecnicos[i % tecnicos.length]!;

  await bd.db.query(
    `update ajustes set nombre_negocio = $1, direccion = $2, whatsapp = $3, pie_ticket = $4 where id = 1`,
    [
      AJUSTES_DEMO.nombre_negocio,
      AJUSTES_DEMO.direccion,
      AJUSTES_DEMO.whatsapp,
      AJUSTES_DEMO.pie_ticket,
    ],
  );
  for (const t of datos.tasas) {
    await bd.db.query(
      'insert into tasas_cambio (cup_por_usd, vigente_desde, creado_por) values ($1, $2, $3)',
      [t.cup_por_usd, t.vigente_desde, admin],
    );
  }

  const piezas = new Map<string, string>();
  for (const p of PIEZAS_DEMO) {
    const r = await bd.fila<{ id: string }>(
      `insert into piezas (sku, nombre, categoria, compatible_con, costo_usd, precio_usd, stock, stock_minimo)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [
        p.sku,
        p.nombre,
        p.categoria,
        p.compatible_con,
        p.costo_usd,
        p.precio_usd,
        datos.stockFinal[p.sku],
        p.stock_minimo,
      ],
    );
    piezas.set(p.sku, r.id);
  }

  await insertar('clientes', datos.clientes);
  await insertar('equipos', datos.equipos);

  const filas = datos.ordenes.map(({ tecnico_indice, desbloqueo_valor, ...o }) => ({
    ...o,
    tecnico_id: tecnico(tecnico_indice),
    desbloqueo_cifrado: desbloqueo_valor ? cifrar(desbloqueo_valor, clave) : null,
    creado_por: admin,
    actualizado_en: o.creado_en,
  }));
  for (const lote of [filas.filter((f) => !f.es_garantia), filas.filter((f) => f.es_garantia)]) {
    await insertar(
      'ordenes_servicio',
      lote.map((f) => ({ ...f, estado: 'recibido', entregada_en: null, garantia_hasta: null })),
    );
    for (const f of lote) {
      await bd.db.query(
        `update ordenes_servicio set estado = $2, entregada_en = $3, garantia_hasta = $4, mano_obra_usd = $5 where id = $1`,
        [f.id, f.estado, f.entregada_en, f.garantia_hasta, f.mano_obra_usd],
      );
    }
  }

  for (const e of datos.eventos) {
    await bd.db.query(
      `insert into orden_eventos (orden_id, tipo, estado_anterior, estado_nuevo, texto, visible_cliente, autor_id, creado_en)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        e.orden_id,
        e.tipo,
        e.estado_anterior,
        e.estado_nuevo,
        e.texto,
        e.visible_cliente,
        tecnico(e.tecnico_indice),
        e.creado_en,
      ],
    );
  }
  for (const u of datos.usos) {
    await bd.db.query(
      `insert into orden_piezas (orden_id, pieza_id, cantidad, costo_unit_usd, precio_unit_usd, creado_en)
       values ($1, $2, $3, $4, $5, $6)`,
      [u.orden_id, piezas.get(u.sku), u.cantidad, u.costo_unit_usd, u.precio_unit_usd, u.creado_en],
    );
  }
}, 120_000);

describe('seed de la demo contra el esquema real', () => {
  it('carga 4 técnicos + admin, 50 órdenes y 30 piezas', async () => {
    const r = await bd.fila<Record<string, number>>(
      `select (select count(*) from perfiles where rol = 'tecnico')::int tecnicos,
              (select count(*) from perfiles where rol = 'admin')::int admins,
              (select count(*) from ordenes_servicio)::int ordenes,
              (select count(*) from piezas)::int piezas`,
    );
    expect(r).toEqual({ tecnicos: 4, admins: 1, ordenes: 50, piezas: 30 });
  });

  it('cada orden tiene su evento de recepción con la fecha real', async () => {
    const r = await bd.fila<{ n: number }>(
      `select count(*)::int n from ordenes_servicio o
       where not exists (select 1 from orden_eventos e
                         where e.orden_id = o.id and e.estado_nuevo = 'recibido' and e.creado_en = o.creado_en)`,
    );
    expect(r.n).toBe(0);
  });

  it('las vistas de reportes devuelven datos', async () => {
    const ingresos = await bd.db.query('select * from v_ingresos_mensuales');
    const tecnicos = await bd.db.query('select * from v_rendimiento_tecnicos');
    expect(ingresos.rows.length).toBeGreaterThan(0);
    expect(tecnicos.rows.length).toBe(5);
  });

  it('la consulta pública funciona con un código sembrado', async () => {
    await bd.como('anon');
    const r = await bd.fila<{ j: { codigo: string } }>('select estado_publico($1) j', [
      datos.ordenes[0]!.codigo,
    ]);
    expect(r.j.codigo).toBe(datos.ordenes[0]!.codigo);
  });
});
