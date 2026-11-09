import { Printer } from 'lucide-react';
import { clasesBoton } from '@/components/ui/boton';

/** Abre el ticket en PDF en otra pestaña (térmica de 80 mm o A4 con dos copias). */
export function BotonesTicket({ ordenId }: { ordenId: string }) {
  return (
    <span className="inline-flex">
      <a
        href={`/api/ticket/${ordenId}?formato=80mm`}
        target="_blank"
        rel="noopener"
        className={clasesBoton('secundario', 'md', 'rounded-r-none')}
      >
        <Printer aria-hidden /> Ticket 80 mm
      </a>
      <a
        href={`/api/ticket/${ordenId}?formato=a4`}
        target="_blank"
        rel="noopener"
        className={clasesBoton('secundario', 'md', '-ml-px rounded-l-none')}
      >
        A4
      </a>
    </span>
  );
}
