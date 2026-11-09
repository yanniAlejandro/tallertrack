import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { CategoriaPieza } from '@/domain/inventario';
import type { DatosPieza } from '@/domain/esquemas';
import { limpiarBusqueda } from './clientes';

export async function listarPiezas({
  q,
  categoria,
  soloBajas,
}: {
  q?: string | undefined;
  categoria?: CategoriaPieza | undefined;
  soloBajas?: boolean | undefined;
}) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from('piezas')
    .select('*')
    .eq('activo', true)
    .order('categoria')
    .order('nombre');
  if (categoria) consulta = consulta.eq('categoria', categoria);
  const termino = limpiarBusqueda(q ?? '');
  if (termino) {
    consulta = consulta.or(
      `nombre.ilike.%${termino}%,sku.ilike.%${termino}%,compatible_con.ilike.%${termino}%`,
    );
  }
  const { data, error } = await consulta;
  if (error) throw error;
  // PostgREST no compara dos columnas entre sí: el filtro stock <= mínimo se aplica aquí.
  return soloBajas ? data.filter((p) => p.stock <= p.stock_minimo) : data;
}

export async function piezasConStockBajo() {
  return listarPiezas({ soloBajas: true });
}

/** Piezas con stock para el selector de una orden. */
export async function piezasDisponibles() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('piezas')
    .select('id, sku, nombre, categoria, stock, precio_usd, compatible_con')
    .eq('activo', true)
    .gt('stock', 0)
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function obtenerPieza(id: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('piezas').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function movimientosDePieza(id: string, limite = 30) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('movimientos_stock')
    .select(
      '*, autor:perfiles!movimientos_stock_autor_id_fkey(nombre), orden:ordenes_servicio!movimientos_stock_orden_id_fkey(id, codigo)',
    )
    .eq('pieza_id', id)
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

export async function crearPieza(datos: DatosPieza, stockInicial: number) {
  const supabase = await crearClienteServidor();
  const r = await supabase
    .from('piezas')
    .insert({ ...datos, stock: 0 })
    .select('id')
    .single();
  if (r.error || stockInicial <= 0) return r;
  const ajuste = await supabase.rpc('ajustar_stock', {
    p_pieza_id: r.data.id,
    p_delta: stockInicial,
    p_motivo: 'Stock inicial',
  });
  return ajuste.error ? { data: null, error: ajuste.error } : r;
}

export async function actualizarPieza(id: string, datos: DatosPieza) {
  const supabase = await crearClienteServidor();
  return supabase.from('piezas').update(datos).eq('id', id);
}
