import { severityColors } from "../utils/severity";

type Props = {
  title: string;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
};

export function CoachCard({ title, level, message }: Props) {
  return (
    <div
      style={{
        border: `2px solid ${severityColors[level]}`,
        borderRadius: 8,
        padding: 16,
        marginTop: 16
      }}
    >
      <h3 style={{ color: severityColors[level] }}>
        {title} — {level}
      </h3>
      <p>{message}</p>
    </div>
  );
}
