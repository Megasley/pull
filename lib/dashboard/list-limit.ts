export const DASHBOARD_LIST_LIMIT = 5;

export function takeDashboardItems<T>(items: T[], limit = DASHBOARD_LIST_LIMIT) {
  return {
    visible: items.slice(0, limit),
    total: items.length,
    hasMore: items.length > limit,
  };
}
