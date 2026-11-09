import Link from 'next/link';
import { Package, Smartphone, User } from 'lucide-react';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import type { OrdenDetalle } from '@/server/repositorios/ordenes';
import { ETIQUETA_TIPO_EQUIPO } from '@/domain/esquemas';
import { formatearFecha, formatearFechaHora } from '@/domain/fechas';

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export function ResumenOrden({ orden }: { orden: OrdenDetalle }) {
  const { equipo, cliente } = orden;
  return (
    <Tarjeta>
      <CabeceraTarjeta titulo="Equipo y recepción" />
      <CuerpoTarjeta className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Smartphone className="size-4" aria-hidden /> Equipo
          </h3>
          <dl className="divide-y divide-slate-100">
            <Dato etiqueta="Tipo">{equipo ? ETIQUETA_TIPO_EQUIPO[equipo.tipo] : '—'}</Dato>
            <Dato etiqueta="Marca y modelo">
              {equipo?.marca} {equipo?.modelo}
            </Dato>
            {equipo?.color && <Dato etiqueta="Color">{equipo.color}</Dato>}
            <Dato etiqueta="IMEI / serie">
              <span className="font-mono">{equipo?.imei_serie ?? '—'}</span>
            </Dato>
          </dl>
        </div>
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <User className="size-4" aria-hidden /> Cliente
          </h3>
          <dl className="divide-y divide-slate-100">
            <Dato etiqueta="Nombre">
              {cliente ? (
                <Link href={`/clientes/${cliente.id}`} className="text-marca-700 hover:underline">
                  {cliente.nombre}
                </Link>
              ) : (
                '—'
              )}
            </Dato>
            <Dato etiqueta="Teléfono">{cliente?.telefono}</Dato>
            {cliente?.carne && <Dato etiqueta="Carné">{cliente.carne}</Dato>}
            <Dato etiqueta="Recibido">
              {formatearFechaHora(orden.creado_en)}
              {orden.recibido_por && ` · ${orden.recibido_por.nombre.split(' ')[0]}`}
            </Dato>
            {orden.fecha_prometida && (
              <Dato etiqueta="Prometido para">{formatearFecha(orden.fecha_prometida)}</Dato>
            )}
          </dl>
        </div>
        <div className="md:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Falla reportada</h3>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
            {orden.falla_reportada}
          </p>
        </div>
        {orden.estado_fisico && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Estado físico</h3>
            <p className="text-sm text-slate-700">{orden.estado_fisico}</p>
          </div>
        )}
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Package className="size-4" aria-hidden /> Accesorios
          </h3>
          <p className="text-sm text-slate-700">
            {orden.accesorios.length ? orden.accesorios.join(', ') : 'Ninguno'}
          </p>
        </div>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}
