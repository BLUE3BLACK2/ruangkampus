'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/styles';
import { useMounted } from '@/features/auth/useMounted';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

interface NavLink {
  href: string;
  label: string;
}

function buildLinks(role?: string): NavLink[] {
  const links: NavLink[] = [
    { href: '/', label: 'Beranda' },
    { href: '/rooms', label: 'Ruangan' },
  ];

  if (role === 'admin') links.push({ href: '/admin', label: 'Dashboard Admin' });
  else if (role) links.push({ href: '/reservations', label: 'Riwayat Reservasi' });

  return links;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [open, setOpen] = useState(false);

  const currentUser = mounted ? user : null;
  const links = buildLinks(currentUser?.role);
  const closeMenu = () => setOpen(false);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  async function handleLogout() {
    await authService.logout();
    clearAuth();
    closeMenu();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="text-xl font-extrabold text-blue-600">
          RuangKuliah
        </Link>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-700 md:hidden"
        >
          {open ? 'Tutup' : 'Menu'}
        </button>

        <div
          className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-16 flex-col gap-3 border-b border-slate-200 bg-white px-5 pb-5 pt-3 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0`}
        >
          <nav className="flex flex-col gap-1 md:flex-row">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <>
                <span className="text-sm text-slate-500">
                  {currentUser.name} · {currentUser.role}
                </span>
                <button type="button" className={buttonClass({ variant: 'ghost', size: 'sm' })} onClick={handleLogout}>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className={buttonClass({ variant: 'ghost', size: 'sm' })}>
                  Masuk
                </Link>
                <Link href="/register" onClick={closeMenu} className={buttonClass({ size: 'sm' })}>
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}