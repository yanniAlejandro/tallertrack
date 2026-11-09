import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MapPin, MessageCircle, ShieldCheck, Wrench } from 'lucide-react';
import { consultarEstadoPublico } from '@/server/repositorios/estado-publico';
import { normalizarCodigo } from '@/domain/codigo-orden';
import { ETIQUETA_ESTADO, pasoProgreso } from '@/domain/estados';
import { formatearCup, formatearUsd, usdACup } from '@/domain/dinero';
import {
  fechaDeTimestamp,
  formatearFecha,
  formatearFechaHora,
  hoyEnLaHabana,
} from '@/domain/fechas';
import { enlaceWhatsApp } from '@/domain/whatsapp';
import { situacionGarantia } from '@/domain/garantia';
import { InsigniaEstado } from '@/components/ordenes/insignia-estado';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Estado de su reparación',
  robots: { index: false, follow: false },
};

const PASOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Listo', 'Entregado'];

function NoEncontrado({ codigo }: { codigo: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-xl font-bold text-slate-900">No encontramos la orden {codigo}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Revise el código de su ticket. Si el problema continúa, contacte con el taller.
      </p>
      <Link href="/estado" className="mt-5 font-medium text-marca-700 underline">
        Probar con otro código
      </Link>
    </main>
  );
}

export default async function EstadoOrden({ params }: PageProps<'/estado/[codigo]'>) {
  const { codigo: crudo } = await params;
  const codigo = normalizarCodigo(decodeURIComponent(crudo));
  if (!codigo) return <NoEncontrado codigo={decodeURIComponent(crudo).slice(0, 20)} />;

  const orden = await consultarEstadoPublico(codigo);
  if (!orden) return <NoEncontrado codigo={codigo} />;

  const paso = pasoProgreso(orden.estado);
  const sinReparacion = orden.estado === 'cancelado' || orden.estado === 'no_reparable';
  const garantia = situacionGarantia(orden.garantia_hasta, hoyEnLaHabana());
  const contacto = orden.negocio
    ? enlaceWhatsApp(
        orden.negocio.whatsapp,
        `Hola, le escribo por mi orden ${orden.codigo} (${orden.equipo}).`,
      )
    : null;

  return (
    <main className="min-h-dvh bg-slate-50 pb-10">
      <header className="bg-marca-800 px-4 pt-6 pb-16 text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/15">
            <Wrench className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-bold">{orden.negocio?.nombre ?? 'TallerTrack'}</p>
            <p className="text-xs text-marca-200">Seguimiento de su reparación</p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-lg space-y-4 px-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Hola, {orden.cliente}. Su equipo:</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{orden.equipo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-marca-700">{orden.codigo}</span>
            <InsigniaEstado estado={orden.estado} />
            {orden.es_garantia && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="size-3.5" aria-hidden /> En garantía
              </span>
            )}
          </div>

          {/* Progreso */}
          <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Progreso de la reparación">
            {PASOS.map((nombre, i) => {
              const hecho = i + 1 <= paso;
              return (
                <li
                  key={nombre}
                  className="text-center"
                  aria-current={i + 1 === paso ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full',
                      hecho
                        ? sinReparacion && i + 1 === paso
                          ? 'bg-red-400'
                          : 'bg-marca-500'
                        : 'bg-slate-200',
                    )}
                  />
                  <span
                    className={cn(
                      'mt-1 block text-[11px]',
                      hecho ? 'font-medium text-slate-800' : 'text-slate-400',
                    )}
                  >
                    {i === 3 && sinReparacion ? ETIQUETA_ESTADO[orden.estado] : nombre}
                  </span>
                </li>
              );
            })}
          </ol>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Recibido</dt>
              <dd className="font-medium">
                {formatearFecha(fechaDeTimestamp(orden.fecha_recepcion))}
              </dd>
            </div>
            {orden.entregada_en ? (
              <div>
                <dt className="text-slate-500">Entregado</dt>
                <dd className="font-medium">
                  {formatearFecha(fechaDeTimestamp(orden.entregada_en))}
                </dd>
              </div>
            ) : (
              orden.fecha_prometida && (
                <div>
                  <dt className="text-slate-500">Fecha estimada</dt>
                  <dd className="font-medium">{formatearFecha(orden.fecha_prometida)}</dd>
                </div>
              )
            )}
            {orden.presupuesto_usd > 0 && (
              <div className="col-span-2 rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">Presupuesto</dt>
                <dd className="text-lg font-bold text-slate-900">
                  {formatearUsd(orden.presupuesto_usd)}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    · {formatearCup(usdACup(orden.presupuesto_usd, orden.tasa_aplicada))}
                  </span>
                </dd>
              </div>
            )}
          </dl>

          {orden.estado === 'listo' && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              ¡Su equipo está listo! Puede pasar a recogerlo. Recuerde traer su ticket.
            </p>
          )}
          {garantia.tipo === 'vigente' && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-marca-50 p-3 text-sm text-marca-900">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Su reparación tiene garantía hasta el {formatearFecha(garantia.hasta)} (
              {garantia.diasRestantes} días).
            </p>
          )}
        </section>

        {orden.eventos.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 font-semibold text-slate-900">Novedades</h2>
            <ol className="space-y-3 border-l border-slate-200 pl-4">
              {[...orden.eventos].reverse().map((ev, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-marca-500 ring-4 ring-white"
                    aria-hidden
                  />
                  <p className="text-xs text-slate-500">{formatearFechaHora(ev.fecha)}</p>
                  <p className="text-sm font-medium text-slate-900">
                    {ev.estado ? ETIQUETA_ESTADO[ev.estado] : 'Mensaje del taller'}
                  </p>
                  {ev.texto && <p className="text-sm text-slate-700">{ev.texto}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {orden.negocio && (
          <section className="rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="flex items-start gap-2 text-slate-700">
              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              {orden.negocio.direccion}
            </p>
            {contacto && (
              <a
                href={contacto}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1a8d48] font-semibold text-white hover:bg-[#157a3d]"
              >
                <MessageCircle className="size-4" aria-hidden /> Escribir al taller por WhatsApp
              </a>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
