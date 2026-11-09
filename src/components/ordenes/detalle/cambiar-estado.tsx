'use client';

import { useState } from 'react';
import { cambiarEstado } from '@/server/acciones/ordenes';
import { useAccion } from '@/components/ui/use-accion';
import { AreaTexto, Campo } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';
import { ETIQUETA_ESTADO, siguientesEstados, type EstadoOrden } from '@/domain/estados';
import { cn } from '@/lib/cn';

export function CambiarEstado({ ordenId, estado }: { ordenId: string; estado: EstadoOrden }) {
  const { estado: resultado, onSubmit, pendiente } = useAccion(cambiarEstado);
  const opciones = siguientesEstados(estado);
  const [elegido, setElegido] = useState<EstadoOrden | null>(opciones[0] ?? null);

  if (opciones.length === 0) {
    return <p className="text-sm text-slate-500">La orden está cerrada.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="orden_id" value={ordenId} />
      {!resultado.ok && <Aviso tipo="error">{resultado.error}</Aviso>}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Pasar a</legend>
        <div className="flex flex-wrap gap-2">
          {opciones.map((e) => (
            <label
              key={e}
              className={cn(
                'inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset',
                elegido === e
                  ? 'bg-marca-700 text-white ring-marca-700'
                  : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name="estado"
                value={e}
                checked={elegido === e}
                onChange={() => setElegido(e)}
                className="sr-only"
              />
              {ETIQUETA_ESTADO[e]}
            </label>
          ))}
        </div>
      </fieldset>
      <Campo etiqueta="Comentario" nombre="nota" opcional>
        {(p) => (
          <AreaTexto
            {...p}
            rows={2}
            placeholder={
              elegido === 'esperando_aprobacion'
                ? 'Ej. Hay que cambiar la pantalla y el flex de carga'
                : 'Ej. Se cambió la pantalla y se probó el táctil'
            }
          />
        )}
      </Campo>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="visible_cliente" defaultChecked className="accent-marca-700" />
        El cliente puede ver este comentario en su página de seguimiento
      </label>
      <BotonEnviar pendiente={pendiente} disabled={!elegido} textoCargando="Actualizando…">
        Cambiar estado
      </BotonEnviar>
    </form>
  );
}
