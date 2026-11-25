import { roomImageUrl } from '@/utils/format';
import type { Room } from '@/types';

export default function RoomImage({ room, className = '' }: { room: Room; className?: string }) {
  const image = roomImageUrl(room.image);

  if (!image) {
    return (
      <div className={`grid aspect-video w-full place-items-center bg-blue-50 text-2xl font-bold text-blue-600 ${className}`}>
        {room.room_code}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={room.room_name}
      loading="lazy"
      className={`aspect-video w-full bg-slate-200 object-cover ${className}`}
    />
  );
}