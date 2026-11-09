import type { Metadata } from 'next';
import Link from 'next/link';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Vacio } from '@/components/ui/vacio';
import { Barras } from '@/components/reportes/barras';
import { datosReportes } from '@/server/repositorios/reportes';
import { requerirAdmin } from '@/server/sesion';
import { ESTADOS_ORDEN, ETIQUETA_ESTADO } from '@/domain/estados';
import { ETIQUETA_CATEGORIA } from '@/domain/inventario';
import { formatearCup, formatearUsd, margenPorcentaje, sumarUsd } from '@/domain/dinero';
import { hoyEnLaHabana } from '@/domain/fechas';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Reportes' };

const PERIODOS = [
  { meses: 1, etiqueta: 'Este mes' },
  { meses: 3, etiqueta: '3 meses' },
  { meses: 6, etiqueta: '6 meses' },
  { meses: 12, etiqueta: '12 meses' },
] as const;

const NOMBRE_MES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Primer día del mes, `meses - 1` meses atrás (incluye el mes en curso). */
function inicioPeriodo(meses: number): string {
  const [a, m] = hoyEnLaHabana().split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(a, m - 1 - (meses - 1), 1));
  return d.toISOString().slice(0, 10);
}

export default async function Reportes({ searchParams }: PageProps<'/reportes'>) {
  await requerirAdmin();
  const { meses: crudo } = await searchParams;
  const meses = PERIODOS.find((p) => String(p.meses) === crudo)?.meses ?? 3;
  const { porEstado, ingresos, piezas, tecnicos } = await datosReportes(inicioPeriodo(meses));

  const totalUsd = sumarUsd(...ingresos.map((i) => i.ingresos_usd));
  const totalCup = ingresos.reduce((s, i) => s + Number(i.ingresos_cup), 0);
  const ganancia = sumarUsd(...ingresos.map((i) => i.ganancia_usd));
  const entregadas = ingresos.reduce((s, i) => s + i.ordenes, 0);
  const conteo = new Map(porEstado.map((e) => [e.estado, e.cantidad]));

  const kpis = [
    { etiqueta: 'Ingresos', valor: formatearUsd(totalUsd), sub: formatearCup(totalCup) },
    { etiqueta: 'Ganancia', valor: formatearUsd(ganancia), sub: 'ingresos − costo de piezas' },
    { etiqueta: 'Equipos entregados', valor: String(entregadas), sub: 'en el período' },
    {
      etiqueta: 'Ticket promedio',
      valor: formatearUsd(entregadas ? Math.round((totalUsd / entregadas) * 100) / 100 : 0),
      sub: 'por equipo entregado',
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Los ingresos se cuentan al entregar el equipo, con la tasa del día en que se recibió."
        acciones={
          <nav
            aria-label="Período"
            className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-slate-300"
          >
            {PERIODOS.map((p) => (
              <Link
                key={p.meses}
                href={`/reportes?meses=${p.meses}`}
                aria-current={p.meses === meses ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  p.meses === meses
                    ? 'bg-marca-700 text-white'
                    : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                {p.etiqueta}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.etiqueta} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{k.etiqueta}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{k.valor}</p>
            <p className="text-xs text-slate-500 tabular-nums">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Ingresos por mes"
            descripcion="USD; pase el cursor para ver CUP y ganancia"
          />
          <CuerpoTarjeta>
            {ingresos.length ? (
              <Barras
                resumen="Ingresos mensuales en USD"
                datos={ingresos.map((i) => {
                  const [a, m] = i.mes.split('-');
                  return {
                    etiqueta: `${NOMBRE_MES[Number(m) - 1]} ${a}`,
                    valor: i.ingresos_usd,
                    texto: formatearUsd(i.ingresos_usd),
                    detalle: `${formatearCup(Number(i.ingresos_cup))} · ganancia ${formatearUsd(i.ganancia_usd)} · ${i.ordenes} equipos`,
                  };
                })}
              />
            ) : (
              <Vacio titulo="Sin entregas en este período" />
            )}
          </CuerpoTarjeta>
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta
            titulo="Órdenes por estado"
            descripcion="Situación actual de todas las órdenes"
          />
          <CuerpoTarjeta>
            <Barras
              resumen="Número de órdenes en cada estado"
              datos={ESTADOS_ORDEN.filter((e) => conteo.has(e)).map((e) => ({
                etiqueta: ETIQUETA_ESTADO[e],
                valor: conteo.get(e) ?? 0,
                texto: String(conteo.get(e) ?? 0),
              }))}
            />
          </CuerpoTarjeta>
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <CabeceraTarjeta
            titulo="Rendimiento por técnico"
            descripcion="Retornos: reparaciones que volvieron en garantía"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                    Técnico
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    En curso
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Entregadas
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Días promedio
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Retornos
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                    Facturado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tecnicos.map((t) => {
                  const tasaRetorno = t.entregadas
                    ? Math.round((t.retornos_garantia / t.entregadas) * 100)
                    : 0;
                  return (
                    <tr key={t.tecnico_id}>
                      <th
                        scope="row"
                        className="px-4 py-2.5 text-left font-medium text-slate-900 sm:px-5"
                      >
                        {t.nombre}
                      </th>
                      <td className="px-3 py-2.5 text-right tabular-nums">{t.en_curso}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{t.entregadas}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t.dias_promedio ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {t.retornos_garantia}{' '}
                        <span className="text-xs text-slate-500">({tasaRetorno} %)</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums sm:px-5">
                        {formatearUsd(t.ingresos_usd)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <CabeceraTarjeta
            titulo="Ganancia por pieza"
            descripcion="Piezas usadas en equipos entregados (histórico)"
          />
          {piezas.length === 0 ? (
            <Vacio titulo="Aún no se han usado piezas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                      Pieza
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Unidades
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Ventas
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Costo
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                      Ganancia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {piezas.slice(0, 15).map((p) => (
                    <tr key={p.pieza_id}>
                      <th scope="row" className="px-4 py-2.5 text-left font-normal sm:px-5">
                        <Link
                          href={`/inventario/${p.pieza_id}`}
                          className="font-medium text-slate-900 hover:text-marca-700"
                        >
                          {p.nombre}
                        </Link>
                        <span className="block text-xs text-slate-500">
                          {ETIQUETA_CATEGORIA[p.categoria]}
                        </span>
                      </th>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.unidades}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatearUsd(p.ingresos_usd)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatearUsd(p.costo_usd)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums sm:px-5">
                        {formatearUsd(p.ganancia_usd)}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({margenPorcentaje(p.costo_usd, p.ingresos_usd)} %)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
