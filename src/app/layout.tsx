import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-sans.woff2",
  variable: "--font-manrope",
});

const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Vison Admin",
  description: "Platform command center untuk operasional Vison.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
