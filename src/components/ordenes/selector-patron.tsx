'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { serializarPatron } from '@/domain/desbloqueo';

const CENTROS = Array.from({ length: 9 }, (_, i) => ({
  punto: i + 1,
  x: 20 + (i % 3) * 40,
  y: 20 + Math.floor(i / 3) * 40,
}));

/**
 * Rejilla 3×3 para registrar el patrón de desbloqueo tocando los puntos en
 * orden. Guarda el valor como "1-4-7-8-9" en un input oculto.
 */
export function SelectorPatron({ nombre, error }: { nombre: string; error?: string | undefined }) {
  const [puntos, setPuntos] = useState<number[]>([]);

  const tocar = (p: number) => setPuntos((prev) => (prev.includes(p) ? prev : [...prev, p]));
  const linea = puntos
    .map((p) => CENTROS[p - 1]!)
    .map((c) => `${c.x},${c.y}`)
    .join(' ');

  return (
    <div className="flex items-start gap-4">
      <input type="hidden" name={nombre} value={serializarPatron(puntos)} />
      <div className="relative size-40 rounded-xl bg-slate-900 p-0 select-none" aria-hidden={false}>
        <svg viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 size-full">
          {puntos.length > 1 && (
            <polyline
              points={linea}
              fill="none"
              stroke="#3f8bbf"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <div className="grid size-full grid-cols-3 grid-rows-3">
          {CENTROS.map(({ punto }) => {
            const orden = puntos.indexOf(punto);
            return (
              <button
                key={punto}
                type="button"
                onClick={() => tocar(punto)}
                aria-label={`Punto ${punto}${orden >= 0 ? `, paso ${orden + 1}` : ''}`}
                aria-pressed={orden >= 0}
                className="relative flex items-center justify-center focus-visible:outline-white"
              >
                <span
                  className={
                    orden >= 0
                      ? 'flex size-7 items-center justify-center rounded-full bg-marca-400 text-xs font-bold text-white'
                      : 'size-3.5 rounded-full bg-slate-500'
                  }
                >
                  {orden >= 0 ? orden + 1 : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-slate-600">Toque los puntos en el orden que le indique el cliente.</p>
        <p className="font-mono text-slate-900">{puntos.length ? serializarPatron(puntos) : '—'}</p>
        {puntos.length > 0 && (
          <button
            type="button"
            onClick={() => setPuntos([])}
            className="inline-flex items-center gap-1 font-medium text-marca-700 hover:underline"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Borrar
          </button>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}
