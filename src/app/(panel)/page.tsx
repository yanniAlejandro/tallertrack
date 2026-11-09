import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Aviso } from '@/components/ui/aviso';
import { requerirPerfil } from '@/server/sesion';
import { formatearFecha, hoyEnLaHabana } from '@/domain/fechas';

export default async function Tablero({ searchParams }: PageProps<'/'>) {
  const [perfil, { error }] = await Promise.all([requerirPerfil(), searchParams]);
  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${perfil.nombre.split(' ')[0]}`}
        descripcion={`Hoy es ${formatearFecha(hoyEnLaHabana())}.`}
      />
      {error === 'permiso' && (
        <Aviso tipo="advertencia" className="mb-4">
          Esa sección es solo para el administrador.
        </Aviso>
      )}
      <Tarjeta>
        <CuerpoTarjeta className="text-sm text-slate-600">
          Aquí verá el resumen del taller: equipos para hoy, listos para recoger y stock bajo.
        </CuerpoTarjeta>
      </Tarjeta>
    </>
  );
}
