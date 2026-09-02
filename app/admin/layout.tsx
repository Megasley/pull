import { redirect } from "next/navigation";

import { listAdminNotifications, countUnreadAdminNotifications } from "@/lib/admin/notifications";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { NotificationBell } from "@/components/admin/notification-bell";
import { PageHeader } from "@/components/design-system";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/admin");
  }

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
        listAdminNotifications({ limit: 8 }),
        countUnreadAdminNotifications(),
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
