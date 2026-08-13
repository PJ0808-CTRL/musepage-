"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MusePageLogo from "@/app/components/MusePageLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error("RESET EMAIL ERROR:", error);
        alert(error.message);
        return;
      }

      setSent(true);
    } catch (error) {
      console.error("RESET EMAIL ERROR:", error);
      alert("Something went wrong while sending the reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <MusePageLogo iconSize={44} className="justify-center" />

            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Reset your password
            </h1>

            <p className="mt-2 text-gray-400">
              We&apos;ll email you a secure reset link.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                  ✓
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Check your inbox
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  If an account exists for{" "}
                  <span className="text-gray-300">{email}</span>, you&apos;ll
                  receive a password reset link shortly.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.08]"
                >
                  Send another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending reset link..." : "Send reset link"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-400">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}