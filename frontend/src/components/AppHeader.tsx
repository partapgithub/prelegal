"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm print:hidden">
      <Link
        href="/dashboard"
        className="text-xl font-bold text-brand-navy hover:opacity-80 transition-opacity"
      >
        Prelegal
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-gray hidden sm:block">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
