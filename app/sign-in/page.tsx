import { redirect } from "next/navigation";
import Link from "next/link";

import { signInWithGitHub } from "@/app/actions/auth";
import { SignInSubmitButton } from "@/components/auth/sign-in-submit-button";
import { Eyebrow, H1, Muted } from "@/components/design-system";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export const metadata = {
  title: "Sign in",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const configured = isSupabaseConfigured();
  const nextPath = params.next ?? "/dashboard";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16 sm:px-6 lg:px-8">
      <Eyebrow className="mb-4">session // resume</Eyebrow>
      <H1>Authenticate, builder</H1>
      <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
        No passwords. No captchas. Just GitHub - because your commit history is
        already the resume.
      </p>

      {!configured ? (
        <div className="mt-8 rounded-none border border-ink/20 bg-muted p-4">
          <p className="text-sm font-medium text-foreground">Supabase not configured</p>
          <Muted className="mt-2">
            Copy <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code> and add your Supabase
            project keys. Enable GitHub auth in the Supabase dashboard, then restart the
            dev server.
          </Muted>
        </div>
      ) : null}

      {params.error ? (
        <div className="mt-6 rounded-none border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {params.error === "configuration"
              ? "Authentication is not configured yet."
              : params.error === "banned"
                ? "Your account has been banned. Contact support if you think this is a mistake."
              : decodeURIComponent(params.error)}
          </p>
        </div>
      ) : null}

      <form
        action={async () => {
          "use server";
          await signInWithGitHub(nextPath);
        }}
        className="mt-8"
      >
        <SignInSubmitButton disabled={!configured} />
      </form>

      <Muted className="mt-6 text-center font-mono text-xs">
        By signing in you agree to the{" "}
        <Link
          href="/terms"
          className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          Privacy Policy
        </Link>
        .
      </Muted>
    </div>
  );
}
