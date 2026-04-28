import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "MANGIA — Read Manga Online",
    template: "%s | MANGIA",
  },
  description:
    "MANGIA is your ultimate manga reading platform. Discover thousands of manga titles in Arabic and English. Read free chapters or go premium for unlimited access.",
  keywords: ["manga", "read manga", "manga online", "webtoon", "مانغا", "قراءة مانغا"],
  authors: [{ name: "MANGIA" }],
  creator: "MANGIA",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "MANGIA",
    title: "MANGIA — Read Manga Online",
    description: "Your ultimate manga reading platform in Arabic and English.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MANGIA — Read Manga Online",
    description: "Your ultimate manga reading platform in Arabic and English.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#111111",
                color: "#E5E5E5",
                border: "1px solid #1A1A1A",
              },
              success: {
                iconTheme: { primary: "#01FF48", secondary: "#111111" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
