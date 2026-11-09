-- =====================================================================
-- TallerTrack — Vista de órdenes para listados y búsqueda
-- security_invoker: respeta las políticas RLS del usuario que consulta.
-- =====================================================================

create or replace view public.v_ordenes
with (security_invoker = true)
as
select
  o.id,
  o.codigo,
  o.estado,
  o.es_garantia,
  o.orden_padre_id,
  o.falla_reportada,
  o.presupuesto_usd,
  o.mano_obra_usd,
  o.tasa_aplicada,
  o.fecha_prometida,
  o.entregada_en,
  o.garantia_hasta,
  o.creado_en,
  o.actualizado_en,
  o.cliente_id,
  c.nombre as cliente_nombre,
  c.telefono as cliente_telefono,
  o.equipo_id,
  e.tipo as equipo_tipo,
  e.marca as equipo_marca,
  e.modelo as equipo_modelo,
  e.imei_serie as equipo_imei,
  o.tecnico_id,
  t.nombre as tecnico_nombre,
  coalesce(p.piezas_usd, 0) as piezas_usd,
  coalesce(p.costo_piezas_usd, 0) as costo_piezas_usd,
  o.mano_obra_usd + coalesce(p.piezas_usd, 0) as total_usd,
  -- Texto plano para búsqueda rápida desde la UI (código, cliente, teléfono, equipo, IMEI)
  lower(concat_ws(' ', o.codigo, c.nombre, c.telefono, e.marca, e.modelo, e.imei_serie)) as busqueda
from public.ordenes_servicio o
join public.clientes c on c.id = o.cliente_id
join public.equipos e on e.id = o.equipo_id
left join public.perfiles t on t.id = o.tecnico_id
left join lateral (
  select
    sum(op.cantidad * op.precio_unit_usd) as piezas_usd,
    sum(op.cantidad * op.costo_unit_usd) as costo_piezas_usd
  from public.orden_piezas op
  where op.orden_id = o.id
) p on true;

-- Conteo por estado para el tablero y los filtros
create or replace view public.v_ordenes_por_estado
with (security_invoker = true)
as
select estado, count(*)::int as cantidad
from public.ordenes_servicio
group by estado;
