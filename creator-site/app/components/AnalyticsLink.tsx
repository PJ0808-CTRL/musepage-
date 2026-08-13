"use client";

import React, { type ReactNode } from "react";

type Props = {
  siteId: string;
  linkId: string;
  url: string;
  title?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: "_blank" | "_self";
};

export default function AnalyticsLink({
  siteId,
  linkId,
  url,
  title,
  children,
  className,
  style,
  target = "_blank",
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
          linkId,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.error("Link click tracking failed:", error);
    }
  }

  return (
    <a
      href={url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children ?? title}
    </a>
  );
}