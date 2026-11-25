"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";

import api from "@/services/api";
import { buttonClass, inputClass } from "@/components/ui/styles";

type AssistantResult = unknown;

function getMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Asisten AI tidak dapat dihubungi."
    );
  }

  return "Terjadi kesalahan.";
}

export default function RoomAssistant() {
  const [mode, setMode] = useState<"ask" | "recommend">("ask");

  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [participants, setParticipants] = useState("1");
  const [facilityIds, setFacilityIds] = useState("");

  const [result, setResult] = useState<AssistantResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;

      if (mode === "ask") {
        response = await api.post("/room-assistant/ask", {
          message: message.trim(),
        });
      } else {
        if (endTime <= startTime) {
          setError("Jam selesai harus lebih besar dari jam mulai.");
          setLoading(false);
          return;
        }

        const facilities = facilityIds
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isInteger(item) && item > 0);

        response = await api.post(
          "/room-assistant/recommendations",
          {
            reservation_date: date,
            start_time: startTime,
            end_time: endTime,
            participant_count: Number(participants),
            facilities,
          }
        );
      }

      setResult(response.data.data);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Asisten RuangKuliah
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Butuh bantuan mencari ruangan?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tanyakan kebutuhan ruangan atau dapatkan rekomendasi
          berdasarkan tanggal, waktu, kapasitas, dan fasilitas.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass({
            variant: mode === "ask" ? "primary" : "ghost",
            size: "sm",
          })}
          onClick={() => {
            setMode("ask");
            setError("");
            setResult(null);
          }}
        >
          Tanya Asisten
        </button>

        <button
          type="button"
          className={buttonClass({
            variant: mode === "recommend" ? "primary" : "ghost",
            size: "sm",
          })}
          onClick={() => {
            setMode("recommend");
            setError("");
            setResult(null);
          }}
        >
          Rekomendasi Ruangan
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {mode === "ask" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Apa kebutuhan ruanganmu?
            </label>

            <textarea
              className={`${inputClass} min-h-28`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1500}
              placeholder="Contoh: Saya membutuhkan ruangan untuk diskusi 20 orang."
              required
            />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tanggal reservasi
              </label>
              <input
                className={inputClass}
                type="date"
                min={new Date().toLocaleDateString("sv-SE")}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Jam mulai
                </label>
                <input
                  className={inputClass}
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Jam selesai
                </label>
                <input
                  className={inputClass}
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Jumlah peserta
              </label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={1000}
                value={participants}
                onChange={(event) => setParticipants(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                ID fasilitas (opsional)
              </label>
              <input
                className={inputClass}
                value={facilityIds}
                onChange={(event) => setFacilityIds(event.target.value)}
                placeholder="Contoh: 1, 2, 3"
              />
              <p className="mt-1 text-xs text-slate-500">
                Isi dengan ID fasilitas dari database, pisahkan
                menggunakan koma.
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass({ block: true })}
        >
          {loading ? "Memproses..." : "Kirim"}
        </button>
      </form>

      {result !== null && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold text-slate-900">
            Hasil dari Asisten
          </h3>

          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-xs leading-6 text-green-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}