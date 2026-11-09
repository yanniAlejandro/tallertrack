import type { Metadata } from 'next';
import Link from 'next/link';
import { UserCheck } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Buscador } from '@/components/ui/buscador';
import { leerTexto } from '@/components/ui/paginacion';
import { FormularioRecepcion } from '@/components/ordenes/formulario-recepcion';
import { buscarClientes, obtenerCliente } from '@/server/repositorios/clientes';
import { listarTecnicos } from '@/server/repositorios/perfiles';
import { obtenerAjustes, valorTasaVigente } from '@/server/repositorios/ajustes';
import { hoyEnLaHabana, sumarDias } from '@/domain/fechas';
import { esUuid } from '@/lib/uuid';

export const metadata: Metadata = { title: 'Recibir equipo' };

export default async function NuevaOrden({ searchParams }: PageProps<'/ordenes/nueva'>) {
  const sp = await searchParams;
  const idCliente = leerTexto(sp.cliente);
  const q = leerTexto(sp.q);

  const [cliente, tecnicos, tasa, ajustes, coincidencias] = await Promise.all([
    esUuid(idCliente) ? obtenerCliente(idCliente) : null,
    listarTecnicos(),
    valorTasaVigente(),
    obtenerAjustes(),
    q ? buscarClientes({ q }) : null,
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo="Recibir equipo"
        descripcion="Registre el equipo y entregue el ticket con el código de seguimiento."
        volver={<EnlaceVolver href="/ordenes">Órdenes</EnlaceVolver>}
      />

      <Tarjeta className="mb-5">
        <CabeceraTarjeta titulo="Cliente" />
        <CuerpoTarjeta className="space-y-3">
          {cliente ? (
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm">
                <UserCheck className="size-5 text-emerald-600" aria-hidden />
                <span>
                  <span className="font-semibold text-slate-900">{cliente.nombre}</span>
                  <span className="text-slate-500"> · {cliente.telefono}</span>
                </span>
              </p>
              <Link
                href="/ordenes/nueva"
                className="text-sm font-medium text-marca-700 hover:underline"
              >
                Cambiar
              </Link>
            </div>
          ) : (
            <>
              <Buscador q={q} placeholder="¿Ya es cliente? Busque por nombre o teléfono" />
              {coincidencias && (
                <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
                  {coincidencias.clientes.length === 0 && (
                    <li className="px-3 py-2 text-sm text-slate-500">
                      No encontrado. Rellene los datos del cliente nuevo abajo.
                    </li>
                  )}
                  {coincidencias.clientes.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/ordenes/nueva?cliente=${c.id}`}
                        className="flex justify-between gap-3 px-3 py-2 text-sm hover:bg-marca-50"
                      >
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-slate-500">{c.telefono}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CuerpoTarjeta>
      </Tarjeta>

      <FormularioRecepcion
        key={cliente?.id ?? 'nuevo'}
        cliente={
          cliente ? { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono } : null
        }
        equipos={cliente?.equipos ?? []}
        tecnicos={tecnicos.filter((t) => t.activo)}
        tasa={tasa}
        diasGarantia={ajustes.dias_garantia_default}
        fechaSugerida={sumarDias(hoyEnLaHabana(), 2)}
      />
    </div>
  );
}
