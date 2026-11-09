'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { eliminarFoto } from '@/server/acciones/ordenes';

export interface Foto {
  id: number;
  url: string | null;
  momento: 'recepcion' | 'reparacion';
}

export function GaleriaFotos({
  ordenId,
  fotos,
  editable,
}: {
  ordenId: string;
  fotos: Foto[];
  editable: boolean;
}) {
  const [pendiente, iniciar] = useTransition();
  if (fotos.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay fotos del equipo.</p>;
  }
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {fotos.map((f) => (
        <li
          key={f.id}
          className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
        >
          {f.url && (
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage */}
              <img
                src={f.url}
                alt={
                  f.momento === 'recepcion' ? 'Foto al recibir el equipo' : 'Foto de la reparación'
                }
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </a>
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] text-white">
            {f.momento === 'recepcion' ? 'Recepción' : 'Reparación'}
          </span>
          {editable && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                if (confirm('¿Eliminar esta foto?'))
                  iniciar(async () => void (await eliminarFoto(f.id, ordenId)));
              }}
              aria-label="Eliminar foto"
              className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-red-600 opacity-100 shadow sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
