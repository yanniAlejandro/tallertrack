import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export async function datosReportes(desdeMes: string) {
  const supabase = await crearClienteServidor();
  const [porEstado, ingresos, piezas, tecnicos] = await Promise.all([
    supabase.from('v_ordenes_por_estado').select('*'),
    supabase.from('v_ingresos_mensuales').select('*').gte('mes', desdeMes).order('mes'),
    supabase.from('v_ganancia_piezas').select('*').order('ganancia_usd', { ascending: false }),
    supabase.from('v_rendimiento_tecnicos').select('*').order('entregadas', { ascending: false }),
  ]);
  for (const r of [porEstado, ingresos, piezas, tecnicos]) if (r.error) throw r.error;
  return {
    porEstado: porEstado.data ?? [],
    ingresos: ingresos.data ?? [],
    piezas: piezas.data ?? [],
    tecnicos: tecnicos.data ?? [],
  };
}
