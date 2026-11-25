import type { Metadata } from "next";

import PageContainer from "@/components/layout/PageContainer";
import RoomCatalog from "@/features/rooms/RoomCatalog";

export const metadata: Metadata = {
  title: "Katalog Ruangan",
};

export default function RoomsPage() {
  return (
    <PageContainer>
      <RoomCatalog />
    </PageContainer>
  );
}