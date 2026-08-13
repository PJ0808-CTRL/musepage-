import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  /*
   * Get every profile that allows
   * search engine indexing.
   */
  const { data: sites, error } = await supabase
    .from("sites")
    .select("username, updated_at, search_engine_indexing")
    .eq("search_engine_indexing", true);

  if (error) {
    console.error("SITEMAP ERROR:", error);

    return [];
  }

  /*
   * Main website.
   */
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  /*
   * Add every public creator profile.
   */
  for (const site of sites || []) {
    if (!site.username) continue;

    entries.push({
      url: `${siteUrl}/${site.username}`,

      lastModified: site.updated_at
        ? new Date(site.updated_at)
        : new Date(),

      changeFrequency: "weekly",

      priority: 0.8,
    });
  }

  return entries;
}