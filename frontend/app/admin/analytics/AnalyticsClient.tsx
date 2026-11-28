
"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Activity,
    CalendarDays,
    Users,
    TrendingUp,
    Building2,
    Sparkles,
    RefreshCw,
    AlertCircle,
    Clock3,
} from "lucide-react";

import api from "@/services/api";

interface DailyReservation {
    date: string;
    total_reservations: number;
}

interface PopularRoom {
    room_id: number;
    room_code: string | null;
    room_name: string | null;
    total_reservations: number;
}

interface Overview {
    historical_period: {
        start_date: string;
        end_date: string;
    };
    data_source: string;
    data_basis: string;
    total_reservations: number;
    total_approved_reservations: number;
    total_participants: number;
    busiest_day: {
        date: string;
        day_name: string;
        total_reservations: number;
    } | null;
    daily_reservations: DailyReservation[];
    most_reserved_rooms: PopularRoom[];
}

interface Prediction {
    date: string;
    day_name: string;
    predicted_reservations: number | null;
    historical_average: number | null;
    history_sample_count: number;
    status: string;
}

interface PredictionResponse {
    history_available: boolean;
    message: string;
    forecast_period: {
        start_date: string;
        end_date: string;
    };
    predictions: Prediction[];
}

interface InsightResponse {
    status: string;
    message: string;
    insight: {
        model: string;
        content: string;
        usage: unknown;
    } | null;
}

function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function sourceLabel(source: string) {
    const labels: Record<string, string> = {
        demo: "Data Demo",
        operational: "Data Operasional",
        mixed: "Data Campuran",
        no_data: "Belum Ada Data",
    };

    return labels[source] || source;
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-[#172B4D]">
                        {value}
                    </h3>
                </div>

                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={23} />
                </div>
            </div>

            <p className="mt-3 text-xs text-gray-400">
                {description}
            </p>
        </div>
    );
}

export default function AnalyticsClient() {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [prediction, setPrediction] =
        useState<PredictionResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [insight, setInsight] = useState<InsightResponse | null>(null);
    const [insightLoading, setInsightLoading] = useState(false);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [overviewResponse, predictionResponse] =
                await Promise.all([
                    api.get("/admin/analytics/overview"),
                    api.get("/admin/analytics/predictions"),
                ]);

            setOverview(overviewResponse.data.data);
            setPrediction(predictionResponse.data.data);
        } catch (err: unknown) {
            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };

            setError(
                error.response?.data?.message ||
                "Gagal mengambil data Analytics."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const generateInsight = async () => {
        setInsightLoading(true);
        setInsight(null);

        try {
            const response = await api.post("/admin/analytics/insights");

            setInsight(response.data.data);
        } catch (err: unknown) {
            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };

            setInsight({
                status: "error",
                message:
                    error.response?.data?.message ||
                    "Gagal menghasilkan AI Insights. Silakan coba lagi.",
                insight: null,
            });
        } finally {
            setInsightLoading(false);
        }
    };

    const dailyData = overview?.daily_reservations || [];

    const maxReservations = Math.max(
        ...dailyData.map((item) => item.total_reservations),
        1
    );

    const predictions = prediction?.predictions || [];

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                    <RefreshCw className="animate-spin text-blue-600" size={30} />
                    <p className="text-sm">Memuat data Analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
                <AlertCircle className="mx-auto mb-3 text-red-500" size={35} />
                <h3 className="font-semibold text-gray-800">
                    Gagal Memuat Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-500">{error}</p>

                <button
                    onClick={loadAnalytics}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#172B4D]">
                        Analytics
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Statistik penggunaan dan prediksi reservasi ruangan.
                    </p>
                </div>

                <button
                    onClick={loadAnalytics}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
                >
                    <RefreshCw size={16} />
                    Perbarui Data
                </button>
            </div>

            {/* Data Information */}
            {overview && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-blue-800">
                        {sourceLabel(overview.data_source)}
                    </span>

                    <span className="text-blue-700">
                        Periode:{" "}
                        {formatDate(overview.historical_period.start_date)}
                        {" - "}
                        {formatDate(overview.historical_period.end_date)}
                    </span>

                    <span className="text-blue-600">
                        Data berdasarkan reservasi approved
                    </span>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Reservasi"
                    value={overview?.total_reservations ?? 0}
                    description="Seluruh reservasi terdaftar"
                    icon={CalendarDays}
                    color="bg-blue-50 text-blue-600"
                />

                <StatCard
                    title="Total Peserta"
                    value={overview?.total_participants ?? 0}
                    description="Akumulasi peserta reservasi approved"
                    icon={Users}
                    color="bg-cyan-50 text-cyan-600"
                />

                <StatCard
                    title="Hari Tersibuk"
                    value={overview?.busiest_day?.day_name || "-"}
                    description={
                        overview?.busiest_day
                            ? `${overview.busiest_day.total_reservations} reservasi`
                            : "Belum tersedia data"
                    }
                    icon={TrendingUp}
                    color="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                    title="Ruangan Terpopuler"
                    value={overview?.most_reserved_rooms?.[0]?.room_code || "-"}
                    description={
                        overview?.most_reserved_rooms?.[0]
                            ? `${overview.most_reserved_rooms[0].total_reservations} reservasi`
                            : "Belum tersedia data"
                    }
                    icon={Building2}
                    color="bg-violet-50 text-violet-600"
                />
            </div>

            {/* Daily Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-6">
                    <h2 className="font-bold text-[#172B4D]">
                        Tren Reservasi Harian
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Jumlah reservasi yang disetujui berdasarkan tanggal.
                    </p>
                </div>

                {dailyData.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                        Belum ada data reservasi pada periode ini.
                    </div>
                ) : (
                    <div className="flex h-64 items-end gap-2 overflow-x-auto pb-2">
                        {dailyData.map((item) => {
                            const height =
                                (item.total_reservations / maxReservations) * 100;

                            return (
                                <div
                                    key={item.date}
                                    title={`${formatDate(item.date)}: ${item.total_reservations} reservasi`}
                                    className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2"
                                >
                                    <span className="text-xs font-semibold text-gray-600">
                                        {item.total_reservations}
                                    </span>

                                    <div className="flex h-full w-full items-end justify-center">
                                        <div
                                            className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(height, 4)}%`,
                                            }}
                                        />
                                    </div>

                                    <span className="text-[10px] text-gray-400">
                                        {new Date(
                                            `${item.date}T00:00:00`
                                        ).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Popular Rooms */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <h2 className="font-bold text-[#172B4D]">
                        Ruangan Paling Sering Digunakan
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Lima ruangan dengan jumlah reservasi terbanyak.
                    </p>
                </div>

                {!overview?.most_reserved_rooms.length ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                        Belum ada data penggunaan ruangan.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {overview.most_reserved_rooms.map((room, index) => {
                            const highest = Math.max(
                                ...overview.most_reserved_rooms.map(
                                    (item) => item.total_reservations
                                ),
                                1
                            );

                            const percentage =
                                (room.total_reservations / highest) * 100;

                            return (
                                <div key={room.room_id}>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {index + 1}. {room.room_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {room.room_code}
                                            </p>
                                        </div>

                                        <span className="text-sm font-bold text-blue-600">
                                            {room.total_reservations} reservasi
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Predictions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Activity size={22} />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#172B4D]">
                            Prediksi Reservasi
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Perkiraan jumlah reservasi untuk tujuh hari berikutnya.
                        </p>
                    </div>
                </div>

                {!prediction?.history_available ? (
                    <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                        {prediction?.message ||
                            "Data historis belum cukup untuk menghasilkan prediksi."}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                        {predictions.map((item) => (
                            <div
                                key={item.date}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center"
                            >
                                <p className="text-xs font-medium text-gray-500">
                                    {item.day_name}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-[#172B4D]">
                                    {item.predicted_reservations ?? "-"}
                                </p>

                                <p className="mt-1 text-[11px] text-gray-400">
                                    {formatDate(item.date)}
                                </p>

                                <p className="mt-2 text-[10px] font-medium text-blue-600">
                                    {item.history_sample_count} sampel
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <Sparkles size={23} />
                        </div>

                        <div>
                            <h2 className="font-bold text-[#172B4D]">
                                AI Insights
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Dapatkan analisis penggunaan ruangan dari AI.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={generateInsight}
                        disabled={insightLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {insightLoading ? (
                            <RefreshCw className="animate-spin" size={16} />
                        ) : (
                            <Sparkles size={16} />
                        )}

                        {insightLoading
                            ? "Menganalisis..."
                            : "Generate AI Insights"}
                    </button>
                </div>

                {insight && (
                    <div className="mt-5 rounded-xl border border-blue-100 bg-white p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock3 size={16} className="text-blue-600" />
                            <span className="text-sm font-semibold text-gray-700">
                                Hasil Analisis
                            </span>
                        </div>

                        <p className="text-sm text-gray-600">
                            {insight.message}
                        </p>

                        {insight.insight && (
                            <>
                                <div className="my-3 border-t border-gray-100" />

                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => (
                                            <h1 className="mb-3 mt-5 text-xl font-bold text-[#172B4D]">
                                                {children}
                                            </h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="mb-3 mt-5 text-lg font-bold text-[#172B4D]">
                                                {children}
                                            </h2>
                                        ),
                                        h3: ({ children }) => (
                                            <h3 className="mb-2 mt-4 text-base font-semibold text-[#172B4D]">
                                                {children}
                                            </h3>
                                        ),
                                        p: ({ children }) => (
                                            <p className="mb-3 text-sm leading-7 text-gray-700">
                                                {children}
                                            </p>
                                        ),
                                        ul: ({ children }) => (
                                            <ul className="mb-4 ml-5 list-disc space-y-2 text-sm leading-7 text-gray-700">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm leading-7 text-gray-700">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }) => <li>{children}</li>,
                                        strong: ({ children }) => (
                                            <strong className="font-semibold text-gray-800">
                                                {children}
                                            </strong>
                                        ),
                                        blockquote: ({ children }) => (
                                            <blockquote className="my-4 border-l-4 border-blue-300 pl-4 text-gray-600">
                                                {children}
                                            </blockquote>
                                        ),
                                        hr: () => <hr className="my-5 border-gray-200" />,
                                        table: ({ children }) => (
                                            <div className="my-4 overflow-x-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ children }) => (
                                            <thead className="bg-gray-50">{children}</thead>
                                        ),
                                        th: ({ children }) => (
                                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children }) => (
                                            <td className="border border-gray-200 px-3 py-2 text-gray-600">
                                                {children}
                                            </td>
                                        ),
                                        code: ({ children }) => (
                                            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-blue-700">
                                                {children}
                                            </code>
                                        ),
                                    }}
                                >
                                    {insight.insight.content}
                                </ReactMarkdown>

                                <p className="mt-4 text-xs text-gray-400">
                                    Model: {insight.insight.model}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
