"use client";

type TopLink = {
  title: string;
  clicks: number;
};

type SocialBreakdown = {
  platform: string;
  clicks: number;
};

type Props = {
  pageViews: number;
  linkClicks: number;
  socialClicks: number;
  ctr: number;
  topLinks: TopLink[];
  socialBreakdown: SocialBreakdown[];
};

export default function AnalyticsInsights({
  pageViews,
  linkClicks,
  socialClicks,
  ctr,
  topLinks,
  socialBreakdown,
}: Props) {
  const bestLink = topLinks[0];

  const bestSocial = [...socialBreakdown].sort(
    (a, b) => b.clicks - a.clicks
  )[0];

  const totalTopLinkClicks = topLinks.reduce(
    (sum, link) => sum + link.clicks,
    0
  );

  const bestLinkShare =
    linkClicks > 0 && bestLink
      ? Math.round((bestLink.clicks / linkClicks) * 100)
      : 0;

  let engagementMessage =
    "Keep sharing your page to gather more data.";

  if (pageViews > 0 && ctr < 2) {
    engagementMessage =
      "Your page is getting visitors, but relatively few are clicking your links. Try stronger calls-to-action.";
  } else if (pageViews > 0 && ctr < 5) {
    engagementMessage =
      "Your page is getting some engagement. Testing different link titles could help increase clicks.";
  } else if (ctr >= 5) {
    engagementMessage =
      "Great engagement! Your visitors are actively clicking your links.";
  }

  let recommendation =
    "Keep experimenting with your links and content.";

  if (bestLink && bestLinkShare >= 50) {
    recommendation = `Your "${bestLink.title}" link gets ${bestLinkShare}% of your clicks. Consider placing it near the top of your page.`;
  } else if (bestSocial) {
    const platform =
      bestSocial.platform === "x"
        ? "X"
        : bestSocial.platform.charAt(0).toUpperCase() +
          bestSocial.platform.slice(1);

    recommendation = `${platform} is your strongest social platform. Consider making it more prominent on your page.`;
  } else if (ctr < 2 && pageViews > 0) {
    recommendation =
      "Your traffic is higher than your engagement. Try stronger CTA text such as “Watch Now”, “Get Started”, or “Read More”.";
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>

          <h3 className="text-lg font-semibold">
            Insights
          </h3>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening on your page
        </p>
      </div>

      {/* INSIGHT CARDS */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">

        {/* BEST LINK */}

        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            🏆 Best link
          </p>

          {bestLink && bestLink.clicks > 0 ? (
            <>
              <p className="mt-3 truncate text-lg font-semibold">
                {bestLink.title}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {bestLink.clicks}{" "}
                {bestLink.clicks === 1
                  ? "click"
                  : "clicks"}
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${Math.min(
                      bestLinkShare,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {bestLinkShare}% of all link clicks
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Not enough click data yet.
            </p>
          )}
        </div>

        {/* BEST SOCIAL */}

        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            📱 Best social
          </p>

          {bestSocial && bestSocial.clicks > 0 ? (
            <>
              <p className="mt-3 text-lg font-semibold capitalize">
                {bestSocial.platform === "x"
                  ? "X"
                  : bestSocial.platform}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {bestSocial.clicks}{" "}
                {bestSocial.clicks === 1
                  ? "click"
                  : "clicks"}
              </p>

              <p className="mt-4 text-xs text-gray-500">
                Your most clicked social profile
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              No social click data yet.
            </p>
          )}
        </div>

        {/* ENGAGEMENT */}

        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            ⚡ Engagement
          </p>

          <p className="mt-3 text-lg font-semibold">
            {ctr}% CTR
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {engagementMessage}
          </p>
        </div>

        {/* RECOMMENDATION */}

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
            💡 Recommendation
          </p>

          <p className="mt-3 text-sm leading-6 text-gray-300">
            {recommendation}
          </p>
        </div>

      </div>

      {/* SUMMARY */}

      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
          <span>
            <strong className="text-white">
              {pageViews.toLocaleString()}
            </strong>{" "}
            views
          </span>

          <span>
            <strong className="text-white">
              {linkClicks.toLocaleString()}
            </strong>{" "}
            link clicks
          </span>

          <span>
            <strong className="text-white">
              {socialClicks.toLocaleString()}
            </strong>{" "}
            social clicks
          </span>
        </div>
      </div>
    </section>
  );
}