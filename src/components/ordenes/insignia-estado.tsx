import { Insignia } from '@/components/ui/insignia';
import { ETIQUETA_ESTADO, TONO_ESTADO, type EstadoOrden } from '@/domain/estados';

export function InsigniaEstado({ estado }: { estado: EstadoOrden }) {
  return <Insignia tono={TONO_ESTADO[estado]}>{ETIQUETA_ESTADO[estado]}</Insignia>;
}
