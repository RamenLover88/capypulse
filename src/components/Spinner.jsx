import { T } from "../constants.js";

export default function Spinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{
        width: 32, height: 32,
        border: `2.5px solid ${T.borderLight}`, borderTopColor: T.primary,
        borderRadius: "50%", animation: "capyspin 0.7s linear infinite",
        margin: "0 auto 12px",
      }} />
      <p style={{ fontSize: 13, color: T.textMuted, fontFamily: T.mono, margin: 0 }}>{message}</p>
    </div>
  );
}
