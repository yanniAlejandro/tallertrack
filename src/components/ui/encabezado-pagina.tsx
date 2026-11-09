import type { ReactNode } from 'react';

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  volver,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  volver?: ReactNode;
}) {
  return (
    <div className="mb-5 space-y-2">
      {volver}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{titulo}</h1>
          {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  );
}
