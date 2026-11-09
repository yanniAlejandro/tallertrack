-- =====================================================================
-- TallerTrack — Vistas de reportes
-- Ingresos: se reconocen al ENTREGAR el equipo (entregada_en).
-- CUP: se usa la tasa congelada en cada orden (tasa_aplicada), no la
-- de hoy, para que los reportes históricos no cambien con la tasa.
-- =====================================================================

create or replace view public.v_ingresos_mensuales
with (security_invoker = true)
as
select
  date_trunc('month', v.entregada_en at time zone 'America/Havana')::date as mes,
  count(*)::int as ordenes,
  sum(v.total_usd)::numeric(12, 2) as ingresos_usd,
  sum(v.total_usd * v.tasa_aplicada)::numeric(14, 2) as ingresos_cup,
  sum(v.costo_piezas_usd)::numeric(12, 2) as costo_piezas_usd,
  sum(v.total_usd - v.costo_piezas_usd)::numeric(12, 2) as ganancia_usd
from public.v_ordenes v
where v.estado = 'entregado' and v.entregada_en is not null
group by 1;

create or replace view public.v_ganancia_piezas
with (security_invoker = true)
as
select
  p.id as pieza_id,
  p.sku,
  p.nombre,
  p.categoria,
  sum(op.cantidad)::int as unidades,
  sum(op.cantidad * op.precio_unit_usd)::numeric(12, 2) as ingresos_usd,
  sum(op.cantidad * op.costo_unit_usd)::numeric(12, 2) as costo_usd,
  sum(op.cantidad * (op.precio_unit_usd - op.costo_unit_usd))::numeric(12, 2) as ganancia_usd
from public.orden_piezas op
join public.piezas p on p.id = op.pieza_id
join public.ordenes_servicio o on o.id = op.orden_id
where o.estado = 'entregado'
group by p.id, p.sku, p.nombre, p.categoria;

create or replace view public.v_rendimiento_tecnicos
with (security_invoker = true)
as
select
  t.id as tecnico_id,
  t.nombre,
  count(o.id)::int as asignadas,
  count(o.id) filter (where o.estado not in ('entregado', 'cancelado', 'no_reparable'))::int as en_curso,
  count(o.id) filter (where o.estado = 'entregado' and not o.es_garantia)::int as entregadas,
  round(avg(extract(epoch from (o.entregada_en - o.creado_en)) / 86400.0)
        filter (where o.estado = 'entregado' and not o.es_garantia), 1) as dias_promedio,
  count(o.id) filter (
    where exists (select 1 from public.ordenes_servicio h where h.orden_padre_id = o.id)
  )::int as retornos_garantia,
  coalesce(sum(o.total_usd) filter (where o.estado = 'entregado'), 0)::numeric(12, 2) as ingresos_usd
from public.perfiles t
left join public.v_ordenes o on o.tecnico_id = t.id
where t.rol in ('tecnico', 'admin') and t.activo
group by t.id, t.nombre;
