'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { erroresDeZod, type ResultadoAccion } from '@/server/resultado';

const esquemaLogin = z.object({
  email: z.email({ error: 'Escriba un correo válido' }),
  password: z.string().min(6, { error: 'La contraseña tiene al menos 6 caracteres' }),
  volver: z.string().optional(),
});

/** Evita redirecciones abiertas: solo rutas internas del panel. */
function destinoSeguro(volver: string | undefined): string {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
}

export async function iniciarSesion(
  _previo: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const r = esquemaLogin.safeParse({
    email: fd.get('email'),
    password: fd.get('password'),
    volver: fd.get('volver') ?? undefined,
  });
  if (!r.success) return { ok: false, error: 'Revise los datos', errores: erroresDeZod(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: r.data.email,
    password: r.data.password,
  });
  if (error) {
    return {
      ok: false,
      error:
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Compruebe su conexión e inténtelo de nuevo.',
    };
  }
  redirect(destinoSeguro(r.data.volver));
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect('/login');
}
