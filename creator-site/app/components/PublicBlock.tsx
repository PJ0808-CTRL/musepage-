"use client";

import { useEffect, useState } from "react";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import AnalyticsLink from "@/app/components/AnalyticsLink";

export type PublicBlockItem = {
  id: string;
  title: string;
  url: string;
  featured?: boolean | null;
  type?: string | null;
  image_url?: string | null;
  description?: string | null;
  embed_url?: string | null;
  email?: string | null;
  open_new_tab?: boolean | null;
};

type Props = {
  block: PublicBlockItem;
  siteId: string;
  username: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: string;
  buttonShadow: boolean;
  preview?: boolean;
};

function getYoutubeEmbedUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/embed/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getSpotifyEmbedUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname !== "open.spotify.com" &&
      hostname !== "www.open.spotify.com"
    ) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts[0] === "embed") {
      return `https://open.spotify.com/${parts.join("/")}`;
    }

    const allowed = ["track", "album", "playlist", "episode", "show", "artist"];

    if (!allowed.includes(parts[0]) || !parts[1]) {
      return null;
    }

    return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

function Countdown({
  target,
  color,
}: {
  target: string;
  color: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    function calculateTimeLeft() {
      const targetTime = new Date(target).getTime();
      const now = Date.now();

      const difference = Math.max(targetTime - now, 0);

      const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      );

      const minutes = Math.floor(
        (difference / (1000 * 60)) % 60
      );

      const seconds = Math.floor(
        (difference / 1000) % 60
      );

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    }

    calculateTimeLeft();

    const interval = window.setInterval(
      calculateTimeLeft,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [target]);

  const values = [
    {
      label: "Days",
      value: timeLeft.days,
    },
    {
      label: "Hours",
      value: timeLeft.hours,
    },
    {
      label: "Minutes",
      value: timeLeft.minutes,
    },
    {
      label: "Seconds",
      value: timeLeft.seconds,
    },
  ];

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {["Days", "Hours", "Minutes", "Seconds"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl bg-black/15 px-2 py-3 text-center backdrop-blur"
            >
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color }}
              >
                --
              </p>

              <p
                className="mt-1 text-[10px] uppercase tracking-wide opacity-60"
                style={{ color }}
              >
                {label}
              </p>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {values.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl bg-black/15 px-2 py-3 text-center backdrop-blur"
        >
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color }}
          >
            {String(value).padStart(2, "0")}
          </p>

          <p
            className="mt-1 text-[10px] uppercase tracking-wide opacity-60"
            style={{ color }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PublicBlock({
  block,
  siteId,
  username,
  buttonColor,
  buttonTextColor,
  buttonStyle,
  buttonShadow,
  preview = false,
}: Props) {
  const blockType = (block.type || "link").toLowerCase().trim();
  const title = block.title || "";

  const buttonRadius =
    buttonStyle === "pill"
      ? "9999px"
      : buttonStyle === "square"
      ? "4px"
      : "14px";

  // Media and rich cards should never inherit the extreme pill radius.
  const mediaRadius = buttonStyle === "square" ? "4px" : "20px";

  const shadow = buttonShadow
    ? "0 10px 30px rgba(0,0,0,0.25)"
    : "none";

  const cardStyle = {
    backgroundColor: buttonColor,
    color: buttonTextColor,
    borderRadius: mediaRadius,
    boxShadow: shadow,
  };

  if (blockType === "heading" || blockType === "title") {
    return (
      <div className="w-full py-2">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ color: buttonTextColor }}
        >
          {title}
        </h2>

        {block.description && (
          <p
            className="mt-1 text-sm opacity-60"
            style={{ color: buttonTextColor }}
          >
            {block.description}
          </p>
        )}
      </div>
    );
  }

  if (blockType === "text") {
    return (
      <div className="w-full px-1 py-2">
        {title && (
          <h3
            className="text-base font-semibold"
            style={{ color: buttonTextColor }}
          >
            {title}
          </h3>
        )}

        {block.description && (
          <p
            className={`${title ? "mt-2" : ""} whitespace-pre-wrap text-sm leading-6 opacity-75`}
            style={{ color: buttonTextColor }}
          >
            {block.description}
          </p>
        )}
      </div>
    );
  }

  if (blockType === "divider") {
    return (
      <div className="w-full py-3">
        <div
          className="h-px w-full opacity-20"
          style={{ backgroundColor: buttonTextColor }}
        />
      </div>
    );
  }

  if (blockType === "quote" || blockType === "testimonial") {
    return (
      <blockquote
        className="relative w-full overflow-hidden px-6 py-5"
        style={cardStyle}
      >
        <span
          className="absolute -left-1 -top-5 text-7xl font-serif leading-none opacity-10"
          style={{ color: buttonTextColor }}
          aria-hidden="true"
        >
          “
        </span>

        <p
          className="relative text-base font-semibold leading-6"
          style={{ color: buttonTextColor }}
        >
          “{title}”
        </p>

        {block.description && (
          <p
            className="relative mt-3 text-sm opacity-60"
            style={{ color: buttonTextColor }}
          >
            — {block.description}
          </p>
        )}
      </blockquote>
    );
  }

  if (blockType === "image" || blockType === "photo") {
    if (!block.image_url) return null;

    const imageContent = (
      <img
        src={block.image_url}
        alt={title || `Image by @${username}`}
        className="h-auto max-h-[700px] w-full object-cover"
        loading={preview ? undefined : "lazy"}
      />
    );

    return (
      <div
        className="w-full overflow-hidden"
        style={{
          borderRadius: mediaRadius,
          boxShadow: shadow,
        }}
      >
        {block.url && !preview ? (
          <AnalyticsLink
            siteId={siteId}
            linkId={block.id}
            url={block.url}
            title={title || "Image"}
            target={block.open_new_tab === false ? "_self" : "_blank"}
            className="block transition hover:opacity-90"
          >
            {imageContent}
          </AnalyticsLink>
        ) : (
          imageContent
        )}

        {title && (
          <div
            className="px-4 py-3 text-center text-xs font-medium"
            style={{
              backgroundColor: buttonColor,
              color: buttonTextColor,
            }}
          >
            {title}
          </div>
        )}
      </div>
    );
  }

  if (blockType === "video" || blockType === "youtube") {
    const videoUrl = block.embed_url || block.url || "";

    const embedUrl =
      getYoutubeEmbedUrl(videoUrl) ||
      (videoUrl.includes("youtube.com/embed/") ? videoUrl : null);

    if (!embedUrl) return null;

    return (
      <div
        className="w-full overflow-hidden bg-black"
        style={{
          borderRadius: mediaRadius,
          boxShadow: shadow,
        }}
      >
        {title && (
          <div
            className="relative z-20 w-full border-b border-black/10 px-4 py-4"
            style={{
              backgroundColor: buttonColor,
              color: buttonTextColor,
            }}
          >
            <div className="flex w-full min-w-0 items-center gap-2.5">
              <FaYoutube
                size={20}
                className="shrink-0 text-red-500"
                aria-hidden="true"
              />

              <p
                className="min-w-0 flex-1 break-words text-left text-sm font-bold leading-5"
                style={{ color: buttonTextColor }}
              >
                {title}
              </p>
            </div>
          </div>
        )}

        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={title || "YouTube video"}
            className="absolute inset-0 block h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading={preview ? "eager" : "lazy"}
          />
        </div>
      </div>
    );
  }

  if (blockType === "spotify" || blockType === "audio") {
    const spotifyUrl = block.embed_url || block.url || "";
    const embedUrl = getSpotifyEmbedUrl(spotifyUrl);

    if (!embedUrl) return null;

    return (
      <div
        className="w-full overflow-hidden"
        style={{
          borderRadius: mediaRadius,
          boxShadow: shadow,
          backgroundColor: buttonColor,
        }}
      >
        {title && (
          <div
            className="flex items-center gap-2.5 px-4 py-3.5"
            style={{ color: buttonTextColor }}
          >
            <FaSpotify className="shrink-0 text-[#1DB954]" size={20} />
            <p className="min-w-0 truncate text-sm font-bold">{title}</p>
          </div>
        )}

        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading={preview ? "eager" : "lazy"}
          title={title || "Spotify embed"}
          className="block w-full"
        />
      </div>
    );
  }

  if (blockType === "countdown") {
    if (!block.description) return null;

    const target = block.description;

    if (Number.isNaN(new Date(target).getTime())) {
      return null;
    }

    return (
      <div className="w-full px-5 py-5" style={cardStyle}>
        {title && (
          <p
            className="mb-4 text-center text-sm font-bold"
            style={{ color: buttonTextColor }}
          >
            {title}
          </p>
        )}

        <Countdown target={target} color={buttonTextColor} />
      </div>
    );
  }

  if (blockType === "cta") {
    const content = (
      <div className="w-full px-5 py-5 text-left" style={cardStyle}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="font-bold leading-5"
              style={{ color: buttonTextColor }}
            >
              {title}
            </p>

            {block.description && (
              <p
                className="mt-1.5 text-sm leading-5 opacity-65"
                style={{ color: buttonTextColor }}
              >
                {block.description}
              </p>
            )}
          </div>

          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-lg"
            style={{ color: buttonTextColor }}
          >
            →
          </span>
        </div>
      </div>
    );

    if (preview || !block.url) return content;

    return (
      <AnalyticsLink
        siteId={siteId}
        linkId={block.id}
        url={block.url}
        title={title || "CTA"}
        target={block.open_new_tab === false ? "_self" : "_blank"}
        className="block w-full transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
      >
        {content}
      </AnalyticsLink>
    );
  }

  if (
    blockType === "email" ||
    blockType === "mail" ||
    blockType === "contact"
  ) {
    const email =
      block.email?.trim() ||
      block.url?.replace(/^mailto:/i, "").trim();

    if (!email) return null;

    if (blockType === "contact") {
      const content = (
        <div className="w-full px-5 py-5 text-left" style={cardStyle}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10"
              style={{ color: buttonTextColor }}
            >
              ✉
            </div>

            <div className="min-w-0">
              <p className="font-bold" style={{ color: buttonTextColor }}>
                {title || "Contact me"}
              </p>

              {block.description && (
                <p
                  className="mt-1 text-sm leading-5 opacity-65"
                  style={{ color: buttonTextColor }}
                >
                  {block.description}
                </p>
              )}

              <p
                className="mt-2 truncate text-xs opacity-55"
                style={{ color: buttonTextColor }}
              >
                {email}
              </p>
            </div>
          </div>
        </div>
      );

      if (preview) return content;

      return (
        <a
          href={`mailto:${email}`}
          className="block w-full transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
        >
          {content}
        </a>
      );
    }

    const commonStyle = {
      backgroundColor: buttonColor,
      color: buttonTextColor,
      borderRadius: buttonRadius,
      boxShadow: shadow,
    };

    if (preview) {
      return (
        <div
          className="block w-full px-6 py-4 text-center font-semibold"
          style={commonStyle}
        >
          ✉️ {title || "Email me"}
        </div>
      );
    }

    return (
      <a
        href={`mailto:${email}`}
        className="block w-full px-6 py-4 text-center font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.015] active:scale-[0.98]"
        style={commonStyle}
      >
        ✉️ {title || "Email me"}
      </a>
    );
  }

  if (!block.url) return null;

  const featured = Boolean(block.featured);

  const commonClassName = `group relative block w-full overflow-hidden px-6 py-4 text-center font-semibold transition-all duration-200 ${
    preview
      ? ""
      : "hover:-translate-y-0.5 hover:scale-[1.015] active:scale-[0.98]"
  } ${featured ? "ring-2 ring-yellow-400/40" : ""}`;

  const commonStyle = {
    backgroundColor: buttonColor,
    color: buttonTextColor,
    borderRadius: buttonRadius,
    boxShadow: featured
      ? `${shadow}, 0 0 30px rgba(250,204,21,0.10)`
      : shadow,
  };

  return (
    <div className="relative w-full">
      {featured && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
          <span className="whitespace-nowrap rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300 shadow-lg backdrop-blur-xl">
            ⭐ Featured
          </span>
        </div>
      )}

      {preview ? (
        <div className={commonClassName} style={commonStyle}>
          {title}
        </div>
      ) : (
        <AnalyticsLink
          siteId={siteId}
          linkId={block.id}
          url={block.url}
          title={title}
          target={block.open_new_tab === false ? "_self" : "_blank"}
          className={commonClassName}
          style={commonStyle}
        />
      )}
    </div>
  );
}
