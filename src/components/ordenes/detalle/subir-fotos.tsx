'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { crearClienteNavegador } from '@/lib/supabase/navegador';
import { registrarFoto } from '@/server/acciones/ordenes';
import { Spinner } from '@/components/ui/spinner';

const LADO_MAXIMO = 1280;
const CALIDAD_WEBP = 0.72;

/**
 * Reduce la foto en el propio teléfono (máx. 1280 px, WebP) antes de subirla:
 * una foto de 4 MB queda en ~150 KB, clave con datos móviles caros y lentos.
 */
async function comprimirAWebp(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob(
      (b) => (b ? resolver(b) : rechazar(new Error('No se pudo procesar la imagen'))),
      'image/webp',
      CALIDAD_WEBP,
    ),
  );
}

export function SubirFotos({
  ordenId,
  momento,
}: {
  ordenId: string;
  momento: 'recepcion' | 'reparacion';
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [progreso, setProgreso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alElegir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setError(null);
    const supabase = crearClienteNavegador();
    const lista = Array.from(archivos).slice(0, 6);
    try {
      for (const [i, archivo] of lista.entries()) {
        setProgreso(`Subiendo ${i + 1} de ${lista.length}…`);
        const blob = await comprimirAWebp(archivo);
        const ruta = `ordenes/${ordenId}/${crypto.randomUUID()}.webp`;
        const { error: e } = await supabase.storage
          .from('fotos-ordenes')
          .upload(ruta, blob, { contentType: 'image/webp', cacheControl: '31536000' });
        if (e) throw new Error('No se pudo subir la foto. Compruebe la conexión.');
        const r = await registrarFoto({ orden_id: ordenId, ruta, momento });
        if (!r.ok) throw new Error(r.error);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la foto');
    } finally {
      setProgreso(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 has-disabled:opacity-60">
        {progreso ? <Spinner /> : <Camera className="size-4" aria-hidden />}
        {progreso ?? 'Tomar o subir fotos'}
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={progreso !== null}
          onChange={(e) => alElegir(e.target.files)}
          className="sr-only"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
