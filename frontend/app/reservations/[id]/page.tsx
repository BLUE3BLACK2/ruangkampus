import type { Metadata } from "next";

import PageContainer from "@/components/layout/PageContainer";
import AuthRequired from "@/components/auth/AuthRequired";
import ReservationDetail from "@/features/reservations/ReservationDetail";

export const metadata: Metadata = {
  title: "Detail Reservasi",
};

export default function ReservationDetailPage() {
  return (
    <AuthRequired>
      <PageContainer>
        <ReservationDetail />
      </PageContainer>
    </AuthRequired>
  );
}