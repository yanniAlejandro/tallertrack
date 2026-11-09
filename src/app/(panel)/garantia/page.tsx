import type { Metadata } from 'next';
import Link from 'next/link';
import { ScanSearch, ShieldCheck } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta, CabeceraTarjeta } from '@/components/ui/tarjeta';
import { Buscador } from '@/components/ui/buscador';
import { Vacio } from '@/components/ui/vacio';
import { leerTexto } from '@/components/ui/paginacion';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { buscarHistorialEquipo } from '@/server/repositorios/garantia';
import { situacionGarantia } from '@/domain/garantia';
import { fechaDeTimestamp, formatearFecha, hoyEnLaHabana } from '@/domain/fechas';

export const metadata: Metadata = { title: 'Garantía' };

export default async function PaginaGarantia({ searchParams }: PageProps<'/garantia'>) {
  const q = leerTexto((await searchParams).q);
  const ordenes = q ? await buscarHistorialEquipo(q) : [];
  const hoy = hoyEnLaHabana();
  const equipo = ordenes[0];

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo="Garantía"
        descripcion="Busque el equipo por IMEI, número de serie o código de una orden."
      />
      <div className="mb-5">
        <Buscador q={q} placeholder="IMEI (marque *#06#), serie o TF-2611-XXXX" />
      </div>

      {!q && (
        <Tarjeta>
          <Vacio
            icono={<ScanSearch />}
            titulo="Busque un equipo"
            descripcion="Verá todas sus reparaciones, si la garantía sigue vigente y podrá reabrir la orden sin cobrar mano de obra."
          />
        </Tarjeta>
      )}

      {q && ordenes.length === 0 && (
        <Tarjeta>
          <Vacio
            titulo="No encontramos ese equipo"
            descripcion={`No hay órdenes con el IMEI, serie o código «${q}».`}
          />
        </Tarjeta>
      )}

      {equipo && (
        <Tarjeta>
          <CabeceraTarjeta
            titulo={`${equipo.equipo_marca} ${equipo.equipo_modelo}`}
            descripcion={
              <>
                {equipo.equipo_imei && <span className="font-mono">{equipo.equipo_imei}</span>} ·{' '}
                <Link
                  href={`/clientes/${equipo.cliente_id}`}
                  className="text-marca-700 hover:underline"
                >
                  {equipo.cliente_nombre}
                </Link>
              </>
            }
          />
          <ul className="divide-y divide-slate-100">
            {ordenes.map((o) => {
              const s = situacionGarantia(o.garantia_hasta, hoy);
              return (
                <li key={o.id}>
                  <Link
                    href={`/ordenes/${o.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-marca-700">
                          {o.codigo}
                        </span>
                        <InsigniaEstado estado={o.estado} />
                        {o.es_garantia && (
                          <span className="text-xs text-slate-500">reapertura en garantía</span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-600">
                        {formatearFecha(fechaDeTimestamp(o.creado_en))} · {o.falla_reportada}
                      </span>
                    </span>
                    {s.tipo === 'vigente' ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                        <ShieldCheck className="size-4" aria-hidden /> {s.diasRestantes} días
                      </span>
                    ) : s.tipo === 'vencida' ? (
                      <span className="text-sm text-slate-400">Vencida</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
