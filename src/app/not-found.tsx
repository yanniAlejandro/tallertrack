import Link from 'next/link';

export default function NoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="font-mono text-sm font-semibold text-marca-500">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Esta página no existe</h1>
      <p className="mt-2 text-sm text-slate-600">
        Puede que el enlace esté mal escrito o que se haya borrado.
      </p>
      <Link href="/" className="mt-5 font-medium text-marca-700 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
