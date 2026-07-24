import { redirect } from "next/navigation";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Start Building",
};

export default async function StartPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/roadmaps");
  }

  redirect("/roadmaps");
}
