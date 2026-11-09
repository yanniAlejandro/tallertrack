/**
 * Barras horizontales de una sola serie, en CSS puro (sin librería de
 * gráficos: cero JS en el cliente). Un solo tono de marca; la identidad la
 * da la etiqueta escrita y el valor va en texto, no solo en la longitud.
 */
export interface Barra {
  etiqueta: string;
  valor: number;
  texto: string;
  detalle?: string;
}

export function Barras({ datos, resumen }: { datos: Barra[]; resumen: string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <figure>
      <figcaption className="sr-only">{resumen}</figcaption>
      <ul className="space-y-2.5">
        {datos.map((d) => (
          <li
            key={d.etiqueta}
            className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_auto]"
            title={`${d.etiqueta}: ${d.texto}${d.detalle ? ` · ${d.detalle}` : ''}`}
          >
            <span className="truncate text-slate-600">{d.etiqueta}</span>
            <span className="h-3 rounded-r bg-slate-100" aria-hidden>
              <span
                className="block h-full rounded-r bg-marca-500"
                style={{ width: `${Math.max(d.valor > 0 ? 2 : 0, (d.valor / max) * 100)}%` }}
              />
            </span>
            <span className="text-right font-medium text-slate-900 tabular-nums">{d.texto}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
