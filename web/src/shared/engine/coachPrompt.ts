import { Trade } from "../models/Trade";
import { RuleSet } from "../models/RuleSet";
import { TradeEvaluationResult } from "./evaluateTrade";
import { EscalationResult } from "./escalation";

export interface CoachOutputFormat {
  verdict: "COMPLIANT" | "NON_COMPLIANT";
  escalationLevel: EscalationResult["level"];
  recommendedAction: EscalationResult["recommendedAction"];

  // Strict, short summary: what happened and why it matters.
  headline: string;

  // Bullet list of rule breaks (if any) + the specific rule ids.
  ruleBreakdown: Array<{
    ruleId: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    whatWentWrong: string;
    whatToDoNextTime: string;
  }>;

  // A single “next step” for the trader RIGHT NOW.
  nextStep: string;

  // Optional: Only include if escalation is WARNING or CRITICAL.
  hardStopMessage?: string;
}

/**
 * Builds a deterministic prompt for an AI coach.
 * The AI must not contradict the evaluation or escalation.
 */
export function buildCoachPrompt(args: {
  trade: Trade;
  rules: RuleSet;
  evaluation: TradeEvaluationResult;
  escalation: EscalationResult;
  userJournalNote: string; // what the user wrote after the trade
}): string {
  const { trade, rules, evaluation, escalation, userJournalNote } = args;

  const violationsText =
    evaluation.violations.length === 0
      ? "None."
      : evaluation.violations
          .map(v => `- [${v.ruleId}] (${v.severity}) ${v.ruleName}: ${v.message}`)
          .join("\n");

  const rulesSummary = [
    `maxTradesPerDay=${rules.maxTradesPerDay}`,
    `maxLosingTradesPerDay=${rules.maxLosingTradesPerDay}`,
    `minPlannedRR=${rules.minPlannedRR}`,
    `allowedSessions=${rules.allowedSessions.join(",")}`,
    `cooldownMinutesAfterLoss=${rules.cooldownMinutesAfterLoss}`,
    `disallowedEmotions=${rules.disallowedEmotions.join(",")}`,
    `requiredConfluences=${rules.requiredConfluences.join(",")}`
  ].join(" | ");

  return `
You are a strict trading accountability coach.
Your job: enforce the user's rules and protect them from overtrading and emotional decision-making.
You MUST NOT excuse rule-breaking. You MUST NOT contradict the evaluation data.
If escalation says STOP_TRADING, you must clearly tell them to stop and reflect.

Return output as VALID JSON that matches this schema exactly:
{
  "verdict": "COMPLIANT" | "NON_COMPLIANT",
  "escalationLevel": "INFO" | "WARNING" | "CRITICAL",
  "recommendedAction": "CONTINUE" | "SLOW_DOWN" | "STOP_TRADING",
  "headline": string,
  "ruleBreakdown": [
    {
      "ruleId": string,
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "whatWentWrong": string,
      "whatToDoNextTime": string
    }
  ],
  "nextStep": string,
  "hardStopMessage"?: string
}

CONTEXT
- Instrument: ${trade.instrument}
- Direction: ${trade.direction}
- Contracts: ${trade.contracts}
- PlannedRR: ${trade.plannedRR}
- PnL: ${trade.pnl}
- Session: ${trade.session}
- Rules: ${rulesSummary}

EVALUATION (authoritative truth)
- ComplianceScore: ${evaluation.complianceScore}
- HighestSeverity: ${evaluation.highestSeverity ?? "None"}
- Violations:
${violationsText}

ESCALATION (authoritative coaching stance)
- Level: ${escalation.level}
- RecommendedAction: ${escalation.recommendedAction}
- CoachMessage: ${escalation.message}

USER JOURNAL NOTE (their own words)
"""
${userJournalNote}
"""

INSTRUCTIONS
1) Determine verdict: COMPLIANT if 0 violations, else NON_COMPLIANT.
2) For each violation, add a ruleBreakdown entry (ruleId, severity).
3) Provide ONE nextStep the user should do before any next trade.
4) If escalation is WARNING or CRITICAL, include hardStopMessage.
5) Keep the tone strict, clear, and concise. No fluff.
`.trim();
}
