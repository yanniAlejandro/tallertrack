-- =====================================================================
-- TallerTrack — Seguridad a nivel de fila (RLS)
-- Regla general: solo el personal activo del taller ve y edita datos.
-- Acciones sensibles (ajustes, tasa, usuarios, borrar) solo admin.
-- El cliente final NUNCA consulta tablas: usa la RPC estado_publico().
-- =====================================================================

create or replace function public.es_personal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid()) and p.activo
  );
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid()) and p.activo and p.rol = 'admin'
  );
$$;

alter table public.perfiles enable row level security;
alter table public.ajustes enable row level security;
alter table public.tasas_cambio enable row level security;
alter table public.clientes enable row level security;
alter table public.equipos enable row level security;
alter table public.ordenes_servicio enable row level security;
alter table public.orden_eventos enable row level security;
alter table public.orden_fotos enable row level security;
alter table public.piezas enable row level security;
alter table public.orden_piezas enable row level security;
alter table public.movimientos_stock enable row level security;

-- Perfiles
create policy "personal ve perfiles" on public.perfiles
  for select to authenticated using (public.es_personal());
create policy "admin gestiona perfiles" on public.perfiles
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Ajustes
create policy "personal ve ajustes" on public.ajustes
  for select to authenticated using (public.es_personal());
create policy "admin edita ajustes" on public.ajustes
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- Tasas de cambio
create policy "personal ve tasas" on public.tasas_cambio
  for select to authenticated using (public.es_personal());
create policy "admin registra tasa" on public.tasas_cambio
  for insert to authenticated with check (public.es_admin());

-- Clientes y equipos
create policy "personal ve clientes" on public.clientes
  for select to authenticated using (public.es_personal());
create policy "personal crea clientes" on public.clientes
  for insert to authenticated with check (public.es_personal());
create policy "personal edita clientes" on public.clientes
  for update to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "admin borra clientes" on public.clientes
  for delete to authenticated using (public.es_admin());

create policy "personal ve equipos" on public.equipos
  for select to authenticated using (public.es_personal());
create policy "personal crea equipos" on public.equipos
  for insert to authenticated with check (public.es_personal());
create policy "personal edita equipos" on public.equipos
  for update to authenticated using (public.es_personal()) with check (public.es_personal());

-- Órdenes
create policy "personal ve ordenes" on public.ordenes_servicio
  for select to authenticated using (public.es_personal());
create policy "personal crea ordenes" on public.ordenes_servicio
  for insert to authenticated with check (public.es_personal());
create policy "personal edita ordenes" on public.ordenes_servicio
  for update to authenticated using (public.es_personal()) with check (public.es_personal());
create policy "admin borra ordenes" on public.ordenes_servicio
  for delete to authenticated using (public.es_admin());

create policy "personal ve eventos" on public.orden_eventos
  for select to authenticated using (public.es_personal());
create policy "personal crea notas" on public.orden_eventos
  for insert to authenticated with check (public.es_personal() and tipo = 'nota');

create policy "personal ve fotos" on public.orden_fotos
  for select to authenticated using (public.es_personal());
create policy "personal sube fotos" on public.orden_fotos
  for insert to authenticated with check (public.es_personal());
create policy "personal borra fotos" on public.orden_fotos
  for delete to authenticated using (public.es_personal());

-- Inventario: lectura para todo el personal; las salidas se hacen vía RPC.
create policy "personal ve piezas" on public.piezas
  for select to authenticated using (public.es_personal());
create policy "admin gestiona piezas" on public.piezas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "personal ve piezas de ordenes" on public.orden_piezas
  for select to authenticated using (public.es_personal());

create policy "personal ve movimientos" on public.movimientos_stock
  for select to authenticated using (public.es_personal());

-- ---------------------------------------------------------------------
-- Storage: bucket privado para fotos de las órdenes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-ordenes', 'fotos-ordenes', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "personal lee fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos-ordenes' and public.es_personal());
create policy "personal sube fotos storage" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos-ordenes' and public.es_personal());
create policy "personal borra fotos storage" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos-ordenes' and public.es_personal());
