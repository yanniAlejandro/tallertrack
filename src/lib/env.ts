import { z } from 'zod';

/**
 * Variables de entorno validadas. Si falta algo, el error dice exactamente
 * qué variable revisar en lugar de fallar más tarde con un mensaje críptico.
 */

const esquemaPublico = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const esquemaServidor = esquemaPublico.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  DEVICE_SECRET_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'Debe tener 64 caracteres hexadecimales (32 bytes)'),
});

function formatearError(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
}

// Next solo incrusta en el cliente las NEXT_PUBLIC_* referenciadas de forma literal.
const valoresPublicos = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
};

let cachePublico: z.infer<typeof esquemaPublico> | undefined;
let cacheServidor: z.infer<typeof esquemaServidor> | undefined;

export function envPublico() {
  if (!cachePublico) {
    const r = esquemaPublico.safeParse(valoresPublicos);
    if (!r.success) {
      throw new Error(`Variables de entorno públicas inválidas:\n${formatearError(r.error)}`);
    }
    cachePublico = r.data;
  }
  return cachePublico;
}

/** Solo usar en el servidor: incluye secretos. */
export function envServidor() {
  if (typeof window !== 'undefined') {
    throw new Error('envServidor() no puede usarse en el navegador');
  }
  if (!cacheServidor) {
    const r = esquemaServidor.safeParse({
      ...valoresPublicos,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DEVICE_SECRET_KEY: process.env.DEVICE_SECRET_KEY,
    });
    if (!r.success) {
      throw new Error(`Variables de entorno del servidor inválidas:\n${formatearError(r.error)}`);
    }
    cacheServidor = r.data;
  }
  return cacheServidor;
}

export const esModoDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
