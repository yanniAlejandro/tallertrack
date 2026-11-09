import { formatearCup, formatearUsd, usdACup } from '@/domain/dinero';
import { cn } from '@/lib/cn';

/** Muestra un monto en USD con su equivalente en CUP debajo. */
export function Monto({
  usd,
  tasa,
  className,
  alinear = 'derecha',
}: {
  usd: number;
  tasa: number;
  className?: string;
  alinear?: 'derecha' | 'izquierda';
}) {
  return (
    <span
      className={cn(
        'inline-flex flex-col leading-tight',
        alinear === 'derecha' && 'items-end',
        className,
      )}
    >
      <span className="font-semibold text-slate-900 tabular-nums">{formatearUsd(usd)}</span>
      <span className="text-xs text-slate-500 tabular-nums">
        {formatearCup(usdACup(usd, tasa))}
      </span>
    </span>
  );
}
