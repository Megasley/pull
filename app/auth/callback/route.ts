import { NextResponse } from "next/server";
import { after } from "next/server";

import { sanitizeRedirectPath } from "@/lib/auth/routes";
import { ensureBuilderProfile } from "@/lib/auth/ensure-builder-profile";
import {
  connectGithubFromSession,
  getSessionGithubAccessToken,
  runGithubSync,
} from "@/lib/github";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?error=configuration", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }

  const supabase = await createClientIfConfigured();

  if (!supabase) {
    return NextResponse.redirect(new URL("/sign-in?error=configuration", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await ensureBuilderProfile(user);

    if (profile) {
      // Capture provider token in request context — `after()` cannot call cookies().
      const accessToken = await getSessionGithubAccessToken();
      after(async () => {
        const connected = await connectGithubFromSession(profile.id, {
          accessToken,
        });
        if (connected.ok) {
          await runGithubSync(profile.id, { accessToken });
        }
      });
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
