'use client';

import { useRef, useEffect } from 'react';
import { agregarNota } from '@/server/acciones/ordenes';
import { useAccion } from '@/components/ui/use-accion';
import { BotonEnviar } from '@/components/ui/boton-enviar';

export function FormularioNota({ ordenId }: { ordenId: string }) {
  const { estado, errores, onSubmit, pendiente } = useAccion(agregarNota);
  const form = useRef<HTMLFormElement>(null);

  // Si la nota se guardó, se limpia el campo para escribir otra.
  useEffect(() => {
    if (estado.ok && estado.mensaje) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-2" noValidate>
      <input type="hidden" name="orden_id" value={ordenId} />
      <label htmlFor="nota-texto" className="sr-only">
        Nueva nota
      </label>
      <textarea
        id="nota-texto"
        name="texto"
        rows={2}
        placeholder="Añadir una nota…"
        aria-invalid={errores?.texto ? true : undefined}
        className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-base ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-marca-500 focus:outline-none sm:text-sm"
      />
      {!estado.ok && <p className="text-sm text-red-600">{errores?.texto ?? estado.error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="visible_cliente" className="accent-marca-700" />
          Visible para el cliente
        </label>
        <BotonEnviar pendiente={pendiente} variante="secundario" tamano="sm">
          Guardar nota
        </BotonEnviar>
      </div>
    </form>
  );
}
