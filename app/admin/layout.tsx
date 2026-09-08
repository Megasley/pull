import { redirect } from "next/navigation";

import {
  listAdminNotifications,
  countUnreadAdminNotifications,
} from "@/lib/admin/notifications";
import { withTimeout } from "@/lib/async/with-timeout";
import { requireActiveAccount } from "@/lib/auth/require-active-account";
import { isAdminRole } from "@/lib/auth/roles";
import { isDatabaseConfigured } from "@/lib/db/env";
import { NotificationBell } from "@/components/admin/notification-bell";
import { PageHeader } from "@/components/design-system";

// This layout wraps every /admin/* route with no Suspense boundary around
// {children}, so an unguarded await here blocks the whole page — including
// page.tsx's own carefully timeout-budgeted queries — up to the route's
// maxDuration with no fallback. Budget it the same way page.tsx budgets its
// own DB calls (see ADMIN_QUERY_BUDGET_MS there) so a hung connection
// degrades to an empty bell instead of a 504.
const ADMIN_LAYOUT_QUERY_BUDGET_MS = 8_000;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const accountGate = await requireActiveAccount();

  if (!accountGate.ok) {
    redirect("/sign-in?next=/admin");
  }

  const profile = accountGate.profile;
  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="admin // access denied"
          title="Nice try, builder"
          description="This console is for platform admins only. Your badge says builder energy, not root. If you think that's a bug, it isn't — but we admire the curiosity."
        />
      </div>
    );
  }

  const [{ notifications }, unreadCount] = isDatabaseConfigured()
    ? await Promise.all([
        withTimeout(
          listAdminNotifications({ limit: 8 }),
          ADMIN_LAYOUT_QUERY_BUDGET_MS,
          { notifications: [], total: 0 },
          "admin.layout.notifications",
        ),
        withTimeout(
          countUnreadAdminNotifications(),
          ADMIN_LAYOUT_QUERY_BUDGET_MS,
          0,
          "admin.layout.unreadCount",
        ),
      ])
    : [{ notifications: [] }, 0];

  return (
    <>
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </div>
      </div>
      {children}
    </>
  );
}
