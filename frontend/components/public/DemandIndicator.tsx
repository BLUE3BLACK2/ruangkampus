
"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

interface DemandData {
  data_source: string;
  history_available: boolean;
  observation_period: {
    start_date: string | null;
    end_date: string | null;
  };
  operating_hours: {
    start: string;
    end: string;
  };
  summary: {
    busy: number;
    moderate: number;
    relatively_quiet: number;
  };
  message: string;
  coverage_note: string;
}

const demandLevels = [
  {
    key: "relatively_quiet" as const,
    label: "Rendah",
    description: "Permintaan ruangan relatif rendah",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    bars: 1,
    suggestion: "Waktu dengan permintaan relatif lebih rendah.",
  },
  {
    key: "moderate" as const,
    label: "Sedang",
    description: "Permintaan ruangan cukup aktif",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    bars: 2,
    suggestion: "Pertimbangkan alternatif waktu.",
  },
  {
    key: "busy" as const,
    label: "Tinggi",
    description: "Permintaan ruangan sedang tinggi",
    badge: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
    bar: "bg-red-500",
    bars: 3,
    suggestion: "Disarankan merencanakan reservasi lebih awal.",
  },
];

export default function DemandIndicator() {
  const [data, setData] = useState<DemandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const response = await api.get("/room-demand");
        setData(response.data.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDemand();
  }, []);

  const hasHistory = data?.history_available === true;

  return (
    <section className="border-y border-slate-200 bg-slate-50/80 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Smart Insight
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Room Demand Indicator
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Kenali tingkat permintaan ruangan berdasarkan data
              reservasi historis untuk membantu menentukan pilihan
              waktu yang lebih tepat.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 4 3 5-6" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Demand Overview
              </p>
              <p className="text-xs text-slate-500">
                3 tingkat permintaan
              </p>
            </div>
          </div>
        </div>

        {/* Demand Cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {demandLevels.map((level) => (
            <article
              key={level.label}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${level.dot}`} />

                  <span
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${level.badge}`}
                  >
                    {level.label}
                  </span>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 text-slate-300 transition group-hover:text-blue-500"
                >
                  <path d="M3 3v18h18" />
                  <path d="m7 14 4-4 4 3 5-6" />
                </svg>
              </div>

              <div className="mt-7">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`h-3 flex-1 rounded-full ${
                        bar <= level.bars
                          ? level.bar
                          : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-4 text-sm font-medium text-slate-800">
                  {level.description}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : error
                    ? "-"
                    : data?.summary[level.key] ?? 0}
                </p>

                <p className="text-xs text-slate-500">
                  {hasHistory
                    ? "Bucket waktu teridentifikasi"
                    : "Bucket waktu teridentifikasi"}
                </p>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                >
                  <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>

                <p className="text-xs leading-5 text-slate-600">
                  {level.suggestion}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Data Status */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8h.01M11 12h1v4h1" />
            </svg>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {loading
                  ? "Memuat data permintaan..."
                  : error
                  ? "Data tidak dapat dimuat"
                  : hasHistory
                  ? "Data historis tersedia"
                  : "Data historis belum mencukupi"}
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-600">
                {loading
                  ? "Mengambil informasi permintaan ruangan."
                  : error
                  ? "Terjadi kesalahan saat mengambil data. Silakan coba kembali nanti."
                  : data?.message}
              </p>

              {!loading && !error && data && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Jam operasional: {data.operating_hours.start} –{" "}
                  {data.operating_hours.end}
                  {data.observation_period.start_date &&
                    data.observation_period.end_date && (
                      <>
                        {" "} | Periode pengamatan:{" "}
                        {data.observation_period.start_date} –{" "}
                        {data.observation_period.end_date}
                      </>
                    )}
                </p>
              )}

              {!loading && !error && data?.coverage_note && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {data.coverage_note}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
