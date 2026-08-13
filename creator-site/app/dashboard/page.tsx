"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AnalyticsInsights from "@/app/components/AnalyticsInsights";
import SharePageModal from "@/app/components/SharePageModal";

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
};

type Site = {
  id: string;
  username: string;
  published: boolean;
  custom_domain: string | null;
  domain_status: "none" | "pending" | "verified" | "error" | null;
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

  previousPageViews: number;
  previousLinkClicks: number;
  previousSocialClicks: number;
  previousCtr: number;

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

type ChangeInfo = {
  text: string;
  tone: "up" | "down" | "neutral";
};

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [shareOpen, setShareOpen] = useState(false);

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
      .select("username, display_name, bio")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
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
      .select("id, username, published, custom_domain, domain_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (siteError) {
      console.error("SITE ERROR:", siteError);
    }

    setSite(siteData || null);

    if (siteData) {
      await loadAnalytics(siteData.id, "all");
    }

    setLoading(false);
  }

  function getRangeBoundaries(range: DateRange) {
    if (range === "all") {
      return {
        currentStart: null as Date | null,
        previousStart: null as Date | null,
        previousEnd: null as Date | null,
      };
    }

    const currentStart = new Date();

    if (range === "today") {
      currentStart.setHours(0, 0, 0, 0);
    }

    if (range === "7days") {
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
    }

    if (range === "30days") {
      currentStart.setDate(currentStart.getDate() - 29);
      currentStart.setHours(0, 0, 0, 0);
    }

    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

    const previousStart = new Date(currentStart);

    if (range === "today") {
      previousStart.setDate(previousStart.getDate() - 1);
    }

    if (range === "7days") {
      previousStart.setDate(previousStart.getDate() - 7);
    }

    if (range === "30days") {
      previousStart.setDate(previousStart.getDate() - 30);
    }

    return {
      currentStart,
      previousStart,
      previousEnd,
    };
  }

  async function loadAnalytics(
    siteId: string,
    range: DateRange = dateRange
  ) {
    try {
      setRefreshing(true);

      const {
        currentStart,
        previousStart,
        previousEnd,
      } = getRangeBoundaries(range);

      /*
       * For Today / 7 Days / 30 Days we load BOTH:
       * current period + immediately previous matching period.
       *
       * For All Time we load everything and skip comparison.
       */

      let pageViewsQuery = supabase
        .from("page_views")
        .select("created_at")
        .eq("site_id", siteId);

      let linkClicksQuery = supabase
        .from("link_clicks")
        .select("link_id, created_at")
        .eq("site_id", siteId);

      let socialClicksQuery = supabase
        .from("social_clicks")
        .select("platform, created_at")
        .eq("site_id", siteId);

      if (previousStart) {
        const comparisonStart = previousStart.toISOString();

        pageViewsQuery = pageViewsQuery.gte(
          "created_at",
          comparisonStart
        );

        linkClicksQuery = linkClicksQuery.gte(
          "created_at",
          comparisonStart
        );

        socialClicksQuery = socialClicksQuery.gte(
          "created_at",
          comparisonStart
        );
      }

      const [
        pageViewsResult,
        linkClicksResult,
        socialClicksResult,
        linksResult,
      ] = await Promise.all([
        pageViewsQuery,
        linkClicksQuery,
        socialClicksQuery,
        supabase
          .from("links")
          .select("id, title")
          .eq("site_id", siteId),
      ]);

      const pageViewRows = pageViewsResult.data || [];
      const linkClickRows = linkClicksResult.data || [];
      const socialClickRows = socialClicksResult.data || [];
      const links = linksResult.data || [];

      if (pageViewsResult.error) {
        console.error(
          "PAGE VIEWS ERROR:",
          pageViewsResult.error
        );
      }

      if (linkClicksResult.error) {
        console.error(
          "LINK CLICKS ERROR:",
          linkClicksResult.error
        );
      }

      if (socialClicksResult.error) {
        console.error(
          "SOCIAL CLICKS ERROR:",
          socialClicksResult.error
        );
      }

      if (linksResult.error) {
        console.error(
          "LINKS ERROR:",
          linksResult.error
        );
      }

      function isCurrentPeriod(createdAt: string) {
        if (!currentStart) return true;

        return (
          new Date(createdAt).getTime() >=
          currentStart.getTime()
        );
      }

      function isPreviousPeriod(createdAt: string) {
        if (!previousStart || !previousEnd) {
          return false;
        }

        const time = new Date(createdAt).getTime();

        return (
          time >= previousStart.getTime() &&
          time <= previousEnd.getTime()
        );
      }

      const currentPageViews = pageViewRows.filter((row) =>
        isCurrentPeriod(row.created_at)
      );

      const previousPageViews = pageViewRows.filter((row) =>
        isPreviousPeriod(row.created_at)
      );

      const currentLinkClicks = linkClickRows.filter((row) =>
        isCurrentPeriod(row.created_at)
      );

      const previousLinkClicks = linkClickRows.filter((row) =>
        isPreviousPeriod(row.created_at)
      );

      const currentSocialClicks = socialClickRows.filter((row) =>
        isCurrentPeriod(row.created_at)
      );

      const previousSocialClicks = socialClickRows.filter((row) =>
        isPreviousPeriod(row.created_at)
      );

      /*
       * CURRENT TOP LINKS
       */

      const linkClickCounts: Record<string, number> = {};

      currentLinkClicks.forEach((click) => {
        linkClickCounts[click.link_id] =
          (linkClickCounts[click.link_id] || 0) + 1;
      });

      const topLinks = links
        .map((link) => ({
          title: link.title,
          clicks: linkClickCounts[link.id] || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      /*
       * CURRENT SOCIAL BREAKDOWN
       */

      const socialCounts: Record<string, number> = {};

      currentSocialClicks.forEach((click) => {
        socialCounts[click.platform] =
          (socialCounts[click.platform] || 0) + 1;
      });

      const socialBreakdown = [
        "instagram",
        "youtube",
        "x",
      ]
        .filter(
          (platform) =>
            socialCounts[platform] > 0
        )
        .map((platform) => ({
          platform,
          clicks:
            socialCounts[platform],
        }));

      /*
       * CURRENT TOTALS
       */

      const totalPageViews =
        currentPageViews.length;

      const totalLinkClicks =
        currentLinkClicks.length;

      const totalSocialClicks =
        currentSocialClicks.length;

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

      /*
       * PREVIOUS TOTALS
       */

      const previousTotalPageViews =
        previousPageViews.length;

      const previousTotalLinkClicks =
        previousLinkClicks.length;

      const previousTotalSocialClicks =
        previousSocialClicks.length;

      const previousCtr =
        previousTotalPageViews > 0
          ? Number(
              (
                (previousTotalLinkClicks /
                  previousTotalPageViews) *
                100
              ).toFixed(1)
            )
          : 0;

      /*
       * GRAPH — CURRENT PERIOD ONLY
       */

      const graphMap: Record<
        string,
        {
          views: number;
          clicks: number;
        }
      > = {};

      currentPageViews.forEach((view) => {
        const date = new Date(view.created_at)
          .toISOString()
          .split("T")[0];

        if (!graphMap[date]) {
          graphMap[date] = {
            views: 0,
            clicks: 0,
          };
        }

        graphMap[date].views++;
      });

      currentLinkClicks.forEach((click) => {
        const date = new Date(click.created_at)
          .toISOString()
          .split("T")[0];

        if (!graphMap[date]) {
          graphMap[date] = {
            views: 0,
            clicks: 0,
          };
        }

        graphMap[date].clicks++;
      });

      let graphDates: string[] = [];

      if (range === "all") {
        graphDates =
          Object.keys(graphMap).sort();
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
          const date = new Date(end);

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

      if (graphDates.length === 0) {
        graphDates = [
          new Date()
            .toISOString()
            .split("T")[0],
        ];
      }

      const chart: AnalyticsPoint[] =
        graphDates.map((date) => {
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

          if (range === "today") {
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
        });

      setAnalytics({
        pageViews:
          totalPageViews,
        linkClicks:
          totalLinkClicks,
        socialClicks:
          totalSocialClicks,
        ctr,

        previousPageViews:
          previousTotalPageViews,
        previousLinkClicks:
          previousTotalLinkClicks,
        previousSocialClicks:
          previousTotalSocialClicks,
        previousCtr,

        topLinks,
        socialBreakdown,
        chart,
      });
    } catch (error) {
      console.error(
        "ANALYTICS FAILED:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }

  function getComparisonLabel() {
    if (dateRange === "today") {
      return "vs yesterday";
    }

    if (dateRange === "7days") {
      return "vs previous 7 days";
    }

    if (dateRange === "30days") {
      return "vs previous 30 days";
    }

    return "all-time total";
  }

  function getPercentChange(
    current: number,
    previous: number
  ): ChangeInfo {
    if (dateRange === "all") {
      return {
        text: "All-time total",
        tone: "neutral",
      };
    }

    if (previous === 0) {
      if (current === 0) {
        return {
          text: `No change ${getComparisonLabel()}`,
          tone: "neutral",
        };
      }

      return {
        text: `New activity ${getComparisonLabel()}`,
        tone: "up",
      };
    }

    const change =
      ((current - previous) /
        previous) *
      100;

    if (Math.abs(change) < 0.05) {
      return {
        text: `No change ${getComparisonLabel()}`,
        tone: "neutral",
      };
    }

    return {
      text: `${
        change > 0 ? "↑" : "↓"
      } ${Math.abs(change).toFixed(
        1
      )}% ${getComparisonLabel()}`,
      tone:
        change > 0
          ? "up"
          : "down",
    };
  }

  function getCtrChange(): ChangeInfo {
    if (!analytics) {
      return {
        text: "",
        tone: "neutral",
      };
    }

    if (dateRange === "all") {
      return {
        text: "All-time CTR",
        tone: "neutral",
      };
    }

    const difference =
      analytics.ctr -
      analytics.previousCtr;

    if (Math.abs(difference) < 0.05) {
      return {
        text: `No change ${getComparisonLabel()}`,
        tone: "neutral",
      };
    }

    return {
      text: `${
        difference > 0 ? "↑" : "↓"
      } ${Math.abs(difference).toFixed(
        1
      )} pp ${getComparisonLabel()}`,
      tone:
        difference > 0
          ? "up"
          : "down",
    };
  }

  function ComparisonText({
    info,
  }: {
    info: ChangeInfo;
  }) {
    return (
      <p
        className={`mt-2 text-xs font-medium ${
          info.tone === "up"
            ? "text-emerald-400"
            : info.tone === "down"
            ? "text-red-400"
            : "text-gray-600"
        }`}
      >
        {info.text}
      </p>
    );
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
      .select("id, username, published, custom_domain, domain_status")
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
        custom_domain: null,
        domain_status: "none",
      })
      .select(
        "id, username, published, custom_domain, domain_status"
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

  async function togglePublished() {
    if (!site || togglingPublish) {
      return;
    }

    const nextPublished =
      !site.published;

    setTogglingPublish(true);

    const { error } =
      await supabase
        .from("sites")
        .update({
          published:
            nextPublished,
        })
        .eq("id", site.id);

    if (error) {
      console.error(
        "PUBLISH TOGGLE ERROR:",
        error
      );

      alert(error.message);
      setTogglingPublish(false);
      return;
    }

    setSite({
      ...site,
      published:
        nextPublished,
    });

    setTogglingPublish(false);
  }

  function getDomainStatusLabel() {
    if (!site?.custom_domain) return "Not connected";

    if (site.domain_status === "verified") return "Active";
    if (site.domain_status === "pending") return "Pending DNS";
    if (site.domain_status === "error") return "Needs attention";

    return "Not connected";
  }

  function getDomainStatusTone() {
    if (!site?.custom_domain) return "text-gray-500";
    if (site.domain_status === "verified") return "text-emerald-400";
    if (site.domain_status === "pending") return "text-amber-400";
    if (site.domain_status === "error") return "text-red-400";
    return "text-gray-500";
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
      if (
        chart.length === 1
      ) {
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
          (
            point,
            index
          ) =>
            `${getX(
              index
            )},${getY(
              point.views
            )}`
        )
        .join(" ");

    const clicksPoints =
      chart
        .map(
          (
            point,
            index
          ) =>
            `${getX(
              index
            )},${getY(
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
            className="w-full min-w-[650px]"
            preserveAspectRatio="none"
          >
            {[
              0,
              0.25,
              0.5,
              0.75,
              1,
            ].map((ratio) => {
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
                    y={
                      y + 4
                    }
                    fill="rgba(255,255,255,0.35)"
                    fontSize="11"
                  >
                    {
                      value
                    }
                  </text>
                </g>
              );
            })}

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
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />

            <p className="mt-4 text-sm text-gray-500">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-10">
        {/* HEADER */}

        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Dashboard
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                  {profile?.display_name ||
                    profile?.username}
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Manage your profile, edit your creator page and see how your
                audience is engaging with it.
              </p>
            </div>

            {site && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    site.published
                      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                      : "bg-gray-500"
                  }`}
                />

                <div>
                  <p className="text-xs text-gray-600">
                    SITE STATUS
                  </p>

                  <p className="mt-0.5 text-sm font-semibold">
                    {site.published
                      ? "Published"
                      : "Offline"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PROFILE + SITE */}

        <section className="mb-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* PROFILE */}

          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
                    Your Profile
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    @
                    {
                      profile?.username
                    }
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg">
                  👤
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-600">
                    Display name
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-gray-200">
                    {profile?.display_name ||
                      "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-600">
                    Bio
                  </p>

                  <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-gray-400">
                    {profile?.bio ||
                      "No bio yet."}
                  </p>
                </div>
              </div>

              {site && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard/customize"
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold transition hover:border-violet-500/30 hover:bg-violet-500/10"
                >
                  Edit profile & appearance
                </button>
              )}
            </div>
          </div>

          {/* SITE */}

          <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] via-white/[0.025] to-cyan-500/[0.05] p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                    Your Site
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Creator page
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Your public home for links, content and social profiles.
                  </p>
                </div>

                {site && (
                  <div className="min-w-[210px] rounded-2xl border border-white/10 bg-black/20 p-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">
                          Site visibility
                        </p>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              site.published
                                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]"
                                : "bg-gray-500"
                            }`}
                          />

                          <p
                            className={`text-sm font-semibold ${
                              site.published
                                ? "text-emerald-300"
                                : "text-gray-400"
                            }`}
                          >
                            {site.published
                              ? "Live"
                              : "Offline"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          togglePublished
                        }
                        disabled={
                          togglingPublish
                        }
                        aria-pressed={
                          site.published
                        }
                        className={`relative h-7 w-12 rounded-full transition ${
                          site.published
                            ? "bg-emerald-500"
                            : "bg-white/10"
                        } ${
                          togglingPublish
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                            site.published
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] leading-4 text-gray-600">
                      {site.published
                        ? "Anyone with the link can view your page."
                        : "Your page is hidden, but your settings and blocks stay saved."}
                    </p>
                  </div>
                )}
              </div>

              {!site ? (
                <div className="mt-8">
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-xl">
                      🌐
                    </div>

                    <p className="mt-4 font-semibold">
                      Your site hasn't been created yet
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                      Create your personalized creator page and start sharing
                      everything from one place.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      createSite
                    }
                    disabled={
                      creating
                    }
                    className="mt-4 w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
                  >
                    {creating
                      ? "Creating..."
                      : "Create my site"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-600">
                      Public URL
                    </p>

                    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <p className="truncate text-lg font-semibold">
                        /
                        {
                          site.username
                        }
                      </p>

                      {site.published ? (
                        <a
                          href={`/${site.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-fit rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.08]"
                        >
                          Open ↗
                        </a>
                      ) : (
                        <span className="w-fit rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-medium text-gray-600">
                          Offline
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/dashboard/customize"
                        )
                      }
                      className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold transition hover:bg-violet-400"
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
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.07]"
                    >
                      Manage blocks
                    </button>

                    {site.published ? (
                      <a
                        href={`/${site.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold transition hover:bg-white/[0.07]"
                      >
                        View page
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.015] px-4 py-3 text-center text-sm font-semibold text-gray-700"
                      >
                        Page offline
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CUSTOM DOMAIN */}

        {site && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.025] to-violet-500/[0.06] p-6">
              <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg">
                      🌐
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                        Custom Domain
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        Use your own web address
                      </h2>
                    </div>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
                    Connect a domain you already own and use it instead of your default creator-page URL.
                  </p>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                          Domain
                        </p>

                        <p className="mt-1 truncate font-semibold text-gray-200">
                          {site.custom_domain || "No custom domain connected"}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                          Status
                        </p>

                        <p className={`mt-1 text-sm font-semibold ${getDomainStatusTone()}`}>
                          {getDomainStatusLabel()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard/domain")}
                  className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
                >
                  {site.custom_domain ? "Manage domain" : "Connect domain"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* QUICK ACTIONS */}

        {site && (
          <section className="mb-10">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
                Quick Actions
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[
                {
                  title:
                    "Edit design",
                  description:
                    "Themes, colors and SEO",
                  icon: "🎨",
                  action: () =>
                    router.push(
                      "/dashboard/customize"
                    ),
                },
                {
                  title:
                    "Manage blocks",
                  description:
                    "Links, video, images and more",
                  icon: "🧱",
                  action: () =>
                    router.push(
                      "/dashboard/links"
                    ),
                },
                {
                  title:
                    site.published
                      ? "Open public page"
                      : "Site is offline",
                  description:
                    site.published
                      ? `/${site.username}`
                      : "Turn the site live to open it",
                  icon:
                    site.published
                      ? "↗"
                      : "○",
                  action: () => {
                    if (
                      site.published
                    ) {
                      window.open(
                        `/${site.username}`,
                        "_blank"
                      );
                    }
                  },
                },
                {
                  title:
                    "Share page",
                  description:
                    "Copy link, QR code and quick share",
                  icon: "⌁",
                  action: () => {
                    if (site.published) {
                      setShareOpen(true);
                    } else {
                      alert("Publish your page before sharing it.");
                    }
                  },
                },
                {
                  title:
                    "Custom domain",
                  description:
                    site.custom_domain || "Connect your own domain",
                  icon: "🌐",
                  action: () =>
                    router.push(
                      "/dashboard/domain"
                    ),
                },
                {
                  title:
                    "Account settings",
                  description:
                    "Email, password and security",
                  icon: "⚙️",
                  action: () =>
                    router.push(
                      "/dashboard/settings"
                    ),
                },
                {
                  title:
                    "Refresh analytics",
                  description:
                    "Pull latest performance data",
                  icon: "↻",
                  action: () =>
                    loadAnalytics(
                      site.id,
                      dateRange
                    ),
                },
              ].map((item) => (
                <button
                  key={
                    item.title
                  }
                  type="button"
                  onClick={
                    item.action
                  }
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {
                          item.description
                        }
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-sm transition group-hover:bg-violet-500/15">
                      {
                        item.icon
                      }
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ANALYTICS */}

        {site &&
          analytics && (
            <section className="pb-10">
              <div className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
                    Analytics
                  </p>

                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    Your performance
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    See how visitors interact with your creator page.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      {
                        label:
                          "Today",
                        value:
                          "today",
                      },
                      {
                        label:
                          "7 Days",
                        value:
                          "7days",
                      },
                      {
                        label:
                          "30 Days",
                        value:
                          "30days",
                      },
                      {
                        label:
                          "All Time",
                        value:
                          "all",
                      },
                    ].map(
                      (
                        option
                      ) => (
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
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            dateRange ===
                            option.value
                              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/15"
                              : "border border-white/10 bg-white/[0.02] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300"
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
                  className="w-fit rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                >
                  {refreshing
                    ? "Refreshing..."
                    : "↻ Refresh analytics"}
                </button>
              </div>

              {/* ANALYTICS 2.0 STATS */}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-white/[0.02] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Page Views
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {analytics.pageViews.toLocaleString()}
                      </p>

                      <ComparisonText
                        info={getPercentChange(
                          analytics.pageViews,
                          analytics.previousPageViews
                        )}
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-sm font-bold text-violet-400">
                      ◉
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/[0.02] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Link Clicks
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {analytics.linkClicks.toLocaleString()}
                      </p>

                      <ComparisonText
                        info={getPercentChange(
                          analytics.linkClicks,
                          analytics.previousLinkClicks
                        )}
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-sm font-bold text-cyan-400">
                      ↗
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-white/[0.02] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        CTR
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {
                          analytics.ctr
                        }
                        %
                      </p>

                      <ComparisonText
                        info={
                          getCtrChange()
                        }
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-sm font-bold text-emerald-400">
                      %
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 to-white/[0.02] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Social Clicks
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {analytics.socialClicks.toLocaleString()}
                      </p>

                      <ComparisonText
                        info={getPercentChange(
                          analytics.socialClicks,
                          analytics.previousSocialClicks
                        )}
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-sm font-bold text-pink-400">
                      ◎
                    </div>
                  </div>
                </div>
              </div>

              {/* PERIOD SUMMARY */}

              {dateRange !==
                "all" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                        Comparison period
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {dateRange ===
                        "today"
                          ? "Today's performance compared with yesterday."
                          : dateRange ===
                            "7days"
                          ? "Last 7 days compared with the 7 days immediately before them."
                          : "Last 30 days compared with the 30 days immediately before them."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs sm:text-right">
                      <span className="text-gray-600">
                        Previous views
                      </span>
                      <span className="font-medium text-gray-300">
                        {
                          analytics.previousPageViews
                        }
                      </span>

                      <span className="text-gray-600">
                        Previous clicks
                      </span>
                      <span className="font-medium text-gray-300">
                        {
                          analytics.previousLinkClicks
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PERFORMANCE */}

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Performance
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Views and clicks over time
                  </p>
                </div>

                <PerformanceChart />

                <div className="mt-6 border-t border-white/10 pt-6">
                  <AnalyticsInsights
                    pageViews={
                      analytics.pageViews
                    }
                    linkClicks={
                      analytics.linkClicks
                    }
                    socialClicks={
                      analytics.socialClicks
                    }
                    ctr={
                      analytics.ctr
                    }
                    topLinks={
                      analytics.topLinks
                    }
                    socialBreakdown={
                      analytics.socialBreakdown
                    }
                  />
                </div>
              </div>

              {/* QUICK INSIGHTS */}

              <div className="mt-6 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
                    ✨
                  </div>

                  <div className="min-w-0 flex-1">
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
                          {analytics.socialBreakdown.length >
                          0
                            ? [
                                ...analytics.socialBreakdown,
                              ].sort(
                                (
                                  a,
                                  b
                                ) =>
                                  b.clicks -
                                  a.clicks
                              )[0]
                                .platform ===
                              "x"
                              ? "X"
                              : [
                                  ...analytics.socialBreakdown,
                                ].sort(
                                  (
                                    a,
                                    b
                                  ) =>
                                    b.clicks -
                                    a.clicks
                                )[0]
                                  .platform
                            : "No clicks yet"}
                        </p>

                        <p className="mt-1 text-sm text-cyan-400">
                          {analytics.socialBreakdown.length >
                          0
                            ? `${[
                                ...analytics.socialBreakdown,
                              ].sort(
                                (
                                  a,
                                  b
                                ) =>
                                  b.clicks -
                                  a.clicks
                              )[0]
                                .clicks} clicks`
                            : "Waiting for data"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Engagement
                        </p>

                        <p className="mt-2 font-semibold">
                          {analytics.ctr >=
                          10
                            ? "Excellent"
                            : analytics.ctr >=
                              5
                            ? "Good"
                            : analytics.ctr >
                              0
                            ? "Growing"
                            : "No data yet"}
                        </p>

                        <p className="mt-1 text-sm text-emerald-400">
                          {
                            analytics.ctr
                          }
                          % CTR
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS */}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
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
                                {
                                  index +
                                  1
                                }
                              </span>

                              <span className="truncate text-sm font-medium">
                                {
                                  link.title
                                }
                              </span>
                            </div>

                            <span className="ml-4 text-sm font-semibold text-gray-300">
                              {
                                link.clicks
                              }{" "}
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

                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
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
                              {
                                social.clicks
                              }{" "}
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
      </div>

      {site && (
        <SharePageModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          username={site.username}
          customDomain={
            site.domain_status === "verified" ? site.custom_domain : null
          }
          published={site.published}
        />
      )}
    </main>
  );
}
