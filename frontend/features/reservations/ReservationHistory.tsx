'use client';

import Link from 'next/link';
import { useState } from 'react';
import StateMessage from '@/components/ui/StateMessage';
import StatusBadge from '@/components/ui/StatusBadge';
import { buttonClass, subtitleClass, titleClass } from '@/components/ui/styles';
import { formatDate, formatTime } from '@/utils/format';
import type { ReservationStatus } from '@/types';
import { useMyReservations } from './useReservations';

type Filter = 'all' | ReservationStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function ReservationHistory() {
  const { data, loading, error, reload } = useMyReservations();
  const [filter, setFilter] = useState<Filter>('all');

  const reservations = (data ?? []).filter((item) => filter === 'all' || item.status === filter);

  return (
    <>
      <h1 className={titleClass}>Riwayat Reservasi</h1>
      <p className={subtitleClass}>Pantau status pengajuan reservasi ruanganmu.</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={buttonClass({ variant: item.value === filter ? 'primary' : 'ghost', size: 'sm' })}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <StateMessage variant="loading" text="Memuat riwayat reservasi..." />}
      {!loading && error && <StateMessage variant="error" text={error} onRetry={reload} />}
      {!loading && !error && reservations.length === 0 && (
        <StateMessage variant="empty" text="Belum ada reservasi pada kategori ini.">
          <Link href="/rooms" className={buttonClass({ variant: 'outline', size: 'sm' })}>
            Cari ruangan
          </Link>
        </StateMessage>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="grid gap-3">
          {reservations.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{item.room?.room_name ?? `Ruangan #${item.room_id}`}</h3>
                <p className="text-sm text-slate-500">
                  {formatDate(item.reservation_date)} · {formatTime(item.start_time)}–{formatTime(item.end_time)}
                </p>
                <p className="text-sm text-slate-400">{item.reservation_code}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <Link href={`/reservations/${item.id}`} className={buttonClass({ variant: 'outline', size: 'sm' })}>
                  Detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}