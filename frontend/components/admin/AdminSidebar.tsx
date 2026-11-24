
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Building2,
  Users,
  ChartNoAxesCombined,
  Settings,
  GraduationCap,
  Flame,
  BrainCircuit,
  TrendingUp,
  UserRound,
} from "lucide-react";

const mainMenu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reservasi", href: "/admin/reservations", icon: CalendarDays },
  { name: "Data Ruangan", href: "/admin/rooms", icon: DoorOpen },
  { name: "Fasilitas", href: "/admin/facilities", icon: Building2 },
  { name: "Pengguna", href: "/admin/users", icon: Users },
];

const analyticsMenu = [
  { name: "Overview", href: "/admin/analytics", icon: ChartNoAxesCombined },
  { name: "Demand Heatmap", href: "/admin/analytics/heatmap", icon: Flame },
  {
    name: "Prediksi Penggunaan",
    href: "/admin/analytics/predictions",
    icon: TrendingUp,
  },
  {
    name: "AI Insights",
    href: "/admin/analytics/insights",
    icon: BrainCircuit,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
      return pathname === href;
  };
  
  const linkStyle = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
        active
        ? "bg-white text-blue-700 font-semibold shadow-lg shadow-blue-950/10"
        : "text-white hover:bg-white/15 hover:text-white"
    }`;

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col bg-gradient-to-b from-[#0756C9] to-[#087DEB] text-white md:w-64">
      {/* Logo */}
      <div className="flex h-24 items-center justify-center gap-3 border-b border-white/10 px-3 md:justify-start md:px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-950/20">
          <GraduationCap size={25} className="text-blue-600" />
        </div>

        <div className="hidden md:block">
          <h1 className="text-lg font-bold tracking-tight">
            RuangKuliah
          </h1>
          <p className="text-xs text-blue-200">Admin Panel</p>
        </div>
      </div>

      {/* Profile Greeting */}
      <div className="border-b border-white/10 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-blue-400/20">
            <UserRound size={23} className="text-blue-100" />
          </div>

          <div className="hidden md:block">
            <p className="text-sm text-blue-100">Selamat datang,</p>
            <p className="font-semibold text-white">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Main Menu */}
        <div>
          <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-widest text-blue-200/60 md:block">
            Menu Utama
          </p>

          <div className="space-y-2">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={linkStyle(active)}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="hidden md:block">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Analytics */}
        <div>
          <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-widest text-blue-200/60 md:block">
            Analytics
          </p>

          <div className="space-y-2">
            {analyticsMenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={linkStyle(active)}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="hidden md:block">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div>
          <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-widest text-blue-200/60 md:block">
            Lainnya
          </p>

          <Link
            href="/admin/settings"
            title="Pengaturan"
            className={linkStyle(isActive("/admin/settings"))}
          >
            <Settings size={20} className="shrink-0" />
            <span className="hidden md:block">Pengaturan</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="hidden rounded-xl border border-white/10 bg-white/5 p-3 md:block">
          <p className="text-xs font-medium text-white">
            RuangKuliah
          </p>
          <p className="mt-1 text-[11px] text-blue-200">
            Sistem Reservasi Ruangan Kampus
          </p>
        </div>

        <div className="flex justify-center pt-2 md:hidden">
          <GraduationCap size={20} className="text-blue-200" />
        </div>
      </div>
    </aside>
  );
}
