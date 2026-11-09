import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, UserPlus, Users } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Buscador } from '@/components/ui/buscador';
import { BotonEnlace } from '@/components/ui/boton';
import { Vacio } from '@/components/ui/vacio';
import { Paginacion, leerPagina, leerTexto } from '@/components/ui/paginacion';
import { buscarClientes, TAM_PAGINA } from '@/server/repositorios/clientes';

export const metadata: Metadata = { title: 'Clientes' };

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export default async function PaginaClientes({ searchParams }: PageProps<'/clientes'>) {
  const sp = await searchParams;
  const q = leerTexto(sp.q);
  const pagina = leerPagina(sp.pagina);
  const { clientes, total } = await buscarClientes({ q, pagina });

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Busque por nombre, teléfono o carné de identidad."
        acciones={
          <BotonEnlace href="/clientes/nuevo" variante="secundario">
            <UserPlus aria-hidden /> Nuevo cliente
          </BotonEnlace>
        }
      />
      <div className="mb-4">
        <Buscador q={q} placeholder="Ej. Yanelis, 5234 5678 o 85010112345" />
      </div>
      <Tarjeta>
        {clientes.length === 0 ? (
          <Vacio
            icono={<Users />}
            titulo={q ? 'Sin resultados' : 'Aún no hay clientes'}
            descripcion={
              q
                ? `No encontramos clientes que coincidan con «${q}».`
                : 'Los clientes se crean al recibir su primer equipo.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {clientes.map((c) => {
              const equipos = c.equipos[0]?.count ?? 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-semibold text-marca-800">
                      {iniciales(c.nombre)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{c.nombre}</span>
                      <span className="block text-sm text-slate-500">
                        {c.telefono.replace(/(\d)(\d{3})(\d{4})/, '$1 $2 $3')}
                        {c.municipio ? ` · ${c.municipio}` : ''}
                      </span>
                    </span>
                    <span className="text-xs whitespace-nowrap text-slate-500">
                      {equipos} {equipos === 1 ? 'equipo' : 'equipos'}
                    </span>
                    <ChevronRight className="size-4 text-slate-300" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Paginacion
          pagina={pagina}
          total={total}
          tamano={TAM_PAGINA}
          ruta="/clientes"
          params={{ q }}
        />
      </Tarjeta>
    </>
  );
}
