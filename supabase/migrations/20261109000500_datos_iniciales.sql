-- =====================================================================
-- TallerTrack — Datos iniciales imprescindibles
-- La tabla ajustes es de una sola fila y la RLS no permite INSERT desde
-- la app, así que se crea aquí con valores editables desde /ajustes.
-- =====================================================================

insert into public.ajustes (id, nombre_negocio, direccion, whatsapp, dias_garantia_default, pie_ticket)
values (
  1,
  'Mi taller',
  'Dirección del taller, La Habana',
  '50000000',
  30,
  'La garantía cubre solo la reparación realizada.'
)
on conflict (id) do nothing;
