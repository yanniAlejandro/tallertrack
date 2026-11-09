import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { envServidor } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Cliente con service role: SALTA RLS. Usar solo en el servidor y solo
 * para tareas administrativas acotadas (restablecer la demo).
 */
export function crearClienteAdmin() {
  const env = envServidor();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
