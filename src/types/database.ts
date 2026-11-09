/**
 * Tipos de la base de datos con el mismo formato que `supabase gen types`,
 * más alias legibles (PerfilRow, OrdenRow…) que usa la aplicación.
 * Al cambiar una migración, actualice este archivo; para comparar con el
 * esquema real:  npx supabase gen types typescript --linked
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Enums = {
  rol_usuario: 'admin' | 'tecnico' | 'recepcion';
  tipo_equipo: 'celular' | 'tablet' | 'laptop' | 'reloj' | 'otro';
  estado_orden:
    | 'recibido'
    | 'diagnostico'
    | 'esperando_aprobacion'
    | 'en_reparacion'
    | 'esperando_pieza'
    | 'listo'
    | 'entregado'
    | 'cancelado'
    | 'no_reparable';
  tipo_desbloqueo: 'ninguno' | 'pin' | 'contrasena' | 'patron';
  tipo_evento: 'cambio_estado' | 'nota';
  momento_foto: 'recepcion' | 'reparacion';
  categoria_pieza: 'pantalla' | 'bateria' | 'puerto_carga' | 'camara' | 'flex' | 'otro';
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
};

type Fk<Tabla extends string, Col extends string, Ref extends string> = {
  foreignKeyName: `${Tabla}_${Col}_fkey`;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ['id'];
};

type Tabla<Row, Insert, Rel extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Rel;
};

type Vista<Row> = { Row: Row; Relationships: [] };

export type PerfilRow = {
  id: string;
  nombre: string;
  rol: Enums['rol_usuario'];
  telefono: string | null;
  activo: boolean;
  creado_en: string;
};

export type AjustesRow = {
  id: number;
  nombre_negocio: string;
  direccion: string;
  whatsapp: string;
  dias_garantia_default: number;
  pie_ticket: string;
  actualizado_en: string;
};

export type TasaCambioRow = {
  id: number;
  cup_por_usd: number;
  vigente_desde: string;
  creado_por: string | null;
};

export type ClienteRow = {
  id: string;
  nombre: string;
  telefono: string;
  carne: string | null;
  municipio: string | null;
  notas: string | null;
  creado_en: string;
};

export type EquipoRow = {
  id: string;
  cliente_id: string;
  tipo: Enums['tipo_equipo'];
  marca: string;
  modelo: string;
  imei_serie: string | null;
  color: string | null;
  creado_en: string;
};

export type OrdenRow = {
  id: string;
  codigo: string;
  cliente_id: string;
  equipo_id: string;
  tecnico_id: string | null;
  falla_reportada: string;
  estado_fisico: string;
  accesorios: string[];
  desbloqueo_tipo: Enums['tipo_desbloqueo'];
  desbloqueo_cifrado: string | null;
  mano_obra_usd: number;
  presupuesto_usd: number;
  tasa_aplicada: number;
  estado: Enums['estado_orden'];
  fecha_prometida: string | null;
  entregada_en: string | null;
  dias_garantia: number;
  garantia_hasta: string | null;
  es_garantia: boolean;
  orden_padre_id: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type OrdenEventoRow = {
  id: number;
  orden_id: string;
  tipo: Enums['tipo_evento'];
  estado_anterior: Enums['estado_orden'] | null;
  estado_nuevo: Enums['estado_orden'] | null;
  texto: string | null;
  visible_cliente: boolean;
  autor_id: string | null;
  creado_en: string;
};

export type OrdenFotoRow = {
  id: number;
  orden_id: string;
  ruta_storage: string;
  momento: Enums['momento_foto'];
  creado_en: string;
};

export type PiezaRow = {
  id: string;
  sku: string;
  nombre: string;
  categoria: Enums['categoria_pieza'];
  compatible_con: string;
  costo_usd: number;
  precio_usd: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  creado_en: string;
};

export type OrdenPiezaRow = {
  id: number;
  orden_id: string;
  pieza_id: string;
  cantidad: number;
  costo_unit_usd: number;
  precio_unit_usd: number;
  creado_en: string;
};

export type MovimientoStockRow = {
  id: number;
  pieza_id: string;
  tipo: Enums['tipo_movimiento'];
  cantidad: number;
  orden_id: string | null;
  motivo: string | null;
  autor_id: string | null;
  creado_en: string;
};

export type VOrdenRow = {
  id: string;
  codigo: string;
  estado: Enums['estado_orden'];
  es_garantia: boolean;
  orden_padre_id: string | null;
  falla_reportada: string;
  presupuesto_usd: number;
  mano_obra_usd: number;
  tasa_aplicada: number;
  fecha_prometida: string | null;
  entregada_en: string | null;
  garantia_hasta: string | null;
  creado_en: string;
  actualizado_en: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  equipo_id: string;
  equipo_tipo: Enums['tipo_equipo'];
  equipo_marca: string;
  equipo_modelo: string;
  equipo_imei: string | null;
  tecnico_id: string | null;
  tecnico_nombre: string | null;
  piezas_usd: number;
  costo_piezas_usd: number;
  total_usd: number;
  busqueda: string;
};

type Opcional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Database = {
  public: {
    Tables: {
      perfiles: Tabla<PerfilRow, Opcional<PerfilRow, 'rol' | 'telefono' | 'activo' | 'creado_en'>>;
      ajustes: Tabla<
        AjustesRow,
        Opcional<AjustesRow, 'id' | 'dias_garantia_default' | 'pie_ticket' | 'actualizado_en'>
      >;
      tasas_cambio: Tabla<
        TasaCambioRow,
        Opcional<TasaCambioRow, 'id' | 'vigente_desde' | 'creado_por'>,
        [Fk<'tasas_cambio', 'creado_por', 'perfiles'>]
      >;
      clientes: Tabla<
        ClienteRow,
        Opcional<ClienteRow, 'id' | 'carne' | 'municipio' | 'notas' | 'creado_en'>
      >;
      equipos: Tabla<
        EquipoRow,
        Opcional<EquipoRow, 'id' | 'tipo' | 'imei_serie' | 'color' | 'creado_en'>,
        [Fk<'equipos', 'cliente_id', 'clientes'>]
      >;
      ordenes_servicio: Tabla<
        OrdenRow,
        Opcional<
          OrdenRow,
          | 'id'
          | 'codigo'
          | 'tecnico_id'
          | 'estado_fisico'
          | 'accesorios'
          | 'desbloqueo_tipo'
          | 'desbloqueo_cifrado'
          | 'mano_obra_usd'
          | 'presupuesto_usd'
          | 'estado'
          | 'fecha_prometida'
          | 'entregada_en'
          | 'dias_garantia'
          | 'garantia_hasta'
          | 'es_garantia'
          | 'orden_padre_id'
          | 'creado_por'
          | 'creado_en'
          | 'actualizado_en'
        >,
        [
          Fk<'ordenes_servicio', 'cliente_id', 'clientes'>,
          Fk<'ordenes_servicio', 'equipo_id', 'equipos'>,
          Fk<'ordenes_servicio', 'tecnico_id', 'perfiles'>,
          Fk<'ordenes_servicio', 'creado_por', 'perfiles'>,
          Fk<'ordenes_servicio', 'orden_padre_id', 'ordenes_servicio'>,
        ]
      >;
      orden_eventos: Tabla<
        OrdenEventoRow,
        Opcional<
          OrdenEventoRow,
          | 'id'
          | 'estado_anterior'
          | 'estado_nuevo'
          | 'texto'
          | 'visible_cliente'
          | 'autor_id'
          | 'creado_en'
        >,
        [
          Fk<'orden_eventos', 'orden_id', 'ordenes_servicio'>,
          Fk<'orden_eventos', 'autor_id', 'perfiles'>,
        ]
      >;
      orden_fotos: Tabla<
        OrdenFotoRow,
        Opcional<OrdenFotoRow, 'id' | 'momento' | 'creado_en'>,
        [Fk<'orden_fotos', 'orden_id', 'ordenes_servicio'>]
      >;
      piezas: Tabla<
        PiezaRow,
        Opcional<
          PiezaRow,
          'id' | 'compatible_con' | 'stock' | 'stock_minimo' | 'activo' | 'creado_en'
        >
      >;
      orden_piezas: Tabla<
        OrdenPiezaRow,
        Opcional<OrdenPiezaRow, 'id' | 'creado_en'>,
        [
          Fk<'orden_piezas', 'orden_id', 'ordenes_servicio'>,
          Fk<'orden_piezas', 'pieza_id', 'piezas'>,
        ]
      >;
      movimientos_stock: Tabla<
        MovimientoStockRow,
        Opcional<MovimientoStockRow, 'id' | 'orden_id' | 'motivo' | 'autor_id' | 'creado_en'>,
        [
          Fk<'movimientos_stock', 'pieza_id', 'piezas'>,
          Fk<'movimientos_stock', 'orden_id', 'ordenes_servicio'>,
          Fk<'movimientos_stock', 'autor_id', 'perfiles'>,
        ]
      >;
    };
    Views: {
      v_ordenes: Vista<VOrdenRow>;
      v_ordenes_por_estado: Vista<{ estado: Enums['estado_orden']; cantidad: number }>;
      v_ingresos_mensuales: Vista<{
        mes: string;
        ordenes: number;
        ingresos_usd: number;
        ingresos_cup: number;
        costo_piezas_usd: number;
        ganancia_usd: number;
      }>;
      v_ganancia_piezas: Vista<{
        pieza_id: string;
        sku: string;
        nombre: string;
        categoria: Enums['categoria_pieza'];
        unidades: number;
        ingresos_usd: number;
        costo_usd: number;
        ganancia_usd: number;
      }>;
      v_rendimiento_tecnicos: Vista<{
        tecnico_id: string;
        nombre: string;
        asignadas: number;
        en_curso: number;
        entregadas: number;
        dias_promedio: number | null;
        retornos_garantia: number;
        ingresos_usd: number;
      }>;
    };
    Functions: {
      es_personal: { Args: never; Returns: boolean };
      es_admin: { Args: never; Returns: boolean };
      cambiar_estado: {
        Args: {
          p_orden_id: string;
          p_estado: Enums['estado_orden'];
          p_nota?: string | null;
          p_visible_cliente?: boolean;
        };
        Returns: OrdenRow;
      };
      estado_publico: { Args: { p_codigo: string }; Returns: Json };
      usar_pieza: {
        Args: { p_orden_id: string; p_pieza_id: string; p_cantidad?: number };
        Returns: OrdenPiezaRow;
      };
      devolver_pieza: { Args: { p_orden_pieza_id: number }; Returns: undefined };
      ajustar_stock: {
        Args: { p_pieza_id: string; p_delta: number; p_motivo: string };
        Returns: PiezaRow;
      };
      reabrir_en_garantia: { Args: { p_orden_id: string; p_falla: string }; Returns: OrdenRow };
    };
    Enums: Enums;
    CompositeTypes: Record<string, never>;
  };
};

export type EnumBD<K extends keyof Enums> = Enums[K];
