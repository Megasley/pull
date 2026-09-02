"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import {
  markAdminNotificationReadAction,
  markAllAdminNotificationsReadAction,
} from "@/app/actions/admin-notifications";
import type { AdminNotificationRecord } from "@/lib/admin/notifications";
import { formatRelativeTimestamp } from "@/lib/milestones/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  initialNotifications: AdminNotificationRecord[];
  initialUnreadCount: number;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id && !item.readAt
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(() => {
      void markAdminNotificationReadAction(id);
    });
  }

  function markAllRead() {
    if (unreadCount === 0) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => (item.readAt ? item : { ...item, readAt: now })));
    setUnreadCount(0);
    startTransition(() => {
      void markAllAdminNotificationsReadAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications, no unread"
          }
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 ? (
            <span
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center border border-ink bg-signal font-mono text-[9px] font-bold text-ink"
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Notifications
          </p>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="font-mono text-[10.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-border last:border-b-0">
                  <NotificationRow notification={notification} onMarkRead={markRead} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-3 py-2">
          <Link
            href="/admin/activity"
            className="block text-center font-mono text-[10.5px] text-muted-foreground hover:text-foreground"
          >
            View all activity →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: AdminNotificationRecord;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notification.readAt;

  return (
    <div className={cn("px-3 py-2.5", isUnread && "bg-signal/10")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isUnread ? (
              <span className="size-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
            ) : null}
            <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
              {notification.title}
              {isUnread ? <span className="sr-only"> (unread)</span> : null}
            </p>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-foreground">
            {notification.description}
          </p>
          {notification.repository ? (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {notification.repository}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {formatRelativeTimestamp(notification.createdAt)}
            </span>
            {notification.pullRequestUrl ? (
              <a
                href={notification.pullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10.5px] text-primary underline-offset-2 hover:underline"
              >
                View PR
              </a>
            ) : null}
            <Link
              href={`/admin/users/${notification.subjectUserId}`}
              className="font-mono text-[10.5px] text-primary underline-offset-2 hover:underline"
            >
              View builder
            </Link>
          </div>
        </div>
        {isUnread ? (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Mark "${notification.title}" as read`}
          >
            Mark read
          </button>
        ) : null}
      </div>
    </div>
  );
}
