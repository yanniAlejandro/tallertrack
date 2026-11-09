'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { verDesbloqueo } from '@/server/acciones/ordenes';
import { ETIQUETA_DESBLOQUEO, parsearPatron, type TipoDesbloqueo } from '@/domain/desbloqueo';
import { Spinner } from '@/components/ui/spinner';

function MiniPatron({ puntos }: { puntos: number[] }) {
  const c = (p: number) => ({ x: 10 + ((p - 1) % 3) * 20, y: 10 + Math.floor((p - 1) / 3) * 20 });
  return (
    <svg
      viewBox="0 0 60 60"
      className="size-20 rounded-lg bg-slate-900"
      role="img"
      aria-label={`Patrón ${puntos.join('-')}`}
    >
      <polyline
        points={puntos.map((p) => `${c(p).x},${c(p).y}`).join(' ')}
        fill="none"
        stroke="#3f8bbf"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={c(i + 1).x}
          cy={c(i + 1).y}
          r={puntos[0] === i + 1 ? 3.5 : 2}
          fill={puntos.includes(i + 1) ? '#aed1e9' : '#64748b'}
        />
      ))}
    </svg>
  );
}

/** El dato de desbloqueo solo se descifra en el servidor cuando alguien lo pide. */
export function VerDesbloqueo({ ordenId, tipo }: { ordenId: string; tipo: TipoDesbloqueo }) {
  const [valor, setValor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, iniciar] = useTransition();

  if (tipo === 'ninguno') {
    return <p className="text-sm text-slate-500">El equipo no tiene bloqueo.</p>;
  }

  const mostrar = () =>
    iniciar(async () => {
      const r = await verDesbloqueo(ordenId);
      if (r.ok && r.datos) {
        setValor(r.datos);
        setError(null);
      } else if (!r.ok) setError(r.error);
    });

  const puntos = tipo === 'patron' && valor ? parsearPatron(valor) : null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm text-slate-700">
        <Lock className="size-4" aria-hidden /> {ETIQUETA_DESBLOQUEO[tipo]}
      </p>
      {valor ? (
        <div className="flex items-center gap-3">
          {puntos ? <MiniPatron puntos={puntos} /> : null}
          <span className="font-mono text-lg font-semibold tracking-wider text-slate-900">
            {valor}
          </span>
          <button
            type="button"
            onClick={() => setValor(null)}
            className="inline-flex items-center gap-1 text-sm text-marca-700 hover:underline"
          >
            <EyeOff className="size-4" aria-hidden /> Ocultar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={mostrar}
          disabled={cargando}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-marca-700 hover:underline disabled:opacity-60"
        >
          {cargando ? <Spinner /> : <Eye className="size-4" aria-hidden />} Mostrar
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
