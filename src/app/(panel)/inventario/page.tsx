import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Package, Plus } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Buscador } from '@/components/ui/buscador';
import { BotonEnlace } from '@/components/ui/boton';
import { Vacio } from '@/components/ui/vacio';
import { leerTexto } from '@/components/ui/paginacion';
import { InsigniaStock } from '@/components/inventario/insignia-stock';
import { listarPiezas } from '@/server/repositorios/piezas';
import { requerirPerfil } from '@/server/sesion';
import { obtenerTasaVigente } from '@/server/repositorios/ajustes';
import { CATEGORIAS_PIEZA, ETIQUETA_CATEGORIA, type CategoriaPieza } from '@/domain/inventario';
import { formatearCup, formatearUsd, margenPorcentaje, usdACup } from '@/domain/dinero';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Inventario' };

export default async function PaginaInventario({ searchParams }: PageProps<'/inventario'>) {
  const sp = await searchParams;
  const q = leerTexto(sp.q);
  const cat = leerTexto(sp.categoria);
  const categoria = (CATEGORIAS_PIEZA as readonly string[]).includes(cat)
    ? (cat as CategoriaPieza)
    : undefined;
  const soloBajas = sp.bajas === '1';

  const [perfil, piezas, tasa] = await Promise.all([
    requerirPerfil(),
    listarPiezas({ q, categoria, soloBajas }),
    obtenerTasaVigente(),
  ]);
  const valorStock = piezas.reduce((s, p) => s + p.costo_usd * p.stock, 0);

  const href = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { q, categoria, bajas: soloBajas ? '1' : undefined, ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/inventario?${s}` : '/inventario';
  };
  const chip = (activo: boolean) =>
    cn(
      'inline-flex h-8 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap ring-1 ring-inset',
      activo
        ? 'bg-marca-700 text-white ring-marca-700'
        : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
    );

  return (
    <>
      <EncabezadoPagina
        titulo="Inventario de piezas"
        descripcion={`${piezas.length} piezas · valor al costo ${formatearUsd(valorStock)}`}
        acciones={
          perfil.rol === 'admin' && (
            <BotonEnlace href="/inventario/nueva" variante="secundario">
              <Plus aria-hidden /> Nueva pieza
            </BotonEnlace>
          )
        }
      />
      <div className="mb-3">
        <Buscador
          q={q}
          placeholder="Nombre, SKU o modelo compatible (ej. A12)"
          ocultos={{ categoria, bajas: soloBajas ? '1' : undefined }}
        />
      </div>
      <nav aria-label="Filtros" className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2 pb-1">
          <li>
            <Link href={href({ categoria: undefined })} className={chip(!categoria)}>
              Todas
            </Link>
          </li>
          {CATEGORIAS_PIEZA.map((c) => (
            <li key={c}>
              <Link href={href({ categoria: c })} className={chip(categoria === c)}>
                {ETIQUETA_CATEGORIA[c]}
              </Link>
            </li>
          ))}
          <li>
            <Link href={href({ bajas: soloBajas ? undefined : '1' })} className={chip(soloBajas)}>
              Stock bajo
            </Link>
          </li>
        </ul>
      </nav>

      <Tarjeta>
        {piezas.length === 0 ? (
          <Vacio icono={<Package />} titulo="No hay piezas con estos filtros" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {piezas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/inventario/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{p.sku}</span>
                      <InsigniaStock stock={p.stock} minimo={p.stock_minimo} />
                    </span>
                    <span className="mt-0.5 block truncate font-medium text-slate-900">
                      {p.nombre}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {ETIQUETA_CATEGORIA[p.categoria]} · {p.compatible_con}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block font-semibold text-slate-900 tabular-nums">
                      {formatearUsd(p.precio_usd)}
                    </span>
                    {tasa && (
                      <span className="block text-xs text-slate-500 tabular-nums">
                        {formatearCup(usdACup(p.precio_usd, tasa.cup_por_usd))}
                      </span>
                    )}
                    <span className="block text-xs text-emerald-700">
                      {margenPorcentaje(p.costo_usd, p.precio_usd)} % margen
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}
