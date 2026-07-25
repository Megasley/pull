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

  const [progressByRoadmap, recentFromDb] = await Promise.all([
    getAllCompletedNodeSlugs(profile.id),
    getRecentCompletedLessons(profile.id, 5),
  ]);

  // Sync achievements before reading XP/score so badges stay current.
  await syncAchievementsForUser(profile.id);

  const [totals, achievements, builderScore, reputation, github, workspace, weeklyGoals] =
    await Promise.all([
      getUserXpTotals(profile.id),
      listUserAchievements(profile.id, progressByRoadmap),
      loadBuilderScore(profile.id, progressByRoadmap),
      loadOpenSourceReputation(profile.id),
      loadGithubDashboardSnapshot(profile.id),
      loadDashboardWorkspace({
        userId: profile.id,
        profile,
        progressByRoadmap,
      }),
      ensureWeeklyGoals(profile.id),
    ]);

  const refreshedProfile = {
    ...profile,
    xp: totals.xp,
    level: totals.level,
  };

  const dashboardData = buildDashboardData({
    profile: refreshedProfile,
    progressByRoadmap,
    recentFromDb,
  });

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
