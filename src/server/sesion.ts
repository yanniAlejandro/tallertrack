import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { PerfilRow } from '@/types/database';

/**
 * Perfil del usuario autenticado. `cache` evita repetir la consulta en
 * el mismo render (layout + página + componentes).
 */
export const obtenerPerfilActual = cache(async (): Promise<PerfilRow | null> => {
  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims.sub;
  if (!id) return null;
  const { data } = await supabase.from('perfiles').select('*').eq('id', id).maybeSingle();
  return data && data.activo ? data : null;
});

export async function requerirPerfil(): Promise<PerfilRow> {
  const perfil = await obtenerPerfilActual();
  if (!perfil) redirect('/login');
  return perfil;
}

export async function requerirAdmin(): Promise<PerfilRow> {
  const perfil = await requerirPerfil();
  if (perfil.rol !== 'admin') redirect('/?error=permiso');
  return perfil;
}

export const ETIQUETA_ROL: Record<PerfilRow['rol'], string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  recepcion: 'Recepción',
};
