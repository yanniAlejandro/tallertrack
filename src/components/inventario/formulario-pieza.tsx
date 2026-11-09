'use client';

import { useState } from 'react';
import { guardarPieza } from '@/server/acciones/inventario';
import { useAccion } from '@/components/ui/use-accion';
import { Campo, Entrada, Selector } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';
import { CATEGORIAS_PIEZA, ETIQUETA_CATEGORIA } from '@/domain/inventario';
import { formatearUsd, margenPorcentaje } from '@/domain/dinero';
import type { PiezaRow } from '@/types/database';

export function FormularioPieza({ pieza }: { pieza?: PiezaRow }) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(guardarPieza);
  const [costo, setCosto] = useState(String(pieza?.costo_usd ?? ''));
  const [precio, setPrecio] = useState(String(pieza?.precio_usd ?? ''));
  const c = Number(costo);
  const p = Number(precio);
  const valido = costo !== '' && precio !== '' && c >= 0 && p > 0;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {pieza && <input type="hidden" name="id" value={pieza.id} />}
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
      <Campo etiqueta="Nombre" nombre="nombre" error={e?.nombre} className="sm:col-span-2">
        {(f) => (
          <Entrada {...f} defaultValue={pieza?.nombre} placeholder="Pantalla Samsung Galaxy A12" />
        )}
      </Campo>
      <Campo etiqueta="SKU" nombre="sku" error={e?.sku} ayuda="Código interno, ej. PAN-SA12">
        {(f) => <Entrada {...f} defaultValue={pieza?.sku} className="font-mono uppercase" />}
      </Campo>
      <Campo etiqueta="Categoría" nombre="categoria" error={e?.categoria}>
        {(f) => (
          <Selector {...f} defaultValue={pieza?.categoria ?? 'pantalla'}>
            {CATEGORIAS_PIEZA.map((cat) => (
              <option key={cat} value={cat}>
                {ETIQUETA_CATEGORIA[cat]}
              </option>
            ))}
          </Selector>
        )}
      </Campo>
      <Campo
        etiqueta="Compatible con"
        nombre="compatible_con"
        error={e?.compatible_con}
        ayuda="Modelos separados por comas"
        className="sm:col-span-2"
      >
        {(f) => (
          <Entrada
            {...f}
            defaultValue={pieza?.compatible_con}
            placeholder="Galaxy A12, Galaxy A32"
          />
        )}
      </Campo>
      <Campo etiqueta="Costo (USD)" nombre="costo_usd" error={e?.costo_usd}>
        {(f) => (
          <Entrada
            {...f}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={costo}
            onChange={(ev) => setCosto(ev.target.value)}
          />
        )}
      </Campo>
      <Campo
        etiqueta="Precio de venta (USD)"
        nombre="precio_usd"
        error={e?.precio_usd}
        ayuda={
          valido
            ? `Ganancia ${formatearUsd(p - c)} · margen ${margenPorcentaje(c, p)} %`
            : undefined
        }
      >
        {(f) => (
          <Entrada
            {...f}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={precio}
            onChange={(ev) => setPrecio(ev.target.value)}
          />
        )}
      </Campo>
      <Campo
        etiqueta="Stock mínimo"
        nombre="stock_minimo"
        error={e?.stock_minimo}
        ayuda="Avisa cuando quede esto o menos"
      >
        {(f) => (
          <Entrada
            {...f}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={pieza?.stock_minimo ?? 2}
          />
        )}
      </Campo>
      {!pieza && (
        <Campo etiqueta="Stock inicial" nombre="stock" error={e?.stock}>
          {(f) => <Entrada {...f} type="number" inputMode="numeric" min={0} defaultValue={0} />}
        </Campo>
      )}
      <div className="sm:col-span-2">
        <BotonEnviar pendiente={pendiente}>{pieza ? 'Guardar cambios' : 'Crear pieza'}</BotonEnviar>
      </div>
    </form>
  );
}
