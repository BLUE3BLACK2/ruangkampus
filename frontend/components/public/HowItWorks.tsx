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
          <span className="text-xs font-semibold tracking-[0.16em] text-blue-600">
            HOW IT WORKS
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Reservasi ruangan,
            <span className="text-blue-600"> tanpa ribet.</span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Hanya beberapa langkah untuk menemukan ruangan yang tepat dan
            mengatur kegiatan kampusmu.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-blue-600 transition-transform duration-300 group-hover:scale-150" />

                <span className="text-xs font-medium tracking-wide text-slate-400">
                  {step.accent}
                </span>
              </div>

              {/* Content */}
              <div className="mt-8">
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
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Siap menemukan ruang yang sesuai?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mulai dari katalog ruangan dan temukan tempat terbaik untuk
              kegiatanmu.
            </p>
          </div>

          <Link
            href="/rooms"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Explore room catalog
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}