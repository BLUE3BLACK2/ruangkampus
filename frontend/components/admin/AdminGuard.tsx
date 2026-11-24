
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import auth from "@/services/auth";

export default function AdminGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;

        const checkAccess = async () => {
            const token = auth.getToken();

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const user = await auth.getUser();

                if (!active) return;

                if (user.role !== "admin") {
                    router.replace("/");
                    return;
                }

                setLoading(false);
            } catch (err: any) {
                if (!active) return;

                if (err.response?.status === 401) {
                    localStorage.removeItem("auth_token");
                    router.replace("/login");
                    return;
                }

                setError(true);
                setLoading(false);
            }
        };

        checkAccess();

        return () => {
            active = false;
        };
    }, [router, retry]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#087DEB]" />
                    <p className="mt-4 text-sm text-slate-500">
                        Memverifikasi akses...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
                <div className="max-w-sm text-center">
                    <h2 className="text-lg font-bold text-slate-800">
                        Gagal memverifikasi akses
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Periksa koneksi ke server dan coba kembali.
                    </p>
                    <button
                        onClick={() => {
                            setError(false);
                            setLoading(true);
                            setRetry((prev) => prev + 1);
                        }}
                        className="mt-5 rounded-xl bg-[#087DEB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0756C9]"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
