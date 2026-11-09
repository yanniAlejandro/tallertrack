'use server';

import { revalidatePath } from 'next/cache';
import { esquemaAjustes, esquemaTasa } from '@/domain/esquemas';
import { esModoDemo, envServidor } from '@/lib/env';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { sembrarDemo } from '@/seed/sembrar';
import { requerirAdmin } from '@/server/sesion';
import {
  erroresDeZod,
  formAObjeto,
  mensajeErrorBD,
  type ResultadoAccion,
} from '@/server/resultado';

/** Registra una nueva tasa (se guarda historial con fecha y autor). */
export async function registrarTasa(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const perfil = await requerirAdmin();
  const r = esquemaTasa.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Tasa inválida', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from('tasas_cambio')
    .insert({ cup_por_usd: r.data.cup_por_usd, creado_por: perfil.id });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath('/', 'layout');
  return { ok: true, mensaje: `Tasa actualizada a ${r.data.cup_por_usd} CUP por USD.` };
}

export async function guardarAjustes(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirAdmin();
  const r = esquemaAjustes.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise los datos', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from('ajustes').update(r.data).eq('id', 1);
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath('/', 'layout');
  return { ok: true, mensaje: 'Datos del negocio guardados.' };
}

export async function restablecerDemo(): Promise<ResultadoAccion> {
  await requerirAdmin();
  if (!esModoDemo()) return { ok: false, error: 'El modo demo está desactivado.' };
  try {
    const r = await sembrarDemo(crearClienteAdmin(), {
      claveCifrado: Buffer.from(envServidor().DEVICE_SECRET_KEY, 'hex'),
    });
    revalidatePath('/', 'layout');
    return {
      ok: true,
      mensaje: `Demo restablecida: ${r.ordenes} órdenes, ${r.clientes} clientes y ${r.piezas} piezas.`,
    };
  } catch (e) {
    console.error('[demo]', e);
    return {
      ok: false,
      error: 'No se pudo restablecer la demo. Revise la configuración del servidor.',
    };
  }
}
