import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, and shares information.`,
};

const EFFECTIVE_DATE = "July 22, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="legal // privacy"
      title="Privacy Policy"
      summary="This policy explains what information Pull processes when you browse the site, sign in with GitHub, track learning progress, or sync portfolio data."
      effectiveDate={EFFECTIVE_DATE}
      sections={[
        {
          title: "1. Who we are",
          paragraphs: [
            `${siteConfig.name} ("Pull", "we", "us") provides learning roadmaps, project challenges, and open source contribution tooling for Bitcoin and related ecosystems.`,
            `The service is offered at ${siteConfig.url} and related app domains or preview deployments we operate.`,
          ],
        },
        {
          title: "2. Information we collect",
          paragraphs: [
            "Depending on how you use Pull, we may process the following categories of information:",
          ],
          bullets: [
            "Account identifiers from GitHub OAuth via Supabase Auth (such as GitHub user id, username, display name, avatar URL, and email if GitHub provides it).",
            "Profile and portfolio fields you choose to store (bio, links, featured projects, preferences).",
            "Learning and product activity (roadmap progress, completed lessons, project submissions, bookmarks, and similar product state).",
            "GitHub-related metadata you authorize us to sync (public repositories, contribution activity, pull requests, and related signals used for portfolio and reputation features).",
            "Technical logs needed to operate the service (IP address, device/browser metadata, timestamps, and error diagnostics from our hosting providers).",
          ],
        },
        {
          title: "3. How we use information",
          paragraphs: ["We use information to:"],
          bullets: [
            "Authenticate you and maintain your session.",
            "Provide roadmaps, lessons, projects, dashboards, and portfolio features.",
            "Sync and display GitHub-linked builder activity you connect.",
            "Improve reliability, security, and product quality.",
            "Communicate about account or service issues when necessary.",
          ],
        },
        {
          title: "4. Legal bases (where applicable)",
          paragraphs: [
            "If you are in a region that requires a legal basis for processing (such as the EEA/UK), we generally rely on: performance of a contract (providing the service you request), legitimate interests (securing and improving the product), and consent where we ask for it.",
          ],
        },
        {
          title: "5. Sharing and processors",
          paragraphs: [
            "We do not sell your personal information. We share data with service providers that help us run Pull, including:",
          ],
          bullets: [
            "Supabase (authentication and database).",
            "Vercel (application hosting, previews, and related infrastructure).",
            "Google Analytics (aggregated website usage analytics when enabled).",
            "GitHub (identity provider and source of authorized repository/activity data).",
            "Resend (transactional email delivery for review outcomes, achievements, and account notices when enabled).",
          ],
        },
        {
          title: "6. Provider terms and required disclosures",
          paragraphs: [
            "These providers process data under their own terms and privacy policies. We may also disclose information if required by law, to protect rights and safety, or in connection with a merger, acquisition, or reorganization of the project.",
            "When Google Analytics is enabled, Google may collect device and usage data (such as pages viewed, approximate location derived from IP, and browser/device signals) according to Google's privacy policy. You can learn more about Google's data practices at https://policies.google.com/privacy.",
          ],
        },
        {
          title: "7. Cookies and local storage",
          paragraphs: [
            "Pull uses cookies and similar storage for authentication sessions and essential product state. We may also use browser local/session storage for progress caching and UI preferences. When Google Analytics is enabled, Google may set analytics cookies to measure site usage. Disabling cookies may prevent sign-in from working and can limit analytics.",
          ],
        },
        {
          title: "8. Retention",
          paragraphs: [
            "We retain account and product data while your account is active and as needed to operate the service. You may request deletion of your Pull account data. Some backups, security logs, or legally required records may persist for a limited period after deletion.",
          ],
        },
        {
          title: "9. Your choices and rights",
          paragraphs: [
            "You can disconnect GitHub access through GitHub's application settings. You can opt out of product email categories in Settings → Notifications. Depending on your location, you may have rights to access, correct, delete, or export personal data, or to object to certain processing. Contact us to make a request. We may need to verify your identity before fulfilling it.",
          ],
        },
        {
          title: "10. Children",
          paragraphs: [
            "Pull is not directed to children under 16, and we do not knowingly collect personal information from children under 16.",
          ],
        },
        {
          title: "11. International transfers",
          paragraphs: [
            "Our providers may process data in the United States and other countries. If you use Pull from another region, you understand your information may be transferred to and processed in countries with different data protection rules.",
          ],
        },
        {
          title: "12. Changes",
          paragraphs: [
            "We may update this Privacy Policy as the product evolves. We will revise the effective date above when we do. Continued use of Pull after an update means you accept the revised policy.",
          ],
        },
        {
          title: "13. Contact",
          paragraphs: [
            `For privacy requests related to Pull, email ${siteConfig.contactEmail}.`,
          ],
        },
      ]}
    />
  );
}
