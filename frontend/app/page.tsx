import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";

import { buttonClass } from "@/components/ui/styles";

const features = [
  {
    icon: Search,
    title: "Cari Ruangan",
    description:
      "Temukan ruangan berdasarkan nama, gedung, kapasitas, dan fasilitas.",
  },
  {
    icon: CalendarCheck,
    title: "Ajukan Reservasi",
    description:
      "Ajukan peminjaman ruangan sesuai tanggal dan waktu kegiatan.",
  },
  {
    icon: Clock3,
    title: "Pantau Status",
    description:
      "Lihat riwayat dan status persetujuan reservasi melalui akunmu.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-sky-600 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[50px] border-white/10" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              <ShieldCheck size={17} />
              Sistem Reservasi Ruang Kampus
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Temukan Ruang.
              <br />
              Atur Kegiatan.
              <br />
              Lebih Mudah.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
              RuangKuliah membantu mahasiswa dan dosen mencari
              ruangan kampus, mengajukan reservasi, serta memantau
              status pengajuan dalam satu platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Jelajahi Ruangan
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center rounded-xl border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Buat Akun
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-white p-6 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700">
                    RuangKuliah
                  </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Sistem Reservasi
                  </span>
                </div>

                <div className="mt-8 rounded-2xl bg-blue-50 p-6">
                  <p className="text-sm text-slate-500">
                    Reservasi Ruangan
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    Lebih teratur
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Cari ruangan yang sesuai dengan kapasitas dan
                    kebutuhan kegiatan kampusmu.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <Search className="text-blue-600" />
                    <p className="mt-3 text-sm font-semibold">
                      Pencarian
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <CalendarCheck className="text-blue-600" />
                    <p className="mt-3 text-sm font-semibold">
                      Reservasi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            Fitur RuangKuliah
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            Semua kebutuhan reservasi dalam satu tempat
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Mulai dari pencarian ruangan hingga pemantauan
            pengajuan reservasi.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Icon size={25} />
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-blue-50 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Siap mencari ruangan?
            </h2>

            <p className="mt-2 text-slate-600">
              Lihat daftar ruangan yang tersedia di kampus.
            </p>
          </div>

          <Link
            href="/rooms"
            className={buttonClass({ size: "md" })}
          >
            Lihat Katalog Ruangan
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}