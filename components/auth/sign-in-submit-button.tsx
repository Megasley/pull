"use client";

import { Button } from "@/components/ui/button";

type SignInSubmitButtonProps = {
  disabled?: boolean;
};

/** Submit control — Button auto-spins from useFormStatus while the auth action runs. */
export function SignInSubmitButton({ disabled }: SignInSubmitButtonProps) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled}>
      ./auth --github
    </Button>
  );
}
