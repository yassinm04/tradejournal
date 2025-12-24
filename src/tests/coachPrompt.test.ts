import { describe, it, expect } from "vitest";
import { buildCoachPrompt } from "../engine/coachPrompt";
import { Trade } from "../models/Trade";
import { RuleSet } from "../models/RuleSet";
import { TradeEvaluationResult } from "../engine/evaluateTrade";
import { EscalationResult } from "../engine/escalation";

describe("buildCoachPrompt", () => {
  it("includes evaluation + escalation and demands JSON output", () => {
    const trade: Trade = {
      tradeId: "t1",
      instrument: "NQ",
      direction: "LONG",
      entryTime: new Date(),
      exitTime: new Date(),
      contracts: 1,
      plannedRR: 1.5,
      pnl: -100,
      session: "NY"
    };

    const rules: RuleSet = {
      maxRiskPerTrade: 300,
      maxPositionSize: 3,
      minPlannedRR: 2,
      maxTradesPerDay: 1,
      maxLosingTradesPerDay: 1,
      allowedSessions: ["NY"],
      requiredConfluences: ["HTF Bias"],
      cooldownMinutesAfterLoss: 10,
      disallowedEmotions: ["Frustrated"]
    };

    const evaluation: TradeEvaluationResult = {
      violations: [
        {
          ruleId: "F1_MAX_TRADES",
          ruleName: "Max Trades Per Day",
          passed: false,
          severity: "HIGH",
          message: "Exceeded max trades."
        }
      ],
      rulesPassed: 1,
      rulesFailed: 1,
      complianceScore: 50,
      highestSeverity: "HIGH"
    };

    const escalation: EscalationResult = {
      level: "CRITICAL",
      title: "Stop Trading Immediately",
      message: "Stop trading and reflect.",
      recommendedAction: "STOP_TRADING"
    };

    const prompt = buildCoachPrompt({
      trade,
      rules,
      evaluation,
      escalation,
      userJournalNote: "I felt like I had to win it back."
    });

    expect(prompt).toContain("Return output as VALID JSON");
    expect(prompt).toContain("EVALUATION (authoritative truth)");
    expect(prompt).toContain("ESCALATION (authoritative coaching stance)");
    expect(prompt).toContain("STOP_TRADING");
  });
});
