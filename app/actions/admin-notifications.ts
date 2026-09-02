"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/actions/admin";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/admin/notifications";

export async function markAdminNotificationReadAction(
  id: string,
): Promise<{ ok: boolean }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false };

  await markAdminNotificationRead(id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function markAllAdminNotificationsReadAction(): Promise<{ ok: boolean }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false };

  await markAllAdminNotificationsRead();
  revalidatePath("/admin", "layout");
  return { ok: true };
}
