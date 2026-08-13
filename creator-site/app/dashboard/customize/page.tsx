"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import PublicBlock from "@/app/components/PublicBlock";

type Site = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;

  instagram_url: string | null;
  youtube_url: string | null;
  x_url: string | null;

  background_color: string;
  button_color: string;
  button_text_color: string;

  font: string;
  button_style: string;
  button_shadow: boolean;

  page_width?: string | null;
  spacing?: string | null;
  header_position?: string | null;

  background_type?: string | null;
  gradient_color_1?: string | null;
  gradient_color_2?: string | null;
  gradient_direction?: string | null;

  background_image_url?: string | null;
  background_overlay?: number | null;
  background_position?: string | null;

  seo_title?: string | null;
  meta_description?: string | null;
  seo_keywords?: string | null;
  og_image_url?: string | null;
  twitter_image_url?: string | null;
  favicon_url?: string | null;
  allow_indexing?: boolean | null;
  canonical_url?: string | null;
};

type LinkItem = {
  id: string;
  title: string;
  url: string;
  active: boolean;
  position: number;
  featured?: boolean | null;
  type?: string | null;
  image_url?: string | null;
  description?: string | null;
  embed_url?: string | null;
  email?: string | null;
  schedule_start?: string | null;
  schedule_end?: string | null;
  open_new_tab?: boolean | null;
};

type Theme = {
  name: string;
  background: string;
  button: string;
  text: string;
  buttonText: string;
  preview: string;
};

const themes: Theme[] = [
  {
    name: "Midnight",
    background: "#09090b",
    button: "#ffffff",
    text: "#ffffff",
    buttonText: "#000000",
    preview: "linear-gradient(135deg,#09090b,#18181b)",
  },
  {
    name: "Ocean",
    background: "#071a2b",
    button: "#22d3ee",
    text: "#ffffff",
    buttonText: "#001018",
    preview: "linear-gradient(135deg,#071a2b,#0e7490)",
  },
  {
    name: "Purple",
    background: "#12091f",
    button: "#8b5cf6",
    text: "#ffffff",
    buttonText: "#ffffff",
    preview: "linear-gradient(135deg,#12091f,#4c1d95)",
  },
  {
    name: "Sunset",
    background: "#1c0b0b",
    button: "#fb7185",
    text: "#ffffff",
    buttonText: "#ffffff",
    preview: "linear-gradient(135deg,#1c0b0b,#9f1239)",
  },
  {
    name: "Forest",
    background: "#07130d",
    button: "#4ade80",
    text: "#ffffff",
    buttonText: "#052e16",
    preview: "linear-gradient(135deg,#07130d,#166534)",
  },
  {
    name: "Minimal",
    background: "#f5f5f5",
    button: "#111111",
    text: "#111111",
    buttonText: "#ffffff",
    preview: "linear-gradient(135deg,#f5f5f5,#d4d4d4)",
  },
];

const fonts = [
  "Inter",
  "Arial",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
];

const buttonStyles = ["rounded", "square", "pill"];
const backgroundTypes = ["solid", "gradient", "image"];

const gradientDirections = [
  { label: "Top → Bottom", value: "180deg" },
  { label: "Left → Right", value: "90deg" },
  { label: "Diagonal", value: "135deg" },
  { label: "Bottom → Top", value: "0deg" },
];

type Tab = "themes" | "design" | "profile" | "seo";

type UploadType = "avatar" | "background" | "og" | "twitter" | "favicon";

export default function CustomizePage() {
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [xUrl, setXUrl] = useState("");

  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [buttonColor, setButtonColor] = useState("#ffffff");
  const [buttonTextColor, setButtonTextColor] = useState("#000000");

  const [font, setFont] = useState("Inter");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [buttonShadow, setButtonShadow] = useState(true);

  const [pageWidth, setPageWidth] = useState("normal");
  const [spacing, setSpacing] = useState("normal");
  const [headerPosition, setHeaderPosition] = useState("center");

  const [backgroundType, setBackgroundType] = useState("solid");
  const [gradientColor1, setGradientColor1] = useState("#09090b");
  const [gradientColor2, setGradientColor2] = useState("#18181b");
  const [gradientDirection, setGradientDirection] = useState("135deg");

  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundOverlay, setBackgroundOverlay] = useState(0);
  const [backgroundPosition, setBackgroundPosition] = useState("center");

  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [twitterImageUrl, setTwitterImageUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [allowIndexing, setAllowIndexing] = useState(true);
  const [canonicalUrl, setCanonicalUrl] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("themes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadType | null>(null);

  const loadLinks = useCallback(async (siteId: string) => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("site_id", siteId)
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("LOAD LINKS ERROR:", error);
      return;
    }

    setLinks([...(data || [])] as LinkItem[]);
  }, []);

  const loadSite = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: siteData, error } = await supabase
      .from("sites")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !siteData) {
      console.error(error);
      alert("Your site could not be found.");
      router.push("/dashboard");
      return;
    }

    const currentSite = siteData as Site;

    setSite(currentSite);
    setBio(currentSite.bio || "");
    setAvatarUrl(currentSite.avatar_url || "");

    setInstagramUrl(currentSite.instagram_url || "");
    setYoutubeUrl(currentSite.youtube_url || "");
    setXUrl(currentSite.x_url || "");

    setBackgroundColor(currentSite.background_color || "#000000");
    setButtonColor(currentSite.button_color || "#ffffff");
    setButtonTextColor(currentSite.button_text_color || "#000000");

    setFont(currentSite.font || "Inter");
    setButtonStyle(currentSite.button_style || "rounded");
    setButtonShadow(currentSite.button_shadow ?? true);

    setPageWidth(currentSite.page_width || "normal");
    setSpacing(currentSite.spacing || "normal");
    setHeaderPosition(currentSite.header_position || "center");

    setBackgroundType(currentSite.background_type || "solid");
    setGradientColor1(
      currentSite.gradient_color_1 ||
        currentSite.background_color ||
        "#09090b"
    );
    setGradientColor2(currentSite.gradient_color_2 || "#18181b");
    setGradientDirection(currentSite.gradient_direction || "135deg");

    setBackgroundImageUrl(currentSite.background_image_url || "");
    setBackgroundOverlay(currentSite.background_overlay ?? 0);
    setBackgroundPosition(currentSite.background_position || "center");

    setSeoTitle(currentSite.seo_title || "");
    setMetaDescription(currentSite.meta_description || "");
    setSeoKeywords(currentSite.seo_keywords || "");
    setOgImageUrl(currentSite.og_image_url || "");
    setTwitterImageUrl(currentSite.twitter_image_url || "");
    setFaviconUrl(currentSite.favicon_url || "");
    setAllowIndexing(currentSite.allow_indexing ?? true);
    setCanonicalUrl(currentSite.canonical_url || "");

    await loadLinks(currentSite.id);
    setLoading(false);
  }, [router, loadLinks]);

  useEffect(() => {
    loadSite();
  }, [loadSite]);

  useEffect(() => {
    if (!site?.id) return;

    const channel = supabase
      .channel(`customize-links-${site.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `site_id=eq.${site.id}`,
        },
        async () => {
          await loadLinks(site.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [site?.id, loadLinks]);

  useEffect(() => {
    if (!site?.id) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await loadLinks(site.id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [site?.id, loadLinks]);

  function applyTheme(theme: Theme) {
    setBackgroundColor(theme.background);
    setButtonColor(theme.button);
    setButtonTextColor(theme.buttonText);
    setBackgroundType("solid");
    setGradientColor1(theme.background);
    setGradientColor2(theme.background);
    setBackgroundImageUrl("");
    setBackgroundOverlay(0);
  }

  async function uploadImage(file: File, type: UploadType) {
    if (!site) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
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
      alert("You are not logged in.");
      return;
    }

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    let folder = "avatars";

    if (type === "background") folder = "backgrounds";
    if (type === "og") folder = "og-images";
    if (type === "twitter") folder = "twitter-images";
    if (type === "favicon") folder = "favicons";

    const path = `${folder}/${user.id}/${fileName}`;

    try {
      setUploading(type);

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        alert(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(path);

      const publicUrl = publicUrlData.publicUrl;

      if (!publicUrl) {
        alert("Could not generate image URL.");
        return;
      }

      if (type === "avatar") setAvatarUrl(publicUrl);

      if (type === "background") {
        setBackgroundImageUrl(publicUrl);
        setBackgroundType("image");
      }

      if (type === "og") setOgImageUrl(publicUrl);
      if (type === "twitter") setTwitterImageUrl(publicUrl);
      if (type === "favicon") setFaviconUrl(publicUrl);
    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);
      alert("Something went wrong while uploading the image.");
    } finally {
      setUploading(null);
    }
  }

  async function deleteStorageImage(publicUrl: string, type: UploadType) {
    if (!publicUrl) return;

    try {
      const marker = "/storage/v1/object/public/site-assets/";
      const index = publicUrl.indexOf(marker);

      if (index !== -1) {
        const path = publicUrl.substring(index + marker.length);

        const { error } = await supabase.storage
          .from("site-assets")
          .remove([path]);

        if (error) {
          console.error("DELETE IMAGE ERROR:", error);
        }
      }
    } catch (error) {
      console.error("DELETE IMAGE ERROR:", error);
    }

    if (type === "avatar") setAvatarUrl("");
    if (type === "background") setBackgroundImageUrl("");
    if (type === "og") setOgImageUrl("");
    if (type === "twitter") setTwitterImageUrl("");
    if (type === "favicon") setFaviconUrl("");
  }

  async function saveChanges() {
    if (!site) return;

    setSaving(true);

    const updatePayload = {
      bio,
      avatar_url: avatarUrl || null,

      instagram_url: instagramUrl || null,
      youtube_url: youtubeUrl || null,
      x_url: xUrl || null,

      background_color: backgroundColor,
      button_color: buttonColor,
      button_text_color: buttonTextColor,

      font,
      button_style: buttonStyle,
      button_shadow: buttonShadow,

      page_width: pageWidth,
      spacing,
      header_position: headerPosition,

      background_type: backgroundType,
      gradient_color_1: gradientColor1,
      gradient_color_2: gradientColor2,
      gradient_direction: gradientDirection,

      background_image_url: backgroundImageUrl || null,
      background_overlay: backgroundOverlay,
      background_position: backgroundPosition,

      seo_title: seoTitle || null,
      meta_description: metaDescription || null,
      seo_keywords: seoKeywords || null,
      og_image_url: ogImageUrl || null,
      twitter_image_url: twitterImageUrl || null,
      favicon_url: faviconUrl || null,
      allow_indexing: allowIndexing,
      canonical_url: canonicalUrl || null,
    };

    const { error } = await supabase
      .from("sites")
      .update(updatePayload)
      .eq("id", site.id);

    if (error) {
      console.error("SAVE ERROR:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setSite({
      ...site,
      ...updatePayload,
    } as Site);

    setSaving(false);
    alert("Changes saved!");
  }

  function getButtonRadius() {
    if (buttonStyle === "pill") return "9999px";
    if (buttonStyle === "square") return "4px";
    return "14px";
  }

  function getPageWidth() {
    if (pageWidth === "compact") return "360px";
    if (pageWidth === "wide") return "620px";
    return "480px";
  }

  function getSpacing() {
    if (spacing === "tight") return "space-y-2";
    if (spacing === "loose") return "space-y-5";
    return "space-y-3";
  }

  function getBackgroundStyle(): CSSProperties {
    if (backgroundType === "gradient") {
      return {
        backgroundColor: gradientColor1,
        backgroundImage: `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    if (backgroundType === "image" && backgroundImageUrl) {
      return {
        backgroundColor,
        backgroundImage: `linear-gradient(rgba(0,0,0,${
          backgroundOverlay / 100
        }), rgba(0,0,0,${
          backgroundOverlay / 100
        })), url("${backgroundImageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition,
        backgroundRepeat: "no-repeat",
      };
    }

    return { backgroundColor };
  }

  const visibleBlocks = useMemo(() => {
    const now = new Date();

    return links
      .filter((block) => {
        const start = block.schedule_start
          ? new Date(block.schedule_start)
          : null;
        const end = block.schedule_end ? new Date(block.schedule_end) : null;

        return (!start || now >= start) && (!end || now <= end);
      })
      .sort((a, b) => {
        const featuredA = a.featured ? 1 : 0;
        const featuredB = b.featured ? 1 : 0;

        if (featuredA !== featuredB) {
          return featuredB - featuredA;
        }

        return a.position - b.position;
      });
  }, [links]);

  const seoAudit = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "SEO title",
        description:
          seoTitle.trim().length >= 20
            ? "Your page has a useful search title."
            : "Add a descriptive SEO title of at least 20 characters.",
        passed: seoTitle.trim().length >= 20,
        points: 20,
      },
      {
        id: "description",
        label: "Meta description",
        description:
          metaDescription.trim().length >= 70
            ? "Your page has a helpful search description."
            : "Write a clear meta description of at least 70 characters.",
        passed: metaDescription.trim().length >= 70,
        points: 20,
      },
      {
        id: "og",
        label: "Social sharing image",
        description: ogImageUrl
          ? "An Open Graph image is ready for shared links."
          : "Upload an OG image so shared links have a strong preview.",
        passed: Boolean(ogImageUrl),
        points: 15,
      },
      {
        id: "favicon",
        label: "Favicon",
        description: faviconUrl
          ? "Your profile has a favicon."
          : "Add a favicon for browser tabs and bookmarks.",
        passed: Boolean(faviconUrl),
        points: 10,
      },
      {
        id: "indexing",
        label: "Search indexing",
        description: allowIndexing
          ? "Search engines are allowed to index this profile."
          : "Indexing is disabled, so your page is asking search engines not to list it.",
        passed: allowIndexing,
        points: 10,
      },
      {
        id: "bio",
        label: "Profile bio",
        description:
          bio.trim().length >= 30
            ? "Your profile has useful descriptive content."
            : "Add a little more detail to your bio.",
        passed: bio.trim().length >= 30,
        points: 10,
      },
      {
        id: "avatar",
        label: "Profile image",
        description: avatarUrl
          ? "Your profile has a recognizable image."
          : "Add a profile image to strengthen your page identity.",
        passed: Boolean(avatarUrl),
        points: 5,
      },
      {
        id: "socials",
        label: "Social profiles",
        description:
          instagramUrl || youtubeUrl || xUrl
            ? "At least one social profile is connected."
            : "Connect at least one social profile.",
        passed: Boolean(instagramUrl || youtubeUrl || xUrl),
        points: 5,
      },
      {
        id: "twitter",
        label: "X / Twitter card image",
        description: twitterImageUrl
          ? "A dedicated X/Twitter image is configured."
          : "Optional: add a dedicated X/Twitter card image.",
        passed: Boolean(twitterImageUrl),
        points: 5,
      },
    ];

    const score = checks.reduce(
      (total, check) => total + (check.passed ? check.points : 0),
      0
    );

    const completed = checks.filter((check) => check.passed).length;

    const label =
      score >= 90
        ? "Excellent"
        : score >= 75
        ? "Strong"
        : score >= 55
        ? "Good start"
        : score >= 35
        ? "Needs work"
        : "Getting started";

    const color =
      score >= 90
        ? "emerald"
        : score >= 75
        ? "cyan"
        : score >= 55
        ? "violet"
        : score >= 35
        ? "amber"
        : "red";

    return {
      score,
      completed,
      total: checks.length,
      checks,
      label,
      color,
    };
  }, [
    seoTitle,
    metaDescription,
    ogImageUrl,
    faviconUrl,
    allowIndexing,
    bio,
    avatarUrl,
    instagramUrl,
    youtubeUrl,
    xUrl,
    twitterImageUrl,
  ]);

  function ImageUploadBox({
    type,
    label,
    description,
    value,
    onRemove,
    accept = "image/*",
  }: {
    type: UploadType;
    label: string;
    description: string;
    value: string;
    onRemove: () => void;
    accept?: string;
  }) {
    const isUploading = uploading === type;

    return (
      <div>
        <label className="mb-2 block text-sm text-gray-400">{label}</label>

        {value && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="relative">
              <img
                src={value}
                alt={label}
                className={
                  type === "favicon"
                    ? "mx-auto h-24 w-24 object-contain p-4"
                    : "h-40 w-full object-cover"
                }
              />

              <button
                type="button"
                onClick={onRemove}
                className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-red-500/80"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${
            isUploading
              ? "cursor-wait border-violet-500/40 bg-violet-500/5"
              : "border-white/10 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5"
          }`}
        >
          {isUploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-500" />
              <p className="mt-3 text-sm text-gray-300">Uploading...</p>
            </>
          ) : (
            <>
              <div className="text-3xl">{type === "favicon" ? "🌐" : "🖼️"}</div>

              <p className="mt-3 text-sm font-medium">
                {value ? "Replace image" : "Choose an image"}
              </p>

              <p className="mt-1 text-xs text-gray-500">{description}</p>
            </>
          )}

          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file, type);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-gray-500">
            Loading theme builder...
          </p>
        </div>
      </main>
    );
  }

  if (!site) return null;

  const headerAlignment =
    headerPosition === "left"
      ? "items-start text-left"
      : headerPosition === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#050505] text-white lg:grid-cols-[480px_1fr]">
      <section className="border-r border-white/10 bg-[#09090b]">
        <div className="sticky top-0 flex max-h-screen flex-col">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  ← Dashboard
                </button>

                <h1 className="mt-3 text-2xl font-bold">Theme Builder</h1>
              </div>

              <button
                type="button"
                onClick={saveChanges}
                disabled={saving || uploading !== null}
                className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Design your page exactly the way you want.
            </p>
          </div>

          <div className="border-b border-white/10 px-6">
            <div className="flex gap-5 overflow-x-auto">
              {[
                { id: "themes", label: "Themes" },
                { id: "design", label: "Design" },
                { id: "profile", label: "Profile" },
                { id: "seo", label: "SEO" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-violet-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto px-6 py-7">
            {activeTab === "themes" && (
              <div>
                <h2 className="text-lg font-semibold">Choose a theme</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Start with a preset and customize it further.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => applyTheme(theme)}
                      className="group overflow-hidden rounded-2xl border border-white/10 text-left transition hover:-translate-y-0.5 hover:border-violet-500"
                    >
                      <div
                        className="h-24 p-4"
                        style={{ background: theme.preview }}
                      >
                        <div
                          className="mx-auto h-3 w-16 rounded-full"
                          style={{ backgroundColor: theme.button }}
                        />
                        <div className="mx-auto mt-3 h-2 w-24 rounded-full bg-white/20" />
                        <div className="mx-auto mt-2 h-2 w-20 rounded-full bg-white/10" />
                      </div>

                      <div className="bg-white/[0.03] px-4 py-3">
                        <p className="text-sm font-medium">{theme.name}</p>

                        <div className="mt-2 flex gap-1.5">
                          <span
                            className="h-4 w-4 rounded-full border border-white/10"
                            style={{ backgroundColor: theme.background }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-white/10"
                            style={{ backgroundColor: theme.button }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-white/10"
                            style={{ backgroundColor: theme.buttonText }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "design" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold">Background</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose a solid color, gradient, or image.
                  </p>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Background type
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {backgroundTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBackgroundType(type)}
                          className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                            backgroundType === type
                              ? "border-violet-500 bg-violet-500/10 text-violet-400"
                              : "border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {backgroundType === "solid" && (
                    <div className="mt-5">
                      <label className="mb-2 block text-sm text-gray-400">
                        Background color
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                        />
                        <input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {backgroundType === "gradient" && (
                    <div className="mt-5 space-y-5">
                      {[
                        {
                          label: "Gradient color 1",
                          value: gradientColor1,
                          setter: setGradientColor1,
                        },
                        {
                          label: "Gradient color 2",
                          value: gradientColor2,
                          setter: setGradientColor2,
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <label className="mb-2 block text-sm text-gray-400">
                            {item.label}
                          </label>

                          <div className="flex gap-3">
                            <input
                              type="color"
                              value={item.value}
                              onChange={(e) => item.setter(e.target.value)}
                              className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                            />
                            <input
                              value={item.value}
                              onChange={(e) => item.setter(e.target.value)}
                              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Gradient direction
                        </label>

                        <select
                          value={gradientDirection}
                          onChange={(e) => setGradientDirection(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          {gradientDirections.map((direction) => (
                            <option
                              key={direction.value}
                              value={direction.value}
                              className="bg-black"
                            >
                              {direction.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {backgroundType === "image" && (
                    <div className="mt-5 space-y-5">
                      <ImageUploadBox
                        type="background"
                        label="Background image"
                        description="JPG, PNG, WEBP up to 10MB"
                        value={backgroundImageUrl}
                        onRemove={() =>
                          deleteStorageImage(backgroundImageUrl, "background")
                        }
                      />

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Or use image URL
                        </label>

                        <input
                          value={backgroundImageUrl}
                          onChange={(e) =>
                            setBackgroundImageUrl(e.target.value)
                          }
                          placeholder="https://..."
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-400">
                            Dark overlay
                          </label>

                          <span className="text-xs text-gray-500">
                            {backgroundOverlay}%
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={backgroundOverlay}
                          onChange={(e) =>
                            setBackgroundOverlay(Number(e.target.value))
                          }
                          className="mt-3 w-full accent-violet-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Image position
                        </label>

                        <select
                          value={backgroundPosition}
                          onChange={(e) =>
                            setBackgroundPosition(e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          {["center", "top", "bottom", "left", "right"].map(
                            (position) => (
                              <option
                                key={position}
                                value={position}
                                className="bg-black capitalize"
                              >
                                {position}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Colors</h2>

                  <div className="mt-5 space-y-5">
                    {[
                      {
                        label: "Button",
                        value: buttonColor,
                        setter: setButtonColor,
                      },
                      {
                        label: "Button text",
                        value: buttonTextColor,
                        setter: setButtonTextColor,
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <label className="mb-2 block text-sm text-gray-400">
                          {item.label}
                        </label>

                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={item.value}
                            onChange={(e) => item.setter(e.target.value)}
                            className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                          />
                          <input
                            value={item.value}
                            onChange={(e) => item.setter(e.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Typography</h2>

                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    {fonts.map((item) => (
                      <option key={item} value={item} className="bg-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Buttons</h2>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {buttonStyles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setButtonStyle(style)}
                        className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                          buttonStyle === style
                            ? "border-violet-500 bg-violet-500/10 text-violet-400"
                            : "border-white/10 text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setButtonShadow(!buttonShadow)}
                    className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Button shadow</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Add depth to your buttons
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                        buttonShadow ? "bg-violet-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          buttonShadow ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Layout</h2>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Page width
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {["compact", "normal", "wide"].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPageWidth(item)}
                          className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                            pageWidth === item
                              ? "border-violet-500 bg-violet-500/10 text-violet-400"
                              : "border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Link spacing
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {["tight", "normal", "loose"].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSpacing(item)}
                          className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                            spacing === item
                              ? "border-violet-500 bg-violet-500/10 text-violet-400"
                              : "border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Header alignment
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {["left", "center", "right"].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setHeaderPosition(item)}
                          className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                            headerPosition === item
                              ? "border-violet-500 bg-violet-500/10 text-violet-400"
                              : "border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <h2 className="text-lg font-semibold">Profile</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Customize the information visitors see.
                </p>

                <div className="mt-6 space-y-6">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Bio
                    </label>

                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <ImageUploadBox
                      type="avatar"
                      label="Profile picture"
                      description="JPG, PNG, WEBP up to 10MB"
                      value={avatarUrl}
                      onRemove={() =>
                        deleteStorageImage(avatarUrl, "avatar")
                      }
                    />

                    <div className="mt-4">
                      <label className="mb-2 block text-xs text-gray-500">
                        Or use image URL
                      </label>

                      <input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaInstagram />
                      Instagram
                    </label>

                    <input
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaYoutube />
                      YouTube
                    </label>

                    <input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaXTwitter />
                      X
                    </label>

                    <input
                      value={xUrl}
                      onChange={(e) => setXUrl(e.target.value)}
                      placeholder="https://x.com/username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold">SEO</h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Control how your profile appears in search engines and when
                    shared online.
                  </p>
                </div>

                {/* SEO SCORE */}

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] via-white/[0.025] to-cyan-500/[0.05]">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          SEO score
                        </p>

                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-4xl font-bold tracking-tight">
                            {seoAudit.score}
                          </p>

                          <p className="pb-1 text-sm text-gray-600">
                            / 100
                          </p>
                        </div>

                        <p
                          className={`mt-2 text-sm font-semibold ${
                            seoAudit.color === "emerald"
                              ? "text-emerald-400"
                              : seoAudit.color === "cyan"
                              ? "text-cyan-400"
                              : seoAudit.color === "violet"
                              ? "text-violet-400"
                              : seoAudit.color === "amber"
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {seoAudit.label}
                        </p>
                      </div>

                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-20 w-20 -rotate-90"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                          />

                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={
                              seoAudit.score >= 90
                                ? "#34d399"
                                : seoAudit.score >= 75
                                ? "#22d3ee"
                                : seoAudit.score >= 55
                                ? "#8b5cf6"
                                : seoAudit.score >= 35
                                ? "#f59e0b"
                                : "#f87171"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${
                              2 *
                              Math.PI *
                              42 *
                              (1 - seoAudit.score / 100)
                            }`}
                          />
                        </svg>

                        <span className="absolute text-sm font-bold">
                          {seoAudit.score}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Checklist progress
                        </span>

                        <span className="font-medium text-gray-300">
                          {seoAudit.completed}/{seoAudit.total}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                          style={{
                            width: `${seoAudit.score}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-black/15 p-4">
                    <div className="space-y-2">
                      {seoAudit.checks.map((check) => (
                        <div
                          key={check.id}
                          className={`rounded-xl border p-3 transition ${
                            check.passed
                              ? "border-emerald-500/10 bg-emerald-500/[0.035]"
                              : "border-white/[0.07] bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                check.passed
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {check.passed ? "✓" : "!"}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-200">
                                  {check.label}
                                </p>

                                <span className="text-[10px] text-gray-600">
                                  {check.points} pts
                                </span>
                              </div>

                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {check.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* OPTIONAL SEO SETTINGS */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Optional extras
                  </p>

                  <div className="mt-3 space-y-2 text-xs leading-5 text-gray-500">
                    <p>
                      <span className="text-gray-300">Canonical URL:</span>{" "}
                      {canonicalUrl
                        ? "Custom canonical URL configured."
                        : "Not required unless you want another URL treated as the primary version."}
                    </p>

                    <p>
                      <span className="text-gray-300">SEO keywords:</span>{" "}
                      {seoKeywords.trim()
                        ? "Keywords added."
                        : "Optional — your page can work without them."}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      SEO Title
                    </label>

                    <input
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      maxLength={60}
                      placeholder={`@${site.username} | Creator`}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />

                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                      <span>Recommended: under 60 characters</span>
                      <span>{seoTitle.length}/60</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Meta Description
                    </label>

                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      maxLength={160}
                      rows={4}
                      placeholder="Tell search engines what your profile is about..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-6 outline-none focus:border-violet-500"
                    />

                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                      <span>Recommended: around 150–160 characters</span>
                      <span>{metaDescription.length}/160</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      SEO Keywords
                    </label>

                    <input
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="finance, investing, creator, business"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />

                    <p className="mt-2 text-xs leading-5 text-gray-600">
                      Separate keywords with commas. This is optional and modern
                      search engines may largely ignore this field.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-300">
                    Search Preview
                  </h3>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="truncate text-lg text-blue-400">
                      {seoTitle || `@${site.username}`}
                    </p>

                    <p className="mt-1 text-xs text-green-500">
                      yoursite.com/{site.username}
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-400">
                      {metaDescription ||
                        "Your profile description will appear here in search results."}
                    </p>
                  </div>
                </div>

                <ImageUploadBox
                  type="og"
                  label="OG Image"
                  description="Recommended 1200×630px • JPG, PNG, WEBP up to 10MB"
                  value={ogImageUrl}
                  onRemove={() => deleteStorageImage(ogImageUrl, "og")}
                />

                <ImageUploadBox
                  type="twitter"
                  label="Twitter/X Card Image"
                  description="Recommended 1200×628px • JPG, PNG, WEBP up to 10MB"
                  value={twitterImageUrl}
                  onRemove={() =>
                    deleteStorageImage(twitterImageUrl, "twitter")
                  }
                />

                <ImageUploadBox
                  type="favicon"
                  label="Favicon"
                  description="PNG, ICO, WEBP • Square image recommended"
                  value={faviconUrl}
                  onRemove={() => deleteStorageImage(faviconUrl, "favicon")}
                  accept="image/png,image/x-icon,image/webp,image/svg+xml"
                />

                <div>
                  <h3 className="text-sm font-semibold text-gray-300">
                    Search Engine Indexing
                  </h3>

                  <button
                    type="button"
                    onClick={() => setAllowIndexing(!allowIndexing)}
                    className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.05]"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Allow search engines
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {allowIndexing
                          ? "Google and other search engines may index this profile."
                          : "Search engines will be asked not to index this profile."}
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                        allowIndexing ? "bg-violet-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          allowIndexing ? "translate-x-5" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Canonical URL
                  </label>

                  <input
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`https://yourdomain.com/${site.username}`}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#050505] p-6 lg:p-12">
        <div className="w-full">
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm text-gray-500">Live preview</span>
          </div>

          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-[32px] border border-white/10 shadow-2xl transition-all duration-300"
              style={{
                width: getPageWidth(),
                maxWidth: "100%",
                fontFamily: font,
                ...getBackgroundStyle(),
              }}
            >
              <div
                className={`px-5 sm:px-6 ${
                  spacing === "loose"
                    ? "py-16"
                    : spacing === "tight"
                    ? "py-8"
                    : "py-12"
                }`}
              >
                <div className={`flex w-full flex-col ${headerAlignment}`}>
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-24 w-24 rounded-full object-cover shadow-2xl ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl shadow-2xl ring-2 ring-white/10">
                        👤
                      </div>
                    )}
                  </div>

                  <h2
                    className="mt-5 text-2xl font-bold tracking-tight"
                    style={{ color: buttonTextColor }}
                  >
                    @{site.username}
                  </h2>

                  {bio && (
                    <p
                      className={`mt-3 max-w-md text-sm leading-6 opacity-75 ${
                        headerPosition === "center" ? "text-center" : ""
                      }`}
                      style={{ color: buttonTextColor }}
                    >
                      {bio}
                    </p>
                  )}

                  <div className="mt-5">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur"
                    >
                      Share
                    </button>
                  </div>
                </div>

                {(instagramUrl || youtubeUrl || xUrl) && (
                  <div
                    className={`mt-7 flex items-center gap-3 ${
                      headerPosition === "left"
                        ? "justify-start"
                        : headerPosition === "right"
                        ? "justify-end"
                        : "justify-center"
                    }`}
                  >
                    {instagramUrl && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                        <FaInstagram size={20} />
                      </div>
                    )}

                    {youtubeUrl && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                        <FaYoutube size={20} />
                      </div>
                    )}

                    {xUrl && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                        <FaXTwitter size={19} />
                      </div>
                    )}
                  </div>
                )}

                <div className={`mt-9 w-full ${getSpacing()}`}>
                  {visibleBlocks.map((block) => (
                    <PublicBlock
                      key={block.id}
                      block={block}
                      siteId={site.id}
                      username={site.username}
                      buttonColor={buttonColor}
                      buttonTextColor={buttonTextColor}
                      buttonStyle={buttonStyle}
                      buttonShadow={buttonShadow}
                      preview
                    />
                  ))}

                  {visibleBlocks.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center">
                      <p
                        className="text-sm opacity-50"
                        style={{ color: buttonTextColor }}
                      >
                        No links available right now.
                      </p>
                    </div>
                  )}
                </div>

                <p
                  className="mt-14 pb-5 text-center text-[11px] font-medium tracking-wide opacity-40"
                  style={{ color: buttonTextColor }}
                >
                  Powered by MusePage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}