
"use client";

type Props = {
  siteId: string;
  platform: "instagram" | "youtube" | "x";
  url: string;
  children: React.ReactNode;
};

export default function SocialAnalyticsLink({
  siteId,
  platform,
  url,
  children,
}: Props) {
  async function handleClick() {
    try {
      await fetch("/api/analytics/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId,
          platform,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.error(
        "Social click tracking failed:",
        error
      );
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={platform}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-white/20"
    >
      {children}
    </a>
  );
}


