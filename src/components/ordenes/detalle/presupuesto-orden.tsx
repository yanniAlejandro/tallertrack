'use client';

import { useState } from 'react';
import { actualizarPresupuesto } from '@/server/acciones/ordenes';
import { useAccion } from '@/components/ui/use-accion';
import { Campo, Entrada, Selector } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';
import { formatearCup, formatearUsd, sumarUsd, usdACup } from '@/domain/dinero';

interface Props {
  ordenId: string;
  presupuestoUsd: number;
  manoObraUsd: number;
  piezasUsd: number;
  tasa: number;
  tecnicoId: string | null;
  fechaPrometida: string | null;
  tecnicos: Array<{ id: string; nombre: string }>;
  editable: boolean;
}

/** Presupuesto, mano de obra, técnico y fecha prometida, con el total en USD y CUP. */
export function PresupuestoOrden(p: Props) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(actualizarPresupuesto);
  const [manoObra, setManoObra] = useState(String(p.manoObraUsd));
  const mo = Number(manoObra);
  const total = sumarUsd(Number.isFinite(mo) && mo >= 0 ? mo : 0, p.piezasUsd);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Piezas', p.piezasUsd],
          ['Mano de obra', Number.isFinite(mo) ? mo : 0],
          ['Total', total],
        ].map(([etiqueta, usd]) => (
          <div
            key={etiqueta as string}
            className={
              etiqueta === 'Total'
                ? 'rounded-lg bg-marca-700 px-2 py-2 text-white'
                : 'rounded-lg bg-slate-50 px-2 py-2'
            }
          >
            <dt className="text-xs opacity-80">{etiqueta}</dt>
            <dd className="font-bold tabular-nums">{formatearUsd(usd as number)}</dd>
            <dd className="text-xs tabular-nums opacity-80">
              {formatearCup(usdACup(usd as number, p.tasa))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-slate-500">
        Tasa congelada al recibir el equipo: 1 USD = {formatearCup(p.tasa)}. Presupuesto dado al
        cliente: {formatearUsd(p.presupuestoUsd)}.
      </p>

      {p.editable && (
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
          <input type="hidden" name="orden_id" value={p.ordenId} />
          {!estado.ok && (
            <Aviso tipo="error" className="sm:col-span-2">
              {estado.error}
            </Aviso>
          )}
          {estado.ok && estado.mensaje && (
            <Aviso tipo="exito" className="sm:col-span-2">
              {estado.mensaje}
            </Aviso>
          )}
          <Campo
            etiqueta="Presupuesto al cliente (USD)"
            nombre="presupuesto_usd"
            error={e?.presupuesto_usd}
          >
            {(c) => (
              <Entrada
                {...c}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={p.presupuestoUsd}
              />
            )}
          </Campo>
          <Campo etiqueta="Mano de obra (USD)" nombre="mano_obra_usd" error={e?.mano_obra_usd}>
            {(c) => (
              <Entrada
                {...c}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={manoObra}
                onChange={(ev) => setManoObra(ev.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Técnico" nombre="tecnico_id">
            {(c) => (
              <Selector {...c} defaultValue={p.tecnicoId ?? ''}>
                <option value="">Sin asignar</option>
                {p.tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Fecha prometida" nombre="fecha_prometida" error={e?.fecha_prometida}>
            {(c) => <Entrada {...c} type="date" defaultValue={p.fechaPrometida ?? ''} />}
          </Campo>
          <div className="sm:col-span-2">
            <BotonEnviar pendiente={pendiente} variante="secundario">
              Guardar cambios
            </BotonEnviar>
          </div>
        </form>
      )}
    </div>
  );
}
