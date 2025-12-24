import { describe, it, expect } from "vitest";
import { escalate } from "../engine/escalation";
import { TradeEvaluationResult } from "../engine/evaluateTrade";

describe("escalation", () => {
  it("returns CRITICAL for repeated high severity violations", () => {
    const evaluation: TradeEvaluationResult = {
      violations: [
        {
          ruleId: "X",
          ruleName: "Overtrading",
          passed: false,
          severity: "HIGH",
          message: ""
        },
        {
          ruleId: "Y",
          ruleName: "Emotion",
          passed: false,
          severity: "HIGH",
          message: ""
        }
      ],
      rulesPassed: 2,
      rulesFailed: 4,
      complianceScore: 40,
      highestSeverity: "HIGH"
    };

    const result = escalate(evaluation, 3);

    expect(result.level).toBe("CRITICAL");
    expect(result.recommendedAction).toBe("STOP_TRADING");
  });
});
