
"use client";

import { useCallback, useEffect, useState } from "react";
import {
    RefreshCw,
    TrendingUp,
    CalendarDays,
    Database,
    Info,
} from "lucide-react";
import api from "@/services/api";

interface PredictionItem {
    date: string;
    day_name: string;
    predicted_reservations: number | null;
    historical_average: number | null;
    history_sample_count: number;
    history_samples: {
        date: string;
        reservations: number;
    }[];
    status: string;
    reason?: string;
}

interface PredictionData {
    generated_at: string;
    forecast_period: {
        start_date: string;
        end_date: string;
    };
    method: string;
    history_weeks: number;
    minimum_history_samples: number;
    data_basis: string;
    history_available: boolean;
    message?: string;
    predictions: PredictionItem[];
}

function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function PredictionsClient() {
    const [data, setData] = useState<PredictionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPrediction, setSelectedPrediction] =
        useState<PredictionItem | null>(null);

    const loadPredictions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/analytics/predictions");

            setData(response.data.data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Gagal mengambil data prediksi."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPredictions();
    }, [loadPredictions]);

    const availablePredictions =
        data?.predictions.filter(
            (item) => item.predicted_reservations !== null
        ) || [];

    const totalPredicted = availablePredictions.reduce(
        (total, item) => total + (item.predicted_reservations || 0),
        0
    );

    const highestPrediction =
        availablePredictions.length > 0
            ? Math.max(
                ...availablePredictions.map(
                    (item) => item.predicted_reservations || 0
                )
            )
            : null;

    const chartMax = Math.max(
        1,
        ...availablePredictions.map(
            (item) => item.predicted_reservations || 0
        )
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Prediksi Penggunaan Ruangan
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Perkiraan jumlah reservasi berdasarkan pola penggunaan
                        historis.
                    </p>
                </div>

                <button
                    onClick={loadPredictions}
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

            {loading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                    <RefreshCw
                        className="mx-auto mb-3 animate-spin text-blue-600"
                        size={28}
                    />
                    <p className="text-sm text-slate-500">
                        Menghitung prediksi reservasi...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    {error}
                    <button
                        onClick={loadPredictions}
                        className="ml-2 font-semibold underline"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {!loading && data && !error && (
                <>
                    {/* Forecast period */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#0756C9] to-[#087DEB] p-6 text-white shadow-lg shadow-blue-200/50">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-blue-100">
                                    Periode Prediksi
                                </p>
                                <h2 className="mt-2 text-xl font-bold">
                                    7 Hari Mendatang
                                </h2>
                                <p className="mt-1 text-sm text-blue-100">
                                    {formatDate(data.forecast_period.start_date)}
                                    {" - "}
                                    {formatDate(data.forecast_period.end_date)}
                                </p>
                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                                <TrendingUp size={30} />
                            </div>
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <TrendingUp size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Total Prediksi Reservasi
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {availablePredictions.length > 0
                                    ? totalPredicted
                                    : "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Akumulasi 7 hari
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                <CalendarDays size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Hari dengan Prediksi Tertinggi
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {highestPrediction !== null
                                    ? highestPrediction
                                    : "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Jumlah reservasi
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Database size={20} />
                            </div>
                            <p className="text-sm text-slate-500">
                                Minimal Sampel Historis
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {data.minimum_history_samples} Minggu
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Maksimal {data.history_weeks} minggu
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-800">
                                Grafik Prediksi Reservasi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Perkiraan jumlah reservasi untuk setiap hari.
                            </p>
                        </div>

                        {availablePredictions.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 p-10 text-center">
                                <Info className="mx-auto mb-3 text-slate-400" size={28} />
                                <p className="font-semibold text-slate-700">
                                    Prediksi belum tersedia
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Data reservasi yang disetujui belum mencukupi
                                    untuk menghitung prediksi.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {data.predictions.map((item) => {
                                    const value = item.predicted_reservations;
                                    const percentage =
                                        value !== null
                                            ? (value / chartMax) * 100
                                            : 0;

                                    return (
                                        <button
                                            key={item.date}
                                            onClick={() =>
                                                setSelectedPrediction(item)
                                            }
                                            className="w-full text-left"
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {item.day_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {formatDate(item.date)}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {value !== null
                                                            ? `${value} reservasi`
                                                            : "Data belum cukup"}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {item.history_sample_count} sampel historis
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        value !== null
                                                            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                                            : "bg-slate-300"
                                                    }`}
                                                    style={{
                                                        width:
                                                            value !== null
                                                                ? `${Math.max(percentage, 2)}%`
                                                                : "100%",
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Detail */}
                    {selectedPrediction && (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-blue-900">
                                        Detail Prediksi
                                    </h3>
                                    <p className="mt-1 text-sm text-blue-800">
                                        {selectedPrediction.day_name},{" "}
                                        {formatDate(selectedPrediction.date)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedPrediction(null)}
                                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                                >
                                    Tutup
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl bg-white p-4">
                                    <p className="text-xs text-slate-500">
                                        Prediksi Reservasi
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">
                                        {selectedPrediction.predicted_reservations ?? "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-4">
                                    <p className="text-xs text-slate-500">
                                        Rata-rata Historis
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">
                                        {selectedPrediction.historical_average ?? "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-4">
                                    <p className="text-xs text-slate-500">
                                        Jumlah Sampel
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">
                                        {selectedPrediction.history_sample_count}
                                    </p>
                                </div>
                            </div>

                            {selectedPrediction.history_samples.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-semibold text-blue-900">
                                        Data Historis
                                    </p>

                                    <div className="space-y-2">
                                        {selectedPrediction.history_samples.map(
                                            (sample) => (
                                                <div
                                                    key={sample.date}
                                                    className="flex justify-between rounded-lg bg-white px-4 py-2 text-sm"
                                                >
                                                    <span className="text-slate-600">
                                                        {formatDate(sample.date)}
                                                    </span>
                                                    <span className="font-semibold text-slate-800">
                                                        {sample.reservations} reservasi
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Method information */}
                </>
            )}
        </div>
    );
}
