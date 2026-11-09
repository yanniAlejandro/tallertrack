import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { renderizarTicket, type DatosTicket } from '../ticket';

async function datos(): Promise<DatosTicket> {
  const urlEstado = 'https://tallertrack.vercel.app/estado/TF-2611-7K4Q';
  return {
    negocio: {
      nombre: 'TecnoFix',
      direccion: 'Calzada del Cerro No. 1520, Cerro, La Habana',
      whatsapp: '52345678',
      pie: 'La garantía cubre solo la reparación realizada.',
    },
    codigo: 'TF-2611-7K4Q',
    creadoEn: '2026-11-09T15:30:00Z',
    cliente: { nombre: 'Yanelis Rodríguez Pérez', telefono: '53817264' },
    equipo: { descripcion: 'Samsung Galaxy A12', imei: '352099001761481' },
    falla: 'Pantalla rota tras una caída, el táctil responde a medias',
    estadoFisico: 'Rayones leves en el marco',
    accesorios: ['Cargador', 'Funda'],
    desbloqueo: 'patron',
    presupuestoUsd: 35,
    tasa: 360,
    fechaPrometida: '2026-11-12',
    tecnico: 'Raúl Echevarría Soto',
    diasGarantia: 30,
    esGarantia: false,
    urlEstado,
    qrDataUrl: await QRCode.toDataURL(urlEstado, { margin: 1 }),
  };
}

describe('ticket de recepción en PDF', () => {
  it.each(['80mm', 'a4'] as const)('genera un PDF válido en formato %s', async (formato) => {
    const pdf = await renderizarTicket(await datos(), formato);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(2000);
  });
});
