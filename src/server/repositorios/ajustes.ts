import 'server-only';
import { cache } from 'react';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { AjustesRow, TasaCambioRow } from '@/types/database';

const AJUSTES_POR_DEFECTO: AjustesRow = {
  id: 1,
  nombre_negocio: 'TecnoFix',
  direccion: 'Calzada del Cerro 1520, Cerro, La Habana',
  whatsapp: '52345678',
  dias_garantia_default: 30,
  pie_ticket: '',
  actualizado_en: new Date(0).toISOString(),
};

/** Tasa de respaldo si aún no se ha registrado ninguna (solo para no romper la UI). */
export const TASA_RESPALDO = 360;

export const obtenerAjustes = cache(async (): Promise<AjustesRow> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from('ajustes').select('*').eq('id', 1).maybeSingle();
  return data ?? AJUSTES_POR_DEFECTO;
});

export const obtenerTasaVigente = cache(async (): Promise<TasaCambioRow | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from('tasas_cambio')
    .select('*')
    .order('vigente_desde', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
});

export async function valorTasaVigente(): Promise<number> {
  return (await obtenerTasaVigente())?.cup_por_usd ?? TASA_RESPALDO;
}

export async function historialTasas(limite = 10) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('tasas_cambio')
    .select('id, cup_por_usd, vigente_desde, autor:perfiles!tasas_cambio_creado_por_fkey(nombre)')
    .order('vigente_desde', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}
