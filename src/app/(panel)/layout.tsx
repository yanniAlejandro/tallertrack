import Link from 'next/link';
import { LogOut, Wrench } from 'lucide-react';
import { BarraInferior, MenuLateral } from '@/components/panel/navegacion';
import { requerirPerfil, ETIQUETA_ROL } from '@/server/sesion';
import { obtenerAjustes, obtenerTasaVigente } from '@/server/repositorios/ajustes';
import { cerrarSesion } from '@/server/acciones/auth';
import { formatearCup } from '@/domain/dinero';
import { esModoDemo } from '@/lib/env';

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const [perfil, ajustes, tasa] = await Promise.all([
    requerirPerfil(),
    obtenerAjustes(),
    obtenerTasaVigente(),
  ]);
  const esAdmin = perfil.rol === 'admin';

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Menú lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-marca-800 px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 text-white">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Wrench className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold">TallerTrack</span>
            <span className="block text-xs text-marca-200">{ajustes.nombre_negocio}</span>
          </span>
        </Link>
        <MenuLateral esAdmin={esAdmin} />
        <div className="mt-auto space-y-3 border-t border-white/10 px-2 pt-4 text-sm">
          <p className="text-marca-100">
            <span className="block font-medium text-white">{perfil.nombre}</span>
            {ETIQUETA_ROL[perfil.rol]}
          </p>
          <form action={cerrarSesion}>
            <button className="flex items-center gap-2 text-marca-200 hover:text-white">
              <LogOut className="size-4" aria-hidden /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-marca-700 lg:hidden">
            <Wrench className="size-5" aria-hidden /> TallerTrack
          </Link>
          <div className="hidden text-sm text-slate-500 lg:block">
            {ajustes.nombre_negocio} · {ajustes.direccion.split(',').slice(-2).join(',').trim()}
          </div>
          <div className="flex items-center gap-2">
            {esModoDemo() && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                DEMO
              </span>
            )}
            <Link
              href="/ajustes#tasa"
              title="Tasa de cambio vigente"
              className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-medium text-marca-800 ring-1 ring-marca-200 ring-inset hover:bg-marca-100"
            >
              1 USD = {tasa ? formatearCup(tasa.cup_por_usd) : 'sin tasa'}
            </Link>
            <form action={cerrarSesion} className="lg:hidden">
              <button
                aria-label="Cerrar sesión"
                className="p-1.5 text-slate-500 hover:text-slate-800"
              >
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <BarraInferior />
    </div>
  );
}
