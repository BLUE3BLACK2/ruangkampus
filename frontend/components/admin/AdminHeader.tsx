
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  ChevronDown,
  UserRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminHeader() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();
  
  const handleLogout = async () => {
      if (loggingOut) return;

      setLoggingOut(true);
      setProfileOpen(false);

      try {
          await logout();
          router.replace("/login");
      } finally {
          router.refresh();
      }
  };

  return (
    <header className="flex min-h-24 items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 md:px-8">
      {/* Judul Halaman */}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">
          Panel Administrasi
        </p>
        <h2 className="truncate text-xl font-bold text-slate-900 md:text-2xl">
          Dashboard Admin
        </h2>
      </div>

      {/* Aksi Header */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Pilihan Periode */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm lg:flex">
          <select
            aria-label="Pilih periode"
            defaultValue="month"
            className="cursor-pointer bg-transparent outline-none"
          >
            <option value="today">Hari ini</option>
            <option value="week">Minggu ini</option>
            <option value="month">Bulan ini</option>
          </select>
          <ChevronDown size={16} className="text-slate-400" />
        </div>

        {/* Pencarian */}
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex">
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className="w-28 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 md:w-36"
          />
          <Search size={19} className="text-slate-500" />
        </div>

        {/* Notifikasi */}
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <Bell size={22} />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Profil Admin */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Menu profil admin"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-cyan-500 text-white shadow-sm">
              <UserRound size={20} />
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-500 sm:block"
            />
          </button>

          {/* Dropdown Profil */}
          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  Administrator
                </p>
                <p className="text-xs text-slate-500">
                  Panel RuangKuliah
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={18} />
                {loggingOut ? "Sedang keluar..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
