'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ClipboardList,
  Home,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Item {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  soloAdmin?: boolean;
}

export const ITEMS_MENU: Item[] = [
  { href: '/', etiqueta: 'Inicio', icono: Home },
  { href: '/ordenes', etiqueta: 'Órdenes', icono: ClipboardList },
  { href: '/clientes', etiqueta: 'Clientes', icono: Users },
  { href: '/inventario', etiqueta: 'Inventario', icono: Package },
  { href: '/garantia', etiqueta: 'Garantía', icono: ShieldCheck },
  { href: '/reportes', etiqueta: 'Reportes', icono: BarChart3, soloAdmin: true },
  { href: '/ajustes', etiqueta: 'Ajustes', icono: Settings },
];

function activo(ruta: string, href: string) {
  return href === '/' ? ruta === '/' : ruta === href || ruta.startsWith(`${href}/`);
}

export function MenuLateral({ esAdmin }: { esAdmin: boolean }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      <Link
        href="/ordenes/nueva"
        className="mb-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-marca-800 shadow-sm hover:bg-marca-50"
      >
        <Plus className="size-4" aria-hidden /> Recibir equipo
      </Link>
      {ITEMS_MENU.filter((i) => esAdmin || !i.soloAdmin).map(({ href, etiqueta, icono: Icono }) => (
        <Link
          key={href}
          href={href}
          aria-current={activo(ruta, href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            activo(ruta, href)
              ? 'bg-white/15 text-white'
              : 'text-marca-100 hover:bg-white/10 hover:text-white',
          )}
        >
          <Icono className="size-4.5" aria-hidden />
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}

const ITEMS_MOVIL = ['/', '/ordenes', 'nueva', '/clientes', '/inventario'] as const;

/** Barra inferior en móvil: 4 secciones + botón central para recibir un equipo. */
export function BarraInferior() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS_MOVIL.map((href) => {
          if (href === 'nueva') {
            return (
              <li key={href} className="flex items-center justify-center">
                <Link
                  href="/ordenes/nueva"
                  aria-label="Recibir equipo"
                  className="-mt-5 flex size-13 items-center justify-center rounded-full bg-marca-700 text-white shadow-lg ring-4 ring-white"
                >
                  <Plus className="size-6" aria-hidden />
                </Link>
              </li>
            );
          }
          const item = ITEMS_MENU.find((i) => i.href === href)!;
          const Icono = item.icono;
          const esActivo = activo(ruta, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={esActivo ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  esActivo ? 'text-marca-700' : 'text-slate-500',
                )}
              >
                <Icono className="size-5" aria-hidden />
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
