import { ImageResponse } from "next/og";

import { getUserByUsername } from "@/lib/profile/repository";
import { loadBuilderScore } from "@/lib/score";
import { loadOpenSourceReputation } from "@/lib/reputation";
import { listGithubPullRequests } from "@/lib/github/store";
import { buildLevelInfo } from "@/lib/xp/levels";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = {
  params: Promise<{ username: string }>;
};

export default async function OpenGraphImage({ params }: OgProps) {
  const { username } = await params;
  const profile = await getUserByUsername(username);
  const level = buildLevelInfo(profile?.xp ?? 0, profile?.level);
  const builderScore = profile ? await loadBuilderScore(profile.id) : null;
  const reputation = profile ? await loadOpenSourceReputation(profile.id) : null;
  const pullRequests = profile ? await listGithubPullRequests(profile.id, 100) : [];
  const mergedCount = pullRequests.filter((pr) => pr.merged).length;

  const displayName = profile?.displayName ?? username;
  const handle = `@${profile?.username ?? username}`;
  const bio = profile?.bio?.trim() || "Open source builder on Pull.";
  const skills = (profile?.skills ?? []).slice(0, 4).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#c8f231",
          color: "#231e1e",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: "-0.04em" }}>Pull</span>
          <span style={{ fontSize: 22 }}>pullos.dev/u/{profile?.username ?? username}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            {displayName}
          </div>
          <div style={{ display: "flex", fontSize: 32, opacity: 0.75 }}>
            {handle}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              opacity: 0.7,
              maxWidth: 900,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}
          >
            {bio.slice(0, 140)}
          </div>
          {skills ? (
            <div style={{ display: "flex", fontSize: 22, opacity: 0.65 }}>
              {skills}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 24, opacity: 0.85 }}>
          {builderScore ? (
            <span>Score {builderScore.score}</span>
          ) : null}
          {reputation ? <span>Reputation {reputation.score}</span> : null}
          <span>Level {level.level}</span>
          {mergedCount > 0 ? <span>{mergedCount} merged PRs</span> : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
