
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog Ruangan",
  description:
    "Jelajahi katalog ruangan kampus RuangKuliah. Temukan ruang yang sesuai dengan kebutuhan kegiatan, kapasitas, jadwal, dan fasilitas.",
  keywords: [
    "reservasi ruangan kampus",
    "katalog ruangan",
    "ruangan kampus",
    "RuangKuliah",
    "booking ruang kampus",
  ],
  openGraph: {
    title: "Katalog Ruangan | RuangKuliah",
    description:
      "Temukan ruangan kampus yang sesuai dengan kebutuhan kegiatanmu melalui RuangKuliah.",
    type: "website",
  },
};

export default function RoomsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
