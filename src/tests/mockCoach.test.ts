import { describe, it, expect } from "vitest";
import { mockCoachResponse } from "../engine/mockCoach";
import { TradeEvaluationResult } from "../engine/evaluateTrade";
import { EscalationResult } from "../engine/escalation";

describe("mockCoachResponse", () => {
  it("returns STOP_TRADING advice on critical escalation", () => {
    const evaluation: TradeEvaluationResult = {
      violations: [
        {
          ruleId: "B3_EMOTION",
          ruleName: "Emotion",
          passed: false,
          severity: "HIGH",
          message: "Traded while frustrated."
        }
      ],
      rulesPassed: 1,
      rulesFailed: 2,
      complianceScore: 40,
      highestSeverity: "HIGH"
    };

    const escalation: EscalationResult = {
      level: "CRITICAL",
      title: "Stop Trading",
      message: "Repeated rule violations detected.",
      recommendedAction: "STOP_TRADING"
    };

    const result = mockCoachResponse(evaluation, escalation);

    expect(result.verdict).toBe("NON_COMPLIANT");
    expect(result.recommendedAction).toBe("STOP_TRADING");
    expect(result.hardStopMessage).toBeDefined();
  });
});
