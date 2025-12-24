import { Session } from "./Trade";

export interface RuleSet {
  // Risk rules
  maxRiskPerTrade: number;
  maxPositionSize: number;
  minPlannedRR: number;

  // Frequency rules
  maxTradesPerDay: number;
  maxLosingTradesPerDay: number;

  // Execution rules
  allowedSessions: Session[];
  requiredConfluences: string[];

  // Behavior rules
  cooldownMinutesAfterLoss: number;
  disallowedEmotions: string[];
}
