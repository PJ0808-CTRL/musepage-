"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LayoutSite = {
  username: string;
  published: boolean;
};

type LayoutProfile = {
  display_name: string | null;
  username: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Customize", href: "/dashboard/customize", icon: "✦" },
  { label: "Blocks", href: "/dashboard/links", icon: "▦" },
  { label: "Domain", href: "/dashboard/domain", icon: "◎" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const [profile, setProfile] = useState<LayoutProfile | null>(null);
  const [site, setSite] = useState<LayoutSite | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-sidebar-open");
    if (saved === "false") setSidebarOpen(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "dashboard-sidebar-open",
      sidebarOpen ? "true" : "false"
    );
  }, [sidebarOpen]);

  useEffect(() => {
    loadLayoutData();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function loadLayoutData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: profileData }, { data: siteData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("sites")
        .select("username, published")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setProfile(profileData || null);
    setSite(siteData || null);
    setLoadingUser(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const initials = useMemo(() => {
    const source = profile?.display_name?.trim() || profile?.username?.trim() || "U";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#050505]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold shadow-lg shadow-violet-500/20">
            Y
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-none">MusePage</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Creator Platform
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-gray-300 transition hover:bg-white/[0.07]"
          aria-label="Open navigation"
        >
          ☰
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-[270px] border-r border-white/10 bg-[#080808] transition-transform duration-300 ease-out lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold shadow-lg shadow-violet-500/20">
              Y
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate font-bold leading-none">MusePage</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-gray-600">
                Creator Platform
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-500 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            ‹
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700">
            Workspace
          </p>

          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-violet-500/15 text-white"
                      : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                      active
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                        : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {site && (
            <div className="mt-7">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700">
                Your page
              </p>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${site.published ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-gray-300">
                    /{site.username}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (site.published) window.open(`/${site.username}`, "_blank");
                  }}
                  disabled={!site.published}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {site.published ? "Open public page ↗" : "Page offline"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-bold text-violet-300">
                {loadingUser ? "…" : initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-200">
                  {profile?.display_name || profile?.username || "Account"}
                </p>
                <p className="truncate text-xs text-gray-600">
                  {profile?.username ? `@${profile.username}` : "Signed in"}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings")}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* DESKTOP REOPEN BUTTON */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-5 left-5 z-50 hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b0b0d]/95 text-lg text-gray-300 shadow-xl backdrop-blur transition hover:bg-white/[0.08] hover:text-white lg:flex"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          ›
        </button>
      )}

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[320px] flex-col border-r border-white/10 bg-[#080808] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold">
                  Y
                </div>
                <div>
                  <p className="font-bold">MusePage</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-600">
                    Creator Platform
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
                        active
                          ? "bg-violet-500/15 text-white"
                          : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-violet-500 text-white" : "bg-white/[0.04]"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {site && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-xs font-medium text-gray-400">/{site.username}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (site.published) window.open(`/${site.username}`, "_blank");
                    }}
                    disabled={!site.published}
                    className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 disabled:opacity-40"
                  >
                    {site.published ? "Open public page ↗" : "Page offline"}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div
        className={`min-h-screen transition-[padding] duration-300 ease-out ${
          sidebarOpen ? "lg:pl-[270px]" : "lg:pl-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
