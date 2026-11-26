"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function GuestGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === "admin") {
                router.replace("/admin");
            } else {
                router.replace("/");
            }
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-[#087DEB]" />
                    <p className="text-sm text-slate-500">
                        Memeriksa akun...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}