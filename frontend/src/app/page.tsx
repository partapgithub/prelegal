"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = mode === "signup";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy">Prelegal</h1>
          <p className="text-brand-gray mt-1">Draft legal agreements in minutes</p>
        </div>

        {/* Mode heading */}
        <h2 className="text-lg font-semibold text-brand-navy mb-6">
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </h2>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="••••••••"
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-brand-gray">Minimum 8 characters</p>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-purple hover:bg-[#5e2d73] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 mt-2 transition-colors cursor-pointer"
          >
            {loading ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-gray">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={toggleMode}
            className="text-brand-blue hover:underline font-medium"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
