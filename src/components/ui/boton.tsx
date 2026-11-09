import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'whatsapp';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-700 text-white hover:bg-marca-800 active:bg-marca-900 shadow-sm',
  secundario: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  fantasma: 'text-marca-700 hover:bg-marca-50',
  peligro: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  whatsapp: 'bg-[#1a8d48] text-white hover:bg-[#157a3d] shadow-sm',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export function clasesBoton(
  variante: Variante = 'primario',
  tamano: Tamano = 'md',
  extra?: string,
) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors',
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    VARIANTES[variante],
    TAMANOS[tamano],
    extra,
  );
}

type PropsBoton = ComponentProps<'button'> & { variante?: Variante; tamano?: Tamano };

export function Boton({ variante, tamano, className, type = 'button', ...props }: PropsBoton) {
  return <button type={type} className={clasesBoton(variante, tamano, className)} {...props} />;
}

type PropsEnlace = ComponentProps<typeof Link> & { variante?: Variante; tamano?: Tamano };

export function BotonEnlace({ variante, tamano, className, ...props }: PropsEnlace) {
  return <Link className={clasesBoton(variante, tamano, className)} {...props} />;
}

type PropsEnlaceExterno = ComponentProps<'a'> & { variante?: Variante; tamano?: Tamano };

export function BotonEnlaceExterno({ variante, tamano, className, ...props }: PropsEnlaceExterno) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={clasesBoton(variante, tamano, className)}
      {...props}
    />
  );
}
