import {
  Activity,
  Bell,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/** lucide-react doesn't export a public `LucideIcon` type — every icon
 *  component shares this shape, so it stands in for one. */
export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export const siteConfig = {
  name: "Pull",
  description: "The operating system for open source builders.",
  tagline: "Become an Open Source Builder.",
  url: "https://pullos.dev",
  /** Public contact for privacy / support. */
  contactEmail: "hello@pullos.dev",
  /** Product feedback (bugs, curriculum notes, feature requests). */
  feedbackUrl: "https://github.com/Megasley/pull/issues/new/choose",
} as const;

/** Public social profiles. */
export const socialLinks = [
  {
    title: "GitHub",
    href: "https://github.com/Megasley/pull",
    icon: "github",
  },
  {
    title: "X / @pullosdev",
    href: "https://x.com/pullosdev",
    icon: "x",
  },
  {
    title: "Buzz Community",
    href: "https://pull.communities.buzz.xyz/invite/v2.2UvyWPcITanGWkmizYh9YBOWEzW4gtQ20HFsyV7erpo",
    icon: "buzz",
  },
] as const satisfies readonly {
  title: string;
  href: string;
  icon: "github" | "x" | "buzz";
}[];

export type SocialLink = (typeof socialLinks)[number];
export type SocialIconName = SocialLink["icon"];

export type NavLink = {
  title: string;
  href: string;
  /** Open in a new tab (for external resources). */
  external?: boolean;
};

export type NavLinkComingSoon = {
  title: string;
  comingSoon: true;
};

export type NavDivider = {
  divider: true;
};

export type NavGroupItem = NavLink | NavLinkComingSoon | NavDivider;

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function isNavLink(item: NavGroupItem): item is NavLink {
  return "href" in item;
}

export function isNavComingSoon(item: NavGroupItem): item is NavLinkComingSoon {
  return "comingSoon" in item && item.comingSoon === true;
}

export function isNavDivider(item: NavGroupItem): item is NavDivider {
  return "divider" in item && item.divider === true;
}

export type NavGroup = {
  title: string;
  items: readonly NavGroupItem[];
};

export type PrimaryNavItem =
  ({ type: "link" } & NavLink) | ({ type: "group" } & NavGroup);

/** Desktop + mobile primary navigation (public product surfaces). */
export const primaryNav = [
  {
    type: "group",
    title: "Learn",
    items: [{ title: "Roadmaps", href: "/roadmaps" }],
  },
  {
    type: "group",
    title: "Build",
    items: [
      { title: "Projects", href: "/projects" },
      { title: "Developer Tools", href: "/developer-tools" },
    ],
  },
  {
    type: "group",
    title: "Contribute",
    items: [
      { title: "Open Source Projects", href: "/discover" },
      { title: "Issues", href: "/issues" },
      { title: "Reviews", href: "/pr-reviews" },
      { title: "First Contribution", href: "/first-contribution" },
      { title: "Bounties", comingSoon: true },
    ],
  },
  {
    type: "group",
    title: "Prove",
    items: [{ title: "Builders", href: "/builders" }],
  },
  {
    type: "group",
    title: "Ecosystem",
    items: [
      { title: "Partners", href: "/ecosystem/partners" },
      {
        title: "Get Funded",
        href: "https://bitcoindevs.xyz/get-funded",
        external: true,
      },
      { title: "Hackathons", comingSoon: true },
    ],
  },
] as const satisfies readonly PrimaryNavItem[];

export type AccountNavItem = NavLink & {
  icon: NavIcon;
  /** Only rendered for profile.role === "admin". */
  adminOnly?: boolean;
};

export type AccountNavSection = {
  title: string;
  items: readonly AccountNavItem[];
};

/** Signed-in account / workspace links (avatar + mobile Account section). */
export const accountNavSections = [
  {
    title: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Repositories", href: "/repositories", icon: FolderGit2 },
      { title: "Activity", href: "/activity", icon: Activity },
      { title: "PR portfolio", href: "/portfolio", icon: GitPullRequest },
      { title: "Reputation", href: "/reputation", icon: Trophy },
      { title: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    title: "Profile",
    items: [
      { title: "Edit portfolio", href: "/settings/profile", icon: Settings },
      { title: "Notifications", href: "/settings/notifications", icon: Bell },
      { title: "GitHub sync", href: "/settings/github", icon: RefreshCw },
    ],
  },
] as const satisfies readonly AccountNavSection[];

export const footerNav = [
  {
    title: "Learn",
    links: [
      { title: "Roadmaps", href: "/roadmaps" },
      { title: "Start Building", href: "/roadmaps" },
    ],
  },
  {
    title: "Build",
    links: [
      { title: "Projects", href: "/projects" },
      { title: "Developer Tools", href: "/developer-tools" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { title: "Open Source Projects", href: "/discover" },
      { title: "Issues", href: "/issues" },
      { title: "First Contribution", href: "/first-contribution" },
      { title: "Support", href: "/support" },
      { title: "Feedback", href: siteConfig.feedbackUrl },
    ],
  },
  {
    title: "Prove",
    links: [{ title: "Builders Directory", href: "/builders" }],
  },
  {
    title: "Account",
    links: [
      { title: "Sign in", href: "/sign-in" },
      { title: "Dashboard", href: "/dashboard" },
      { title: "Settings", href: "/settings/profile" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
      { title: "Credits", href: "/credits" },
    ],
  },
] as const;

/** Flat list of primary destinations (for active-path helpers). */
export function flattenPrimaryNav(): NavLink[] {
  const links: NavLink[] = [];
  for (const item of primaryNav) {
    for (const child of item.items as readonly NavGroupItem[]) {
      if (isNavLink(child)) links.push(child);
    }
  }
  return links;
}
