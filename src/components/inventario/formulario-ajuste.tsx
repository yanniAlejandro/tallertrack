'use client';

import { useEffect, useRef } from 'react';
import { ajustarStock } from '@/server/acciones/inventario';
import { useAccion } from '@/components/ui/use-accion';
import { Campo, Entrada } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';

/** Entrada de mercancía (+) o ajuste por conteo físico (−). */
export function FormularioAjuste({ piezaId }: { piezaId: string }) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(ajustarStock);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok && estado.mensaje) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="pieza_id" value={piezaId} />
      {!estado.ok && <Aviso tipo="error">{estado.error}</Aviso>}
      {estado.ok && estado.mensaje && <Aviso tipo="exito">{estado.mensaje}</Aviso>}
      <Campo
        etiqueta="Cantidad"
        nombre="delta"
        error={e?.delta}
        ayuda="Positivo para entradas (compra), negativo para bajas o ajustes"
      >
        {(f) => <Entrada {...f} type="number" inputMode="numeric" step={1} placeholder="5" />}
      </Campo>
      <Campo etiqueta="Motivo" nombre="motivo" error={e?.motivo}>
        {(f) => <Entrada {...f} placeholder="Compra a proveedor" />}
      </Campo>
      <BotonEnviar pendiente={pendiente} variante="secundario">
        Registrar movimiento
      </BotonEnviar>
    </form>
  );
}
