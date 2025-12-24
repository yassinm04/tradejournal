export type Session = "ASIA" | "LONDON" | "NY";

export interface Trade {
  tradeId: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  entryTime: Date;
  exitTime: Date;
  contracts: number;
  plannedRR: number;
  pnl: number;
  session: Session;
}
