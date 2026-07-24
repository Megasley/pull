import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/supabase/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl() || siteConfig.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/review",
          "/review/",
          "/settings",
          "/settings/",
          "/dashboard",
          "/repositories",
          "/activity",
          "/portfolio",
          "/reputation",
          "/achievements",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
