
"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, CalendarDays, Clock3, Info } from "lucide-react";
import api from "@/services/api";

interface HeatmapBucket {
    start_time: string;
    end_time: string;
    total_reservations: number;
    average_reservations: number | null;
    observed_days: number;
    demand_level: string;
}

interface HeatmapDay {
    weekday: string;
    weekday_number: number;
    observed_days: number;
    history_available: boolean;
    buckets: HeatmapBucket[];
}

interface HeatmapData {
    method: string;
    data_source: string;
    data_basis: string;
    history_weeks_requested: number;
    minimum_history_weeks: number;
    history_available: boolean;
    coverage_start_date: string | null;
    coverage_start_source: string;
    observation_period: {
        start_date: string | null;
        end_date: string | null;
    };
    observed_days_total: number;
    operating_hours: {
        start: string;
        end: string;
    };
    message: string;
    coverage_note: string;
    days: HeatmapDay[];
}

const demandStyles: Record<string, { label: string; color: string }> = {
    busy: {
        label: "Ramai",
        color: "bg-blue-700 text-white",
    },
    moderate: {
        label: "Sedang",
        color: "bg-blue-400 text-white",
    },
    relatively_quiet: {
        label: "Sepi",
        color: "bg-blue-100 text-blue-800",
    },
    no_observed_demand: {
        label: "Tidak ada permintaan",
        color: "bg-slate-100 text-slate-500",
    },
    insufficient_data: {
        label: "Data kurang",
        color: "bg-slate-200 text-slate-500",
    },
};

function formatDate(date: string | null) {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function sourceLabel(source: string) {
    const labels: Record<string, string> = {
        operational: "Data operasional",
        demo: "Data demonstrasi",
        mixed: "Data campuran",
        no_data: "Belum ada data",
    };

    return labels[source] || source;
}

export default function AnalyticsHeatmapClient() {
    const [weeks, setWeeks] = useState(8);
    const [data, setData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadHeatmap = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/analytics/heatmap", {
                params: { weeks },
            });

            setData(response.data.data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Gagal mengambil data heatmap."
            );
        } finally {
            setLoading(false);
        }
    }, [weeks]);

    useEffect(() => {
        loadHeatmap();
    }, [loadHeatmap]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Analytics Heatmap
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Analisis tingkat kepadatan reservasi berdasarkan hari
                        dan waktu.
                    </p>
                </div>

                <button
                    onClick={loadHeatmap}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Perbarui Data
                </button>
            </div>

            {/* Period selector */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-800">
                            Periode Pengamatan
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Pilih rentang data historis yang ingin dianalisis.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {[4, 8, 12].map((period) => (
                            <button
                                key={period}
                                onClick={() => setWeeks(period)}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                                    weeks === period
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                        : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                }`}
                            >
                                {period} Minggu
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                    <RefreshCw className="mx-auto mb-3 animate-spin text-blue-600" size={28} />
                    <p className="text-sm text-slate-500">
                        Memuat data heatmap...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    {error}
                    <button
                        onClick={loadHeatmap}
                        className="ml-2 font-semibold underline"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {!loading && data && !error && (
                <>
                    {/* Information cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarDays size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Total Hari Pengamatan
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {data.observed_days_total}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                <Clock3 size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Jam Operasional
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {data.operating_hours.start} - {data.operating_hours.end}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <CalendarDays size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Periode Pengamatan
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                                {formatDate(data.observation_period.start_date)}
                            </p>
                            <p className="text-xs text-slate-400">
                                Sampai {formatDate(data.observation_period.end_date)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Info size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Sumber Data
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-800">
                                {sourceLabel(data.data_source)}
                            </p>
                            <p className="text-xs text-slate-400">
                                Reservasi yang disetujui
                            </p>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-slate-800">
                                Peta Kepadatan Reservasi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Rata-rata jumlah reservasi pada setiap hari dan
                                interval waktu.
                            </p>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-4">
                            {Object.entries(demandStyles).map(([key, style]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className={`h-4 w-4 rounded ${style.color.split(" ")[0]}`} />
                                    <span className="text-xs text-slate-600">
                                        {style.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] border-separate border-spacing-1">
                                <thead>
                                    <tr>
                                        <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                                            Hari
                                        </th>

                                        {data.days[0]?.buckets.map((bucket) => (
                                            <th
                                                key={bucket.start_time}
                                                className="min-w-20 px-1 py-3 text-center text-xs font-semibold text-slate-500"
                                            >
                                                {bucket.start_time}
                                                <span className="block font-normal text-slate-400">
                                                    {bucket.end_time}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.days.map((day) => (
                                        <tr key={day.weekday}>
                                            <td className="rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                                                {day.weekday}
                                                <span className="mt-1 block text-xs font-normal text-slate-400">
                                                    {day.observed_days} hari
                                                </span>
                                            </td>

                                            {day.buckets.map((bucket) => {
                                                const style =
                                                    demandStyles[bucket.demand_level] ||
                                                    demandStyles.insufficient_data;

                                                return (
                                                    <td
                                                        key={bucket.start_time}
                                                        title={`${day.weekday}, ${bucket.start_time}-${bucket.end_time}: ${style.label}. Rata-rata: ${bucket.average_reservations ?? "-"}`}
                                                        className={`rounded-lg px-2 py-4 text-center text-xs font-semibold ${style.color}`}
                                                    >
                                                        {bucket.average_reservations !== null
                                                            ? bucket.average_reservations.toFixed(2)
                                                            : "-"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="mt-4 text-xs text-slate-400">
                            Angka pada setiap sel menunjukkan rata-rata
                            reservasi per interval waktu. Arahkan kursor ke sel
                            untuk melihat keterangannya.
                        </p>
                    </div>

                    {/* Coverage information */}
                </>
            )}
        </div>
    );
}
