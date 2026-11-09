import type { Metadata } from 'next';
import { EncabezadoPagina } from '@/components/ui/encabezado-pagina';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { Insignia } from '@/components/ui/insignia';
import {
  BotonRestablecerDemo,
  FormularioNegocio,
  FormularioTasa,
} from '@/components/ajustes/formularios-ajustes';
import { historialTasas, obtenerAjustes, obtenerTasaVigente } from '@/server/repositorios/ajustes';
import { listarPersonal } from '@/server/repositorios/perfiles';
import { ETIQUETA_ROL, requerirPerfil } from '@/server/sesion';
import { formatearCup } from '@/domain/dinero';
import { formatearFechaHora } from '@/domain/fechas';
import { esModoDemo } from '@/lib/env';

export const metadata: Metadata = { title: 'Ajustes' };

export default async function Ajustes() {
  const [perfil, ajustes, tasa, historial, personal] = await Promise.all([
    requerirPerfil(),
    obtenerAjustes(),
    obtenerTasaVigente(),
    historialTasas(),
    listarPersonal(),
  ]);
  const esAdmin = perfil.rol === 'admin';

  return (
    <>
      <EncabezadoPagina
        titulo="Ajustes"
        descripcion={esAdmin ? undefined : 'Solo el administrador puede modificar estos datos.'}
      />
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-5">
          <Tarjeta id="tasa">
            <CabeceraTarjeta
              titulo="Tasa de cambio"
              descripcion={
                tasa
                  ? `Vigente: 1 USD = ${formatearCup(tasa.cup_por_usd)} desde ${formatearFechaHora(tasa.vigente_desde)}`
                  : 'Aún no hay tasa registrada'
              }
            />
            <CuerpoTarjeta className="space-y-4">
              {esAdmin && <FormularioTasa actual={tasa?.cup_por_usd ?? null} />}
              {historial.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-700">Historial</p>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {historial.map((t) => (
                      <li key={t.id} className="flex justify-between gap-3 py-1.5">
                        <span className="text-slate-500">
                          {formatearFechaHora(t.vigente_desde)}
                          {t.autor && ` · ${t.autor.nombre.split(' ')[0]}`}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatearCup(t.cup_por_usd)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CuerpoTarjeta>
          </Tarjeta>

          {esAdmin && esModoDemo() && (
            <Tarjeta className="ring-amber-300">
              <CabeceraTarjeta
                titulo="Modo demo"
                descripcion="Vuelve a cargar los datos de ejemplo: 4 técnicos, 50 órdenes y 30 piezas."
              />
              <CuerpoTarjeta>
                <BotonRestablecerDemo />
              </CuerpoTarjeta>
            </Tarjeta>
          )}
        </div>

        <div className="space-y-5">
          {esAdmin && (
            <Tarjeta>
              <CabeceraTarjeta
                titulo="Datos del negocio"
                descripcion="Aparecen en el ticket y en la página del cliente."
              />
              <CuerpoTarjeta>
                <FormularioNegocio ajustes={ajustes} />
              </CuerpoTarjeta>
            </Tarjeta>
          )}
          <Tarjeta>
            <CabeceraTarjeta titulo="Personal" descripcion="Usuarios con acceso al panel" />
            <ul className="divide-y divide-slate-100">
              {personal.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5"
                >
                  <span>
                    <span className="block font-medium text-slate-900">{p.nombre}</span>
                    {p.telefono && <span className="text-xs text-slate-500">{p.telefono}</span>}
                  </span>
                  <span className="flex gap-2">
                    <Insignia tono={p.rol === 'admin' ? 'progreso' : 'neutro'}>
                      {ETIQUETA_ROL[p.rol]}
                    </Insignia>
                    {!p.activo && <Insignia tono="peligro">Inactivo</Insignia>}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
