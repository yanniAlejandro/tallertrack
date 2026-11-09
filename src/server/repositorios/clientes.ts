import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { DatosCliente, DatosEquipo } from '@/domain/esquemas';

export const TAM_PAGINA = 20;

/** Escapa los comodines de LIKE y las comas que rompen el filtro `or` de PostgREST. */
export function limpiarBusqueda(q: string): string {
  return q
    .trim()
    .replace(/[%_,()\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 60);
}

export async function buscarClientes({ q = '', pagina = 1 }: { q?: string; pagina?: number }) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from('clientes')
    .select('id, nombre, telefono, carne, municipio, creado_en, equipos(count)', { count: 'exact' })
    .order('nombre')
    .range((pagina - 1) * TAM_PAGINA, pagina * TAM_PAGINA - 1);

  const termino = limpiarBusqueda(q);
  if (termino) {
    const soloDigitos = termino.replace(/\D/g, '');
    consulta =
      soloDigitos.length >= 4
        ? consulta.or(`telefono.ilike.%${soloDigitos}%,carne.ilike.%${soloDigitos}%`)
        : consulta.ilike('nombre', `%${termino}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw error;
  return { clientes: data, total: count ?? 0 };
}

export async function obtenerCliente(id: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('clientes')
    .select('*, equipos(*)')
    .eq('id', id)
    .order('creado_en', { referencedTable: 'equipos', ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ordenesDeCliente(clienteId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('v_ordenes')
    .select(
      'id, codigo, estado, equipo_id, equipo_marca, equipo_modelo, falla_reportada, total_usd, tasa_aplicada, creado_en, es_garantia, garantia_hasta',
    )
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearCliente(datos: DatosCliente) {
  const supabase = await crearClienteServidor();
  return supabase.from('clientes').insert(datos).select('id').single();
}

export async function actualizarCliente(id: string, datos: DatosCliente) {
  const supabase = await crearClienteServidor();
  return supabase.from('clientes').update(datos).eq('id', id);
}

export async function crearEquipo(clienteId: string, datos: DatosEquipo) {
  const supabase = await crearClienteServidor();
  return supabase
    .from('equipos')
    .insert({ ...datos, cliente_id: clienteId })
    .select('id')
    .single();
}
