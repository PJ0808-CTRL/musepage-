import { notFound } from "next/navigation";
import MusePageLogo from "@/app/components/MusePageLogo";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase-server";

import ShareButton from "./ShareButton";
import { FaInstagram, FaYoutube } from "react-icons/fa";

import SocialAnalyticsLink from "@/app/components/SocialAnalyticsLink";
import PublicBlock from "@/app/components/PublicBlock";
import PageViewTracker from "@/app/components/PageViewTracker";

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

  grid_x?: number | null;
  grid_y?: number | null;
  grid_width?: number | null;
  grid_height?: number | null;

  animation?:
    | "none"
    | "pulse"
    | "bounce"
    | "glow"
    | "shake"
    | "spotlight"
    | null;
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

  redirect_enabled?: boolean | null;
  redirect_url?: string | null;

  allow_indexing?: boolean | null;

  canonical_url?: string | null;
};

type PositionedBlock = LinkItem & {
  resolved_x: number;
  resolved_y: number;
  resolved_width: number;
  resolved_height: number;
};

function getBaseSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
}

function getGeneratedProfileUrl(username: string) {
  const baseUrl = getBaseSiteUrl();
  return baseUrl ? `${baseUrl}/${username}` : undefined;
}

function getFaviconUrl(site: Site) {
  const url = site.favicon_url?.trim();
  return url || undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveGridLayout(blocks: LinkItem[]) {
  const hasCustomLayout = blocks.some((block) => {
    const x = block.grid_x ?? 0;
    const y = block.grid_y ?? 0;
    const width = block.grid_width ?? 12;
    const height = block.grid_height ?? 1;

    return x !== 0 || y !== 0 || width !== 12 || height !== 1;
  });

  if (!hasCustomLayout) {
    return {
      hasCustomLayout: false,
      blocks: blocks.map(
        (block, index): PositionedBlock => ({
          ...block,
          resolved_x: 0,
          resolved_y: index,
          resolved_width: 12,
          resolved_height: 1,
        })
      ),
    };
  }

  let fallbackRow =
    blocks.reduce((maxRow, block) => {
      const y = block.grid_y ?? 0;
      const height = block.grid_height ?? 1;
      const isCustom =
        (block.grid_x ?? 0) !== 0 ||
        y !== 0 ||
        (block.grid_width ?? 12) !== 12 ||
        height !== 1;

      return isCustom ? Math.max(maxRow, y + height) : maxRow;
    }, 0) + 1;

  const positioned = blocks.map((block): PositionedBlock => {
    const rawWidth = block.grid_width ?? 12;
    const width = clamp(rawWidth, 1, 12);

    const rawX = block.grid_x ?? 0;
    const x = clamp(rawX, 0, 12 - width);

    const rawHeight = block.grid_height ?? 1;
    const height = clamp(rawHeight, 1, 12);

    const isDefault =
      (block.grid_x ?? 0) === 0 &&
      (block.grid_y ?? 0) === 0 &&
      (block.grid_width ?? 12) === 12 &&
      (block.grid_height ?? 1) === 1;

    if (isDefault) {
      const result = {
        ...block,
        resolved_x: 0,
        resolved_y: fallbackRow,
        resolved_width: 12,
        resolved_height: 1,
      };

      fallbackRow += 2;
      return result;
    }

    return {
      ...block,
      resolved_x: x,
      resolved_y: Math.max(block.grid_y ?? 0, 0),
      resolved_width: width,
      resolved_height: height,
    };
  });

  return {
    hasCustomLayout: true,
    blocks: positioned,
  };
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

    ...(getFaviconUrl(site)
      ? {
          icons: {
            icon: [
              {
                url: getFaviconUrl(site)!,
              },
            ],
            shortcut: [
              {
                url: getFaviconUrl(site)!,
              },
            ],
            apple: [
              {
                url: getFaviconUrl(site)!,
              },
            ],
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

  const redirectUrl =
    site.redirect_enabled && site.redirect_url?.trim()
      ? site.redirect_url.trim()
      : null;

  if (redirectUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F1EB] px-6 text-[#1C1A17]">
        <PageViewTracker siteId={site.id} redirectUrl={redirectUrl} />

        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9D1C6] bg-white/70 text-xl text-[#9B7442] shadow-sm">
            ↗
          </div>

          <h1 className="mt-5 font-serif text-2xl">
            Redirecting you…
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#82786C]">
            @{site.username} is sending you to another page.
          </p>

          <a
            href={redirectUrl}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1C1A17] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#34302A]"
          >
            Continue now
          </a>
        </div>
      </main>
    );
  }

  const visibleBlocks = ((linkData || []) as LinkItem[])
    .filter((block) => {
      const start = block.schedule_start
        ? new Date(block.schedule_start)
        : null;

      const end = block.schedule_end
        ? new Date(block.schedule_end)
        : null;

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

  const { blocks: positionedBlocks, hasCustomLayout } =
    resolveGridLayout(visibleBlocks);

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

  const pageWidth = hasCustomLayout
    ? site.page_width === "compact"
      ? "640px"
      : site.page_width === "wide"
        ? "1100px"
        : "900px"
    : site.page_width === "compact"
      ? "360px"
      : site.page_width === "wide"
        ? "620px"
        : "480px";

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

  const gap =
    site.spacing === "tight"
      ? "8px"
      : site.spacing === "loose"
        ? "20px"
        : "12px";

  return (
    <main
      className="mp-public-page relative min-h-screen w-full overflow-x-hidden"
      style={{
        ...backgroundStyle,
        fontFamily: site.font || "Inter",
        color: textColor,
      }}
    >
      <PageViewTracker siteId={site.id} />

      {getFaviconUrl(site) && (
        <>
          <link rel="icon" href={getFaviconUrl(site)} />
          <link rel="shortcut icon" href={getFaviconUrl(site)} />
          <link rel="apple-touch-icon" href={getFaviconUrl(site)} />
        </>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd,
        }}
      />

      <style>{`
        .musepage-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-auto-rows: minmax(28px, auto);
          gap: ${gap};
          align-items: start;
        }

        .musepage-grid-item {
          grid-column: 1 / -1;
          grid-row: auto;
          min-width: 0;
          opacity: 0;
          transform: translateY(16px);
          animation: mpGridItemIn 620ms cubic-bezier(.2,.7,.2,1) forwards;
        }

        ${positionedBlocks
          .map(
            (_, index) => `
          .musepage-grid-item:nth-child(${index + 1}) {
            animation-delay: ${Math.min(index * 65, 420)}ms;
          }
        `
          )
          .join("")}

        @keyframes mpHeaderIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mpGridItemIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mp-public-header {
          opacity: 0;
          transform: translateY(18px);
          animation: mpHeaderIn 680ms cubic-bezier(.2,.7,.2,1) 100ms forwards;
        }

        .mp-public-socials {
          opacity: 0;
          transform: translateY(14px);
          animation: mpHeaderIn 620ms cubic-bezier(.2,.7,.2,1) 220ms forwards;
        }

        .mp-public-social-icon {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .mp-public-social-icon::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: inherit;
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,.25), transparent 45%);
          opacity: .55;
        }

        .mp-public-footer {
          opacity: 0;
          animation: mpHeaderIn 500ms ease 520ms forwards;
        }

        @media (min-width: 640px) {
          .musepage-grid-item {
            grid-column:
              calc(var(--mp-grid-x) + 1) /
              span var(--mp-grid-width);
            grid-row:
              calc(var(--mp-grid-y) + 1) /
              span var(--mp-grid-height);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mp-public-header,
          .mp-public-socials,
          .mp-public-footer,
          .musepage-grid-item {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            backgroundType === "image"
              ? "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 40%)"
              : "radial-gradient(circle at top, rgba(255,255,255,0.055), transparent 46%)",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(circle at top, black 0%, transparent 72%)",
        }}
      />

      <div
        className="relative z-10 mx-auto min-h-screen w-full transition-[max-width] duration-300"
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
          <div
            className={`mp-public-header flex w-full flex-col ${headerAlignment}`}
          >
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-[-14px] rounded-full opacity-25 blur-2xl"
                style={{
                  backgroundColor:
                    site.button_color || "rgba(255,255,255,.18)",
                }}
              />

              {site.avatar_url ? (
                <img
                  src={site.avatar_url}
                  alt={site.username}
                  className="relative h-24 w-24 rounded-full object-cover shadow-2xl ring-1 ring-white/20 transition duration-300 hover:scale-[1.03]"
                />
              ) : (
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl shadow-2xl backdrop-blur-xl">
                  {(site.username?.trim()?.[0] || "M").toUpperCase()}
                </div>
              )}
            </div>

            <div
              className={`mt-5 flex items-center gap-2 max-w-full ${
                headerPosition === "left"
                  ? "justify-start"
                  : headerPosition === "right"
                    ? "justify-end"
                    : "justify-center"
              }`}
            >
              <h1
                className="text-2xl font-bold tracking-[-0.02em] break-words truncate max-w-full"
                style={{ color: textColor }}
              >
                @{site.username}
              </h1>

              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full opacity-55"
                style={{ backgroundColor: textColor }}
              />
            </div>

            {site.bio && (
              <p
                className={`mt-3 max-w-md text-sm leading-6 opacity-75 break-words ${
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
              className={`mp-public-socials mt-7 flex items-center gap-3 ${
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
                  <div className="mp-public-social-icon flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg">
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
                  <div className="mp-public-social-icon flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg">
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
                  <div className="mp-public-social-icon flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg">
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

          <div className="mt-9 w-full">
            <div className="musepage-grid">
              {positionedBlocks.map((block) => (
                <div
                  key={block.id}
                  className="musepage-grid-item"
                  style={
                    {
                      "--mp-grid-x": block.resolved_x,
                      "--mp-grid-y": block.resolved_y,
                      "--mp-grid-width": block.resolved_width,
                      "--mp-grid-height": block.resolved_height,
                    } as CSSProperties
                  }
                >
                  <PublicBlock
                    block={block}
                    siteId={site.id}
                    username={site.username}
                    buttonColor={site.button_color || "#ffffff"}
                    buttonTextColor={site.button_text_color || "#000000"}
                    buttonStyle={site.button_style || "rounded"}
                    buttonShadow={site.button_shadow !== false}
                  />
                </div>
              ))}

              {positionedBlocks.length === 0 && (
                <div className="col-span-12 rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center backdrop-blur-xl">
                  <p
                    className="text-sm opacity-50"
                    style={{ color: textColor }}
                  >
                    No links available right now.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mp-public-footer mt-auto pt-14 pb-5 text-center">
            <div
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 opacity-55 backdrop-blur-xl transition hover:opacity-80"
              style={{ color: textColor }}
            >
              <MusePageLogo href="/" compact iconSize={17} />
              <span className="text-[10px] font-medium tracking-wide">
                Made with MusePage
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
