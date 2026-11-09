import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegistrarServiceWorker } from '@/components/pwa/registrar-sw';

export const metadata: Metadata = {
  title: {
    default: 'TallerTrack · TecnoFix',
    template: '%s · TallerTrack',
  },
  description:
    'Órdenes de servicio para talleres de reparación de celulares: recepción, estados, piezas, garantía y avisos por WhatsApp.',
  applicationName: 'TallerTrack',
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: 'TallerTrack', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#0f4c75',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CU">
      <body className="min-h-dvh">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
