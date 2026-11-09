import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Paginación por URL (?pagina=N) conservando el resto de filtros. */
export function Paginacion({
  pagina,
  total,
  tamano,
  ruta,
  params,
}: {
  pagina: number;
  total: number;
  tamano: number;
  ruta: string;
  params: Record<string, string | undefined>;
}) {
  const paginas = Math.max(1, Math.ceil(total / tamano));
  if (paginas <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set('pagina', String(p));
    const qs = sp.toString();
    return qs ? `${ruta}?${qs}` : ruta;
  };
  const clase =
    'inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium ring-1 ring-slate-300 ring-inset hover:bg-slate-50';
  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:px-5"
    >
      <span className="text-slate-500">
        Página {pagina} de {paginas} · {total} resultados
      </span>
      <span className="flex gap-2">
        {pagina > 1 && (
          <Link href={href(pagina - 1)} className={clase} rel="prev">
            <ChevronLeft className="size-4" aria-hidden /> Anterior
          </Link>
        )}
        {pagina < paginas && (
          <Link href={href(pagina + 1)} className={clase} rel="next">
            Siguiente <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </span>
    </nav>
  );
}

export function leerPagina(valor: string | string[] | undefined): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function leerTexto(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim().slice(0, 80) ?? '';
}
