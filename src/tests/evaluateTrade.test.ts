import { describe, it, expect } from "vitest";
import { evaluateTrade } from "../engine/evaluateTrade";
import { Trade } from "../models/Trade";
import { RuleSet } from "../models/RuleSet";


describe("evaluateTrade", () => {
  it("flags overtrading, cooldown, and emotion violations", () => {
    const trade: Trade = {
      tradeId: "1",
      instrument: "NQ",
      direction: "LONG",
      entryTime: new Date(),
      exitTime: new Date(),
      contracts: 2,
      plannedRR: 1.5,
      pnl: -200,
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

    const result = evaluateTrade(
      trade,
      rules,
      {
        tradesToday: 2,
        losingTradesToday: 1,
        lastLossTime: new Date(Date.now() - 5 * 60000)
      },
      {
        confluencesConfirmed: [],
        emotion: "Frustrated"
      }
    );

    expect(result.rulesFailed).toBeGreaterThan(0);
    expect(result.complianceScore).toBeLessThan(100);
    expect(result.highestSeverity).toBe("HIGH");
  });
});
