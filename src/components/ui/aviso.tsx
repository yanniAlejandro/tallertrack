import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tipo = 'info' | 'exito' | 'error' | 'advertencia';

const ESTILOS: Record<Tipo, string> = {
  info: 'bg-marca-50 text-marca-900 ring-marca-200',
  exito: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
  advertencia: 'bg-amber-50 text-amber-900 ring-amber-200',
};

export function Aviso({
  tipo = 'info',
  titulo,
  children,
  className,
}: {
  tipo?: Tipo;
  titulo?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg px-4 py-3 text-sm ring-1 ring-inset', ESTILOS[tipo], className)}
    >
      {titulo && <p className="font-semibold">{titulo}</p>}
      {children && <div className={titulo ? 'mt-1' : undefined}>{children}</div>}
    </div>
  );
}
