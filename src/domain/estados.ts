/**
 * Máquina de estados de una orden de servicio.
 * Debe mantenerse en sincronía con `public.transicion_valida()` en
 * supabase/migrations/20261109000300_flujo_ordenes.sql.
 */

export const ESTADOS_ORDEN = [
  'recibido',
  'diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'esperando_pieza',
  'listo',
  'entregado',
  'cancelado',
  'no_reparable',
] as const;

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: 'Recibido',
  diagnostico: 'En diagnóstico',
  esperando_aprobacion: 'Esperando aprobación',
  en_reparacion: 'En reparación',
  esperando_pieza: 'Esperando pieza',
  listo: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  no_reparable: 'No reparable',
};

/** Tono visual del estado (se traduce a clases en el componente Badge). */
export type TonoEstado = 'neutro' | 'info' | 'aviso' | 'progreso' | 'exito' | 'peligro';

export const TONO_ESTADO: Record<EstadoOrden, TonoEstado> = {
  recibido: 'neutro',
  diagnostico: 'info',
  esperando_aprobacion: 'aviso',
  en_reparacion: 'progreso',
  esperando_pieza: 'aviso',
  listo: 'exito',
  entregado: 'neutro',
  cancelado: 'peligro',
  no_reparable: 'peligro',
};

export const TRANSICIONES: Record<EstadoOrden, readonly EstadoOrden[]> = {
  recibido: ['diagnostico', 'cancelado'],
  diagnostico: ['esperando_aprobacion', 'en_reparacion', 'no_reparable', 'cancelado'],
  esperando_aprobacion: ['en_reparacion', 'cancelado'],
  en_reparacion: ['esperando_pieza', 'listo', 'no_reparable'],
  esperando_pieza: ['en_reparacion', 'cancelado'],
  listo: ['entregado', 'en_reparacion'],
  no_reparable: ['entregado'],
  cancelado: ['entregado'],
  entregado: [],
};

export function esEstadoOrden(valor: unknown): valor is EstadoOrden {
  return typeof valor === 'string' && (ESTADOS_ORDEN as readonly string[]).includes(valor);
}

export function puedeTransicionar(desde: EstadoOrden, hacia: EstadoOrden): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function siguientesEstados(desde: EstadoOrden): readonly EstadoOrden[] {
  return TRANSICIONES[desde];
}

/** Estados en los que el equipo sigue dentro del taller y requiere trabajo. */
export const ESTADOS_ACTIVOS: readonly EstadoOrden[] = [
  'recibido',
  'diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'esperando_pieza',
  'listo',
];

export function estaActiva(estado: EstadoOrden): boolean {
  return ESTADOS_ACTIVOS.includes(estado);
}

/** Una orden cerrada ya no admite piezas ni cambios de presupuesto. */
export function estaCerrada(estado: EstadoOrden): boolean {
  return estado === 'entregado' || estado === 'cancelado' || estado === 'no_reparable';
}

/** Paso visual (1..5) para la barra de progreso de la página pública. */
export function pasoProgreso(estado: EstadoOrden): number {
  switch (estado) {
    case 'recibido':
      return 1;
    case 'diagnostico':
    case 'esperando_aprobacion':
      return 2;
    case 'en_reparacion':
    case 'esperando_pieza':
      return 3;
    case 'listo':
    case 'no_reparable':
    case 'cancelado':
      return 4;
    case 'entregado':
      return 5;
  }
}
