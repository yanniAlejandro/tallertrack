import type { NextRequest } from 'next/server';
import { actualizarSesion } from '@/lib/supabase/sesion-proxy';

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Todo excepto estáticos e imágenes (el ticket PDF sí pasa: requiere sesión).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
