'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { crearOrden } from '@/server/acciones/ordenes';
import { useAccion } from '@/components/ui/use-accion';
import {
  ACCESORIOS,
  ETIQUETA_TIPO_EQUIPO,
  MUNICIPIOS_HABANA,
  TIPOS_EQUIPO,
} from '@/domain/esquemas';
import { ETIQUETA_DESBLOQUEO, TIPOS_DESBLOQUEO, type TipoDesbloqueo } from '@/domain/desbloqueo';
import { esTasaValida, formatearCup, usdACup } from '@/domain/dinero';
import { AreaTexto, Campo, Entrada, Selector } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/components/ui/tarjeta';
import { SelectorPatron } from './selector-patron';

interface Props {
  cliente: { id: string; nombre: string; telefono: string } | null;
  equipos: Array<{ id: string; marca: string; modelo: string; imei_serie: string | null }>;
  tecnicos: Array<{ id: string; nombre: string }>;
  tasa: number;
  diasGarantia: number;
  fechaSugerida: string;
}

export function FormularioRecepcion({
  cliente,
  equipos,
  tecnicos,
  tasa,
  diasGarantia,
  fechaSugerida,
}: Props) {
  const { estado, errores: e, onSubmit, pendiente } = useAccion(crearOrden);
  const [equipoId, setEquipoId] = useState(equipos[0]?.id ?? 'nuevo');
  const [desbloqueo, setDesbloqueo] = useState<TipoDesbloqueo>('ninguno');
  const [presupuesto, setPresupuesto] = useState('');

  const usd = Number(presupuesto);
  const cup =
    presupuesto && Number.isFinite(usd) && usd >= 0 && esTasaValida(tasa)
      ? usdACup(usd, tasa)
      : null;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {!estado.ok && <Aviso tipo="error">{estado.error}</Aviso>}

      {/* Cliente nuevo (si no se eligió uno existente) */}
      {cliente ? (
        <input type="hidden" name="cliente_id" value={cliente.id} />
      ) : (
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Cliente nuevo"
            descripcion="Si ya es cliente, búsquelo arriba."
          />
          <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nombre y apellidos"
              nombre="cliente_nombre"
              error={e?.cliente_nombre}
              className="sm:col-span-2"
            >
              {(p) => <Entrada {...p} autoComplete="off" required />}
            </Campo>
            <Campo
              etiqueta="Teléfono (WhatsApp)"
              nombre="cliente_telefono"
              error={e?.cliente_telefono}
            >
              {(p) => (
                <Entrada {...p} type="tel" inputMode="tel" placeholder="5 234 5678" required />
              )}
            </Campo>
            <Campo
              etiqueta="Carné de identidad"
              nombre="cliente_carne"
              error={e?.cliente_carne}
              opcional
            >
              {(p) => <Entrada {...p} inputMode="numeric" maxLength={13} />}
            </Campo>
            <Campo etiqueta="Municipio" nombre="cliente_municipio" opcional>
              {(p) => (
                <Selector {...p} defaultValue="Cerro">
                  {MUNICIPIOS_HABANA.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                  <option>Fuera de La Habana</option>
                </Selector>
              )}
            </Campo>
          </CuerpoTarjeta>
        </Tarjeta>
      )}

      {/* Equipo */}
      <Tarjeta>
        <CabeceraTarjeta titulo="Equipo" />
        <CuerpoTarjeta className="space-y-4">
          {equipos.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-slate-700">
                Equipos de {cliente?.nombre.split(' ')[0]}
              </legend>
              {[
                ...equipos,
                { id: 'nuevo', marca: 'Otro equipo', modelo: '', imei_serie: null },
              ].map((eq) => (
                <label
                  key={eq.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-slate-200 ring-inset has-checked:bg-marca-50 has-checked:ring-marca-400"
                >
                  <input
                    type="radio"
                    name="equipo_id"
                    value={eq.id}
                    checked={equipoId === eq.id}
                    onChange={() => setEquipoId(eq.id)}
                    className="accent-marca-700"
                  />
                  <span className="text-sm">
                    <span className="font-medium">
                      {eq.marca} {eq.modelo}
                    </span>
                    {eq.imei_serie && (
                      <span className="ml-2 font-mono text-xs text-slate-500">{eq.imei_serie}</span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {equipos.length === 0 && <input type="hidden" name="equipo_id" value="nuevo" />}

          {equipoId === 'nuevo' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo" nombre="equipo_tipo" error={e?.equipo_tipo}>
                {(p) => (
                  <Selector {...p} defaultValue="celular">
                    {TIPOS_EQUIPO.map((t) => (
                      <option key={t} value={t}>
                        {ETIQUETA_TIPO_EQUIPO[t]}
                      </option>
                    ))}
                  </Selector>
                )}
              </Campo>
              <Campo etiqueta="Marca" nombre="equipo_marca" error={e?.equipo_marca}>
                {(p) => (
                  <Entrada {...p} list="marcas" placeholder="Samsung, Xiaomi, Apple…" required />
                )}
              </Campo>
              <Campo etiqueta="Modelo" nombre="equipo_modelo" error={e?.equipo_modelo}>
                {(p) => <Entrada {...p} placeholder="Galaxy A12" required />}
              </Campo>
              <Campo etiqueta="Color" nombre="equipo_color" opcional>
                {(p) => <Entrada {...p} />}
              </Campo>
              <Campo
                etiqueta="IMEI o número de serie"
                nombre="equipo_imei_serie"
                error={e?.equipo_imei_serie}
                ayuda="Marque *#06# en el teléfono para ver el IMEI"
                className="sm:col-span-2"
                opcional
              >
                {(p) => <Entrada {...p} inputMode="numeric" className="font-mono" />}
              </Campo>
              <datalist id="marcas">
                {[
                  'Samsung',
                  'Xiaomi',
                  'Apple',
                  'Motorola',
                  'Huawei',
                  'Honor',
                  'Oppo',
                  'Realme',
                  'Lenovo',
                ].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          )}
        </CuerpoTarjeta>
      </Tarjeta>

      {/* Recepción */}
      <Tarjeta>
        <CabeceraTarjeta titulo="Recepción" />
        <CuerpoTarjeta className="space-y-4">
          <Campo
            etiqueta="Falla que reporta el cliente"
            nombre="falla_reportada"
            error={e?.falla_reportada}
          >
            {(p) => (
              <AreaTexto
                {...p}
                rows={2}
                placeholder="Ej. Se cayó y la pantalla no da imagen"
                required
              />
            )}
          </Campo>
          <Campo
            etiqueta="Estado físico al recibirlo"
            nombre="estado_fisico"
            ayuda="Rayones, golpes, piezas faltantes… Protege al taller ante reclamaciones."
          >
            {(p) => <AreaTexto {...p} rows={2} />}
          </Campo>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Accesorios que deja</legend>
            <div className="flex flex-wrap gap-2">
              {ACCESORIOS.map((a) => (
                <label
                  key={a}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-slate-300 ring-inset has-checked:bg-marca-50 has-checked:ring-marca-400"
                >
                  <input type="checkbox" name="accesorios" value={a} className="accent-marca-700" />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 ring-inset">
            <legend className="sr-only">Desbloqueo</legend>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Lock className="size-4" aria-hidden /> Desbloqueo del equipo
              <span className="font-normal text-slate-500">(se guarda cifrado)</span>
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {TIPOS_DESBLOQUEO.map((t) => (
                <label
                  key={t}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-300 ring-inset has-checked:ring-2 has-checked:ring-marca-500"
                >
                  <input
                    type="radio"
                    name="desbloqueo_tipo"
                    value={t}
                    checked={desbloqueo === t}
                    onChange={() => setDesbloqueo(t)}
                    className="accent-marca-700"
                  />
                  {ETIQUETA_DESBLOQUEO[t]}
                </label>
              ))}
            </div>
            {desbloqueo === 'patron' && (
              <SelectorPatron nombre="desbloqueo_valor" error={e?.desbloqueo_valor} />
            )}
            {(desbloqueo === 'pin' || desbloqueo === 'contrasena') && (
              <Campo
                etiqueta={ETIQUETA_DESBLOQUEO[desbloqueo]}
                nombre="desbloqueo_valor"
                error={e?.desbloqueo_valor}
              >
                {(p) => (
                  <Entrada
                    {...p}
                    autoComplete="off"
                    inputMode={desbloqueo === 'pin' ? 'numeric' : 'text'}
                    className="max-w-xs font-mono"
                  />
                )}
              </Campo>
            )}
          </fieldset>
        </CuerpoTarjeta>
      </Tarjeta>

      {/* Presupuesto y asignación */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Presupuesto y entrega"
          descripcion={`Tasa del día: 1 USD = ${formatearCup(tasa)}`}
        />
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Presupuesto estimado (USD)"
            nombre="presupuesto_usd"
            error={e?.presupuesto_usd}
            ayuda={
              cup !== null ? `≈ ${formatearCup(cup)}` : 'Puede dejarlo en 0 hasta diagnosticar'
            }
          >
            {(p) => (
              <Entrada
                {...p}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={presupuesto}
                onChange={(ev) => setPresupuesto(ev.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Técnico asignado" nombre="tecnico_id" error={e?.tecnico_id}>
            {(p) => (
              <Selector {...p} defaultValue="">
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Fecha prometida" nombre="fecha_prometida" error={e?.fecha_prometida}>
            {(p) => <Entrada {...p} type="date" defaultValue={fechaSugerida} />}
          </Campo>
          <Campo etiqueta="Días de garantía" nombre="dias_garantia" error={e?.dias_garantia}>
            {(p) => (
              <Entrada
                {...p}
                type="number"
                inputMode="numeric"
                min={0}
                max={365}
                defaultValue={diasGarantia}
              />
            )}
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <BotonEnviar
          pendiente={pendiente}
          tamano="lg"
          textoCargando="Registrando…"
          className="shadow-lg"
        >
          Registrar y generar ticket
        </BotonEnviar>
      </div>
    </form>
  );
}
