
"use client";

import { useEffect, useState } from "react";
import {
    CalendarDays,
    Users,
    DoorOpen,
    ChartNoAxesCombined,
    ArrowUpRight,
    Clock3,
    Sparkles,
    Building2,
    TrendingUp,
    Activity,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";

import StatCard from "@/components/admin/StatCard";
import api from "@/services/api";

interface OverviewData {
    historical_period: {
        start_date: string;
        end_date: string;
    };
    data_source: string;
    total_approved_reservations: number;
    total_participants: number;
    daily_reservations: {
        date: string;
        total_reservations: number;
    }[];
    busiest_day: {
        date: string;
        day_name: string;
        total_reservations: number;
    } | null;
    most_reserved_rooms: {
        room_id: number;
        room_code: string | null;
        room_name: string | null;
        total_reservations: number;
    }[];
}

interface PredictionData {
    history_available: boolean;
    predictions: {
        date: string;
        day_name: string;
        predicted_reservations: number | null;
        status: string;
    }[];
}

interface DashboardData {
    overview: OverviewData | null;
    predictions: PredictionData | null;
    totalRooms: number;
    totalReservations: number;
}

export default function DashboardClient() {
    const [data, setData] = useState<DashboardData>({
        overview: null,
        predictions: null,
        totalRooms: 0,
        totalReservations: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [period, setPeriod] = useState("month");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                overviewResponse,
                predictionResponse,
                roomResponse,
                reservationResponse,
            ] = await Promise.all([
                api.get("/admin/analytics/overview", {
                    params: { period },
                }),
                api.get("/admin/analytics/predictions"),
                api.get("/admin/rooms?per_page=1"),
                api.get("/admin/reservations?per_page=1"),
            ]);

            setData({
                overview: overviewResponse.data.data,
                predictions: predictionResponse.data.data,
                totalRooms: roomResponse.data.meta.total,
                totalReservations: reservationResponse.data.meta.total,
            });
        } catch (err) {
            console.error("Gagal mengambil data dashboard:", err);
            setError("Gagal mengambil data dashboard. Silakan coba kembali.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [period]);

    const overview = data.overview;
    const predictions = data.predictions;

    const averagePrediction =
        predictions?.history_available
            ? predictions.predictions
                .filter((item) => item.predicted_reservations !== null)
                .reduce(
                    (total, item) => total + (item.predicted_reservations ?? 0),
                    0
                ) /
                (predictions.predictions.filter(
                    (item) => item.predicted_reservations !== null
                ).length || 1)
            : null;

    const formatDate = (date: string) =>
        new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    const sourceLabel = (source: string) => {
        if (source === "operational") return "Data Operasional";
        if (source === "demo") return "Data Demo";
        if (source === "mixed") return "Data Campuran";
        return "Belum Ada Data";
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto animate-spin text-blue-600" size={32} />
                    <p className="mt-3 text-sm text-slate-500">
                        Memuat data dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
                <p className="font-semibold text-red-600">{error}</p>
                <button
                    onClick={loadDashboard}
                    className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-md md:p-8">
                <div className="relative z-10 max-w-xl">
                    <p className="mb-2 text-sm font-medium text-blue-100">
                        Dashboard Administrasi
                    </p>

                    <h1 className="text-2xl font-bold md:text-3xl">
                        Selamat Datang, Administrator!
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-blue-50 md:text-base">
                        Kelola reservasi, pantau penggunaan ruangan, dan lihat aktivitas kampus melalui RuangKuliah.
                    </p>

                    <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm backdrop-blur-sm">
                        <Activity size={17} />
                        Sistem Reservasi Ruangan Kampus
                    </div>
                </div>

                <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
                <div className="absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

                <Building2
                    size={150}
                    className="absolute bottom-3 right-8 hidden text-white/15 md:block"
                />
            </section>

            {/* Dashboard Summary */}
            <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Ringkasan Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Gambaran umum aktivitas reservasi ruangan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="today">Hari ini</option>
                            <option value="week">Minggu ini</option>
                            <option value="month">Bulan ini</option>
                        </select>

                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Data Aktual
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Reservasi"
                    value={data.totalReservations.toLocaleString("id-ID")}
                    description="Seluruh reservasi terdaftar"
                    icon={CalendarDays}
                />

                <StatCard
                    title="Total Peserta"
                    value={overview?.total_participants.toLocaleString("id-ID") ?? "0"}
                    description="Peserta dari reservasi disetujui"
                    icon={Users}
                />

                <StatCard
                    title="Total Ruangan"
                    value={data.totalRooms.toLocaleString("id-ID")}
                    description="Seluruh ruangan terdaftar"
                    icon={DoorOpen}
                />

                <StatCard
                    title="Prediksi Reservasi"
                    value={
                        averagePrediction !== null
                            ? `${averagePrediction.toFixed(1)} / hari`
                            : "-"
                    }
                    description="Rata-rata prediksi 7 hari"
                    icon={ChartNoAxesCombined}
                />
            </section>

            {/* Reservation Summary and Room Information */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2 md:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Ringkasan Reservasi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Statistik reservasi yang telah disetujui.
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <CalendarDays size={22} />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CalendarDays size={17} />
                                Periode Data
                            </div>

                            <p className="mt-3 text-lg font-bold text-slate-800">
                                {overview
                                    ? `${formatDate(overview.historical_period.start_date)} – ${formatDate(overview.historical_period.end_date)}`
                                    : "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Periode riwayat reservasi
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CheckCircle2 size={17} />
                                Status Data
                            </div>

                            <p className="mt-3 text-lg font-bold text-blue-600">
                                {overview ? sourceLabel(overview.data_source) : "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Sumber data reservasi
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total peserta dari reservasi
                            </p>
                            <p className="mt-1 text-2xl font-bold text-blue-700">
                                {overview?.total_participants.toLocaleString("id-ID") ?? "0"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Users size={25} />
                        </div>
                    </div>

                    {overview?.busiest_day && (
                        <div className="mt-4 rounded-xl bg-blue-50 p-4">
                            <p className="text-sm font-semibold text-blue-700">
                                Hari Tersibuk
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                {overview.busiest_day.day_name},{" "}
                                {formatDate(overview.busiest_day.date)} —{" "}
                                {overview.busiest_day.total_reservations} reservasi
                            </p>
                        </div>
                    )}
                </div>

                {/* Room Capacity */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Data Ruangan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Ruangan terdaftar
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <DoorOpen size={22} />
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="text-5xl font-bold text-blue-700">
                            {data.totalRooms.toLocaleString("id-ID")}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Total ruangan dalam sistem
                        </p>
                    </div>

                    <div className="mt-7 rounded-xl bg-blue-50 p-4">
                        <div className="flex items-center gap-2 text-blue-700">
                            <Building2 size={19} />
                            <span className="text-sm font-semibold">
                                Sistem RuangKuliah
                            </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Informasi ruangan dan fasilitas dikelola melalui sistem administrasi.
                        </p>
                    </div>
                </div>
            </section>

            {/* Analytics */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Room Reservation Distribution */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Distribusi Reservasi Ruangan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Jumlah reservasi disetujui per ruangan.
                            </p>
                        </div>

                        <ChartNoAxesCombined size={23} className="text-blue-600" />
                    </div>

                    <div className="mt-6 space-y-5">
                        {overview?.most_reserved_rooms.length ? (
                            overview.most_reserved_rooms.map((room) => {
                                const maxTotal = Math.max(
                                    ...overview.most_reserved_rooms.map(
                                        (item) => item.total_reservations
                                    ),
                                    1
                                );

                                return (
                                    <div key={room.room_id}>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {room.room_name ?? "Ruangan"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {room.room_code ?? "-"}
                                                </p>
                                            </div>

                                            <span className="text-sm font-bold text-slate-700">
                                                {room.total_reservations} reservasi
                                            </span>
                                        </div>

                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                                style={{
                                                    width: `${(room.total_reservations / maxTotal) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="py-8 text-center text-sm text-slate-400">
                                Belum ada data reservasi ruangan.
                            </p>
                        )}
                    </div>

                    <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
                        Berdasarkan reservasi disetujui dalam periode historis.
                    </p>
                </div>

                {/* AI Prediction */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 p-6 text-white shadow-sm">
                    <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-100">
                                    Analisis Cerdas
                                </p>
                                <h2 className="mt-1 text-xl font-bold">
                                    Prediksi Reservasi
                                </h2>
                            </div>

                            <div className="rounded-xl bg-white/15 p-3">
                                <Sparkles size={25} />
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-5xl font-bold">
                                {averagePrediction !== null
                                    ? averagePrediction.toFixed(1)
                                    : "-"}
                                <span className="ml-2 text-2xl font-medium">
                                    reservasi / hari
                                </span>
                            </p>

                            <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100">
                                Rata-rata prediksi jumlah reservasi berdasarkan pola hari yang sama pada periode sebelumnya.
                            </p>
                        </div>

                        <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
                            <TrendingUp size={22} />

                            <div>
                                <p className="text-sm font-semibold">
                                    Metode Prediksi
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    Same Weekday Moving Average
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-blue-100">
                            {predictions?.history_available
                                ? "Prediksi berdasarkan data historis."
                                : "Data historis belum mencukupi untuk prediksi."}
                        </p>
                    </div>
                </div>
            </section>

            {/* System Activity */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Informasi Sistem
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Informasi platform administrasi.
                            </p>
                        </div>

                        <Activity size={22} className="text-blue-600" />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">Nama Sistem</p>
                            <p className="mt-2 font-semibold text-slate-800">
                                RuangKuliah
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">Platform</p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Next.js & Laravel
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">Hak Akses</p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Administrator
                            </p>
                        </div>
                    </div>
                </div>

                {/* Prediction Information */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Clock3 size={22} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-800">
                                Periode Prediksi
                            </h2>
                            <p className="text-xs text-slate-500">
                                Jadwal analisis
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 text-lg font-bold text-blue-700">
                        {predictions?.predictions?.length
                            ? `${formatDate(predictions.predictions[0].date)} – ${formatDate(predictions.predictions[predictions.predictions.length - 1].date)}`
                            : "-"}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Periode perkiraan berdasarkan riwayat reservasi sebelumnya.
                    </p>

                    <div className={`mt-5 flex items-center gap-2 text-xs ${
                        predictions?.history_available
                            ? "text-emerald-600"
                            : "text-amber-600"
                    }`}>
                        <CheckCircle2 size={16} />
                        {predictions?.history_available
                            ? "Data historis mencukupi"
                            : "Data historis belum mencukupi"}
                    </div>
                </div>
            </section>

            {/* Footer Banner */}
            <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-500 p-6 text-white shadow-sm md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                        <Building2 size={30} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold">
                            Kelola Ruangan Lebih Mudah
                        </h2>
                        <p className="mt-1 text-sm text-blue-100">
                            Pantau dan kelola reservasi ruangan kampus melalui satu sistem.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
