
import type {
  ReservationStatus,
  RoomStatus,
} from '@/types';

type Status = ReservationStatus | RoomStatus;

export const STATUS_LABEL: Record<Status, string> = {
  available: 'Tersedia',
  maintenance: 'Pemeliharaan',
  inactive: 'Tidak Aktif',
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function roomImageUrl(
  image: string | null | undefined
): string | null {
  if (!image) return null;

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ?.replace(/\/api\/?$/, '');

  return baseUrl
    ? `${baseUrl}/storage/${image.replace(/^\/+/, '')}`
    : image;
}
