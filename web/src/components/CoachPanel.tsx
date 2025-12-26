import { evaluateTrade } from "@engine/evaluateTrade";
import { escalationToSeverity } from "../utils/severity";
import { escalate } from "@engine/escalation";
//import { mockCoach } from "@engine/mockCoach";
import { Trade } from "@models/Trade";
import { RuleSet } from "@models/RuleSet";
import { useState } from "react";
import { CoachCard } from "./CoachCard";

export function CoachPanel() {
  const [pnlInput, setPnlInput] = useState("");

  const [trade, setTrade] = useState<Trade>({
  tradeId: "1",
  instrument: "NQ",
  direction: "LONG",
  entryTime: new Date(),
  exitTime: new Date(),
  contracts: 1,
  plannedRR: 2,
  pnl: 0,
  session: "NY",
});


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

  console.log(evaluation);


  const escalation = escalate(evaluation, 3);

  const isInCooldown = evaluation.violations.some(
    (v) =>
      v.ruleName.toLowerCase().includes("cooldown") &&
      v.passed === false
  );


  
  console.log("Cooldown active?", isInCooldown);

    const verdict =
    escalation?.level === "CRITICAL"
      ? "DO NOT TRADE — Cooldown Active"
      : "Trade Allowed";

  const verdictColor =
    escalation?.level === "CRITICAL" ? "#ff4d4d" : "#4ade80";


    return (
  <div
    style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: "24px 16px",
    }}
  >

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

      {/* TRADE INPUT FORM */}
      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          background: "#0f0f0f",
        }}
      >
        {isInCooldown && (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "linear-gradient(180deg, #2a0f0f, #1a0b0b)",
              border: "1px solid #ff4d4d",
              color: "#ffd6d6",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            🚨 COOLDOWN ACTIVE  
            <div style={{ marginTop: 6, fontWeight: 400 }}>
              You are allowed to log trades, but taking new trades during cooldown
              statistically leads to losses.
            </div>
          </div>
        )}


        <h3 style={{ marginTop: 0 }}>Enter Trade</h3>

        <div
          style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >

          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90, opacity: 0.9 }}>Instrument</span>
            <input
              style={{ width: 70 }}
              value={trade.instrument}
              onChange={(e) => setTrade({ ...trade, instrument: e.target.value })}
            />
          </label>



          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90, opacity: 0.9 }}>Direction</span>
            <select
              style={{ width: 77 }}
              value={trade.direction}
              onChange={(e) =>
                setTrade({ ...trade, direction: e.target.value as "LONG" | "SHORT" })
              }
            >
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </label>


          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90, opacity: 0.9 }}>Contracts</span>
            <input
              style={{ width: 70 }}
              type="number"
              value={trade.contracts}
              onChange={(e) => setTrade({ ...trade, contracts: Number(e.target.value) })}
            />
          </label>


          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90, opacity: 0.9 }}>Planned RR</span>
            <input
              style={{ width: 70 }}
              type="number"
              value={trade.plannedRR}
              onChange={(e) => setTrade({ ...trade, plannedRR: Number(e.target.value) })}
            />
          </label>


          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90 }}>PnL</span>

            <input
              type="text"
              style={{ width: 70 }}
              value={pnlInput}
              onChange={(e) => {
                const v = e.target.value;

                // allow empty, "-", or numbers
                if (/^-?\d*$/.test(v)) {
                  setPnlInput(v);

                  setTrade({
                    ...trade,
                    pnl: v === "" || v === "-" ? 0 : parseInt(v, 10),
                  });
                }
              }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 90, opacity: 0.9 }}>Session</span>
            <select
              style={{ width: 77 }}
              value={trade.session}
              onChange={(e) => setTrade({ ...trade, session: e.target.value as any })}
            >
              <option value="NY">NY</option>
              <option value="London">London</option>
              <option value="Asia">Asia</option>
            </select>
          </label>
        </div>
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
  </div>
);
}
