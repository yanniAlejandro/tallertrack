import { Insignia } from '@/components/ui/insignia';
import { nivelStock } from '@/domain/inventario';

export function InsigniaStock({ stock, minimo }: { stock: number; minimo: number }) {
  const nivel = nivelStock(stock, minimo);
  if (nivel === 'agotado') return <Insignia tono="peligro">Agotada</Insignia>;
  if (nivel === 'bajo') return <Insignia tono="aviso">{stock} · stock bajo</Insignia>;
  return <Insignia tono="exito">{stock} en stock</Insignia>;
}
