import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const BASE_CONTROL =
  'block w-full rounded-lg border-0 bg-white px-3 text-base text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-marca-500 focus:outline-none disabled:bg-slate-100 sm:text-sm aria-[invalid=true]:ring-red-500';

interface PropsControl {
  id: string;
  name: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface PropsCampo {
  etiqueta: string;
  nombre: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  opcional?: boolean;
  children: (props: PropsControl) => ReactNode;
  className?: string;
}

/** Etiqueta + control + ayuda/error, con los atributos ARIA conectados. */
export function Campo({
  etiqueta,
  nombre,
  error,
  ayuda,
  opcional,
  children,
  className,
}: PropsCampo) {
  const id = `campo-${nombre}`;
  const idDesc = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  const props: PropsControl = { id, name: nombre };
  if (error) props['aria-invalid'] = true;
  if (idDesc) props['aria-describedby'] = idDesc;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
        {opcional && <span className="ml-1 font-normal text-slate-400">(opcional)</span>}
      </label>
      {children(props)}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-slate-500">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

export function Entrada({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(BASE_CONTROL, 'h-10', className)} {...props} />;
}

export function AreaTexto({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(BASE_CONTROL, 'py-2', className)} {...props} />;
}

export function Selector({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(BASE_CONTROL, 'h-10 pr-8', className)} {...props} />;
}
