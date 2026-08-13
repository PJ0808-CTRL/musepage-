import Link from "next/link";
import MusePageLogo from "@/app/components/MusePageLogo";

const features = [
  {
    icon: "✦",
    title: "Built around your brand",
    description:
      "Shape every detail — colors, typography, backgrounds, spacing and layout — without touching code.",
  },
  {
    icon: "◫",
    title: "More than just links",
    description:
      "Share videos, images, CTAs, Spotify, email, countdowns, contact cards and everything in between.",
  },
  {
    icon: "↗",
    title: "Designed to convert",
    description:
      "Turn attention into action with featured blocks, clear calls-to-action and a focused mobile-first experience.",
  },
  {
    icon: "⌁",
    title: "Share it anywhere",
    description:
      "Use your MusePage link, custom domain, QR code and social profiles to make your page easy to discover.",
  },
  {
    icon: "◎",
    title: "Know what works",
    description:
      "Track page views, clicks, social engagement and performance so you can improve what your audience sees.",
  },
  {
    icon: "⚡",
    title: "Fast to launch",
    description:
      "Pick a template, add your content, publish and keep improving whenever you want.",
  },
];

const miniLinks = [
  "Watch my newest video",
  "Explore my work",
  "Join the community",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      {/* AMBIENT BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="absolute right-[-160px] top-[420px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[380px] w-[380px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
<MusePageLogo subtitle iconSize={42} />

          <nav className="hidden items-center gap-7 text-sm text-gray-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#showcase" className="transition hover:text-white">
              Showcase
            </a>
            <a href="#why" className="transition hover:text-white">
              Why MusePage
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.08] px-3.5 py-2 text-xs font-semibold text-violet-200 shadow-sm shadow-violet-950/20">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Your entire online presence, in one page
            </div>

            <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:mx-0 lg:text-[76px]">
              One page for
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
                everything you are.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8 lg:mx-0">
              Build a beautiful home for your links, content, business and
              personal brand. MusePage helps people discover what matters most
              about you — without the clutter.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-gray-200 sm:px-7"
              >
                Create your MusePage
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>

              <a
                href="#showcase"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                See how it looks
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-600 lg:justify-start">
              <span>✓ No coding required</span>
              <span>✓ Launch in minutes</span>
              <span>✓ Built for mobile</span>
            </div>
          </div>

          {/* HERO PRODUCT MOCKUP */}
          <div id="showcase" className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-8 rounded-[42px] bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-2xl" />

            <div className="relative rounded-[34px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-4">
              <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0c0c0f]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </div>

                  <div className="rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-1.5 text-[10px] text-gray-500">
                    musepage.me/you
                  </div>

                  <div className="w-10" />
                </div>

                <div className="grid gap-0 lg:grid-cols-[1fr_150px]">
                  <div className="relative min-h-[520px] overflow-hidden bg-[radial-gradient(circle_at_top,#312e81_0%,#141421_34%,#09090b_72%)] px-6 py-9 sm:px-9">
                    <div className="absolute right-[-60px] top-[-50px] h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl" />

                    <div className="relative mx-auto max-w-sm text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-400 to-blue-500 text-xl font-bold shadow-2xl shadow-violet-950/50">
                        MP
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">
                          Alex Morgan
                        </h2>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px]">
                          ✓
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        Creator • Designer • Building things on the internet
                      </p>

                      <div className="mt-5 flex justify-center gap-2">
                        {["◎", "▶", "𝕏"].map((item) => (
                          <div
                            key={item}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs text-gray-200 backdrop-blur"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 space-y-3">
                        {miniLinks.map((item, index) => (
                          <div
                            key={item}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-medium shadow-lg backdrop-blur ${
                              index === 0
                                ? "border-violet-400/25 bg-violet-400/15"
                                : "border-white/10 bg-white/[0.07]"
                            }`}
                          >
                            <span>{item}</span>
                            <span className="text-gray-400">↗</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-left">
                        <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 via-violet-900/50 to-gray-950" />

                        <div className="mt-3">
                          <p className="text-sm font-semibold">
                            Latest project
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            A richer block for your newest work, launch or video.
                          </p>
                        </div>
                      </div>

                      <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">
                        Powered by MusePage
                      </p>
                    </div>
                  </div>

                  <div className="hidden border-l border-white/[0.06] bg-white/[0.015] p-4 lg:block">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                      Live editor
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.08] p-3">
                        <div className="h-2 w-16 rounded-full bg-violet-300/70" />
                        <div className="mt-2 h-2 w-24 rounded-full bg-white/10" />
                      </div>

                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                        >
                          <div className="h-2 w-12 rounded-full bg-white/15" />
                          <div className="mt-2 h-2 rounded-full bg-white/[0.06]" />
                          <div className="mt-1.5 h-2 w-3/4 rounded-full bg-white/[0.05]" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-white px-3 py-2.5 text-center text-[10px] font-bold text-black">
                      Publish changes
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-white/10 bg-[#0b0b0d]/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">
                Live
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">
                ● Page published
              </p>
            </div>

            <div className="absolute -right-3 top-16 hidden rounded-2xl border border-white/10 bg-[#0b0b0d]/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">
                This week
              </p>
              <p className="mt-1 text-lg font-bold">1,248 views</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-6 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <p className="text-sm text-gray-500">
            One flexible page for creators, founders, freelancers and businesses.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-gray-600 md:justify-end">
            <span>Creators</span>
            <span>Designers</span>
            <span>Musicians</span>
            <span>Founders</span>
            <span>Freelancers</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-5 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Everything you need
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
              A page that looks simple.
              <span className="block text-gray-500">
                A platform that does much more.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
              MusePage gives you the flexibility to build something that feels
              personal, while keeping everything fast, focused and easy to manage.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/[0.08] text-lg text-violet-200">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY MUSEPAGE */}
      <section id="why" className="px-5 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[34px] border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.10] via-white/[0.025] to-blue-500/[0.06]">
            <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  Built to grow with you
                </p>

                <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                  Your page should evolve as fast as you do.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-gray-400">
                  Start with three links today. Add videos, launches, analytics,
                  a custom domain and a full creator presence tomorrow. MusePage
                  stays flexible without becoming complicated.
                </p>

                <Link
                  href="/signup"
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-gray-200"
                >
                  Build your page
                  <span>→</span>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["12+", "Block types"],
                  ["Live", "Analytics"],
                  ["100%", "Customizable"],
                  ["1 link", "To share"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-black/20 p-6"
                  >
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                    <p className="mt-2 text-sm text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.025] px-6 py-14 sm:px-10 sm:py-16">
            <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Give your audience one place
              <span className="block bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                worth visiting.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500">
              Build your MusePage, make it yours, and share it everywhere.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Create your page
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-3.5 text-sm font-semibold transition hover:bg-white/[0.07]"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-gray-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
<MusePageLogo iconSize={34} />

          <p>One page for everything you are.</p>

          <div className="flex gap-5">
            <Link href="/login" className="transition hover:text-gray-300">
              Log in
            </Link>
            <Link href="/signup" className="transition hover:text-gray-300">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
