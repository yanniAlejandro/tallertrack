import { cn } from '@/lib/cn';

export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-slate-200/80', className)} />;
}

/** Filas de carga para listas mientras llega la información. */
export function EsqueletoLista({ filas = 6 }: { filas?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="divide-y divide-slate-100">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Esqueleto className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-3.5 w-2/5" />
            <Esqueleto className="h-3 w-3/5" />
          </div>
          <Esqueleto className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
