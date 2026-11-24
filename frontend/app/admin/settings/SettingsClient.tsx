
"use client";

import { useEffect, useState } from "react";
import {
    UserRound,
    ShieldCheck,
    Info,
    Save,
    LockKeyhole,
} from "lucide-react";
import api from "@/services/api";

interface AdminProfile {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
}

export default function SettingsClient() {
    const [profile, setProfile] = useState<AdminProfile>({
        id: 0,
        name: "",
        email: "",
        role: "admin",
    });

    const [password, setPassword] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/me");
                setProfile(response.data.data.user);
            } catch {
                setProfileError("Gagal mengambil data profil admin.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setPassword({
            ...password,
            [e.target.name]: e.target.value,
        });
    };

    const handleUpdateProfile = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage("");
        setProfileError("");

        try {
            const response = await api.put("/me", {
                name: profile.name,
                email: profile.email,
            });

            setProfile(response.data.data.user);
            setProfileMessage("Profil berhasil diperbarui.");
        } catch (error) {
            const apiError = error as ApiError;
            setProfileError(
                apiError.response?.data?.errors
                    ? Object.values(apiError.response.data.errors)
                        .flat()[0]
                    : apiError.response?.data?.message ||
                      "Gagal memperbarui profil."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setSavingPassword(true);
        setPasswordMessage("");
        setPasswordError("");

        try {
            await api.put("/me/password", password);

            setPassword({
                current_password: "",
                password: "",
                password_confirmation: "",
            });

            setPasswordMessage("Password berhasil diperbarui.");
        } catch (error) {
            const apiError = error as ApiError;
            setPasswordError(
                apiError.response?.data?.errors
                    ? Object.values(apiError.response.data.errors)
                        .flat()[0]
                    : apiError.response?.data?.message ||
                      "Gagal memperbarui password."
            );
        } finally {
            setSavingPassword(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    const labelClass =
        "mb-2 block text-sm font-medium text-gray-700";

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-sm text-gray-500">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>Admin</span>
                    <span>/</span>
                    <span className="text-blue-600">Pengaturan</span>
                </div>
                <h1 className="text-2xl font-bold text-[#172B4D]">
                    Pengaturan
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Kelola profil, keamanan akun, dan informasi sistem RuangKuliah.
                </p>
            </div>

            {/* Profile Section */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={21} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[#172B4D]">
                            Profil Admin
                        </h2>
                        <p className="text-xs text-gray-500">
                            Informasi akun administrator
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5 p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className={inputClass}
                                placeholder="Masukkan nama admin"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                className={inputClass}
                                placeholder="Masukkan email admin"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Role Akun</label>
                            <input
                                type="text"
                                value="Administrator"
                                className={`${inputClass} bg-gray-50 text-gray-500`}
                                disabled
                            />
                        </div>
                    </div>

                    {profileMessage && (
                        <p className="text-sm text-green-600">
                            {profileMessage}
                        </p>
                    )}

                    {profileError && (
                        <p className="text-sm text-red-600">
                            {profileError}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            <Save size={17} />
                            {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Password Section */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <ShieldCheck size={21} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[#172B4D]">
                            Keamanan Akun
                        </h2>
                        <p className="text-xs text-gray-500">
                            Perbarui password untuk menjaga keamanan akun
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5 p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Password Saat Ini</label>
                            <input
                                type="password"
                                name="current_password"
                                value={password.current_password}
                                onChange={handlePasswordChange}
                                className={inputClass}
                                placeholder="Masukkan password saat ini"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Password Baru</label>
                            <input
                                type="password"
                                name="password"
                                value={password.password}
                                onChange={handlePasswordChange}
                                className={inputClass}
                                placeholder="Minimal 8 karakter"
                                minLength={8}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                name="password_confirmation"
                                value={password.password_confirmation}
                                onChange={handlePasswordChange}
                                className={inputClass}
                                placeholder="Ulangi password baru"
                                minLength={8}
                                required
                            />
                        </div>
                    </div>

                    {passwordMessage && (
                        <p className="text-sm text-green-600">
                            {passwordMessage}
                        </p>
                    )}

                    {passwordError && (
                        <p className="text-sm text-red-600">
                            {passwordError}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            <LockKeyhole size={17} />
                            {savingPassword ? "Memproses..." : "Ubah Password"}
                        </button>
                    </div>
                </form>
            </section>

            {/* System Information */}
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Info size={21} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[#172B4D]">
                            Informasi Sistem
                        </h2>
                        <p className="text-xs text-gray-500">
                            Informasi aplikasi RuangKuliah
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 p-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-gray-500">Nama Aplikasi</p>
                        <p className="mt-1 text-sm font-semibold text-[#172B4D]">
                            RuangKuliah
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Versi Aplikasi</p>
                        <p className="mt-1 text-sm font-semibold text-[#172B4D]">
                            1.0.0
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Platform</p>
                        <p className="mt-1 text-sm font-semibold text-[#172B4D]">
                            Sistem Reservasi Ruangan Kampus
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Hak Akses</p>
                        <p className="mt-1 text-sm font-semibold text-[#172B4D]">
                            Administrator
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
