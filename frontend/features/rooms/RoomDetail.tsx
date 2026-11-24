'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import InfoGrid from '@/components/ui/InfoGrid';
import StateMessage from '@/components/ui/StateMessage';
import StatusBadge from '@/components/ui/StatusBadge';
import { backLinkClass, buttonClass, panelClass, titleClass } from '@/components/ui/styles';
import RoomImage from './RoomImage';
import { useRoomDetail } from './useRooms';

const sectionTitle = 'mb-2 text-lg font-semibold text-slate-900';

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: room, loading, error, reload } = useRoomDetail(id);

  if (loading) return <StateMessage variant="loading" text="Memuat detail ruangan..." />;
  if (error || !room) {
    return <StateMessage variant="error" text={error || 'Ruangan tidak ditemukan.'} onRetry={reload} />;
  }

  const facilities = room.facilities ?? [];

  return (
    <>
      <Link href="/rooms" className={backLinkClass}>
        ← Kembali ke daftar ruangan
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <RoomImage room={room} className="rounded-2xl" />

          <div className={panelClass}>
            <h2 className={sectionTitle}>Deskripsi</h2>
            <p className="text-slate-600">{room.description || 'Belum ada deskripsi untuk ruangan ini.'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className={panelClass}>
            <span className="text-xs font-semibold tracking-wide text-slate-500">{room.room_code}</span>
            <h1 className={`${titleClass} mb-2`}>{room.room_name}</h1>
            <StatusBadge status={room.status} />

            <InfoGrid
              items={[
                { label: 'Gedung', value: room.building },
                { label: 'Lantai', value: room.floor },
                { label: 'Kapasitas', value: `${room.capacity} orang` },
              ]}
            />

            {room.status === 'available' ? (
              <Link href={`/rooms/${room.id}/reserve`} className={buttonClass({ block: true })}>
                Reservasi Ruangan
              </Link>
            ) : (
              <button type="button" className={buttonClass({ block: true })} disabled>
                Tidak tersedia untuk reservasi
              </button>
            )}
          </div>

          <div className={panelClass}>
            <h2 className={sectionTitle}>Fasilitas</h2>
            {facilities.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data fasilitas.</p>
            ) : (
              <ul className="grid gap-2.5">
                {facilities.map((facility) => (
                  <li key={facility.id} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800">
                    {facility.name}
                    {facility.description && (
                      <span className="block font-normal text-slate-500">{facility.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}