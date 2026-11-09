import QRCode from 'qrcode';
import { obtenerOrden } from '@/server/repositorios/ordenes';
import { obtenerAjustes } from '@/server/repositorios/ajustes';
import { obtenerPerfilActual } from '@/server/sesion';
import { renderizarTicket, type FormatoTicket } from '@/server/pdf/ticket';
import { rutaEstado } from '@/domain/codigo-orden';
import { envPublico } from '@/lib/env';
import { esUuid } from '@/lib/uuid';

export const runtime = 'nodejs';

/** GET /api/ticket/[id]?formato=80mm|a4 → PDF del ticket de recepción. */
export async function GET(request: Request, { params }: RouteContext<'/api/ticket/[id]'>) {
  const { id } = await params;
  if (!(await obtenerPerfilActual())) return new Response('No autorizado', { status: 401 });
  if (!esUuid(id)) return new Response('Orden no válida', { status: 400 });

  const formato: FormatoTicket =
    new URL(request.url).searchParams.get('formato') === 'a4' ? 'a4' : '80mm';
  const [orden, ajustes] = await Promise.all([obtenerOrden(id), obtenerAjustes()]);
  if (!orden) return new Response('Orden no encontrada', { status: 404 });

  const urlEstado = `${envPublico().NEXT_PUBLIC_SITE_URL}${rutaEstado(orden.codigo)}`;
  const qrDataUrl = await QRCode.toDataURL(urlEstado, {
    margin: 1,
    width: 300,
    errorCorrectionLevel: 'M',
  });

  const pdf = await renderizarTicket(
    {
      negocio: {
        nombre: ajustes.nombre_negocio,
        direccion: ajustes.direccion,
        whatsapp: ajustes.whatsapp,
        pie: ajustes.pie_ticket,
      },
      codigo: orden.codigo,
      creadoEn: orden.creado_en,
      cliente: { nombre: orden.cliente?.nombre ?? '', telefono: orden.cliente?.telefono ?? '' },
      equipo: {
        descripcion: `${orden.equipo?.marca ?? ''} ${orden.equipo?.modelo ?? ''}`.trim(),
        imei: orden.equipo?.imei_serie ?? null,
      },
      falla: orden.falla_reportada,
      estadoFisico: orden.estado_fisico,
      accesorios: orden.accesorios,
      desbloqueo: orden.desbloqueo_tipo,
      presupuestoUsd: orden.presupuesto_usd,
      tasa: orden.tasa_aplicada,
      fechaPrometida: orden.fecha_prometida,
      tecnico: orden.tecnico?.nombre ?? null,
      diasGarantia: orden.dias_garantia,
      esGarantia: orden.es_garantia,
      urlEstado,
      qrDataUrl,
    },
    formato,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ticket-${orden.codigo}-${formato}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
