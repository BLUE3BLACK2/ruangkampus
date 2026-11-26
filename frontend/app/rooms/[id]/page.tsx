
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function RoomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [participantCount, setParticipantCount] = useState("1");

  const [submitting, setSubmitting] = useState(false);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${id}`);
        setRoom(response.data.data);
      } catch (err) {
        console.error("Detail room error:", err);
        setError("Ruangan tidak ditemukan atau gagal dimuat.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const statusLabel = (status: Room["status"]) => {
    if (status === "available") return "Tersedia";
    if (status === "maintenance") return "Maintenance";
    return "Tidak Aktif";
  };

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setReservationMessage("");
    setReservationError("");

    if (!room) return;

    const participantNumber = Number(participantCount);

    if (!participantCount || participantNumber < 1) {
      setReservationError("Jumlah peserta minimal 1 orang.");
      return;
    }

    if (participantNumber > room.capacity) {
      setReservationError(
        `Jumlah peserta melebihi kapasitas ruangan (${room.capacity} orang).`
      );
      return;
    }

    if (startTime >= endTime) {
      setReservationError("Jam selesai harus setelah jam mulai.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/reservations", {
        room_id: room.id,
        reservation_date: reservationDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose,
        participant_count: participantNumber,
      });

      setReservationMessage(
        response.data.message || "Reservasi berhasil diajukan."
      );

      setReservationDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      setParticipantCount("1");
    } catch (err: any) {
      console.log("Reservation error:", err.response?.data);

      const data = err.response?.data;
      const errors = data?.errors;

      if (errors && typeof errors === "object") {
        const firstError = Object.values(errors).flat()[0];

        setReservationError(
          firstError ? String(firstError) : "Validasi reservasi gagal."
        );
      } else {
        setReservationError(
          data?.message ||
            "Reservasi gagal diajukan. Periksa koneksi dan login."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <Link
            href="/rooms"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Katalog
          </Link>

          {loading && (
            <div className="py-20 text-center text-slate-500">
              Memuat detail ruangan...
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
              {error}
            </div>
          )}

          {!loading && room && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-72 items-center justify-center bg-slate-100 md:h-96">
                {room.image ? (
                  <img
                    src={room.image}
                    alt={room.room_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <svg
                      className="mx-auto h-16 w-16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                      <path d="M9 21v-6h6v6" />
                    </svg>
                    <p className="mt-3">Foto Ruangan</p>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-blue-600">
                      {room.room_code}
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                      {room.room_name}
                    </h1>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
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

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Gedung</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {room.building}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Lantai</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {room.floor ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Kapasitas</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {room.capacity} orang
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900">
                    Deskripsi Ruangan
                  </h2>

                  <p className="mt-3 leading-relaxed text-slate-600">
                    {room.description || "Belum ada deskripsi ruangan."}
                  </p>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900">
                    Fasilitas
                  </h2>

                  {room.facilities?.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {room.facilities.map((facility) => (
                        <span
                          key={facility.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                        >
                          {facility.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-slate-500">
                      Belum ada fasilitas yang terdaftar.
                    </p>
                  )}
                </div>

                {/* Form Reservasi */}
                <div className="mt-10 border-t border-slate-200 pt-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ajukan Reservasi
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Lengkapi formulir berikut untuk mengajukan pemesanan
                    ruangan.
                  </p>

                  {room.status === "available" ? (
                    <form
                      onSubmit={handleReservation}
                      className="mt-6 space-y-5"
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tanggal Reservasi
                        </label>
                        <input
                          type="date"
                          required
                          min={getToday()}
                          value={reservationDate}
                          onClick={(e) => e.currentTarget.showPicker()}
                          onChange={(e) => setReservationDate(e.target.value)}
                          className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Jam Mulai
                          </label>
                          <input
                            type="time"
                            required
                            value={startTime}
                            onClick={(e) => e.currentTarget.showPicker()}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Jam Selesai
                          </label>
                          <input
                            type="time"
                            required
                            value={endTime}
                            onClick={(e) => e.currentTarget.showPicker()}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Jumlah Peserta
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={room.capacity}
                          value={participantCount}
                          onChange={(e) => setParticipantCount(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Maksimal {room.capacity} orang.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tujuan Reservasi
                        </label>
                        <textarea
                          required
                          maxLength={1000}
                          rows={4}
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Contoh: Rapat organisasi, seminar, kegiatan akademik..."
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {reservationError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                          {reservationError}
                        </div>
                      )}

                      {reservationMessage && (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                          <p>{reservationMessage}</p>
                          <button
                            type="button"
                            onClick={() => router.push("/reservations")}
                            className="mt-3 font-semibold underline"
                          >
                            Lihat Reservasi Saya
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {submitting
                          ? "Mengirim Pengajuan..."
                          : "Ajukan Reservasi"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-700">
                      Ruangan ini sedang tidak tersedia untuk reservasi.
                    </div>
                  )}
                </div>

                <div className="mt-10 border-t border-slate-200 pt-6">
                  <Link
                    href="/rooms"
                    className="inline-block rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Kembali ke Katalog
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

export default function RoomDetailPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center">Memuat halaman...</div>}
    >
      <RoomDetailContent />
    </Suspense>
  );
}
