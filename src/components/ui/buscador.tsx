import { Search } from 'lucide-react';

/**
 * Buscador por GET: funciona sin JavaScript y la URL se puede compartir.
 * Los filtros extra se conservan como campos ocultos.
 */
export function Buscador({
  q,
  placeholder,
  ocultos = {},
}: {
  q: string;
  placeholder: string;
  ocultos?: Record<string, string | undefined>;
}) {
  return (
    <form role="search" className="relative flex-1">
      {Object.entries(ocultos).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label htmlFor="buscar" className="sr-only">
        Buscar
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        id="buscar"
        name="q"
        type="search"
        defaultValue={q}
        placeholder={placeholder}
        className="block h-10 w-full rounded-lg border-0 bg-white pr-3 pl-9 text-base text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-marca-500 focus:outline-none sm:text-sm"
      />
    </form>
  );
}
