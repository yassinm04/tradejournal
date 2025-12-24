import { evaluateTrade } from "@engine/evaluateTrade";
import { escalationToSeverity } from "../utils/severity";
import { escalate } from "@engine/escalation";
//import { mockCoach } from "@engine/mockCoach";
import { Trade } from "@models/Trade";
import { RuleSet } from "@models/RuleSet";

import { CoachCard } from "./CoachCard";

export function CoachPanel() {
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

  const evaluation = evaluateTrade(
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

  const escalation = escalate(evaluation, 3);

    const verdict =
    escalation?.level === "CRITICAL"
      ? "DO NOT TRADE — Cooldown Active"
      : "Trade Allowed";

  const verdictColor =
    escalation?.level === "CRITICAL" ? "#ff4d4d" : "#4ade80";


    return (
  <>
    <h2 style={{ marginBottom: 16 }}>Coach Feedback</h2>

    <div
  style={{
    padding: "12px 16px",
    marginBottom: 24,
    borderRadius: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    background: "#0b0b0b",
    border: `1px solid ${verdictColor}`,
    color: verdictColor,
  }}
>
  {verdict}
</div>


    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 0.9fr",
        gridTemplateRows: "auto auto",
        gap: 24,
        alignItems: "stretch",
      }}
    >
      {/* LEFT TOP — COMPLIANCE */}
      <div>
        <CoachCard
          title="Compliance"
          level={evaluation.highestSeverity ?? "LOW"}
          message={`Compliance Score: ${evaluation.complianceScore}%`}
        />
      </div>

      {/* RIGHT — TRADE SNAPSHOT (SPANS BOTH ROWS) */}
      <div
        style={{
          gridRow: "1 / span 2",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          background: "linear-gradient(180deg, #111, #0b0b0b)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Trade Snapshot</h3>

        <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          <li><strong>Instrument:</strong> {trade.instrument}</li>
          <li><strong>Direction:</strong> {trade.direction}</li>
          <li><strong>Contracts:</strong> {trade.contracts}</li>
          <li><strong>PnL:</strong> ${trade.pnl}</li>
          <li><strong>Session:</strong> {trade.session}</li>
          <li><strong>Emotion:</strong> Frustrated</li>
        </ul>
      </div>

      {/* LEFT BOTTOM — STOP TRADING */}
      {escalation && (
        <div>
          <CoachCard
            title={escalation.title}
            level={escalationToSeverity(escalation.level)}
            message={escalation.message}
          />
        </div>
      )}
    </div>
  </>
);
}
