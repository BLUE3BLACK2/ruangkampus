
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

function RoomCarousel({
  rooms,
  reservationData,
}: {
  rooms: any[];
  reservationData: {
    date: string;
    start: string;
    end: string;
    participants: string;
    purpose: string;
  };
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  if (!rooms?.length) return null;

  const room = rooms[currentIndex];
  function handleReserve() {
    console.log("Data room AI:", room);
    console.log("Data reservasi:", reservationData);
    const query = new URLSearchParams({
      date: reservationData.date,
      start: reservationData.start,
      end: reservationData.end,
      participants: reservationData.participants,
      purpose: reservationData.purpose,
    });

    router.push(`/rooms/${room.room_id}?${query.toString()}`);
  }

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              {room.rank ? `Rekomendasi #${room.rank}` : "Ruangan"}
            </p>

            <h4 className="mt-1 text-base font-bold text-slate-900">
              {room.room_name}
            </h4>

            <p className="mt-1 text-xs text-slate-500">
              {room.room_code}
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-blue-700">
              {room.capacity}
            </p>
            <p className="text-[10px] text-blue-600">
              Kapasitas
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">
              Gedung:
            </span>{" "}
            {room.building || "-"}
          </p>

          <p>
            <span className="font-medium text-slate-700">
              Lantai:
            </span>{" "}
            {room.floor ?? "-"}
          </p>
        </div>

        {room.facilities?.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Fasilitas
            </p>

            <div className="flex flex-wrap gap-2">
              {room.facilities.map((facility: any) => (
                <span
                  key={facility.id}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  {facility.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {room.match_reasons?.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Alasan rekomendasi
            </p>

            <ul className="space-y-1">
              {room.match_reasons.map(
                (reason: string, reasonIndex: number) => (
                  <li
                    key={reasonIndex}
                    className="flex gap-2 text-xs leading-5 text-slate-600"
                  >
                    <span className="text-blue-600">✓</span>
                    <span>{reason}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleReserve}
        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Reservasi Ruangan Ini
      </button>

      {rooms.length > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {currentIndex + 1} dari {rooms.length} ruangan
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev === 0 ? rooms.length - 1 : prev - 1
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
              aria-label="Rekomendasi sebelumnya"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev === rooms.length - 1 ? 0 : prev + 1
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
              aria-label="Rekomendasi berikutnya"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeroSection() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { user, loading } = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!prompt.trim() || submitting) return;

    setError("");
    setResult(null);

    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "admin") {
      setError(
        "Fitur AI Assistant hanya tersedia untuk mahasiswa dan dosen."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/room-assistant/ask", {
        message: prompt.trim(),
      });

      setResult(response.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "AI Assistant sementara tidak tersedia. Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(time: string) {
    return time?.slice(0, 5) || "-";
  }

  function formatDate(date: string) {
    if (!date) return "-";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  function renderAlternativeTimes(alternatives: any[]) {
    if (!alternatives?.length) return null;

    return (
      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-800">
          Alternatif waktu yang lebih lengang
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Jadwal berikut memiliki permintaan historis lebih rendah
          dan telah diperiksa ketersediaan ruangannya.
        </p>

        <div className="mt-3 space-y-3">
          {alternatives.map((alternative: any, index: number) => (
            <div
              key={`${alternative.start_time}-${index}`}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-emerald-700">
                  {formatTime(alternative.start_time)} -{" "}
                  {formatTime(alternative.end_time)}
                </span>

                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {alternative.available_room_count} ruangan
                </span>
              </div>

              <RoomCarousel
                rooms={alternative.recommendations}
                reservationData={{
                  date: result.interpreted_request?.reservation_date || "",
                  start: alternative.start_time || "",
                  end: alternative.end_time || "",
                  participants: String(result.interpreted_request?.participant_count || ""),
                  purpose: prompt,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderResult() {
    if (!result) return null;

    const status = result.status;

    return (
      <div
        className={`mt-6 max-h-[420px] overflow-y-auto overscroll-contain rounded-2xl border p-4 ${
          status === "success"
            ? "border-blue-100 bg-blue-50/60"
            : status === "no_match"
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-600">
            ✦
          </span>

          <h3 className="text-sm font-bold text-slate-900">
            Hasil AI Assistant
          </h3>
        </div>

        {result.message && (
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {result.message}
          </p>
        )}

        {result.assistant_message && (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="text-sm leading-6 text-slate-600">
              {result.assistant_message}
            </p>
          </div>
        )}

        {result.interpreted_request && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-xs font-bold text-slate-800">
              Kebutuhan yang dipahami AI
            </p>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <span className="font-medium">Tanggal:</span>{" "}
                {formatDate(
                  result.interpreted_request.reservation_date
                )}
              </p>

              <p>
                <span className="font-medium">Waktu:</span>{" "}
                {formatTime(
                  result.interpreted_request.start_time
                )}{" "}
                -{" "}
                {formatTime(
                  result.interpreted_request.end_time
                )}
              </p>

              <p>
                <span className="font-medium">Peserta:</span>{" "}
                {result.interpreted_request.participant_count} orang
              </p>

              <div>
                <span className="font-medium">Fasilitas:</span>

                {result.interpreted_request.facilities?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.interpreted_request.facilities.map(
                      (facility: string, index: number) => (
                        <span
                          key={index}
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700"
                        >
                          {facility}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <span> Tidak ada fasilitas khusus</span>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "needs_clarification" && (
          <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-6 text-slate-600">
            {result.missing_fields && (
              <p>
                Silakan lengkapi informasi{" "}
                {Object.values(result.missing_fields).join(", ")}.
              </p>
            )}

            {result.unknown_facilities?.length > 0 && (
              <>
                <p>
                  Fasilitas yang belum ditemukan:{" "}
                  {result.unknown_facilities.join(", ")}
                </p>

                {result.available_facilities?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-slate-700">
                      Fasilitas yang tersedia:
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.available_facilities.map(
                        (facility: string, index: number) => (
                          <span
                            key={index}
                            className="rounded-lg bg-slate-100 px-2.5 py-1"
                          >
                            {facility}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {status === "invalid_request" && (
          <p className="mt-3 text-xs leading-5 text-amber-700">
            Periksa kembali tanggal dan waktu peminjaman yang kamu masukkan.
          </p>
        )}

        {status === "success" &&
          result.recommendations?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-bold text-slate-800">
                Ruangan yang direkomendasikan
              </h4>

              <RoomCarousel
                rooms={result.recommendations}
                reservationData={{
                  date: result.interpreted_request?.reservation_date || "",
                  start: result.interpreted_request?.start_time || "",
                  end: result.interpreted_request?.end_time || "",
                  participants: String(result.interpreted_request?.participant_count || ""),
                  purpose: prompt,
                }}
              />
            </div>
          )}

        {status === "no_match" && (
          <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
            Tidak ada ruangan yang cocok untuk jadwal tersebut.
            Kamu bisa mencoba mengubah jumlah peserta, fasilitas,
            atau waktu kegiatan.
          </div>
        )}

        {renderAlternativeTimes(result.alternative_times)}
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-slate-100/70 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {/* Main Grid */}
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-16">

          {/* Left Content */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Smart Campus Reservation
              </span>
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Ruang yang tepat,
              <span className="mt-2 block text-blue-600">
                untuk ide hebat.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
              Temukan dan reservasi ruang kampus dengan lebih mudah.
              Mulai dari rapat, kegiatan organisasi, hingga pembelajaran,
              semua dalam satu platform.
            </p>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              {[
                "Temukan ruangan sesuai kebutuhan",
                "Informasi fasilitas dan kapasitas",
                "Reservasi ruangan secara praktis",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Info */}
            <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-100 pt-7">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  <span className="text-blue-600">Smart</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  AI room assistant
                </p>
              </div>

              <div className="border-l border-slate-200 pl-8">
                <p className="text-2xl font-bold text-slate-900">
                  <span className="text-blue-600">Easy</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Reservasi praktis
                </p>
              </div>

              <div className="border-l border-slate-200 pl-8">
                <p className="text-2xl font-bold text-slate-900">
                  <span className="text-blue-600">Campus</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Terintegrasi
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - AI Assistant */}
          <div className="relative mx-auto w-full max-w-xl">
            {/* Decorative element */}
            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-3xl bg-blue-100/70" />
            <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-3xl bg-slate-100" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
              {/* Card Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-7 w-7"
                    >
                      <path d="M12 3v3" />
                      <path d="M8 6h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Z" />
                      <path d="M9 12h.01" />
                      <path d="M15 12h.01" />
                      <path d="M9 16h6" />
                    </svg>
                  </div>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-blue-100">
                      RuangKuliah AI
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      AI Room Assistant
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-blue-100">
                  Bingung memilih ruangan? Ceritakan kebutuhanmu,
                  dan temukan ruangan yang paling sesuai.
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8">
                <div className="mb-5">
                  <label
                    htmlFor="ai-prompt"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Apa yang kamu butuhkan?
                  </label>

                  <p className="mt-1 text-sm text-slate-500">
                    Masukkan kebutuhan kegiatanmu di bawah ini.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <textarea
                    id="ai-prompt"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setResult(null);
                      setError("");
                    }}
                    placeholder="Contoh: Saya membutuhkan ruangan untuk 30 orang, hari Jumat pukul 10.00, dengan proyektor dan AC..."
                    rows={5}
                    maxLength={1500}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 shrink-0 text-blue-600"
                    >
                      <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>

                    <span>
                      Rekomendasi berdasarkan kebutuhan kegiatanmu
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!prompt.trim() || submitting}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span>
                      {submitting
                        ? "Sedang mencari ruangan..."
                        : "Cari Ruangan dengan AI"}
                    </span>

                    {submitting ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="opacity-25"
                        />
                        <path
                          d="M4 12a8 8 0 0 1 8-8"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </form>

                {/* Error */}
                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* AI Results */}
                {renderResult()}

                {/* Suggestion */}
                <div className="mt-6 rounded-2xl bg-blue-50/70 p-4">
                  <p className="text-xs font-semibold text-blue-700">
                    <span className="mr-2">✦</span>
                    Tips pencarian
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    Sebutkan jumlah peserta, waktu kegiatan,
                    serta fasilitas yang dibutuhkan agar rekomendasi
                    lebih sesuai.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
