
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import ShareButton from "./ShareButton";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import AnalyticsLink from "@/app/components/AnalyticsLink";
import SocialAnalyticsLink from "@/app/components/SocialAnalyticsLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    username: string;
  }>;
};

/* =====================================================
   BLOCK TYPES
===================================================== */

type BlockType =
  | "link"
  | "heading"
  | "image"
  | "video"
  | "email";

/* =====================================================
   LINK / BLOCK
===================================================== */

type LinkItem = {
  id: string;
  site_id: string;

  title: string;
  url: string;

  active: boolean;
  position: number;

  featured: boolean | null;

  schedule_start: string | null;
  schedule_end: string | null;

  type: BlockType;

  image_url: string | null;
  description: string | null;
  embed_url: string | null;
  email: string | null;

  open_new_tab: boolean;
};

/* =====================================================
   SITE
===================================================== */

type Site = {
  id: string;
  username: string;

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

  background_type?: string | null;

  gradient_color_1?: string | null;
  gradient_color_2?: string | null;
  gradient_direction?: string | null;

  background_image_url?: string | null;
  background_overlay?: number | null;
  background_position?: string | null;

  /* SEO */

  seo_title?: string | null;
  meta_description?: string | null;
  seo_keywords?: string | null;

  og_image_url?: string | null;
  twitter_image_url?: string | null;
  favicon_url?: string | null;

  search_engine_indexing?: boolean | null;

  canonical_url?: string | null;
};

/* =====================================================
   METADATA / SEO
===================================================== */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { username } = await params;

  const supabase = await createClient();

  const {
    data: siteData,
    error,
  } = await supabase
    .from("sites")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error || !siteData) {
    return {
      title: "Profile Not Found",
      description:
        "This profile could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const site = siteData as Site;

  /* =================================================
     BASIC SEO
  ================================================= */

  const title =
    site.seo_title?.trim() ||
    `@${site.username}`;

  const description =
    site.meta_description?.trim() ||
    site.bio?.trim() ||
    `Check out @${site.username}'s links and social profiles.`;

  /* =================================================
     KEYWORDS
  ================================================= */

  const keywords = site.seo_keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  /* =================================================
     SITE URL
  ================================================= */

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(
      /\/$/,
      ""
    ) || "";

  const generatedProfileUrl = siteUrl
    ? `${siteUrl}/${site.username}`
    : undefined;

  /* =================================================
     CANONICAL
  ================================================= */

  const canonicalUrl =
    site.canonical_url?.trim() ||
    generatedProfileUrl;

  /* =================================================
     OG IMAGE
  ================================================= */

  const ogImage =
    site.og_image_url?.trim() ||
    site.avatar_url?.trim() ||
    undefined;

  /* =================================================
     TWITTER IMAGE
  ================================================= */

  const twitterImage =
    site.twitter_image_url?.trim() ||
    ogImage ||
    undefined;

  /* =================================================
     INDEXING
  ================================================= */

  const shouldIndex =
    site.search_engine_indexing !== false;

  /* =================================================
     METADATA
  ================================================= */

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

    /* =================================================
       OPEN GRAPH
    ================================================= */

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

    /* =================================================
       TWITTER / X
    ================================================= */

    twitter: {
      card: twitterImage
        ? "summary_large_image"
        : "summary",

      title,
      description,

      ...(twitterImage
        ? {
            images: [twitterImage],
          }
        : {}),
    },

    /* =================================================
       FAVICON
    ================================================= */

    ...(site.favicon_url?.trim()
      ? {
          icons: {
            icon: site.favicon_url.trim(),
            shortcut:
              site.favicon_url.trim(),
          },
        }
      : {}),

    /* =================================================
       ROBOTS
    ================================================= */

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

/* =====================================================
   PUBLIC PROFILE
===================================================== */

export default async function PublicProfile({
  params,
}: Props) {
  const { username } = await params;

  const supabase = await createClient();

  /* =================================================
     LOAD SITE
  ================================================= */

  const {
    data: siteData,
    error: siteError,
  } = await supabase
    .from("sites")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (siteError || !siteData) {
    console.error(
      "PUBLIC PROFILE ERROR:",
      siteError
    );

    notFound();
  }

  const site = siteData as Site;

  /* =================================================
     SITE URL
  ================================================= */

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(
      /\/$/,
      ""
    ) || "";

  const generatedProfileUrl = siteUrl
    ? `${siteUrl}/${site.username}`
    : undefined;

  const canonicalUrl =
    site.canonical_url?.trim() ||
    generatedProfileUrl;

  /* =================================================
     JSON-LD IMAGE
  ================================================= */

  const structuredDataImage =
    site.og_image_url?.trim() ||
    site.avatar_url?.trim() ||
    undefined;

  /* =================================================
     JSON-LD SAME AS
  ================================================= */

  const sameAs = [
    site.instagram_url?.trim(),
    site.youtube_url?.trim(),
    site.x_url?.trim(),
  ].filter(
    (url): url is string =>
      Boolean(url)
  );

  /* =================================================
     PERSON SCHEMA
  ================================================= */

  const personSchema = {
    "@context":
      "https://schema.org",
    "@type": "Person",

    name: `@${site.username}`,

    alternateName:
      site.username,

    ...(site.bio?.trim()
      ? {
          description:
            site.bio.trim(),
        }
      : {}),

    ...(canonicalUrl
      ? {
          url: canonicalUrl,
        }
      : {}),

    ...(structuredDataImage
      ? {
          image:
            structuredDataImage,
        }
      : {}),

    ...(sameAs.length > 0
      ? {
          sameAs,
        }
      : {}),
  };

  /* =================================================
     SAFE JSON-LD
  ================================================= */

  const jsonLd = JSON.stringify(
    personSchema
  ).replace(/</g, "\u003c");

  /* =================================================
     PAGE VIEW
  ================================================= */

  const {
    error: pageViewError,
  } = await supabase
    .from("page_views")
    .insert({
      site_id: site.id,
    });

  if (pageViewError) {
    console.error(
      "PAGE VIEW ERROR:",
      pageViewError
    );
  }

  /* =================================================
     LOAD ALL BLOCKS

     IMPORTANT:
     The new LinksPage stores every block
     directly inside the "links" table.
  ================================================= */

  const {
    data: linkData,
    error: linksError,
  } = await supabase
    .from("links")
    .select("*")
    .eq("site_id", site.id)
    .eq("active", true)
    .order("position", {
      ascending: true,
    });

  if (linksError) {
    console.error(
      "LINKS ERROR:",
      linksError
    );
  }

  /* =================================================
     CURRENT TIME
  ================================================= */

  const now = new Date();

  /* =================================================
     PREPARE VISIBLE BLOCKS

     Schedule fields used by LinksPage:

     schedule_start
     schedule_end
  ================================================= */

  const visibleBlocks =
    ((linkData || []) as LinkItem[])
      .filter((block) => {
        const startTime =
          block.schedule_start
            ? new Date(
                block.schedule_start
              )
            : null;

        const endTime =
          block.schedule_end
            ? new Date(
                block.schedule_end
              )
            : null;

        const hasStarted =
          !startTime ||
          now >= startTime;

        const hasNotEnded =
          !endTime ||
          now <= endTime;

        return (
          hasStarted &&
          hasNotEnded
        );
      })
      .sort((a, b) => {
        /*
         * Featured blocks appear first.
         * Everything else follows position.
         */

        const featuredA =
          a.featured ? 1 : 0;

        const featuredB =
          b.featured ? 1 : 0;

        if (
          featuredA !== featuredB
        ) {
          return (
            featuredB -
            featuredA
          );
        }

        return (
          a.position -
          b.position
        );
      });

  /* =================================================
     BUTTON STYLE
  ================================================= */

  const buttonRadius =
    site.button_style === "pill"
      ? "9999px"
      : site.button_style ===
          "square"
        ? "4px"
        : "14px";

  /* =================================================
     BUTTON SHADOW
  ================================================= */

  const buttonShadow =
    site.button_shadow === false
      ? "none"
      : "0 10px 30px rgba(0,0,0,0.25)";

  /* =================================================
     PAGE WIDTH
  ================================================= */

  const pageWidth =
    site.page_width === "compact"
      ? "360px"
      : site.page_width === "wide"
        ? "620px"
        : "480px";

  /* =================================================
     SPACING
  ================================================= */

  const spacingClass =
    site.spacing === "tight"
      ? "space-y-2"
      : site.spacing === "loose"
        ? "space-y-5"
        : "space-y-3";

  /* =================================================
     BACKGROUND SETTINGS
  ================================================= */

  const backgroundType =
    site.background_type ||
    "solid";

  const backgroundColor =
    site.background_color ||
    "#000000";

  const gradientColor1 =
    site.gradient_color_1 ||
    "#09090b";

  const gradientColor2 =
    site.gradient_color_2 ||
    "#18181b";

  const gradientDirection =
    site.gradient_direction ||
    "135deg";

  const backgroundImageUrl =
    site.background_image_url ||
    "";

  const backgroundOverlay =
    typeof site.background_overlay ===
    "number"
      ? site.background_overlay
      : 0;

  const backgroundPosition =
    site.background_position ||
    "center";

  /* =================================================
     TEXT COLOR
  ================================================= */

  const textColor =
    site.button_text_color ||
    "#ffffff";

  /* =================================================
     BACKGROUND STYLE
  ================================================= */

  let backgroundStyle: React.CSSProperties =
    {
      backgroundColor,
    };

  /* =================================================
     SOLID
  ================================================= */

  if (
    backgroundType === "solid"
  ) {
    backgroundStyle = {
      backgroundColor,
    };
  }

  /* =================================================
     GRADIENT
  ================================================= */

  if (
    backgroundType === "gradient"
  ) {
    backgroundStyle = {
      backgroundColor:
        gradientColor1,

      backgroundImage: `linear-gradient(
        ${gradientDirection},
        ${gradientColor1},
        ${gradientColor2}
      )`,

      backgroundRepeat:
        "no-repeat",

      backgroundSize: "cover",

      backgroundPosition:
        "center",

      backgroundAttachment:
        "fixed",
    };
  }

  /* =================================================
     IMAGE
  ================================================= */

  if (
    backgroundType === "image" &&
    backgroundImageUrl
  ) {
    const overlayOpacity =
      Math.min(
        Math.max(
          backgroundOverlay,
          0
        ),
        100
      ) / 100;

    backgroundStyle = {
      backgroundColor,

      backgroundImage: `
        linear-gradient(
          rgba(0, 0, 0, ${overlayOpacity}),
          rgba(0, 0, 0, ${overlayOpacity})
        ),
        url("${backgroundImageUrl}")
      `,

      backgroundSize: "cover",

      backgroundPosition:
        backgroundPosition,

      backgroundRepeat:
        "no-repeat",

      backgroundAttachment:
        "fixed",
    };
  }

  /* =================================================
     YOUTUBE URL HELPER
  ================================================= */

  function getYoutubeEmbedUrl(
    value: string
  ) {
    try {
      const parsed =
        new URL(value);

      const hostname =
        parsed.hostname
          .toLowerCase()
          .replace(/^www\./, "");

      /* youtube.com/watch?v= */

      if (
        hostname ===
          "youtube.com" ||
        hostname ===
          "m.youtube.com"
      ) {
        const videoId =
          parsed.searchParams.get(
            "v"
          );

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }

        /* /shorts/VIDEO_ID */

        if (
          parsed.pathname.startsWith(
            "/shorts/"
          )
        ) {
          const id =
            parsed.pathname
              .split("/shorts/")[1]
              ?.split("/")[0];

          if (id) {
            return `https://www.youtube.com/embed/${id}`;
          }
        }

        /* /embed/VIDEO_ID */

        if (
          parsed.pathname.startsWith(
            "/embed/"
          )
        ) {
          const id =
            parsed.pathname
              .split("/embed/")[1]
              ?.split("/")[0];

          if (id) {
            return `https://www.youtube.com/embed/${id}`;
          }
        }
      }

      /* youtu.be/VIDEO_ID */

      if (
        hostname ===
        "youtu.be"
      ) {
        const id =
          parsed.pathname
            .replace(/^\/+/, "")
            .split("/")[0];

        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  /* =================================================
     RENDER BLOCK
  ================================================= */

  function renderBlock(
    block: LinkItem
  ) {
    const title =
      block.title?.trim() ||
      "";

    const featured =
      Boolean(block.featured);

    /* =================================================
       HEADING
    ================================================= */

    if (
      block.type === "heading"
    ) {
      return (
        <div
          key={block.id}
          className="w-full py-2"
        >
          <h2
            className="text-center text-lg font-bold tracking-tight"
            style={{
              color: textColor,
            }}
          >
            {title}
          </h2>

          {block.description && (
            <p
              className="mt-1 text-center text-sm opacity-60"
              style={{
                color: textColor,
              }}
            >
              {block.description}
            </p>
          )}
        </div>
      );
    }

    /* =================================================
       IMAGE
    ================================================= */

    if (
      block.type === "image"
    ) {
      const imageUrl =
        block.image_url?.trim();

      if (!imageUrl) {
        return null;
      }

      const clickUrl =
        block.url?.trim();

      const imageContent = (
        <div className="w-full overflow-hidden rounded-2xl">
          <img
            src={imageUrl}
            alt={
              title ||
              `Image by @${site.username}`
            }
            className="h-auto w-full object-cover transition duration-300 hover:scale-[1.01]"
            loading="lazy"
          />

          {title && (
            <p
              className="mt-2 text-center text-xs opacity-60"
              style={{
                color: textColor,
              }}
            >
              {title}
            </p>
          )}
        </div>
      );

      if (!clickUrl) {
        return (
          <div key={block.id}>
            {imageContent}
          </div>
        );
      }

      return (
        <a
          key={block.id}
          href={clickUrl}
          target={
            block.open_new_tab
              ? "_blank"
              : undefined
          }
          rel={
            block.open_new_tab
              ? "noopener noreferrer"
              : undefined
          }
          className="block w-full"
        >
          {imageContent}
        </a>
      );
    }

    /* =================================================
       VIDEO
    ================================================= */

    if (
      block.type === "video"
    ) {
      const source =
        block.embed_url?.trim();

      if (!source) {
        return null;
      }

      const embedUrl =
        getYoutubeEmbedUrl(
          source
        );

      if (!embedUrl) {
        return null;
      }

      return (
        <div
          key={block.id}
          className="w-full overflow-hidden rounded-2xl bg-black shadow-xl"
        >
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl}
              title={
                title ||
                "YouTube video"
              }
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {title && (
            <div className="px-4 py-3">
              <p
                className="text-sm font-medium"
                style={{
                  color: textColor,
                }}
              >
                {title}
              </p>
            </div>
          )}
        </div>
      );
    }

    /* =================================================
       EMAIL
    ================================================= */

    if (
      block.type === "email"
    ) {
      const emailAddress =
        block.email?.trim();

      if (!emailAddress) {
        return null;
      }

      return (
        <a
          key={block.id}
          href={`mailto:${emailAddress}`}
          className="block w-full px-6 py-4 text-center font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.015] active:scale-[0.98]"
          style={{
            backgroundColor:
              site.button_color ||
              "#ffffff",

            color:
              site.button_text_color ||
              "#000000",

            borderRadius:
              buttonRadius,

            boxShadow:
              buttonShadow,
          }}
        >
          ✉️{" "}
          {title ||
            "Email me"}
        </a>
      );
    }

    /* =================================================
       NORMAL LINK
    ================================================= */

    const url =
      block.url?.trim();

    if (!url) {
      return null;
    }

    /*
     * Analytics uses the actual links row ID.
     */

    return (
      <div
        key={block.id}
        className="relative w-full"
      >
        {/* FEATURED BADGE */}

        {featured && (
          <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
            <span
              className="
                whitespace-nowrap
                rounded-full
                border
                border-yellow-400/30
                bg-yellow-400/10
                px-3
                py-1
                text-[10px]
                font-bold
                uppercase
                tracking-wider
                text-yellow-300
                shadow-lg
                backdrop-blur-xl
              "
            >
              ⭐ Featured
            </span>
          </div>
        )}

        <AnalyticsLink
          siteId={site.id}
          linkId={block.id}
          url={url}
          title={title}
          className={`
            group
            relative
            block
            w-full
            overflow-hidden
            px-6
            py-4
            text-center
            font-semibold
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:scale-[1.015]
            active:scale-[0.98]
            ${
              featured
                ? "ring-2 ring-yellow-400/40"
                : ""
            }
          `}
          style={{
            backgroundColor:
              site.button_color ||
              "#ffffff",

            color:
              site.button_text_color ||
              "#000000",

            borderRadius:
              buttonRadius,

            boxShadow: featured
              ? `${buttonShadow}, 0 0 30px rgba(250,204,21,0.10)`
              : buttonShadow,
          }}
        />
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{
        ...backgroundStyle,
        fontFamily:
          site.font || "Inter",
        color: textColor,
      }}
    >
      {/* =================================================
          JSON-LD
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd,
        }}
      />

      {/* =================================================
          BACKGROUND DEPTH
      ================================================= */}

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            backgroundType ===
            "image"
              ? "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 40%)"
              : "radial-gradient(circle at top, rgba(255,255,255,0.035), transparent 45%)",
        }}
      />

      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <div
        className="relative z-10 mx-auto min-h-screen w-full"
        style={{
          maxWidth: pageWidth,
        }}
      >
        <div
          className={`
            flex min-h-screen flex-col
            items-center px-5
            sm:px-6
            ${
              site.spacing ===
              "loose"
                ? "py-16"
                : site.spacing ===
                    "tight"
                  ? "py-8"
                  : "py-12"
            }
          `}
        >
          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <div className="flex w-full flex-col items-center">
            {/* AVATAR */}

            <div className="relative">
              {site.avatar_url ? (
                <img
                  src={
                    site.avatar_url
                  }
                  alt={
                    site.username
                  }
                  className="
                    h-24 w-24
                    rounded-full
                    object-cover
                    shadow-2xl
                    ring-2 ring-white/10
                    transition duration-300
                    hover:scale-105
                  "
                />
              ) : (
                <div
                  className="
                    flex h-24 w-24
                    items-center justify-center
                    rounded-full
                    bg-white/10
                    text-3xl
                    shadow-2xl
                    ring-2 ring-white/10
                    backdrop-blur-xl
                  "
                >
                  👤
                </div>
              )}

              {/* ONLINE DOT */}

              <div
                className="
                  absolute bottom-1 right-1
                  h-4 w-4
                  rounded-full
                  border-2
                  border-black/50
                  bg-green-400
                  shadow-lg
                "
              />
            </div>

            {/* USERNAME */}

            <h1
              className="
                mt-5
                text-center
                text-2xl
                font-bold
                tracking-tight
              "
              style={{
                color: textColor,
              }}
            >
              @{site.username}
            </h1>

            {/* BIO */}

            {site.bio && (
              <p
                className="
                  mt-3
                  max-w-md
                  text-center
                  text-sm
                  leading-6
                  opacity-75
                "
                style={{
                  color: textColor,
                }}
              >
                {site.bio}
              </p>
            )}

            {/* SHARE */}

            <div className="mt-5">
              <ShareButton
                username={
                  site.username
                }
              />
            </div>
          </div>

          {/* =================================================
              SOCIAL LINKS
          ================================================= */}

          {(site.instagram_url ||
            site.youtube_url ||
            site.x_url) && (
            <div
              className="
                mt-7
                flex
                items-center
                justify-center
                gap-3
              "
            >
              {/* INSTAGRAM */}

              {site.instagram_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="instagram"
                  url={
                    site.instagram_url
                  }
                >
                  <div
                    className="
                      flex h-11 w-11
                      items-center justify-center
                      rounded-full
                      bg-white/10
                      backdrop-blur-xl
                      transition
                      duration-200
                      hover:-translate-y-1
                      hover:bg-white/20
                    "
                  >
                    <FaInstagram
                      size={20}
                    />
                  </div>
                </SocialAnalyticsLink>
              )}

              {/* YOUTUBE */}

              {site.youtube_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="youtube"
                  url={
                    site.youtube_url
                  }
                >
                  <div
                    className="
                      flex h-11 w-11
                      items-center justify-center
                      rounded-full
                      bg-white/10
                      backdrop-blur-xl
                      transition
                      duration-200
                      hover:-translate-y-1
                      hover:bg-white/20
                    "
                  >
                    <FaYoutube
                      size={20}
                    />
                  </div>
                </SocialAnalyticsLink>
              )}

              {/* X */}

              {site.x_url && (
                <SocialAnalyticsLink
                  siteId={site.id}
                  platform="x"
                  url={
                    site.x_url
                  }
                >
                  <div
                    className="
                      flex h-11 w-11
                      items-center justify-center
                      rounded-full
                      bg-white/10
                      backdrop-blur-xl
                      transition
                      duration-200
                      hover:-translate-y-1
                      hover:bg-white/20
                    "
                  >
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

          {/* =================================================
              BLOCKS
          ================================================= */}

          <div
            className={`
              mt-9
              w-full
              ${spacingClass}
            `}
          >
            {visibleBlocks.map(
              (block) =>
                renderBlock(block)
            )}

            {/* NO BLOCKS */}

            {visibleBlocks.length ===
              0 && (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  px-5
                  py-10
                  text-center
                  backdrop-blur-xl
                "
              >
                <p
                  className="text-sm opacity-50"
                  style={{
                    color:
                      textColor,
                  }}
                >
                  No links available
                  right now.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="
              mt-14
              pb-5
              text-center
            "
          >
            <p
              className="
                text-[11px]
                font-medium
                tracking-wide
                opacity-40
              "
              style={{
                color:
                  textColor,
              }}
            >
              Powered by your
              platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


