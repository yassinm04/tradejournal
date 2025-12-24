import { TradeEvaluationResult } from "./evaluateTrade";

export type EscalationLevel = "INFO" | "WARNING" | "CRITICAL";
export type RecommendedAction = "CONTINUE" | "SLOW_DOWN" | "STOP_TRADING";

export interface EscalationResult {
  level: EscalationLevel;
  title: string;
  message: string;
  recommendedAction: RecommendedAction;
}

export function escalate(
  evaluation: TradeEvaluationResult,
  consecutiveRuleBreaks: number
): EscalationResult {
  const highSeverityCount = evaluation.violations.filter(
    v => v.severity === "HIGH"
  ).length;

  // --------- CRITICAL ESCALATION ---------
  if (
    evaluation.complianceScore < 50 ||
    highSeverityCount >= 2 ||
    consecutiveRuleBreaks >= 3
  ) {
    return {
      level: "CRITICAL",
      title: "Stop Trading Immediately",
      message:
        "You are repeatedly breaking high-impact rules. Continuing to trade right now is statistically likely to lead to account loss. The edge only exists when rules are followed.",
      recommendedAction: "STOP_TRADING"
    };
  }

  // --------- WARNING ESCALATION ---------
  if (
    evaluation.complianceScore < 80 ||
    highSeverityCount === 1 ||
    consecutiveRuleBreaks === 2
  ) {
    return {
      level: "WARNING",
      title: "Rule Deviation Detected",
      message:
        "You are deviating from your rules. Slow down, reduce size, and reassess before taking another trade.",
      recommendedAction: "SLOW_DOWN"
    };
  }

  // --------- INFO / COMPLIANT ---------
  return {
    level: "INFO",
    title: "Rules Followed",
    message:
      "You followed your rules on this trade. Maintain discipline and continue executing your plan.",
    recommendedAction: "CONTINUE"
  };
}
