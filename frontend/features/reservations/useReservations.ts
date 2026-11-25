
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  reservationService,
  type CreateReservationPayload,
} from "@/services/reservationService";

import type { Reservation } from "@/types";

function getErrorMessage(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (
      err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message || "Terjadi kesalahan.";
  }

  return err instanceof Error
    ? err.message
    : "Terjadi kesalahan.";
}

export function useMyReservations() {
  const [data, setData] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await reservationService.getMyReservations();
      setData(response.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

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

export function useReservationDetail(id: string | number) {
  const [data, setData] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError("ID reservasi tidak valid.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reservation = await reservationService.getReservation(id);
      setData(reservation);
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err));
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

export function useCreateReservation() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  const submit = async (payload: CreateReservationPayload) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const reservation =
        await reservationService.createReservation(payload);

      router.push(`/reservations/${reservation.id}`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                errors?: Record<string, string[]>;
              };
            };
          }
        ).response;

        const errors = response?.data?.errors ?? {};
        const formattedErrors: Record<string, string> = {};

        Object.entries(errors).forEach(([key, messages]) => {
          if (messages.length > 0) {
            formattedErrors[key] = messages[0];
          }
        });

        setFieldErrors(formattedErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submit,
    submitting,
    error,
    fieldErrors,
  };
}

export function useCancelReservation(onSuccess?: () => void) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const cancel = async (id: string | number) => {
    setCancelling(true);
    setError("");

    try {
      await reservationService.cancelReservation(id);
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return {
    cancel,
    cancelling,
    error,
  };
}
