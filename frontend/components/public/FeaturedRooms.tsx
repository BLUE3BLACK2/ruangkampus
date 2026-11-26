
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

interface Facility {
  id: number;
  name: string;
}

interface Room {
  id: number;
  room_code: string;
  room_name: string;
  building: string;
  floor: number | null;
  capacity: number;
  image: string | null;
  status: "available" | "maintenance" | "inactive";
  facilities: Facility[];
}

export default function FeaturedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get("/rooms", {
          params: {
            per_page: 3,
          },
        });

        setRooms(response.data.data.slice(0, 3));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Room Catalog
            </span>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Jelajahi Ruangan Kampus
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Temukan ruangan yang sesuai dengan kebutuhan kegiatan,
              kapasitas, dan fasilitas yang tersedia.
            </p>
          </div>

          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Lihat semua ruangan
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-52 bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-100" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">
              Gagal memuat data ruangan.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && rooms.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <p className="font-semibold text-slate-700">
              Belum ada ruangan tersedia.
            </p>
          </div>
        )}

        {/* Room Cards */}
        {!loading && !error && rooms.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  {room.image ? (
                    <img
                      src={room.image}
                      alt={room.room_name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-12 w-12"
                      >
                        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                        <path d="M9 21v-6h6v6" />
                      </svg>
                      <span className="mt-2 text-sm">
                        Foto Ruangan
                      </span>
                    </div>
                  )}

                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                      room.status === "available"
                        ? "bg-green-50 text-green-700"
                        : room.status === "maintenance"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {room.status === "available"
                      ? "Tersedia"
                      : room.status === "maintenance"
                        ? "Maintenance"
                        : "Tidak Aktif"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-xs font-semibold text-blue-600">
                    {room.room_code}
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {room.room_name}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-blue-600"
                      >
                        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                      </svg>
                      {room.building}
                    </span>

                    <span className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-blue-600"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {room.capacity} orang
                    </span>
                  </div>

                  {room.facilities?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {room.facilities.slice(0, 3).map((facility) => (
                        <span
                          key={facility.id}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
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
      </div>
    </section>
  );
}
