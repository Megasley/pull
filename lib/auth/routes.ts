export const protectedRoutes = [
  "/start",
  "/onboarding",
  "/dashboard",
  "/achievements",
  "/settings",
  "/repositories",
  "/activity",
  "/portfolio",
  "/reputation",
  "/projects/*/submit",
  "/review",
  "/admin",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  if (pathname === "/start" || pathname.startsWith("/start/")) {
    return true;
  }

  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }

  if (pathname === "/review" || pathname.startsWith("/review/")) {
    return true;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return true;
  }

  if (pathname === "/achievements" || pathname.startsWith("/achievements/")) {
    return true;
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return true;
  }

  if (pathname === "/repositories" || pathname.startsWith("/repositories/")) {
    return true;
  }

  if (pathname === "/activity" || pathname.startsWith("/activity/")) {
    return true;
  }

  if (pathname === "/portfolio" || pathname.startsWith("/portfolio/")) {
    return true;
  }

  if (pathname === "/reputation" || pathname.startsWith("/reputation/")) {
    return true;
  }

  // Roadmaps + lessons + discover/issues are public to browse;
  // progress actions and personalization require auth in-app.
  return /^\/projects\/[^/]+\/submit\/?$/.test(pathname);
}

/** Routes that need middleware to inspect the session (redirects). */
export function isAuthMiddlewareRoute(pathname: string): boolean {
  if (pathname === "/sign-in") {
    return true;
  }

  return isProtectedRoute(pathname);
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
