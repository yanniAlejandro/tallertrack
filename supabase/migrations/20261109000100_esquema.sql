-- =====================================================================
-- TallerTrack — Esquema base
-- Órdenes de servicio para talleres de reparación de equipos móviles.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'tecnico', 'recepcion');

create type public.tipo_equipo as enum ('celular', 'tablet', 'laptop', 'reloj', 'otro');

create type public.estado_orden as enum (
  'recibido',
  'diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'esperando_pieza',
  'listo',
  'entregado',
  'cancelado',
  'no_reparable'
);

create type public.tipo_desbloqueo as enum ('ninguno', 'pin', 'contrasena', 'patron');

create type public.tipo_evento as enum ('cambio_estado', 'nota');

create type public.momento_foto as enum ('recepcion', 'reparacion');

create type public.categoria_pieza as enum (
  'pantalla',
  'bateria',
  'puerto_carga',
  'camara',
  'flex',
  'otro'
);

create type public.tipo_movimiento as enum ('entrada', 'salida', 'ajuste');

-- ---------------------------------------------------------------------
-- Utilidad: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  rol public.rol_usuario not null default 'tecnico',
  telefono text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Ajustes del negocio (una sola fila)
-- ---------------------------------------------------------------------
create table public.ajustes (
  id smallint primary key default 1 check (id = 1),
  nombre_negocio text not null,
  direccion text not null,
  whatsapp text not null,
  dias_garantia_default integer not null default 30 check (dias_garantia_default between 0 and 365),
  pie_ticket text not null default '',
  actualizado_en timestamptz not null default now()
);

create trigger ajustes_actualizado_en
before update on public.ajustes
for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------
-- Tasas de cambio (historial; la vigente es la más reciente)
-- ---------------------------------------------------------------------
create table public.tasas_cambio (
  id bigint generated always as identity primary key,
  cup_por_usd numeric(12, 2) not null check (cup_por_usd > 0),
  vigente_desde timestamptz not null default now(),
  creado_por uuid references public.perfiles (id) on delete set null
);

create index tasas_cambio_vigente_idx on public.tasas_cambio (vigente_desde desc);

-- ---------------------------------------------------------------------
-- Clientes y equipos
-- ---------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  telefono text not null check (telefono ~ '^\+?[0-9 ]{8,15}$'),
  carne text unique check (carne is null or carne ~ '^[0-9]{11}$'),
  municipio text,
  notas text,
  creado_en timestamptz not null default now()
);

create index clientes_telefono_idx on public.clientes (telefono);
create index clientes_nombre_idx on public.clientes using gin (to_tsvector('spanish', nombre));

create table public.equipos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo public.tipo_equipo not null default 'celular',
  marca text not null,
  modelo text not null,
  imei_serie text,
  color text,
  creado_en timestamptz not null default now()
);

create index equipos_cliente_idx on public.equipos (cliente_id);
create index equipos_imei_idx on public.equipos (imei_serie);

-- ---------------------------------------------------------------------
-- Órdenes de servicio
-- ---------------------------------------------------------------------
create table public.ordenes_servicio (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  equipo_id uuid not null references public.equipos (id) on delete restrict,
  tecnico_id uuid references public.perfiles (id) on delete set null,
  falla_reportada text not null,
  estado_fisico text not null default '',
  accesorios text[] not null default '{}',
  desbloqueo_tipo public.tipo_desbloqueo not null default 'ninguno',
  desbloqueo_cifrado text,
  mano_obra_usd numeric(10, 2) not null default 0 check (mano_obra_usd >= 0),
  presupuesto_usd numeric(10, 2) not null default 0 check (presupuesto_usd >= 0),
  tasa_aplicada numeric(12, 2) not null check (tasa_aplicada > 0),
  estado public.estado_orden not null default 'recibido',
  fecha_prometida date,
  entregada_en timestamptz,
  dias_garantia integer not null default 30 check (dias_garantia between 0 and 365),
  garantia_hasta date,
  es_garantia boolean not null default false,
  orden_padre_id uuid references public.ordenes_servicio (id) on delete set null,
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint garantia_requiere_padre check (not es_garantia or orden_padre_id is not null),
  constraint desbloqueo_coherente check (
    (desbloqueo_tipo = 'ninguno' and desbloqueo_cifrado is null)
    or (desbloqueo_tipo <> 'ninguno' and desbloqueo_cifrado is not null)
  )
);

create index ordenes_estado_idx on public.ordenes_servicio (estado);
create index ordenes_cliente_idx on public.ordenes_servicio (cliente_id);
create index ordenes_tecnico_idx on public.ordenes_servicio (tecnico_id);
create index ordenes_creado_idx on public.ordenes_servicio (creado_en desc);

create trigger ordenes_actualizado_en
before update on public.ordenes_servicio
for each row execute function public.tocar_actualizado_en();

-- Eventos: cambios de estado y notas (internas o visibles para el cliente)
create table public.orden_eventos (
  id bigint generated always as identity primary key,
  orden_id uuid not null references public.ordenes_servicio (id) on delete cascade,
  tipo public.tipo_evento not null,
  estado_anterior public.estado_orden,
  estado_nuevo public.estado_orden,
  texto text,
  visible_cliente boolean not null default false,
  autor_id uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint evento_coherente check (
    (tipo = 'cambio_estado' and estado_nuevo is not null)
    or (tipo = 'nota' and texto is not null and char_length(texto) > 0)
  )
);

create index orden_eventos_orden_idx on public.orden_eventos (orden_id, creado_en);

create table public.orden_fotos (
  id bigint generated always as identity primary key,
  orden_id uuid not null references public.ordenes_servicio (id) on delete cascade,
  ruta_storage text not null,
  momento public.momento_foto not null default 'recepcion',
  creado_en timestamptz not null default now()
);

create index orden_fotos_orden_idx on public.orden_fotos (orden_id);

-- ---------------------------------------------------------------------
-- Inventario de piezas
-- ---------------------------------------------------------------------
create table public.piezas (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  nombre text not null,
  categoria public.categoria_pieza not null,
  compatible_con text not null default '',
  costo_usd numeric(10, 2) not null check (costo_usd >= 0),
  precio_usd numeric(10, 2) not null check (precio_usd >= 0),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 2 check (stock_minimo >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create index piezas_categoria_idx on public.piezas (categoria);

create table public.orden_piezas (
  id bigint generated always as identity primary key,
  orden_id uuid not null references public.ordenes_servicio (id) on delete cascade,
  pieza_id uuid not null references public.piezas (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  costo_unit_usd numeric(10, 2) not null,
  precio_unit_usd numeric(10, 2) not null,
  creado_en timestamptz not null default now()
);

create index orden_piezas_orden_idx on public.orden_piezas (orden_id);
create index orden_piezas_pieza_idx on public.orden_piezas (pieza_id);

create table public.movimientos_stock (
  id bigint generated always as identity primary key,
  pieza_id uuid not null references public.piezas (id) on delete cascade,
  tipo public.tipo_movimiento not null,
  cantidad integer not null,
  orden_id uuid references public.ordenes_servicio (id) on delete set null,
  motivo text,
  autor_id uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create index movimientos_pieza_idx on public.movimientos_stock (pieza_id, creado_en desc);
