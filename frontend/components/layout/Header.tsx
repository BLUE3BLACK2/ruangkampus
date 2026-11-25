
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/styles";
import { useMounted } from "@/features/auth/useMounted";
import { authService } from "@/services/authService";
import {
  clearAuth,
  setAuth,
  setAuthInitialized,
  useAuthStore,
} from "@/store/authStore";

interface NavLink {
  href: string;
  label: string;
}

function buildLinks(role?: string): NavLink[] {
  const links: NavLink[] = [
    { href: "/", label: "Beranda" },
    { href: "/rooms", label: "Ruangan" },
  ];

  if (role === "admin") {
    links.push({ href: "/admin", label: "Dashboard Admin" });
  } else if (role === "mahasiswa" || role === "dosen") {
    links.push({
      href: "/reservations",
      label: "Riwayat Reservasi",
    });
  }

  return links;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();

  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!authService.getToken()) {
        setAuthInitialized();
        return;
      }

      try {
        const currentUser = await authService.getMe();

        if (active) setAuth(currentUser);
      } catch {
        authService.logout().catch(() => undefined);

        if (active) clearAuth();
      } finally {
        if (active) setAuthInitialized();
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const currentUser = mounted ? user : null;
  const links = buildLinks(currentUser?.role);

  const closeMenu = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      closeMenu();
      router.push("/");
      router.refresh();
    }
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#d9d7cc] bg-[#f5f3ec]">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-5 px-5">
        <Link
          href="/"
          className="shrink-0 font-serif text-[1.55rem] font-bold tracking-tight text-[#315b48]"
        >
          RuangKuliah
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-label="Buka navigasi"
          onClick={() => setOpen((value) => !value)}
          className="rounded-[5px] border border-[#d9d7cc] px-3.5 py-2 text-sm font-medium text-[#41473f] transition-colors hover:bg-[#eeece3] md:hidden"
        >
          {open ? "Tutup" : "Menu"}
        </button>

        <div
          className={`${
            open ? "flex" : "hidden"
          } absolute inset-x-0 top-16 flex-col gap-4 border-b border-[#d9d7cc] bg-[#f5f3ec] px-5 pb-5 pt-4 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0`}
        >
          <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={
                  isActive(link.href) ? "page" : undefined
                }
                className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "border-[#315b48] text-[#315b48]"
                    : "border-transparent text-[#686b61] hover:border-[#b9c8ba] hover:text-[#315b48]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser ? (
              <>
                <span className="text-sm text-[#77796f]">
                  <span className="font-semibold text-[#292d27]">
                    {currentUser.name}
                  </span>
                  <span className="mx-2 text-[#b4b2a7]">·</span>
                  {currentUser.role}
                </span>

                <button
                  type="button"
                  className={buttonClass({
                    variant: "ghost",
                    size: "sm",
                  })}
                  onClick={handleLogout}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className={buttonClass({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Masuk
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenu}
                  className={buttonClass({ size: "sm" })}
                >
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
