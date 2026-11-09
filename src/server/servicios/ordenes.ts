import 'server-only';
import { esquemaCliente, esquemaEquipo, esquemaOrden } from '@/domain/esquemas';
import { validarDesbloqueo } from '@/domain/desbloqueo';
import { cifrarDesbloqueo } from '@/server/cripto';
import { crearCliente, crearEquipo } from '@/server/repositorios/clientes';
import { insertarOrden } from '@/server/repositorios/ordenes';
import { valorTasaVigente } from '@/server/repositorios/ajustes';
import { erroresDeZod, mensajeErrorBD } from '@/server/resultado';

type Entrada = Record<string, string | string[]>;

export type ResultadoRecepcion =
  | { ok: true; id: string; codigo: string }
  | { ok: false; error: string; errores?: Record<string, string> };

function prefijado(entrada: Entrada, prefijo: string): Entrada {
  return Object.fromEntries(
    Object.entries(entrada)
      .filter(([k]) => k.startsWith(prefijo))
      .map(([k, v]) => [k.slice(prefijo.length), v]),
  );
}

/**
 * Caso de uso "recibir un equipo": valida todo primero y solo entonces
 * crea, en orden, el cliente (si es nuevo), el equipo (si es nuevo) y la orden.
 * La tasa de cambio vigente se congela en la orden.
 */
export async function recibirEquipo(
  entrada: Entrada,
  usuarioId: string,
): Promise<ResultadoRecepcion> {
  const clienteId = typeof entrada.cliente_id === 'string' ? entrada.cliente_id : '';
  const equipoId = typeof entrada.equipo_id === 'string' ? entrada.equipo_id : '';
  const errores: Record<string, string> = {};

  const cliente = clienteId ? null : esquemaCliente.safeParse(prefijado(entrada, 'cliente_'));
  if (cliente && !cliente.success) {
    for (const [k, v] of Object.entries(erroresDeZod(cliente.error))) errores[`cliente_${k}`] = v;
  }

  const equipo =
    equipoId && equipoId !== 'nuevo'
      ? null
      : esquemaEquipo.safeParse(prefijado(entrada, 'equipo_'));
  if (equipo && !equipo.success) {
    for (const [k, v] of Object.entries(erroresDeZod(equipo.error))) errores[`equipo_${k}`] = v;
  }

  const accesorios = entrada.accesorios;
  const orden = esquemaOrden.safeParse({
    ...entrada,
    accesorios: Array.isArray(accesorios) ? accesorios : accesorios ? [accesorios] : [],
  });
  if (!orden.success) Object.assign(errores, erroresDeZod(orden.error));

  let desbloqueoCifrado: string | null = null;
  if (orden.success) {
    const d = validarDesbloqueo(orden.data.desbloqueo_tipo, orden.data.desbloqueo_valor);
    if (!d.ok) errores.desbloqueo_valor = d.motivo;
    else if (d.valor) desbloqueoCifrado = cifrarDesbloqueo(d.valor);
  }

  if (Object.keys(errores).length > 0 || !orden.success) {
    return { ok: false, error: 'Revise los campos marcados.', errores };
  }

  let idCliente = clienteId;
  if (cliente?.success) {
    const r = await crearCliente(cliente.data);
    if (r.error) return { ok: false, error: mensajeErrorBD(r.error) };
    idCliente = r.data.id;
  }

  let idEquipo = equipoId;
  if (equipo?.success) {
    const r = await crearEquipo(idCliente, equipo.data);
    if (r.error) return { ok: false, error: mensajeErrorBD(r.error) };
    idEquipo = r.data.id;
  }

  const { desbloqueo_valor: _omitido, ...datosOrden } = orden.data;
  const r = await insertarOrden({
    ...datosOrden,
    desbloqueo_cifrado: desbloqueoCifrado,
    desbloqueo_tipo: desbloqueoCifrado ? datosOrden.desbloqueo_tipo : 'ninguno',
    cliente_id: idCliente,
    equipo_id: idEquipo,
    tasa_aplicada: await valorTasaVigente(),
    creado_por: usuarioId,
  });
  if (r.error) return { ok: false, error: mensajeErrorBD(r.error) };
  return { ok: true, id: r.data.id, codigo: r.data.codigo };
}
