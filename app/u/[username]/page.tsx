import { notFound } from "next/navigation";

import { PublicBuilderProfile } from "@/components/profile/public-builder-profile";
import { getCurrentUser } from "@/lib/auth/session";
import { loadPublicBuilderProfile } from "@/lib/profile/load-public-profile";
import { siteConfig } from "@/lib/site-config";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const data = await loadPublicBuilderProfile(username, viewer?.id);

  if (!data) {
    return { title: "Builder not found" };
  }

  const title = `${data.profile.displayName} (@${data.profile.username})`;
  const description =
    data.profile.bio.trim() ||
    `${data.profile.displayName} - Builder Score ${data.builderScore.score}, OSS Reputation ${data.reputation.score}, Level ${data.level.level}.`;

  return {
    title: `${title} · Builder Portfolio`,
    description,
    openGraph: {
      title: `${title} · Builder Portfolio`,
      description,
      type: "profile",
      url: `${siteConfig.url}/u/${data.profile.username}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Builder Portfolio`,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const data = await loadPublicBuilderProfile(username, viewer?.id);

  if (!data) {
    notFound();
  }

  return <PublicBuilderProfile data={data} />;
}
