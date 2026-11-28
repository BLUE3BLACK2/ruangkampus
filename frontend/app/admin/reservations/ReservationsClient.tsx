"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Search,
    CalendarDays,
    Clock,
    Users,
    Eye,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    DoorOpen,
    X,
    ClipboardList,
    Filter,
} from "lucide-react";

import api from "@/services/api";

type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled";

interface Reservation {
    id: number;
    reservation_code: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    purpose: string;
    participant_count: number;
    status: ReservationStatus;
    admin_notes: string | null;
    reviewed_at: string | null;
    created_at: string | null;
    room: {
        id: number;
        room_code: string;
        room_name: string;
        building: string;
        floor: number | null;
        capacity: number;
    } | null;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        nim: string | null;
        nip: string | null;
    } | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface ReservationSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
}

interface ReservationResponse {
    data: Reservation[];
    meta: PaginationMeta;
    summary: ReservationSummary;
}

const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "pending", label: "Menunggu" },
    { value: "approved", label: "Disetujui" },
    { value: "rejected", label: "Ditolak" },
    { value: "cancelled", label: "Dibatalkan" },
];

const statusStyles: Record<ReservationStatus, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusLabels: Record<ReservationStatus, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
};

function formatDate(date: string) {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatDateTime(date: string | null) {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function getErrorMessage(error: unknown) {
    const err = error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    };

    const errors = err.response?.data?.errors;

    if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        if (firstError) return firstError;
    }

    return err.response?.data?.message || "Terjadi kesalahan. Silakan coba kembali.";
}

function StatusBadge({ status }: { status: ReservationStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    });
    const [summary, setSummary] = useState<ReservationSummary>({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("pending");
    const [date, setDate] = useState("");
    const [page, setPage] = useState(1);
    const [goToPage, setGoToPage] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [selected, setSelected] = useState<Reservation | null>(null);
    const [modalType, setModalType] = useState<"detail" | "approve" | "reject" | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<ReservationResponse>("/admin/reservations", {
                params: {
                    search: search || undefined,
                    status: status || undefined,
                    date: date || undefined,
                    page,
                    per_page: 10,
                },
            });

            setReservations(response.data.data);
            setMeta(response.data.meta);
            setSummary(response.data.summary);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, status, date, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReservations();
        }, 350);

        return () => clearTimeout(timer);
    }, [fetchReservations]);

    const closeModal = () => {
        if (processing) return;

        setSelected(null);
        setModalType(null);
        setAdminNotes("");
    };

    const openModal = (
        reservation: Reservation,
        type: "detail" | "approve" | "reject"
    ) => {
        setSelected(reservation);
        setModalType(type);
        setAdminNotes("");
    };

    const handleDecision = async () => {
        if (!selected || !modalType || modalType === "detail") return;

        if (modalType === "reject" && !adminNotes.trim()) {
            setError("Alasan penolakan wajib diisi.");
            return;
        }

        setProcessing(true);
        setError("");
        setNotice("");

        try {
            const endpoint =
                modalType === "approve"
                    ? `/admin/reservations/${selected.id}/approve`
                    : `/admin/reservations/${selected.id}/reject`;

            await api.patch(endpoint, {
                admin_notes: adminNotes.trim() || null,
            });

            setNotice(
                modalType === "approve"
                    ? "Reservasi berhasil disetujui."
                    : "Reservasi berhasil ditolak."
            );

            closeModal();
            await fetchReservations();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setProcessing(false);
        }
    };

    const handleGoToPage = () => {
        const target = Number(goToPage);

        if (
            !Number.isInteger(target) ||
            target < 1 ||
            target > meta.last_page
        ) {
            return;
        }

        setPage(target);
        setGoToPage("");
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("pending");
        setDate("");
        setPage(1);
    };

    const isFiltered = Boolean(search || date || status !== "pending");

    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[#087DEB]">
                        Administrasi
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Manajemen Reservasi
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola permohonan peminjaman ruangan kampus.
                    </p>
                </div>

                <button
                    onClick={fetchReservations}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Perbarui Data
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[
                    {
                        label: "Total Reservasi",
                        value: summary.total,
                        icon: ClipboardList,
                        color: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "Menunggu",
                        value: summary.pending,
                        icon: Clock,
                        color: "bg-amber-50 text-amber-600",
                    },
                    {
                        label: "Disetujui",
                        value: summary.approved,
                        icon: CheckCircle2,
                        color: "bg-emerald-50 text-emerald-600",
                    },
                    {
                        label: "Ditolak",
                        value: summary.rejected,
                        icon: XCircle,
                        color: "bg-red-50 text-red-600",
                    },
                    {
                        label: "Dibatalkan",
                        value: summary.cancelled,
                        icon: XCircle,
                        color: "bg-slate-100 text-slate-600",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{item.label}</p>
                                <p className="mt-2 text-2xl font-bold text-slate-800">
                                    {loading ? "..." : item.value}
                                </p>
                            </div>
                            <div className={`rounded-xl p-3 ${item.color}`}>
                                <item.icon size={22} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notice */}
            {notice && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span>{notice}</span>
                    <button onClick={() => setNotice("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={() => setError("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Table Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Daftar Reservasi
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cari dan kelola seluruh permohonan reservasi.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative min-w-0 sm:w-64">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Cari kode atau pemohon..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    
                                />
                            </div>

                            <div className="relative">
                                <Filter
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-blue-400 sm:w-44"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <CalendarDays
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-blue-400 sm:w-44"
                                />
                            </div>
                        </div>
                    </div>

                    {isFiltered && (
                        <button
                            onClick={resetFilters}
                            className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                            Reset filter
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-4">Kode Reservasi</th>
                                <th className="px-5 py-4">Pemohon</th>
                                <th className="px-5 py-4">Ruangan</th>
                                <th className="px-5 py-4">Jadwal</th>
                                <th className="px-5 py-4">Peserta</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center">
                                        <RefreshCw
                                            size={24}
                                            className="mx-auto animate-spin text-blue-500"
                                        />
                                        <p className="mt-3 text-sm text-slate-500">
                                            Memuat data reservasi...
                                        </p>
                                    </td>
                                </tr>
                            ) : reservations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center">
                                        <ClipboardList
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-3 font-semibold text-slate-600">
                                            Tidak ada reservasi ditemukan
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Coba ubah kata kunci atau filter pencarian.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                reservations.map((reservation) => (
                                    <tr
                                        key={reservation.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-slate-700">
                                                {reservation.reservation_code}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                ID #{reservation.id}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-700">
                                                {reservation.user?.name || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {reservation.user?.nim ||
                                                    reservation.user?.nip ||
                                                    reservation.user?.email ||
                                                    "-"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-700">
                                                {reservation.room?.room_name || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {reservation.room?.room_code || "-"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-700">
                                                {formatDate(reservation.reservation_date)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {reservation.start_time} - {reservation.end_time}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-slate-700">
                                                {reservation.participant_count} orang
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={reservation.status} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openModal(reservation, "detail")}
                                                    title="Lihat detail"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {reservation.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                openModal(reservation, "approve")
                                                            }
                                                            title="Setujui"
                                                            className="rounded-lg border border-emerald-200 p-2 text-emerald-600 transition hover:bg-emerald-50"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                openModal(reservation, "reject")
                                                            }
                                                            title="Tolak"
                                                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">
                                {meta.from ?? 0}-{meta.to ?? 0}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-700">
                                {meta.total}
                            </span>{" "}
                            reservasi
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page <= 1 || loading}
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <span className="px-3 text-sm font-medium text-slate-600">
                                Halaman {meta.current_page} dari {meta.last_page}
                            </span>

                            <button
                                onClick={() =>
                                    setPage((current) => Math.min(meta.last_page, current + 1))
                                }
                                disabled={page >= meta.last_page || loading}
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-sm text-slate-500">
                            Pergi ke halaman:
                        </span>

                        <input
                            type="number"
                            min={1}
                            max={meta.last_page}
                            value={goToPage}
                            onChange={(e) => setGoToPage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleGoToPage();
                            }}
                            placeholder="No. halaman"
                            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />

                        <button
                            onClick={handleGoToPage}
                            disabled={
                                loading ||
                                !goToPage ||
                                Number(goToPage) < 1 ||
                                Number(goToPage) > meta.last_page ||
                                !Number.isInteger(Number(goToPage))
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Cari
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selected && modalType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {modalType === "detail"
                                        ? "Detail Reservasi"
                                        : modalType === "approve"
                                          ? "Setujui Reservasi"
                                          : "Tolak Reservasi"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selected.reservation_code}
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={processing}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            {modalType === "detail" ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">
                                            Status reservasi
                                        </span>
                                        <StatusBadge status={selected.status} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Users size={15} />
                                                Pemohon
                                            </div>
                                            <p className="mt-2 font-semibold text-slate-800">
                                                {selected.user?.name || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {selected.user?.email || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {selected.user?.nim || selected.user?.nip || "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <DoorOpen size={15} />
                                                Ruangan
                                            </div>
                                            <p className="mt-2 font-semibold text-slate-800">
                                                {selected.room?.room_name || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {selected.room?.room_code || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Kapasitas: {selected.room?.capacity ?? "-"} orang
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-slate-400">Tanggal</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {formatDate(selected.reservation_date)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Waktu</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {selected.start_time} - {selected.end_time}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Jumlah Peserta</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {selected.participant_count} orang
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Diajukan</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {formatDateTime(selected.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">Keperluan</p>
                                        <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                                            {selected.purpose}
                                        </p>
                                    </div>

                                    {selected.admin_notes && (
                                        <div>
                                            <p className="text-xs text-slate-400">Catatan Admin</p>
                                            <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                                                {selected.admin_notes}
                                            </p>
                                        </div>
                                    )}

                                    {selected.reviewed_at && (
                                        <div>
                                            <p className="text-xs text-slate-400">Waktu Ditinjau</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {formatDateTime(selected.reviewed_at)}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div
                                        className={`rounded-xl p-4 ${
                                            modalType === "approve"
                                                ? "bg-emerald-50 text-emerald-800"
                                                : "bg-red-50 text-red-800"
                                        }`}
                                    >
                                        <p className="text-sm font-semibold">
                                            {modalType === "approve"
                                                ? "Apakah kamu yakin ingin menyetujui reservasi ini?"
                                                : "Apakah kamu yakin ingin menolak reservasi ini?"}
                                        </p>
                                        <p className="mt-1 text-xs opacity-80">
                                            {selected.reservation_code} ·{" "}
                                            {selected.user?.name || "Pemohon"}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Catatan Admin{" "}
                                            {modalType === "reject" && (
                                                <span className="text-red-500">*</span>
                                            )}
                                            {modalType === "approve" && (
                                                <span className="font-normal text-slate-400">
                                                    (Opsional)
                                                </span>
                                            )}
                                        </label>

                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={4}
                                            maxLength={1000}
                                            placeholder={
                                                modalType === "reject"
                                                    ? "Tuliskan alasan penolakan..."
                                                    : "Tambahkan catatan jika diperlukan..."
                                            }
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <p className="mt-1 text-right text-xs text-slate-400">
                                            {adminNotes.length}/1000 karakter
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                onClick={closeModal}
                                disabled={processing}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {modalType === "detail" ? "Tutup" : "Batal"}
                            </button>

                            {modalType !== "detail" && (
                                <button
                                    onClick={handleDecision}
                                    disabled={
                                        processing ||
                                        (modalType === "reject" && !adminNotes.trim())
                                    }
                                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        modalType === "approve"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {processing
                                        ? "Memproses..."
                                        : modalType === "approve"
                                          ? "Ya, Setujui"
                                          : "Ya, Tolak"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
