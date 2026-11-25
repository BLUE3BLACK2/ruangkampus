import type { Metadata } from "next";

import PageContainer from "@/components/layout/PageContainer";
import AuthRequired from "@/components/auth/AuthRequired";
import ReservationForm from "@/features/reservations/ReservationForm";

export const metadata: Metadata = {
  title: "Ajukan Reservasi",
};

export default function ReserveRoomPage() {
  return (
    <AuthRequired>
      <PageContainer>
        <ReservationForm />
      </PageContainer>
    </AuthRequired>
  );
}