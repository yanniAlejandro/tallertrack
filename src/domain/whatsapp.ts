import { ETIQUETA_ESTADO, type EstadoOrden } from './estados';
import { formatearDoble } from './dinero';
import { formatearFecha, type FechaISO } from './fechas';

/**
 * Normaliza un teléfono cubano al formato internacional que espera wa.me
 * (solo dígitos, con prefijo 53). Devuelve null si no es un número válido.
 *  - "5 234 5678", "52345678", "+53 52345678", "0053 5234 5678" → "5352345678"
 */
export function normalizarTelefonoCuba(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.length === 10 && digitos.startsWith('53')) digitos = digitos.slice(2);
  // Móviles: 8 dígitos empezando por 5 o 6. Fijos de La Habana: 7 + 7 dígitos.
  if (/^[56]\d{7}$/.test(digitos) || /^7\d{7}$/.test(digitos)) {
    return `53${digitos}`;
  }
  return null;
}

export function enlaceWhatsApp(telefono: string, mensaje: string): string | null {
  const numero = normalizarTelefonoCuba(telefono);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export interface DatosAviso {
  clienteNombre: string;
  codigo: string;
  equipo: string;
  estado: EstadoOrden;
  totalUsd: number;
  tasa: number;
  fechaPrometida: FechaISO | null;
  garantiaHasta: FechaISO | null;
  urlEstado: string;
  negocio: string;
  direccion: string;
}

function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/** Mensaje pre-llenado para "Avisar al cliente", adaptado a cada estado. */
export function mensajeSegunEstado(d: DatosAviso): string {
  const saludo = `Hola, ${primerNombre(d.clienteNombre)}. Le escribimos de ${d.negocio}.`;
  const ref = `Orden ${d.codigo} (${d.equipo}).`;
  const seguimiento = `Puede ver el estado en: ${d.urlEstado}`;
  const precio = d.totalUsd > 0 ? formatearDoble(d.totalUsd, d.tasa) : null;

  let cuerpo: string;
  switch (d.estado) {
    case 'recibido':
      cuerpo = `Hemos recibido su equipo.${
        d.fechaPrometida ? ` Fecha estimada de entrega: ${formatearFecha(d.fechaPrometida)}.` : ''
      }`;
      break;
    case 'diagnostico':
      cuerpo = 'Su equipo está en diagnóstico. Le avisaremos en cuanto sepamos qué tiene.';
      break;
    case 'esperando_aprobacion':
      cuerpo = `Ya diagnosticamos su equipo.${
        precio ? ` El presupuesto de la reparación es ${precio}.` : ''
      } ¿Nos confirma si desea que procedamos?`;
      break;
    case 'en_reparacion':
      cuerpo = 'Su equipo ya está en reparación.';
      break;
    case 'esperando_pieza':
      cuerpo =
        'Estamos esperando una pieza para su equipo. Le avisaremos en cuanto llegue. Disculpe la demora.';
      break;
    case 'listo':
      cuerpo = `¡Su equipo está listo! Puede pasar a recogerlo en ${d.direccion}.${
        precio ? ` Total a pagar: ${precio}.` : ''
      } Recuerde traer su ticket de recepción.`;
      break;
    case 'entregado':
      cuerpo = `Gracias por confiar en nosotros.${
        d.garantiaHasta
          ? ` Su reparación tiene garantía hasta el ${formatearFecha(d.garantiaHasta)}.`
          : ''
      }`;
      break;
    case 'no_reparable':
      cuerpo = `Lamentablemente su equipo no tiene reparación. Puede pasar a recogerlo en ${d.direccion}.`;
      break;
    case 'cancelado':
      cuerpo = `La orden fue cancelada. Puede pasar a recoger su equipo en ${d.direccion}.`;
      break;
  }

  return [saludo, ref, cuerpo, seguimiento].join('\n\n');
}

export function etiquetaAviso(estado: EstadoOrden): string {
  return `Avisar: ${ETIQUETA_ESTADO[estado].toLowerCase()}`;
}
