import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Buscador } from '@/components/ui/buscador';
import { BotonEnlace } from '@/components/ui/boton';
import { Vacio } from '@/components/ui/vacio';
import { Paginacion, leerPagina, leerTexto } from '@/components/ui/paginacion';
import { ListaOrdenes } from '@/components/ordenes/lista-ordenes';
import {
  conteoPorEstado,
  listarOrdenes,
  TAM_PAGINA_ORDENES,
  type FiltroOrdenes,
} from '@/server/repositorios/ordenes';
import { ESTADOS_ACTIVOS, ETIQUETA_ESTADO, esEstadoOrden } from '@/domain/estados';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Órdenes' };

const FILTROS_FIJOS = [
  { valor: 'activas', etiqueta: 'En el taller' },
  { valor: 'atrasadas', etiqueta: 'Atrasadas' },
  { valor: '', etiqueta: 'Todas' },
] as const;

function leerEstado(valor: string): FiltroOrdenes['estado'] {
  if (valor === 'activas' || valor === 'atrasadas') return valor;
  return esEstadoOrden(valor) ? valor : undefined;
}

export default async function PaginaOrdenes({ searchParams }: PageProps<'/ordenes'>) {
  const sp = await searchParams;
  const q = leerTexto(sp.q);
  const pagina = leerPagina(sp.pagina);
  const crudo = sp.estado === undefined ? 'activas' : leerTexto(sp.estado);
  const estado = leerEstado(crudo);

  const [{ ordenes, total }, conteo] = await Promise.all([
    listarOrdenes({ estado, q, pagina }),
    conteoPorEstado(),
  ]);

  const chips = [
    ...FILTROS_FIJOS.map((f) => ({ ...f, n: undefined as number | undefined })),
    ...[...ESTADOS_ACTIVOS, 'entregado' as const].map((e) => ({
      valor: e,
      etiqueta: ETIQUETA_ESTADO[e],
      n: conteo[e] ?? 0,
    })),
  ];

  const hrefChip = (valor: string) => {
    const p = new URLSearchParams();
    p.set('estado', valor);
    if (q) p.set('q', q);
    return `/ordenes?${p.toString()}`;
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Órdenes de servicio"
        descripcion="Busque por código, cliente, teléfono, modelo o IMEI."
        acciones={
          <BotonEnlace href="/ordenes/nueva">
            <Plus aria-hidden /> Recibir equipo
          </BotonEnlace>
        }
      />

      <div className="mb-3">
        <Buscador
          q={q}
          placeholder="Ej. TF-2611, Yanelis, A12, 3520990…"
          ocultos={{ estado: crudo }}
        />
      </div>

      <nav
        aria-label="Filtrar por estado"
        className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-2 pb-1">
          {chips.map((c) => {
            const activo = crudo === c.valor;
            return (
              <li key={c.valor || 'todas'}>
                <Link
                  href={hrefChip(c.valor)}
                  aria-current={activo ? 'true' : undefined}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap ring-1 ring-inset',
                    activo
                      ? 'bg-marca-700 text-white ring-marca-700'
                      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
                  )}
                >
                  {c.etiqueta}
                  {c.n !== undefined && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        activo ? 'text-marca-100' : 'text-slate-400',
                      )}
                    >
                      {c.n}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Tarjeta>
        {ordenes.length === 0 ? (
          <Vacio
            icono={<ClipboardList />}
            titulo="No hay órdenes con estos filtros"
            descripcion={q ? `Pruebe con otra búsqueda distinta de «${q}».` : undefined}
          />
        ) : (
          <ListaOrdenes ordenes={ordenes} />
        )}
        <Paginacion
          pagina={pagina}
          total={total}
          tamano={TAM_PAGINA_ORDENES}
          ruta="/ordenes"
          params={{ q, estado: crudo }}
        />
      </Tarjeta>
    </>
  );
}
