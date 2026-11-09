import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Aviso } from '@/components/ui/aviso';
import { BotonEnlaceExterno } from '@/components/ui/boton';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { ResumenOrden } from '@/components/ordenes/detalle/resumen-orden';
import { PresupuestoOrden } from '@/components/ordenes/detalle/presupuesto-orden';
import { CambiarEstado } from '@/components/ordenes/detalle/cambiar-estado';
import { Historial } from '@/components/ordenes/detalle/historial';
import { VerDesbloqueo } from '@/components/ordenes/detalle/ver-desbloqueo';
import { SubirFotos } from '@/components/ordenes/detalle/subir-fotos';
import { GaleriaFotos } from '@/components/ordenes/detalle/galeria-fotos';
import { BotonesTicket } from '@/components/ordenes/detalle/botones-ticket';
import { eventosDeOrden, obtenerOrden } from '@/server/repositorios/ordenes';
import { fotosDeOrden } from '@/server/repositorios/fotos';
import { listarTecnicos } from '@/server/repositorios/perfiles';
import { obtenerAjustes } from '@/server/repositorios/ajustes';
import { estaCerrada } from '@/domain/estados';
import { enlaceWhatsApp, mensajeSegunEstado } from '@/domain/whatsapp';
import { rutaEstado } from '@/domain/codigo-orden';
import { envPublico } from '@/lib/env';
import { esUuid } from '@/lib/uuid';

export async function generateMetadata({ params }: PageProps<'/ordenes/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const o = esUuid(id) ? await obtenerOrden(id) : null;
  return { title: o ? `Orden ${o.codigo}` : 'Orden' };
}

export default async function DetalleOrden({ params, searchParams }: PageProps<'/ordenes/[id]'>) {
  const [{ id }, { nueva }] = await Promise.all([params, searchParams]);
  if (!esUuid(id)) notFound();
  const [orden, eventos, fotos, tecnicos, ajustes] = await Promise.all([
    obtenerOrden(id),
    eventosDeOrden(id),
    fotosDeOrden(id),
    listarTecnicos(),
    obtenerAjustes(),
  ]);
  if (!orden) notFound();

  const cerrada = estaCerrada(orden.estado);
  const totalUsd = orden.mano_obra_usd;
  const equipo = `${orden.equipo?.marca ?? ''} ${orden.equipo?.modelo ?? ''}`.trim();
  const avisoWhatsApp = orden.cliente
    ? enlaceWhatsApp(
        orden.cliente.telefono,
        mensajeSegunEstado({
          clienteNombre: orden.cliente.nombre,
          codigo: orden.codigo,
          equipo,
          estado: orden.estado,
          totalUsd: totalUsd > 0 ? totalUsd : orden.presupuesto_usd,
          tasa: orden.tasa_aplicada,
          fechaPrometida: orden.fecha_prometida,
          garantiaHasta: orden.garantia_hasta,
          urlEstado: `${envPublico().NEXT_PUBLIC_SITE_URL}${rutaEstado(orden.codigo)}`,
          negocio: ajustes.nombre_negocio,
          direccion: ajustes.direccion,
        }),
      )
    : null;

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
        descripcion={`${equipo} · ${orden.cliente?.nombre}`}
        acciones={
          <>
            <BotonesTicket ordenId={orden.id} />
            {avisoWhatsApp && (
              <BotonEnlaceExterno href={avisoWhatsApp} variante="whatsapp">
                <MessageCircle aria-hidden /> Avisar al cliente
              </BotonEnlaceExterno>
            )}
          </>
        }
      />

      {nueva && (
        <Aviso tipo="exito" titulo="Equipo registrado" className="mb-5">
          Entregue al cliente el ticket con el código <strong>{orden.codigo}</strong> y tome fotos
          del estado físico del equipo.
        </Aviso>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <ResumenOrden orden={orden} />

          <Tarjeta>
            <CabeceraTarjeta
              titulo="Fotos"
              accion={
                !cerrada && (
                  <SubirFotos
                    ordenId={orden.id}
                    momento={orden.estado === 'recibido' ? 'recepcion' : 'reparacion'}
                  />
                )
              }
            />
            <CuerpoTarjeta>
              <GaleriaFotos ordenId={orden.id} fotos={fotos} editable={!cerrada} />
            </CuerpoTarjeta>
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta
              titulo="Historial"
              descripcion="Las notas internas no las ve el cliente."
            />
            <CuerpoTarjeta>
              <Historial ordenId={orden.id} eventos={eventos} />
            </CuerpoTarjeta>
          </Tarjeta>
        </div>

        <div className="space-y-5">
          <Tarjeta>
            <CabeceraTarjeta titulo="Estado" />
            <CuerpoTarjeta>
              <CambiarEstado key={orden.estado} ordenId={orden.id} estado={orden.estado} />
            </CuerpoTarjeta>
          </Tarjeta>

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
                editable={!cerrada}
              />
            </CuerpoTarjeta>
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta titulo="Desbloqueo" />
            <CuerpoTarjeta>
              <VerDesbloqueo ordenId={orden.id} tipo={orden.desbloqueo_tipo} />
            </CuerpoTarjeta>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
