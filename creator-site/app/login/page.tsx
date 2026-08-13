"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabase";
import MusePageLogo from "@/app/components/MusePageLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function routeAuthenticatedUser() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw userError || new Error("Could not verify your session.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (siteError) {
      throw siteError;
    }

    if (!profile || !site) {
      router.replace("/onboarding");
      return;
    }

    router.replace("/dashboard");
  }

  async function handleGoogleLogin() {
    if (googleLoading || loading) return;

    try {
      setGoogleLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        alert(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);
      alert("Something went wrong while connecting to Google.");
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (loading || googleLoading) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      await routeAuthenticatedUser();
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while signing in.";

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              MusePage
            </Link>

            <h1 className="mt-8 text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-gray-400">
              Sign in to manage your website.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleGoogleLogin}
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

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-500">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form
              onSubmit={handleLogin}
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
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-gray-600">
            By continuing, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}