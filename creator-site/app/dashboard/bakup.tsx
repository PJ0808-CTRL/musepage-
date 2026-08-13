"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AnalyticsInsights from "@/app/components/AnalyticsInsights";

type Profile = {
username: string;
display_name: string | null;
bio: string | null;
};

type Site = {
id: string;
username: string;
published: boolean;
};

type DateRange = "today" | "7days" | "30days" | "all";

type AnalyticsPoint = {
date: string;
label: string;
views: number;
clicks: number;
};

type Analytics = {
pageViews: number;
linkClicks: number;
socialClicks: number;
ctr: number;

topLinks: {
title: string;
clicks: number;
}[];

socialBreakdown: {
platform: string;
clicks: number;
}[];

chart: AnalyticsPoint[];
};

export default function Dashboard() {
const router = useRouter();

const [profile, setProfile] =
useState<Profile | null>(null);

const [site, setSite] =
useState<Site | null>(null);

const [analytics, setAnalytics] =
useState<Analytics | null>(null);

const [loading, setLoading] =
useState(true);

const [creating, setCreating] =
useState(false);

const [refreshing, setRefreshing] =
useState(false);

const [dateRange, setDateRange] =
useState<DateRange>("all");

useEffect(() => {
loadDashboard();
}, []);

async function loadDashboard() {
const {
data: { user },
} = await supabase.auth.getUser();


if (!user) {
  router.push("/login");
  return;
}

const {
  data: profileData,
  error: profileError,
} = await supabase
  .from("profiles")
  .select(
    "username, display_name, bio"
  )
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.error(
    "PROFILE ERROR:",
    profileError
  );
}

if (!profileData) {
  router.push("/onboarding");
  return;
}

setProfile(profileData);

const {
  data: siteData,
  error: siteError,
} = await supabase
  .from("sites")
  .select(
    "id, username, published"
  )
  .eq("user_id", user.id)
  .maybeSingle();

if (siteError) {
  console.error(
    "SITE ERROR:",
    siteError
  );
}

setSite(siteData || null);

if (siteData) {
  await loadAnalytics(
    siteData.id,
    "all"
  );
}

setLoading(false);


}

async function loadAnalytics(
siteId: string,
range: DateRange = dateRange
) {
try {
setRefreshing(true);


  console.log(
    "📊 Loading analytics:",
    siteId,
    range
  );

  let startDate: string | null =
    null;

  if (range !== "all") {
    const now = new Date();

    if (range === "today") {
      now.setHours(0, 0, 0, 0);
    }

    if (range === "7days") {
      now.setDate(
        now.getDate() - 6
      );
      now.setHours(0, 0, 0, 0);
    }

    if (range === "30days") {
      now.setDate(
        now.getDate() - 29
      );
      now.setHours(0, 0, 0, 0);
    }

    startDate =
      now.toISOString();
  }

  /* PAGE VIEWS */

  let pageViewsQuery =
    supabase
      .from("page_views")
      .select("created_at")
      .eq("site_id", siteId);

  if (startDate) {
    pageViewsQuery =
      pageViewsQuery.gte(
        "created_at",
        startDate
      );
  }

  const {
    data: pageViewRows,
    error: pageViewsError,
  } = await pageViewsQuery;

  if (pageViewsError) {
    console.error(
      "PAGE VIEWS ERROR:",
      pageViewsError
    );
  }

  /* LINK CLICKS */

  let linkClicksQuery =
    supabase
      .from("link_clicks")
      .select(
        "link_id, created_at"
      )
      .eq("site_id", siteId);

  if (startDate) {
    linkClicksQuery =
      linkClicksQuery.gte(
        "created_at",
        startDate
      );
  }

  const {
    data: linkClicks,
    error: linkClicksError,
  } = await linkClicksQuery;

  if (linkClicksError) {
    console.error(
      "LINK CLICKS ERROR:",
      linkClicksError
    );
  }

  /* SOCIAL CLICKS */

  let socialClicksQuery =
    supabase
      .from("social_clicks")
      .select(
        "platform, created_at"
      )
      .eq("site_id", siteId);

  if (startDate) {
    socialClicksQuery =
      socialClicksQuery.gte(
        "created_at",
        startDate
      );
  }

  const {
    data: socialClicks,
    error: socialClicksError,
  } = await socialClicksQuery;

  if (socialClicksError) {
    console.error(
      "SOCIAL CLICKS ERROR:",
      socialClicksError
    );
  }

  /* LINKS */

  const {
    data: links,
    error: linksError,
  } = await supabase
    .from("links")
    .select("id, title")
    .eq("site_id", siteId);

  if (linksError) {
    console.error(
      "LINKS ERROR:",
      linksError
    );
  }

  /* LINK CLICK COUNTS */

  const linkClickCounts: Record<
    string,
    number
  > = {};

  (linkClicks || []).forEach(
    (click) => {
      linkClickCounts[
        click.link_id
      ] =
        (linkClickCounts[
          click.link_id
        ] || 0) + 1;
    }
  );

  /* TOP LINKS */

  const topLinks = (links || [])
    .map((link) => ({
      title: link.title,
      clicks:
        linkClickCounts[
          link.id
        ] || 0,
    }))
    .sort(
      (a, b) =>
        b.clicks - a.clicks
    )
    .slice(0, 5);

  /* SOCIAL COUNTS */

  const socialCounts: Record<
    string,
    number
  > = {};

  (socialClicks || []).forEach(
    (click) => {
      socialCounts[
        click.platform
      ] =
        (socialCounts[
          click.platform
        ] || 0) + 1;
    }
  );

  /* SOCIAL BREAKDOWN */

  const socialBreakdown = [
    "instagram",
    "youtube",
    "x",
  ]
    .filter(
      (platform) =>
        socialCounts[
          platform
        ] > 0
    )
    .map((platform) => ({
      platform,
      clicks:
        socialCounts[
          platform
        ],
    }));

  /* TOTALS */

  const totalPageViews =
    pageViewRows?.length || 0;

  const totalLinkClicks =
    linkClicks?.length || 0;

  const totalSocialClicks =
    socialClicks?.length || 0;

  /* CTR */

  const ctr =
    totalPageViews > 0
      ? Number(
          (
            (totalLinkClicks /
              totalPageViews) *
            100
          ).toFixed(1)
        )
      : 0;

  /* GRAPH DATA */

  const graphMap: Record<
    string,
    {
      views: number;
      clicks: number;
    }
  > = {};

  (pageViewRows || []).forEach(
    (view) => {
      const date =
        new Date(
          view.created_at
        )
          .toISOString()
          .split("T")[0];

      if (!graphMap[date]) {
        graphMap[date] = {
          views: 0,
          clicks: 0,
        };
      }

      graphMap[date].views++;
    }
  );

  (linkClicks || []).forEach(
    (click) => {
      const date =
        new Date(
          click.created_at
        )
          .toISOString()
          .split("T")[0];

      if (!graphMap[date]) {
        graphMap[date] = {
          views: 0,
          clicks: 0,
        };
      }

      graphMap[date].clicks++;
    }
  );

  let graphDates: string[] = [];

  if (range === "all") {
    graphDates =
      Object.keys(
        graphMap
      ).sort();
  } else {
    const days =
      range === "today"
        ? 1
        : range === "7days"
        ? 7
        : 30;

    const end = new Date();

    for (
      let i = days - 1;
      i >= 0;
      i--
    ) {
      const date =
        new Date(end);

      date.setDate(
        end.getDate() - i
      );

      graphDates.push(
        date
          .toISOString()
          .split("T")[0]
      );
    }
  }

  if (
    graphDates.length === 0
  ) {
    graphDates = [
      new Date()
        .toISOString()
        .split("T")[0],
    ];
  }

  const chart: AnalyticsPoint[] =
    graphDates.map(
      (date) => {
        const values =
          graphMap[date] || {
            views: 0,
            clicks: 0,
          };

        const dateObject =
          new Date(
            `${date}T00:00:00`
          );

        let label =
          dateObject.toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
            }
          );

        if (
          range === "today"
        ) {
          label = "Today";
        }

        return {
          date,
          label,
          views:
            values.views,
          clicks:
            values.clicks,
        };
      }
    );

  setAnalytics({
    pageViews:
      totalPageViews,
    linkClicks:
      totalLinkClicks,
    socialClicks:
      totalSocialClicks,
    ctr,
    topLinks,
    socialBreakdown,
    chart,
  });

  console.log(
    "📊 ANALYTICS:",
    {
      pageViews:
        totalPageViews,
      linkClicks:
        totalLinkClicks,
      socialClicks:
        totalSocialClicks,
      ctr,
      chart,
    }
  );
} catch (error) {
  console.error(
    "ANALYTICS FAILED:",
    error
  );
} finally {
  setRefreshing(false);
}


}

async function createSite() {
if (!profile) return;


setCreating(true);

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  router.push("/login");
  return;
}

const {
  data: existingSite,
} = await supabase
  .from("sites")
  .select(
    "id, username, published"
  )
  .eq("user_id", user.id)
  .maybeSingle();

if (existingSite) {
  setSite(existingSite);

  await loadAnalytics(
    existingSite.id,
    dateRange
  );

  setCreating(false);
  return;
}

const {
  data,
  error,
} = await supabase
  .from("sites")
  .insert({
    user_id: user.id,
    username:
      profile.username,
    bio:
      profile.bio || "",
    published: true,
    background_color:
      "#000000",
    button_color:
      "#ffffff",
    button_text_color:
      "#000000",
    font: "Inter",
    button_style:
      "rounded",
  })
  .select(
    "id, username, published"
  )
  .single();

if (error) {
  console.error(
    "CREATE SITE ERROR:",
    error
  );

  alert(error.message);
  setCreating(false);
  return;
}

setSite(data);

await loadAnalytics(
  data.id,
  dateRange
);

setCreating(false);


}

async function signOut() {
await supabase.auth.signOut();
router.push("/login");
}

useEffect(() => {
if (!site) return;


const interval =
  setInterval(() => {
    loadAnalytics(
      site.id,
      dateRange
    );
  }, 10000);

return () => {
  clearInterval(interval);
};


}, [site, dateRange]);

/* PERFORMANCE CHART */

function PerformanceChart() {
if (
!analytics ||
analytics.chart.length === 0
) {
return null;
}


const chart =
  analytics.chart;

const maxValue = Math.max(
  ...chart.map((point) =>
    Math.max(
      point.views,
      point.clicks
    )
  ),
  1
);

const width = 900;
const height = 280;

const paddingLeft = 45;
const paddingRight = 20;
const paddingTop = 25;
const paddingBottom = 45;

const graphWidth =
  width -
  paddingLeft -
  paddingRight;

const graphHeight =
  height -
  paddingTop -
  paddingBottom;

const getX = (
  index: number
) => {
  if (chart.length === 1) {
    return (
      paddingLeft +
      graphWidth / 2
    );
  }

  return (
    paddingLeft +
    (index /
      (chart.length - 1)) *
      graphWidth
  );
};

const getY = (
  value: number
) => {
  return (
    paddingTop +
    graphHeight -
    (value / maxValue) *
      graphHeight
  );
};

const viewsPoints =
  chart
    .map(
      (point, index) =>
        `${getX(index)},${getY(
          point.views
        )}`
    )
    .join(" ");

const clicksPoints =
  chart
    .map(
      (point, index) =>
        `${getX(index)},${getY(
          point.clicks
        )}`
    )
    .join(" ");

const showLabels =
  chart.length <= 10;

const labelStep =
  chart.length <= 10
    ? 1
    : Math.ceil(
        chart.length / 7
      );

return (
  <div className="mt-6">
    <div className="mb-4 flex flex-wrap items-center gap-5 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
        <span className="text-gray-400">
          Views
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
        <span className="text-gray-400">
          Clicks
        </span>
      </div>
    </div>

    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[650px] w-full"
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio) => {
            const y =
              paddingTop +
              graphHeight -
              ratio *
                graphHeight;

            const value =
              Math.round(
                maxValue *
                  ratio
              );

            return (
              <g
                key={ratio}
              >
                <line
                  x1={
                    paddingLeft
                  }
                  x2={
                    width -
                    paddingRight
                  }
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />

                <text
                  x="5"
                  y={y + 4}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="11"
                >
                  {value}
                </text>
              </g>
            );
          }
        )}

        <polyline
          points={
            viewsPoints
          }
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={
            clicksPoints
          }
          fill="none"
          stroke="#22d3ee"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.map(
          (
            point,
            index
          ) => (
            <circle
              key={`view-${point.date}`}
              cx={getX(
                index
              )}
              cy={getY(
                point.views
              )}
              r="4"
              fill="#8b5cf6"
              stroke="#18181b"
              strokeWidth="2"
            />
          )
        )}

        {chart.map(
          (
            point,
            index
          ) => (
            <circle
              key={`click-${point.date}`}
              cx={getX(
                index
              )}
              cy={getY(
                point.clicks
              )}
              r="3"
              fill="#22d3ee"
              stroke="#18181b"
              strokeWidth="2"
            />
          )
        )}

        {chart.map(
          (
            point,
            index
          ) => {
            if (
              !showLabels &&
              index %
                labelStep !==
                0 &&
              index !==
                chart.length -
                  1
            ) {
              return null;
            }

            return (
              <text
                key={`label-${point.date}`}
                x={getX(
                  index
                )}
                y={
                  height -
                  12
                }
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="11"
              >
                {
                  point.label
                }
              </text>
            );
          }
        )}
      </svg>
    </div>
  </div>
);

}

if (loading) {
return ( <main className="min-h-screen bg-black text-white"> <div className="flex min-h-screen items-center justify-center text-gray-400">
Loading dashboard... </div> </main>
);
}

return ( <main className="min-h-screen bg-black text-white">


  {/* NAVBAR */}

  <nav className="border-b border-white/10">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="text-xl font-bold">
        YourBrand
      </div>

      <button
        type="button"
        onClick={signOut}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
      >
        Sign out
      </button>
    </div>
  </nav>

  {/* DASHBOARD */}

  <div className="mx-auto max-w-6xl px-6 py-12">

    {/* HEADER */}

    <div className="mb-10">
      <p className="text-sm text-violet-400">
        DASHBOARD
      </p>

      <h1 className="mt-2 text-4xl font-bold">
        Welcome,{" "}
        {profile?.display_name ||
          profile?.username}
      </h1>

      <p className="mt-3 text-gray-400">
        Build and manage your creator page.
      </p>
    </div>

    {/* ANALYTICS */}

    {site && analytics && (
      <section className="mb-10">

        {/* HEADER */}

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <p className="text-sm text-violet-400">
              ANALYTICS
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Your performance
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">

              {[
                {
                  label: "Today",
                  value: "today",
                },
                {
                  label: "7 Days",
                  value: "7days",
                },
                {
                  label: "30 Days",
                  value: "30days",
                },
                {
                  label: "All Time",
                  value: "all",
                },
              ].map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() => {
                      const range =
                        option.value as DateRange;

                      setDateRange(
                        range
                      );

                      loadAnalytics(
                        site.id,
                        range
                      );
                    }}
                    className={`rounded-lg px-4 py-2 text-sm transition ${
                      dateRange ===
                      option.value
                        ? "bg-violet-500 text-white"
                        : "border border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    {
                      option.label
                    }
                  </button>
                )
              )}

            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadAnalytics(
                site.id,
                dateRange
              )
            }
            disabled={
              refreshing
            }
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh analytics"}
          </button>

        </div>

        {/* STAT CARDS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              Page Views
            </p>

            <p className="mt-2 text-3xl font-bold">
              {analytics.pageViews.toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Total visits
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              Link Clicks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {analytics.linkClicks.toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Creator links
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              CTR
            </p>

            <p className="mt-2 text-3xl font-bold">
              {analytics.ctr}%
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Click-through rate
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              Social Clicks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {analytics.socialClicks.toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Instagram, YouTube & X
            </p>
          </div>

        </div>

        {/* PERFORMANCE GRAPH */}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div>
            <h3 className="text-lg font-semibold">
              Performance
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Views and clicks over time
            </p>
          </div>

          <PerformanceChart />
          <AnalyticsInsights
  pageViews={analytics.pageViews}
  linkClicks={analytics.linkClicks}
  socialClicks={analytics.socialClicks}
  ctr={analytics.ctr}
  topLinks={analytics.topLinks}
  socialBreakdown={analytics.socialBreakdown}
/>

        </div>

        {/* INSIGHTS */}

        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
              ✨
            </div>

            <div className="min-w-0">

              <h3 className="text-lg font-semibold">
                Quick insights
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                A quick read of your current performance.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Best link
                  </p>

                  <p className="mt-2 truncate font-semibold">
                    {analytics.topLinks[0]?.title ||
                      "No clicks yet"}
                  </p>

                  <p className="mt-1 text-sm text-violet-400">
                    {analytics.topLinks[0]
                      ? `${analytics.topLinks[0].clicks} clicks`
                      : "Waiting for data"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Best social
                  </p>

                  <p className="mt-2 font-semibold capitalize">
                    {analytics.socialBreakdown.length > 0
                      ? [...analytics.socialBreakdown].sort(
                          (a, b) =>
                            b.clicks -
                            a.clicks
                        )[0].platform === "x"
                        ? "X"
                        : [...analytics.socialBreakdown].sort(
                            (a, b) =>
                              b.clicks -
                              a.clicks
                          )[0].platform
                      : "No clicks yet"}
                  </p>

                  <p className="mt-1 text-sm text-cyan-400">
                    {analytics.socialBreakdown.length > 0
                      ? `${[...analytics.socialBreakdown].sort(
                          (a, b) =>
                            b.clicks -
                            a.clicks
                        )[0].clicks} clicks`
                      : "Waiting for data"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Engagement
                  </p>

                  <p className="mt-2 font-semibold">
                    {analytics.ctr >= 10
                      ? "Excellent"
                      : analytics.ctr >= 5
                      ? "Good"
                      : analytics.ctr > 0
                      ? "Growing"
                      : "No data yet"}
                  </p>

                  <p className="mt-1 text-sm text-green-400">
                    {analytics.ctr}% CTR
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* DETAILS */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* TOP LINKS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <h3 className="text-lg font-semibold">
              Top links
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Your most clicked links
            </p>

            <div className="mt-6 space-y-4">

              {analytics.topLinks.length ===
              0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No link clicks yet.
                </p>
              ) : (
                analytics.topLinks.map(
                  (
                    link,
                    index
                  ) => (
                    <div
                      key={`${link.title}-${index}`}
                      className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-bold text-violet-400">
                          {index + 1}
                        </span>

                        <span className="truncate text-sm font-medium">
                          {link.title}
                        </span>

                      </div>

                      <span className="ml-4 text-sm font-semibold text-gray-300">
                        {link.clicks}{" "}
                        {link.clicks ===
                        1
                          ? "click"
                          : "clicks"}
                      </span>

                    </div>
                  )
                )
              )}

            </div>
          </div>

          {/* SOCIAL PERFORMANCE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <h3 className="text-lg font-semibold">
              Social performance
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Clicks on your social profiles
            </p>

            <div className="mt-6 space-y-4">

              {analytics.socialBreakdown.length ===
              0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No social clicks yet.
                </p>
              ) : (
                analytics.socialBreakdown.map(
                  (
                    social
                  ) => (
                    <div
                      key={
                        social.platform
                      }
                      className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
                    >

                      <span className="capitalize text-sm font-medium">
                        {social.platform ===
                        "x"
                          ? "X"
                          : social.platform}
                      </span>

                      <span className="text-sm font-semibold text-gray-300">
                        {social.clicks}{" "}
                        {social.clicks ===
                        1
                          ? "click"
                          : "clicks"}
                      </span>

                    </div>
                  )
                )
              )}

            </div>
          </div>

        </div>

      </section>
    )}

    {/* PROFILE + SITE */}

    <div className="grid gap-6 md:grid-cols-2">

      {/* PROFILE */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-semibold">
          Your profile
        </h2>

        <div className="mt-6 space-y-4">

          <div>
            <p className="text-xs text-gray-500">
              USERNAME
            </p>

            <p className="mt-1">
              @{profile?.username}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              DISPLAY NAME
            </p>

            <p className="mt-1">
              {profile?.display_name}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              BIO
            </p>

            <p className="mt-1 text-gray-300">
              {profile?.bio ||
                "No bio yet."}
            </p>
          </div>

        </div>
      </div>

      {/* SITE */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-semibold">
          Your site
        </h2>

        {!site ? (
          <>
            <p className="mt-3 text-gray-400">
              Create your personalized link-in-bio website.
            </p>

            <button
              type="button"
              onClick={
                createSite
              }
              disabled={
                creating
              }
              className="mt-6 w-full rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create my site"}
            </button>
          </>
        ) : (
          <div className="mt-5">

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">

              <p className="text-xs text-gray-500">
                YOUR PUBLIC PAGE
              </p>

              <p className="mt-2 font-medium">
                /{site.username}
              </p>

              <p className="mt-2 text-sm text-green-400">
                {site.published
                  ? "● Published"
                  : "● Draft"}
              </p>

            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/customize"
                  )
                }
                className="rounded-xl bg-violet-500 px-4 py-3 font-semibold hover:bg-violet-400"
              >
                Customize
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/links"
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-3 font-semibold hover:bg-white/5"
              >
                Manage links
              </button>

            </div>

            <a
              href={`/${site.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium hover:bg-white/5"
            >
              🌐 View my public page
            </a>

          </div>
        )}

      </div>

    </div>

  </div>
</main>


);
}
