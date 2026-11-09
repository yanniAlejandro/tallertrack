'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { esquemaCliente } from '@/domain/esquemas';
import { actualizarCliente, crearCliente } from '@/server/repositorios/clientes';
import { requerirPerfil } from '@/server/sesion';
import {
  erroresDeZod,
  formAObjeto,
  mensajeErrorBD,
  type ResultadoAccion,
} from '@/server/resultado';

export async function guardarCliente(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirPerfil();
  const id = fd.get('id');
  const r = esquemaCliente.safeParse(formAObjeto(fd));
  if (!r.success)
    return { ok: false, error: 'Revise los datos del cliente', errores: erroresDeZod(r.error) };

  if (typeof id === 'string' && id) {
    const { error } = await actualizarCliente(id, r.data);
    if (error) return { ok: false, error: mensajeErrorBD(error) };
    revalidatePath(`/clientes/${id}`);
    return { ok: true, mensaje: 'Datos del cliente actualizados.' };
  }

  const { data, error } = await crearCliente(r.data);
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath('/clientes');
  redirect(`/clientes/${data.id}`);
}
