import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminUserRoleSelect } from "@/components/admin/admin-user-role-select";
import { EmptyState, PageHeader } from "@/components/design-system";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listUsersForAdmin } from "@/lib/admin/repository";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";

export const metadata = {
  title: "Admin · Users",
  description: "Manage Pull user roles.",
};

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/admin/users");
  }

  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="admin // access denied"
          title="Nice try, builder"
          description="This console is for platform admins only. Your badge says builder energy, not root. If you think that’s a bug, it isn’t — but we admire the curiosity."
        />
      </div>
    );
  }

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const { users, total } = isDatabaseConfigured()
    ? await listUsersForAdmin({ query: query || undefined, limit: 100 })
    : { users: [], total: 0 };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // users"
        title="Users"
        description="Search builders and change roles. You cannot demote yourself or the last admin."
        meta={`showing // ${users.length} of ${total}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin">./admin</Link>
          </Button>
        }
      />

      <form className="mt-8" action="/admin/users" method="get">
        <label htmlFor="admin-user-search" className="sr-only">
          Search users
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="admin-user-search"
            name="q"
            defaultValue={query}
            placeholder="Search username, display name, or GitHub…"
            className="w-full rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {users.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              query ? "Try a different search." : "No users in the database yet."
            }
          />
        ) : (
          users.map((user) => {
            const initials = user.displayName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={user.id}
                className="flex flex-col gap-4 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-10 rounded-none">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                    ) : null}
                    <AvatarFallback className="rounded-none font-mono text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{user.displayName}</p>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      @{user.username} · gh:{user.githubUsername} · xp {user.xp} · lvl{" "}
                      {user.level}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users/${user.id}`}>View</Link>
                  </Button>
                  <AdminUserRoleSelect
                    userId={user.id}
                    currentRole={user.role}
                    isSelf={user.id === profile.id}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
