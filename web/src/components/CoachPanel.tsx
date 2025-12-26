import { evaluateTrade } from "@engine/evaluateTrade";
import { escalationToSeverity } from "../utils/severity";
import { escalate } from "@engine/escalation";
//import { mockCoach } from "@engine/mockCoach";
import { Trade } from "@models/Trade";
import { RuleSet } from "@models/RuleSet";
import { useState, useEffect} from "react";


import { CoachCard } from "./CoachCard";

export function CoachPanel() {
  const [pnlInput, setPnlInput] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedSession, setSelectedSession] = useState<"NY" | "LONDON" | "ASIA">("NY");

  const [tradeHistory, setTradeHistory] = useState<Trade[]>(() => {
  try {
    const saved = localStorage.getItem("tradeHistory");
    if (!saved) return [];

    const parsed = JSON.parse(saved) as any[];

    return parsed.map((t) => ({
      ...t,
      entryTime: new Date(t.entryTime),
      exitTime: t.exitTime ? new Date(t.exitTime) : undefined,
    }));
  } catch (e) {
    console.error("Failed to load trade history", e);
    return [];
  }
});


  useEffect(() => {
    localStorage.setItem("tradeHistory", JSON.stringify(tradeHistory));
  }, [tradeHistory]);

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


  // ===============================
  // STEP 3 — SESSION STATS
  // ===============================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tradesToday = tradeHistory.filter((t) => {
    const d = new Date(t.entryTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const losingTradesToday = tradesToday.filter((t) => t.pnl < 0);

  const lastLossTime =
  losingTradesToday.length > 0 && losingTradesToday[0].entryTime
    ? new Date(losingTradesToday[0].entryTime)
    : null;

    // ===============================
    // SESSION SUMMARY (derived)
    // ===============================
    const sessionTrades = tradesToday.filter(
      (t) => t.session === selectedSession
    );

    const sessionPnL = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);

    const sessionWins = sessionTrades.filter((t) => t.pnl > 0).length;
    const sessionLosses = sessionTrades.filter((t) => t.pnl < 0).length;

    const sessionCompliance =
      sessionTrades.length === 0
        ? null
        : Math.round(
          sessionTrades.reduce(
            (sum, t) => sum + (t.evaluation?.complianceScore ?? 0),
            0
          ) / sessionTrades.length
        );

  const rules: RuleSet = {
    maxRiskPerTrade: 300,
    maxPositionSize: 3,
    minPlannedRR: 2,
    maxTradesPerDay: 1,
    maxLosingTradesPerDay: 1,
    allowedSessions: ["NY", "LONDON", "ASIA"],
    requiredConfluences: ["HTF Bias"],
    cooldownMinutesAfterLoss: 10,
    disallowedEmotions: ["Frustrated"]
  };

  const sessionCooldownActive =
    !!lastLossTime &&
    Date.now() - lastLossTime.getTime() <
      rules.cooldownMinutesAfterLoss * 60_000;


  const evaluation = evaluateTrade(
    trade,
    rules,
    {
      tradesToday: tradesToday.length,
      losingTradesToday: losingTradesToday.length,
      lastLossTime,
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
              <option value="LONDON">London</option>
              <option value="ASIA">Asia</option>
            </select>
          </label>
          <button
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: sessionCooldownActive ? "#7c2d12" : "#2563eb",
              color: "#fff",
              opacity: sessionCooldownActive ? 0.85 : 1,
            }}
            onClick={() => {
              setTradeHistory((prev) => [
                {
                  ...trade,
                  tradeId: crypto.randomUUID(),
                  entryTime: new Date(),

                  // 🔥 SNAPSHOT EVALUATION
                  evaluation: {
                    complianceScore: evaluation.complianceScore,
                    highestSeverity: evaluation.highestSeverity ?? "LOW",
                    violations: evaluation.violations,
                  },

                  // 🚨 COOLDOWN FLAGS (NEW)
                  flags: {
                    duringCooldown: sessionCooldownActive,
                    cooldownViolated: sessionCooldownActive,
                  },
                },
              ...prev,
            ]);

            setPnlInput("");
          }}
        >
          {sessionCooldownActive ? "Log Rule-Breaking Trade" : "Log Trade"}
        </button>


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
    {/* TRADE HISTORY */}
    <div
      style={{
        marginTop: 32,
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        padding: 16,
        background: "#0b0b0b",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Trade History</h3>

      {tradeHistory.length === 0 && (
        <div style={{ opacity: 0.6, fontSize: 14 }}>
          No trades logged yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tradeHistory.map((t) => (
          <div
            key={t.tradeId}
            onClick={() => setSelectedTrade(t)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 8,
              background: selectedTrade?.tradeId === t.tradeId ? "#1a1a1a" : "#111",
              border: "1px solid #222",
              fontSize: 14,
              cursor: "pointer",
            }}
          >

            <div>
              <strong>{t.instrument}</strong> {t.direction} · {t.session}
            </div>

            <div
              style={{
                color: t.pnl >= 0 ? "#4ade80" : "#ff4d4d",
                fontWeight: 600,
              }}
            >
              ${t.pnl}
            </div>
          </div>
        ))}
      </div>
    </div>
    {selectedTrade && (
  <div
    style={{
      marginTop: 24,
      border: "1px solid #333",
      borderRadius: 12,
      padding: 16,
      background: "linear-gradient(180deg, #111, #0b0b0b)",
    }}
  >
    <h3 style={{ marginTop: 0 }}>Trade Review</h3>

    {selectedTrade.flags?.duringCooldown && (
  <div
    style={{
      marginBottom: 12,
      padding: "10px 12px",
      borderRadius: 8,
      background: "linear-gradient(180deg, #2a0f0f, #1a0b0b)",
      border: "1px solid #ff4d4d",
      color: "#ffd6d6",
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    🚨 This trade was taken during a cooldown period.
  </div>
)}


    {!selectedTrade?.evaluation ? (
  <div
    style={{
      opacity: 0.7,
      fontSize: 14,
      lineHeight: 1.6,
      marginTop: 8,
    }}
  >
    This trade was logged before trade review was enabled.
    <br />
    No compliance snapshot is available.
  </div>
) : (
  <>
    <div style={{ marginBottom: 12 }}>
      <strong>Compliance Score:</strong>{" "}
      {selectedTrade.evaluation.complianceScore}%
    </div>

    <div style={{ marginBottom: 12 }}>
      <strong>Severity:</strong>{" "}
      <span
        style={{
          color:
            selectedTrade.evaluation.highestSeverity === "CRITICAL"
              ? "#ff4d4d"
              : selectedTrade.evaluation.highestSeverity === "HIGH"
              ? "#f97316"
              : "#4ade80",
          fontWeight: 600,
        }}
      >
        {selectedTrade.evaluation.highestSeverity}
      </span>
    </div>

    <div>
      <strong>Rule Violations:</strong>

      {selectedTrade.evaluation.violations.length === 0 ? (
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          No violations 🎯
        </div>
      ) : (
        <ul style={{ marginTop: 6 }}>
          {selectedTrade.evaluation.violations.map((v) => (
            <li key={v.ruleId}>{v.ruleName}</li>
          ))}
        </ul>
      )}
    </div>
  </>
)}


  </div>
)}

  </div>
);
}
