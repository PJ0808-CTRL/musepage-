"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignup() {
    if (googleLoading || loading) return;

    try {
      setGoogleLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        console.error("GOOGLE SIGNUP ERROR:", error);
        alert(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("GOOGLE SIGNUP ERROR:", error);

      alert("Something went wrong while connecting to Google.");

      setGoogleLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (loading || googleLoading) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("SIGNUP ERROR:", error);
        alert(error.message);
        return;
      }

      /*
       * If email confirmation is disabled,
       * Supabase immediately creates a session.
       */
      if (data.session) {
        router.replace("/onboarding");
        return;
      }

      /*
       * If email confirmation is enabled,
       * the user must confirm their email first.
       */
      alert(
        "Account created! Check your email to confirm your account, then sign in."
      );

      router.replace("/login");
    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      alert("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* BRAND */}

          <div className="mb-8 text-center">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              YourBrand
            </Link>

            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Create your account
            </h1>

            <p className="mt-2 text-gray-400">
              Start building your online presence.
            </p>
          </div>

          {/* CARD */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            {/* GOOGLE */}

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {googleLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <FcGoogle size={22} />

                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* DIVIDER */}

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs font-medium text-gray-500">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* EMAIL SIGNUP */}

            <form
              onSubmit={handleSignup}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                />

                <p className="mt-2 text-xs text-gray-600">
                  Minimum 8 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* LOGIN */}

            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-400 transition hover:text-violet-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}