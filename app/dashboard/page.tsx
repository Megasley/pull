import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { buildDashboardData } from "@/lib/dashboard/build-dashboard-data";
import { loadDashboardWorkspace } from "@/lib/dashboard/workspace";
import { ensureWeeklyGoals } from "@/lib/dashboard/weekly-goals";
import {
  getAllCompletedNodeSlugs,
  getRecentCompletedLessons,
} from "@/lib/progress/repository";
import { listUserAchievements, syncAchievementsForUser } from "@/lib/xp/achievements";
import { getUserXpTotals } from "@/lib/xp/repository";
import { getBuilderProfile } from "@/lib/auth/ensure-builder-profile";
import { loadBuilderScore } from "@/lib/score";
import { loadOpenSourceReputation } from "@/lib/reputation";
import { loadGithubDashboardSnapshot } from "@/lib/github";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/dashboard");
  }

  const progressByRoadmap = await getAllCompletedNodeSlugs(profile.id);
  const recentFromDb = await getRecentCompletedLessons(profile.id, 5);

  await syncAchievementsForUser(profile.id);
  const totals = await getUserXpTotals(profile.id);
  const refreshedProfile =
    (await getBuilderProfile(profile.id)) ?? {
      ...profile,
      xp: totals.xp,
      level: totals.level,
    };

  const dashboardData = buildDashboardData({
    profile: refreshedProfile,
    progressByRoadmap,
    recentFromDb,
  });

  const [achievements, builderScore, reputation, github, workspace, weeklyGoals] =
    await Promise.all([
      listUserAchievements(profile.id, progressByRoadmap),
      loadBuilderScore(profile.id, progressByRoadmap),
      loadOpenSourceReputation(profile.id),
      loadGithubDashboardSnapshot(profile.id),
      loadDashboardWorkspace({
        userId: profile.id,
        profile: refreshedProfile,
        progressByRoadmap,
      }),
      ensureWeeklyGoals(profile.id),
    ]);

  dashboardData.achievements = achievements;
  dashboardData.builderScore = builderScore;
  dashboardData.reputation = reputation;
  dashboardData.contributionStreak = workspace.contributionStreak;
  dashboardData.projectsBuilt = workspace.projectsBuilt;
  dashboardData.contributingRepos = workspace.contributingRepos;
  dashboardData.openPullRequests = workspace.openPullRequests;
  dashboardData.assignedIssues = workspace.assignedIssues;
  dashboardData.reviewsReceived = workspace.reviewsReceived;
  dashboardData.portfolioCompletion = workspace.portfolioCompletion;
  dashboardData.openSourceOpportunities = workspace.openSourceOpportunities;
  dashboardData.weeklyGoals = weeklyGoals;

  return (
    <DashboardView
      data={dashboardData}
      github={github}
      signOutAction={signOut}
    />
  );
}
