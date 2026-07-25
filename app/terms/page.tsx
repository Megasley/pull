import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms governing use of ${siteConfig.name}.`,
};

const EFFECTIVE_DATE = "July 25, 2026";

export default function TermsOfUsePage() {
  return (
    <LegalPage
      eyebrow="legal // terms"
      title="Terms of Use"
      summary="These terms govern your access to and use of Pull, including roadmaps, lessons, projects, portfolios, and related features."
      effectiveDate={EFFECTIVE_DATE}
      sections={[
        {
          title: "1. Agreement",
          paragraphs: [
            `By accessing or using ${siteConfig.name} ("Pull", "the service"), you agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the service.`,
          ],
        },
        {
          title: "2. The service",
          paragraphs: [
            "Pull provides educational roadmaps, lesson content, project challenges, contribution discovery tools, and builder portfolio features focused on open source and Bitcoin/Lightning development.",
            "We may change, suspend, or discontinue features at any time as the product evolves.",
          ],
        },
        {
          title: "3. Accounts and GitHub authentication",
          paragraphs: [
            "You may need a GitHub account to sign in. You are responsible for activity under your Pull account and for keeping your GitHub credentials secure.",
            "You must provide accurate information and not impersonate others. We may suspend or terminate accounts that abuse the service, attempt to compromise security, or violate these terms.",
          ],
        },
        {
          title: "4. Acceptable use",
          paragraphs: ["You agree not to:"],
          bullets: [
            "Probe, scan, or attack the service or its infrastructure except through authorized security research channels.",
            "Attempt to access another user's account or private data.",
            "Upload malicious code, scrape the service in a way that degrades availability, or bypass rate limits or access controls.",
            "Use Pull to harass others, distribute illegal content, or violate applicable law.",
            "Misrepresent project submissions, reviews, or contribution history.",
          ],
        },
        {
          title: "5. Educational content disclaimer",
          paragraphs: [
            "Lesson content, diagrams, resource recommendations, and project guidance are for educational purposes. They are not financial, legal, tax, or investment advice.",
            "Bitcoin and Lightning development involves real risk. You are solely responsible for how you apply what you learn, including any use of mainnet funds, private keys, or production systems.",
            "Referenced third-party books, BIPs, BOLTs, repositories, and tools are owned by their respective authors and maintainers. Pull does not control those resources.",
          ],
        },
        {
          title: "6. Your content and submissions",
          paragraphs: [
            "You retain ownership of content you submit to Pull (such as profile text, project submissions, and reviews), subject to rights needed to operate the product.",
            "By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to host, store, display, and process that content for the purpose of providing and improving Pull.",
            "You represent that you have the rights needed to submit that content and that it does not infringe others' rights.",
          ],
        },
        {
          title: "7. Licensing, IP, and attribution",
          paragraphs: [
            "Pull's application code is released under the MIT License. Pull's own curriculum — lesson text, roadmap definitions, project specs, and original diagrams — is released under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0), so you may reuse and adapt it with credit to Pull provided derivative curriculum carries the same license.",
            "The Pull name, wordmark, and logo are not covered by those licenses and remain the property of Pull.",
            "Books, specifications, documentation, repositories, and tools that lessons link to are owned by their respective authors and remain under their own licenses. Pull links to those works rather than redistributing them, and linking does not place them under Pull's licenses.",
            "A current list of third-party sources and their licenses is published on the Credits page at /credits.",
          ],
        },
        {
          title: "8. Third-party services",
          paragraphs: [
            "Pull relies on third parties such as GitHub, Supabase, and Vercel. Your use of those services may be subject to their terms. We are not responsible for third-party outages, policy changes, or data handling beyond our instructions to processors described in the Privacy Policy.",
          ],
        },
        {
          title: "9. No warranties",
          paragraphs: [
            'Pull is provided "as is" and "as available" without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
            "We do not warrant that the service will be uninterrupted, error-free, or free of harmful components, or that curriculum content is complete or current.",
          ],
        },
        {
          title: "10. Limitation of liability",
          paragraphs: [
            "To the maximum extent permitted by law, Pull and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, funds, or keys, arising from your use of the service.",
            "Our aggregate liability for claims relating to the service will not exceed the greater of (a) amounts you paid us for the service in the 12 months before the claim (if any) or (b) fifty U.S. dollars (USD $50).",
          ],
        },
        {
          title: "11. Indemnity",
          paragraphs: [
            "You agree to indemnify and hold harmless Pull and its operators from claims arising out of your misuse of the service, your content, or your violation of these terms or applicable law.",
          ],
        },
        {
          title: "12. Termination",
          paragraphs: [
            "You may stop using Pull at any time. We may suspend or terminate access if you violate these terms or if we discontinue the service. Provisions that by nature should survive (including disclaimers, limitations, and IP licenses needed for prior operation) will survive termination.",
          ],
        },
        {
          title: "13. Changes to these terms",
          paragraphs: [
            "We may update these Terms of Use from time to time. We will update the effective date above when we do. Continued use after changes become effective constitutes acceptance of the updated terms.",
          ],
        },
        {
          title: "14. Governing law",
          paragraphs: [
            "Unless mandatory local law says otherwise, these terms are governed by the laws applicable in the jurisdiction where the Pull operators are established, without regard to conflict-of-law rules. Venue and jurisdiction details may be updated when a formal operating entity is designated.",
          ],
        },
        {
          title: "15. Contact",
          paragraphs: [
            `Questions about these terms can be directed to ${siteConfig.contactEmail}.`,
          ],
        },
      ]}
    />
  );
}
