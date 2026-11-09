/**
 * Entorno de pruebas SQL: Postgres real (PGlite, WASM) con los esquemas y
 * roles mínimos de Supabase simulados (auth, storage, anon/authenticated/
 * service_role) y todas las migraciones aplicadas en orden.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRACIONES = fileURLToPath(new URL('../migrations', import.meta.url));

const STUBS_SUPABASE = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'
);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
`;

export const ADMIN = '11111111-1111-4111-8111-111111111111';
export const TECNICO = '22222222-2222-4222-8222-222222222222';

export async function crearBD() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUBS_SUPABASE);
  for (const archivo of readdirSync(MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(MIGRACIONES, archivo), 'utf8'));
  }
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'admin@demo.cu', '{"nombre":"Admin Demo","rol":"admin"}'),
       ($2, 'tecnico@demo.cu', '{"nombre":"Técnico Demo"}')`,
    [ADMIN, TECNICO],
  );

  /** Cambia el rol y el usuario de la sesión, como haría PostgREST. */
  async function como(rol: 'anon' | 'authenticated' | 'service_role' | 'postgres', uid = '') {
    await db.exec(
      `reset role; select set_config('request.jwt.claim.sub', '${uid}', false);` +
        (rol === 'postgres' ? '' : ` set role ${rol};`),
    );
  }

  async function fila<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
    return (await db.query<T>(sql, params)).rows[0] as T;
  }

  /** Crea cliente + equipo + orden (como admin) y devuelve la orden. */
  async function crearOrden(extra: { presupuesto?: number } = {}) {
    await como('authenticated', ADMIN);
    const c = await fila<{ id: string }>(
      `insert into clientes (nombre, telefono, carne, municipio)
       values ('Yanelis Pérez Soto', '52345678', null, 'Cerro') returning id`,
    );
    const e = await fila<{ id: string }>(
      `insert into equipos (cliente_id, marca, modelo, imei_serie)
       values ($1, 'Samsung', 'Galaxy A12', '352099001761481') returning id`,
      [c.id],
    );
    return fila<{ id: string; codigo: string; estado: string }>(
      `insert into ordenes_servicio
         (cliente_id, equipo_id, tecnico_id, falla_reportada, tasa_aplicada, presupuesto_usd, creado_por)
       values ($1, $2, $3, 'Pantalla rota', 360, $4, $5) returning *`,
      [c.id, e.id, TECNICO, extra.presupuesto ?? 35, ADMIN],
    );
  }

  return { db, como, fila, crearOrden };
}

export type BD = Awaited<ReturnType<typeof crearBD>>;
