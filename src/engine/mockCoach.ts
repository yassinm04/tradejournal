import { CoachOutputFormat } from "./coachPrompt";
import { TradeEvaluationResult } from "./evaluateTrade";
import { EscalationResult } from "./escalation";

export function mockCoachResponse(
  evaluation: TradeEvaluationResult,
  escalation: EscalationResult
): CoachOutputFormat {
  const nonCompliant = evaluation.violations.length > 0;

  return {
    verdict: nonCompliant ? "NON_COMPLIANT" : "COMPLIANT",
    escalationLevel: escalation.level,
    recommendedAction: escalation.recommendedAction,

    headline: nonCompliant
      ? "Rules were broken on this trade."
      : "Rules were followed.",

    ruleBreakdown: evaluation.violations.map(v => ({
      ruleId: v.ruleId,
      severity: v.severity,
      whatWentWrong: v.message || "Rule was violated.",
      whatToDoNextTime:
        "Do not take the trade unless all rule conditions are met."
    })),

    nextStep:
      escalation.recommendedAction === "STOP_TRADING"
        ? "Stop trading for the session and review your last violations."
        : escalation.recommendedAction === "SLOW_DOWN"
        ? "Reduce frequency and re-evaluate your next setup carefully."
        : "Continue following your plan with discipline.",

    hardStopMessage:
      escalation.level === "CRITICAL"
        ? "Trading now increases the probability of blowing your account."
        : undefined
  };
}
