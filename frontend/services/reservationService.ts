import api from "./api";
import type {
  ApiResponse,
  PaginatedResponse,
  Reservation,
  ReservationStatus,
} from "@/types";

export interface CreateReservationPayload {
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participant_count: number;
}

export const reservationService = {
  async getMyReservations(
    status?: ReservationStatus
  ): Promise<PaginatedResponse<Reservation>> {
    const response = await api.get("/reservations", {
      params: {
        status,
        per_page: 100,
      },
    });

    return response.data;
  },

  async getReservation(id: string | number): Promise<Reservation> {
    const response = await api.get<ApiResponse<Reservation>>(
      `/reservations/${id}`
    );

    return response.data.data;
  },

  async createReservation(
    payload: CreateReservationPayload
  ): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      "/reservations",
      payload
    );

    return response.data.data;
  },

  async cancelReservation(
    id: string | number
  ): Promise<Reservation> {
    const response = await api.patch<ApiResponse<Reservation>>(
      `/reservations/${id}/cancel`
    );

    return response.data.data;
  },
};