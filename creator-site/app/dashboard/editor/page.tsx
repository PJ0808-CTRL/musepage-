"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Site = {
  id: string;
  title: string | null;
  description: string | null;
  theme: string | null;
  published: boolean;

  background_color: string | null;
  text_color: string | null;
  button_color: string | null;
  button_text_color: string | null;
  button_radius: number | null;
};

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  position: number;
};

export default function Editor() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState("#080808");
  const [textColor, setTextColor] = useState("#ffffff");
  const [buttonColor, setButtonColor] = useState("#ffffff");
  const [buttonTextColor, setButtonTextColor] = useState("#000000");
  const [buttonRadius, setButtonRadius] = useState(14);

  useEffect(() => {
    loadEditor();
  }, []);

  async function loadEditor() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE LOAD ERROR:", profileError);
        alert(profileError.message);
        return;
      }

      if (!profileData) {
        router.replace("/onboarding");
        return;
      }

      const currentProfile = profileData as Profile;

      setProfile(currentProfile);
      setName(currentProfile.display_name || "");
      setBio(currentProfile.bio || "");

      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (siteError) {
        console.error("SITE LOAD ERROR:", siteError);
        alert(siteError.message);
        return;
      }

      if (!siteData) {
        router.replace("/dashboard");
        return;
      }

      const currentSite = siteData as Site;

      setSite(currentSite);
      setBackgroundColor(currentSite.background_color || "#080808");
      setTextColor(currentSite.text_color || "#ffffff");
      setButtonColor(currentSite.button_color || "#ffffff");
      setButtonTextColor(currentSite.button_text_color || "#000000");
      setButtonRadius(currentSite.button_radius ?? 14);

      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .eq("site_id", currentSite.id)
        .order("position", { ascending: true });

      if (linksError) {
        console.error("LINKS LOAD ERROR:", linksError);
        alert(linksError.message);
        return;
      }

      setLinks((linksData || []) as LinkItem[]);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile || saving) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", profile.id);

      if (error) {
        console.error("PROFILE SAVE ERROR:", error);
        alert(error.message);
        return;
      }

      setProfile({
        ...profile,
        display_name: name.trim() || null,
        bio: bio.trim() || null,
      });

      alert("Profile saved!");
    } finally {
      setSaving(false);
    }
  }

  async function saveTheme() {
    if (!site || saving) return;

    setSaving(true);

    try {
      const updatePayload = {
        background_color: backgroundColor,
        text_color: textColor,
        button_color: buttonColor,
        button_text_color: buttonTextColor,
        button_radius: buttonRadius,
      };

      const { error } = await supabase
        .from("sites")
        .update(updatePayload)
        .eq("id", site.id);

      if (error) {
        console.error("THEME SAVE ERROR:", error);
        alert(error.message);
        return;
      }

      setSite({
        ...site,
        ...updatePayload,
      });

      alert("Theme saved!");
    } finally {
      setSaving(false);
    }
  }

  async function publishSite() {
    if (!site) return;

    const { error } = await supabase
      .from("sites")
      .update({
        published: true,
      })
      .eq("id", site.id);

    if (error) {
      console.error("PUBLISH ERROR:", error);
      alert(error.message);
      return;
    }

    setSite({
      ...site,
      published: true,
    });

    alert("Your site is now live! 🚀");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-gray-500">Loading editor...</p>
        </div>
      </main>
    );
  }

  if (!profile || !site) return null;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-fit text-sm text-gray-400 transition hover:text-white"
          >
            ← Dashboard
          </button>

          <h1 className="font-semibold">Site Builder</h1>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
            >
              Preview
            </a>

            <button
              type="button"
              onClick={publishSite}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              {site.published ? "Published" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* Builder */}
      <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-2">
        {/* Editor */}
        <section className="border-white/10 p-5 sm:p-6 lg:border-r lg:p-10">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-400">
              Edit your page
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Customize your profile
            </h2>

            {/* Profile */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Profile</h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Display name
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-violet-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="rounded-xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Appearance</h3>

              <p className="mt-1 text-sm text-gray-500">
                Customize how your page looks.
              </p>

              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Background</p>
                    <p className="text-sm text-gray-500">
                      Page background color
                    </p>
                  </div>

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Text color</p>
                    <p className="text-sm text-gray-500">Main text color</p>
                  </div>

                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Button color</p>
                    <p className="text-sm text-gray-500">
                      Link button background
                    </p>
                  </div>

                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Button text</p>
                    <p className="text-sm text-gray-500">
                      Text inside buttons
                    </p>
                  </div>

                  <input
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                </div>

                <div>
                  <div className="flex justify-between gap-4">
                    <p className="font-medium">Button roundness</p>

                    <span className="text-sm text-gray-500">
                      {buttonRadius}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={buttonRadius}
                    onChange={(e) =>
                      setButtonRadius(Number(e.target.value))
                    }
                    className="mt-3 w-full accent-violet-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveTheme}
                  disabled={saving}
                  className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save appearance"}
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Links</h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage the links on your page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard/links")}
                  className="w-fit rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
                >
                  Manage
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {links.length === 0 ? (
                  <p className="text-sm text-gray-500">No links yet.</p>
                ) : (
                  links.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-lg bg-black/30 px-4 py-3"
                    >
                      {link.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="flex items-start justify-center bg-[#111] p-5 sm:p-6 lg:sticky lg:top-0 lg:h-screen lg:items-center">
          <div className="w-full max-w-sm">
            <p className="mb-5 text-center text-xs uppercase tracking-widest text-gray-500">
              Live Preview
            </p>

            <div
              className="rounded-[2.5rem] border border-white/10 p-8 shadow-2xl transition-colors"
              style={{
                backgroundColor,
                color: textColor,
              }}
            >
              <div className="flex flex-col items-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                    <span className="text-2xl font-bold">
                      {(name || profile.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}

                <h3 className="mt-4 text-xl font-bold">
                  {name || "Your Name"}
                </h3>

                <p className="mt-1 text-sm opacity-60">
                  @{profile.username}
                </p>

                <p className="mt-4 text-center text-sm opacity-80">
                  {bio || "Your bio will appear here."}
                </p>

                <div className="mt-7 w-full space-y-3">
                  {links
                    .filter((link) => link.active)
                    .map((link) => (
                      <div
                        key={link.id}
                        className="px-4 py-3 text-center text-sm font-medium transition-all"
                        style={{
                          backgroundColor: buttonColor,
                          color: buttonTextColor,
                          borderRadius: `${buttonRadius}px`,
                        }}
                      >
                        {link.title}
                      </div>
                    ))}

                  {links.filter((link) => link.active).length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs opacity-40">
                      Your links will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
