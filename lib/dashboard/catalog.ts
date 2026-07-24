import type { OpenSourceOpportunity } from "@/types/dashboard";
import { getDiscoveryOpportunitiesForDashboard } from "@/lib/discovery/catalog";

export {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORY_LABELS,
} from "@/lib/achievements/definitions";

export const OPEN_SOURCE_OPPORTUNITIES: OpenSourceOpportunity[] =
  getDiscoveryOpportunitiesForDashboard(4);
