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
] as const satisfies readonly {
  title: string;
  href: string;
  icon: "github" | "x";
}[];

export type SocialLink = (typeof socialLinks)[number];
export type SocialIconName = SocialLink["icon"];

export type NavLink = {
  title: string;
  href: string;
  /** Open in a new tab (for external resources). */
  external?: boolean;
};

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export type NavGroup = {
  title: string;
  items: readonly NavLink[];
};

export type PrimaryNavItem =
  ({ type: "link" } & NavLink) | ({ type: "group" } & NavGroup);

/** Desktop + mobile primary navigation (public product surfaces). */
export const primaryNav = [
  { type: "link", title: "Roadmaps", href: "/roadmaps" },
  { type: "link", title: "Projects", href: "/projects" },
  {
    type: "group",
    title: "Contribute",
    items: [
      { title: "Discover", href: "/discover" },
      { title: "Issues", href: "/issues" },
      {
        title: "Open Source Guide",
        href: "https://opensource.guide/",
        external: true,
      },
    ],
  },
] as const satisfies readonly PrimaryNavItem[];

export type AccountNavSection = {
  title: string;
  items: readonly NavLink[];
};

/** Signed-in account / workspace links (avatar + mobile Account section). */
export const accountNavSections = [
  {
    title: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard" },
      { title: "Repositories", href: "/repositories" },
      { title: "Activity", href: "/activity" },
      { title: "PR portfolio", href: "/portfolio" },
      { title: "Reputation", href: "/reputation" },
    ],
  },
  {
    title: "Profile",
    items: [
      { title: "Edit portfolio", href: "/settings/profile" },
      { title: "Notifications", href: "/settings/notifications" },
      { title: "GitHub sync", href: "/settings/github" },
    ],
  },
] as const satisfies readonly AccountNavSection[];

export const footerNav = [
  {
    title: "Learn",
    links: [
      { title: "Roadmaps", href: "/roadmaps" },
      { title: "Projects", href: "/projects" },
      { title: "Start Building", href: "/roadmaps" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { title: "Discover", href: "/discover" },
      { title: "Issues", href: "/issues" },
      { title: "Support", href: "/support" },
      { title: "Feedback", href: siteConfig.feedbackUrl },
    ],
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
    if (item.type === "link") {
      links.push({ title: item.title, href: item.href });
    } else {
      links.push(...item.items);
    }
  }
  return links;
}
