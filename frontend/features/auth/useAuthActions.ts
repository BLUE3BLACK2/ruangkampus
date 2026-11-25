"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { authService } from "@/services/authService";
import { setAuth } from "@/store/authStore";

interface FieldErrors {
  [key: string]: string;
}

function extractError(error: unknown): {
  message: string;
  fieldErrors: FieldErrors;
} {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;

    const fieldErrors: FieldErrors = {};

    if (response?.errors) {
      Object.entries(response.errors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          fieldErrors[key] = String(value[0]);
        }
      });
    }

    return {
      message:
        response?.message ||
        "Terjadi kesalahan. Silakan coba kembali.",
      fieldErrors,
    };
  }

  return {
    message: "Terjadi kesalahan yang tidak diketahui.",
    fieldErrors: {},
  };
}

export function useAuthActions() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function login(payload: {
    email: string;
    password: string;
    turnstile_token: string;
  }) {
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const user = await authService.login(payload);

      setAuth(user);

      router.push(user.role === "admin" ? "/admin" : "/rooms");
      router.refresh();
    } catch (err) {
      const result = extractError(err);

      setError(result.message);
      setFieldErrors(result.fieldErrors);
    } finally {
      setLoading(false);
    }
  }

  async function register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: "mahasiswa" | "dosen";
    nim?: string;
    nip?: string;
    turnstile_token: string;
  }) {
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const user = await authService.register(payload);

      setAuth(user);

      router.push("/rooms");
      router.refresh();
    } catch (err) {
      const result = extractError(err);

      setError(result.message);
      setFieldErrors(result.fieldErrors);
    } finally {
      setLoading(false);
    }
  }

  return {
    login,
    register,
    loading,
    error,
    fieldErrors,
  };
}