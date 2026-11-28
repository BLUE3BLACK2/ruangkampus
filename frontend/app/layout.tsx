
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "RuangKuliah | Reservasi Ruangan Kampus",
    template: "%s | RuangKuliah",
  },

  description:
    "RuangKuliah adalah platform reservasi ruangan kampus yang memudahkan mahasiswa dan dosen mencari serta memesan ruangan.",

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    title: "RuangKuliah | Reservasi Ruangan Kampus",
    description:
      "Platform reservasi ruangan kampus yang memudahkan mahasiswa dan dosen mencari serta memesan ruangan.",
    siteName: "RuangKuliah",
    type: "website",
    locale: "id_ID",
    images: ["/opengraph-image.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "RuangKuliah | Reservasi Ruangan Kampus",
    description:
      "Platform reservasi ruangan kampus untuk mahasiswa dan dosen.",
    images: ["/opengraph-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "RuangKuliah",
      url: siteUrl,
      description:
        "Platform reservasi ruangan kampus yang memudahkan mahasiswa dan dosen mencari serta memesan ruangan.",
    },
    {
      "@type": "Organization",
      name: "RuangKuliah",
      url: siteUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
