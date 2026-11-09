import { Esqueleto, EsqueletoLista } from '@/components/ui/esqueleto';

/** Se muestra al instante mientras el servidor prepara la página (conexiones lentas). */
export default function Cargando() {
  return (
    <div aria-busy="true">
      <Esqueleto className="mb-2 h-7 w-56" />
      <Esqueleto className="mb-6 h-4 w-80 max-w-full" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <EsqueletoLista filas={6} />
      </div>
    </div>
  );
}
