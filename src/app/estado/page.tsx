import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Search, Wrench } from 'lucide-react';
import { normalizarCodigo } from '@/domain/codigo-orden';
import { Aviso } from '@/components/ui/aviso';

export const metadata: Metadata = {
  title: 'Estado de su reparación',
  robots: { index: false },
};

export default async function ConsultarEstado({ searchParams }: PageProps<'/estado'>) {
  const { codigo } = await searchParams;
  const texto = typeof codigo === 'string' ? codigo : '';
  if (texto) {
    const normal = normalizarCodigo(texto);
    if (normal) redirect(`/estado/${normal}`);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-marca-700 text-white">
            <Wrench className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-bold text-slate-900">¿Cómo va su reparación?</h1>
          <p className="mt-1 text-sm text-slate-600">
            Escriba el código que aparece en su ticket de recepción.
          </p>
        </div>
        <form className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {texto && (
            <Aviso tipo="error">
              El código «{texto}» no es válido. Tiene la forma TF-2611-7K4Q.
            </Aviso>
          )}
          <label htmlFor="codigo" className="block text-sm font-medium text-slate-700">
            Código de la orden
          </label>
          <input
            id="codigo"
            name="codigo"
            defaultValue={texto}
            placeholder="TF-2611-7K4Q"
            autoCapitalize="characters"
            autoComplete="off"
            required
            className="block h-12 w-full rounded-lg border-0 px-3 text-center font-mono text-lg tracking-wider uppercase ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-marca-500 focus:outline-none"
          />
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-marca-700 font-semibold text-white hover:bg-marca-800">
            <Search className="size-4" aria-hidden /> Consultar
          </button>
        </form>
      </div>
    </main>
  );
}
