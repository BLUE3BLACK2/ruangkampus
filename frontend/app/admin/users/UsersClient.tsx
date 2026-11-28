
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
    Users,
    UserRound,
    GraduationCap,
    ShieldCheck,
    Filter,
    CalendarDays,
    Mail,
    Hash,
} from "lucide-react";

import api from "@/services/api";

type UserRole = "admin" | "mahasiswa" | "dosen";

interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    nim: string | null;
    nip: string | null;
    reservations_count: number;
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

interface UserResponse {
    data: User[];
    meta: PaginationMeta;
}

interface UserForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: UserRole;
    nim: string;
    nip: string;
}

const initialForm: UserForm = {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "mahasiswa",
    nim: "",
    nip: "",
};

const roleLabels: Record<UserRole, string> = {
    admin: "Admin",
    mahasiswa: "Mahasiswa",
    dosen: "Dosen",
};

const roleStyles: Record<UserRole, string> = {
    admin: "bg-purple-50 text-purple-700 ring-purple-200",
    mahasiswa: "bg-blue-50 text-blue-700 ring-blue-200",
    dosen: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function RoleBadge({ role }: { role: UserRole }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyles[role]}`}
        >
            {roleLabels[role]}
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

function formatDate(date: string | null) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function UsersClient() {
    const [users, setUsers] = useState<User[]>([]);

    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    });

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [page, setPage] = useState(1);
    const [goToPage, setGoToPage] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalType, setModalType] = useState<
        "detail" | "create" | "edit" | "delete" | null
    >(null);

    const [selected, setSelected] = useState<User | null>(null);
    const [form, setForm] = useState<UserForm>(initialForm);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<UserResponse>("/admin/users", {
                params: {
                    search: search || undefined,
                    role: role || undefined,
                    page,
                    per_page: 10,
                },
            });

            setUsers(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, role, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 350);

        return () => clearTimeout(timer);
    }, [fetchUsers]);

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
        setRole("");
        setPage(1);
    };

    const closeModal = () => {
        if (saving) return;

        setModalType(null);
        setSelected(null);
        setForm(initialForm);
        setError("");
    };

    const openCreate = () => {
        setSelected(null);
        setForm(initialForm);
        setModalType("create");
        setError("");
    };

    const openDetail = (user: User) => {
        setSelected(user);
        setModalType("detail");
        setError("");
    };

    const openEdit = (user: User) => {
        setSelected(user);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            password_confirmation: "",
            role: user.role,
            nim: user.nim || "",
            nip: user.nip || "",
        });
        setModalType("edit");
        setError("");
    };

    const openDelete = (user: User) => {
        setSelected(user);
        setModalType("delete");
        setError("");
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            setError("Nama dan email wajib diisi.");
            return;
        }

        if (modalType === "create" && !form.password) {
            setError("Password wajib diisi.");
            return;
        }

        if (form.password) {
            if (form.password.length < 8) {
                setError("Password minimal 8 karakter.");
                return;
            }

            if (form.password !== form.password_confirmation) {
                setError("Konfirmasi password tidak sesuai.");
                return;
            }
        }

        if (form.role === "mahasiswa" && !form.nim.trim()) {
            setError("NIM wajib diisi untuk mahasiswa.");
            return;
        }

        if (form.role === "dosen" && !form.nip.trim()) {
            setError("NIP wajib diisi untuk dosen.");
            return;
        }

        const payload: Record<string, string | null> = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            nim: form.role === "mahasiswa" ? form.nim.trim() : null,
            nip: form.role === "dosen" ? form.nip.trim() : null,
        };

        if (form.password) {
            payload.password = form.password;
            payload.password_confirmation = form.password_confirmation;
        }

        setSaving(true);
        setError("");

        try {
            if (modalType === "create") {
                await api.post("/admin/users", payload);
                setNotice("Pengguna berhasil ditambahkan.");
            } else if (modalType === "edit" && selected) {
                await api.put(`/admin/users/${selected.id}`, payload);
                setNotice("Data pengguna berhasil diperbarui.");
            }

            setModalType(null);
            setSelected(null);
            setForm(initialForm);
            await fetchUsers();
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
            await api.delete(`/admin/users/${selected.id}`);
            setNotice("Pengguna berhasil dihapus.");
            setModalType(null);
            setSelected(null);

            if (users.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await fetchUsers();
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const totalAdmins = users.filter((user) => user.role === "admin").length;
    const totalStudents = users.filter((user) => user.role === "mahasiswa").length;
    const totalLecturers = users.filter((user) => user.role === "dosen").length;

    const isFiltered = Boolean(search || role);

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[#087DEB]">
                        Administrasi
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Manajemen Pengguna
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola akun admin, mahasiswa, dan dosen RuangKuliah.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
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
                        Tambah Pengguna
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Pengguna",
                        value: meta.total,
                        icon: Users,
                        color: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "Admin (halaman ini)",
                        value: totalAdmins,
                        icon: ShieldCheck,
                        color: "bg-purple-50 text-purple-600",
                    },
                    {
                        label: "Mahasiswa (halaman ini)",
                        value: totalStudents,
                        icon: GraduationCap,
                        color: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "Dosen (halaman ini)",
                        value: totalLecturers,
                        icon: UserRound,
                        color: "bg-emerald-50 text-emerald-600",
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
                                Daftar Pengguna
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Seluruh akun yang terdaftar di RuangKuliah.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <div className="relative min-w-0 sm:w-72">
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
                                    placeholder="Cari nama, email, NIM, NIP..."
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="relative">
                                <Filter
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <select
                                    value={role}
                                    onChange={(e) => {
                                        setRole(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-blue-400 sm:w-44"
                                >
                                    <option value="">Semua Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="mahasiswa">Mahasiswa</option>
                                    <option value="dosen">Dosen</option>
                                </select>
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-4">Pengguna</th>
                                <th className="px-5 py-4">Role</th>
                                <th className="px-5 py-4">Identitas</th>
                                <th className="px-5 py-4">Reservasi</th>
                                <th className="px-5 py-4">Terdaftar</th>
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
                                            Memuat data pengguna...
                                        </p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <Users
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-3 font-semibold text-slate-600">
                                            Tidak ada pengguna ditemukan
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Coba ubah pencarian atau filter role.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-700">
                                                        {user.name}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-700">
                                                {user.nim || user.nip || "-"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {user.nim ? "NIM" : user.nip ? "NIP" : "Tidak ada"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <CalendarDays size={15} className="text-slate-400" />
                                                {user.reservations_count}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {formatDate(user.created_at)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openDetail(user)}
                                                    title="Detail"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEdit(user)}
                                                    title="Edit"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openDelete(user)}
                                                    title="Hapus"
                                                    disabled={user.id === Number(localStorage.getItem("current_user_id"))}
                                                    className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
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
                    pengguna
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
                            setPage((current) => Math.min(meta.last_page, current + 1))
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
                                        ? "Tambah Pengguna"
                                        : modalType === "edit"
                                          ? "Edit Pengguna"
                                          : modalType === "delete"
                                            ? "Hapus Pengguna"
                                            : "Detail Pengguna"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selected?.email || "Lengkapi informasi pengguna"}
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
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
                                        {selected.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">
                                            {selected.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {selected.email}
                                        </p>
                                        <div className="mt-2">
                                            <RoleBadge role={selected.role} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Hash size={15} />
                                            Identitas
                                        </div>
                                        <p className="mt-2 font-semibold text-slate-800">
                                            {selected.nim || selected.nip || "-"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {selected.nim ? "Nomor Induk Mahasiswa" : selected.nip ? "Nomor Induk Pegawai" : "Tidak tersedia"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CalendarDays size={15} />
                                            Total Reservasi
                                        </div>
                                        <p className="mt-2 font-semibold text-slate-800">
                                            {selected.reservations_count} reservasi
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Mail size={15} />
                                        Email
                                    </div>
                                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                                        {selected.email}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <CalendarDays size={15} />
                                        Tanggal Terdaftar
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                        {formatDate(selected.created_at)}
                                    </p>
                                </div>
                            </div>
                        ) : modalType === "delete" && selected ? (
                            <div className="space-y-4 p-6">
                                <div className="rounded-xl bg-red-50 p-4 text-red-800">
                                    <p className="text-sm font-semibold">
                                        Apakah kamu yakin ingin menghapus pengguna ini?
                                    </p>
                                    <p className="mt-1 text-xs">
                                        {selected.name} · {selected.email}
                                    </p>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-500">
                                    Pengguna yang memiliki riwayat reservasi tidak dapat dihapus.
                                    Akun admin yang sedang digunakan juga tidak dapat dihapus.
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
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Nama Lengkap *
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm({ ...form, name: e.target.value })
                                            }
                                            placeholder="Masukkan nama lengkap"
                                            maxLength={255}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm({ ...form, email: e.target.value })
                                            }
                                            placeholder="contoh@email.com"
                                            maxLength={255}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Role *
                                        </label>
                                        <select
                                            value={form.role}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    role: e.target.value as UserRole,
                                                    nim: "",
                                                    nip: "",
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                                        >
                                            <option value="mahasiswa">Mahasiswa</option>
                                            <option value="dosen">Dosen</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            {form.role === "mahasiswa"
                                                ? "NIM *"
                                                : form.role === "dosen"
                                                  ? "NIP *"
                                                  : "Identitas"}
                                        </label>
                                        {form.role === "mahasiswa" ? (
                                            <input
                                                value={form.nim}
                                                onChange={(e) =>
                                                    setForm({ ...form, nim: e.target.value })
                                                }
                                                placeholder="Masukkan NIM"
                                                maxLength={20}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        ) : form.role === "dosen" ? (
                                            <input
                                                value={form.nip}
                                                onChange={(e) =>
                                                    setForm({ ...form, nip: e.target.value })
                                                }
                                                placeholder="Masukkan NIP"
                                                maxLength={20}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        ) : (
                                            <input
                                                value="-"
                                                disabled
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <h3 className="text-sm font-bold text-slate-800">
                                        {modalType === "create"
                                            ? "Password Akun"
                                            : "Ubah Password (Opsional)"}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {modalType === "create"
                                            ? "Buat password minimal 8 karakter."
                                            : "Kosongkan jika tidak ingin mengubah password."}
                                    </p>

                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Password {modalType === "create" ? "*" : ""}
                                            </label>
                                            <input
                                                type="password"
                                                value={form.password}
                                                onChange={(e) =>
                                                    setForm({ ...form, password: e.target.value })
                                                }
                                                placeholder="Minimal 8 karakter"
                                                autoComplete="new-password"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Konfirmasi Password {modalType === "create" ? "*" : ""}
                                            </label>
                                            <input
                                                type="password"
                                                value={form.password_confirmation}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        password_confirmation: e.target.value,
                                                    })
                                                }
                                                placeholder="Ulangi password"
                                                autoComplete="new-password"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>
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
                                          ? "Simpan Pengguna"
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
