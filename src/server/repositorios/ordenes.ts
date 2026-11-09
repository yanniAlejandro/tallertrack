import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { ESTADOS_ACTIVOS, type EstadoOrden } from '@/domain/estados';
import { hoyEnLaHabana } from '@/domain/fechas';
import type { Database } from '@/types/database';
import { limpiarBusqueda } from './clientes';

export const TAM_PAGINA_ORDENES = 20;

type InsertOrden = Database['public']['Tables']['ordenes_servicio']['Insert'];

export interface FiltroOrdenes {
  estado?: EstadoOrden | 'activas' | 'atrasadas' | undefined;
  q?: string | undefined;
  tecnicoId?: string | undefined;
  pagina?: number | undefined;
}

export async function listarOrdenes({ estado, q, tecnicoId, pagina = 1 }: FiltroOrdenes) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from('v_ordenes')
    .select(
      'id, codigo, estado, es_garantia, cliente_nombre, cliente_telefono, equipo_tipo, equipo_marca, equipo_modelo, falla_reportada, tecnico_nombre, fecha_prometida, total_usd, presupuesto_usd, tasa_aplicada, creado_en',
      { count: 'exact' },
    )
    .order('creado_en', { ascending: false })
    .range((pagina - 1) * TAM_PAGINA_ORDENES, pagina * TAM_PAGINA_ORDENES - 1);

  if (estado === 'activas') {
    consulta = consulta.in('estado', [...ESTADOS_ACTIVOS]);
  } else if (estado === 'atrasadas') {
    consulta = consulta
      .in(
        'estado',
        [...ESTADOS_ACTIVOS].filter((e) => e !== 'listo'),
      )
      .lt('fecha_prometida', hoyEnLaHabana());
  } else if (estado) {
    consulta = consulta.eq('estado', estado);
  }
  if (tecnicoId) consulta = consulta.eq('tecnico_id', tecnicoId);

  const termino = limpiarBusqueda(q ?? '').toLowerCase();
  if (termino) {
    for (const palabra of termino.split(' ')) {
      consulta = consulta.ilike('busqueda', `%${palabra}%`);
    }
  }

  const { data, error, count } = await consulta;
  if (error) throw error;
  return { ordenes: data, total: count ?? 0 };
}

export type OrdenListada = Awaited<ReturnType<typeof listarOrdenes>>['ordenes'][number];

export async function conteoPorEstado() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('v_ordenes_por_estado').select('*');
  if (error) throw error;
  const conteo = Object.fromEntries(data.map((f) => [f.estado, f.cantidad])) as Partial<
    Record<EstadoOrden, number>
  >;
  return conteo;
}

export async function obtenerOrden(id: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('ordenes_servicio')
    .select(
      `*,
       cliente:clientes!ordenes_servicio_cliente_id_fkey(id, nombre, telefono, carne, municipio),
       equipo:equipos!ordenes_servicio_equipo_id_fkey(id, tipo, marca, modelo, imei_serie, color),
       tecnico:perfiles!ordenes_servicio_tecnico_id_fkey(id, nombre),
       recibido_por:perfiles!ordenes_servicio_creado_por_fkey(nombre)`,
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type OrdenDetalle = NonNullable<Awaited<ReturnType<typeof obtenerOrden>>>;

export async function obtenerOrdenPorCodigo(codigo: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from('ordenes_servicio')
    .select('id')
    .eq('codigo', codigo)
    .maybeSingle();
  return data;
}

export async function eventosDeOrden(ordenId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('orden_eventos')
    .select('*, autor:perfiles!orden_eventos_autor_id_fkey(nombre)')
    .eq('orden_id', ordenId)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data;
}

export async function piezasDeOrden(ordenId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('orden_piezas')
    .select('*, pieza:piezas!orden_piezas_pieza_id_fkey(sku, nombre, categoria)')
    .eq('orden_id', ordenId)
    .order('creado_en');
  if (error) throw error;
  return data;
}

/** Órdenes relacionadas por garantía (la original y sus reaperturas). */
export async function ordenesRelacionadas(orden: { id: string; orden_padre_id: string | null }) {
  const supabase = await crearClienteServidor();
  const filtro = orden.orden_padre_id
    ? `id.eq.${orden.orden_padre_id},orden_padre_id.eq.${orden.orden_padre_id}`
    : `orden_padre_id.eq.${orden.id}`;
  const { data, error } = await supabase
    .from('ordenes_servicio')
    .select('id, codigo, estado, es_garantia, creado_en')
    .or(filtro)
    .neq('id', orden.id)
    .order('creado_en');
  if (error) throw error;
  return data;
}

export async function insertarOrden(datos: InsertOrden) {
  const supabase = await crearClienteServidor();
  return supabase.from('ordenes_servicio').insert(datos).select('id, codigo').single();
}

export async function actualizarOrden(
  id: string,
  cambios: Database['public']['Tables']['ordenes_servicio']['Update'],
) {
  const supabase = await crearClienteServidor();
  return supabase.from('ordenes_servicio').update(cambios).eq('id', id);
}

/** Órdenes activas cuya fecha prometida ya pasó (sin contar las que están listas). */
export async function contarAtrasadas(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase
    .from('ordenes_servicio')
    .select('id', { count: 'exact', head: true })
    .in(
      'estado',
      ESTADOS_ACTIVOS.filter((e) => e !== 'listo'),
    )
    .lt('fecha_prometida', hoyEnLaHabana());
  if (error) throw error;
  return count ?? 0;
}

/** Resumen para el tablero de inicio. */
export async function resumenTablero() {
  const supabase = await crearClienteServidor();
  const hoy = hoyEnLaHabana();
  const columnas =
    'id, codigo, estado, cliente_nombre, cliente_telefono, equipo_marca, equipo_modelo, fecha_prometida, tecnico_nombre, total_usd, presupuesto_usd, tasa_aplicada, es_garantia, creado_en';

  const [paraHoy, listas, recientes] = await Promise.all([
    supabase
      .from('v_ordenes')
      .select(columnas)
      .in(
        'estado',
        [...ESTADOS_ACTIVOS].filter((e) => e !== 'listo'),
      )
      .lte('fecha_prometida', hoy)
      .order('fecha_prometida')
      .limit(8),
    supabase
      .from('v_ordenes')
      .select(columnas)
      .eq('estado', 'listo')
      .order('actualizado_en', { ascending: false })
      .limit(8),
    supabase.from('v_ordenes').select(columnas).order('creado_en', { ascending: false }).limit(5),
  ]);

  for (const r of [paraHoy, listas, recientes]) if (r.error) throw r.error;
  return {
    paraHoy: paraHoy.data ?? [],
    listas: listas.data ?? [],
    recientes: recientes.data ?? [],
  };
}
