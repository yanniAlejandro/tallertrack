import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Tarjeta({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}
      {...props}
    />
  );
}

export function CabeceraTarjeta({
  titulo,
  descripcion,
  accion,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {accion}
    </header>
  );
}

export function CuerpoTarjeta({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-4 py-4 sm:px-5', className)} {...props} />;
}
