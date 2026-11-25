import { STATUS_LABEL } from '@/utils/format';
import type { ReservationStatus, RoomStatus } from '@/types';

type Status = ReservationStatus | RoomStatus;

const styles: Record<Status, string> = {
  available: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}