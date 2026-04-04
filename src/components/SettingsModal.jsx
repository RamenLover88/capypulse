import { useState, useEffect, useRef } from "react";
import { T } from "../constants.js";

const SUGGESTED_INDUSTRIES = [
  "AI Health & Mental Health",
  "AI & Education",
  "Fintech & DeFi",
  "Climate Tech & Sustainability",
  "Cybersecurity & Privacy",
  "Future of Work & Remote",
  "Biotech & Genomics",
  "Creator Economy & Social Media",
];

export default function SettingsModal({ config, onSave, onClose }) {
  const [industry, setIndustry] = useState(config?.industry || "");
  const [audience, setAudience] = useState(config?.audience || "");
  const [tone, setTone] = useState(config?.tone || "balanced");
  const [xPremium, setXPremium] = useState(config?.xPremium || false);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleSave = () => {
    onSave({
      ...config,
      industry: industry.trim() || config.industry,
      audience: audience.trim(),
      tone,
      xPremium,
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(45,42,38,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bg, borderRadius: 20, maxWidth: 520, width: "100%",
          maxHeight: "85vh", overflow: "auto", padding: 28,
          boxShadow: T.shadowLg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 id="settings-modal-title" style={{ margin: 0, fontSize: 22, fontFamily: T.serif, color: T.text }}>Settings</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", fontSize: 20, color: T.textMuted, cursor: "pointer",
          }}>✕</button>
        </div>

        {/* Industry */}
        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginBottom: 8 }}>
          Industry / Niche
        </label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. AI Health & Mental Health"
          style={{
            width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: T.sans,
            border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.card,
            color: T.text, outline: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {SUGGESTED_INDUSTRIES.map((s) => (
            <button key={s} onClick={() => setIndustry(s)} style={{
              background: industry === s ? T.primaryLight : T.card,
              border: `1px solid ${industry === s ? T.primary : T.borderLight}`,
              borderRadius: 16, padding: "4px 10px", fontSize: 11,
              color: industry === s ? T.primary : T.textSecondary,
              cursor: "pointer", fontFamily: T.sans,
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* Audience */}
        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 20, marginBottom: 8 }}>
          Target Audience (optional)
        </label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. healthcare founders, AI researchers"
          style={{
            width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: T.sans,
            border: `1.5px solid ${T.border}`, borderRadius: 10, background: T.card,
            color: T.text, outline: "none", boxSizing: "border-box",
          }}
        />

        {/* Tone */}
        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 20, marginBottom: 8 }}>
          Writing Tone
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["balanced", "provocative", "data-driven", "storytelling"].map((t) => (
            <button key={t} onClick={() => setTone(t)} style={{
              background: tone === t ? T.primary : T.card,
              color: tone === t ? "#fff" : T.textSecondary,
              border: `1.5px solid ${tone === t ? T.primary : T.border}`,
              borderRadius: 10, padding: "7px 14px", fontSize: 13,
              cursor: "pointer", fontFamily: T.sans,
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* X Premium */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <button role="switch" aria-checked={xPremium} aria-label="Enable X Premium long-form posts" onClick={() => setXPremium(!xPremium)} style={{
            width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
            background: xPremium ? T.primary : T.border, position: "relative",
            transition: "background 0.2s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2,
              left: xPremium ? 20 : 2, transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.text }}>
            X Premium (long-form posts)
          </span>
        </div>

        {/* Save */}
        <button onClick={handleSave} style={{
          marginTop: 24, width: "100%", padding: "14px", fontSize: 15, fontWeight: 600,
          fontFamily: T.sans, background: T.primary, color: "#fff", border: "none",
          borderRadius: 12, cursor: "pointer", boxShadow: "0 4px 16px rgba(74,124,89,0.25)",
        }}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
