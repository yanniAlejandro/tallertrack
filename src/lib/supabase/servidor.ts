import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { envPublico } from '@/lib/env';
import type { Database } from '@/types/database';

/** Cliente con la sesión del usuario (respeta RLS). Para Server Components y Actions. */
export async function crearClienteServidor() {
  const almacen = await cookies();
  const env = envPublico();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) almacen.set(name, value, options);
          } catch {
            // Llamado desde un Server Component: el proxy se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}

/** Cliente anónimo sin cookies, para páginas públicas (estado de una orden). */
export function crearClientePublico() {
  const env = envPublico();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
