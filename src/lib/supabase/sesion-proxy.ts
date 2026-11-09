import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const RUTAS_PUBLICAS = [
  '/login',
  '/estado',
  '/offline',
  '/manifest.webmanifest',
  '/sw.js',
  '/icon',
  '/apple-icon',
];

function esPublica(ruta: string) {
  return RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
}

/**
 * Refresca la sesión de Supabase en cada petición y protege el panel:
 * sin sesión → /login; con sesión en /login → panel.
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  // getClaims() valida el JWT; no confiar en getSession() en el servidor.
  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims);
  const ruta = request.nextUrl.pathname;

  if (!autenticado && !esPublica(ruta)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = ruta === '/' ? '' : `?volver=${encodeURIComponent(ruta)}`;
    return NextResponse.redirect(url);
  }

  if (autenticado && ruta === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return respuesta;
}
