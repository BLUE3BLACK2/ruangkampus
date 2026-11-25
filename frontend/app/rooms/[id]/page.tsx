import type { Metadata } from "next";

import PageContainer from "@/components/layout/PageContainer";
import RoomDetail from "@/features/rooms/RoomDetail";

export const metadata: Metadata = {
  title: "Detail Ruangan",
};

export default function RoomDetailPage() {
  return (
    <PageContainer>
      <RoomDetail />
    </PageContainer>
  );
}