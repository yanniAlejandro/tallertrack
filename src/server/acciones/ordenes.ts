'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { esquemaCambioEstado, esquemaNota, esquemaPresupuesto } from '@/domain/esquemas';
import { estaCerrada } from '@/domain/estados';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { descifrarDesbloqueo } from '@/server/cripto';
import { actualizarOrden } from '@/server/repositorios/ordenes';
import { BUCKET_FOTOS } from '@/server/repositorios/fotos';
import { recibirEquipo } from '@/server/servicios/ordenes';
import { requerirPerfil } from '@/server/sesion';
import {
  erroresDeZod,
  formAObjeto,
  mensajeErrorBD,
  type ResultadoAccion,
} from '@/server/resultado';

const rutaOrden = (id: string) => `/ordenes/${id}`;

export async function crearOrden(_previo: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const perfil = await requerirPerfil();
  const r = await recibirEquipo(formAObjeto(fd), perfil.id);
  if (!r.ok) return r;
  revalidatePath('/ordenes');
  revalidatePath('/');
  redirect(`${rutaOrden(r.id)}?nueva=1`);
}

export async function cambiarEstado(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirPerfil();
  const r = esquemaCambioEstado.safeParse(formAObjeto(fd));
  if (!r.success)
    return { ok: false, error: 'Seleccione un estado válido', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc('cambiar_estado', {
    p_orden_id: r.data.orden_id,
    p_estado: r.data.estado,
    p_nota: r.data.nota || null,
    p_visible_cliente: r.data.visible_cliente,
  });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(rutaOrden(r.data.orden_id));
  revalidatePath('/ordenes');
  return { ok: true, mensaje: 'Estado actualizado.' };
}

export async function agregarNota(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const perfil = await requerirPerfil();
  const r = esquemaNota.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise la nota', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from('orden_eventos').insert({
    orden_id: r.data.orden_id,
    tipo: 'nota',
    texto: r.data.texto,
    visible_cliente: r.data.visible_cliente,
    autor_id: perfil.id,
  });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(rutaOrden(r.data.orden_id));
  return { ok: true, mensaje: 'Nota añadida.' };
}

export async function actualizarPresupuesto(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirPerfil();
  const r = esquemaPresupuesto.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise los datos', errores: erroresDeZod(r.error) };
  const { orden_id, ...cambios } = r.data;
  const { error } = await actualizarOrden(orden_id, cambios);
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(rutaOrden(orden_id));
  return { ok: true, mensaje: 'Orden actualizada.' };
}

/** Descifra el PIN/patrón bajo demanda; nunca se envía al navegador sin pedirlo. */
export async function verDesbloqueo(ordenId: string): Promise<ResultadoAccion<string>> {
  await requerirPerfil();
  if (!z.uuid().safeParse(ordenId).success) return { ok: false, error: 'Orden inválida' };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('ordenes_servicio')
    .select('desbloqueo_cifrado, estado')
    .eq('id', ordenId)
    .single();
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  if (!data.desbloqueo_cifrado)
    return { ok: false, error: 'Esta orden no tiene datos de desbloqueo.' };
  if (estaCerrada(data.estado)) {
    return { ok: false, error: 'Por seguridad, el dato no se muestra en órdenes cerradas.' };
  }
  try {
    return { ok: true, datos: descifrarDesbloqueo(data.desbloqueo_cifrado) };
  } catch {
    return {
      ok: false,
      error: 'No se pudo descifrar el dato (¿cambió la clave DEVICE_SECRET_KEY?).',
    };
  }
}

const esquemaFoto = z.object({
  orden_id: z.uuid(),
  ruta: z.string().regex(/^ordenes\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/),
  momento: z.enum(['recepcion', 'reparacion']),
});

/** Registra en la BD una foto que el navegador ya subió a Storage. */
export async function registrarFoto(datos: z.input<typeof esquemaFoto>): Promise<ResultadoAccion> {
  await requerirPerfil();
  const r = esquemaFoto.safeParse(datos);
  if (!r.success || !r.data.ruta.includes(r.data.orden_id))
    return { ok: false, error: 'Foto inválida' };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from('orden_fotos').insert({
    orden_id: r.data.orden_id,
    ruta_storage: r.data.ruta,
    momento: r.data.momento,
  });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(rutaOrden(r.data.orden_id));
  return { ok: true };
}

export async function eliminarFoto(fotoId: number, ordenId: string): Promise<ResultadoAccion> {
  await requerirPerfil();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('orden_fotos')
    .delete()
    .eq('id', fotoId)
    .eq('orden_id', ordenId)
    .select('ruta_storage')
    .single();
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  await supabase.storage.from(BUCKET_FOTOS).remove([data.ruta_storage]);
  revalidatePath(rutaOrden(ordenId));
  return { ok: true };
}
