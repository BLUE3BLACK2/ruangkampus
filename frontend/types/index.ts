export type UserRole = "admin" | "mahasiswa" | "dosen";

export type RoomStatus =
  | "available"
  | "maintenance"
  | "inactive";

export type ReservationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  nim: string | null;
  nip: string | null;
}

export interface Facility {
  id: number;
  name: string;
  description: string | null;
  rooms_count?: number;
  rooms?: Room[];
  created_at?: string;
}

export interface Room {
  id: number;
  room_code: string;
  room_name: string;
  building: string;
  floor: number;
  capacity: number;
  description: string | null;
  image: string | null;
  status: RoomStatus;
  facilities: Facility[];
  created_at?: string;
}

export interface ReservationLog {
  previous_status: ReservationStatus | null;
  new_status: ReservationStatus;
  notes: string | null;
  admin_id: number | null;
  created_at: string;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  user_id: number;
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participant_count: number;
  status: ReservationStatus;
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  room?: Room;
  user?: User;
  logs?: ReservationLog[];
  created_at: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}