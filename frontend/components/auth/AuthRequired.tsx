"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authService } from "@/services/authService";
import { setAuth } from "@/store/authStore";
import StateMessage from "@/components/ui/StateMessage";

export default function AuthRequired({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      if (!authService.getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const user = await authService.getMe();

        if (!active) return;

        if (user.role === "admin") {
          router.replace("/admin");
          return;
        }

        if (user.role !== "mahasiswa" && user.role !== "dosen") {
          router.replace("/login");
          return;
        }

        setAuth(user);
        setAllowed(true);
      } catch {
        if (active) {
          localStorage.removeItem("auth_token");
          router.replace("/login");
        }
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!allowed) {
    return (
      <StateMessage
        variant="loading"
        text="Memeriksa sesi akun..."
      />
    );
  }

  return <>{children}</>;
}