-- =====================================================================
-- TallerTrack — Inventario: descuento automático de piezas
-- Toda salida/entrada de stock pasa por estas funciones para que el
-- stock y el historial de movimientos nunca queden desincronizados.
-- =====================================================================

-- Usa una pieza en una orden: bloquea la fila, valida stock y descuenta.
create or replace function public.usar_pieza(
  p_orden_id uuid,
  p_pieza_id uuid,
  p_cantidad integer default 1
)
returns public.orden_piezas
language plpgsql
security definer
set search_path = ''
as $$
declare
  orden public.ordenes_servicio;
  pieza public.piezas;
  fila public.orden_piezas;
begin
  if not public.es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad < 1 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  select * into orden from public.ordenes_servicio where id = p_orden_id;
  if not found then
    raise exception 'Orden no encontrada' using errcode = 'P0002';
  end if;
  if orden.estado in ('entregado', 'cancelado', 'no_reparable') then
    raise exception 'La orden está cerrada; no se pueden añadir piezas' using errcode = '22023';
  end if;

  select * into pieza from public.piezas where id = p_pieza_id and activo for update;
  if not found then
    raise exception 'Pieza no encontrada' using errcode = 'P0002';
  end if;
  if pieza.stock < p_cantidad then
    raise exception 'Stock insuficiente de % (disponible: %)', pieza.nombre, pieza.stock using errcode = '23514';
  end if;

  update public.piezas set stock = stock - p_cantidad where id = p_pieza_id;

  insert into public.orden_piezas (orden_id, pieza_id, cantidad, costo_unit_usd, precio_unit_usd)
  values (
    p_orden_id,
    p_pieza_id,
    p_cantidad,
    pieza.costo_usd,
    -- En garantía la pieza no se cobra al cliente, pero su costo sí cuenta.
    case when orden.es_garantia then 0 else pieza.precio_usd end
  )
  returning * into fila;

  insert into public.movimientos_stock (pieza_id, tipo, cantidad, orden_id, motivo, autor_id)
  values (p_pieza_id, 'salida', -p_cantidad, p_orden_id, 'Usada en orden ' || orden.codigo, (select auth.uid()));

  return fila;
end;
$$;

-- Quita una pieza de una orden (p. ej. se cargó por error) y repone stock.
create or replace function public.devolver_pieza(p_orden_pieza_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fila public.orden_piezas;
  orden public.ordenes_servicio;
begin
  if not public.es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select * into fila from public.orden_piezas where id = p_orden_pieza_id;
  if not found then
    raise exception 'Registro no encontrado' using errcode = 'P0002';
  end if;

  select * into orden from public.ordenes_servicio where id = fila.orden_id;
  if orden.estado = 'entregado' then
    raise exception 'La orden ya fue entregada' using errcode = '22023';
  end if;

  update public.piezas set stock = stock + fila.cantidad where id = fila.pieza_id;
  delete from public.orden_piezas where id = p_orden_pieza_id;

  insert into public.movimientos_stock (pieza_id, tipo, cantidad, orden_id, motivo, autor_id)
  values (fila.pieza_id, 'entrada', fila.cantidad, fila.orden_id, 'Devuelta de orden ' || orden.codigo, (select auth.uid()));
end;
$$;

-- Entrada de mercancía o ajuste por conteo físico (solo admin).
create or replace function public.ajustar_stock(
  p_pieza_id uuid,
  p_delta integer,
  p_motivo text
)
returns public.piezas
language plpgsql
security definer
set search_path = ''
as $$
declare
  pieza public.piezas;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede ajustar el stock' using errcode = '42501';
  end if;
  if p_delta = 0 then
    raise exception 'El ajuste no puede ser cero' using errcode = '22023';
  end if;

  update public.piezas set stock = stock + p_delta
  where id = p_pieza_id
  returning * into pieza;
  if not found then
    raise exception 'Pieza no encontrada' using errcode = 'P0002';
  end if;

  insert into public.movimientos_stock (pieza_id, tipo, cantidad, motivo, autor_id)
  values (p_pieza_id, case when p_delta > 0 then 'entrada'::public.tipo_movimiento else 'ajuste'::public.tipo_movimiento end,
          p_delta, nullif(trim(p_motivo), ''), (select auth.uid()));

  return pieza;
end;
$$;

revoke all on function public.usar_pieza(uuid, uuid, integer) from public, anon;
revoke all on function public.devolver_pieza(bigint) from public, anon;
revoke all on function public.ajustar_stock(uuid, integer, text) from public, anon;
grant execute on function public.usar_pieza(uuid, uuid, integer) to authenticated;
grant execute on function public.devolver_pieza(bigint) to authenticated;
grant execute on function public.ajustar_stock(uuid, integer, text) to authenticated;
