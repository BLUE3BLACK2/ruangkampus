
"use client";

import { useCallback, useEffect, useState } from "react";
import { roomService, type RoomQuery } from "@/services/roomService";
import type { Room } from "@/types";

export function useRoomList(params: RoomQuery = {}) {
  const {
    search,
    status,
    min_capacity,
    per_page,
    page,
  } = params;

  const [data, setData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await roomService.getRooms({
        search,
        status,
        min_capacity,
        per_page,
        page,
      });

      setData(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar ruangan."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, min_capacity, per_page, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}

export function useRoomDetail(id: string | number) {
  const [data, setData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError("ID ruangan tidak valid.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const room = await roomService.getRoom(id);
      setData(room);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat detail ruangan."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
