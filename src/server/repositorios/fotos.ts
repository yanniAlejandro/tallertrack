import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export const BUCKET_FOTOS = 'fotos-ordenes';

/** Fotos con URL firmada (1 h): el bucket es privado. */
export async function fotosDeOrden(ordenId: string) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('orden_fotos')
    .select('*')
    .eq('orden_id', ordenId)
    .order('creado_en');
  if (error) throw error;
  if (data.length === 0) return [];

  const { data: firmadas } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(
    data.map((f) => f.ruta_storage),
    3600,
  );
  const urls = new Map(firmadas?.map((f) => [f.path, f.signedUrl]) ?? []);
  return data.map((f) => ({ ...f, url: urls.get(f.ruta_storage) ?? null }));
}
