import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prelegal",
  description: "Draft legal agreements in minutes",
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
