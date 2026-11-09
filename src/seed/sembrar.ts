/**
 * Siembra (o restablece) la demo en Supabase usando la service role.
 * Lo usan el script `npm run seed` y el botón "Restablecer demo".
 * No borra usuarios: los crea si faltan y restablece su contraseña demo.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { cifrar } from '@/server/cripto-nucleo';
import { AJUSTES_DEMO, CONTRASENA_DEMO, PIEZAS_DEMO, USUARIOS_DEMO } from './catalogo';
import { generarDatosDemo } from './generar';

type Admin = SupabaseClient<Database>;
type Log = (mensaje: string) => void;

const BUCKET = 'fotos-ordenes';

type Respuesta = { data: unknown; error: { message: string } | null };

/** Lanza si hay error; si no, devuelve `data` ya sin la rama de error de la unión. */
function revisar<R extends Respuesta>(
  r: R,
  paso: string,
): NonNullable<(R & { error: null })['data']> {
  if (r.error) throw new Error(`${paso}: ${r.error.message}`);
  return r.data as NonNullable<(R & { error: null })['data']>;
}

async function asegurarUsuarios(admin: Admin, log: Log): Promise<string[]> {
  const existentes = revisar(await admin.auth.admin.listUsers({ perPage: 200 }), 'Listar usuarios');
  const ids: string[] = [];
  for (const u of USUARIOS_DEMO) {
    const previo = existentes.users.find((x) => x.email === u.email);
    let id = previo?.id;
    if (!id) {
      const creado = revisar(
        await admin.auth.admin.createUser({
          email: u.email,
          password: CONTRASENA_DEMO,
          email_confirm: true,
          user_metadata: { nombre: u.nombre, rol: u.rol, telefono: u.telefono },
        }),
        `Crear usuario ${u.email}`,
      );
      id = creado.user!.id;
      log(`  usuario creado: ${u.email}`);
    } else {
      // Por si alguien cambió la contraseña de la demo
      revisar(
        await admin.auth.admin.updateUserById(id, { password: CONTRASENA_DEMO }),
        'Restablecer contraseña',
      );
    }
    revisar(
      await admin
        .from('perfiles')
        .upsert({ id, nombre: u.nombre, rol: u.rol, telefono: u.telefono, activo: true }),
      'Perfil',
    );
    ids.push(id);
  }
  return ids;
}

async function vaciarFotos(admin: Admin) {
  const carpetas = await admin.storage.from(BUCKET).list('ordenes', { limit: 1000 });
  for (const carpeta of carpetas.data ?? []) {
    const archivos = await admin.storage
      .from(BUCKET)
      .list(`ordenes/${carpeta.name}`, { limit: 1000 });
    const rutas = (archivos.data ?? []).map((a) => `ordenes/${carpeta.name}/${a.name}`);
    if (rutas.length) await admin.storage.from(BUCKET).remove(rutas);
  }
}

export interface OpcionesSiembra {
  claveCifrado: Buffer;
  ahora?: Date;
  log?: Log;
}

export async function sembrarDemo(
  admin: Admin,
  { claveCifrado, ahora = new Date(), log = () => {} }: OpcionesSiembra,
) {
  log('1/7 Vaciando datos anteriores…');
  revisar(await admin.rpc('vaciar_datos_demo'), 'Vaciar datos');
  await vaciarFotos(admin);

  log('2/7 Usuarios (1 admin + 4 técnicos)…');
  const [adminId, ...tecnicos] = await asegurarUsuarios(admin, log);
  const tecnico = (i: number) => tecnicos[i % tecnicos.length]!;

  const datos = generarDatosDemo(ahora);

  log('3/7 Ajustes y tasas de cambio…');
  revisar(await admin.from('ajustes').upsert({ id: 1, ...AJUSTES_DEMO }), 'Ajustes');
  revisar(
    await admin
      .from('tasas_cambio')
      .insert(datos.tasas.map((t) => ({ ...t, creado_por: adminId! }))),
    'Tasas',
  );

  log(`4/7 Inventario (${PIEZAS_DEMO.length} piezas)…`);
  const piezas = revisar(
    await admin
      .from('piezas')
      .insert(PIEZAS_DEMO.map((p) => ({ ...p, stock: datos.stockFinal[p.sku] ?? 0 })))
      .select('id, sku'),
    'Piezas',
  );
  const idPieza = new Map(piezas.map((p) => [p.sku, p.id]));
  const inicioInventario = new Date(ahora.getTime() - 90 * 86_400_000).toISOString();
  revisar(
    await admin.from('movimientos_stock').insert(
      PIEZAS_DEMO.filter((p) => (datos.stockInicial[p.sku] ?? 0) > 0).map((p) => ({
        pieza_id: idPieza.get(p.sku)!,
        tipo: 'entrada' as const,
        cantidad: datos.stockInicial[p.sku]!,
        motivo: 'Inventario inicial',
        autor_id: adminId!,
        creado_en: inicioInventario,
      })),
    ),
    'Movimientos iniciales',
  );

  log(`5/7 Clientes (${datos.clientes.length}) y equipos (${datos.equipos.length})…`);
  revisar(await admin.from('clientes').insert(datos.clientes), 'Clientes');
  revisar(await admin.from('equipos').insert(datos.equipos), 'Equipos');

  log(`6/7 Órdenes (${datos.ordenes.length})…`);
  const filaOrden = (o: (typeof datos.ordenes)[number]) => {
    const { tecnico_indice, desbloqueo_valor, ...resto } = o;
    return {
      ...resto,
      tecnico_id: tecnico(tecnico_indice),
      desbloqueo_cifrado: desbloqueo_valor ? cifrar(desbloqueo_valor, claveCifrado) : null,
      // El dueño recibe la mayoría de los equipos en el mostrador.
      creado_por: o.codigo.charCodeAt(9) % 3 === 0 ? tecnico(tecnico_indice) : adminId!,
    };
  };
  // Primero las originales y luego las de garantía (referencian a su orden padre).
  // Se insertan en "recibido" para que el trigger registre la recepción con su fecha
  // real, y después se actualizan a su estado final (un UPDATE no genera eventos).
  for (const lote of [
    datos.ordenes.filter((o) => !o.es_garantia),
    datos.ordenes.filter((o) => o.es_garantia),
  ]) {
    const filas = lote.map(filaOrden);
    revisar(
      await admin.from('ordenes_servicio').insert(
        filas.map((f) => ({
          ...f,
          estado: 'recibido' as const,
          entregada_en: null,
          garantia_hasta: null,
        })),
      ),
      'Órdenes',
    );
    revisar(await admin.from('ordenes_servicio').upsert(filas), 'Estado final de órdenes');
  }

  log(`7/7 Historial (${datos.eventos.length} eventos) y piezas usadas (${datos.usos.length})…`);
  revisar(
    await admin.from('orden_eventos').insert(
      datos.eventos.map(({ tecnico_indice, ...e }) => ({
        ...e,
        autor_id: tecnico(tecnico_indice),
      })),
    ),
    'Eventos',
  );
  if (datos.usos.length) {
    const codigo = new Map(datos.ordenes.map((o) => [o.id, o.codigo]));
    const autor = new Map(datos.ordenes.map((o) => [o.id, tecnico(o.tecnico_indice)]));
    revisar(
      await admin
        .from('orden_piezas')
        .insert(datos.usos.map(({ sku, ...u }) => ({ ...u, pieza_id: idPieza.get(sku)! }))),
      'Piezas de órdenes',
    );
    revisar(
      await admin.from('movimientos_stock').insert(
        datos.usos.map((u) => ({
          pieza_id: idPieza.get(u.sku)!,
          tipo: 'salida' as const,
          cantidad: -u.cantidad,
          orden_id: u.orden_id,
          motivo: `Usada en orden ${codigo.get(u.orden_id)}`,
          autor_id: autor.get(u.orden_id)!,
          creado_en: u.creado_en,
        })),
      ),
      'Movimientos de salida',
    );
  }

  return {
    tecnicos: tecnicos.length,
    clientes: datos.clientes.length,
    ordenes: datos.ordenes.length,
    piezas: PIEZAS_DEMO.length,
  };
}
