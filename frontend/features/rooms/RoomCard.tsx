import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { buttonClass } from '@/components/ui/styles';
import type { Room } from '@/types';
import RoomImage from './RoomImage';

const MAX_FACILITIES = 3;

export default function RoomCard({ room }: { room: Room }) {
  const facilities = room.facilities ?? [];
  const hidden = facilities.length - MAX_FACILITIES;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-transform hover:-translate-y-1">
      <RoomImage room={room} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold tracking-wide text-slate-500">{room.room_code}</span>
        <h3 className="text-lg font-semibold text-slate-900">{room.room_name}</h3>

        <div className="flex flex-wrap gap-x-3 text-sm text-slate-500">
          <span>{room.building}</span>
          <span>Lantai {room.floor}</span>
          <span>{room.capacity} orang</span>
        </div>

        <div>
          <StatusBadge status={room.status} />
        </div>

        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {facilities.slice(0, MAX_FACILITIES).map((facility) => (
              <span key={facility.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {facility.name}
              </span>
            ))}
            {hidden > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">+{hidden}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          <Link href={`/rooms/${room.id}`} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            Lihat Detail
          </Link>
        </div>
      </div>
    </article>
  );
}