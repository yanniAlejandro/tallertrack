import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TallerTrack · Órdenes de servicio',
    short_name: 'TallerTrack',
    description: 'Recepción, reparación y entrega de equipos para talleres de celulares.',
    lang: 'es-CU',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#0f4c75',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Recibir equipo', url: '/ordenes/nueva' },
      { name: 'Órdenes', url: '/ordenes' },
    ],
  };
}
