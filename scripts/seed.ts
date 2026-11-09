/**
 * Siembra la base de datos con los datos de la demo.
 *   npm run seed
 * Requiere en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * y DEVICE_SECRET_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';
import { sembrarDemo } from '../src/seed/sembrar';

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`✖ Falta la variable ${nombre} (revise .env.local)`);
    process.exit(1);
  }
  return valor;
}

async function main() {
  const url = requerida('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRole = requerida('SUPABASE_SERVICE_ROLE_KEY');
  const clave = requerida('DEVICE_SECRET_KEY');

  const admin = createClient<Database>(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Sembrando demo en ${new URL(url).host}\n`);
  const inicio = Date.now();
  const r = await sembrarDemo(admin, {
    claveCifrado: Buffer.from(clave, 'hex'),
    log: (m) => console.log(m),
  });
  console.log(
    `\n✔ Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s: ${r.tecnicos} técnicos, ${r.clientes} clientes, ${r.ordenes} órdenes, ${r.piezas} piezas.`,
  );
  console.log('  Acceso: admin@demo.cu / demo1234');
}

main().catch((e: unknown) => {
  console.error('✖ Error al sembrar:', e instanceof Error ? e.message : e);
  process.exit(1);
});
