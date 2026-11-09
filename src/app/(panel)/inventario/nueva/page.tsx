import type { Metadata } from 'next';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { FormularioPieza } from '@/components/inventario/formulario-pieza';
import { requerirAdmin } from '@/server/sesion';

export const metadata: Metadata = { title: 'Nueva pieza' };

export default async function NuevaPieza() {
  await requerirAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <EncabezadoPagina
        titulo="Nueva pieza"
        volver={<EnlaceVolver href="/inventario">Inventario</EnlaceVolver>}
      />
      <Tarjeta>
        <CuerpoTarjeta>
          <FormularioPieza />
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}
