import { CoachPanel } from "./components/CoachPanel";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <CoachPanel />
      </div>
    </div>
  );
}
