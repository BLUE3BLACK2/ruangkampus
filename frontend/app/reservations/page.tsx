import type { Metadata } from "next";

import PageContainer from "@/components/layout/PageContainer";
import AuthRequired from "@/components/auth/AuthRequired";
import ReservationHistory from "@/features/reservations/ReservationHistory";

export const metadata: Metadata = {
  title: "Riwayat Reservasi",
};

export default function ReservationsPage() {
  return (
    <AuthRequired>
      <PageContainer>
        <ReservationHistory />
      </PageContainer>
    </AuthRequired>
  );
}