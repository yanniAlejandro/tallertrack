import 'server-only';
import { z } from 'zod';
import { crearClientePublico } from '@/lib/supabase/servidor';
import { ESTADOS_ORDEN } from '@/domain/estados';

const esquemaEstadoPublico = z.object({
  codigo: z.string(),
  estado: z.enum(ESTADOS_ORDEN),
  equipo: z.string(),
  tipo_equipo: z.string(),
  cliente: z.string(),
  fecha_recepcion: z.string(),
  fecha_prometida: z.string().nullable(),
  entregada_en: z.string().nullable(),
  garantia_hasta: z.string().nullable(),
  es_garantia: z.boolean(),
  presupuesto_usd: z.coerce.number(),
  tasa_aplicada: z.coerce.number(),
  eventos: z.array(
    z.object({
      estado: z.enum(ESTADOS_ORDEN).nullable(),
      texto: z.string().nullable(),
      fecha: z.string(),
    }),
  ),
  negocio: z.object({ nombre: z.string(), direccion: z.string(), whatsapp: z.string() }).nullable(),
});

export type EstadoPublico = z.infer<typeof esquemaEstadoPublico>;

/**
 * Consulta anónima (sin sesión) del estado de una orden por su código.
 * Solo usa la RPC estado_publico(), que ya filtra los datos sensibles.
 */
export async function consultarEstadoPublico(codigo: string): Promise<EstadoPublico | null> {
  const supabase = crearClientePublico();
  const { data, error } = await supabase.rpc('estado_publico', { p_codigo: codigo });
  if (error) throw error;
  if (!data) return null;
  return esquemaEstadoPublico.parse(data);
}
