-- =====================================================================
-- TallerTrack — Garantía: reabrir una orden entregada dentro del plazo
-- Crea una orden hija (es_garantia = true) sin cobro de mano de obra,
-- enlazada a la original para medir retornos por técnico.
-- =====================================================================

create or replace function public.reabrir_en_garantia(
  p_orden_id uuid,
  p_falla text
)
returns public.ordenes_servicio
language plpgsql
security definer
set search_path = ''
as $$
declare
  original public.ordenes_servicio;
  nueva public.ordenes_servicio;
  hoy date := (now() at time zone 'America/Havana')::date;
begin
  if not public.es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_falla is null or char_length(trim(p_falla)) < 3 then
    raise exception 'Describa la falla reportada' using errcode = '22023';
  end if;

  select * into original from public.ordenes_servicio where id = p_orden_id for update;
  if not found then
    raise exception 'Orden no encontrada' using errcode = 'P0002';
  end if;
  if original.estado <> 'entregado' or original.garantia_hasta is null then
    raise exception 'La orden % no tiene garantía activa', original.codigo using errcode = '22023';
  end if;
  if original.garantia_hasta < hoy then
    raise exception 'La garantía de % venció el %', original.codigo, to_char(original.garantia_hasta, 'DD/MM/YYYY')
      using errcode = '22023';
  end if;
  if exists (
    select 1 from public.ordenes_servicio
    where orden_padre_id = original.id and estado not in ('entregado', 'cancelado', 'no_reparable')
  ) then
    raise exception 'Ya hay una orden de garantía abierta para %', original.codigo using errcode = '23505';
  end if;

  insert into public.ordenes_servicio (
    cliente_id, equipo_id, tecnico_id, falla_reportada, estado_fisico, accesorios,
    desbloqueo_tipo, desbloqueo_cifrado, mano_obra_usd, presupuesto_usd, tasa_aplicada,
    fecha_prometida, dias_garantia, es_garantia, orden_padre_id, creado_por
  )
  values (
    original.cliente_id, original.equipo_id, original.tecnico_id,
    trim(p_falla), original.estado_fisico, original.accesorios,
    original.desbloqueo_tipo, original.desbloqueo_cifrado, 0, 0, original.tasa_aplicada,
    hoy + 3, 0, true, original.id, (select auth.uid())
  )
  returning * into nueva;

  insert into public.orden_eventos (orden_id, tipo, texto, visible_cliente, autor_id)
  values (original.id, 'nota', 'Reabierta en garantía como ' || nueva.codigo, false, (select auth.uid()));

  return nueva;
end;
$$;

revoke all on function public.reabrir_en_garantia(uuid, text) from public, anon;
grant execute on function public.reabrir_en_garantia(uuid, text) to authenticated;
