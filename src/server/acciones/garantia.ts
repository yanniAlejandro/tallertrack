'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { esquemaReapertura } from '@/domain/esquemas';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { requerirPerfil } from '@/server/sesion';
import {
  erroresDeZod,
  formAObjeto,
  mensajeErrorBD,
  type ResultadoAccion,
} from '@/server/resultado';

export async function reabrirEnGarantia(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirPerfil();
  const r = esquemaReapertura.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise los datos', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc('reabrir_en_garantia', {
    p_orden_id: r.data.orden_id,
    p_falla: r.data.falla,
  });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(`/ordenes/${r.data.orden_id}`);
  revalidatePath('/ordenes');
  redirect(`/ordenes/${data.id}?nueva=1`);
}
