import { margenPorcentaje, multiplicarUsd, sumarUsd } from './dinero';

export const CATEGORIAS_PIEZA = [
  'pantalla',
  'bateria',
  'puerto_carga',
  'camara',
  'flex',
  'otro',
] as const;

export type CategoriaPieza = (typeof CATEGORIAS_PIEZA)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaPieza, string> = {
  pantalla: 'Pantalla',
  bateria: 'Batería',
  puerto_carga: 'Puerto de carga',
  camara: 'Cámara',
  flex: 'Flex',
  otro: 'Otro',
};

export type NivelStock = 'agotado' | 'bajo' | 'ok';

export function nivelStock(stock: number, minimo: number): NivelStock {
  if (stock <= 0) return 'agotado';
  if (stock <= minimo) return 'bajo';
  return 'ok';
}

export type ResultadoUso = { ok: true; stockRestante: number } | { ok: false; motivo: string };

/** Replica la validación de `public.usar_pieza()` para dar feedback inmediato. */
export function validarUsoPieza(stock: number, cantidad: number): ResultadoUso {
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return { ok: false, motivo: 'La cantidad debe ser un número entero mayor que cero.' };
  }
  if (cantidad > stock) {
    return {
      ok: false,
      motivo: stock === 0 ? 'No queda stock de esta pieza.' : `Solo quedan ${stock} unidad(es).`,
    };
  }
  return { ok: true, stockRestante: stock - cantidad };
}

export interface LineaPieza {
  cantidad: number;
  costoUnitUsd: number;
  precioUnitUsd: number;
}

export interface TotalesOrden {
  piezasUsd: number;
  costoPiezasUsd: number;
  manoObraUsd: number;
  totalUsd: number;
  gananciaUsd: number;
}

export function totalesOrden(lineas: readonly LineaPieza[], manoObraUsd: number): TotalesOrden {
  const piezasUsd = sumarUsd(...lineas.map((l) => multiplicarUsd(l.precioUnitUsd, l.cantidad)));
  const costoPiezasUsd = sumarUsd(...lineas.map((l) => multiplicarUsd(l.costoUnitUsd, l.cantidad)));
  const totalUsd = sumarUsd(piezasUsd, manoObraUsd);
  return {
    piezasUsd,
    costoPiezasUsd,
    manoObraUsd,
    totalUsd,
    gananciaUsd: sumarUsd(totalUsd, -costoPiezasUsd),
  };
}

export function gananciaPieza(costo: number, precio: number) {
  return { gananciaUsd: sumarUsd(precio, -costo), margen: margenPorcentaje(costo, precio) };
}
