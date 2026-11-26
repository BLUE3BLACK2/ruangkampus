
"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";
import api from "@/services/api";

interface Facility {
  id: number;
  name: string;
  description?: string;
}

interface Room {
  id: number;
  room_code: string;
  room_name: string;
  building: string;
  floor: number | null;
  capacity: number;
  description: string | null;
  image: string | null;
  status: "available" | "maintenance" | "inactive";
  facilities: Facility[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("");
  const [facilityId, setFacilityId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRooms = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {
        page,
        per_page: 9,
      };

      if (search.trim()) params.search = search.trim();
      if (capacity) params.min_capacity = capacity;
      if (status) params.status = status;

      const response = await api.get("/rooms", { params });

      setRooms(response.data.data);
      setPagination({
        current_page: response.data.meta.current_page,
        last_page: response.data.meta.last_page,
        total: response.data.meta.total,
      });
    } catch {
      setError("Gagal memuat data ruangan. Pastikan server Laravel berjalan.");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [search, capacity, status]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get("/facilities", {
          params: { per_page: 100 },
        });

        setFacilities(response.data.data);
      } catch {
        console.error("Gagal mengambil data fasilitas.");
      }
    };

    fetchFacilities();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRooms(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchRooms, facilityId]);

  const filteredRooms = rooms.filter((room) => {
    if (!facilityId) return true;

    return room.facilities?.some(
      (facility) => facility.id === Number(facilityId)
    );
  });

  const resetFilters = () => {
    setSearch("");
    setCapacity("");
    setStatus("");
    setFacilityId("");
  };

  const statusLabel = (roomStatus: Room["status"]) => {
    if (roomStatus === "available") return "Tersedia";
    if (roomStatus === "maintenance") return "Maintenance";
    return "Tidak Aktif";
  };

  return (
    <PublicLayout>
      <section className="bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <span className="text-sm font-semibold text-blue-600">
              KATALOG RUANGAN
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Temukan Ruangan yang Tepat
            </h1>

            <p className="mt-3 max-w-2xl text-slate-500">
              Jelajahi ruangan kampus dan temukan ruang yang sesuai
              dengan kebutuhan kegiatanmu.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cari Ruangan
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama, kode, atau gedung..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-black placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Kapasitas Minimum
                </label>

                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Semua Kapasitas</option>
                  <option value="10">10 Orang</option>
                  <option value="20">20 Orang</option>
                  <option value="30">30 Orang</option>
                  <option value="50">50 Orang</option>
                  <option value="100">100 Orang</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="available">Tersedia</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>

              {/* Facility */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fasilitas
                </label>

                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Semua Fasilitas</option>

                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Daftar Ruangan
            </h2>

            <p className="text-sm text-slate-500">
              {pagination.total} ruangan ditemukan
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center text-slate-500">
              Memuat data ruangan...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              {error}
              <button
                onClick={() => fetchRooms(pagination.current_page)}
                className="ml-2 font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredRooms.length === 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white py-20 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Ruangan tidak ditemukan
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Coba ubah pencarian atau filter yang digunakan.
              </p>
            </div>
          )}

          {/* Room cards */}
          {!loading && !error && filteredRooms.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="flex h-48 items-center justify-center bg-slate-100">
                    {room.image ? (
                      <img
                        src={room.image}
                        alt={room.room_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <svg
                          className="mx-auto h-12 w-12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                          <path d="M9 21v-6h6v6" />
                        </svg>
                        <p className="mt-2 text-sm">Foto Ruangan</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-blue-600">
                          {room.room_code}
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          {room.room_name}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          room.status === "available"
                            ? "bg-green-50 text-green-700"
                            : room.status === "maintenance"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabel(room.status)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <p>
                        <span className="font-medium text-slate-700">
                          Gedung:
                        </span>{" "}
                        {room.building}
                      </p>

                      <p>
                        <span className="font-medium text-slate-700">
                          Lantai:
                        </span>{" "}
                        {room.floor ?? "-"}
                      </p>

                      <p>
                        <span className="font-medium text-slate-700">
                          Kapasitas:
                        </span>{" "}
                        {room.capacity} orang
                      </p>
                    </div>

                    {room.facilities?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {room.facilities.slice(0, 3).map((facility) => (
                          <span
                            key={facility.id}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                          >
                            {facility.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/rooms/${room.id}`}
                      className="mt-5 block rounded-xl border border-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.last_page > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => fetchRooms(pagination.current_page - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sebelumnya
              </button>

              <span className="text-sm text-slate-500">
                Halaman {pagination.current_page} dari {pagination.last_page}
              </span>

              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchRooms(pagination.current_page + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
