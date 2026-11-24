'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import FormField from '@/components/ui/FormField';
import Notice from '@/components/ui/Notice';
import { buttonClass, panelClass, subtitleClass, titleClass } from '@/components/ui/styles';
import { useAuthActions } from './useAuthActions';

export default function LoginForm() {
  const [values, setValues] = useState({ email: '', password: '' });
  const { login, loading, error, fieldErrors } = useAuthActions();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(values);
  }

  return (
    <section className={`${panelClass} mx-auto max-w-md`}>
      <h1 className={titleClass}>Masuk</h1>
      <p className={subtitleClass}>Masuk untuk mengajukan dan memantau reservasi ruangan.</p>

      {error && <Notice type="error">{error}</Notice>}

      <form onSubmit={handleSubmit}>
        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={fieldErrors.email}
          placeholder="nama@kampus.ac.id"
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />
        <button type="submit" className={buttonClass({ block: true })} disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </section>
  );
}