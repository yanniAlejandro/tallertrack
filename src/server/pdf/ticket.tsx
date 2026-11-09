import 'server-only';
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { formatearCup, formatearUsd, usdACup } from '@/domain/dinero';
import { formatearFecha, formatearFechaHora } from '@/domain/fechas';
import { ETIQUETA_DESBLOQUEO, type TipoDesbloqueo } from '@/domain/desbloqueo';

export type FormatoTicket = '80mm' | 'a4';

export interface DatosTicket {
  negocio: { nombre: string; direccion: string; whatsapp: string; pie: string };
  codigo: string;
  creadoEn: string;
  cliente: { nombre: string; telefono: string };
  equipo: { descripcion: string; imei: string | null };
  falla: string;
  estadoFisico: string;
  accesorios: string[];
  desbloqueo: TipoDesbloqueo;
  presupuestoUsd: number;
  tasa: number;
  fechaPrometida: string | null;
  tecnico: string | null;
  diasGarantia: number;
  esGarantia: boolean;
  urlEstado: string;
  qrDataUrl: string;
}

// Las fuentes estándar del PDF (Helvetica) no tienen el espacio fino U+202F.
const pdf = (texto: string) => texto.replace(/ /g, ' ');
const MM = 72 / 25.4;

const s = StyleSheet.create({
  pagina80: {
    paddingVertical: 10,
    paddingHorizontal: 9,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#111',
  },
  paginaA4: { padding: 28, fontFamily: 'Helvetica', fontSize: 9.5, color: '#111' },
  centro: { textAlign: 'center' },
  negocio: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sub: { fontSize: 7.5, textAlign: 'center', color: '#333' },
  titulo: {
    marginTop: 6,
    paddingVertical: 3,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  codigo: {
    marginTop: 6,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  etiqueta: { fontFamily: 'Helvetica-Bold', marginTop: 5 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  separador: { marginVertical: 6, borderBottomWidth: 1, borderStyle: 'dashed' },
  total: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  pie: { marginTop: 6, fontSize: 6.5, color: '#333', textAlign: 'justify' },
  firma: { marginTop: 22, borderTopWidth: 0.7, paddingTop: 2, fontSize: 7, textAlign: 'center' },
});

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={s.fila}>
      <Text>{etiqueta}</Text>
      <Text style={{ fontFamily: 'Helvetica-Bold', maxWidth: '65%', textAlign: 'right' }}>
        {valor}
      </Text>
    </View>
  );
}

/** Cuerpo del comprobante, compartido por el formato térmico y el A4. */
function Comprobante({ d, copia, anchoQr }: { d: DatosTicket; copia?: string; anchoQr: number }) {
  return (
    <View>
      <Text style={s.negocio}>{d.negocio.nombre}</Text>
      <Text style={s.sub}>{d.negocio.direccion}</Text>
      <Text style={s.sub}>WhatsApp: +53 {d.negocio.whatsapp}</Text>
      <Text style={s.titulo}>
        {d.esGarantia ? 'RECEPCIÓN EN GARANTÍA' : 'TICKET DE RECEPCIÓN'}
        {copia ? ` · ${copia}` : ''}
      </Text>
      <Text style={s.codigo}>{d.codigo}</Text>
      <Text style={[s.sub, { marginBottom: 4 }]}>{formatearFechaHora(d.creadoEn)}</Text>

      <Linea etiqueta="Cliente" valor={d.cliente.nombre} />
      <Linea etiqueta="Teléfono" valor={d.cliente.telefono} />
      <Linea etiqueta="Equipo" valor={d.equipo.descripcion} />
      {d.equipo.imei && <Linea etiqueta="IMEI / serie" valor={d.equipo.imei} />}
      <Linea
        etiqueta="Desbloqueo"
        valor={
          d.desbloqueo === 'ninguno'
            ? 'Sin bloqueo'
            : `${ETIQUETA_DESBLOQUEO[d.desbloqueo]} (registrado)`
        }
      />

      <Text style={s.etiqueta}>Falla reportada</Text>
      <Text>{d.falla}</Text>
      {d.estadoFisico ? (
        <>
          <Text style={s.etiqueta}>Estado físico</Text>
          <Text>{d.estadoFisico}</Text>
        </>
      ) : null}
      <Text style={s.etiqueta}>Accesorios</Text>
      <Text>{d.accesorios.length ? d.accesorios.join(', ') : 'Ninguno'}</Text>

      <View style={s.separador} />
      {d.presupuestoUsd > 0 ? (
        <>
          <View style={s.fila}>
            <Text style={s.total}>Presupuesto</Text>
            <Text style={s.total}>{pdf(formatearUsd(d.presupuestoUsd))}</Text>
          </View>
          <View style={s.fila}>
            <Text>Equivalente (1 USD = {pdf(formatearCup(d.tasa))})</Text>
            <Text>{pdf(formatearCup(usdACup(d.presupuestoUsd, d.tasa)))}</Text>
          </View>
        </>
      ) : (
        <Text>Presupuesto: pendiente de diagnóstico</Text>
      )}
      {d.fechaPrometida && (
        <Linea etiqueta="Fecha estimada" valor={formatearFecha(d.fechaPrometida)} />
      )}
      {d.tecnico && <Linea etiqueta="Técnico" valor={d.tecnico} />}
      {d.diasGarantia > 0 && (
        <Linea etiqueta="Garantía" valor={`${d.diasGarantia} días tras la entrega`} />
      )}

      <View style={{ alignItems: 'center', marginTop: 8 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
        <Image src={d.qrDataUrl} style={{ width: anchoQr, height: anchoQr }} />
        <Text style={[s.sub, { marginTop: 2 }]}>Escanee para ver el estado de su equipo</Text>
        <Text style={[s.sub, { fontSize: 6.5 }]}>{d.urlEstado}</Text>
      </View>

      {d.negocio.pie ? <Text style={s.pie}>{d.negocio.pie}</Text> : null}
      <Text style={s.firma}>Firma del cliente</Text>
    </View>
  );
}

/** Alto aproximado del ticket térmico (el papel es continuo; se ajusta al contenido). */
function altoTicket80(d: DatosTicket): number {
  const lineas = (t: string) => Math.ceil(t.length / 46);
  const extra = lineas(d.falla) + lineas(d.estadoFisico) + lineas(d.negocio.pie) * 0.8;
  return Math.round(470 + extra * 10 + (d.equipo.imei ? 12 : 0));
}

export async function renderizarTicket(d: DatosTicket, formato: FormatoTicket): Promise<Buffer> {
  const documento =
    formato === '80mm' ? (
      <Document title={`Ticket ${d.codigo}`} author={d.negocio.nombre}>
        <Page size={[80 * MM, altoTicket80(d)]} style={s.pagina80}>
          <Comprobante d={d} anchoQr={96} />
        </Page>
      </Document>
    ) : (
      <Document title={`Orden ${d.codigo}`} author={d.negocio.nombre}>
        <Page size="A4" style={s.paginaA4}>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <View style={{ flex: 1 }}>
              <Comprobante d={d} copia="COPIA CLIENTE" anchoQr={110} />
            </View>
            <View style={{ borderLeftWidth: 1, borderStyle: 'dashed' }} />
            <View style={{ flex: 1 }}>
              <Comprobante d={d} copia="COPIA TALLER" anchoQr={110} />
            </View>
          </View>
        </Page>
      </Document>
    );
  return renderToBuffer(documento);
}
