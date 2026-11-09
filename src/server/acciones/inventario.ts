'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { esquemaPieza } from '@/domain/esquemas';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { actualizarPieza, crearPieza } from '@/server/repositorios/piezas';
import { requerirAdmin, requerirPerfil } from '@/server/sesion';
import {
  erroresDeZod,
  formAObjeto,
  mensajeErrorBD,
  type ResultadoAccion,
} from '@/server/resultado';

const esquemaUso = z.object({
  orden_id: z.uuid(),
  pieza_id: z.uuid({ error: 'Seleccione una pieza' }),
  cantidad: z.coerce.number().int().min(1, { error: 'Mínimo 1' }).max(20),
});

/** Añade una pieza a la orden y descuenta el stock (transacción en la BD). */
export async function usarPieza(_previo: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  await requerirPerfil();
  const r = esquemaUso.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise la pieza', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc('usar_pieza', {
    p_orden_id: r.data.orden_id,
    p_pieza_id: r.data.pieza_id,
    p_cantidad: r.data.cantidad,
  });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(`/ordenes/${r.data.orden_id}`);
  revalidatePath('/inventario');
  return { ok: true, mensaje: 'Pieza añadida y descontada del inventario.' };
}

export async function devolverPieza(
  ordenPiezaId: number,
  ordenId: string,
): Promise<ResultadoAccion> {
  await requerirPerfil();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc('devolver_pieza', { p_orden_pieza_id: ordenPiezaId });
  if (error) return { ok: false, error: mensajeErrorBD(error) };
  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath('/inventario');
  return { ok: true, mensaje: 'Pieza devuelta al inventario.' };
}

export async function guardarPieza(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirAdmin();
  const id = fd.get('id');
  const r = esquemaPieza.safeParse(formAObjeto(fd));
  if (!r.success)
    return { ok: false, error: 'Revise los datos de la pieza', errores: erroresDeZod(r.error) };

  if (typeof id === 'string' && id) {
    const { error } = await actualizarPieza(id, r.data);
    if (error) return { ok: false, error: mensajeErrorBD(error) };
    revalidatePath(`/inventario/${id}`);
    revalidatePath('/inventario');
    return { ok: true, mensaje: 'Pieza actualizada.' };
  }

  const stock = z.coerce
    .number()
    .int()
    .min(0)
    .max(9999)
    .safeParse(fd.get('stock') || 0);
  if (!stock.success)
    return { ok: false, error: 'Stock inicial inválido', errores: { stock: 'Número entero' } };
  const { data, error } = await crearPieza(r.data, stock.data);
  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? 'Ya existe una pieza con ese SKU.' : mensajeErrorBD(error),
    };
  }
  revalidatePath('/inventario');
  redirect(`/inventario/${data.id}`);
}

const esquemaAjuste = z.object({
  pieza_id: z.uuid(),
  delta: z.coerce
    .number({ error: 'Escriba una cantidad' })
    .int({ error: 'Número entero' })
    .refine((v) => v !== 0, { error: 'La cantidad no puede ser cero' }),
  motivo: z
    .string()
    .trim()
    .min(3, { error: 'Indique el motivo (ej. compra a proveedor)' })
    .max(200),
});

export async function ajustarStock(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await requerirAdmin();
  const r = esquemaAjuste.safeParse(formAObjeto(fd));
  if (!r.success) return { ok: false, error: 'Revise el ajuste', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc('ajustar_stock', {
    p_pieza_id: r.data.pieza_id,
    p_delta: r.data.delta,
    p_motivo: r.data.motivo,
  });
  if (error) {
    return {
      ok: false,
      error: error.code === '23514' ? 'El stock no puede quedar negativo.' : mensajeErrorBD(error),
    };
  }
  revalidatePath(`/inventario/${r.data.pieza_id}`);
  revalidatePath('/inventario');
  return { ok: true, mensaje: 'Stock actualizado.' };
}
