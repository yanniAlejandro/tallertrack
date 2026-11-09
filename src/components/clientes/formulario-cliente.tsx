'use client';

import { guardarCliente } from '@/server/acciones/clientes';
import { useAccion } from '@/components/ui/use-accion';
import { MUNICIPIOS_HABANA } from '@/domain/esquemas';
import type { ClienteRow } from '@/types/database';
import { AreaTexto, Campo, Entrada, Selector } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';

export function FormularioCliente({ cliente }: { cliente?: ClienteRow }) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(guardarCliente);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      {!estado.ok && <Aviso tipo="error">{estado.error}</Aviso>}
      {estado.ok && estado.mensaje && <Aviso tipo="exito">{estado.mensaje}</Aviso>}

      <Campo etiqueta="Nombre y apellidos" nombre="nombre" error={e?.nombre}>
        {(p) => <Entrada {...p} defaultValue={cliente?.nombre} autoComplete="name" required />}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Teléfono (WhatsApp)"
          nombre="telefono"
          error={e?.telefono}
          ayuda="Móvil cubano de 8 dígitos"
        >
          {(p) => (
            <Entrada
              {...p}
              type="tel"
              inputMode="tel"
              placeholder="5 234 5678"
              defaultValue={cliente?.telefono}
              required
            />
          )}
        </Campo>
        <Campo etiqueta="Carné de identidad" nombre="carne" error={e?.carne} opcional>
          {(p) => (
            <Entrada
              {...p}
              inputMode="numeric"
              maxLength={13}
              defaultValue={cliente?.carne ?? ''}
            />
          )}
        </Campo>
      </div>
      <Campo etiqueta="Municipio" nombre="municipio" error={e?.municipio} opcional>
        {(p) => (
          <Selector {...p} defaultValue={cliente?.municipio ?? 'Cerro'}>
            <option value="">—</option>
            {MUNICIPIOS_HABANA.map((m) => (
              <option key={m}>{m}</option>
            ))}
            <option value="Fuera de La Habana">Fuera de La Habana</option>
          </Selector>
        )}
      </Campo>
      <Campo etiqueta="Notas" nombre="notas" error={e?.notas} opcional>
        {(p) => <AreaTexto {...p} rows={2} defaultValue={cliente?.notas ?? ''} />}
      </Campo>
      <BotonEnviar pendiente={pendiente}>
        {cliente ? 'Guardar cambios' : 'Crear cliente'}
      </BotonEnviar>
    </form>
  );
}
