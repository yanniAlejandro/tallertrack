import Link from 'next/link';
import { CalendarClock, ChevronRight, ShieldCheck, Smartphone } from 'lucide-react';
import { InsigniaEstado } from './insignia-estado';
import { Monto } from '@/components/ui/monto';
import type { EstadoOrden } from '@/domain/estados';
import { estaActiva } from '@/domain/estados';
import { formatearFechaCorta, hoyEnLaHabana } from '@/domain/fechas';
import { cn } from '@/lib/cn';

export interface FilaOrden {
  id: string;
  codigo: string;
  estado: EstadoOrden;
  es_garantia: boolean;
  cliente_nombre: string;
  equipo_marca: string;
  equipo_modelo: string;
  fecha_prometida: string | null;
  tecnico_nombre: string | null;
  total_usd: number;
  presupuesto_usd: number;
  tasa_aplicada: number;
  falla_reportada?: string;
}

/** Lista de órdenes: tarjetas compactas que funcionan igual en móvil y escritorio. */
export function ListaOrdenes({ ordenes }: { ordenes: FilaOrden[] }) {
  const hoy = hoyEnLaHabana();
  return (
    <ul className="divide-y divide-slate-100">
      {ordenes.map((o) => {
        const atrasada =
          estaActiva(o.estado) &&
          o.estado !== 'listo' &&
          o.fecha_prometida !== null &&
          o.fecha_prometida < hoy;
        const monto = o.total_usd > 0 ? o.total_usd : o.presupuesto_usd;
        return (
          <li key={o.id}>
            <Link
              href={`/ordenes/${o.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 sm:px-5"
            >
              <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-marca-50 text-marca-700 sm:flex">
                <Smartphone className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-xs font-semibold text-marca-700">{o.codigo}</span>
                  <InsigniaEstado estado={o.estado} />
                  {o.es_garantia && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
                      <ShieldCheck className="size-3.5" aria-hidden /> Garantía
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-medium text-slate-900">
                  {o.equipo_marca} {o.equipo_modelo} ·{' '}
                  <span className="font-normal">{o.cliente_nombre}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                  {o.tecnico_nombre && <span>{o.tecnico_nombre.split(' ')[0]}</span>}
                  {o.fecha_prometida && estaActiva(o.estado) && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        atrasada && 'font-semibold text-red-600',
                      )}
                    >
                      <CalendarClock className="size-3.5" aria-hidden />
                      {atrasada ? 'Atrasada · ' : 'Para el '}
                      {formatearFechaCorta(o.fecha_prometida)}
                    </span>
                  )}
                </p>
              </div>
              {monto > 0 && <Monto usd={monto} tasa={o.tasa_aplicada} className="text-sm" />}
              <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
