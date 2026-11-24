
"use client";

import { useState } from "react";
import {
    BrainCircuit,
    Sparkles,
    RefreshCw,
    Database,
    AlertCircle,
    CheckCircle2,
    Clock,
} from "lucide-react";
import api from "@/services/api";

interface InsightData {
    status: "success" | "insufficient_data" | "ai_unavailable";
    message: string;
    data_source?: string;
    overview?: {
        total_approved_reservations: number;
        total_participants: number;
        busiest_day: {
            date: string;
            day_name: string;
            total_reservations: number;
        } | null;
        most_reserved_rooms: {
            room_id: number;
            room_code: string;
            room_name: string;
            total_reservations: number;
        }[];
    };
    prediction?: {
        history_available: boolean;
        predictions: {
            date: string;
            day_name: string;
            predicted_reservations: number | null;
            history_sample_count: number;
        }[];
    };
    insight: {
        model: string;
        content: string;
        usage: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
        };
    } | null;
}

function sourceLabel(source?: string) {
    const labels: Record<string, string> = {
        operational: "Data operasional",
        demo: "Data demonstrasi",
        mixed: "Data campuran",
        no_data: "Belum ada data",
    };

    return source ? labels[source] || source : "-";
}

export default function InsightsClient() {
    const [data, setData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateInsights = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.post("/admin/analytics/insights");

            setData(response.data.data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Gagal menghasilkan AI Insights. Silakan coba kembali."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    AI Insights
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Analisis dan rekomendasi penggunaan ruangan menggunakan
                    kecerdasan buatan.
                </p>
            </div>

            {/* Introduction */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0756C9] to-[#087DEB] p-6 text-white shadow-lg shadow-blue-200/50">
                <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                            <BrainCircuit size={27} />
                        </div>

                        <h2 className="text-xl font-bold">
                            Analisis Cerdas RuangKuliah
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-blue-100">
                            Gunakan AI untuk menganalisis data reservasi,
                            memahami pola penggunaan ruangan, dan mendapatkan
                            rekomendasi berdasarkan statistik serta prediksi
                            historis.
                        </p>
                    </div>

                    <button
                        onClick={generateInsights}
                        disabled={loading}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <Sparkles size={18} />
                        )}

                        {loading ? "Sedang Menganalisis..." : "Hasilkan AI Insights"}
                    </button>
                </div>

                <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/5" />
                <div className="absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-white/5" />
            </div>

            {/* Error */}
            {error && (
                <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                    <AlertCircle className="shrink-0" size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Empty state */}
            {!data && !loading && !error && (
                <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <BrainCircuit size={32} />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">
                        Belum Ada Hasil Analisis
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                        Klik tombol Hasilkan AI Insights untuk memulai analisis
                        berdasarkan data reservasi dan prediksi penggunaan
                        ruangan.
                    </p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                    <BrainCircuit
                        className="mx-auto mb-4 animate-pulse text-blue-600"
                        size={38}
                    />
                    <h3 className="font-semibold text-slate-800">
                        AI sedang menganalisis data...
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Mohon tunggu, proses ini mungkin membutuhkan beberapa
                        saat.
                    </p>
                </div>
            )}

            {/* Results */}
            {data && !loading && (
                <div className="space-y-5">
                    {/* Status */}
                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-5 ${
                            data.status === "success"
                                ? "border-emerald-100 bg-emerald-50"
                                : data.status === "insufficient_data"
                                    ? "border-amber-100 bg-amber-50"
                                    : "border-red-100 bg-red-50"
                        }`}
                    >
                        {data.status === "success" ? (
                            <CheckCircle2 className="shrink-0 text-emerald-600" size={21} />
                        ) : (
                            <AlertCircle
                                className={`shrink-0 ${
                                    data.status === "insufficient_data"
                                        ? "text-amber-600"
                                        : "text-red-600"
                                }`}
                                size={21}
                            />
                        )}

                        <div>
                            <h3 className="font-semibold text-slate-800">
                                {data.status === "success"
                                    ? "Analisis Berhasil"
                                    : data.status === "insufficient_data"
                                        ? "Data Historis Belum Mencukupi"
                                        : "AI Sementara Tidak Tersedia"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {data.message}
                            </p>
                        </div>
                    </div>

                    {/* Overview */}
                    {data.overview && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Total Reservasi Disetujui
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-800">
                                    {data.overview.total_approved_reservations}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Total Peserta
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-800">
                                    {data.overview.total_participants}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Hari Tersibuk
                                </p>
                                <p className="mt-2 text-lg font-bold text-slate-800">
                                    {data.overview.busiest_day?.day_name || "-"}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {data.overview.busiest_day
                                        ? `${data.overview.busiest_day.total_reservations} reservasi`
                                        : "Belum tersedia"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI result */}
                    {data.insight && (
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Sparkles size={21} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-800">
                                            Hasil Analisis AI
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Model: {data.insight.model}
                                        </p>
                                    </div>
                                </div>

                                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                    Analisis Selesai
                                </span>
                            </div>

                            <div className="whitespace-pre-wrap p-6 text-sm leading-8 text-slate-700">
                                {data.insight.content}
                            </div>

                            {data.insight.usage && (
                                <div className="flex flex-wrap gap-4 border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs text-slate-500">
                                    <span>
                                        Token input: {data.insight.usage.prompt_tokens ?? "-"}
                                    </span>
                                    <span>
                                        Token output: {data.insight.usage.completion_tokens ?? "-"}
                                    </span>
                                    <span>
                                        Total token: {data.insight.usage.total_tokens ?? "-"}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Room summary */}
                    {data.overview?.most_reserved_rooms &&
                        data.overview.most_reserved_rooms.length > 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <h2 className="mb-4 font-bold text-slate-800">
                                    Ruangan Paling Sering Direservasi
                                </h2>

                                <div className="space-y-3">
                                    {data.overview.most_reserved_rooms.map((room) => (
                                        <div
                                            key={room.room_id}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {room.room_name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {room.room_code}
                                                </p>
                                            </div>

                                            <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                                                {room.total_reservations} reservasi
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    
                    {/* Metadata */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold text-slate-800">
                            Informasi Analisis
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <Database className="text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Sumber Data
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {sourceLabel(data.data_source)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Dasar Analisis
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700">
                                        Reservasi yang disetujui
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
