/**
 * Datos de desbloqueo que deja el cliente (PIN, contraseña o patrón).
 * El patrón se guarda como la secuencia de puntos de una rejilla 3×3,
 * numerados del 1 al 9 de izquierda a derecha y de arriba abajo: "1-4-7-8-9".
 * El valor se cifra en el servidor antes de guardarse (ver server/cripto.ts).
 */

export const TIPOS_DESBLOQUEO = ['ninguno', 'pin', 'contrasena', 'patron'] as const;
export type TipoDesbloqueo = (typeof TIPOS_DESBLOQUEO)[number];

export const ETIQUETA_DESBLOQUEO: Record<TipoDesbloqueo, string> = {
  ninguno: 'Sin bloqueo',
  pin: 'PIN',
  contrasena: 'Contraseña',
  patron: 'Patrón',
};

export function parsearPatron(valor: string): number[] | null {
  const puntos = valor
    .split(/[-,\s]+/)
    .filter(Boolean)
    .map(Number);
  if (puntos.length < 4 || puntos.length > 9) return null;
  if (puntos.some((p) => !Number.isInteger(p) || p < 1 || p > 9)) return null;
  if (new Set(puntos).size !== puntos.length) return null;
  return puntos;
}

export function serializarPatron(puntos: readonly number[]): string {
  return puntos.join('-');
}

export type ValidacionDesbloqueo =
  { ok: true; valor: string | null } | { ok: false; motivo: string };

export function validarDesbloqueo(tipo: TipoDesbloqueo, valor: string): ValidacionDesbloqueo {
  const v = valor.trim();
  switch (tipo) {
    case 'ninguno':
      return { ok: true, valor: null };
    case 'pin':
      return /^\d{4,8}$/.test(v)
        ? { ok: true, valor: v }
        : { ok: false, motivo: 'El PIN debe tener entre 4 y 8 dígitos.' };
    case 'contrasena':
      return v.length >= 1 && v.length <= 64
        ? { ok: true, valor: v }
        : { ok: false, motivo: 'Escriba la contraseña (máximo 64 caracteres).' };
    case 'patron': {
      const puntos = parsearPatron(v);
      return puntos
        ? { ok: true, valor: serializarPatron(puntos) }
        : { ok: false, motivo: 'El patrón debe unir entre 4 y 9 puntos distintos.' };
    }
  }
}
