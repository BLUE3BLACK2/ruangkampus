'use client';

import { useMemo, useState } from 'react';
import StateMessage from '@/components/ui/StateMessage';
import { inputClass, subtitleClass, titleClass } from '@/components/ui/styles';
import type { RoomStatus } from '@/types';
import RoomCard from './RoomCard';
import { useRoomList } from './useRooms';

type StatusFilter = 'all' | RoomStatus;

export default function RoomCatalog() {
  const { data, loading, error, reload } = useRoomList();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const rooms = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return (data ?? []).filter((room) => {
      const text = `${room.room_name} ${room.room_code} ${room.building}`.toLowerCase();
      return text.includes(query) && (status === 'all' || room.status === status);
    });
  }, [data, keyword, status]);

  return (
    <>
      <h1 className={titleClass}>Daftar Ruangan</h1>
      <p className={subtitleClass}>Cari ruangan yang sesuai dengan kebutuhan kegiatanmu.</p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Cari nama, kode, atau gedung..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          aria-label="Cari ruangan"
          className={`${inputClass} sm:flex-1`}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="Filter status"
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">Semua status</option>
          <option value="available">Tersedia</option>
          <option value="maintenance">Perawatan</option>
        </select>
      </div>

      {loading && <StateMessage variant="loading" text="Memuat daftar ruangan..." />}
      {!loading && error && <StateMessage variant="error" text={error} onRetry={reload} />}
      {!loading && !error && rooms.length === 0 && (
        <StateMessage variant="empty" text="Tidak ada ruangan yang cocok dengan pencarianmu." />
      )}
      {!loading && !error && rooms.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  );
}