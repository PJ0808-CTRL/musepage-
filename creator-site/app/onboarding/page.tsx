"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MusePageLogo from "@/app/components/MusePageLogo";

type Category =
  | "creator"
  | "minimal"
  | "business"
  | "musician"
  | "portfolio"
  | "launch";

type ExistingSite = {
  id: string;
  username: string;
};

type Template = {
  id: Category;
  name: string;
  emoji: string;
  description: string;

  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientDirection: string;

  buttonColor: string;
  buttonTextColor: string;

  font: string;
  buttonStyle: "rounded" | "square" | "pill";
  buttonShadow: boolean;

  pageWidth: "compact" | "normal" | "wide";
  spacing: "tight" | "normal" | "loose";
  headerPosition: "left" | "center" | "right";
};

const templates: Template[] = [
  {
    id: "creator",
    name: "Creator",
    emoji: "✨",
    description: "Bold and social-first for creators and influencers.",
    backgroundType: "gradient",
    backgroundColor: "#12091f",
    gradientColor1: "#12091f",
    gradientColor2: "#4c1d95",
    gradientDirection: "135deg",
    buttonColor: "#8b5cf6",
    buttonTextColor: "#ffffff",
    font: "Inter",
    buttonStyle: "rounded",
    buttonShadow: true,
    pageWidth: "normal",
    spacing: "normal",
    headerPosition: "center",
  },
  {
    id: "minimal",
    name: "Minimal",
    emoji: "◻️",
    description: "Simple, clean and distraction-free.",
    backgroundType: "solid",
    backgroundColor: "#f5f5f5",
    gradientColor1: "#f5f5f5",
    gradientColor2: "#f5f5f5",
    gradientDirection: "135deg",
    buttonColor: "#111111",
    buttonTextColor: "#ffffff",
    font: "Inter",
    buttonStyle: "rounded",
    buttonShadow: false,
    pageWidth: "compact",
    spacing: "normal",
    headerPosition: "center",
  },
  {
    id: "business",
    name: "Business",
    emoji: "💼",
    description: "Professional layout for founders and businesses.",
    backgroundType: "solid",
    backgroundColor: "#09090b",
    gradientColor1: "#09090b",
    gradientColor2: "#18181b",
    gradientDirection: "135deg",
    buttonColor: "#ffffff",
    buttonTextColor: "#000000",
    font: "Inter",
    buttonStyle: "rounded",
    buttonShadow: true,
    pageWidth: "wide",
    spacing: "normal",
    headerPosition: "left",
  },
  {
    id: "musician",
    name: "Musician",
    emoji: "🎵",
    description: "Made for music, releases and social channels.",
    backgroundType: "gradient",
    backgroundColor: "#07130d",
    gradientColor1: "#07130d",
    gradientColor2: "#14532d",
    gradientDirection: "135deg",
    buttonColor: "#4ade80",
    buttonTextColor: "#052e16",
    font: "Inter",
    buttonStyle: "pill",
    buttonShadow: true,
    pageWidth: "normal",
    spacing: "normal",
    headerPosition: "center",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    emoji: "🎨",
    description: "Showcase projects, work and creative experiments.",
    backgroundType: "gradient",
    backgroundColor: "#071a2b",
    gradientColor1: "#071a2b",
    gradientColor2: "#0e7490",
    gradientDirection: "135deg",
    buttonColor: "#22d3ee",
    buttonTextColor: "#001018",
    font: "Georgia",
    buttonStyle: "rounded",
    buttonShadow: true,
    pageWidth: "wide",
    spacing: "loose",
    headerPosition: "left",
  },
  {
    id: "launch",
    name: "Launch",
    emoji: "🚀",
    description: "Perfect for product launches and upcoming releases.",
    backgroundType: "gradient",
    backgroundColor: "#1c0b0b",
    gradientColor1: "#1c0b0b",
    gradientColor2: "#9f1239",
    gradientDirection: "135deg",
    buttonColor: "#fb7185",
    buttonTextColor: "#ffffff",
    font: "Inter",
    buttonStyle: "pill",
    buttonShadow: true,
    pageWidth: "normal",
    spacing: "loose",
    headerPosition: "center",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [finishError, setFinishError] = useState("");

  const [existingSite, setExistingSite] = useState<ExistingSite | null>(null);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const [category, setCategory] = useState<Category>("creator");

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [xUrl, setXUrl] = useState("");

  const [firstLinkTitle, setFirstLinkTitle] = useState("");
  const [firstLinkUrl, setFirstLinkUrl] = useState("");

  const selectedTemplate = useMemo(() => {
    return (
      templates.find((template) => template.id === category) || templates[0]
    );
  }, [category]);

  useEffect(() => {
    const savedStep = window.sessionStorage.getItem("onboarding-step");

    if (savedStep) {
      const parsed = Number(savedStep);

      if (parsed >= 1 && parsed <= 4) {
        setStep(parsed);
      }
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem("onboarding-step", String(step));
  }, [step]);

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: currentSite } = await supabase
        .from("sites")
        .select("id, username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentSite) {
        setExistingSite(currentSite as ExistingSite);
        setUsername(currentSite.username);

        const { data: fullSite } = await supabase
          .from("sites")
          .select("bio, avatar_url, instagram_url, youtube_url, x_url")
          .eq("id", currentSite.id)
          .maybeSingle();

        if (fullSite) {
          setBio(fullSite.bio || "");
          setAvatarUrl(fullSite.avatar_url || "");
          setInstagramUrl(fullSite.instagram_url || "");
          setYoutubeUrl(fullSite.youtube_url || "");
          setXUrl(fullSite.x_url || "");
        }
      }

      setLoading(false);
    }

    initialize();
  }, [router]);

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("idle");
      return;
    }

    const normalized = username.trim().toLowerCase();

    if (
      normalized.length < 3 ||
      !/^[a-z0-9_]+$/.test(normalized)
    ) {
      setUsernameStatus("idle");
      return;
    }

    const timeout = setTimeout(async () => {
      setUsernameStatus("checking");

      let query = supabase
        .from("sites")
        .select("id")
        .eq("username", normalized);

      if (existingSite?.id) {
        query = query.neq("id", existingSite.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("USERNAME CHECK ERROR:", error);
        setUsernameStatus("idle");
        return;
      }

      setUsernameStatus(data ? "taken" : "available");
    }, 450);

    return () => clearTimeout(timeout);
  }, [username, existingSite?.id]);

  function sanitizeUsername(value: string) {
    return value
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "");
  }

  function nextFromUsername() {
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      alert(
        "Username can only contain lowercase letters, numbers and underscores."
      );
      return;
    }

    if (usernameStatus === "taken") {
      alert("That username is already taken.");
      return;
    }

    if (usernameStatus === "checking") return;

    setStep(2);
  }

  function normalizeUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) return "";

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("mailto:")
    ) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    const path = `avatars/${user.id}/${fileName}`;

    try {
      setUploadingAvatar(true);

      const { error } = await supabase.storage
        .from("site-assets")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error("AVATAR UPLOAD ERROR:", error);
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("site-assets")
        .getPublicUrl(path);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error("AVATAR UPLOAD ERROR:", error);
      alert("Could not upload your profile picture.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!avatarUrl) return;

    try {
      const marker = "/storage/v1/object/public/site-assets/";
      const index = avatarUrl.indexOf(marker);

      if (index !== -1) {
        const path = avatarUrl.substring(index + marker.length);

        const { error } = await supabase.storage
          .from("site-assets")
          .remove([path]);

        if (error) {
          console.error("AVATAR DELETE ERROR:", error);
        }
      }
    } catch (error) {
      console.error("AVATAR DELETE ERROR:", error);
    }

    setAvatarUrl("");
  }

  async function finishOnboarding() {
    if (finishing || uploadingAvatar) return;

    setFinishError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setFinishing(true);

    try {
      const normalizedUsername = username.trim().toLowerCase();

      /*
       * IMPORTANT:
       * The dashboard requires a row in `profiles`.
       * Without this, /dashboard redirects straight back to /onboarding.
       */
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username: normalizedUsername,
            display_name: normalizedUsername,
            bio: bio.trim() || null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw new Error(`Profile setup failed: ${profileError.message}`);
      }

      const template = selectedTemplate;

      const sitePayload = {
        user_id: user.id,
        username: normalizedUsername,

        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,

        instagram_url: normalizeUrl(instagramUrl) || null,
        youtube_url: normalizeUrl(youtubeUrl) || null,
        x_url: normalizeUrl(xUrl) || null,

        background_color: template.backgroundColor,

        button_color: template.buttonColor,
        button_text_color: template.buttonTextColor,

        font: template.font,
        button_style: template.buttonStyle,
        button_shadow: template.buttonShadow,

        page_width: template.pageWidth,
        spacing: template.spacing,
        header_position: template.headerPosition,

        background_type: template.backgroundType,

        gradient_color_1: template.gradientColor1,
        gradient_color_2: template.gradientColor2,
        gradient_direction: template.gradientDirection,

        background_image_url: null,
        background_overlay: 0,
        background_position: "center",

        allow_indexing: true,
      };

      let siteId = existingSite?.id || "";

      if (existingSite) {
        const { error } = await supabase
          .from("sites")
          .update(sitePayload)
          .eq("id", existingSite.id);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("sites")
          .insert(sitePayload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        siteId = data.id;
      }

      if (!siteId) {
        throw new Error("Site could not be created.");
      }

      const { data: existingLinks, error: linksError } =
        await supabase
          .from("links")
          .select("id, position")
          .eq("site_id", siteId)
          .order("position", { ascending: false });

      if (linksError) {
        console.error("LOAD EXISTING LINKS ERROR:", linksError);
      }

      let nextPosition =
        existingLinks && existingLinks.length > 0
          ? (existingLinks[0].position || 0) + 1
          : 0;

      const newBlocks: Record<string, unknown>[] = [];

      if (!existingLinks || existingLinks.length === 0) {
        if (category === "creator") {
          newBlocks.push({
            site_id: siteId,
            type: "heading",
            title: "Find me online",
            url: "",
            active: true,
            position: nextPosition++,
            featured: false,
          });
        }

        if (category === "business") {
          newBlocks.push({
            site_id: siteId,
            type: "text",
            title: "Welcome",
            description:
              "Everything you need to know about what I do.",
            url: "",
            active: true,
            position: nextPosition++,
            featured: false,
          });
        }

        if (category === "musician") {
          newBlocks.push({
            site_id: siteId,
            type: "heading",
            title: "Listen now",
            url: "",
            active: true,
            position: nextPosition++,
            featured: false,
          });
        }

        if (category === "portfolio") {
          newBlocks.push({
            site_id: siteId,
            type: "heading",
            title: "Selected work",
            url: "",
            active: true,
            position: nextPosition++,
            featured: false,
          });
        }

        if (category === "launch") {
          newBlocks.push({
            site_id: siteId,
            type: "heading",
            title: "Something exciting is coming",
            url: "",
            active: true,
            position: nextPosition++,
            featured: false,
          });
        }
      }

      if (firstLinkTitle.trim() && firstLinkUrl.trim()) {
        newBlocks.push({
          site_id: siteId,
          type: "link",
          title: firstLinkTitle.trim(),
          url: normalizeUrl(firstLinkUrl),
          active: true,
          position: nextPosition++,
          featured: false,
          open_new_tab: true,
        });
      }

      if (newBlocks.length > 0) {
        const { error: insertBlocksError } = await supabase
          .from("links")
          .insert(newBlocks);

        if (insertBlocksError) {
          throw insertBlocksError;
        }
      }

      const [
        { data: verifiedProfile, error: verifyProfileError },
        { data: verifiedSite, error: verifySiteError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("sites")
          .select("id, username")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (verifyProfileError) {
        throw new Error(
          `Profile verification failed: ${verifyProfileError.message}`
        );
      }

      if (verifySiteError) {
        throw new Error(
          `Site verification failed: ${verifySiteError.message}`
        );
      }

      if (!verifiedProfile?.id) {
        throw new Error(
          "Your profile could not be verified after saving."
        );
      }

      if (!verifiedSite?.id) {
        throw new Error(
          "Your page could not be verified after saving."
        );
      }

      window.sessionStorage.removeItem("onboarding-step");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("ONBOARDING ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while setting up your page.";

      setFinishError(message);
      alert(message);
    } finally {
      setFinishing(false);
    }
  }

  function skipOnboarding() {
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-gray-500">
            Preparing your page...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <MusePageLogo iconSize={40} />

          <button
            type="button"
            onClick={skipOnboarding}
            className="text-sm text-gray-500 transition hover:text-white"
          >
            Skip setup
          </button>
        </div>

        <div className="mx-auto mt-10 w-full max-w-3xl">
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">
                Step {step} of 4
              </p>

              <p className="text-xs text-gray-600">
                {Math.round((step / 4) * 100)}%
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{
                  width: `${(step / 4) * 100}%`,
                }}
              />
            </div>
          </div>

          {step === 1 && (
            <section>
              <p className="text-sm font-semibold text-violet-400">
                Your page
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Claim your username
              </h1>

              <p className="mt-3 text-gray-500">
                This becomes the address people use to visit your page.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <label className="text-sm font-medium text-gray-300">
                  Username
                </label>

                <div className="mt-3 flex items-center rounded-2xl border border-white/10 bg-black/30 px-4 focus-within:border-violet-500">
                  <span className="text-gray-600">
                    yoursite.com/
                  </span>

                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        sanitizeUsername(e.target.value)
                      )
                    }
                    placeholder="username"
                    maxLength={30}
                    className="min-w-0 flex-1 bg-transparent px-1 py-4 outline-none"
                  />
                </div>

                <div className="mt-3 min-h-5 text-sm">
                  {usernameStatus === "checking" && (
                    <span className="text-gray-500">
                      Checking availability...
                    </span>
                  )}

                  {usernameStatus === "available" && (
                    <span className="text-emerald-400">
                      ✓ Username available
                    </span>
                  )}

                  {usernameStatus === "taken" && (
                    <span className="text-red-400">
                      This username is already taken.
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={nextFromUsername}
                  disabled={
                    !username ||
                    usernameStatus === "taken" ||
                    usernameStatus === "checking"
                  }
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <p className="text-sm font-semibold text-violet-400">
                Pick your style
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                What are you building?
              </h1>

              <p className="mt-3 text-gray-500">
                We&apos;ll give your page a matching starting design.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {templates.map((template) => {
                  const selected =
                    category === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        setCategory(template.id)
                      }
                      className={`rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
                          {template.emoji}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {template.name}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-gray-500">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl px-5 py-3 text-sm text-gray-400 hover:text-white"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <p className="text-sm font-semibold text-violet-400">
                Introduce yourself
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Build your profile
              </h1>

              <p className="mt-3 text-gray-500">
                You can change all of this later.
              </p>

              <div className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-300">
                    Profile picture
                  </label>

                  <div className="flex items-center gap-5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile preview"
                        className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-3xl ring-2 ring-white/10">
                        👤
                      </div>
                    )}

                    <div className="flex-1">
                      <label
                        className={`flex cursor-pointer items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition ${
                          uploadingAvatar
                            ? "cursor-wait bg-white/[0.03] text-gray-500"
                            : "bg-white/[0.05] hover:border-violet-500/50 hover:bg-violet-500/10"
                        }`}
                      >
                        {uploadingAvatar
                          ? "Uploading..."
                          : avatarUrl
                          ? "Change photo"
                          : "Choose photo"}

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={uploadingAvatar}
                          className="hidden"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0];

                            if (file) {
                              uploadAvatar(file);
                            }

                            e.currentTarget.value =
                              "";
                          }}
                        />
                      </label>

                      <p className="mt-2 text-xs leading-5 text-gray-600">
                        JPG, PNG or WEBP • Maximum 10MB
                      </p>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          disabled={uploadingAvatar}
                          className="mt-2 text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) =>
                      setBio(e.target.value)
                    }
                    placeholder="Creator, founder, student, artist..."
                    rows={4}
                    maxLength={220}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500"
                  />

                  <p className="mt-2 text-right text-xs text-gray-600">
                    {bio.length}/220
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <input
                    value={instagramUrl}
                    onChange={(e) =>
                      setInstagramUrl(e.target.value)
                    }
                    placeholder="Instagram"
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />

                  <input
                    value={youtubeUrl}
                    onChange={(e) =>
                      setYoutubeUrl(e.target.value)
                    }
                    placeholder="YouTube"
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />

                  <input
                    value={xUrl}
                    onChange={(e) =>
                      setXUrl(e.target.value)
                    }
                    placeholder="X / Twitter"
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={uploadingAvatar}
                  className="rounded-xl px-5 py-3 text-sm text-gray-400 hover:text-white disabled:opacity-50"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={uploadingAvatar}
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingAvatar
                    ? "Uploading photo..."
                    : "Continue →"}
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section>
              <p className="text-sm font-semibold text-violet-400">
                Final step
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Add your first link
              </h1>

              <p className="mt-3 text-gray-500">
                Optional — you can add all your content from the dashboard later.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Link title
                  </label>

                  <input
                    value={firstLinkTitle}
                    onChange={(e) =>
                      setFirstLinkTitle(e.target.value)
                    }
                    placeholder="My YouTube channel"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm text-gray-400">
                    URL
                  </label>

                  <input
                    value={firstLinkUrl}
                    onChange={(e) =>
                      setFirstLinkUrl(e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.03] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Your setup
                </p>

                <div className="mt-5 flex items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl">
                      👤
                    </div>
                  )}

                  <div>
                    <p className="font-semibold">
                      @{username}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedTemplate.emoji}{" "}
                      {selectedTemplate.name} template
                    </p>
                  </div>
                </div>

                {bio && (
                  <p className="mt-5 text-sm leading-6 text-gray-400">
                    {bio}
                  </p>
                )}
              </div>

              {finishError && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4">
                  <p className="text-sm font-semibold text-red-300">
                    Could not finish setup
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-200/70">
                    {finishError}
                  </p>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={finishing}
                  className="rounded-xl px-5 py-3 text-sm text-gray-400 hover:text-white disabled:opacity-50"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={finishOnboarding}
                  disabled={
                    finishing || uploadingAvatar
                  }
                  className="rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finishing
                    ? "Building your page..."
                    : "Build my page 🚀"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
