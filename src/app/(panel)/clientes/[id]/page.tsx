import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, Plus, ShieldCheck, Smartphone } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { BotonEnlace, BotonEnlaceExterno } from '@/components/ui/boton';
import { Vacio } from '@/components/ui/vacio';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { Monto } from '@/components/ui/monto';
import { FormularioCliente } from '@/components/clientes/formulario-cliente';
import { obtenerCliente, ordenesDeCliente } from '@/server/repositorios/clientes';
import { obtenerAjustes } from '@/server/repositorios/ajustes';
import { enlaceWhatsApp } from '@/domain/whatsapp';
import { formatearFecha, fechaDeTimestamp, hoyEnLaHabana } from '@/domain/fechas';
import { ETIQUETA_TIPO_EQUIPO } from '@/domain/esquemas';
import { esUuid } from '@/lib/uuid';

export async function generateMetadata({ params }: PageProps<'/clientes/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const c = esUuid(id) ? await obtenerCliente(id) : null;
  return { title: c?.nombre ?? 'Cliente' };
}

export default async function DetalleCliente({ params }: PageProps<'/clientes/[id]'>) {
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const [cliente, ordenes, ajustes] = await Promise.all([
    obtenerCliente(id),
    ordenesDeCliente(id),
    obtenerAjustes(),
  ]);
  if (!cliente) notFound();

  const wa = enlaceWhatsApp(
    cliente.telefono,
    `Hola, ${cliente.nombre.split(' ')[0]}. Le escribimos de ${ajustes.nombre_negocio}.`,
  );
  const hoy = hoyEnLaHabana();

  return (
    <>
      <EncabezadoPagina
        titulo={cliente.nombre}
        descripcion={[cliente.municipio, cliente.carne && `CI ${cliente.carne}`]
          .filter(Boolean)
          .join(' · ')}
        volver={<EnlaceVolver href="/clientes">Clientes</EnlaceVolver>}
        acciones={
          <>
            {wa && (
              <BotonEnlaceExterno href={wa} variante="whatsapp">
                <MessageCircle aria-hidden /> WhatsApp
              </BotonEnlaceExterno>
            )}
            <BotonEnlace href={`/ordenes/nueva?cliente=${cliente.id}`}>
              <Plus aria-hidden /> Recibir equipo
            </BotonEnlace>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {cliente.equipos.length === 0 && (
            <Tarjeta>
              <Vacio icono={<Smartphone />} titulo="Sin equipos registrados" />
            </Tarjeta>
          )}
          {cliente.equipos.map((equipo) => {
            const delEquipo = ordenes.filter((o) => o.equipo_id === equipo.id);
            return (
              <Tarjeta key={equipo.id}>
                <CabeceraTarjeta
                  titulo={`${equipo.marca} ${equipo.modelo}`}
                  descripcion={[
                    ETIQUETA_TIPO_EQUIPO[equipo.tipo],
                    equipo.color,
                    equipo.imei_serie && `IMEI/serie ${equipo.imei_serie}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
                {delEquipo.length === 0 ? (
                  <CuerpoTarjeta className="text-sm text-slate-500">Sin órdenes.</CuerpoTarjeta>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {delEquipo.map((o) => (
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
                              {o.garantia_hasta && o.garantia_hasta >= hoy && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700">
                                  <ShieldCheck className="size-3.5" aria-hidden /> Garantía hasta{' '}
                                  {formatearFecha(o.garantia_hasta)}
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-sm text-slate-600">
                              {formatearFecha(fechaDeTimestamp(o.creado_en))} · {o.falla_reportada}
                            </span>
                          </span>
                          {o.total_usd > 0 && (
                            <Monto usd={o.total_usd} tasa={o.tasa_aplicada} className="text-sm" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
            );
          })}
        </div>

        <Tarjeta className="self-start">
          <CabeceraTarjeta titulo="Datos del cliente" />
          <CuerpoTarjeta>
            <FormularioCliente cliente={cliente} />
          </CuerpoTarjeta>
        </Tarjeta>
      </div>
    </>
  );
}
