
import Link from "next/link";

const steps = [
  {
    title: "Cari Ruangan",
    description:
      "Jelajahi katalog ruangan atau gunakan AI Assistant untuk mencari ruangan berdasarkan kebutuhan.",
    accent: "Explore rooms",
  },
  {
    title: "Pilih Jadwal",
    description:
      "Tentukan tanggal, waktu, kapasitas, dan kebutuhan fasilitas untuk kegiatanmu.",
    accent: "Find your time",
  },
  {
    title: "Ajukan Reservasi",
    description:
      "Lengkapi formulir reservasi dan kirim permintaan untuk mendapatkan persetujuan.",
    accent: "Send request",
  },
  {
    title: "Pantau Status",
    description:
      "Pantau status pengajuan reservasi melalui halaman riwayat reservasi.",
    accent: "Stay updated",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
            HOW IT WORKS
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Reservasi ruangan,
            <span className="text-blue-600"> tanpa ribet.</span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Hanya beberapa langkah untuk menemukan ruangan yang tepat
            dan mengatur kegiatan kampusmu.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50"
            >
              {/* Step Number */}
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-xs font-medium tracking-wide text-slate-400">
                  {step.accent}
                </span>
              </div>

              {/* Content */}
              <div className="mt-7">
                <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>

              {/* Progress */}
              <div className="mt-auto flex gap-1.5 pt-7">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= index ? "bg-blue-600" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Siap menemukan ruang yang sesuai?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mulai dari katalog ruangan dan temukan tempat terbaik
              untuk kegiatanmu.
            </p>
          </div>

          <Link
            href="/rooms"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Jelajahi Ruangan
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
