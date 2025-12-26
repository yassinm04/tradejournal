export type Severity = "LOW" | "MEDIUM" | "HIGH";

export interface Violation {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: Severity;
  message: string;
}
