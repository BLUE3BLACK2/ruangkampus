
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Building2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    UserRound,
    GraduationCap,
    ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import TurnstileWidget from "@/components/TurnstileWidget";
import GuestGuard from "@/components/GuestGuard";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"mahasiswa" | "dosen">("mahasiswa");
    const [nim, setNim] = useState("");
    const [nip, setNip] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (password !== passwordConfirmation) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        if (password.length < 8) {
            setError("Password minimal 8 karakter.");
            return;
        }

        if (!turnstileToken) {
            setError("Silakan selesaikan verifikasi keamanan terlebih dahulu.");
            return;
        }

        try {
            setLoading(true);

            const data = {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
                role,
                ...(role === "mahasiswa" ? { nim } : { nip }),
                turnstile_token: turnstileToken,
            };

            await register(data);

            router.push("/");
            router.refresh();
        } catch (err: any) {
            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors).flat()[0];
                setError(String(firstError));
            } else {
                setError(
                    err.response?.data?.message ||
                    "Registrasi gagal. Silakan coba kembali."
                );
            }

            setTurnstileToken("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestGuard>
            <main className="flex min-h-screen bg-white">
                {/* Left Section */}
                <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0756C9] via-[#087DEB] to-[#18A6E8] p-12 text-white lg:flex">
                    <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[50px] border-white/10" />
                    <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

                    <Link href="/" className="relative z-10 flex items-center gap-3">
                        <div className="rounded-xl bg-white/15 p-3">
                            <Building2 size={28} />
                        </div>
                        <span className="text-2xl font-bold">RuangKuliah</span>
                    </Link>

                    <div className="relative z-10 max-w-lg">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                            <ShieldCheck size={17} />
                            Sistem Reservasi Ruang Kampus
                        </div>

                        <h1 className="text-5xl font-bold leading-tight">
                            Bergabung,
                            <br />
                            Mulai Reservasi.
                        </h1>

                        <p className="mt-6 text-lg leading-relaxed text-blue-50">
                            Buat akun RuangKuliah untuk memudahkan proses
                            pencarian dan peminjaman ruang perkuliahan.
                        </p>
                    </div>

                    <p className="relative z-10 text-sm text-blue-100">
                        © 2026 RuangKuliah. Sistem Reservasi Ruang Kampus.
                    </p>
                </section>

                {/* Right Section */}
                <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        <div className="mb-10 lg:hidden">
                            <Link href="/" className="flex items-center gap-3 text-[#0756C9]">
                                <Building2 size={30} />
                                <span className="text-2xl font-bold">RuangKuliah</span>
                            </Link>
                        </div>

                        <div className="mb-8">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#087DEB]">
                                Buat Akun
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                Daftar RuangKuliah
                            </h2>
                            <p className="mt-2 text-slate-500">
                                Lengkapi data Anda untuk mulai menggunakan sistem.
                            </p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nama@email.com"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Daftar Sebagai
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole("mahasiswa");
                                            setNip("");
                                        }}
                                        className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${
                                            role === "mahasiswa"
                                                ? "border-[#087DEB] bg-blue-50 text-[#087DEB]"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <GraduationCap size={18} />
                                        Mahasiswa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole("dosen");
                                            setNim("");
                                        }}
                                        className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${
                                            role === "dosen"
                                                ? "border-[#087DEB] bg-blue-50 text-[#087DEB]"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <GraduationCap size={18} />
                                        Dosen
                                    </button>
                                </div>
                            </div>

                            {/* NIM / NIP */}
                            {role === "mahasiswa" ? (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        NIM
                                    </label>
                                    <input
                                        type="text"
                                        value={nim}
                                        onChange={(e) => setNim(e.target.value)}
                                        placeholder="Masukkan NIM"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        NIP
                                    </label>
                                    <input
                                        type="text"
                                        value={nip}
                                        onChange={(e) => setNip(e.target.value)}
                                        placeholder="Masukkan NIP"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Confirmation */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                    <input
                                        type={showConfirmation ? "text" : "password"}
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="Ulangi password"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-[#087DEB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmation(!showConfirmation)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                                    </button>
                                </div>
                            </div>

                            {/* Turnstile */}
                            <div className="overflow-hidden">
                                <TurnstileWidget
                                    onVerify={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken("")}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !turnstileToken}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0756C9] to-[#087DEB] py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Memproses..." : "Daftar"}
                                {!loading && <ArrowRight size={19} />}
                            </button>
                        </form>

                        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Sudah memiliki akun?{" "}
                                <Link
                                    href="/login"
                                    className="font-semibold text-[#087DEB] hover:underline"
                                >
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </GuestGuard>

    );
}
