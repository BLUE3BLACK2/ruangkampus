import api from "./api";
import type {
  Facility,
  PaginatedResponse,
  Room,
  RoomStatus,
} from "@/types";

export interface RoomQuery {
  search?: string;
  status?: RoomStatus;
  min_capacity?: number;
  per_page?: number;
  page?: number;
}

export const roomService = {
  async getRooms(params: RoomQuery = {}): Promise<PaginatedResponse<Room>> {
    const response = await api.get("/rooms", { params });

    return response.data;
  },

  async getRoom(id: string | number): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);

    // Laravel Resource dapat membungkus data dalam properti data.
    return response.data.data ?? response.data;
  },

  async getFacilities(): Promise<Facility[]> {
    const response = await api.get("/facilities");

    return response.data.data ?? [];
  },
};