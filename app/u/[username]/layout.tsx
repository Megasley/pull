import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { loadPublicBuilderProfile } from "@/lib/profile/load-public-profile";

type PublicProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

/**
 * Runs the existence check here rather than only in page.tsx: this segment
 * has a loading.tsx, which wraps page.tsx (but not layout.tsx) in a
 * Suspense boundary and starts streaming a 200 response before that page's
 * own notFound() call can run. Checking here, before streaming starts,
 * lets a missing user actually get a 404 status instead of a 200 that gets
 * silently patched to the not-found UI client-side after the fact.
 * loadPublicBuilderProfile is wrapped in React's cache(), so this doesn't
 * add a second DB round trip — page.tsx's own call reuses this result.
 */
export default async function PublicProfileLayout({
  children,
  params,
}: PublicProfileLayoutProps) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const data = await loadPublicBuilderProfile(username, viewer?.id);

  if (!data) {
    notFound();
  }

  return children;
}
