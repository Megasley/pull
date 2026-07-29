/** Demo / seed accounts excluded from admin submission views. */
export const ADMIN_DEMO_USERNAMES = ["satoshee"] as const;

export function isAdminDemoUsername(username: string): boolean {
  const normalized = username.trim().toLowerCase();
  return ADMIN_DEMO_USERNAMES.some((demo) => demo === normalized);
}
