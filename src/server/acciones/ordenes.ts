'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { esquemaPresupuesto } from '@/domain/esquemas';
import { actualizarOrden } from '@/server/repositorios/ordenes';
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
