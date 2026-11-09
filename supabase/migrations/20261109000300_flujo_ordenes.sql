-- =====================================================================
-- TallerTrack — Flujo de órdenes
-- Código público, transiciones de estado, consulta pública por QR.
-- La matriz de transiciones replica src/domain/estados.ts (fuente de
-- verdad para la UI); aquí se valida de nuevo para no confiar en el cliente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfil automático al crear un usuario en Auth
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, rol, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'tecnico'),
    new.raw_user_meta_data ->> 'telefono'
  );
  return new;
end;
$$;

create trigger al_crear_usuario
after insert on auth.users
for each row execute function public.crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------------
-- Código de orden: TF-AAMM-XXXX (sin caracteres ambiguos 0/O, 1/I/L)
-- No es secuencial para que no se pueda adivinar el de otro cliente.
-- ---------------------------------------------------------------------
create or replace function public.generar_codigo_orden()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alfabeto constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  sufijo text;
  candidato text;
begin
  loop
    sufijo := '';
    for i in 1..4 loop
      sufijo := sufijo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    candidato := 'TF-' || to_char(now() at time zone 'America/Havana', 'YYMM') || '-' || sufijo;
    exit when not exists (select 1 from public.ordenes_servicio where codigo = candidato);
  end loop;
  return candidato;
end;
$$;

alter table public.ordenes_servicio alter column codigo set default public.generar_codigo_orden();

-- ---------------------------------------------------------------------
-- Evento inicial al recibir un equipo
-- ---------------------------------------------------------------------
create or replace function public.registrar_recepcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.orden_eventos (orden_id, tipo, estado_nuevo, texto, visible_cliente, autor_id, creado_en)
  values (
    new.id,
    'cambio_estado',
    new.estado,
    case when new.es_garantia then 'Equipo recibido para revisión en garantía' else 'Equipo recibido en el taller' end,
    true,
    new.creado_por,
    new.creado_en
  );
  return new;
end;
$$;

create trigger al_crear_orden
after insert on public.ordenes_servicio
for each row execute function public.registrar_recepcion();

-- ---------------------------------------------------------------------
-- Transiciones válidas
-- ---------------------------------------------------------------------
create or replace function public.transicion_valida(desde public.estado_orden, hacia public.estado_orden)
returns boolean
language sql
immutable
as $$
  select case desde
    when 'recibido' then hacia in ('diagnostico', 'cancelado')
    when 'diagnostico' then hacia in ('esperando_aprobacion', 'en_reparacion', 'no_reparable', 'cancelado')
    when 'esperando_aprobacion' then hacia in ('en_reparacion', 'cancelado')
    when 'en_reparacion' then hacia in ('esperando_pieza', 'listo', 'no_reparable')
    when 'esperando_pieza' then hacia in ('en_reparacion', 'cancelado')
    when 'listo' then hacia in ('entregado', 'en_reparacion')
    when 'no_reparable' then hacia in ('entregado')
    when 'cancelado' then hacia in ('entregado')
    else false
  end;
$$;

create or replace function public.cambiar_estado(
  p_orden_id uuid,
  p_estado public.estado_orden,
  p_nota text default null,
  p_visible_cliente boolean default true
)
returns public.ordenes_servicio
language plpgsql
security invoker
set search_path = ''
as $$
declare
  orden public.ordenes_servicio;
  anterior public.estado_orden;
begin
  if not public.es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select * into orden from public.ordenes_servicio where id = p_orden_id for update;
  if not found then
    raise exception 'Orden no encontrada' using errcode = 'P0002';
  end if;

  anterior := orden.estado;

  if not public.transicion_valida(anterior, p_estado) then
    raise exception 'No se puede pasar de % a %', anterior, p_estado using errcode = '22023';
  end if;

  update public.ordenes_servicio
  set estado = p_estado,
      entregada_en = case when p_estado = 'entregado' then now() else entregada_en end,
      garantia_hasta = case
        when p_estado = 'entregado' and anterior = 'listo'
          then ((now() at time zone 'America/Havana')::date + orden.dias_garantia)
        else garantia_hasta
      end
  where id = p_orden_id
  returning * into orden;

  insert into public.orden_eventos (orden_id, tipo, estado_anterior, estado_nuevo, texto, visible_cliente, autor_id)
  values (p_orden_id, 'cambio_estado', anterior, p_estado, nullif(trim(p_nota), ''), p_visible_cliente, (select auth.uid()));

  return orden;
end;
$$;

-- ---------------------------------------------------------------------
-- Consulta pública (página /estado/[codigo], accesible sin sesión)
-- Devuelve SOLO datos aptos para el cliente: nada de teléfonos,
-- contraseñas, notas internas ni costos.
-- ---------------------------------------------------------------------
create or replace function public.estado_publico(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'codigo', o.codigo,
    'estado', o.estado,
    'equipo', trim(e.marca || ' ' || e.modelo),
    'tipo_equipo', e.tipo,
    'cliente', split_part(c.nombre, ' ', 1),
    'fecha_recepcion', o.creado_en,
    'fecha_prometida', o.fecha_prometida,
    'entregada_en', o.entregada_en,
    'garantia_hasta', o.garantia_hasta,
    'es_garantia', o.es_garantia,
    'presupuesto_usd', o.presupuesto_usd,
    'tasa_aplicada', o.tasa_aplicada,
    'eventos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'estado', ev.estado_nuevo,
        'texto', ev.texto,
        'fecha', ev.creado_en
      ) order by ev.creado_en)
      from public.orden_eventos ev
      where ev.orden_id = o.id and ev.visible_cliente
    ), '[]'::jsonb),
    'negocio', (select jsonb_build_object('nombre', a.nombre_negocio, 'direccion', a.direccion, 'whatsapp', a.whatsapp)
                from public.ajustes a where a.id = 1)
  )
  from public.ordenes_servicio o
  join public.equipos e on e.id = o.equipo_id
  join public.clientes c on c.id = o.cliente_id
  where o.codigo = upper(trim(p_codigo));
$$;

revoke all on function public.estado_publico(text) from public;
grant execute on function public.estado_publico(text) to anon, authenticated;
