import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Vacio } from '@/components/ui/vacio';
import { InsigniaStock } from '@/components/inventario/insignia-stock';
import { FormularioPieza } from '@/components/inventario/formulario-pieza';
import { FormularioAjuste } from '@/components/inventario/formulario-ajuste';
import { movimientosDePieza, obtenerPieza } from '@/server/repositorios/piezas';
import { requerirPerfil } from '@/server/sesion';
import { ETIQUETA_CATEGORIA } from '@/domain/inventario';
import { formatearUsd, margenPorcentaje } from '@/domain/dinero';
import { formatearFechaHora } from '@/domain/fechas';
import { esUuid } from '@/lib/uuid';
import { cn } from '@/lib/cn';

export async function generateMetadata({
  params,
}: PageProps<'/inventario/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const p = esUuid(id) ? await obtenerPieza(id) : null;
  return { title: p?.nombre ?? 'Pieza' };
}

export default async function DetallePieza({ params }: PageProps<'/inventario/[id]'>) {
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const [perfil, pieza, movimientos] = await Promise.all([
    requerirPerfil(),
    obtenerPieza(id),
    movimientosDePieza(id),
  ]);
  if (!pieza) notFound();
  const esAdmin = perfil.rol === 'admin';

  return (
    <>
      <EncabezadoPagina
        volver={<EnlaceVolver href="/inventario">Inventario</EnlaceVolver>}
        titulo={pieza.nombre}
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{pieza.sku}</span> · {ETIQUETA_CATEGORIA[pieza.categoria]}
            <InsigniaStock stock={pieza.stock} minimo={pieza.stock_minimo} />
          </span>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Movimientos de stock" descripcion="Últimos 30" />
            {movimientos.length === 0 ? (
              <Vacio titulo="Sin movimientos" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {movimientos.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-slate-900">
                        {m.orden ? (
                          <Link
                            href={`/ordenes/${m.orden.id}`}
                            className="text-marca-700 hover:underline"
                          >
                            {m.motivo}
                          </Link>
                        ) : (
                          m.motivo
                        )}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatearFechaHora(m.creado_en)}
                        {m.autor && ` · ${m.autor.nombre.split(' ')[0]}`}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        m.cantidad > 0 ? 'text-emerald-700' : 'text-red-600',
                      )}
                    >
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Precio" />
            <CuerpoTarjeta className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-slate-500">Costo</p>
                <p className="font-semibold">{formatearUsd(pieza.costo_usd)}</p>
              </div>
              <div>
                <p className="text-slate-500">Venta</p>
                <p className="font-semibold">{formatearUsd(pieza.precio_usd)}</p>
              </div>
              <div>
                <p className="text-slate-500">Margen</p>
                <p className="font-semibold text-emerald-700">
                  {margenPorcentaje(pieza.costo_usd, pieza.precio_usd)} %
                </p>
              </div>
            </CuerpoTarjeta>
          </Tarjeta>
          {esAdmin && (
            <>
              <Tarjeta>
                <CabeceraTarjeta titulo="Entrada o ajuste de stock" />
                <CuerpoTarjeta>
                  <FormularioAjuste piezaId={pieza.id} />
                </CuerpoTarjeta>
              </Tarjeta>
              <Tarjeta>
                <CabeceraTarjeta titulo="Editar pieza" />
                <CuerpoTarjeta>
                  <FormularioPieza pieza={pieza} />
                </CuerpoTarjeta>
              </Tarjeta>
            </>
          )}
        </div>
      </div>
    </>
  );
}
