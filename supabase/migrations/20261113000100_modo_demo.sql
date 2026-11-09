-- =====================================================================
-- TallerTrack — Modo demo
-- Vacía los datos de negocio (no los usuarios) para volver a sembrar.
-- Solo ejecutable con la service role (script de seed o acción de admin
-- en el servidor); nunca desde el navegador.
-- =====================================================================

create or replace function public.vaciar_datos_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  truncate table
    public.movimientos_stock,
    public.orden_piezas,
    public.orden_fotos,
    public.orden_eventos,
    public.ordenes_servicio,
    public.equipos,
    public.clientes,
    public.piezas,
    public.tasas_cambio
  restart identity cascade;
  -- Los archivos del bucket se borran desde el seed con la API de Storage
  -- (Supabase no permite borrar storage.objects directamente por SQL).
end;
$$;

revoke all on function public.vaciar_datos_demo() from public, anon, authenticated;
grant execute on function public.vaciar_datos_demo() to service_role;
