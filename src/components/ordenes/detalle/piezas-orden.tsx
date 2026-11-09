'use client';

import { useMemo, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { devolverPieza, usarPieza } from '@/server/acciones/inventario';
import { useAccion } from '@/components/ui/use-accion';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';
import { Selector } from '@/components/ui/campo';
import { formatearUsd, multiplicarUsd } from '@/domain/dinero';
import { validarUsoPieza } from '@/domain/inventario';

export interface LineaPiezaOrden {
  id: number;
  cantidad: number;
  precio_unit_usd: number;
  pieza: { sku: string; nombre: string } | null;
}

export interface PiezaDisponible {
  id: string;
  sku: string;
  nombre: string;
  stock: number;
  precio_usd: number;
  compatible_con: string;
}

/**
 * Piezas usadas en la orden. Al añadir una, la BD descuenta el stock en la
 * misma transacción; al quitarla, lo repone. Se sugieren primero las piezas
 * compatibles con el modelo del equipo.
 */
export function PiezasOrden({
  ordenId,
  lineas,
  disponibles,
  modelo,
  editable,
  esGarantia,
}: {
  ordenId: string;
  lineas: LineaPiezaOrden[];
  disponibles: PiezaDisponible[];
  modelo: string;
  editable: boolean;
  esGarantia: boolean;
}) {
  const { estado, onSubmit, pendiente } = useAccion(usarPieza);
  const [quitando, iniciar] = useTransition();
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null);
  const [piezaId, setPiezaId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const ordenadas = useMemo(() => {
    const m = modelo.toLowerCase();
    const compatibles = disponibles.filter((p) => p.compatible_con.toLowerCase().includes(m));
    return { compatibles, resto: disponibles.filter((p) => !compatibles.includes(p)) };
  }, [disponibles, modelo]);

  const elegida = disponibles.find((p) => p.id === piezaId);
  const validacion = elegida ? validarUsoPieza(elegida.stock, cantidad) : null;

  return (
    <div className="space-y-4">
      {lineas.length === 0 ? (
        <p className="text-sm text-slate-500">No se han usado piezas.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
          {lineas.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">
                  {l.cantidad} × {l.pieza?.nombre}
                </span>
                <span className="font-mono text-xs text-slate-500">{l.pieza?.sku}</span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatearUsd(multiplicarUsd(l.precio_unit_usd, l.cantidad))}
              </span>
              {editable && (
                <button
                  type="button"
                  disabled={quitando}
                  aria-label={`Quitar ${l.pieza?.nombre} y devolver al inventario`}
                  onClick={() =>
                    iniciar(async () => {
                      const r = await devolverPieza(l.id, ordenId);
                      setErrorQuitar(r.ok ? null : r.error);
                    })
                  }
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {errorQuitar && <Aviso tipo="error">{errorQuitar}</Aviso>}

      {editable && (
        <form onSubmit={onSubmit} className="space-y-2" noValidate>
          <input type="hidden" name="orden_id" value={ordenId} />
          {!estado.ok && <Aviso tipo="error">{estado.error}</Aviso>}
          {estado.ok && estado.mensaje && <Aviso tipo="exito">{estado.mensaje}</Aviso>}
          {esGarantia && (
            <p className="text-xs text-emerald-700">
              Orden en garantía: las piezas no se cobran al cliente.
            </p>
          )}
          <label htmlFor="pieza_id" className="block text-sm font-medium text-slate-700">
            Añadir pieza del inventario
          </label>
          <div className="flex gap-2">
            <Selector
              id="pieza_id"
              name="pieza_id"
              value={piezaId}
              onChange={(e) => setPiezaId(e.target.value)}
              className="flex-1"
            >
              <option value="">Seleccione…</option>
              {ordenadas.compatibles.length > 0 && (
                <optgroup label={`Compatibles con ${modelo}`}>
                  {ordenadas.compatibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.stock})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Otras piezas">
                {ordenadas.resto.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.stock})
                  </option>
                ))}
              </optgroup>
            </Selector>
            <label htmlFor="cantidad" className="sr-only">
              Cantidad
            </label>
            <input
              id="cantidad"
              name="cantidad"
              type="number"
              min={1}
              max={20}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="h-10 w-16 rounded-lg border-0 px-2 text-center ring-1 ring-slate-300 ring-inset"
            />
          </div>
          {validacion && !validacion.ok && (
            <p className="text-sm text-red-600">{validacion.motivo}</p>
          )}
          <BotonEnviar
            pendiente={pendiente}
            disabled={!elegida || (validacion !== null && !validacion.ok)}
            variante="secundario"
            textoCargando="Descontando…"
          >
            Usar pieza
          </BotonEnviar>
        </form>
      )}
    </div>
  );
}
