import type { Metadata } from 'next';
import { Wrench } from 'lucide-react';
import { FormularioLogin } from './formulario-login';
import { esModoDemo } from '@/lib/env';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function PaginaLogin({ searchParams }: PageProps<'/login'>) {
  const { volver } = await searchParams;
  const demo = esModoDemo();

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-marca-800 to-marca-950 px-4 py-10">
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="mb-8 text-center text-white">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-white/15">
            <Wrench className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold">TallerTrack</h1>
          <p className="mt-1 text-sm text-marca-200">TecnoFix · Reparación de celulares, Cerro</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Entrar al panel del taller</h2>
          <FormularioLogin volver={typeof volver === 'string' ? volver : undefined} demo={demo} />
        </div>

        <p className="mt-6 text-center text-sm text-marca-200">
          ¿Es cliente? Consulte el estado de su equipo en{' '}
          <a href="/estado" className="font-medium text-white underline underline-offset-2">
            /estado
          </a>
          .
        </p>
      </div>
    </main>
  );
}
