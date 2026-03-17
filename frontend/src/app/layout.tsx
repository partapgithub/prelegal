import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mutual NDA Creator — Prelegal",
  description: "Generate a Mutual Non-Disclosure Agreement from CommonPaper templates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* I7: font variable applied to html so Tailwind's font-sans picks it up via globals.css */}
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
