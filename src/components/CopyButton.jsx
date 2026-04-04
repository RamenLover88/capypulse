import { useState } from "react";
import { T } from "../constants.js";

export default function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? T.primary : T.primaryLight,
      border: "none", borderRadius: 8, padding: "8px 14px",
      color: copied ? "#fff" : T.primary, fontSize: 11, fontWeight: 600,
      cursor: "pointer", fontFamily: T.mono, transition: "all 0.2s",
      minHeight: 36,
    }}>
      {copied ? "Copied ✓" : `Copy ${label}`}
    </button>
  );
}
