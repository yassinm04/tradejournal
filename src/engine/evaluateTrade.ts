import { Trade } from "../models/Trade";
import { RuleSet } from "../models/RuleSet";
import { Violations, Severity } from "../models/Violations";

export interface TradeContext {
  tradesToday: number;
  losingTradesToday: number;
  lastLossTime: Date | null;
}

export interface UserInputs {
  confluencesConfirmed: string[];
  emotion: string;
}

export interface TradeEvaluationResult {
  violations: Violations[];
  rulesPassed: number;
  rulesFailed: number;
  complianceScore: number; // 0–100
  highestSeverity: Severity | null;
}

export function evaluateTrade(
  trade: Trade,
  rules: RuleSet,
  context: TradeContext,
  userInputs: UserInputs
): TradeEvaluationResult {
  const violations: Violations[] = [];
  let rulesPassed = 0;
  let rulesFailed = 0;

  const pushViolation = (
    ruleId: string,
    ruleName: string,
    passed: boolean,
    severity: Severity,
    message: string
  ) => {
    if (!passed) {
      violations.push({ ruleId, ruleName, passed, severity, message });
      rulesFailed++;
    } else {
      rulesPassed++;
    }
  };

  // ---------- FREQUENCY RULES ----------
  pushViolation(
    "F1_MAX_TRADES",
    "Max Trades Per Day",
    context.tradesToday <= rules.maxTradesPerDay,
    "HIGH",
    "You exceeded your maximum allowed trades for the day."
  );

  pushViolation(
    "F2_MAX_LOSSES",
    "Max Losing Trades Per Day",
    context.losingTradesToday <= rules.maxLosingTradesPerDay,
    "HIGH",
    "You exceeded your maximum allowed losing trades for the day."
  );

  // ---------- RISK RULES ----------
  pushViolation(
    "R3_MIN_RR",
    "Minimum Planned R:R",
    trade.plannedRR >= rules.minPlannedRR,
    "MEDIUM",
    "Planned R:R was below your required minimum."
  );

  // ---------- EXECUTION RULES ----------
  pushViolation(
    "E2_SESSION",
    "Allowed Session",
    rules.allowedSessions.includes(trade.session),
    "MEDIUM",
    "Trade was taken outside of your allowed session."
  );

  const missingConfluences = rules.requiredConfluences.filter(
    c => !userInputs.confluencesConfirmed.includes(c)
  );

  pushViolation(
    "E1_CONFLUENCES",
    "Required Confluences",
    missingConfluences.length === 0,
    "MEDIUM",
    "One or more required confluences were missing."
  );

  // ---------- BEHAVIOR RULES ----------
  if (context.lastLossTime) {
    const minutesSinceLoss =
      (trade.entryTime.getTime() - context.lastLossTime.getTime()) / 60000;

    pushViolation(
      "B1_COOLDOWN",
      "Cooldown After Loss",
      minutesSinceLoss >= rules.cooldownMinutesAfterLoss,
      "HIGH",
      "You entered a trade before your cooldown period ended."
    );
  } else {
    rulesPassed++;
  }

  pushViolation(
    "B3_EMOTION",
    "Emotional State",
    !rules.disallowedEmotions.includes(userInputs.emotion),
    "HIGH",
    "You entered this trade while in a disallowed emotional state."
  );

    // ---------- FINAL CALCULATION ----------
  const totalRules = rulesPassed + rulesFailed;

  const complianceScore =
    totalRules === 0
      ? 100
      : Math.round((rulesPassed / totalRules) * 100);

  const highestSeverity =
    violations.find(v => v.severity === "HIGH")?.severity ??
    violations.find(v => v.severity === "MEDIUM")?.severity ??
    violations.find(v => v.severity === "LOW")?.severity ??
    null;

  return {
    violations,
    rulesPassed,
    rulesFailed,
    complianceScore,
    highestSeverity
  };
}

