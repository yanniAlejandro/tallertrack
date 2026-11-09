'use client';

import { startTransition, useActionState, type FormEvent } from 'react';
import type { ResultadoAccion } from '@/server/resultado';

type Accion<T> = (previo: ResultadoAccion<T>, fd: FormData) => Promise<ResultadoAccion<T>>;

/**
 * Envía un formulario a una Server Action SIN el reseteo automático de
 * React 19 (que vacía los campos aunque la validación falle). Así, si hay
 * errores, el usuario no pierde lo que escribió.
 */
export function useAccion<T>(accion: Accion<T>) {
  const [estado, despachar, pendiente] = useActionState(accion, { ok: true } as ResultadoAccion<T>);

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => despachar(datos));
  }

  const errores = estado.ok ? undefined : estado.errores;
  return { estado, errores, onSubmit, pendiente };
}
