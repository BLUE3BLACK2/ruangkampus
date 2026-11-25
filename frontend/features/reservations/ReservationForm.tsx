"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import FormField from "@/components/ui/FormField";
import InfoGrid from "@/components/ui/InfoGrid";
import Notice from "@/components/ui/Notice";
import StateMessage from "@/components/ui/StateMessage";

import {
  backLinkClass,
  buttonClass,
  inputClass,
  panelClass,
  titleClass,
} from "@/components/ui/styles";

import { useRoomDetail } from "@/features/rooms/useRooms";
import type { Room } from "@/types";
import { useCreateReservation } from "./useReservations";

const initialValues = {
  reservation_date: "",
  start_time: "",
  end_time: "",
  participant_count: "",
  purpose: "",
};

function ReservationFormBody({ room }: { room: Room }) {

  const [values, setValues] = useState(initialValues);
  const [clientError, setClientError] = useState("");

  const {
    submit,
    submitting,
    error,
    fieldErrors,
  } = useCreateReservation();

  const today = new Date().toLocaleDateString("sv-SE");

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError("");

    const participants = Number(values.participant_count);

    if (!values.reservation_date) {
      setClientError("Tanggal reservasi wajib diisi.");
      return;
    }

    if (values.reservation_date < today) {
      setClientError("Tanggal reservasi tidak boleh sudah lewat.");
      return;
    }

    if (values.end_time <= values.start_time) {
      setClientError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    if (participants < 1 || !Number.isInteger(participants)) {
      setClientError("Jumlah peserta harus berupa bilangan bulat minimal 1.");
      return;
    }

    if (participants > room.capacity) {
      setClientError(
        `Jumlah peserta melebihi kapasitas ruangan (${room.capacity} orang).`
      );
      return;
    }

    if (!values.purpose.trim()) {
      setClientError("Tujuan penggunaan wajib diisi.");
      return;
    }

    await submit({
      room_id: room.id,
      reservation_date: values.reservation_date,
      start_time: values.start_time,
      end_time: values.end_time,
      purpose: values.purpose.trim(),
      participant_count: participants,
    });
  }

  return (
    <section className={`${panelClass} mx-auto max-w-2xl`}>
      <Link href={`/rooms/${room.id}`} className={backLinkClass}>
        ← Kembali ke detail ruangan
      </Link>

      <h1 className={titleClass}>Ajukan Reservasi</h1>

      <InfoGrid
        items={[
          { label: "Ruangan", value: room.room_name },
          {
            label: "Gedung / Lantai",
            value: `${room.building}, Lt. ${room.floor}`,
          },
          {
            label: "Kapasitas",
            value: `${room.capacity} orang`,
          },
        ]}
      />

      {(clientError || error) && (
        <Notice type="error">{clientError || error}</Notice>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <FormField
          label="Tanggal"
          name="reservation_date"
          type="date"
          min={today}
          value={values.reservation_date}
          onChange={handleChange}
          error={fieldErrors.reservation_date}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Jam mulai"
            name="start_time"
            type="time"
            value={values.start_time}
            onChange={handleChange}
            error={fieldErrors.start_time}
            required
          />

          <FormField
            label="Jam selesai"
            name="end_time"
            type="time"
            value={values.end_time}
            onChange={handleChange}
            error={fieldErrors.end_time}
            required
          />
        </div>

        <FormField
          label="Jumlah peserta"
          name="participant_count"
          type="number"
          min={1}
          max={room.capacity}
          value={values.participant_count}
          onChange={handleChange}
          error={fieldErrors.participant_count}
          required
        />

        <div className="mb-4 flex flex-col gap-1.5">
          <label
            htmlFor="purpose"
            className="text-sm font-semibold text-slate-700"
          >
            Tujuan penggunaan
          </label>

          <textarea
            id="purpose"
            name="purpose"
            value={values.purpose}
            onChange={handleChange}
            maxLength={1000}
            aria-invalid={Boolean(fieldErrors.purpose)}
            placeholder="Contoh: Rapat himpunan, kelas pengganti, diskusi kelompok"
            className={`${inputClass} min-h-[7rem] resize-y`}
            required
          />

          {fieldErrors.purpose && (
            <p className="text-sm text-red-600">
              {fieldErrors.purpose}
            </p>
          )}
        </div>

        <button
          type="submit"
          className={buttonClass({ block: true })}
          disabled={submitting}
        >
          {submitting ? "Mengirim pengajuan..." : "Kirim Pengajuan"}
        </button>
      </form>
    </section>
  );
}

export default function ReservationForm() {
  const { id } = useParams<{ id: string }>();

  const {
    data: room,
    loading,
    error,
    reload,
  } = useRoomDetail(id);

  if (loading) {
    return (
      <StateMessage
        variant="loading"
        text="Memuat data ruangan..."
      />
    );
  }

  if (error || !room) {
    return (
      <StateMessage
        variant="error"
        text={error || "Ruangan tidak ditemukan."}
        onRetry={reload}
      />
    );
  }

  if (room.status !== "available") {
    return (
      <StateMessage
        variant="empty"
        text="Ruangan ini sedang tidak tersedia untuk reservasi."
      >
        <Link
          href="/rooms"
          className={buttonClass({
            variant: "outline",
            size: "sm",
          })}
        >
          Pilih ruangan lain
        </Link>
      </StateMessage>
    );
  }

  return <ReservationFormBody room={room} />;
}