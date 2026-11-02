// Shared visual mappings for the twin graph: an icon per asset type and a
// border/glow color per criticality (risk-based coloring).

import {
  Laptop,
  Monitor,
  Server,
  Router,
  ShieldCheck,
  Network,
  Database,
  AppWindow,
  User,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import type { RelationshipType } from "../../types/twin";
import type { AssetType, Criticality } from "../../types/asset";

// Different icon per asset type
export const ASSET_ICONS: Record<AssetType, LucideIcon> = {
  laptop: Laptop,
  desktop: Monitor,
  server: Server,
  router: Router,
  firewall: ShieldCheck,
  switch: Network,
  database: Database,
  application: AppWindow,
  user: User,
  cloud_instance: Cloud,
};

// Risk-based node coloring. Each entry drives border + glow + accent text.
export const RISK_COLORS: Record<Criticality, { border: string; glow: string; text: string; dot: string }> = {
  critical: { border: "#f43f5e", glow: "rgba(244,63,94,0.35)", text: "#fda4af", dot: "#f43f5e" },
  high: { border: "#fb923c", glow: "rgba(251,146,60,0.30)", text: "#fdba74", dot: "#fb923c" },
  medium: { border: "#facc15", glow: "rgba(250,204,21,0.25)", text: "#fde047", dot: "#facc15" },
  low: { border: "#4ade80", glow: "rgba(74,222,128,0.25)", text: "#86efac", dot: "#4ade80" },
};

// Edge color per relationship type so edge kinds are visually distinguishable
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  USES: "#22d3ee",
  RUNS_ON: "#a78bfa",
  CONNECTS_TO: "#38bdf8",
  STORES: "#34d399",
  PROTECTS: "#fb7185",
  MEMBER_OF: "#facc15",
};

