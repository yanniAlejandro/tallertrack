'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Boton } from '@/components/ui/boton';

/** Error inesperado al cargar una página del panel (p. ej. se cayó la conexión). */
export default function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <AlertTriangle className="size-10 text-amber-500" aria-hidden />
      <h1 className="mt-4 text-lg font-semibold text-slate-900">No se pudo cargar esta página</h1>
      <p className="mt-2 text-sm text-slate-600">
        Puede ser un problema momentáneo de conexión. Compruebe sus datos o el wifi e inténtelo de
        nuevo.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Ref. {error.digest}</p>}
      <Boton className="mt-5" onClick={reset}>
        <RotateCcw aria-hidden /> Reintentar
      </Boton>
    </div>
  );
}
