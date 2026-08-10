import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";
import type { UserRole } from "@/types/submission";

type RoleGrantedEmailProps = {
  displayName: string;
  role: Extract<UserRole, "reviewer" | "admin">;
  href: string;
};

export function RoleGrantedEmail({ displayName, role, href }: RoleGrantedEmailProps) {
  const isAdmin = role === "admin";

  return (
    <EmailLayout
      preview={
        isAdmin
          ? "You've been granted admin access on Pull"
          : "You've been granted reviewer access on Pull"
      }
      title={isAdmin ? "You're an admin" : "You're a reviewer"}
      ctaLabel={isAdmin ? "Open admin" : "Open review queue"}
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: 0 }}>
        {isAdmin
          ? "You now have platform admin access on Pull."
          : "You can now review project submissions on Pull."}
      </Text>
    </EmailLayout>
  );
}
