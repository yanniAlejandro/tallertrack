import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { TonoEstado } from '@/domain/estados';

const TONOS: Record<TonoEstado, string> = {
  neutro: 'bg-slate-100 text-slate-700 ring-slate-300/60',
  info: 'bg-sky-50 text-sky-800 ring-sky-300/60',
  aviso: 'bg-amber-50 text-amber-800 ring-amber-300/70',
  progreso: 'bg-marca-50 text-marca-800 ring-marca-300/70',
  exito: 'bg-emerald-50 text-emerald-800 ring-emerald-300/70',
  peligro: 'bg-red-50 text-red-700 ring-red-300/60',
};

export function Insignia({
  tono = 'neutro',
  children,
  className,
}: {
  tono?: TonoEstado;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}
