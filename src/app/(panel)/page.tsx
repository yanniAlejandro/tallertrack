import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta, CabeceraTarjeta } from '@/components/ui/tarjeta';
import { Vacio } from '@/components/ui/vacio';
import { Aviso } from '@/components/ui/aviso';
import { BotonEnlace } from '@/components/ui/boton';
import { ListaOrdenes } from '@/components/ordenes/lista-ordenes';
import { contarAtrasadas, conteoPorEstado, resumenTablero } from '@/server/repositorios/ordenes';
import { requerirPerfil } from '@/server/sesion';
import { formatearFecha, hoyEnLaHabana } from '@/domain/fechas';

export default async function Tablero({ searchParams }: PageProps<'/'>) {
  const [perfil, resumen, conteo, atrasadas, { error }] = await Promise.all([
    requerirPerfil(),
    resumenTablero(),
    conteoPorEstado(),
    contarAtrasadas(),
    searchParams,
  ]);

  const enTaller =
    (conteo.recibido ?? 0) +
    (conteo.diagnostico ?? 0) +
    (conteo.esperando_aprobacion ?? 0) +
    (conteo.en_reparacion ?? 0) +
    (conteo.esperando_pieza ?? 0);

  const indicadores = [
    {
      etiqueta: 'En el taller',
      valor: enTaller,
      icono: Wrench,
      href: '/ordenes?estado=activas',
      tono: 'bg-marca-50 text-marca-700',
    },
    {
      etiqueta: 'Listos para recoger',
      valor: conteo.listo ?? 0,
      icono: CheckCircle2,
      href: '/ordenes?estado=listo',
      tono: 'bg-emerald-50 text-emerald-700',
    },
    {
      etiqueta: 'Esperan aprobación',
      valor: conteo.esperando_aprobacion ?? 0,
      icono: Clock,
      href: '/ordenes?estado=esperando_aprobacion',
      tono: 'bg-amber-50 text-amber-700',
    },
    {
      etiqueta: 'Atrasados',
      valor: atrasadas,
      icono: AlertTriangle,
      href: '/ordenes?estado=atrasadas',
      tono: 'bg-red-50 text-red-700',
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${perfil.nombre.split(' ')[0]}`}
        descripcion={`Hoy es ${formatearFecha(hoyEnLaHabana())}. Este es el resumen del taller.`}
        acciones={<BotonEnlace href="/ordenes/nueva">Recibir equipo</BotonEnlace>}
      />

      {error === 'permiso' && (
        <Aviso tipo="advertencia" className="mb-4">
          Esa sección es solo para el administrador.
        </Aviso>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicadores.map(({ etiqueta, valor, icono: Icono, href, tono }) => (
          <Link
            key={etiqueta}
            href={href}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-marca-300"
          >
            <span
              className={`mb-2 inline-flex size-8 items-center justify-center rounded-lg ${tono}`}
            >
              <Icono className="size-4.5" aria-hidden />
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{valor}</p>
            <p className="text-sm text-slate-500">{etiqueta}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Prometidos para hoy o atrasados"
            descripcion="Equipos que el cliente ya espera."
          />
          {resumen.paraHoy.length ? (
            <ListaOrdenes ordenes={resumen.paraHoy} />
          ) : (
            <Vacio
              icono={<CheckCircle2 />}
              titulo="Todo al día"
              descripcion="No hay entregas pendientes para hoy."
            />
          )}
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta
            titulo="Listos para recoger"
            descripcion="Avise al cliente por WhatsApp desde la orden."
          />
          {resumen.listas.length ? (
            <ListaOrdenes ordenes={resumen.listas} />
          ) : (
            <Vacio titulo="Ningún equipo listo por ahora" />
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <CabeceraTarjeta
            titulo="Últimas recepciones"
            accion={
              <Link href="/ordenes" className="text-sm font-medium text-marca-700 hover:underline">
                Ver todas
              </Link>
            }
          />
          {resumen.recientes.length ? (
            <ListaOrdenes ordenes={resumen.recientes} />
          ) : (
            <Vacio titulo="Aún no hay órdenes" />
          )}
        </Tarjeta>
      </div>
    </>
  );
}
