'use client';
import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';
import { Boton } from './boton';
import { Spinner } from './spinner';

type Props = ComponentProps<typeof Boton> & {
  textoCargando?: string;
  /** Estado de envío explícito (formularios con onSubmit en vez de action). */
  pendiente?: boolean;
};

/** Botón de envío que se deshabilita y muestra progreso mientras el formulario se procesa. */
export function BotonEnviar({
  children,
  textoCargando = 'Guardando…',
  disabled,
  pendiente,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const cargando = pendiente ?? pending;
  return (
    <Boton type="submit" disabled={cargando || disabled} aria-busy={cargando} {...props}>
      {cargando ? (
        <>
          <Spinner /> {textoCargando}
        </>
      ) : (
        children
      )}
    </Boton>
  );
}
