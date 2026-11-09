'use client';

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { guardarAjustes, registrarTasa, restablecerDemo } from '@/server/acciones/ajustes';
import { useAccion } from '@/components/ui/use-accion';
import { AreaTexto, Campo, Entrada } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Boton } from '@/components/ui/boton';
import { Aviso } from '@/components/ui/aviso';
import { Spinner } from '@/components/ui/spinner';
import { esTasaValida, formatearCup, usdACup } from '@/domain/dinero';
import type { AjustesRow } from '@/types/database';

export function FormularioTasa({ actual }: { actual: number | null }) {
  const { estado, errores, onSubmit, pendiente } = useAccion(registrarTasa);
  const [valor, setValor] = useState(actual ? String(actual) : '');
  const tasa = Number(valor);

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {!estado.ok && <Aviso tipo="error">{estado.error}</Aviso>}
      {estado.ok && estado.mensaje && <Aviso tipo="exito">{estado.mensaje}</Aviso>}
      <Campo
        etiqueta="CUP por 1 USD"
        nombre="cup_por_usd"
        error={errores?.cup_por_usd}
        ayuda={
          esTasaValida(tasa)
            ? `Ejemplo: una pantalla de $25 = ${formatearCup(usdACup(25, tasa))}`
            : 'Tasa informal del día'
        }
      >
        {(p) => (
          <Entrada
            {...p}
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="max-w-40 text-lg font-semibold"
          />
        )}
      </Campo>
      <p className="text-xs text-slate-500">
        Las órdenes ya recibidas conservan la tasa del día en que entraron.
      </p>
      <BotonEnviar pendiente={pendiente}>Actualizar tasa</BotonEnviar>
    </form>
  );
}

export function FormularioNegocio({ ajustes }: { ajustes: AjustesRow }) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(guardarAjustes);
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
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
      <Campo etiqueta="Nombre del negocio" nombre="nombre_negocio" error={e?.nombre_negocio}>
        {(p) => <Entrada {...p} defaultValue={ajustes.nombre_negocio} />}
      </Campo>
      <Campo etiqueta="WhatsApp del taller" nombre="whatsapp" error={e?.whatsapp}>
        {(p) => <Entrada {...p} type="tel" defaultValue={ajustes.whatsapp} />}
      </Campo>
      <Campo etiqueta="Dirección" nombre="direccion" error={e?.direccion} className="sm:col-span-2">
        {(p) => <Entrada {...p} defaultValue={ajustes.direccion} />}
      </Campo>
      <Campo
        etiqueta="Días de garantía por defecto"
        nombre="dias_garantia_default"
        error={e?.dias_garantia_default}
      >
        {(p) => (
          <Entrada
            {...p}
            type="number"
            inputMode="numeric"
            min={0}
            max={365}
            defaultValue={ajustes.dias_garantia_default}
          />
        )}
      </Campo>
      <Campo
        etiqueta="Texto al pie del ticket"
        nombre="pie_ticket"
        error={e?.pie_ticket}
        ayuda="Condiciones de garantía, plazo para recoger…"
        className="sm:col-span-2"
      >
        {(p) => <AreaTexto {...p} rows={3} defaultValue={ajustes.pie_ticket} />}
      </Campo>
      <div className="sm:col-span-2">
        <BotonEnviar pendiente={pendiente}>Guardar datos del negocio</BotonEnviar>
      </div>
    </form>
  );
}

export function BotonRestablecerDemo() {
  const [pendiente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  return (
    <div className="space-y-3">
      {resultado && <Aviso tipo={resultado.ok ? 'exito' : 'error'}>{resultado.texto}</Aviso>}
      <Boton
        variante="peligro"
        disabled={pendiente}
        onClick={() => {
          if (
            !confirm(
              'Se borrarán todas las órdenes, clientes y piezas y se cargarán los datos de ejemplo. ¿Continuar?',
            )
          )
            return;
          iniciar(async () => {
            const r = await restablecerDemo();
            setResultado(
              r.ok ? { ok: true, texto: r.mensaje ?? 'Listo.' } : { ok: false, texto: r.error },
            );
          });
        }}
      >
        {pendiente ? <Spinner /> : <RotateCcw aria-hidden />}
        {pendiente ? 'Restableciendo…' : 'Restablecer demo'}
      </Boton>
    </div>
  );
}
