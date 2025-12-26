import { Violation } from "./Violations";

export type Session = "ASIA" | "LONDON" | "NY";

export interface Trade {
  tradeId: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  entryTime: Date;
  exitTime?: Date;
  contracts: number;
  plannedRR: number;
  pnl: number;
  session: Session;

  // ✅ NEW — evaluation snapshot at time of trade
  evaluation?: {
    complianceScore: number;
    highestSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    violations: Violation[];
  };

  flags?: {
    duringCooldown?: boolean;
    cooldownViolated?: boolean;
  };

}
