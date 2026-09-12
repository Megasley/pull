export type ProgressScope = {
  userId: string;
  roadmapSlug: string;
};

export type PendingProgressMutation = {
  token: number;
  completed: boolean;
  previousCompleted: boolean;
};

export function applyNodeCompletionSnapshot(
  completedNodeSlugs: Iterable<string>,
  nodeSlug: string,
  completed: boolean,
): Set<string> {
  const next = new Set(completedNodeSlugs);
  if (completed) {
    next.add(nodeSlug);
  } else {
    next.delete(nodeSlug);
  }
  return next;
}

function scopeKey(scope: ProgressScope): string {
  return `${scope.userId}\u0000${scope.roadmapSlug}`;
}

export class ProgressMutationCoordinator {
  private nextToken = 0;
  private readonly pendingByScope = new Map<
    string,
    Map<string, PendingProgressMutation>
  >();
  private readonly latestReconciliationByScope = new Map<string, number>();

  begin(
    scope: ProgressScope,
    nodeSlug: string,
    completed: boolean,
    previousCompleted: boolean,
  ): PendingProgressMutation {
    const pending = this.pendingByScope.get(scopeKey(scope)) ?? new Map();
    const mutation = {
      token: ++this.nextToken,
      completed,
      previousCompleted,
    };
    pending.set(nodeSlug, mutation);
    this.pendingByScope.set(scopeKey(scope), pending);
    return mutation;
  }

  settle(
    scope: ProgressScope,
    nodeSlug: string,
    token: number,
  ): PendingProgressMutation | null {
    const key = scopeKey(scope);
    const pending = this.pendingByScope.get(key);
    const mutation = pending?.get(nodeSlug);
    if (!mutation || mutation.token !== token) {
      return null;
    }

    pending?.delete(nodeSlug);
    if (pending?.size === 0) {
      this.pendingByScope.delete(key);
    }
    return mutation;
  }

  overlay(scope: ProgressScope, completedNodeSlugs: Iterable<string>): Set<string> {
    const completed = new Set(completedNodeSlugs);
    const pending = this.pendingByScope.get(scopeKey(scope));

    for (const [nodeSlug, mutation] of pending ?? []) {
      if (mutation.completed) {
        completed.add(nodeSlug);
      } else {
        completed.delete(nodeSlug);
      }
    }

    return completed;
  }

  beginReconciliation(scope: ProgressScope): number {
    const token = ++this.nextToken;
    this.latestReconciliationByScope.set(scopeKey(scope), token);
    return token;
  }

  isLatestReconciliation(scope: ProgressScope, token: number): boolean {
    return this.latestReconciliationByScope.get(scopeKey(scope)) === token;
  }
}

export async function reconcileProgressSnapshot(
  coordinator: ProgressMutationCoordinator,
  scope: ProgressScope,
  fetchCompletedNodeSlugs: () => Promise<Iterable<string> | null>,
): Promise<Set<string> | null> {
  const token = coordinator.beginReconciliation(scope);
  const completedNodeSlugs = await fetchCompletedNodeSlugs();

  if (
    completedNodeSlugs === null ||
    !coordinator.isLatestReconciliation(scope, token)
  ) {
    return null;
  }

  return coordinator.overlay(scope, completedNodeSlugs);
}

export const progressMutationCoordinator = new ProgressMutationCoordinator();
