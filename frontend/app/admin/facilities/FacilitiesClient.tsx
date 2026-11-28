
"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Plus,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Trash2,
    X,
    Wrench,
    DoorOpen,
} from "lucide-react";

import api from "@/services/api";

interface Room {
    id: number;
    room_code: string;
    room_name: string;
    building: string;
    floor: number;
    capacity: number;
}

interface Facility {
    id: number;
    name: string;
    description: string | null;
    rooms_count?: number;
    rooms?: Room[];
    created_at: string | null;
}

interface FacilityResponse {
    data: Facility[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}

interface FacilityForm {
    name: string;
    description: string;
}

const initialForm: FacilityForm = {
    name: "",
    description: "",
};

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

export default function FacilitiesClient() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [goToPage, setGoToPage] = useState("");

    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: null as number | null,
        to: null as number | null,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalType, setModalType] = useState<
        "detail" | "create" | "edit" | "delete" | null
    >(null);

    const [selected, setSelected] = useState<Facility | null>(null);
    const [form, setForm] = useState<FacilityForm>(initialForm);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<FacilityResponse>("/facilities", {
                params: {
                    search: search || undefined,
                    page,
                    per_page: 10,
                },
            });

            setFacilities(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFacilities();
        }, 350);

        return () => clearTimeout(timer);
    }, [fetchFacilities]);

    const closeModal = () => {
        if (saving) return;

        setModalType(null);
        setSelected(null);
        setForm(initialForm);
        setError("");
    };

    const openCreate = () => {
        setForm(initialForm);
        setSelected(null);
        setError("");
        setModalType("create");
    };

    const openEdit = (facility: Facility) => {
        setSelected(facility);
        setForm({
            name: facility.name,
            description: facility.description || "",
        });
        setError("");
        setModalType("edit");
    };

    const openDetail = async (facility: Facility) => {
        setSelected(facility);
        setError("");
        setModalType("detail");
        setDetailLoading(true);

        try {
            const response = await api.get<{ data: Facility }>(
                `/facilities/${facility.id}`
            );

            setSelected(response.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDetailLoading(false);
        }
    };

    const openDelete = (facility: Facility) => {
        setSelected(facility);
        setError("");
        setModalType("delete");
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError("Nama fasilitas wajib diisi.");
            return;
        }

        setSaving(true);
        setError("");

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
        };

        try {
            if (modalType === "create") {
                await api.post("/facilities", payload);
                setNotice("Fasilitas berhasil ditambahkan.");
            } else if (modalType === "edit" && selected) {
                await api.put(`/facilities/${selected.id}`, payload);
                setNotice("Fasilitas berhasil diperbarui.");
            }

            setModalType(null);
            setSelected(null);
            setForm(initialForm);

            await fetchFacilities();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;

        setSaving(true);
        setError("");

        try {
            await api.delete(`/facilities/${selected.id}`);

            setNotice("Fasilitas berhasil dihapus.");
            setModalType(null);
            setSelected(null);

            if (facilities.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await fetchFacilities();
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const resetSearch = () => {
        setSearch("");
        setPage(1);
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

    const roomsOnPage = facilities.reduce(
        (total, facility) => total + (facility.rooms_count || 0),
        0
    );

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[#087DEB]">
                        Administrasi
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Manajemen Fasilitas
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola fasilitas yang tersedia di ruangan kampus.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchFacilities}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Perbarui
                    </button>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087DEB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus size={17} />
                        Tambah Fasilitas
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total Fasilitas
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-800">
                                {loading ? "..." : meta.total}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Wrench size={22} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Jumlah Penggunaan (halaman ini)
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-800">
                                {loading ? "..." : roomsOnPage}
                            </p>
                        </div>
                        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                            <DoorOpen size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {notice && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span>{notice}</span>
                    <button onClick={() => setNotice("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && !modalType && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={() => setError("")}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800">
                            Daftar Fasilitas
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi fasilitas yang terdaftar dalam sistem.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
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
                            placeholder="Cari nama fasilitas..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {search && (
                    <div className="px-5 pt-3">
                        <button
                            onClick={resetSearch}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                            Reset pencarian
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-4">Nama Fasilitas</th>
                                <th className="px-5 py-4">Deskripsi</th>
                                <th className="px-5 py-4">Jumlah Ruangan</th>
                                <th className="px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-16 text-center">
                                        <RefreshCw
                                            size={24}
                                            className="mx-auto animate-spin text-blue-500"
                                        />
                                        <p className="mt-3 text-sm text-slate-500">
                                            Memuat data fasilitas...
                                        </p>
                                    </td>
                                </tr>
                            ) : facilities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-16 text-center">
                                        <Wrench
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-3 font-semibold text-slate-600">
                                            Tidak ada fasilitas ditemukan
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Coba ubah pencarian atau tambahkan fasilitas baru.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                facilities.map((facility) => (
                                    <tr
                                        key={facility.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                                                    <Wrench size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {facility.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        ID #{facility.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="max-w-xs px-5 py-4">
                                            <p className="truncate text-sm text-slate-600">
                                                {facility.description || "Belum ada deskripsi"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                                                <DoorOpen size={15} />
                                                {facility.rooms_count ?? 0} ruangan
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openDetail(facility)}
                                                    title="Detail"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEdit(facility)}
                                                    title="Edit"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openDelete(facility)}
                                                    title="Hapus"
                                                    className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Menampilkan{" "}
                        <span className="font-semibold text-slate-700">
                            {meta.from ?? 0}-{meta.to ?? 0}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-700">
                            {meta.total}
                        </span>{" "}
                        fasilitas
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
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
                                setPage((current) =>
                                    Math.min(meta.last_page, current + 1)
                                )
                            }
                            disabled={page >= meta.last_page || loading}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={17} />
                        </button>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleGoToPage();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="number"
                                min={1}
                                max={meta.last_page}
                                value={goToPage}
                                onChange={(e) => setGoToPage(e.target.value)}
                                placeholder="Halaman"
                                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            <button
                                type="submit"
                                disabled={loading || !goToPage}
                                className="rounded-lg bg-[#087DEB] px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cari
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {modalType === "create"
                                        ? "Tambah Fasilitas"
                                        : modalType === "edit"
                                          ? "Edit Fasilitas"
                                          : modalType === "delete"
                                            ? "Hapus Fasilitas"
                                            : "Detail Fasilitas"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selected?.name || "Lengkapi informasi fasilitas"}
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {modalType === "detail" && selected ? (
                            <div className="space-y-5 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                        <Wrench size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">
                                            {selected.name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            ID #{selected.id}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Deskripsi
                                    </p>
                                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                                        {selected.description || "Belum ada deskripsi."}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="rounded-xl bg-blue-50 p-4">
                                        <p className="text-xs font-medium text-blue-600">
                                            Digunakan pada
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-blue-800">
                                            {selected.rooms_count ?? 0} ruangan
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="mb-3 text-sm font-bold text-slate-700">
                                            Daftar Ruangan
                                        </h4>

                                        {detailLoading ? (
                                            <div className="rounded-xl border border-slate-100 p-5 text-center">
                                                <RefreshCw
                                                    size={20}
                                                    className="mx-auto animate-spin text-blue-500"
                                                />
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Memuat daftar ruangan...
                                                </p>
                                            </div>
                                        ) : error ? (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                                                {error}
                                            </div>
                                        ) : selected.rooms && selected.rooms.length > 0 ? (
                                            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                                                {selected.rooms.map((room) => (
                                                    <div
                                                        key={room.id}
                                                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50"
                                                    >
                                                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                                            <DoorOpen size={18} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-slate-700">
                                                                {room.room_name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {room.room_code} · {room.building}
                                                            </p>
                                                        </div>

                                                        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                            {room.capacity} orang
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                                                <DoorOpen
                                                    size={24}
                                                    className="mx-auto text-slate-300"
                                                />
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Belum digunakan pada ruangan mana pun.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : modalType === "delete" && selected ? (
                            <div className="space-y-4 p-6">
                                <div className="rounded-xl bg-red-50 p-4 text-red-800">
                                    <p className="text-sm font-semibold">
                                        Apakah kamu yakin ingin menghapus fasilitas ini?
                                    </p>
                                    <p className="mt-1 text-xs">
                                        {selected.name}
                                    </p>
                                </div>

                                <p className="text-sm leading-relaxed text-slate-500">
                                    Fasilitas ini akan dilepaskan dari ruangan yang
                                    menggunakannya sebelum dihapus.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 p-6">
                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Nama Fasilitas *
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                        maxLength={100}
                                        placeholder="Contoh: Proyektor"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        rows={4}
                                        maxLength={1000}
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Deskripsi fasilitas..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {modalType === "detail" ? "Tutup" : "Batal"}
                            </button>

                            {modalType === "create" || modalType === "edit" ? (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-xl bg-[#087DEB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Menyimpan..."
                                        : modalType === "create"
                                          ? "Simpan Fasilitas"
                                          : "Simpan Perubahan"}
                                </button>
                            ) : modalType === "delete" ? (
                                <button
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {saving ? "Menghapus..." : "Ya, Hapus"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
