import Link from 'next/link';
import { ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import { situacionGarantia, puedeReabrirEnGarantia } from '@/domain/garantia';
import { formatearFecha, hoyEnLaHabana } from '@/domain/fechas';
import type { EstadoOrden } from '@/domain/estados';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { FormularioReapertura } from './formulario-reapertura';

interface Props {
  orden: { id: string; estado: EstadoOrden; garantia_hasta: string | null; es_garantia: boolean };
  relacionadas: Array<{ id: string; codigo: string; estado: EstadoOrden; es_garantia: boolean }>;
  tieneGarantiaAbierta: boolean;
}

/** Situación de la garantía de la orden, reapertura y órdenes relacionadas. */
export function TarjetaGarantia({ orden, relacionadas, tieneGarantiaAbierta }: Props) {
  const hoy = hoyEnLaHabana();
  const s = situacionGarantia(orden.garantia_hasta, hoy);
  const reapertura = puedeReabrirEnGarantia(
    { estado: orden.estado, garantiaHasta: orden.garantia_hasta, tieneGarantiaAbierta },
    hoy,
  );

  return (
    <div className="space-y-4 text-sm">
      {s.tipo === 'vigente' && (
        <p className="flex items-start gap-2 text-emerald-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          En garantía hasta el {formatearFecha(s.hasta)} ({s.diasRestantes} días).
        </p>
      )}
      {s.tipo === 'vencida' && (
        <p className="flex items-start gap-2 text-slate-600">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          La garantía venció el {formatearFecha(s.hasta)}.
        </p>
      )}
      {s.tipo === 'sin_garantia' && (
        <p className="flex items-start gap-2 text-slate-600">
          <ShieldOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {orden.es_garantia
            ? 'Esta orden es una revisión en garantía.'
            : orden.estado === 'entregado'
              ? 'Entregada sin garantía.'
              : 'La garantía empieza a contar al entregar el equipo reparado.'}
        </p>
      )}

      {reapertura.ok ? (
        <FormularioReapertura ordenId={orden.id} />
      ) : (
        s.tipo === 'vigente' && <p className="text-slate-500">{reapertura.motivo}</p>
      )}

      {relacionadas.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-slate-700">Órdenes relacionadas</p>
          <ul className="space-y-1">
            {relacionadas.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <Link
                  href={`/ordenes/${r.id}`}
                  className="font-mono text-marca-700 hover:underline"
                >
                  {r.codigo}
                </Link>
                <InsigniaEstado estado={r.estado} />
                <span className="text-xs text-slate-500">
                  {r.es_garantia ? 'reapertura' : 'orden original'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
