
"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

import FormField from "@/components/ui/FormField";
import Notice from "@/components/ui/Notice";
import TurnstileWidget from "@/components/TurnstileWidget";

import {
  buttonClass,
  panelClass,
  subtitleClass,
  titleClass,
} from "@/components/ui/styles";

import { useAuthActions } from "./useAuthActions";

type Role = "mahasiswa" | "dosen";

const initialValues = {
  name: "",
  email: "",
  identity: "",
  password: "",
  password_confirmation: "",
};

export default function RegisterForm() {
  const [role, setRole] = useState<Role>("mahasiswa");
  const [values, setValues] = useState(initialValues);
  const [clientError, setClientError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const { register, loading, error, fieldErrors } = useAuthActions();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.password !== values.password_confirmation) {
      setClientError("Konfirmasi password tidak sama.");
      return;
    }

    if (!turnstileToken) {
      setClientError("Silakan selesaikan verifikasi keamanan.");
      return;
    }

    setClientError("");

    const {
      identity,
      ...rest
    } = values;

    if (role === "mahasiswa") {
      register({
        ...rest,
        role,
        nim: identity,
        turnstile_token: turnstileToken,
      });
    } else {
      register({
        ...rest,
        role,
        nip: identity,
        turnstile_token: turnstileToken,
      });
    }
  }

  return (
    <section className={`${panelClass} mx-auto max-w-md`}>
      <h1 className={titleClass}>Daftar Akun</h1>

      <p className={subtitleClass}>
        Khusus mahasiswa dan dosen.
      </p>

      {(clientError || error) && (
        <Notice type="error">{clientError || error}</Notice>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2">
        {(["mahasiswa", "dosen"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={buttonClass({
              variant: item === role ? "primary" : "ghost",
            })}
            onClick={() => setRole(item)}
          >
            {item === "mahasiswa" ? "Mahasiswa" : "Dosen"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <FormField
          label="Nama lengkap"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={fieldErrors.name}
          required
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />

        <FormField
          label={role === "mahasiswa" ? "NIM" : "NIP"}
          name="identity"
          value={values.identity}
          onChange={handleChange}
          error={fieldErrors[role === "mahasiswa" ? "nim" : "nip"]}
          required
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          minLength={8}
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />

        <FormField
          label="Konfirmasi password"
          name="password_confirmation"
          type="password"
          value={values.password_confirmation}
          onChange={handleChange}
          error={fieldErrors.password_confirmation}
          required
        />

        <div className="my-5">
          <TurnstileWidget
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />
        </div>

        <button
          type="submit"
          className={buttonClass({ block: true })}
          disabled={loading || !turnstileToken}
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </section>
  );
}
