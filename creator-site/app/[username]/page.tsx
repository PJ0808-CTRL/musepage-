import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase-server";

import ShareButton from "./ShareButton";
import { FaInstagram, FaYoutube } from "react-icons/fa";

import SocialAnalyticsLink from "@/app/components/SocialAnalyticsLink";
import PublicBlock from "@/app/components/PublicBlock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    username: string;
  }>;
};

type LinkItem = {
  id: string;
  site_id: string;

  title: string;
  url: string;

  active: boolean;
  position: number;

  featured: boolean | null;
  type?: string | null;

  image_url?: string | null;
  description?: string | null;
  embed_url?: string | null;
  email?: string | null;

  schedule_start: string | null;
  schedule_end: string | null;

  open_new_tab?: boolean | null;
};

type Site = {
  id: string;
  username: string;
  published?: boolean | null;

  bio: string | null;
  avatar_url: string | null;

  instagram_url: string | null;
  youtube_url: string | null;
  x_url: string | null;

  background_color: string | null;

  button_color: string | null;
  button_text_color: string | null;

  font: string | null;
  button_style: string | null;
  button_shadow: boolean | null;

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

function getBaseSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
}

function getGeneratedProfileUrl(username: string) {
  const baseUrl = getBaseSiteUrl();
  return baseUrl ? `${baseUrl}/${username}` : undefined;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { username } = await params;

  const supabase = await createClient();

  const { data: siteData, error } = await supabase
    .from("sites")
    .select("*")
    .eq("username", username)
    .eq("published", true)
    .maybeSingle();

  if (error || !siteData) {
    return {
      title: "Profile Not Found",
      description: "This profile could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const site = siteData as Site;

  const title = site.seo_title?.trim() || `@${site.username}`;

  const description =
    site.meta_description?.trim() ||
    site.bio?.trim() ||
    `Check out @${site.username}'s links and social profiles.`;

  const keywords = site.seo_keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const generatedProfileUrl = getGeneratedProfileUrl(site.username);

  const canonicalUrl =
    site.canonical_url?.trim() || generatedProfileUrl;

  const ogImage =
    site.og_image_url?.trim() ||
    site.avatar_url?.trim() ||
    undefined;

  const twitterImage =
    site.twitter_image_url?.trim() ||
    ogImage ||
    undefined;

  const shouldIndex = site.allow_indexing !== false;

  return {
    title,
    description,

    ...(keywords && keywords.length > 0
      ? {
          keywords,
        }
      : {}),

    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),

    openGraph: {
      title,
      description,
      type: "profile",

      ...(canonicalUrl
        ? {
            url: canonicalUrl,
          }
        : {}),

      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: `@${site.username}`,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: twitterImage ? "summary_large_image" : "summary",
      title,
      description,

      ...(twitterImage
        ? {
            images: [twitterImage],
          }
        : {}),
    },

    ...(site.favicon_url?.trim()
      ? {
          icons: {
            icon: site.favicon_url.trim(),
            shortcut: site.favicon_url.trim(),
          },
        }
      : {}),

    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
      },
    },
  };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: siteData, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("username", username)
    .eq("published", true)
    .maybeSingle();

  if (siteError || !siteData) {
    console.error("PUBLIC PROFILE ERROR:", siteError);
    notFound();
  }

  const site = siteData as Site;

  const { error: pageViewError } = await supabase
    .from("page_views")
    .insert({
      site_id: site.id,
    });

  if (pageViewError) {
    console.error("PAGE VIEW ERROR:", pageViewError);
  }

  const { data: linkData, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("site_id", site.id)
    .eq("active", true)
    .order("position", {
      ascending: true,
    });

  if (linksError) {
    console.error("LINKS ERROR:", linksError);
  }

  const now = new Date();

  const visibleBlocks = ((linkData || []) as LinkItem[])
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

  const generatedProfileUrl = getGeneratedProfileUrl(site.username);

  const canonicalUrl =
    site.canonical_url?.trim() || generatedProfileUrl;

  const structuredDataImage =
    site.og_image_url?.trim() ||
    site.avatar_url?.trim() ||
    undefined;

  const sameAs = [
    site.instagram_url?.trim(),
    site.youtube_url?.trim(),
    site.x_url?.trim(),
  ].filter((url): url is string => Boolean(url));

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `@${site.username}`,
    alternateName: site.username,

    ...(site.bio?.trim()
      ? {
          description: site.bio.trim(),
        }
      : {}),

    ...(canonicalUrl
      ? {
          url: canonicalUrl,
        }
      : {}),

    ...(structuredDataImage
      ? {
          image: structuredDataImage,
        }
      : {}),

    ...(sameAs.length > 0
      ? {
          sameAs,
        }
      : {}),
  };

  const jsonLd = JSON.stringify(personSchema).replace(/</g, "\\u003c");

  const buttonRadius =
    site.button_style === "pill"
      ? "9999px"
      : site.button_style === "square"
      ? "4px"
      : "14px";

  const buttonShadow =
    site.button_shadow === false
      ? "none"
      : "0 10px 30px rgba(0,0,0,0.25)";

  const pageWidth =
    site.page_width === "compact"
      ? "360px"
      : site.page_width === "wide"
      ? "620px"
      : "480px";

  const spacingClass =
    site.spacing === "tight"
      ? "space-y-2"
      : site.spacing === "loose"
      ? "space-y-5"
      : "space-y-3";

  const backgroundType = site.background_type || "solid";
  const backgroundColor = site.background_color || "#000000";
  const gradientColor1 = site.gradient_color_1 || "#09090b";
  const gradientColor2 = site.gradient_color_2 || "#18181b";
  const gradientDirection = site.gradient_direction || "135deg";
  const backgroundImageUrl = site.background_image_url || "";

  const backgroundOverlay =
    typeof site.background_overlay === "number"
      ? site.background_overlay
      : 0;

  const backgroundPosition = site.background_position || "center";
  const textColor = site.button_text_color || "#ffffff";

  let backgroundStyle: CSSProperties = {
    backgroundColor,
  };

  if (backgroundType === "gradient") {
    backgroundStyle = {
      backgroundColor: gradientColor1,
      backgroundImage: `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };
  }

  if (backgroundType === "image" && backgroundImageUrl) {
    const overlayOpacity =
      Math.min(Math.max(backgroundOverlay, 0), 100) / 100;

    backgroundStyle = {
      backgroundColor,
      backgroundImage: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url("${backgroundImageUrl}")`,
      backgroundSize: "cover",
      backgroundPosition,
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    };
  }

  const headerPosition = site.header_position || "center";

  const headerAlignment =
    headerPosition === "left"
      ? "items-start text-left"
      : headerPosition === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{
        ...backgroundStyle,
        fontFamily: site.font || "Inter",
        color: textColor,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd,
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            backgroundType === "image"
              ? "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 40%)"
              : "radial-gradient(circle at top, rgba(255,255,255,0.035), transparent 45%)",
        }}
      />

      <div
        className="relative z-10 mx-auto min-h-screen w-full"
        style={{ maxWidth: pageWidth }}
      >
        <div
          className={`flex min-h-screen flex-col px-5 sm:px-6 ${
            site.spacing === "loose"
              ? "py-16"
              : site.spacing === "tight"
              ? "py-8"
              : "py-12"
          }`}
        >
          <div className={`flex w-full flex-col ${headerAlignment}`}>
            <div className="relative">
              {site.avatar_url ? (
                <img
                  src={site.avatar_url}
                  alt={site.username}
                  className="h-24 w-24 rounded-full object-cover shadow-2xl ring-2 ring-white/10 transition duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl shadow-2xl ring-2 ring-white/10 backdrop-blur-xl">
                  👤
                </div>
              )}
            </div>

            <h1
              className="mt-5 text-2xl font-bold tracking-tight"
              style={{ color: textColor }}
            >
              @{site.username}
            </h1>

            {site.bio && (
              <p
                className={`mt-3 max-w-md text-sm leading-6 opacity-75 ${
                  headerPosition === "center" ? "text-center" : ""
                }`}
                style={{ color: textColor }}
              >
                {site.bio}
              </p>
            )}

            <div className="mt-5">
              <ShareButton username={site.username} />
            </div>
          </div>

          {(site.instagram_url || site.youtube_url || site.x_url) && (
            <div
              className={`mt-7 flex items-center gap-3 ${
                headerPosition === "left"
                  ? "justify-start"
                  : headerPosition === "right"
                  ? "justify-end"
                  : "justify-center"
              }`}
            >
              {site.instagram_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="instagram"
                  url={site.instagram_url}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20">
                    <FaInstagram size={20} />
                  </div>
                </SocialAnalyticsLink>
              )}

              {site.youtube_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="youtube"
                  url={site.youtube_url}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20">
                    <FaYoutube size={20} />
                  </div>
                </SocialAnalyticsLink>
              )}

              {site.x_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="x"
                  url={site.x_url}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                    </svg>
                  </div>
                </SocialAnalyticsLink>
              )}
            </div>
          )}

          <div className={`mt-9 w-full ${spacingClass}`}>
            {visibleBlocks.map((block) => (
              <PublicBlock
                key={block.id}
                block={block}
                siteId={site.id}
                username={site.username}
                buttonColor={site.button_color || "#ffffff"}
                buttonTextColor={site.button_text_color || "#000000"}
                buttonStyle={site.button_style || "rounded"}
                buttonShadow={site.button_shadow !== false}
              />
            ))}

            {visibleBlocks.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center backdrop-blur-xl">
                <p
                  className="text-sm opacity-50"
                  style={{ color: textColor }}
                >
                  No links available right now.
                </p>
              </div>
            )}
          </div>

          <div className="mt-14 pb-5 text-center">
            <p
              className="text-[11px] font-medium tracking-wide opacity-40"
              style={{ color: textColor }}
            >
              Powered by MusePage
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


