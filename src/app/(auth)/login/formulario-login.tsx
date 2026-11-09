'use client';

import { useRef } from 'react';
import { KeyRound } from 'lucide-react';
import { iniciarSesion } from '@/server/acciones/auth';
import { useAccion } from '@/components/ui/use-accion';
import { Campo, Entrada } from '@/components/ui/campo';
import { BotonEnviar } from '@/components/ui/boton-enviar';
import { Aviso } from '@/components/ui/aviso';

export const CREDENCIALES_DEMO = { email: 'admin@demo.cu', password: 'demo1234' };

export function FormularioLogin({ volver, demo }: { volver: string | undefined; demo: boolean }) {
  const { estado, errores, onSubmit, pendiente } = useAccion(iniciarSesion);
  const form = useRef<HTMLFormElement>(null);

  function usarDemo() {
    const f = form.current;
    if (!f) return;
    (f.elements.namedItem('email') as HTMLInputElement).value = CREDENCIALES_DEMO.email;
    (f.elements.namedItem('password') as HTMLInputElement).value = CREDENCIALES_DEMO.password;
    f.requestSubmit();
  }

  return (
    <div className="space-y-5">
      {demo && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4" aria-hidden /> Credenciales de la demo
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-amber-700">Correo</dt>
            <dd className="font-mono">{CREDENCIALES_DEMO.email}</dd>
            <dt className="text-amber-700">Contraseña</dt>
            <dd className="font-mono">{CREDENCIALES_DEMO.password}</dd>
          </dl>
          <button
            type="button"
            onClick={usarDemo}
            className="mt-3 w-full rounded-lg bg-amber-200/70 px-3 py-2 font-semibold hover:bg-amber-200"
          >
            Entrar con la cuenta demo
          </button>
        </div>
      )}

      <form ref={form} onSubmit={onSubmit} className="space-y-4" noValidate>
        {volver && <input type="hidden" name="volver" value={volver} />}
        {!estado.ok && !errores && <Aviso tipo="error">{estado.error}</Aviso>}
        <Campo etiqueta="Correo electrónico" nombre="email" error={errores?.email}>
          {(p) => (
            <Entrada {...p} type="email" autoComplete="username" inputMode="email" required />
          )}
        </Campo>
        <Campo etiqueta="Contraseña" nombre="password" error={errores?.password}>
          {(p) => <Entrada {...p} type="password" autoComplete="current-password" required />}
        </Campo>
        <BotonEnviar pendiente={pendiente} className="w-full" tamano="lg" textoCargando="Entrando…">
          Entrar
        </BotonEnviar>
      </form>
    </div>
  );
}
