"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm print:hidden">
      <Link href="/dashboard" className="text-xl font-bold text-brand-navy hover:opacity-80 transition-opacity">
        Prelegal
      </Link>
    </header>
  );
}
