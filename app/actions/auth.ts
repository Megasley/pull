"use server";

import { redirect } from "next/navigation";

import { sanitizeRedirectPath } from "@/lib/auth/routes";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { GITHUB_OAUTH_SCOPES } from "@/lib/github";

export async function signInWithGitHub(nextPath?: string) {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in?error=configuration");
  }

  const supabase = await createClientIfConfigured();

  if (!supabase) {
    redirect("/sign-in?error=configuration");
  }

  const siteUrl = getSiteUrl();

  const redirectTo = new URL("/auth/callback", siteUrl);

  if (nextPath) {
    redirectTo.searchParams.set("next", sanitizeRedirectPath(nextPath));
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectTo.toString(),
      scopes: GITHUB_OAUTH_SCOPES,
    },
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/sign-in?error=oauth");
}

export async function isLocalTestSignInEnabled(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

export async function signInWithLocalTestAccount(
  formData: FormData,
  nextPath?: string,
) {
  if (!(await isLocalTestSignInEnabled())) {
    redirect("/sign-in?error=configuration");
  }

  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/sign-in?error=Invalid%20test%20login");
  }

  const supabase = await createClientIfConfigured();

  if (!supabase) {
    redirect("/sign-in?error=configuration");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(sanitizeRedirectPath(nextPath ?? "/dashboard"));
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClientIfConfigured();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}

/** Re-auth with GitHub scopes for API sync, then return to GitHub settings. */
export async function reconnectGithubForSync() {
  await signInWithGitHub("/settings/github");
}
