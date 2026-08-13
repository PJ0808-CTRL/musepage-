import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type DomainStatus = "none" | "pending" | "verified" | "error";

type VercelProjectDomain = {
  name?: string;
  verified?: boolean;
  verification?: Array<{
    type?: string;
    domain?: string;
    value?: string;
    reason?: string;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
  [key: string]: unknown;
};

type VercelDomainConfig = {
  misconfigured?: boolean;
  recommendedIPv4?: string[];
  recommendedCNAME?: string[];
  error?: {
    code?: string;
    message?: string;
  };
  [key: string]: unknown;
};

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\.$/, "");
}

function isValidDomain(value: string) {
  const domain = normalizeDomain(value);

  if (!domain || domain.length > 253) return false;
  if (domain.includes("..")) return false;

  const labels = domain.split(".");

  if (labels.length < 2) return false;

  return labels.every((label) => {
    if (!label || label.length > 63) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;

    return /^[a-z0-9-]+$/.test(label);
  });
}

function getVercelConfig() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    throw new Error(
      "Missing VERCEL_TOKEN or VERCEL_PROJECT_ID in server environment variables."
    );
  }

  return {
    token,
    projectId,
    teamId: teamId || null,
  };
}

function buildVercelUrl(path: string, teamId: string | null) {
  const url = new URL(`https://api.vercel.com${path}`);

  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  return url.toString();
}

async function vercelFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{
  ok: boolean;
  status: number;
  data: T;
}> {
  const { token, teamId } = getVercelConfig();

  const response = await fetch(buildVercelUrl(path, teamId), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    data = {} as T;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object"
  ) {
    const error = data.error as {
      message?: string;
      code?: string;
    };

    return error.message || error.code || fallback;
  }

  return fallback;
}

async function getOwnedSite() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      site: null,
      error: "Unauthorized",
    };
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, user_id, username, custom_domain, domain_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (siteError) {
    return {
      supabase,
      user,
      site: null,
      error: siteError.message,
    };
  }

  if (!site) {
    return {
      supabase,
      user,
      site: null,
      error: "Site not found",
    };
  }

  return {
    supabase,
    user,
    site,
    error: null,
  };
}

async function getDomainDetails(domain: string) {
  const { projectId } = getVercelConfig();

  const [projectDomainResult, configResult] = await Promise.all([
    vercelFetch<VercelProjectDomain>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(
        domain
      )}`
    ),
    vercelFetch<VercelDomainConfig>(
      `/v6/domains/${encodeURIComponent(domain)}/config`
    ),
  ]);

  const projectDomain = projectDomainResult.data;
  const config = configResult.data;

  const verified = Boolean(projectDomain?.verified);
  const misconfigured =
    typeof config?.misconfigured === "boolean"
      ? config.misconfigured
      : true;

  const active = verified && !misconfigured;

  const verification = Array.isArray(projectDomain?.verification)
    ? projectDomain.verification
        .filter(
          (item) =>
            Boolean(item?.type) &&
            Boolean(item?.domain) &&
            Boolean(item?.value)
        )
        .map((item) => ({
          type: item.type || "",
          name: item.domain || "",
          value: item.value || "",
          reason: item.reason || "",
        }))
    : [];

  const recommendedIPv4 = Array.isArray(config?.recommendedIPv4)
    ? config.recommendedIPv4
    : [];

  const recommendedCNAME = Array.isArray(config?.recommendedCNAME)
    ? config.recommendedCNAME
    : [];

  return {
    projectDomainRequestOk: projectDomainResult.ok,
    projectDomainStatus: projectDomainResult.status,
    configRequestOk: configResult.ok,
    configStatus: configResult.status,
    verified,
    misconfigured,
    active,
    verification,
    recommendedIPv4,
    recommendedCNAME,
    projectDomain,
    config,
  };
}

export async function GET() {
  try {
    const { supabase, site, error } = await getOwnedSite();

    if (error || !site) {
      return NextResponse.json(
        { error: error || "Site not found" },
        { status: error === "Unauthorized" ? 401 : 404 }
      );
    }

    if (!site.custom_domain) {
      return NextResponse.json({
        domain: null,
        status: "none" satisfies DomainStatus,
        verified: false,
        misconfigured: false,
        active: false,
        verification: [],
        recommendedIPv4: [],
        recommendedCNAME: [],
      });
    }

    const domain = normalizeDomain(site.custom_domain);
    const details = await getDomainDetails(domain);

    let nextStatus: DomainStatus = "pending";

    if (details.active) {
      nextStatus = "verified";
    } else if (
      !details.projectDomainRequestOk &&
      details.projectDomainStatus !== 404
    ) {
      nextStatus = "error";
    }

    if (site.domain_status !== nextStatus) {
      await supabase
        .from("sites")
        .update({ domain_status: nextStatus })
        .eq("id", site.id);
    }

    return NextResponse.json({
      domain,
      status: nextStatus,
      verified: details.verified,
      misconfigured: details.misconfigured,
      active: details.active,
      verification: details.verification,
      recommendedIPv4: details.recommendedIPv4,
      recommendedCNAME: details.recommendedCNAME,
    });
  } catch (error) {
    console.error("DOMAIN STATUS API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load domain status.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, site, error } = await getOwnedSite();

    if (error || !site) {
      return NextResponse.json(
        { error: error || "Site not found" },
        { status: error === "Unauthorized" ? 401 : 404 }
      );
    }

    const body = (await request.json()) as {
      domain?: string;
    };

    const domain = normalizeDomain(body.domain || "");

    if (!isValidDomain(domain)) {
      return NextResponse.json(
        { error: "Enter a valid domain such as example.com." },
        { status: 400 }
      );
    }

    if (
      site.custom_domain &&
      normalizeDomain(site.custom_domain) !== domain
    ) {
      const oldDomain = normalizeDomain(site.custom_domain);
      const { projectId } = getVercelConfig();

      await vercelFetch(
        `/v9/projects/${encodeURIComponent(
          projectId
        )}/domains/${encodeURIComponent(oldDomain)}`,
        {
          method: "DELETE",
        }
      );
    }

    const { projectId } = getVercelConfig();

    const addResult = await vercelFetch<VercelProjectDomain>(
      `/v10/projects/${encodeURIComponent(projectId)}/domains`,
      {
        method: "POST",
        body: JSON.stringify({
          name: domain,
        }),
      }
    );

    const addErrorMessage = getErrorMessage(
      addResult.data,
      "Vercel could not add this domain."
    );

    const alreadyExists =
      addResult.status === 409 ||
      /already|exists|registered/i.test(addErrorMessage);

    if (!addResult.ok && !alreadyExists) {
      await supabase
        .from("sites")
        .update({
          custom_domain: domain,
          domain_status: "error",
        })
        .eq("id", site.id);

      return NextResponse.json(
        {
          error: addErrorMessage,
        },
        { status: addResult.status || 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("sites")
      .update({
        custom_domain: domain,
        domain_status: "pending",
      })
      .eq("id", site.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const details = await getDomainDetails(domain);

    const nextStatus: DomainStatus = details.active
      ? "verified"
      : "pending";

    if (nextStatus !== "pending") {
      await supabase
        .from("sites")
        .update({ domain_status: nextStatus })
        .eq("id", site.id);
    }

    return NextResponse.json({
      domain,
      status: nextStatus,
      verified: details.verified,
      misconfigured: details.misconfigured,
      active: details.active,
      verification: details.verification,
      recommendedIPv4: details.recommendedIPv4,
      recommendedCNAME: details.recommendedCNAME,
    });
  } catch (error) {
    console.error("DOMAIN ADD API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect this domain.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const { supabase, site, error } = await getOwnedSite();

    if (error || !site) {
      return NextResponse.json(
        { error: error || "Site not found" },
        { status: error === "Unauthorized" ? 401 : 404 }
      );
    }

    if (!site.custom_domain) {
      return NextResponse.json(
        { error: "No custom domain has been connected yet." },
        { status: 400 }
      );
    }

    const domain = normalizeDomain(site.custom_domain);
    const { projectId } = getVercelConfig();

    const verifyResult = await vercelFetch<VercelProjectDomain>(
      `/v9/projects/${encodeURIComponent(
        projectId
      )}/domains/${encodeURIComponent(domain)}/verify`,
      {
        method: "POST",
      }
    );

    if (!verifyResult.ok) {
      const message = getErrorMessage(
        verifyResult.data,
        "Vercel could not verify the domain yet."
      );

      const details = await getDomainDetails(domain);

      await supabase
        .from("sites")
        .update({
          domain_status: details.active ? "verified" : "pending",
        })
        .eq("id", site.id);

      return NextResponse.json(
        {
          error: message,
          domain,
          status: details.active ? "verified" : "pending",
          verified: details.verified,
          misconfigured: details.misconfigured,
          active: details.active,
          verification: details.verification,
          recommendedIPv4: details.recommendedIPv4,
          recommendedCNAME: details.recommendedCNAME,
        },
        { status: 400 }
      );
    }

    const details = await getDomainDetails(domain);

    const nextStatus: DomainStatus = details.active
      ? "verified"
      : "pending";

    await supabase
      .from("sites")
      .update({
        domain_status: nextStatus,
      })
      .eq("id", site.id);

    return NextResponse.json({
      domain,
      status: nextStatus,
      verified: details.verified,
      misconfigured: details.misconfigured,
      active: details.active,
      verification: details.verification,
      recommendedIPv4: details.recommendedIPv4,
      recommendedCNAME: details.recommendedCNAME,
    });
  } catch (error) {
    console.error("DOMAIN VERIFY API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not verify this domain.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { supabase, site, error } = await getOwnedSite();

    if (error || !site) {
      return NextResponse.json(
        { error: error || "Site not found" },
        { status: error === "Unauthorized" ? 401 : 404 }
      );
    }

    if (site.custom_domain) {
      const domain = normalizeDomain(site.custom_domain);
      const { projectId } = getVercelConfig();

      const removeResult = await vercelFetch(
        `/v9/projects/${encodeURIComponent(
          projectId
        )}/domains/${encodeURIComponent(domain)}`,
        {
          method: "DELETE",
        }
      );

      if (!removeResult.ok && removeResult.status !== 404) {
        const message = getErrorMessage(
          removeResult.data,
          "Vercel could not remove this domain."
        );

        return NextResponse.json(
          { error: message },
          { status: removeResult.status || 400 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("sites")
      .update({
        custom_domain: null,
        domain_status: "none",
      })
      .eq("id", site.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DOMAIN REMOVE API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not remove this domain.",
      },
      { status: 500 }
    );
  }
}