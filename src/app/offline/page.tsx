import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = { title: 'Sin conexión' };

/** Página estática que el service worker muestra cuando no hay conexión. */
export default function SinConexion() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <WifiOff className="size-10 text-slate-400" aria-hidden />
      <h1 className="mt-4 text-xl font-bold text-slate-900">No hay conexión</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Compruebe sus datos móviles o el wifi. Cuando vuelva la conexión, recargue la página; lo que
        no llegó a guardarse tendrá que enviarlo de nuevo.
      </p>
    </main>
  );
}
