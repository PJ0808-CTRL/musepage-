"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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

const buttonStyles = [
  "rounded",
  "square",
  "pill",
];

const backgroundTypes = [
  "solid",
  "gradient",
  "image",
];

const gradientDirections = [
  {
    label: "Top → Bottom",
    value: "180deg",
  },
  {
    label: "Left → Right",
    value: "90deg",
  },
  {
    label: "Diagonal",
    value: "135deg",
  },
  {
    label: "Bottom → Top",
    value: "0deg",
  },
];

const headerPositions = [
  {
    label: "Top",
    value: "top",
  },
  {
    label: "Center",
    value: "center",
  },
  {
    label: "Bottom",
    value: "bottom",
  },
];

type Tab =
  | "themes"
  | "design"
  | "profile"
  | "seo";

type UploadType =
  | "avatar"
  | "background"
  | "og"
  | "twitter"
  | "favicon";

export default function CustomizePage() {
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [xUrl, setXUrl] = useState("");

  const [backgroundColor, setBackgroundColor] =
    useState("#000000");

  const [buttonColor, setButtonColor] =
    useState("#ffffff");

  const [buttonTextColor, setButtonTextColor] =
    useState("#000000");

  const [font, setFont] = useState("Inter");

  const [buttonStyle, setButtonStyle] =
    useState("rounded");

  const [buttonShadow, setButtonShadow] =
    useState(true);

  const [pageWidth, setPageWidth] =
    useState("normal");

  const [spacing, setSpacing] =
    useState("normal");

  /* =====================================================
     HEADER
  ===================================================== */

  const [headerPosition, setHeaderPosition] =
    useState("center");

  /* =====================================================
     BACKGROUND
  ===================================================== */

  const [backgroundType, setBackgroundType] =
    useState("solid");

  const [gradientColor1, setGradientColor1] =
    useState("#09090b");

  const [gradientColor2, setGradientColor2] =
    useState("#18181b");

  const [gradientDirection, setGradientDirection] =
    useState("135deg");

  const [backgroundImageUrl, setBackgroundImageUrl] =
    useState("");

  const [backgroundOverlay, setBackgroundOverlay] =
    useState(0);

  const [backgroundPosition, setBackgroundPosition] =
    useState("center");

  /* =====================================================
     SEO
  ===================================================== */

  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] =
    useState("");
  const [seoKeywords, setSeoKeywords] =
    useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [twitterImageUrl, setTwitterImageUrl] =
    useState("");
  const [faviconUrl, setFaviconUrl] =
    useState("");
  const [allowIndexing, setAllowIndexing] =
    useState(true);
  const [canonicalUrl, setCanonicalUrl] =
    useState("");

  /* =====================================================
     UI
  ===================================================== */

  const [activeTab, setActiveTab] =
    useState<Tab>("themes");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState<UploadType | null>(null);

  /* =====================================================
     LOAD SITE
  ===================================================== */

  useEffect(() => {
    loadSite();
  }, []);

  async function loadSite() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      data: siteData,
      error,
    } = await supabase
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

    const {
      data: linkData,
      error: linksError,
    } = await supabase
      .from("links")
      .select("*")
      .eq("site_id", siteData.id)
      .eq("active", true)
      .order("position", {
        ascending: true,
      });

    if (linksError) {
      console.error(
        "LINK LOAD ERROR:",
        linksError
      );
    }

    setSite(siteData);

    setBio(siteData.bio || "");
    setAvatarUrl(siteData.avatar_url || "");

    setInstagramUrl(
      siteData.instagram_url || ""
    );

    setYoutubeUrl(
      siteData.youtube_url || ""
    );

    setXUrl(siteData.x_url || "");

    setBackgroundColor(
      siteData.background_color || "#000000"
    );

    setButtonColor(
      siteData.button_color || "#ffffff"
    );

    setButtonTextColor(
      siteData.button_text_color || "#000000"
    );

    setFont(siteData.font || "Inter");

    setButtonStyle(
      siteData.button_style || "rounded"
    );

    setButtonShadow(
      siteData.button_shadow ?? true
    );

    setPageWidth(
      siteData.page_width || "normal"
    );

    setSpacing(
      siteData.spacing || "normal"
    );

    setHeaderPosition(
      siteData.header_position || "center"
    );

    setBackgroundType(
      siteData.background_type || "solid"
    );

    setGradientColor1(
      siteData.gradient_color_1 ||
        siteData.background_color ||
        "#09090b"
    );

    setGradientColor2(
      siteData.gradient_color_2 ||
        "#18181b"
    );

    setGradientDirection(
      siteData.gradient_direction ||
        "135deg"
    );

    setBackgroundImageUrl(
      siteData.background_image_url || ""
    );

    setBackgroundOverlay(
      siteData.background_overlay ?? 0
    );

    setBackgroundPosition(
      siteData.background_position ||
        "center"
    );

    setSeoTitle(
      siteData.seo_title || ""
    );

    setMetaDescription(
      siteData.meta_description || ""
    );

    setSeoKeywords(
      siteData.seo_keywords || ""
    );

    setOgImageUrl(
      siteData.og_image_url || ""
    );

    setTwitterImageUrl(
      siteData.twitter_image_url || ""
    );

    setFaviconUrl(
      siteData.favicon_url || ""
    );

    setAllowIndexing(
      siteData.allow_indexing ?? true
    );

    setCanonicalUrl(
      siteData.canonical_url || ""
    );

    setLinks(linkData || []);

    setLoading(false);
  }

  /* =====================================================
     THEME
  ===================================================== */

  function applyTheme(theme: Theme) {
    setBackgroundColor(theme.background);

    setButtonColor(theme.button);

    setButtonTextColor(
      theme.buttonText
    );

    setBackgroundType("solid");

    setGradientColor1(
      theme.background
    );

    setGradientColor2(
      theme.background
    );

    setBackgroundImageUrl("");

    setBackgroundOverlay(0);
  }

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  async function uploadImage(
    file: File,
    type: UploadType
  ) {
    if (!site) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Image must be smaller than 10MB."
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You are not logged in.");
      return;
    }

    const extension =
      file.name.split(".").pop() ||
      "jpg";

    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extension}`;

    let folder = "avatars";

    if (type === "background") {
      folder = "backgrounds";
    }

    if (type === "og") {
      folder = "og-images";
    }

    if (type === "twitter") {
      folder = "twitter-images";
    }

    if (type === "favicon") {
      folder = "favicons";
    }

    const path =
      `${folder}/${user.id}/${fileName}`;

    try {
      setUploading(type);

      const {
        error: uploadError,
      } = await supabase.storage
        .from("site-assets")
        .upload(
          path,
          file,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "UPLOAD ERROR:",
          uploadError
        );

        alert(
          uploadError.message
        );

        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("site-assets")
        .getPublicUrl(path);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        alert(
          "Could not generate image URL."
        );

        return;
      }

      if (type === "avatar") {
        setAvatarUrl(publicUrl);
      }

      if (type === "background") {
        setBackgroundImageUrl(
          publicUrl
        );

        setBackgroundType(
          "image"
        );
      }

      if (type === "og") {
        setOgImageUrl(
          publicUrl
        );
      }

      if (type === "twitter") {
        setTwitterImageUrl(
          publicUrl
        );
      }

      if (type === "favicon") {
        setFaviconUrl(
          publicUrl
        );
      }
    } catch (error) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      alert(
        "Something went wrong while uploading the image."
      );
    } finally {
      setUploading(null);
    }
  }

  /* =====================================================
     DELETE STORAGE IMAGE
  ===================================================== */

  async function deleteStorageImage(
    publicUrl: string,
    type: UploadType
  ) {
    if (!publicUrl) return;

    try {
      const marker =
        "/storage/v1/object/public/site-assets/";

      const index =
        publicUrl.indexOf(marker);

      if (index !== -1) {
        const path =
          publicUrl.substring(
            index + marker.length
          );

        await supabase.storage
          .from("site-assets")
          .remove([path]);
      }
    } catch (error) {
      console.error(
        "DELETE IMAGE ERROR:",
        error
      );
    }

    if (type === "avatar") {
      setAvatarUrl("");
    }

    if (type === "background") {
      setBackgroundImageUrl("");
    }

    if (type === "og") {
      setOgImageUrl("");
    }

    if (type === "twitter") {
      setTwitterImageUrl("");
    }

    if (type === "favicon") {
      setFaviconUrl("");
    }
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function saveChanges() {
    if (!site) return;

    setSaving(true);

    const updates = {
      bio,

      avatar_url:
        avatarUrl || null,

      instagram_url:
        instagramUrl || null,

      youtube_url:
        youtubeUrl || null,

      x_url:
        xUrl || null,

      background_color:
        backgroundColor,

      button_color:
        buttonColor,

      button_text_color:
        buttonTextColor,

      font,

      button_style:
        buttonStyle,

      button_shadow:
        buttonShadow,

      page_width:
        pageWidth,

      spacing,

      header_position:
        headerPosition,

      background_type:
        backgroundType,

      gradient_color_1:
        gradientColor1,

      gradient_color_2:
        gradientColor2,

      gradient_direction:
        gradientDirection,

      background_image_url:
        backgroundImageUrl || null,

      background_overlay:
        backgroundOverlay,

      background_position:
        backgroundPosition,

      seo_title:
        seoTitle || null,

      meta_description:
        metaDescription || null,

      seo_keywords:
        seoKeywords || null,

      og_image_url:
        ogImageUrl || null,

      twitter_image_url:
        twitterImageUrl || null,

      favicon_url:
        faviconUrl || null,

      allow_indexing:
        allowIndexing,

      canonical_url:
        canonicalUrl || null,
    };

    const {
      error,
    } = await supabase
      .from("sites")
      .update(updates)
      .eq("id", site.id);

    if (error) {
      console.error(
        "SAVE ERROR:",
        error
      );

      alert(error.message);

      setSaving(false);

      return;
    }

    setSite({
      ...site,
      ...updates,
    });

    setSaving(false);

    alert("Changes saved!");
  }

  /* =====================================================
     BUTTON RADIUS
  ===================================================== */

  function getButtonRadius() {
    if (buttonStyle === "pill") {
      return "9999px";
    }

    if (buttonStyle === "square") {
      return "4px";
    }

    return "14px";
  }

  /* =====================================================
     PAGE WIDTH
  ===================================================== */

  function getPageWidth() {
    if (pageWidth === "compact") {
      return "280px";
    }

    if (pageWidth === "wide") {
      return "400px";
    }

    return "350px";
  }

  /* =====================================================
     SPACING
  ===================================================== */

  function getSpacing() {
    if (spacing === "tight") {
      return "space-y-2";
    }

    if (spacing === "loose") {
      return "space-y-5";
    }

    return "space-y-3";
  }

  /* =====================================================
     HEADER ALIGNMENT
  ===================================================== */

  function getHeaderAlignment() {
    if (headerPosition === "top") {
      return "justify-start";
    }

    if (headerPosition === "bottom") {
      return "justify-end";
    }

    return "justify-center";
  }

  /* =====================================================
     TEXT COLOR
  ===================================================== */

  function getTextColor() {
    if (
      backgroundType === "solid" &&
      backgroundColor.toLowerCase() ===
        "#f5f5f5"
    ) {
      return "#111111";
    }

    return "#ffffff";
  }

  /* =====================================================
     BACKGROUND PREVIEW
  ===================================================== */

  function getBackgroundStyle(): React.CSSProperties {
    if (
      backgroundType ===
      "gradient"
    ) {
      return {
        background:
          `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`,
      };
    }

    if (
      backgroundType ===
        "image" &&
      backgroundImageUrl
    ) {
      const overlay =
        backgroundOverlay /
        100;

      return {
        backgroundColor:
          backgroundColor,

        backgroundImage:
          `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url("${backgroundImageUrl}")`,

        backgroundSize:
          "cover",

        backgroundPosition:
          backgroundPosition,

        backgroundRepeat:
          "no-repeat",
      };
    }

    return {
      backgroundColor:
        backgroundColor,
    };
  }

  /* =====================================================
     IMAGE UPLOAD BOX
  ===================================================== */

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
    const isUploading =
      uploading === type;

    return (
      <div>
        <label className="mb-2 block text-sm text-gray-400">
          {label}
        </label>

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
          className={`
            flex cursor-pointer flex-col
            items-center justify-center
            rounded-2xl border-2 border-dashed
            px-5 py-7 text-center transition
            ${
              isUploading
                ? "cursor-wait border-violet-500/40 bg-violet-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5"
            }
          `}
        >
          {isUploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-500" />

              <p className="mt-3 text-sm text-gray-300">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl">
                {type === "favicon"
                  ? "🌐"
                  : "🖼️"}
              </div>

              <p className="mt-3 text-sm font-medium">
                {value
                  ? "Replace image"
                  : "Choose an image"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {description}
              </p>
            </>
          )}

          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            className="hidden"
            onChange={(e) => {
              const file =
                e.target.files?.[0];

              if (file) {
                uploadImage(
                  file,
                  type
                );
              }

              e.currentTarget.value =
                "";
            }}
          />
        </label>
      </div>
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        Loading theme builder...
      </main>
    );
  }

  if (!site) {
    return null;
  }

  const previewTextColor =
    getTextColor();

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#050505] text-white lg:grid-cols-[440px_1fr]">

      {/* =================================================
          LEFT SIDEBAR
      ================================================= */}

      <section className="border-r border-white/10 bg-[#09090b]">
        <div className="sticky top-0 flex max-h-screen flex-col">

          {/* HEADER */}

          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center justify-between gap-4">

              <div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard"
                    )
                  }
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  ← Dashboard
                </button>

                <h1 className="mt-3 text-2xl font-bold">
                  Theme Builder
                </h1>
              </div>

              <button
                type="button"
                onClick={
                  saveChanges
                }
                disabled={
                  saving ||
                  uploading !== null
                }
                className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Design your page exactly the way you want.
            </p>
          </div>

          {/* TABS */}

          <div className="border-b border-white/10 px-6">
            <div className="flex gap-5 overflow-x-auto">

              {[
                {
                  id: "themes",
                  label: "Themes",
                },
                {
                  id: "design",
                  label: "Design",
                },
                {
                  id: "profile",
                  label: "Profile",
                },
                {
                  id: "seo",
                  label: "SEO",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as Tab
                    )
                  }
                  className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium ${
                    activeTab ===
                    tab.id
                      ? "border-violet-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

            </div>
          </div>

          {/* SCROLL AREA */}

          <div className="overflow-y-auto px-6 py-7">

            {/* =================================================
                THEMES
            ================================================= */}

            {activeTab ===
              "themes" && (
              <div>
                <h2 className="text-lg font-semibold">
                  Choose a theme
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Start with a preset and customize it further.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {themes.map(
                    (theme) => (
                      <button
                        key={
                          theme.name
                        }
                        type="button"
                        onClick={() =>
                          applyTheme(
                            theme
                          )
                        }
                        className="group overflow-hidden rounded-2xl border border-white/10 text-left transition hover:-translate-y-0.5 hover:border-violet-500"
                      >
                        <div
                          className="h-24 p-4"
                          style={{
                            background:
                              theme.preview,
                          }}
                        >
                          <div
                            className="mx-auto h-3 w-16 rounded-full"
                            style={{
                              backgroundColor:
                                theme.button,
                            }}
                          />

                          <div className="mx-auto mt-3 h-2 w-24 rounded-full bg-white/20" />

                          <div className="mx-auto mt-2 h-2 w-20 rounded-full bg-white/10" />
                        </div>

                        <div className="bg-white/[0.03] px-4 py-3">
                          <p className="text-sm font-medium">
                            {
                              theme.name
                            }
                          </p>

                          <div className="mt-2 flex gap-1.5">
                            <span
                              className="h-4 w-4 rounded-full border border-white/10"
                              style={{
                                backgroundColor:
                                  theme.background,
                              }}
                            />

                            <span
                              className="h-4 w-4 rounded-full border border-white/10"
                              style={{
                                backgroundColor:
                                  theme.button,
                              }}
                            />

                            <span
                              className="h-4 w-4 rounded-full border border-white/10"
                              style={{
                                backgroundColor:
                                  theme.buttonText,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>

                <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-sm font-medium text-violet-300">
                    Tip
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Pick a theme first, then use the Design tab to make it completely yours.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                DESIGN
            ================================================= */}

            {activeTab ===
              "design" && (
              <div className="space-y-8">

                {/* BACKGROUND */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Background
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose a solid color, gradient, or image.
                  </p>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Background type
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {backgroundTypes.map(
                        (type) => (
                          <button
                            key={
                              type
                            }
                            type="button"
                            onClick={() =>
                              setBackgroundType(
                                type
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                              backgroundType ===
                              type
                                ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                : "border-white/10 text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            {type}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* SOLID */}

                  {backgroundType ===
                    "solid" && (
                    <div className="mt-5">
                      <label className="mb-2 block text-sm text-gray-400">
                        Background color
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={
                            backgroundColor
                          }
                          onChange={(e) =>
                            setBackgroundColor(
                              e.target.value
                            )
                          }
                          className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                        />

                        <input
                          value={
                            backgroundColor
                          }
                          onChange={(e) =>
                            setBackgroundColor(
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* GRADIENT */}

                  {backgroundType ===
                    "gradient" && (
                    <div className="mt-5 space-y-5">

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Gradient color 1
                        </label>

                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={
                              gradientColor1
                            }
                            onChange={(e) =>
                              setGradientColor1(
                                e.target.value
                              )
                            }
                            className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                          />

                          <input
                            value={
                              gradientColor1
                            }
                            onChange={(e) =>
                              setGradientColor1(
                                e.target.value
                              )
                            }
                            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Gradient color 2
                        </label>

                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={
                              gradientColor2
                            }
                            onChange={(e) =>
                              setGradientColor2(
                                e.target.value
                              )
                            }
                            className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                          />

                          <input
                            value={
                              gradientColor2
                            }
                            onChange={(e) =>
                              setGradientColor2(
                                e.target.value
                              )
                            }
                            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Gradient direction
                        </label>

                        <select
                          value={
                            gradientDirection
                          }
                          onChange={(e) =>
                            setGradientDirection(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          {gradientDirections.map(
                            (
                              direction
                            ) => (
                              <option
                                key={
                                  direction.value
                                }
                                value={
                                  direction.value
                                }
                                className="bg-black"
                              >
                                {
                                  direction.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                    </div>
                  )}

                  {/* IMAGE */}

                  {backgroundType ===
                    "image" && (
                    <div className="mt-5 space-y-5">

                      <ImageUploadBox
                        type="background"
                        label="Background image"
                        description="JPG, PNG, WEBP up to 10MB"
                        value={
                          backgroundImageUrl
                        }
                        onRemove={() =>
                          deleteStorageImage(
                            backgroundImageUrl,
                            "background"
                          )
                        }
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-400">
                            Dark overlay
                          </label>

                          <span className="text-xs text-gray-500">
                            {
                              backgroundOverlay
                            }
                            %
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={
                            backgroundOverlay
                          }
                          onChange={(e) =>
                            setBackgroundOverlay(
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="mt-3 w-full accent-violet-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Image position
                        </label>

                        <select
                          value={
                            backgroundPosition
                          }
                          onChange={(e) =>
                            setBackgroundPosition(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <option
                            value="center"
                            className="bg-black"
                          >
                            Center
                          </option>

                          <option
                            value="top"
                            className="bg-black"
                          >
                            Top
                          </option>

                          <option
                            value="bottom"
                            className="bg-black"
                          >
                            Bottom
                          </option>

                          <option
                            value="left"
                            className="bg-black"
                          >
                            Left
                          </option>

                          <option
                            value="right"
                            className="bg-black"
                          >
                            Right
                          </option>
                        </select>
                      </div>

                    </div>
                  )}
                </div>

                {/* COLORS */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Colors
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Control the colors of your buttons.
                  </p>

                  <div className="mt-5 space-y-5">

                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Button
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={
                            buttonColor
                          }
                          onChange={(e) =>
                            setButtonColor(
                              e.target.value
                            )
                          }
                          className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                        />

                        <input
                          value={
                            buttonColor
                          }
                          onChange={(e) =>
                            setButtonColor(
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-400">
                        Button text
                      </label>

                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={
                            buttonTextColor
                          }
                          onChange={(e) =>
                            setButtonTextColor(
                              e.target.value
                            )
                          }
                          className="h-12 w-16 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                        />

                        <input
                          value={
                            buttonTextColor
                          }
                          onChange={(e) =>
                            setButtonTextColor(
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* TYPOGRAPHY */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Typography
                  </h2>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Font
                    </label>

                    <select
                      value={font}
                      onChange={(e) =>
                        setFont(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      {fonts.map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                            className="bg-black"
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* BUTTONS */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Buttons
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose how your links should look.
                  </p>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Shape
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {buttonStyles.map(
                        (style) => (
                          <button
                            key={
                              style
                            }
                            type="button"
                            onClick={() =>
                              setButtonStyle(
                                style
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                              buttonStyle ===
                              style
                                ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                : "border-white/10 text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            {style}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setButtonShadow(
                        !buttonShadow
                      )
                    }
                    className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        Button shadow
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Add depth to your buttons
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                        buttonShadow
                          ? "bg-violet-500"
                          : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          buttonShadow
                            ? "translate-x-5"
                            : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* HEADER POSITION */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Header position
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose where your profile header appears.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {headerPositions.map(
                      (item) => (
                        <button
                          key={
                            item.value
                          }
                          type="button"
                          onClick={() =>
                            setHeaderPosition(
                              item.value
                            )
                          }
                          className={`rounded-xl border px-3 py-3 text-sm ${
                            headerPosition ===
                            item.value
                              ? "border-violet-500 bg-violet-500/10 text-violet-400"
                              : "border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* LAYOUT */}

                <div>
                  <h2 className="text-lg font-semibold">
                    Layout
                  </h2>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Page width
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "compact",
                        "normal",
                        "wide",
                      ].map(
                        (item) => (
                          <button
                            key={
                              item
                            }
                            type="button"
                            onClick={() =>
                              setPageWidth(
                                item
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                              pageWidth ===
                              item
                                ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                : "border-white/10 text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-400">
                      Link spacing
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "tight",
                        "normal",
                        "loose",
                      ].map(
                        (item) => (
                          <button
                            key={
                              item
                            }
                            type="button"
                            onClick={() =>
                              setSpacing(
                                item
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm capitalize ${
                              spacing ===
                              item
                                ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                : "border-white/10 text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                PROFILE
            ================================================= */}

            {activeTab ===
              "profile" && (
              <div>
                <h2 className="text-lg font-semibold">
                  Profile
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Customize the information visitors see.
                </p>

                <div className="mt-6 space-y-6">

                  {/* BIO */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Bio
                    </label>

                    <textarea
                      value={bio}
                      onChange={(e) =>
                        setBio(
                          e.target.value
                        )
                      }
                      placeholder="Tell people about yourself..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* PROFILE IMAGE */}

                  <div>
                    <ImageUploadBox
                      type="avatar"
                      label="Profile picture"
                      description="JPG, PNG, WEBP up to 10MB"
                      value={
                        avatarUrl
                      }
                      onRemove={() =>
                        deleteStorageImage(
                          avatarUrl,
                          "avatar"
                        )
                      }
                    />
                  </div>

                  {/* INSTAGRAM */}

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaInstagram />
                      Instagram
                    </label>

                    <input
                      value={
                        instagramUrl
                      }
                      onChange={(e) =>
                        setInstagramUrl(
                          e.target.value
                        )
                      }
                      placeholder="https://instagram.com/username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* YOUTUBE */}

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaYoutube />
                      YouTube
                    </label>

                    <input
                      value={
                        youtubeUrl
                      }
                      onChange={(e) =>
                        setYoutubeUrl(
                          e.target.value
                        )
                      }
                      placeholder="https://youtube.com/@username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* X */}

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <FaXTwitter />
                      X
                    </label>

                    <input
                      value={xUrl}
                      onChange={(e) =>
                        setXUrl(
                          e.target.value
                        )
                      }
                      placeholder="https://x.com/username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* =================================================
                SEO
            ================================================= */}

            {activeTab ===
              "seo" && (
              <div className="space-y-8">

                <div>
                  <h2 className="text-lg font-semibold">
                    SEO
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Control how your profile appears in search engines and when shared online.
                  </p>
                </div>

                {/* BASIC SEO */}

                <div className="space-y-6">

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      SEO Title
                    </label>

                    <input
                      value={
                        seoTitle
                      }
                      onChange={(e) =>
                        setSeoTitle(
                          e.target.value
                        )
                      }
                      maxLength={
                        60
                      }
                      placeholder={`@${site.username} | Creator`}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />

                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                      <span>
                        Recommended: under 60 characters
                      </span>

                      <span>
                        {
                          seoTitle.length
                        }
                        /60
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Meta Description
                    </label>

                    <textarea
                      value={
                        metaDescription
                      }
                      onChange={(e) =>
                        setMetaDescription(
                          e.target.value
                        )
                      }
                      maxLength={
                        160
                      }
                      rows={4}
                      placeholder="Tell search engines what your profile is about..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-6 outline-none focus:border-violet-500"
                    />

                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                      <span>
                        Recommended: around 150–160 characters
                      </span>

                      <span>
                        {
                          metaDescription.length
                        }
                        /160
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      SEO Keywords
                    </label>

                    <input
                      value={
                        seoKeywords
                      }
                      onChange={(e) =>
                        setSeoKeywords(
                          e.target.value
                        )
                      }
                      placeholder="finance, investing, creator, business"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
                    />

                    <p className="mt-2 text-xs leading-5 text-gray-600">
                      Separate keywords with commas. This is optional and modern search engines may largely ignore this field.
                    </p>
                  </div>

                </div>

                {/* GOOGLE PREVIEW */}

                <div>
                  <h3 className="text-sm font-semibold text-gray-300">
                    Search Preview
                  </h3>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="truncate text-lg text-blue-400">
                      {seoTitle ||
                        `@${site.username}`}
                    </p>

                    <p className="mt-1 text-xs text-green-500">
                      yoursite.com/@
                      {
                        site.username
                      }
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-400">
                      {metaDescription ||
                        "Your profile description will appear here in search results."}
                    </p>

                  </div>
                </div>

                {/* OG IMAGE */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Social Sharing Image
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      The image platforms can use when someone shares your profile link.
                    </p>
                  </div>

                  <ImageUploadBox
                    type="og"
                    label="OG Image"
                    description="Recommended 1200×630px • JPG, PNG, WEBP up to 10MB"
                    value={
                      ogImageUrl
                    }
                    onRemove={() =>
                      deleteStorageImage(
                        ogImageUrl,
                        "og"
                      )
                    }
                  />
                </div>

                {/* TWITTER */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Twitter / X Card Image
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Image used for your profile's X/Twitter link preview.
                    </p>
                  </div>

                  <ImageUploadBox
                    type="twitter"
                    label="Twitter/X Card Image"
                    description="Recommended 1200×628px • JPG, PNG, WEBP up to 10MB"
                    value={
                      twitterImageUrl
                    }
                    onRemove={() =>
                      deleteStorageImage(
                        twitterImageUrl,
                        "twitter"
                      )
                    }
                  />
                </div>

                {/* FAVICON */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Favicon
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      The small icon displayed in browser tabs and bookmarks.
                    </p>
                  </div>

                  <ImageUploadBox
                    type="favicon"
                    label="Favicon"
                    description="PNG, ICO, WEBP • Square image recommended"
                    value={
                      faviconUrl
                    }
                    onRemove={() =>
                      deleteStorageImage(
                        faviconUrl,
                        "favicon"
                      )
                    }
                    accept="image/png,image/x-icon,image/webp,image/svg+xml"
                  />
                </div>

                {/* INDEXING */}

                <div>
                  <h3 className="text-sm font-semibold text-gray-300">
                    Search Engine Indexing
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Choose whether search engines such as Google should be allowed to index your profile.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setAllowIndexing(
                        !allowIndexing
                      )
                    }
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
                        allowIndexing
                          ? "bg-violet-500"
                          : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          allowIndexing
                            ? "translate-x-5"
                            : ""
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`mt-3 rounded-xl border p-3 text-xs leading-5 ${
                      allowIndexing
                        ? "border-green-500/20 bg-green-500/5 text-green-300"
                        : "border-yellow-500/20 bg-yellow-500/5 text-yellow-300"
                    }`}
                  >
                    {allowIndexing
                      ? "✓ Your profile can be discovered through search engines."
                      : "⚠ Your profile will request that search engines do not index it."}
                  </div>
                </div>

                {/* CANONICAL */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Canonical URL
                  </label>

                  <input
                    value={
                      canonicalUrl
                    }
                    onChange={(e) =>
                      setCanonicalUrl(
                        e.target.value
                      )
                    }
                    placeholder={`https://yourdomain.com/@${site.username}`}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm outline-none focus:border-violet-500"
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Optional. Use this when you want search engines to treat another URL as the primary version of this profile.
                  </p>
                </div>

                {/* SUMMARY */}

                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                      🔍
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-violet-200">
                        SEO settings
                      </h3>

                      <p className="mt-1 text-xs text-violet-300/60">
                        Your settings are saved with your profile.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Title
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-300">
                        {seoTitle ||
                          "Not set"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Indexing
                      </p>

                      <p className="mt-1 text-xs text-gray-300">
                        {allowIndexing
                          ? "Allowed"
                          : "Blocked"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        OG Image
                      </p>

                      <p className="mt-1 text-xs text-gray-300">
                        {ogImageUrl
                          ? "Uploaded"
                          : "Not set"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Favicon
                      </p>

                      <p className="mt-1 text-xs text-gray-300">
                        {faviconUrl
                          ? "Uploaded"
                          : "Not set"}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </section>

      {/* =================================================
          LIVE PREVIEW
      ================================================= */}

      <section className="flex min-h-screen items-center justify-center bg-[#050505] p-6 lg:p-12">

        <div className="w-full">

          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

            <span className="text-sm text-gray-500">
              Live preview
            </span>
          </div>

          <div className="flex justify-center">

            <div
              className="relative flex min-h-[700px] overflow-hidden rounded-[32px] border border-white/10 shadow-2xl transition-all duration-300"
              style={{
                width:
                  getPageWidth(),

                maxWidth:
                  "100%",

                fontFamily:
                  font,

                ...getBackgroundStyle(),
              }}
            >

              {/* =================================================
                  PREVIEW CONTENT
              ================================================= */}

              <div
                className={`flex w-full flex-col px-6 ${
                  headerPosition ===
                  "top"
                    ? "justify-start"
                    : headerPosition ===
                        "bottom"
                      ? "justify-end"
                      : "justify-center"
                } ${
                  spacing ===
                  "loose"
                    ? "py-14"
                    : spacing ===
                        "tight"
                      ? "py-8"
                      : "py-10"
                }`}
              >

                {/* HEADER */}

                <div
                  className={`flex w-full flex-col items-center ${getHeaderAlignment()}`}
                >

                  {/* AVATAR */}

                  <div className="flex justify-center">

                    {avatarUrl ? (
                      <img
                        src={
                          avatarUrl
                        }
                        alt=""
                        className="h-24 w-24 rounded-full object-cover shadow-xl"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl">
                        👤
                      </div>
                    )}

                  </div>

                  {/* USERNAME */}

                  <h2
                    className="mt-5 text-center text-xl font-bold"
                    style={{
                      color:
                        previewTextColor,
                    }}
                  >
                    @{site.username}
                  </h2>

                  {/* BIO */}

                  {bio && (
                    <p
                      className="mt-2 max-w-[300px] text-center text-sm"
                      style={{
                        color:
                          previewTextColor,
                        opacity:
                          0.72,
                      }}
                    >
                      {bio}
                    </p>
                  )}

                  {/* SHARE */}

                  <div className="mt-5 flex justify-center">

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur"
                      style={{
                        background:
                          "rgba(255,255,255,0.10)",
                        color:
                          previewTextColor,
                      }}
                    >

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle
                          cx="18"
                          cy="5"
                          r="3"
                        />

                        <circle
                          cx="6"
                          cy="12"
                          r="3"
                        />

                        <circle
                          cx="18"
                          cy="19"
                          r="3"
                        />

                        <line
                          x1="8.59"
                          y1="13.51"
                          x2="15.42"
                          y2="17.49"
                        />

                        <line
                          x1="15.41"
                          y1="6.51"
                          x2="8.59"
                          y2="10.49"
                        />
                      </svg>

                      Share
                    </button>

                  </div>

                  {/* SOCIALS */}

                  {(instagramUrl ||
                    youtubeUrl ||
                    xUrl) && (
                    <div className="mt-6 flex justify-center gap-4">

                      {instagramUrl && (
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background:
                              "rgba(255,255,255,0.10)",
                            color:
                              previewTextColor,
                          }}
                        >
                          <FaInstagram
                            size={
                              20
                            }
                          />
                        </div>
                      )}

                      {youtubeUrl && (
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background:
                              "rgba(255,255,255,0.10)",
                            color:
                              previewTextColor,
                          }}
                        >
                          <FaYoutube
                            size={
                              20
                            }
                          />
                        </div>
                      )}

                      {xUrl && (
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background:
                              "rgba(255,255,255,0.10)",
                            color:
                              previewTextColor,
                          }}
                        >
                          <FaXTwitter
                            size={
                              19
                            }
                          />
                        </div>
                      )}

                    </div>
                  )}

                </div>

                {/* LINKS */}

                <div
                  className={`mt-8 w-full ${getSpacing()}`}
                >

                  {links.map(
                    (link) => (
                      <div
                        key={
                          link.id
                        }
                        className="w-full px-5 py-4 text-center text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          backgroundColor:
                            buttonColor,

                          color:
                            buttonTextColor,

                          borderRadius:
                            getButtonRadius(),

                          boxShadow:
                            buttonShadow
                              ? "0 10px 30px rgba(0,0,0,0.25)"
                              : "none",
                        }}
                      >
                        {
                          link.title
                        }
                      </div>
                    )
                  )}

                  {links.length ===
                    0 && (
                    <p
                      className="py-10 text-center text-sm"
                      style={{
                        color:
                          previewTextColor,
                        opacity:
                          0.5,
                      }}
                    >
                      Your links will appear here.
                    </p>
                  )}

                </div>

                {/* FOOTER */}

                <p
                  className="mt-8 text-center text-[10px]"
                  style={{
                    color:
                      previewTextColor,
                    opacity:
                      0.3,
                  }}
                >
                  Powered by your platform
                </p>

              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}