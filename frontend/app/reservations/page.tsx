
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicLayout from "@/components/public/PublicLayout";
import api from "@/services/api";

interface Room {
  room_code: string;
  room_name: string;
  building: string;
}

interface Reservation {
  id: number;
  reservation_code: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participant_count: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  admin_notes: string | null;
  room?: Room;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

  const fetchReservations = async () => {
    try {
      const response = await api.get("/reservations");
      setReservations(response.data.data || []);
    } catch (err: any) {
      console.error("Reservation fetch error:", err.response?.data);
      setError(
        err.response?.data?.message ||
          "Gagal memuat data reservasi. Silakan login kembali."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: number) => {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin membatalkan reservasi ini?"
    );

    if (!confirmed) return;

    setCancelLoading(id);
    setError("");

    try {
      const response = await api.patch(`/reservations/${id}/cancel`);

      alert(response.data.message || "Reservasi berhasil dibatalkan.");

      await fetchReservations();
    } catch (err: any) {
      console.error("Cancel reservation error:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Reservasi gagal dibatalkan."
      );

      if (err.response?.data?.errors) {
        const firstError = Object.values(
          err.response.data.errors
        ).flat()[0];

        if (firstError) {
          setError(String(firstError));
        }
      }
    } finally {
      setCancelLoading(null);
    }
  };

  const statusLabel = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return "Menunggu Persetujuan";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const statusStyle = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <PublicLayout>
      <section className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Reservasi Saya
              </h1>

              <p className="mt-2 text-slate-500">
                Daftar pengajuan dan status reservasi ruangan Anda.
              </p>
            </div>

            <Link
              href="/rooms"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Cari Ruangan
            </Link>
          </div>

          {loading && (
            <div className="py-20 text-center text-slate-500">
              Memuat reservasi...
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && reservations.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Belum Ada Reservasi
              </h2>

              <p className="mt-3 text-slate-500">
                Anda belum mengajukan reservasi ruangan.
              </p>

              <Link
                href="/rooms"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Jelajahi Ruangan
              </Link>
            </div>
          )}

          {!loading && reservations.length > 0 && (
            <div className="mt-8 space-y-6">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          {reservation.reservation_code}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-slate-900">
                          {reservation.room?.room_name ||
                            "Ruangan tidak diketahui"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {reservation.room?.room_code || "-"} ·{" "}
                          {reservation.room?.building || "-"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(
                          reservation.status
                        )}`}
                      >
                        {statusLabel(reservation.status)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Tanggal Reservasi
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {formatDate(reservation.reservation_date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Waktu
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {reservation.start_time} -{" "}
                          {reservation.end_time}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Jumlah Peserta
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {reservation.participant_count} orang
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-medium text-slate-500">
                        Tujuan Reservasi
                      </p>

                      <p className="mt-2 leading-relaxed text-slate-700">
                        {reservation.purpose}
                      </p>
                    </div>

                    {reservation.admin_notes && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-800">
                          Catatan Admin
                        </p>

                        <p className="mt-2 text-sm text-amber-700">
                          {reservation.admin_notes}
                        </p>
                      </div>
                    )}

                    {(reservation.status === "pending" ||
                      reservation.status === "approved") && (
                      <div className="mt-6 border-t border-slate-200 pt-5">
                        <button
                          onClick={() =>
                            handleCancel(reservation.id)
                          }
                          disabled={cancelLoading === reservation.id}
                          className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelLoading === reservation.id
                            ? "Membatalkan..."
                            : "Batalkan Reservasi"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
