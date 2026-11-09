/**
 * Generador de datos de la demo. Es una función PURA: recibe la fecha
 * actual y una semilla y devuelve filas listas para insertar. Así se puede
 * testear y los datos siempre parecen "recientes" respecto al día de hoy.
 */
import type { EstadoOrden } from '@/domain/estados';
import { sumarDias, hoyEnLaHabana } from '@/domain/fechas';
import { ALFABETO_CODIGO } from '@/domain/codigo-orden';
import { ACCESORIOS } from '@/domain/esquemas';
import type { TipoDesbloqueo } from '@/domain/desbloqueo';
import {
  ESTADOS_FISICOS,
  FALLAS_DEMO,
  MODELOS_DEMO,
  MUNICIPIOS_PONDERADOS,
  NOMBRES,
  NOTAS_INTERNAS,
  NOTAS_PUBLICAS,
  PIEZAS_DEMO,
  TASAS_DEMO,
  type FallaCatalogo,
} from './catalogo';

export const TOTAL_ORDENES = 50;
export const TOTAL_CLIENTES = 36;
const DIA = 86_400_000;

// ---------------------------------------------------------------------------
// Aleatoriedad determinista (mulberry32)
// ---------------------------------------------------------------------------
export function crearAzar(semilla: number) {
  let a = semilla >>> 0;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entero = (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1));
  const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)]!;
  const ponderado = <T>(lista: ReadonlyArray<readonly [T, number]>): T => {
    const total = lista.reduce((s, [, p]) => s + p, 0);
    let r = siguiente() * total;
    for (const [v, p] of lista) {
      r -= p;
      if (r < 0) return v;
    }
    return lista[lista.length - 1]![0];
  };
  const uuid = () => {
    const h = Array.from({ length: 32 }, () => entero(0, 15).toString(16));
    h[12] = '4';
    h[16] = ((entero(0, 15) & 0x3) | 0x8).toString(16);
    const s = h.join('');
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  };
  return { siguiente, entero, elegir, ponderado, uuid, prob: (p: number) => siguiente() < p };
}

type Azar = ReturnType<typeof crearAzar>;

// ---------------------------------------------------------------------------
// Tipos de salida
// ---------------------------------------------------------------------------
export interface ClienteDemo {
  id: string;
  nombre: string;
  telefono: string;
  carne: string | null;
  municipio: string;
  creado_en: string;
}

export interface EquipoDemo {
  id: string;
  cliente_id: string;
  tipo: (typeof MODELOS_DEMO)[number]['tipo'];
  marca: string;
  modelo: string;
  imei_serie: string | null;
  color: string;
  creado_en: string;
}

export interface OrdenDemo {
  id: string;
  codigo: string;
  cliente_id: string;
  equipo_id: string;
  tecnico_indice: number;
  falla_reportada: string;
  estado_fisico: string;
  accesorios: string[];
  desbloqueo_tipo: TipoDesbloqueo;
  desbloqueo_valor: string | null;
  mano_obra_usd: number;
  presupuesto_usd: number;
  tasa_aplicada: number;
  estado: EstadoOrden;
  fecha_prometida: string;
  entregada_en: string | null;
  dias_garantia: number;
  garantia_hasta: string | null;
  es_garantia: boolean;
  orden_padre_id: string | null;
  creado_en: string;
}

export interface EventoDemo {
  orden_id: string;
  tipo: 'cambio_estado' | 'nota';
  estado_anterior: EstadoOrden | null;
  estado_nuevo: EstadoOrden | null;
  texto: string | null;
  visible_cliente: boolean;
  tecnico_indice: number;
  creado_en: string;
}

export interface UsoPiezaDemo {
  orden_id: string;
  sku: string;
  cantidad: number;
  costo_unit_usd: number;
  precio_unit_usd: number;
  creado_en: string;
}

export interface DatosDemo {
  clientes: ClienteDemo[];
  equipos: EquipoDemo[];
  ordenes: OrdenDemo[];
  /** Eventos posteriores a la recepción (el de recepción lo crea el trigger). */
  eventos: EventoDemo[];
  usos: UsoPiezaDemo[];
  /** Stock comprado al inicio (antes de los usos), por SKU. */
  stockInicial: Record<string, number>;
  /** Stock actual tras descontar las piezas usadas, por SKU. */
  stockFinal: Record<string, number>;
  tasas: Array<{ cup_por_usd: number; vigente_desde: string }>;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function imeiValido(azar: Azar): string {
  const base = [3, 5, ...Array.from({ length: 12 }, () => azar.entero(0, 9))];
  let suma = 0;
  base.forEach((d, i) => {
    let v = i % 2 === 1 ? d * 2 : d;
    if (v > 9) v -= 9;
    suma += v;
  });
  return [...base, (10 - (suma % 10)) % 10].join('');
}

function carne(azar: Azar): string {
  const anio = azar.entero(60, 99) + (azar.prob(0.3) ? -60 : 0);
  const mes = azar.entero(1, 12);
  const dia = azar.entero(1, 28);
  const p = (n: number) => String(Math.max(0, n)).padStart(2, '0');
  return `${p(anio)}${p(mes)}${p(dia)}${String(azar.entero(0, 99999)).padStart(5, '0')}`;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Hora laboral (9:00-17:30 en La Habana ≈ 14:00-22:30 UTC). */
function enHorario(ms: number, azar: Azar): number {
  const d = new Date(ms);
  d.setUTCHours(azar.entero(14, 21), azar.entero(0, 59), azar.entero(0, 59), 0);
  return d.getTime();
}

export function tasaEn(tasas: DatosDemo['tasas'], momento: string): number {
  let vigente = tasas[0]!.cup_por_usd;
  for (const t of tasas) if (t.vigente_desde <= momento) vigente = t.cup_por_usd;
  return vigente;
}

/** Camino de estados plausible desde "recibido" hasta el estado final. */
export function caminoHasta(
  final: EstadoOrden,
  azar: Azar,
  conAprobacion: boolean,
  conEspera: boolean,
): EstadoOrden[] {
  const reparacion: EstadoOrden[] = ['recibido', 'diagnostico'];
  if (conAprobacion) reparacion.push('esperando_aprobacion');
  reparacion.push('en_reparacion');
  if (conEspera) reparacion.push('esperando_pieza', 'en_reparacion');

  switch (final) {
    case 'recibido':
    case 'diagnostico':
      return reparacion.slice(0, reparacion.indexOf(final) + 1);
    case 'esperando_aprobacion':
      return ['recibido', 'diagnostico', 'esperando_aprobacion'];
    case 'en_reparacion':
      return reparacion;
    case 'esperando_pieza':
      return [...reparacion.slice(0, reparacion.indexOf('en_reparacion') + 1), 'esperando_pieza'];
    case 'listo':
      return [...reparacion, 'listo'];
    case 'entregado':
      return [...reparacion, 'listo', 'entregado'];
    case 'no_reparable':
      return azar.prob(0.5)
        ? ['recibido', 'diagnostico', 'no_reparable', 'entregado']
        : ['recibido', 'diagnostico', 'en_reparacion', 'no_reparable', 'entregado'];
    case 'cancelado':
      return ['recibido', 'diagnostico', 'esperando_aprobacion', 'cancelado', 'entregado'];
  }
}

/**
 * Compra inicial: el stock del catálogo más un pedido de reposición, salvo
 * las piezas que el catálogo marca agotadas (para que la demo muestre alertas).
 */
export function stockInicialDe(p: { stock: number }): number {
  return p.stock === 0 ? 0 : p.stock + 3;
}

function piezaPara(falla: FallaCatalogo, modelo: string) {
  if (!falla.categoria) return null;
  return (
    PIEZAS_DEMO.find(
      (p) =>
        p.categoria === falla.categoria &&
        p.compatible_con.split(',').some((m) => m.trim() === modelo),
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------
export function generarDatosDemo(ahora: Date, semilla = 2611): DatosDemo {
  const azar = crearAzar(semilla);
  const ahoraMs = ahora.getTime();
  const hoy = hoyEnLaHabana(ahora);

  const tasas = TASAS_DEMO.map((t) => ({
    cup_por_usd: t.cup,
    vigente_desde: iso(enHorario(ahoraMs - t.haceDias * DIA, azar)),
  }));

  // Clientes -----------------------------------------------------------------
  const clientes: ClienteDemo[] = [];
  const telefonos = new Set<string>();
  for (let i = 0; i < TOTAL_CLIENTES; i++) {
    const mujer = azar.prob(0.5);
    const nombre = `${azar.elegir(mujer ? NOMBRES.femeninos : NOMBRES.masculinos)} ${azar.elegir(NOMBRES.apellidos)} ${azar.elegir(NOMBRES.apellidos)}`;
    let tel: string;
    do tel = `5${azar.entero(0, 9)}${String(azar.entero(0, 999999)).padStart(6, '0')}`;
    while (telefonos.has(tel));
    telefonos.add(tel);
    clientes.push({
      id: azar.uuid(),
      nombre,
      telefono: tel,
      carne: azar.prob(0.55) ? carne(azar) : null,
      municipio: azar.ponderado(MUNICIPIOS_PONDERADOS),
      creado_en: iso(enHorario(ahoraMs - azar.entero(91, 400) * DIA, azar)),
    });
  }

  // Órdenes ------------------------------------------------------------------
  const equipos: EquipoDemo[] = [];
  const ordenes: OrdenDemo[] = [];
  const eventos: EventoDemo[] = [];
  const usos: UsoPiezaDemo[] = [];
  const codigos = new Set<string>();
  const stock: Record<string, number> = Object.fromEntries(
    PIEZAS_DEMO.map((p) => [p.sku, stockInicialDe(p)]),
  );
  const modelosPonderados = MODELOS_DEMO.map((m) => [m, m.peso] as const);
  const garantiasPorReabrir = 3;

  // Fechas de recepción: más densas en las últimas semanas.
  const haceDias = Array.from({ length: TOTAL_ORDENES - garantiasPorReabrir }, (_, i) =>
    i < 14 ? azar.entero(0, 6) : i < 26 ? azar.entero(7, 25) : azar.entero(26, 88),
  ).sort((a, b) => b - a);

  const generarCodigo = (momento: number) => {
    const fecha = hoyEnLaHabana(new Date(momento));
    const aamm = fecha.slice(2, 4) + fecha.slice(5, 7);
    let c: string;
    do
      c = `TF-${aamm}-${Array.from({ length: 4 }, () => azar.elegir([...ALFABETO_CODIGO])).join('')}`;
    while (codigos.has(c));
    codigos.add(c);
    return c;
  };

  const elegirEstadoFinal = (dias: number, riesgo: number): EstadoOrden => {
    if (dias >= 12) {
      if (azar.prob(riesgo)) return 'no_reparable';
      return azar.prob(0.06) ? 'cancelado' : 'entregado';
    }
    if (dias >= 5) {
      return azar.ponderado<EstadoOrden>([
        ['entregado', 5],
        ['listo', 3],
        ['esperando_pieza', 1],
        ['en_reparacion', 1],
      ]);
    }
    if (dias >= 2) {
      return azar.ponderado<EstadoOrden>([
        ['listo', 2],
        ['en_reparacion', 3],
        ['esperando_aprobacion', 2],
        ['esperando_pieza', 2],
        ['diagnostico', 1],
      ]);
    }
    return azar.ponderado<EstadoOrden>([
      ['recibido', 3],
      ['diagnostico', 3],
      ['esperando_aprobacion', 1],
    ]);
  };

  for (const dias of haceDias) {
    const cliente = azar.elegir(clientes);
    const deCliente = equipos.filter((e) => e.cliente_id === cliente.id);
    const creado = enHorario(ahoraMs - dias * DIA, azar);
    // Si el horario cae "en el futuro" de hoy, se ajusta a hace 1-3 horas.
    const creadoMs = creado > ahoraMs ? ahoraMs - azar.entero(1, 3) * 3_600_000 : creado;

    let equipo = deCliente.length > 0 && azar.prob(0.35) ? azar.elegir(deCliente) : undefined;
    if (!equipo) {
      const m = azar.ponderado(modelosPonderados);
      equipo = {
        id: azar.uuid(),
        cliente_id: cliente.id,
        tipo: m.tipo,
        marca: m.marca,
        modelo: m.modelo,
        imei_serie:
          m.tipo === 'celular'
            ? imeiValido(azar)
            : `${m.marca.slice(0, 2).toUpperCase()}${azar.entero(10_000_000, 99_999_999)}`,
        color: azar.elegir(m.colores),
        creado_en: iso(creadoMs),
      };
      equipos.push(equipo);
    }

    const falla =
      equipo.tipo === 'celular'
        ? azar.elegir(FALLAS_DEMO)
        : azar.elegir(FALLAS_DEMO.filter((f) => f.categoria === null));
    const pieza = piezaPara(falla, equipo.modelo);
    let final = elegirEstadoFinal(dias, falla.riesgo);
    // Sin stock no se puede terminar: queda esperando la pieza.
    if (
      pieza &&
      stock[pieza.sku]! <= 0 &&
      ['en_reparacion', 'listo', 'entregado'].includes(final)
    ) {
      final = dias >= 12 ? 'cancelado' : 'esperando_pieza';
    }

    const manoObra = azar.entero(falla.manoObra[0], falla.manoObra[1]);
    const tasa = tasaEn(tasas, iso(creadoMs));
    const camino = caminoHasta(
      final,
      azar,
      azar.prob(0.45),
      final !== 'esperando_pieza' && azar.prob(0.15),
    );
    const desbloqueo = azar.ponderado<TipoDesbloqueo>([
      ['ninguno', 3],
      ['pin', 3],
      ['patron', 2],
      ['contrasena', 1],
    ]);
    const orden: OrdenDemo = {
      id: azar.uuid(),
      codigo: generarCodigo(creadoMs),
      cliente_id: cliente.id,
      equipo_id: equipo.id,
      tecnico_indice: azar.entero(0, 3),
      falla_reportada: falla.texto,
      estado_fisico: azar.elegir(ESTADOS_FISICOS),
      accesorios: ACCESORIOS.filter(() => azar.prob(0.2)).slice(0, 3),
      desbloqueo_tipo: desbloqueo,
      desbloqueo_valor:
        desbloqueo === 'pin'
          ? String(azar.entero(1000, 999999))
          : desbloqueo === 'patron'
            ? azar.elegir(['1-2-3-6-9', '1-4-7-8-9', '3-5-7-8-9', '2-5-8-7', '1-5-9-6-3'])
            : desbloqueo === 'contrasena'
              ? azar.elegir(['habana2024', 'cerro1520', 'yanelis85'])
              : null,
      mano_obra_usd: manoObra,
      presupuesto_usd: manoObra + (pieza?.precio_usd ?? 0),
      tasa_aplicada: tasa,
      estado: final,
      fecha_prometida: sumarDias(hoyEnLaHabana(new Date(creadoMs)), azar.entero(1, 5)),
      entregada_en: null,
      dias_garantia: 30,
      garantia_hasta: null,
      es_garantia: false,
      orden_padre_id: null,
      creado_en: iso(creadoMs),
    };

    // Eventos a lo largo del tiempo transcurrido
    const finMs =
      final === 'entregado' || final === 'no_reparable' || final === 'cancelado'
        ? Math.min(
            ahoraMs - 3_600_000,
            creadoMs + azar.entero(1, Math.max(1, Math.min(dias, 7))) * DIA,
          )
        : ahoraMs - azar.entero(1, 5) * 3_600_000;
    const pasos = camino.length - 1;
    for (let i = 1; i < camino.length; i++) {
      const momento = Math.max(creadoMs + 60_000 * i, creadoMs + ((finMs - creadoMs) * i) / pasos);
      const estado = camino[i]!;
      eventos.push({
        orden_id: orden.id,
        tipo: 'cambio_estado',
        estado_anterior: camino[i - 1]!,
        estado_nuevo: estado,
        texto:
          estado === 'esperando_aprobacion'
            ? `Presupuesto enviado al cliente: $${orden.presupuesto_usd.toFixed(2)}`
            : estado === 'no_reparable'
              ? 'Placa base dañada; la reparación no es viable.'
              : estado === 'listo'
                ? 'Reparado y probado. Listo para entregar.'
                : null,
        visible_cliente: true,
        tecnico_indice: orden.tecnico_indice,
        creado_en: iso(momento),
      });

      // Uso de la pieza al entrar en reparación por última vez
      if (
        estado === 'en_reparacion' &&
        pieza &&
        !camino.slice(i + 1).includes('en_reparacion') &&
        stock[pieza.sku]! > 0
      ) {
        stock[pieza.sku]! -= 1;
        usos.push({
          orden_id: orden.id,
          sku: pieza.sku,
          cantidad: 1,
          costo_unit_usd: pieza.costo_usd,
          precio_unit_usd: pieza.precio_usd,
          creado_en: iso(momento + 600_000),
        });
      }
      if (estado === 'entregado') {
        orden.entregada_en = iso(momento);
        if (camino[i - 1] === 'listo') {
          orden.garantia_hasta = sumarDias(hoyEnLaHabana(new Date(momento)), orden.dias_garantia);
        }
      }
    }

    // Si no llegó a usar la pieza, no cobra la pieza (solo mano de obra/diagnóstico).
    if (
      !usos.some((u) => u.orden_id === orden.id) &&
      (final === 'no_reparable' || final === 'cancelado')
    ) {
      orden.mano_obra_usd = final === 'cancelado' ? 0 : Math.min(5, manoObra);
    }

    if (azar.prob(0.3)) {
      eventos.push({
        orden_id: orden.id,
        tipo: 'nota',
        estado_anterior: null,
        estado_nuevo: null,
        texto: azar.elegir(NOTAS_INTERNAS),
        visible_cliente: false,
        tecnico_indice: orden.tecnico_indice,
        creado_en: iso(creadoMs + (finMs - creadoMs) / 3),
      });
    }
    if (['en_reparacion', 'esperando_pieza'].includes(final) && azar.prob(0.5)) {
      eventos.push({
        orden_id: orden.id,
        tipo: 'nota',
        estado_anterior: null,
        estado_nuevo: null,
        texto: azar.elegir(NOTAS_PUBLICAS),
        visible_cliente: true,
        tecnico_indice: orden.tecnico_indice,
        creado_en: iso(finMs + 60_000),
      });
    }

    ordenes.push(orden);
  }

  // Reaperturas en garantía (3): órdenes entregadas con garantía vigente ----
  const candidatas = ordenes.filter(
    (o) => o.garantia_hasta && o.garantia_hasta >= hoy && o.entregada_en,
  );
  for (const padre of candidatas.slice(0, garantiasPorReabrir)) {
    const entregaMs = new Date(padre.entregada_en!).getTime();
    const creadoMs = Math.min(ahoraMs - 2 * 3_600_000, entregaMs + azar.entero(2, 10) * DIA);
    const final = azar.elegir<EstadoOrden>(['diagnostico', 'en_reparacion', 'entregado']);
    const orden: OrdenDemo = {
      ...padre,
      id: azar.uuid(),
      codigo: generarCodigo(creadoMs),
      falla_reportada: 'Volvió a presentar la misma falla después de la reparación',
      mano_obra_usd: 0,
      presupuesto_usd: 0,
      estado: final,
      fecha_prometida: sumarDias(hoyEnLaHabana(new Date(creadoMs)), 3),
      entregada_en: null,
      dias_garantia: 0,
      garantia_hasta: null,
      es_garantia: true,
      orden_padre_id: padre.id,
      creado_en: iso(creadoMs),
    };
    const camino = caminoHasta(final, azar, false, false);
    const finMs =
      final === 'entregado' ? Math.min(ahoraMs - 3_600_000, creadoMs + DIA) : ahoraMs - 3_600_000;
    for (let i = 1; i < camino.length; i++) {
      const momento = creadoMs + ((finMs - creadoMs) * i) / (camino.length - 1);
      eventos.push({
        orden_id: orden.id,
        tipo: 'cambio_estado',
        estado_anterior: camino[i - 1]!,
        estado_nuevo: camino[i]!,
        texto:
          camino[i] === 'entregado' ? 'Revisado en garantía, sin costo para el cliente.' : null,
        visible_cliente: true,
        tecnico_indice: orden.tecnico_indice,
        creado_en: iso(momento),
      });
      if (camino[i] === 'entregado') orden.entregada_en = iso(momento);
    }
    eventos.push({
      orden_id: padre.id,
      tipo: 'nota',
      estado_anterior: null,
      estado_nuevo: null,
      texto: `Reabierta en garantía como ${orden.codigo}`,
      visible_cliente: false,
      tecnico_indice: padre.tecnico_indice,
      creado_en: iso(creadoMs),
    });
    ordenes.push(orden);
  }

  return {
    clientes,
    equipos,
    ordenes: ordenes.sort((a, b) => a.creado_en.localeCompare(b.creado_en)),
    eventos,
    usos,
    stockInicial: Object.fromEntries(PIEZAS_DEMO.map((p) => [p.sku, stockInicialDe(p)])),
    stockFinal: { ...stock },
    tasas,
  };
}
