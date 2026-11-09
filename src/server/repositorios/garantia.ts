import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { normalizarImei } from '@/domain/garantia';
import { normalizarCodigo } from '@/domain/codigo-orden';

/**
 * Busca el historial de un equipo por IMEI/serie (o por el código de
 * cualquiera de sus órdenes) para revisar su garantía.
 */
export async function buscarHistorialEquipo(termino: string) {
  const supabase = await crearClienteServidor();
  const codigo = normalizarCodigo(termino);
  let imei = normalizarImei(termino);

  if (codigo) {
    const { data } = await supabase
      .from('v_ordenes')
      .select('equipo_imei, equipo_id')
      .eq('codigo', codigo)
      .maybeSingle();
    if (!data) return [];
    if (!data.equipo_imei) {
      return listar(supabase.from('v_ordenes').select(COLUMNAS).eq('equipo_id', data.equipo_id));
    }
    imei = data.equipo_imei;
  }
  if (imei.length < 6) return [];
  return listar(supabase.from('v_ordenes').select(COLUMNAS).eq('equipo_imei', imei));
}

const COLUMNAS =
  'id, codigo, estado, es_garantia, orden_padre_id, cliente_id, cliente_nombre, cliente_telefono, equipo_marca, equipo_modelo, equipo_imei, falla_reportada, tecnico_nombre, total_usd, tasa_aplicada, entregada_en, garantia_hasta, creado_en';

async function listar<T>(consulta: PromiseLike<{ data: T[] | null; error: unknown }>) {
  const { data, error } = await consulta;
  if (error) throw error;
  return data ?? [];
}

/** ¿La orden ya tiene una reapertura en garantía sin cerrar? */
export async function tieneGarantiaAbierta(ordenId: string): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from('ordenes_servicio')
    .select('id', { count: 'exact', head: true })
    .eq('orden_padre_id', ordenId)
    .not('estado', 'in', '(entregado,cancelado,no_reparable)');
  return (count ?? 0) > 0;
}
