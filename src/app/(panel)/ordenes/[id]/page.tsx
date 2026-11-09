import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Aviso } from '@/components/ui/aviso';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { ResumenOrden } from '@/components/ordenes/detalle/resumen-orden';
import { PresupuestoOrden } from '@/components/ordenes/detalle/presupuesto-orden';
import { obtenerOrden } from '@/server/repositorios/ordenes';
import { listarTecnicos } from '@/server/repositorios/perfiles';
import { estaCerrada } from '@/domain/estados';
import { esUuid } from '@/lib/uuid';

export async function generateMetadata({ params }: PageProps<'/ordenes/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const o = esUuid(id) ? await obtenerOrden(id) : null;
  return { title: o ? `Orden ${o.codigo}` : 'Orden' };
}

export default async function DetalleOrden({ params, searchParams }: PageProps<'/ordenes/[id]'>) {
  const [{ id }, { nueva }] = await Promise.all([params, searchParams]);
  if (!esUuid(id)) notFound();
  const [orden, tecnicos] = await Promise.all([obtenerOrden(id), listarTecnicos()]);
  if (!orden) notFound();

  return (
    <>
      <EncabezadoPagina
        volver={<EnlaceVolver href="/ordenes">Órdenes</EnlaceVolver>}
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{orden.codigo}</span>
            <InsigniaEstado estado={orden.estado} />
            {orden.es_garantia && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                <ShieldCheck className="size-4" aria-hidden /> Garantía
              </span>
            )}
          </span>
        }
        descripcion={`${orden.equipo?.marca} ${orden.equipo?.modelo} · ${orden.cliente?.nombre}`}
      />

      {nueva && (
        <Aviso tipo="exito" titulo="Equipo registrado" className="mb-5">
          Entregue al cliente el ticket con el código <strong>{orden.codigo}</strong>.
        </Aviso>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <ResumenOrden orden={orden} />
        </div>
        <div className="space-y-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Presupuesto" />
            <CuerpoTarjeta>
              <PresupuestoOrden
                ordenId={orden.id}
                presupuestoUsd={orden.presupuesto_usd}
                manoObraUsd={orden.mano_obra_usd}
                piezasUsd={0}
                tasa={orden.tasa_aplicada}
                tecnicoId={orden.tecnico_id}
                fechaPrometida={orden.fecha_prometida}
                tecnicos={tecnicos}
                editable={!estaCerrada(orden.estado)}
              />
            </CuerpoTarjeta>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
