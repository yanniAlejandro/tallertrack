'use client';

import { reabrirEnGarantia } from '@/server/acciones/garantia';
import { useAccion } from '@/components/ui/use-accion';
import { AreaTexto, Campo } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';

/** Reabre la orden en garantía: crea una orden hija sin cobro de mano de obra. */
export function FormularioReapertura({ ordenId }: { ordenId: string }) {
  const { estado, errores, onSubmit, pendiente } = useAccion(reabrirEnGarantia);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="orden_id" value={ordenId} />
      {!estado.ok && !errores?.falla && <Aviso tipo="error">{estado.error}</Aviso>}
      <Campo etiqueta="¿Qué falla presenta ahora?" nombre="falla" error={errores?.falla}>
        {(p) => (
          <AreaTexto
            {...p}
            rows={2}
            placeholder="Ej. El táctil vuelve a fallar en la parte de abajo"
          />
        )}
      </Campo>
      <BotonEnviar pendiente={pendiente} textoCargando="Reabriendo…">
        Reabrir en garantía
      </BotonEnviar>
    </form>
  );
}
