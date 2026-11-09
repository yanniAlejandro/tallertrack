import { z } from 'zod';
import { ESTADOS_ORDEN } from './estados';
import { CATEGORIAS_PIEZA } from './inventario';
import { TIPOS_DESBLOQUEO } from './desbloqueo';
import { TASA_MAXIMA, TASA_MINIMA } from './dinero';
import { normalizarTelefonoCuba } from './whatsapp';
import { normalizarImei } from './garantia';

/**
 * Esquemas de validación compartidos por formularios y Server Actions.
 * Reciben strings de FormData y devuelven datos tipados y normalizados.
 */

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres` })
    .optional()
    .transform((v) => (v ? v : null));

const montoUsd = z.coerce
  .number({ error: 'Escriba un monto válido' })
  .min(0, { error: 'No puede ser negativo' })
  .max(100_000, { error: 'Monto demasiado alto' })
  .transform((v) => Math.round(v * 100) / 100);

const fechaOpcional = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.iso.date({ error: 'Fecha inválida' }).nullable());

export const TIPOS_EQUIPO = ['celular', 'tablet', 'laptop', 'reloj', 'otro'] as const;
export type TipoEquipo = (typeof TIPOS_EQUIPO)[number];
export const ETIQUETA_TIPO_EQUIPO: Record<TipoEquipo, string> = {
  celular: 'Celular',
  tablet: 'Tablet',
  laptop: 'Laptop',
  reloj: 'Reloj inteligente',
  otro: 'Otro',
};

export const MUNICIPIOS_HABANA = [
  'Arroyo Naranjo',
  'Boyeros',
  'Centro Habana',
  'Cerro',
  'Cotorro',
  'Diez de Octubre',
  'Guanabacoa',
  'Habana del Este',
  'Habana Vieja',
  'La Lisa',
  'Marianao',
  'Playa',
  'Plaza de la Revolución',
  'Regla',
  'San Miguel del Padrón',
] as const;

export const ACCESORIOS = [
  'Cargador',
  'Cable',
  'Funda',
  'Tarjeta SIM',
  'Tarjeta SD',
  'Caja',
  'Lápiz',
] as const;

export const telefonoCuba = z
  .string()
  .trim()
  .min(1, { error: 'El teléfono es obligatorio' })
  .refine((v) => normalizarTelefonoCuba(v) !== null, {
    error: 'Escriba un teléfono cubano válido (8 dígitos, ej. 5 234 5678)',
  })
  .transform((v) => normalizarTelefonoCuba(v)!.slice(2));

export const esquemaCliente = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { error: 'Escriba nombre y apellidos' })
    .max(120, { error: 'Máximo 120 caracteres' }),
  telefono: telefonoCuba,
  carne: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/\s/g, '') : null))
    .refine((v) => v === null || /^\d{11}$/.test(v), {
      error: 'El carné de identidad tiene 11 dígitos',
    }),
  municipio: textoOpcional(60),
  notas: textoOpcional(500),
});
export type DatosCliente = z.infer<typeof esquemaCliente>;

export const esquemaEquipo = z.object({
  tipo: z.enum(TIPOS_EQUIPO, { error: 'Seleccione el tipo de equipo' }),
  marca: z.string().trim().min(2, { error: 'Indique la marca' }).max(40),
  modelo: z.string().trim().min(1, { error: 'Indique el modelo' }).max(60),
  imei_serie: z
    .string()
    .optional()
    .transform((v) => (v ? normalizarImei(v) : null))
    .refine((v) => v === null || (v.length >= 6 && v.length <= 20), {
      error: 'IMEI o número de serie inválido',
    }),
  color: textoOpcional(30),
});
export type DatosEquipo = z.infer<typeof esquemaEquipo>;

export const esquemaOrden = z.object({
  falla_reportada: z
    .string()
    .trim()
    .min(5, { error: 'Describa la falla que reporta el cliente' })
    .max(1000),
  estado_fisico: z.string().trim().max(500).default(''),
  accesorios: z.array(z.string().trim().max(30)).max(10).default([]),
  desbloqueo_tipo: z.enum(TIPOS_DESBLOQUEO).default('ninguno'),
  desbloqueo_valor: z.string().default(''),
  presupuesto_usd: montoUsd.default(0),
  tecnico_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid({ error: 'Técnico inválido' }).nullable()),
  fecha_prometida: fechaOpcional,
  dias_garantia: z.coerce
    .number()
    .int({ error: 'Número entero de días' })
    .min(0)
    .max(365, { error: 'Máximo 365 días' }),
});
export type DatosOrden = z.infer<typeof esquemaOrden>;

export const esquemaCambioEstado = z.object({
  orden_id: z.uuid(),
  estado: z.enum(ESTADOS_ORDEN, { error: 'Seleccione el nuevo estado' }),
  nota: z.string().trim().max(500).default(''),
  visible_cliente: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});

export const esquemaNota = z.object({
  orden_id: z.uuid(),
  texto: z.string().trim().min(2, { error: 'Escriba la nota' }).max(1000),
  visible_cliente: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});

export const esquemaPresupuesto = z.object({
  orden_id: z.uuid(),
  presupuesto_usd: montoUsd,
  mano_obra_usd: montoUsd,
  tecnico_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid().nullable()),
  fecha_prometida: fechaOpcional,
});

export const esquemaPieza = z
  .object({
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{3,20}$/, { error: 'Use de 3 a 20 letras, números o guiones' }),
    nombre: z.string().trim().min(3, { error: 'Indique el nombre de la pieza' }).max(120),
    categoria: z.enum(CATEGORIAS_PIEZA, { error: 'Seleccione la categoría' }),
    compatible_con: z.string().trim().max(200).default(''),
    costo_usd: montoUsd,
    precio_usd: montoUsd,
    stock_minimo: z.coerce.number().int().min(0).max(999),
  })
  .refine((p) => p.precio_usd >= p.costo_usd, {
    error: 'El precio de venta no debería ser menor que el costo',
    path: ['precio_usd'],
  });
export type DatosPieza = z.infer<typeof esquemaPieza>;

export const esquemaTasa = z.object({
  cup_por_usd: z.coerce
    .number({ error: 'Escriba la tasa' })
    .min(TASA_MINIMA, { error: 'La tasa debe ser mayor que 1' })
    .max(TASA_MAXIMA, { error: 'Tasa fuera de rango' }),
});

export const esquemaAjustes = z.object({
  nombre_negocio: z.string().trim().min(2).max(80),
  direccion: z.string().trim().min(5).max(160),
  whatsapp: telefonoCuba,
  dias_garantia_default: z.coerce.number().int().min(0).max(365),
  pie_ticket: z.string().trim().max(300).default(''),
});

export const esquemaReapertura = z.object({
  orden_id: z.uuid(),
  falla: z.string().trim().min(5, { error: 'Describa la falla que reporta el cliente' }).max(1000),
});
