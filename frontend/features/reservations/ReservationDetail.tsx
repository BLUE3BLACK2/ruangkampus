'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Notice from '@/components/ui/Notice';
import StateMessage from '@/components/ui/StateMessage';
import StatusBadge from '@/components/ui/StatusBadge';
import { backLinkClass, buttonClass, panelClass, titleClass } from '@/components/ui/styles';
import { formatDate, formatDateTime, formatTime } from '@/utils/format';
import { useCancelReservation, useReservationDetail } from './useReservations';

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: reservation, loading, error, reload } = useReservationDetail(id);
  const { cancel, cancelling, error: cancelError } = useCancelReservation(reload);

  if (loading) return <StateMessage variant="loading" text="Memuat detail reservasi..." />;
  if (error || !reservation) {
    return <StateMessage variant="error" text={error || 'Reservasi tidak ditemukan.'} onRetry={reload} />;
  }

  // Backend tetap menjadi penentu akhir apakah pembatalan diperbolehkan
  const canCancel = reservation.status === 'pending' || reservation.status === 'approved';

  const rows: [string, string | null][] = [
    ['Kode reservasi', reservation.reservation_code],
    ['Ruangan', reservation.room ? `${reservation.room.room_name} (${reservation.room.building})` : `Ruangan #${reservation.room_id}`],
    ['Tanggal', formatDate(reservation.reservation_date)],
    ['Waktu', `${formatTime(reservation.start_time)} – ${formatTime(reservation.end_time)}`],
    ['Jumlah peserta', `${reservation.participant_count} orang`],
    ['Tujuan', reservation.purpose],
    ['Catatan admin', reservation.admin_notes],
    ['Ditinjau pada', reservation.reviewed_at ? formatDateTime(reservation.reviewed_at) : null],
  ];

  return (
    <>
      <Link href="/reservations" className={backLinkClass}>
        ← Kembali ke riwayat
      </Link>

      <section className={`${panelClass} mx-auto max-w-2xl`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className={titleClass}>Detail Reservasi</h1>
          <StatusBadge status={reservation.status} />
        </div>

        {cancelError && <Notice type="error">{cancelError}</Notice>}

        <dl className="divide-y divide-slate-200">
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4">
                <dt className="text-slate-500 sm:w-40 sm:shrink-0">{label}</dt>
                <dd className="break-words font-medium text-slate-900">{value}</dd>
              </div>
            ))}
        </dl>

        {canCancel && (
          <button
            type="button"
            className={`${buttonClass({ variant: 'danger' })} mt-5`}
            disabled={cancelling}
            onClick={() => cancel(reservation.id)}
          >
            {cancelling ? 'Membatalkan...' : 'Batalkan Reservasi'}
          </button>
        )}
      </section>
    </>
  );
}