"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getMusePageTitle(pathname: string) {
  if (pathname === "/") return "MusePage";

  if (pathname === "/login") return "Login | MusePage";
  if (pathname === "/signup") return "Sign Up | MusePage";
  if (pathname === "/onboarding") return "Onboarding | MusePage";
  if (pathname === "/forgot-password") return "Forgot Password | MusePage";
  if (pathname === "/reset-password") return "Reset Password | MusePage";

  if (pathname === "/dashboard") return "Dashboard | MusePage";
  if (pathname.startsWith("/dashboard/customize"))
    return "Customize | MusePage";
  if (pathname.startsWith("/dashboard/links"))
    return "Blocks | MusePage";
  if (pathname.startsWith("/dashboard/domain"))
    return "Domain | MusePage";
  if (pathname.startsWith("/dashboard/settings"))
    return "Settings | MusePage";
  if (pathname.startsWith("/dashboard/editor"))
    return "Editor | MusePage";
  if (pathname.startsWith("/dashboard/analytics"))
    return "Analytics | MusePage";

  const segments = pathname.split("/").filter(Boolean);

  // Public creator profile: /username
  if (segments.length === 1) {
    return `@${segments[0]} | MusePage`;
  }

  return "MusePage";
}

export default function PageTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = getMusePageTitle(pathname);
  }, [pathname]);

  return null;
}
