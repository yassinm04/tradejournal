export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const severityColors: Record<SeverityLevel, string> = {
  LOW: "#16a34a",
  MEDIUM: "#eab308",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626"
};

import type { EscalationLevel } from "@engine/escalation";

export function escalationToSeverity(
  level: EscalationLevel
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  switch (level) {
    case "INFO":
      return "LOW";
    case "WARNING":
      return "MEDIUM";
    case "CRITICAL":
      return "CRITICAL";
    default:
      return "LOW";
  }
}
