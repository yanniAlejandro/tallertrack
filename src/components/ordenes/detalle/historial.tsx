import { Eye, EyeOff, MessageSquare } from 'lucide-react';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { formatearFechaHora } from '@/domain/fechas';
import type { EstadoOrden } from '@/domain/estados';
import { cn } from '@/lib/cn';
import { FormularioNota } from './formulario-nota';

export interface EventoHistorial {
  id: number;
  tipo: 'cambio_estado' | 'nota';
  estado_nuevo: EstadoOrden | null;
  texto: string | null;
  visible_cliente: boolean;
  creado_en: string;
  autor: { nombre: string } | null;
}

/** Línea de tiempo de la orden: cambios de estado y notas internas o visibles. */
export function Historial({ ordenId, eventos }: { ordenId: string; eventos: EventoHistorial[] }) {
  return (
    <div className="space-y-4">
      <FormularioNota ordenId={ordenId} />
      <ol className="relative space-y-4 border-l border-slate-200 pl-5">
        {eventos.map((ev) => (
          <li key={ev.id} className="relative">
            <span
              className={cn(
                'absolute top-1 -left-[1.6rem] flex size-3 rounded-full ring-4 ring-white',
                ev.tipo === 'nota' ? 'bg-slate-300' : 'bg-marca-500',
              )}
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {ev.tipo === 'cambio_estado' && ev.estado_nuevo ? (
                <InsigniaEstado estado={ev.estado_nuevo} />
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <MessageSquare className="size-3.5" aria-hidden /> Nota
                </span>
              )}
              <time dateTime={ev.creado_en}>{formatearFechaHora(ev.creado_en)}</time>
              {ev.autor && <span>· {ev.autor.nombre.split(' ')[0]}</span>}
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  ev.visible_cliente ? 'text-emerald-700' : 'text-amber-700',
                )}
                title={ev.visible_cliente ? 'Visible para el cliente' : 'Solo interna'}
              >
                {ev.visible_cliente ? (
                  <Eye className="size-3.5" aria-hidden />
                ) : (
                  <EyeOff className="size-3.5" aria-hidden />
                )}
                {ev.visible_cliente ? 'Cliente' : 'Interna'}
              </span>
            </div>
            {ev.texto && <p className="mt-1 text-sm text-slate-800">{ev.texto}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
