"use client";

import { useEffect } from "react";

type Props = {
  siteId: string;
  redirectUrl?: string | null;
};

const VISITOR_KEY = "musepage_visitor_id";

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const nextId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `mp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(VISITOR_KEY, nextId);
    return nextId;
  } catch {
    return `mp_session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export default function PageViewTracker({
  siteId,
  redirectUrl = null,
}: Props) {
  useEffect(() => {
    if (!siteId) return;

    let redirected = false;

    const goToRedirect = () => {
      if (!redirectUrl || redirected) return;
      redirected = true;
      window.location.replace(redirectUrl);
    };

    const pathname = window.location.pathname;
    const dedupeKey = `musepage_view_${siteId}_${pathname}`;

    try {
      const previous = Number(
        window.sessionStorage.getItem(dedupeKey) || "0"
      );
      const now = Date.now();

      if (now - previous < 2000) {
        goToRedirect();
        return;
      }

      window.sessionStorage.setItem(dedupeKey, String(now));
    } catch {
      // Analytics must never block the creator page.
    }

    const visitorId = getVisitorId();

    const fallbackTimer = redirectUrl
      ? window.setTimeout(goToRedirect, 1200)
      : null;

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        siteId,
        visitorId,
        pathname,
        referrer: document.referrer || "",
      }),
    })
      .catch((error) => {
        console.warn("MusePage analytics view tracking failed:", error);
      })
      .finally(() => {
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        goToRedirect();
      });

    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [siteId, redirectUrl]);

  return null;
}