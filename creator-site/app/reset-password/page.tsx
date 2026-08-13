"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        setCanReset(true);
      }

      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        session
      ) {
        setCanReset(true);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("PASSWORD UPDATE ERROR:", error);
        alert(error.message);
        return;
      }

      setComplete(true);
    } catch (error) {
      console.error("PASSWORD UPDATE ERROR:", error);
      alert("Something went wrong while updating your password.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-gray-500">
            Verifying reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              YourBrand
            </Link>

            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Choose a new password
            </h1>

            <p className="mt-2 text-gray-400">
              Create a new password for your account.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            {complete ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                  ✓
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Password updated
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Your new password is ready to use.
                </p>

                <button
                  type="button"
                  onClick={() => router.replace("/dashboard")}
                  className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200"
                >
                  Go to dashboard
                </button>
              </div>
            ) : !canReset ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
                  !
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Reset link unavailable
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  This reset link may be invalid or expired. Request a fresh
                  password reset email and try again.
                </p>

                <Link
                  href="/forgot-password"
                  className="mt-6 block w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200"
                >
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    New password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a new password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                  />

                  <p className="mt-2 text-xs text-gray-600">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Confirm password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Repeat your new password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Updating password..." : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}