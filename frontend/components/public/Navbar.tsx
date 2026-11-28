
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navClass = (href: string) =>
    `text-sm font-medium transition ${
      isActive(href)
        ? "text-blue-600"
        : "text-slate-600 hover:text-blue-600"
    }`;

  const mobileNavClass = (href: string) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive(href)
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
    }`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 21v-6h6v6" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900">
            Ruang<span className="text-blue-600">Kuliah</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className={navClass("/")}>
            Beranda
          </Link>

          <Link href="/rooms" className={navClass("/rooms")}>
            Ruangan
          </Link>

          {user && user.role !== "admin" && (
            <Link
              href="/reservations"
              className={navClass("/reservations")}
            >
              Reservasi
            </Link>
          )}

          {user?.role === "admin" && (
            <Link href="/admin" className={navClass("/admin")}>
              Dashboard Admin
            </Link>
          )}
        </div>

        {/* Desktop Authentication */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              <span className="text-sm font-medium text-slate-700">
                {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={mobileNavClass("/")}
            >
              Beranda
            </Link>

            <Link
              href="/rooms"
              onClick={closeMobileMenu}
              className={mobileNavClass("/rooms")}
            >
              Ruangan
            </Link>

            {user && user.role !== "admin" && (
              <Link
                href="/reservations"
                onClick={closeMobileMenu}
                className={mobileNavClass("/reservations")}
              >
                Reservasi
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className={mobileNavClass("/admin")}
              >
                Dashboard Admin
              </Link>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {loading ? (
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
            ) : user ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-slate-700">
                  {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
