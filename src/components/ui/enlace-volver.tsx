import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function EnlaceVolver({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-marca-700"
    >
      <ArrowLeft className="size-4" aria-hidden /> {children}
    </Link>
  );
}
