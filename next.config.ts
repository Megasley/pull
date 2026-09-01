import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

// The local Supabase CLI serves auth/API over plain HTTP (no TLS), which
// `https:` in connect-src doesn't cover — without this, the browser client's
// token auto-refresh is silently blocked by CSP on every local dev session.
// Scoped to development only so production's connect-src stays as strict as
// the real (https) Supabase project URL already requires.
const localSupabaseOrigin =
  process.env.NODE_ENV !== "production"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    : undefined;

const CSP_HEADER = {
  key: "Content-Security-Policy",
  value: [
    "base-uri 'self'",
    "form-action 'self'",
    "default-src 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
    "img-src 'self' data: blob: https: data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com",
    "font-src 'self' data:",
    ["connect-src 'self' https: wss:", localSupabaseOrigin].filter(Boolean).join(" "),
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

const nextConfig: NextConfig = {
  // Allow HMR WebSocket connections when accessing the dev server via 127.0.0.1.
  // Without this, hot reload is blocked and every change triggers a full page
  // reload, which floods the DB connection pool and causes cascading ECONNRESET.
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/ecosystem/partners/the-buidl",
        destination: "/ecosystem/partners/thebuidl",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS, CSP_HEADER],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "user-images.githubusercontent.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm"],
  },
};

export default nextConfig;
