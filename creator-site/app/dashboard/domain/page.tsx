"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DomainStatus = "none" | "pending" | "verified" | "error";

type Site = {
  id: string;
  username: string;
  custom_domain: string | null;
  domain_status: DomainStatus | null;
};

type VerificationRecord = {
  type: string;
  name: string;
  value: string;
  reason?: string;
};

type DomainApiState = {
  domain: string | null;
  status: DomainStatus;
  verified: boolean;
  misconfigured: boolean;
  active: boolean;
  verification: VerificationRecord[];
  recommendedIPv4: string[];
  recommendedCNAME: string[];
  error?: string;
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

export default function CustomDomainPage() {
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [domain, setDomain] = useState("");
  const [domainState, setDomainState] =
    useState<DomainApiState | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("sites")
      .select("id, username, custom_domain, domain_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("DOMAIN SITE LOAD ERROR:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      router.replace("/onboarding");
      return;
    }

    const currentSite = data as Site;

    setSite(currentSite);
    setDomain(currentSite.custom_domain || "");

    if (currentSite.custom_domain) {
      await refreshDomainStatus();
    }

    setLoading(false);
  }

  async function readJson(response: Response) {
    try {
      return (await response.json()) as DomainApiState;
    } catch {
      return {
        domain: null,
        status: "error",
        verified: false,
        misconfigured: true,
        active: false,
        verification: [],
        recommendedIPv4: [],
        recommendedCNAME: [],
        error: "The server returned an invalid response.",
      } satisfies DomainApiState;
    }
  }

  async function refreshDomainStatus() {
    try {
      setChecking(true);

      const response = await fetch("/api/domains", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJson(response);

      if (!response.ok) {
        console.error("DOMAIN STATUS ERROR:", data);
        setDomainState({
          ...data,
          status: data.status || "error",
        });
        return;
      }

      setDomainState(data);

      if (data.domain) {
        setDomain(data.domain);
      }

      if (site) {
        setSite({
          ...site,
          custom_domain: data.domain,
          domain_status: data.status,
        });
      }
    } catch (error) {
      console.error("DOMAIN STATUS ERROR:", error);
    } finally {
      setChecking(false);
    }
  }

  async function saveDomain() {
    if (!site || saving) return;

    const normalized = normalizeDomain(domain);

    if (!isValidDomain(normalized)) {
      alert("Enter a valid domain such as example.com.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: normalized,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        console.error("DOMAIN CONNECT ERROR:", data);
        alert(data.error || "Could not connect this domain.");
        setDomainState(data);
        return;
      }

      setDomainState(data);
      setDomain(data.domain || normalized);

      setSite({
        ...site,
        custom_domain: data.domain || normalized,
        domain_status: data.status,
      });
    } catch (error) {
      console.error("DOMAIN CONNECT ERROR:", error);
      alert("Could not connect this domain.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    if (!site?.custom_domain || checking) return;

    try {
      setChecking(true);

      const response = await fetch("/api/domains", {
        method: "PATCH",
      });

      const data = await readJson(response);

      setDomainState(data);

      if (data.domain) {
        setDomain(data.domain);
      }

      setSite({
        ...site,
        custom_domain: data.domain || site.custom_domain,
        domain_status: data.status,
      });

      if (!response.ok) {
        alert(
          data.error ||
            "The domain is not ready yet. Double-check your DNS records and try again."
        );
        return;
      }

      if (data.active) {
        alert("Domain verified and connected!");
      }
    } catch (error) {
      console.error("DOMAIN VERIFY ERROR:", error);
      alert("Could not verify this domain.");
    } finally {
      setChecking(false);
    }
  }

  async function removeDomain() {
    if (!site || removing) return;

    const confirmed = window.confirm(
      "Remove this custom domain from your creator page?"
    );

    if (!confirmed) return;

    try {
      setRemoving(true);

      const response = await fetch("/api/domains", {
        method: "DELETE",
      });

      const data = await readJson(response);

      if (!response.ok) {
        alert(data.error || "Could not remove this domain.");
        return;
      }

      setDomain("");
      setDomainState(null);

      setSite({
        ...site,
        custom_domain: null,
        domain_status: "none",
      });
    } catch (error) {
      console.error("DOMAIN REMOVE ERROR:", error);
      alert("Could not remove this domain.");
    } finally {
      setRemoving(false);
    }
  }

  async function copyValue(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);

    window.setTimeout(() => {
      setCopied("");
    }, 1400);
  }

  const dnsRecords = useMemo(() => {
    const records: Array<{
      id: string;
      type: string;
      name: string;
      value: string;
      note: string;
    }> = [];

    if (!domainState) return records;

    domainState.verification.forEach((record, index) => {
      records.push({
        id: `verification-${index}`,
        type: record.type.toUpperCase(),
        name: record.name,
        value: record.value,
        note:
          record.reason ||
          "Required by Vercel to verify domain ownership.",
      });
    });

    domainState.recommendedIPv4.forEach((value, index) => {
      records.push({
        id: `ipv4-${index}`,
        type: "A",
        name: "@",
        value,
        note: "Point the apex domain to Vercel.",
      });
    });

    domainState.recommendedCNAME.forEach((value, index) => {
      records.push({
        id: `cname-${index}`,
        type: "CNAME",
        name: "www",
        value,
        note: "Point the subdomain to Vercel.",
      });
    });

    return records.filter(
      (record, index, all) =>
        all.findIndex(
          (item) =>
            item.type === record.type &&
            item.name === record.name &&
            item.value === record.value
        ) === index
    );
  }, [domainState]);

  function getStatus() {
    if (!site?.custom_domain) {
      return {
        label: "Not connected",
        tone: "text-gray-400",
        dot: "bg-gray-500",
      };
    }

    if (domainState?.active || site.domain_status === "verified") {
      return {
        label: "Active",
        tone: "text-emerald-400",
        dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]",
      };
    }

    if (site.domain_status === "error") {
      return {
        label: "Needs attention",
        tone: "text-red-400",
        dot: "bg-red-400",
      };
    }

    return {
      label: "Pending DNS",
      tone: "text-amber-400",
      dot: "bg-amber-400",
    };
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />

          <p className="mt-4 text-sm text-gray-500">
            Loading domain settings...
          </p>
        </div>
      </main>
    );
  }

  if (!site) return null;

  const status = getStatus();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:py-10">

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Domain settings
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Custom domain
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Connect a domain you own. We&apos;ll add it to the Vercel
            project and show you the DNS records Vercel expects.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-600">
                Current status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />

                <p className={`font-semibold ${status.tone}`}>
                  {checking ? "Checking..." : status.label}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                Default page
              </p>

              <p className="mt-1 text-sm font-medium text-gray-300">
                /{site.username}
              </p>
            </div>
          </div>

          <div className="mt-7">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Domain
            </label>

            <div className="flex rounded-2xl border border-white/10 bg-black/30 px-4 focus-within:border-violet-500">
              <span className="py-4 text-gray-600">https://</span>

              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="yourdomain.com"
                disabled={saving || removing}
                className="min-w-0 flex-1 bg-transparent py-4 outline-none placeholder:text-gray-700 disabled:opacity-50"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              Enter the domain only. For example: yourdomain.com
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={saveDomain}
              disabled={saving || removing || !domain.trim()}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Connecting..."
                : site.custom_domain
                ? "Update domain"
                : "Connect domain"}
            </button>

            {site.custom_domain && (
              <>
                <button
                  type="button"
                  onClick={verifyDomain}
                  disabled={checking || saving || removing}
                  className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking ? "Checking..." : "Verify domain"}
                </button>

                <button
                  type="button"
                  onClick={removeDomain}
                  disabled={saving || checking || removing}
                  className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/[0.12] disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove domain"}
                </button>
              </>
            )}
          </div>
        </section>

        {site.custom_domain && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-400">
                  DNS configuration
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Configure your DNS
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Add the records below at the company where your domain&apos;s
                  DNS is managed. DNS changes can take time to propagate.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshDomainStatus}
                disabled={checking}
                className="w-fit rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                {checking ? "Checking..." : "↻ Check status"}
              </button>
            </div>

            {dnsRecords.length > 0 ? (
              <div className="mt-6 space-y-3">
                {dnsRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-[90px_1fr_1.5fr]">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                          Type
                        </p>
                        <p className="mt-1 text-sm font-bold text-cyan-300">
                          {record.type}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                          Name
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate font-mono text-sm text-gray-300">
                            {record.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              copyValue(record.name, `${record.id}-name`)
                            }
                            className="text-[10px] text-violet-400 hover:text-violet-300"
                          >
                            {copied === `${record.id}-name`
                              ? "Copied"
                              : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                          Value
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate font-mono text-sm text-gray-300">
                            {record.value}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              copyValue(record.value, `${record.id}-value`)
                            }
                            className="text-[10px] text-violet-400 hover:text-violet-300"
                          >
                            {copied === `${record.id}-value`
                              ? "Copied"
                              : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-gray-600">
                      {record.note}
                    </p>
                  </div>
                ))}
              </div>
            ) : domainState?.active ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                <p className="font-semibold text-emerald-300">
                  ✓ Domain configuration is active
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-200/60">
                  Vercel reports that this domain is verified and correctly
                  configured.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                <p className="font-semibold text-amber-300">
                  Waiting for Vercel DNS details
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-200/55">
                  Vercel has not returned a DNS record in the API response yet.
                  Check the domain in your Vercel project&apos;s Domains settings,
                  then use Check status here again.
                </p>
              </div>
            )}

            {domainState && !domainState.active && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                    Ownership
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      domainState.verified
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {domainState.verified
                      ? "Verified"
                      : "Verification required"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                    DNS
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      domainState.misconfigured
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {domainState.misconfigured
                      ? "Needs configuration"
                      : "Configured"}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-lg">
              ⚡
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                How this works
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Your Vercel token stays on the server. The browser only talks
                to your own /api/domains endpoint, which checks the logged-in
                user before changing the domain on the Vercel project.
              </p>

              <p className="mt-3 text-xs leading-5 text-gray-600">
                Actual DNS verification uses your deployed Vercel project.
                localhost is only the dashboard you&apos;re using to control it.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

