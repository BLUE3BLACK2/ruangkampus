
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Ruangan",
  description:
    "Lihat informasi detail ruangan kampus, fasilitas, kapasitas, dan jadwal reservasi melalui RuangKuliah.",
  keywords: [
    "detail ruangan kampus",
    "reservasi ruangan kampus",
    "fasilitas ruangan",
    "RuangKuliah",
  ],
  openGraph: {
    title: "Detail Ruangan | RuangKuliah",
    description:
      "Lihat informasi detail ruangan kampus, fasilitas, kapasitas, dan jadwal reservasi melalui RuangKuliah.",
    type: "website",
  },
};

export default function RoomDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
