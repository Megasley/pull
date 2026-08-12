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

type ProtectedPattern = (typeof protectedRoutes)[number];

function patternToRegExp(pattern: string): RegExp {
  const escape = (value: string): string => value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const parts: string[] = [];
  let remaining = pattern;
  while (remaining.length > 0) {
    const starIdx = remaining.indexOf("*");
    if (starIdx === -1) {
      parts.push(escape(remaining));
      break;
    }
    const before = remaining.slice(0, starIdx);
    parts.push(escape(before));
    parts.push("[^/]+");
    remaining = remaining.slice(starIdx + 1);
  }
  return new RegExp(`^${parts.join("")}/?$`);
}

const EXACT_PATH_ROUTES: string[] = [];
const PREFIX_PATH_ROUTES: string[] = [];
const WILDCARD_ROUTES: RegExp[] = [];

for (const pattern of protectedRoutes as readonly string[]) {
  if (pattern.includes("*")) {
    WILDCARD_ROUTES.push(patternToRegExp(pattern));
  } else {
    EXACT_PATH_ROUTES.push(pattern);
    PREFIX_PATH_ROUTES.push(`${pattern}/`);
  }
}

const PROJECTS_SUBMIT_REGEXP = /^\/projects\/[^/]+\/submit\/?$/;

export function isProtectedRoute(pathname: string): boolean {
  if (PROJECTS_SUBMIT_REGEXP.test(pathname)) {
    return true;
  }

  for (let i = 0; i < EXACT_PATH_ROUTES.length; i += 1) {
    if (pathname === EXACT_PATH_ROUTES[i]) {
      return true;
    }
  }

  for (let i = 0; i < PREFIX_PATH_ROUTES.length; i += 1) {
    if (pathname.startsWith(PREFIX_PATH_ROUTES[i])) {
      return true;
    }
  }

  for (let i = 0; i < WILDCARD_ROUTES.length; i += 1) {
    if (WILDCARD_ROUTES[i].test(pathname)) {
      return true;
    }
  }

  return false;
}

/** Routes that need middleware to inspect the session (redirects). */
export function isAuthMiddlewareRoute(pathname: string): boolean {
  if (pathname === "/sign-in") {
    return true;
  }

  return isProtectedRoute(pathname);
}

export function isProtectedRoutePattern(
  pattern: ProtectedPattern,
  pathname: string,
): boolean {
  if (pattern.includes("*")) {
    return patternToRegExp(pattern).test(pathname);
  }
  return pathname === pattern || pathname.startsWith(`${pattern}/`);
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) {
    return "/dashboard";
  }

  const normalized = String(path).trim();

  if (!normalized || !normalized.startsWith("/")) {
    return "/dashboard";
  }

  if (/\\/.test(normalized)) {
    return "/dashboard";
  }

  if (/^\/[\/\\]/.test(normalized)) {
    return "/dashboard";
  }

  if (normalized.includes("/..") || normalized.includes("/.")) {
    return "/dashboard";
  }

  try {
    const url = new URL(normalized, "https://placeholder.invalid");
    if (url.hostname && url.hostname !== "placeholder.invalid") {
      return "/dashboard";
    }
    if (url.protocol !== "https:") {
      return "/dashboard";
    }
    const trimmedPathname = url.pathname.replace(/\/$/, "") || "/";
    const cleanPath = trimmedPathname + url.search + url.hash;
    return cleanPath || "/dashboard";
  } catch {
    return "/dashboard";
  }
}
