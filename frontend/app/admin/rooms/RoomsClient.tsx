
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
    DoorOpen,
    Users,
    Building2,
    Filter,
    CheckCircle2,
    Wrench,
    Ban,
} from "lucide-react";

import api from "@/services/api";

type RoomStatus = "available" | "maintenance" | "inactive";

interface Facility {
    id: number;
    name: string;
    description: string | null;
    rooms_count?: number;
}

interface Room {
    id: number;
    room_code: string;
    room_name: string;
    building: string;
    floor: number | null;
    capacity: number;
    description: string | null;
    image: string | null;
    status: RoomStatus;
    facilities: Facility[];
    created_at: string | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface RoomResponse {
    data: Room[];
    meta: PaginationMeta;
}

interface FacilityResponse {
    data: Facility[];
}

interface RoomForm {
    room_code: string;
    room_name: string;
    building: string;
    floor: string;
    capacity: string;
    description: string;
    image: string;
    status: RoomStatus;
    facilities: number[];
}

const initialForm: RoomForm = {
    room_code: "",
    room_name: "",
    building: "",
    floor: "",
    capacity: "",
    description: "",
    image: "",
    status: "available",
    facilities: [],
};

const statusLabels: Record<RoomStatus, string> = {
    available: "Tersedia",
    maintenance: "Pemeliharaan",
    inactive: "Tidak Aktif",
};

const statusStyles: Record<RoomStatus, string> = {
    available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 ring-amber-200",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};

function StatusBadge({ status }: { status: RoomStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
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

export default function RoomsClient() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);

    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [minCapacity, setMinCapacity] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalType, setModalType] = useState<
        "detail" | "create" | "edit" | "delete" | null
    >(null);

    const [selected, setSelected] = useState<Room | null>(null);
    const [form, setForm] = useState<RoomForm>(initialForm);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<RoomResponse>("/admin/rooms", {
                params: {
                    search: search || undefined,
                    status: status || undefined,
                    min_capacity: minCapacity || undefined,
                    page,
                    per_page: 10,
                },
            });

            setRooms(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, status, minCapacity, page]);

    const fetchFacilities = useCallback(async () => {
        try {
            const response = await api.get<FacilityResponse>("/facilities", {
                params: { per_page: 100 },
            });

            setFacilities(response.data.data);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRooms();
        }, 350);

        return () => clearTimeout(timer);
    }, [fetchRooms]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setMinCapacity("");
        setPage(1);
    };

    const closeModal = () => {
        if (saving) return;

        setModalType(null);
        setSelected(null);
        setForm(initialForm);
    };

    const openCreate = () => {
        setSelected(null);
        setForm(initialForm);
        setModalType("create");
        setError("");
    };

    const openEdit = (room: Room) => {
        setSelected(room);
        setForm({
            room_code: room.room_code,
            room_name: room.room_name,
            building: room.building,
            floor: room.floor === null ? "" : String(room.floor),
            capacity: String(room.capacity),
            description: room.description || "",
            image: room.image || "",
            status: room.status,
            facilities: room.facilities.map((facility) => facility.id),
        });
        setModalType("edit");
        setError("");
    };

    const openDetail = (room: Room) => {
        setSelected(room);
        setModalType("detail");
        setError("");
    };

    const openDelete = (room: Room) => {
        setSelected(room);
        setModalType("delete");
        setError("");
    };

    const handleSave = async () => {
        if (
            !form.room_code.trim() ||
            !form.room_name.trim() ||
            !form.building.trim() ||
            !form.capacity
        ) {
            setError("Lengkapi kode, nama, gedung, dan kapasitas ruangan.");
            return;
        }

        const payload = {
            room_code: form.room_code.trim(),
            room_name: form.room_name.trim(),
            building: form.building.trim(),
            floor: form.floor === "" ? null : Number(form.floor),
            capacity: Number(form.capacity),
            description: form.description.trim() || null,
            image: form.image.trim() || null,
            status: form.status,
            facilities: form.facilities,
        };

        setSaving(true);
        setError("");

        try {
            if (modalType === "create") {
                await api.post("/rooms", payload);
                setNotice("Ruangan berhasil ditambahkan.");
            } else if (modalType === "edit" && selected) {
                await api.put(`/rooms/${selected.id}`, payload);
                setNotice("Data ruangan berhasil diperbarui.");
            }

            setModalType(null);
            setSelected(null);
            setForm(initialForm);
            await fetchRooms();
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
            await api.delete(`/rooms/${selected.id}`);
            setNotice("Ruangan berhasil dihapus.");
            setModalType(null);
            setSelected(null);

            if (rooms.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await fetchRooms();
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const toggleFacility = (facilityId: number) => {
        setForm((current) => ({
            ...current,
            facilities: current.facilities.includes(facilityId)
                ? current.facilities.filter((id) => id !== facilityId)
                : [...current.facilities, facilityId],
        }));
    };

    const availableOnPage = rooms.filter(
        (room) => room.status === "available"
    ).length;

    const maintenanceOnPage = rooms.filter(
        (room) => room.status === "maintenance"
    ).length;

    const inactiveOnPage = rooms.filter(
        (room) => room.status === "inactive"
    ).length;

    const isFiltered = Boolean(search || status || minCapacity);

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[#087DEB]">
                        Administrasi
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Manajemen Ruangan
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola informasi, kapasitas, dan fasilitas ruangan kampus.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchRooms}
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
                        Tambah Ruangan
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Ruangan",
                        value: meta.total,
                        icon: DoorOpen,
                        color: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "Tersedia (halaman ini)",
                        value: availableOnPage,
                        icon: CheckCircle2,
                        color: "bg-emerald-50 text-emerald-600",
                    },
                    {
                        label: "Pemeliharaan (halaman ini)",
                        value: maintenanceOnPage,
                        icon: Wrench,
                        color: "bg-amber-50 text-amber-600",
                    },
                    {
                        label: "Tidak Aktif (halaman ini)",
                        value: inactiveOnPage,
                        icon: Ban,
                        color: "bg-slate-100 text-slate-600",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm text-slate-500">
                                    {item.label}
                                </p>
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

            {/* Feedback */}
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

            {/* Main Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800">
                                Daftar Ruangan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Kelola seluruh ruangan yang terdaftar.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                                    placeholder="Cari kode, nama, gedung..."
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                                    <option value="">Semua Status</option>
                                    <option value="available">Tersedia</option>
                                    <option value="maintenance">Pemeliharaan</option>
                                    <option value="inactive">Tidak Aktif</option>
                                </select>
                            </div>

                            <input
                                type="number"
                                min="1"
                                value={minCapacity}
                                onChange={(e) => {
                                    setMinCapacity(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Min. kapasitas"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 sm:w-36"
                            />
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-4">Ruangan</th>
                                <th className="px-5 py-4">Lokasi</th>
                                <th className="px-5 py-4">Kapasitas</th>
                                <th className="px-5 py-4">Fasilitas</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <RefreshCw
                                            size={24}
                                            className="mx-auto animate-spin text-blue-500"
                                        />
                                        <p className="mt-3 text-sm text-slate-500">
                                            Memuat data ruangan...
                                        </p>
                                    </td>
                                </tr>
                            ) : rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <DoorOpen
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-3 font-semibold text-slate-600">
                                            Tidak ada ruangan ditemukan
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Coba ubah pencarian atau tambahkan ruangan baru.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rooms.map((room) => (
                                    <tr
                                        key={room.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-slate-700">
                                                {room.room_name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {room.room_code}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-700">
                                                {room.building}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Lantai {room.floor ?? "-"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <Users size={15} className="text-slate-400" />
                                                {room.capacity} orang
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex max-w-52 flex-wrap gap-1">
                                                {room.facilities.length > 0 ? (
                                                    room.facilities.slice(0, 2).map((facility) => (
                                                        <span
                                                            key={facility.id}
                                                            className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                        >
                                                            {facility.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Belum ada
                                                    </span>
                                                )}

                                                {room.facilities.length > 2 && (
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                                                        +{room.facilities.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={room.status} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openDetail(room)}
                                                    title="Detail"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEdit(room)}
                                                    title="Edit"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openDelete(room)}
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
                        ruangan
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
                                setPage((current) =>
                                    Math.min(meta.last_page, current + 1)
                                )
                            }
                            disabled={page >= meta.last_page || loading}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={17} />
                        </button>
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
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {modalType === "create"
                                        ? "Tambah Ruangan"
                                        : modalType === "edit"
                                          ? "Edit Ruangan"
                                          : modalType === "delete"
                                            ? "Hapus Ruangan"
                                            : "Detail Ruangan"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selected?.room_code || "Lengkapi informasi ruangan"}
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
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">
                                            {selected.room_name}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {selected.room_code}
                                        </p>
                                    </div>
                                    <StatusBadge status={selected.status} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Building2 size={15} />
                                            Lokasi
                                        </div>
                                        <p className="mt-2 font-semibold text-slate-800">
                                            {selected.building}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Lantai {selected.floor ?? "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Users size={15} />
                                            Kapasitas
                                        </div>
                                        <p className="mt-2 font-semibold text-slate-800">
                                            {selected.capacity} orang
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

                                <div>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Fasilitas
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selected.facilities.length > 0 ? (
                                            selected.facilities.map((facility) => (
                                                <span
                                                    key={facility.id}
                                                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                                                >
                                                    {facility.name}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-400">
                                                Belum ada fasilitas.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selected.image && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400">
                                            Path Gambar
                                        </p>
                                        <p className="mt-2 break-all text-sm text-slate-600">
                                            {selected.image}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : modalType === "delete" && selected ? (
                            <div className="space-y-4 p-6">
                                <div className="rounded-xl bg-red-50 p-4 text-red-800">
                                    <p className="text-sm font-semibold">
                                        Apakah kamu yakin ingin menghapus ruangan ini?
                                    </p>
                                    <p className="mt-1 text-xs">
                                        {selected.room_code} · {selected.room_name}
                                    </p>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-500">
                                    Penghapusan tidak dapat dilakukan jika ruangan
                                    masih memiliki riwayat pengajuan reservasi.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 p-6">
                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Kode Ruangan *
                                        </label>
                                        <input
                                            value={form.room_code}
                                            onChange={(e) =>
                                                setForm({ ...form, room_code: e.target.value })
                                            }
                                            placeholder="Contoh: R-101"
                                            maxLength={20}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Nama Ruangan *
                                        </label>
                                        <input
                                            value={form.room_name}
                                            onChange={(e) =>
                                                setForm({ ...form, room_name: e.target.value })
                                            }
                                            placeholder="Nama ruangan"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Gedung *
                                        </label>
                                        <input
                                            value={form.building}
                                            onChange={(e) =>
                                                setForm({ ...form, building: e.target.value })
                                            }
                                            placeholder="Contoh: Gedung A"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Lantai
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={form.floor}
                                            onChange={(e) =>
                                                setForm({ ...form, floor: e.target.value })
                                            }
                                            placeholder="Contoh: 2"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Kapasitas *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="1000"
                                            value={form.capacity}
                                            onChange={(e) =>
                                                setForm({ ...form, capacity: e.target.value })
                                            }
                                            placeholder="Jumlah orang"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Status
                                        </label>
                                        <select
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    status: e.target.value as RoomStatus,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                                        >
                                            <option value="available">Tersedia</option>
                                            <option value="maintenance">Pemeliharaan</option>
                                            <option value="inactive">Tidak Aktif</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        rows={3}
                                        maxLength={5000}
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({ ...form, description: e.target.value })
                                        }
                                        placeholder="Deskripsi ruangan..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Path Gambar
                                    </label>
                                    <input
                                        value={form.image}
                                        onChange={(e) =>
                                            setForm({ ...form, image: e.target.value })
                                        }
                                        placeholder="Contoh: rooms/lab-kom.jpg"
                                        maxLength={255}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        Masukkan path gambar jika sudah tersedia.
                                    </p>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Fasilitas Ruangan
                                        </label>
                                        <span className="text-xs text-slate-400">
                                            {form.facilities.length} dipilih
                                        </span>
                                    </div>

                                    {facilities.length === 0 ? (
                                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                            Belum ada data fasilitas. Tambahkan melalui
                                            halaman Manajemen Fasilitas.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                                            {facilities.map((facility) => (
                                                <label
                                                    key={facility.id}
                                                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm text-slate-600 transition hover:bg-slate-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={form.facilities.includes(facility.id)}
                                                        onChange={() => toggleFacility(facility.id)}
                                                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                                                    />
                                                    {facility.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
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
                                          ? "Simpan Ruangan"
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
