import type { MetadataRoute } from "next";

import { getAllLessonSlugs } from "@/lib/content";
import { availableRoadmaps } from "@/lib/landing-data";
import { getAllProjects } from "@/lib/projects/catalog";
import { siteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/supabase/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl() || siteConfig.url;
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/roadmaps",
    "/projects",
    "/sign-in",
    "/privacy",
    "/terms",
    "/credits",
    "/support",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const roadmapRoutes: MetadataRoute.Sitemap = availableRoadmaps.map((roadmap) => ({
    url: `${base}/roadmaps/${roadmap.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const lessonRoutes: MetadataRoute.Sitemap = getAllLessonSlugs().map(
    ({ roadmap, lesson }) => ({
      url: `${base}/roadmaps/${roadmap}/lessons/${lesson}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  const projectRoutes: MetadataRoute.Sitemap = getAllProjects().map((project) => ({
    url: `${base}/projects/${project.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...roadmapRoutes, ...lessonRoutes, ...projectRoutes];
}
