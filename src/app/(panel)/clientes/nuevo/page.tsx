import type { Metadata } from 'next';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { EnlaceVolver } from '@/components/ui/enlace-volver';
import { Tarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { FormularioCliente } from '@/components/clientes/formulario-cliente';

export const metadata: Metadata = { title: 'Nuevo cliente' };

export default function NuevoCliente() {
  return (
    <div className="mx-auto max-w-xl">
      <EncabezadoPagina
        titulo="Nuevo cliente"
        volver={<EnlaceVolver href="/clientes">Clientes</EnlaceVolver>}
      />
      <Tarjeta>
        <CuerpoTarjeta>
          <FormularioCliente />
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}
