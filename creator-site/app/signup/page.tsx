"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MusePageLogo from "@/app/components/MusePageLogo";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const nextParam = searchParams.get("next");
  const fromParam = searchParams.get("from");

  const cameFromHomepageBuilder =
    fromParam === "homepage-builder";

  const afterSignupPath =
    nextParam || "/dashboard";

  function getLoginHref() {
    const params = new URLSearchParams();

    params.set(
      "next",
      afterSignupPath
    );

    if (cameFromHomepageBuilder) {
      params.set(
        "from",
        "homepage-builder"
      );
    }

    return `/login?${params.toString()}`;
  }

  function saveAuthIntent() {
    try {
      window.localStorage.setItem(
        "musepage-post-login-redirect",
        afterSignupPath
      );

      if (cameFromHomepageBuilder) {
        window.localStorage.setItem(
          "musepage-auth-source",
          "homepage-builder"
        );
      } else {
        window.localStorage.removeItem(
          "musepage-auth-source"
        );
      }
    } catch (storageError) {
      console.error(
        "COULD NOT SAVE AUTH REDIRECT:",
        storageError
      );
    }
  }

  async function handleGoogleSignup() {
    if (
      googleLoading ||
      loading
    ) {
      return;
    }

    try {
      setGoogleLoading(true);

      saveAuthIntent();

      const redirectTo =
        `${window.location.origin}/dashboard`;

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });

      if (error) {
        console.error(
          "GOOGLE SIGNUP ERROR:",
          error
        );

        alert(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error(
        "GOOGLE SIGNUP ERROR:",
        error
      );

      alert(
        "Something went wrong while starting Google sign-in."
      );

      setGoogleLoading(false);
    }
  }

  async function handleSignup(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      loading ||
      googleLoading
    ) {
      return;
    }

    try {
      setLoading(true);

      saveAuthIntent();

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (error) {
        const message =
          error.message.toLowerCase();

        if (
          message.includes(
            "already registered"
          ) ||
          message.includes(
            "already exists"
          )
        ) {
          alert(
            "This account already exists. Please sign in instead."
          );

          router.replace(
            getLoginHref()
          );

          return;
        }

        alert(error.message);
        return;
      }

      if (data.session) {
        router.replace(
          afterSignupPath
        );

        return;
      }

      alert(
        cameFromHomepageBuilder
          ? "Account created! Check your email to confirm your account, then sign in to continue claiming your MusePage."
          : "Account created! Check your email to confirm your account, then sign in."
      );

      router.replace(
        getLoginHref()
      );
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      alert(
        "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F4F1EB] text-[#1C1A17]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -right-40 top-[-80px] h-[520px] w-[520px] rounded-full bg-[#C8A873]/20 blur-[120px]" />
        <div className="absolute -left-48 bottom-[-120px] h-[500px] w-[500px] rounded-full bg-[#AAB8A4]/20 blur-[120px]" />
        <div className="absolute left-[28%] top-[-260px] h-[640px] w-[640px] rounded-full bg-white/70 blur-[130px]" />
        <div className="absolute left-[10%] top-[18%] h-[520px] w-[520px] rounded-full border border-[#BCA98A]/10" />
        <div className="absolute left-[12%] top-[21%] h-[420px] w-[420px] rounded-full border border-[#BCA98A]/10" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(104,88,67,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(104,88,67,0.025)_1px,transparent_1px)] bg-[size:52px_52px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.06fr_0.94fr]">
        <section className="hidden min-h-screen flex-col justify-between px-10 py-9 lg:flex xl:px-14">
          <div className="flex items-center justify-between">
            <MusePageLogo />

            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9185]">
              Creator workspace
            </span>
          </div>

          <div className="max-w-[680px] py-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9C8AA] bg-[#FBF8F2]/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#9B7442] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B79155]" />
              Start with a point of view
            </div>

            <h1
              className="mt-7 max-w-[680px] text-[52px] font-normal leading-[0.98] tracking-[-0.052em] text-[#211E1A] xl:text-[68px] 2xl:text-[78px]"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              A better home
              <br />
              for everything
              <br />
              <span className="italic text-[#9B7442]">
                you create.
              </span>
            </h1>

            <p className="mt-7 max-w-[570px] text-[15px] leading-7 text-[#746C62]">
              Build a page that looks considered, feels like your brand,
              and gives you one place to share your work, socials, links,
              analytics and more.
            </p>

            <div className="mt-10 grid max-w-[620px] gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Luxury presets",
                  copy: "Atelier, Noir, Sage, Oxblood and Midnight.",
                },
                {
                  title: "Live analytics",
                  copy: "Understand visitors, clicks and traffic sources.",
                },
                {
                  title: "SEO controls",
                  copy: "Own how your page appears beyond social media.",
                },
                {
                  title: "No-code editing",
                  copy: "Change the look and structure without touching code.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[16px] border border-[#D9D1C6] bg-[#FBF9F5]/68 p-4 backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-[#D3BF9F] bg-[#EEE3D2] text-[#9B7442]">
                      <Check
                        size={13}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#3B352E]">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#8A8175]">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-7 text-[10px] uppercase tracking-[0.15em] text-[#9A9185]">
              <span>No code</span>
              <span className="h-1 w-1 rounded-full bg-[#B79155]" />
              <span>Start free</span>
              <span className="h-1 w-1 rounded-full bg-[#B79155]" />
              <span>Your page, your style</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#D8D0C4] pt-5 text-[10px] text-[#9B9185]">
            <span>© 2026 MusePage</span>
            <span>Made for people building on the internet.</span>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:border-l lg:border-[#D8D0C4]/80 lg:bg-[#FBF9F5]/28">
          <div className="w-full max-w-[490px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <MusePageLogo />
            </div>

            <div className="rounded-[24px] border border-[#D7CEC2] bg-[#FBF9F5]/88 p-5 sm:p-6 md:p-8 shadow-[0_26px_70px_rgba(77,57,34,0.09)] backdrop-blur-2xl">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D8C6A8] bg-[#F1E7D7] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#9B7442]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B79155]" />
                  {cameFromHomepageBuilder
                    ? "Your draft is ready"
                    : "Create your MusePage"}
                </div>

                <h2
                  className="mt-5 text-[28px] leading-[1.15] sm:text-[34px] md:text-[38px] font-normal tracking-[-0.04em] text-[#211E1A]"
                  style={{
                    fontFamily:
                      'Georgia, "Times New Roman", serif',
                  }}
                >
                  {cameFromHomepageBuilder
                    ? "Claim what you made."
                    : "Create your account."}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#7C7368]">
                  {cameFromHomepageBuilder
                    ? "Create an account to keep your homepage draft and continue into your real MusePage."
                    : "Your page, customization tools and creator workspace start here."}
                </p>
              </div>

              {cameFromHomepageBuilder && (
                <div className="mt-6 overflow-hidden rounded-[16px] border border-[#D6C2A3] bg-[#F5EDE1]">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D0BA98] bg-[#EDE0CC] font-serif text-lg text-[#9B7442]">
                      M
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#4A4035]">
                        Your design is saved
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#83786B]">
                        Your username, name, bio, featured link and selected
                        luxury preset will follow a new account into onboarding.
                        Existing accounts return to their dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={
                  googleLoading ||
                  loading
                }
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-[12px] border border-[#D7CEC2] bg-white/80 px-4 py-3.5 text-sm font-semibold text-[#3A352F] shadow-sm transition hover:-translate-y-0.5 hover:border-[#C7B79E] hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D6CEC2] border-t-[#9B7442]" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FcGoogle size={21} />
                    Continue with Google
                  </>
                )}
              </button>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#DED6CB]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A09689]">
                  Or use email
                </span>

                <div className="h-px flex-1 bg-[#DED6CB]" />
              </div>

              <form
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#554F47]">
                    Email address
                  </label>

                  <div className="flex items-center rounded-[12px] border border-[#D8D0C4] bg-white/72 px-3.5 transition focus-within:border-[#B79155] focus-within:ring-4 focus-within:ring-[#B79155]/10">
                    <Mail
                      size={16}
                      strokeWidth={1.6}
                      className="shrink-0 text-[#A09689]"
                    />

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      required
                      disabled={
                        loading ||
                        googleLoading
                      }
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base sm:text-sm text-[#2B2722] outline-none placeholder:text-[#A9A094] disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label className="text-xs font-semibold text-[#554F47]">
                      Password
                    </label>

                    <span className="text-[10px] text-[#A09689]">
                      Minimum 8 characters
                    </span>
                  </div>

                  <div className="flex items-center rounded-[12px] border border-[#D8D0C4] bg-white/72 px-3.5 transition focus-within:border-[#B79155] focus-within:ring-4 focus-within:ring-[#B79155]/10">
                    <LockKeyhole
                      size={16}
                      strokeWidth={1.6}
                      className="shrink-0 text-[#A09689]"
                    />

                    <input
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      required
                      minLength={8}
                      disabled={
                        loading ||
                        googleLoading
                      }
                      autoComplete="new-password"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base sm:text-sm text-[#2B2722] outline-none placeholder:text-[#A9A094] disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  className="group flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#9B7442] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,116,66,0.18)] transition hover:-translate-y-0.5 hover:bg-[#876538] hover:shadow-[0_14px_28px_rgba(155,116,66,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      {cameFromHomepageBuilder
                        ? "Claim my page"
                        : "Create account"}

                      <ArrowRight
                        size={15}
                        strokeWidth={1.8}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 rounded-[14px] border border-[#DDD4C8] bg-[#F3EEE6]/70 px-4 py-3.5 text-center">
                <p className="text-sm text-[#7B7267]">
                  Already have an account?{" "}
                  <Link
                    href={getLoginHref()}
                    className="font-semibold text-[#8F6838] transition hover:text-[#6F4F2C]"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-[12px] bg-[#F5F1EA] px-3.5 py-3">
                <ShieldCheck
                  size={15}
                  strokeWidth={1.6}
                  className="mt-0.5 shrink-0 text-[#7A8F74]"
                />

                <p className="text-[11px] leading-5 text-[#8A8175]">
                  We use your account only to secure and manage your MusePage.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] leading-5 text-[#9A9185]">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function SignupFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F1EB] text-[#1C1A17]">
      <div className="flex flex-col items-center gap-4">
        <MusePageLogo />

        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D8D0C4] border-t-[#B79155]" />
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={<SignupFallback />}
    >
      <SignupContent />
    </Suspense>
  );
}
