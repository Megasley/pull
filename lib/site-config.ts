export const siteConfig = {
  name: "Pull",
  description: "The operating system for open source builders.",
  tagline: "Become an open source builder.",
  url: "https://pullos.dev",
  /** Public contact for privacy / support (create the mailbox before launch). */
  contactEmail: "hello@pullos.dev",
} as const;

/** Public social profiles. Add entries when accounts are ready. */
export const socialLinks: readonly {
  title: string;
  href: string;
  icon: "github";
}[] = [];

export type SocialLink = (typeof socialLinks)[number];
export type SocialIconName = SocialLink["icon"];

export type NavLink = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
  items: readonly NavLink[];
};

export type PrimaryNavItem =
  | ({ type: "link" } & NavLink)
  | ({ type: "group" } & NavGroup);

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
