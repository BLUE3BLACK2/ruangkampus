
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowRight,
    Building2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import TurnstileWidget from "@/components/TurnstileWidget";
import GuestGuard from "@/components/GuestGuard";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [turnstileKey, setTurnstileKey] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!turnstileToken) {
            setError("Silakan selesaikan verifikasi keamanan terlebih dahulu.");
            return;
        }

        try {
            setLoading(true);

            const user = await login({
                email,
                password,
                turnstile_token: turnstileToken,
            });

            if (user.role === "admin") {
                router.push("/admin");
            } else {
                router.push("/");
            }
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    "Login gagal. Periksa kembali email dan password."
                );
                setTurnstileToken("");
                setTurnstileKey((prev) => prev + 1);
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
                            Kelola Ruang,
                            <br />
                            Mudahkan Aktivitas.
                        </h1>

                        <p className="mt-6 text-lg leading-relaxed text-blue-50">
                            Satu platform untuk mengelola peminjaman ruang
                            perkuliahan dengan lebih mudah, teratur, dan efisien.
                        </p>
                    </div>

                    <p className="relative z-10 text-sm text-blue-100">
                        Â© 2026 RuangKuliah. Sistem Reservasi Ruang Kampus.
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
                                Selamat Datang
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                Masuk ke Akun
                            </h2>
                            <p className="mt-2 text-slate-500">
                                Masukkan akun Anda untuk melanjutkan ke RuangKuliah.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
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
                                        placeholder="Masukkan password"
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

                            <div className="overflow-hidden">
                                <TurnstileWidget
                                    key={turnstileKey}
                                    onVerify={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken("")}
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !turnstileToken}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0756C9] to-[#087DEB] py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Memproses..." : "Masuk"}
                                {!loading && <ArrowRight size={19} />}
                            </button>
                        </form>

                            <div className="mt-8 border-t border-slate-100 pt-6 text-center space-y-4">
                                <p className="text-sm text-slate-500">
                                    Belum memiliki akun?{" "}
                                    <Link
                                        href="/register"
                                        className="font-semibold text-[#087DEB] hover:underline"
                                    >
                                        Daftar sekarang
                                    </Link>
                                </p>

                                <p className="text-xs leading-relaxed text-slate-400">
                                    Dengan masuk, Anda menyetujui penggunaan sistem
                                    RuangKuliah sesuai ketentuan yang berlaku.
                                </p>
                            </div>

                    </div>
                </section>
            </main>
        </GuestGuard>

    );
}
