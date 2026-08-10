import { relations } from "drizzle-orm";

import {
  githubCommits,
  githubConnections,
  githubContributionDays,
  githubIssues,
  githubPullRequests,
  githubRepositories,
} from "./github";
import {
  achievements,
  organizations,
  projectSubmissions,
  projects,
  roadmapNodes,
  roadmapSections,
  roadmaps,
  resources,
  submissionReviewEvents,
  submissionReviews,
  userAchievements,
  userProgress,
  userRoadmapProgress,
  xpEvents,
} from "./roadmaps";
import { users } from "./users";

export const usersRelations = relations(users, ({ many, one }) => ({
  progress: many(userProgress),
  roadmapProgress: many(userRoadmapProgress),
  submissions: many(projectSubmissions),
  achievements: many(userAchievements),
  reviewEvents: many(submissionReviewEvents),
  submissionReviews: many(submissionReviews),
  xpEvents: many(xpEvents),
  githubConnection: one(githubConnections, {
    fields: [users.id],
    references: [githubConnections.userId],
  }),
  githubRepositories: many(githubRepositories),
  githubPullRequests: many(githubPullRequests),
  githubIssues: many(githubIssues),
  githubCommits: many(githubCommits),
  githubContributionDays: many(githubContributionDays),
}));

export const githubConnectionsRelations = relations(githubConnections, ({ one }) => ({
  user: one(users, {
    fields: [githubConnections.userId],
    references: [users.id],
  }),
}));

export const githubRepositoriesRelations = relations(githubRepositories, ({ one }) => ({
  user: one(users, {
    fields: [githubRepositories.userId],
    references: [users.id],
  }),
}));

export const githubPullRequestsRelations = relations(githubPullRequests, ({ one }) => ({
  user: one(users, {
    fields: [githubPullRequests.userId],
    references: [users.id],
  }),
}));

export const githubIssuesRelations = relations(githubIssues, ({ one }) => ({
  user: one(users, {
    fields: [githubIssues.userId],
    references: [users.id],
  }),
}));

export const githubCommitsRelations = relations(githubCommits, ({ one }) => ({
  user: one(users, {
    fields: [githubCommits.userId],
    references: [users.id],
  }),
}));

export const githubContributionDaysRelations = relations(
  githubContributionDays,
  ({ one }) => ({
    user: one(users, {
      fields: [githubContributionDays.userId],
      references: [users.id],
    }),
  }),
);

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  prerequisiteRoadmap: one(roadmaps, {
    fields: [roadmaps.prerequisiteRoadmapId],
    references: [roadmaps.id],
    relationName: "roadmap_prerequisite",
  }),
  dependentRoadmaps: many(roadmaps, {
    relationName: "roadmap_prerequisite",
  }),
  sections: many(roadmapSections),
  projects: many(projects),
}));

export const roadmapSectionsRelations = relations(roadmapSections, ({ one, many }) => ({
  roadmap: one(roadmaps, {
    fields: [roadmapSections.roadmapId],
    references: [roadmaps.id],
  }),
  nodes: many(roadmapNodes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  roadmap: one(roadmaps, {
    fields: [projects.roadmapId],
    references: [roadmaps.id],
  }),
  nodes: many(roadmapNodes),
  submissions: many(projectSubmissions),
}));

export const roadmapNodesRelations = relations(roadmapNodes, ({ one, many }) => ({
  section: one(roadmapSections, {
    fields: [roadmapNodes.sectionId],
    references: [roadmapSections.id],
  }),
  project: one(projects, {
    fields: [roadmapNodes.projectId],
    references: [projects.id],
  }),
  resources: many(resources),
  progress: many(userProgress),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  node: one(roadmapNodes, {
    fields: [resources.nodeId],
    references: [roadmapNodes.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  node: one(roadmapNodes, {
    fields: [userProgress.nodeId],
    references: [roadmapNodes.id],
  }),
}));

export const userRoadmapProgressRelations = relations(
  userRoadmapProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userRoadmapProgress.userId],
      references: [users.id],
    }),
  }),
);

export const projectSubmissionsRelations = relations(
  projectSubmissions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [projectSubmissions.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [projectSubmissions.projectId],
      references: [projects.id],
    }),
    claimedByUser: one(users, {
      fields: [projectSubmissions.claimedBy],
      references: [users.id],
      relationName: "submission_claim",
    }),
    reviewEvents: many(submissionReviewEvents),
    reviews: many(submissionReviews),
  }),
);

export const submissionReviewsRelations = relations(submissionReviews, ({ one }) => ({
  submission: one(projectSubmissions, {
    fields: [submissionReviews.submissionId],
    references: [projectSubmissions.id],
  }),
  reviewer: one(users, {
    fields: [submissionReviews.reviewerId],
    references: [users.id],
  }),
}));

export const submissionReviewEventsRelations = relations(
  submissionReviewEvents,
  ({ one }) => ({
    submission: one(projectSubmissions, {
      fields: [submissionReviewEvents.submissionId],
      references: [projectSubmissions.id],
    }),
    actor: one(users, {
      fields: [submissionReviewEvents.actorUserId],
      references: [users.id],
    }),
  }),
);

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const organizationsRelations = relations(organizations, () => ({}));

export const xpEventsRelations = relations(xpEvents, ({ one }) => ({
  user: one(users, {
    fields: [xpEvents.userId],
    references: [users.id],
  }),
}));
