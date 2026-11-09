import { ImageResponse } from 'next/og';

/** Iconos de la PWA generados en el build: /icon/192 y /icon/512 (sin binarios en el repo). */
export function generateImageMetadata() {
  return [192, 512].map((lado) => ({
    id: String(lado),
    size: { width: lado, height: lado },
    contentType: 'image/png',
  }));
}

export default async function Icono({ id }: { id: Promise<string> }) {
  const lado = Number(await id);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f4c75',
        color: 'white',
        fontSize: lado * 0.42,
        fontWeight: 800,
        letterSpacing: -lado * 0.02,
        fontFamily: 'sans-serif',
      }}
    >
      TT
    </div>,
    { width: lado, height: lado },
  );
}
