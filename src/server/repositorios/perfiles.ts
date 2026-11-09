import 'server-only';
import { cache } from 'react';
import { crearClienteServidor } from '@/lib/supabase/servidor';

/** Personal que puede tener órdenes asignadas (técnicos y admin). */
export const listarTecnicos = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, telefono, activo')
    .in('rol', ['tecnico', 'admin'])
    .order('rol', { ascending: false })
    .order('nombre');
  if (error) throw error;
  return data;
});

export async function listarPersonal() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('perfiles').select('*').order('nombre');
  if (error) throw error;
  return data;
}
