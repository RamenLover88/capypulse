import { useState } from "react";
import { T, DEFAULT_INDUSTRY, getApiKey, setApiKey, hasApiKey } from "../constants.js";
import { storageSet, STORAGE_KEYS } from "../lib/storage.js";

export default function SetupView({ onComplete }) {
  const [industry, setIndustry] = useState(DEFAULT_INDUSTRY);
  const [customTopics, setCustomTopics] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("balanced");
  const [xPremium, setXPremium] = useState(false);
  const [modelPreset, setModelPreset] = useState("balanced");
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const [keyError, setKeyError] = useState("");

  const handleSubmit = async () => {
    // Validate API key
    if (!apiKeyInput.trim()) {
      setKeyError("API key is required.");
      return;
    }
    if (!apiKeyInput.startsWith("sk-ant-")) {
      setKeyError("Invalid key format. It should start with sk-ant-");
      return;
    }
    setApiKey(apiKeyInput.trim());

    const config = {
      industry: industry.trim() || DEFAULT_INDUSTRY,
      customTopics: customTopics
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      audience: audience.trim(),
      tone,
      xPremium,
      modelPreset,
      createdAt: new Date().toISOString(),
    };
    await storageSet(STORAGE_KEYS.config, config);
    onComplete(config);
  };

  return (
    <div style={{ maxWidth: 480, width: "100%", boxSizing: "border-box", margin: "0 auto", padding: "80px 24px 60px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 44, fontWeight: 800, color: T.text, margin: "0 0 12px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          CapyPulse
        </h1>
        <p style={{ fontFamily: T.sans, fontSize: 16, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
          Discover trends. Discuss with AI. Publish to X & LinkedIn.
        </p>
      </div>

      <div>
        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginBottom: 8 }}>
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => { setApiKeyInput(e.target.value); setKeyError(""); }}
          placeholder="sk-ant-..."
          style={{
            width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: T.mono,
            border: `1.5px solid ${keyError ? T.accent : T.border}`, borderRadius: 12, background: T.card,
            color: T.text, outline: "none", boxSizing: "border-box",
          }}
        />
        {keyError && (
          <p style={{ fontFamily: T.sans, fontSize: 12, color: T.accent, margin: "6px 0 0" }}>{keyError}</p>
        )}
        <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>
          Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: T.primary }}>console.anthropic.com</a>.
          Your key stays in your browser's local storage only — it is never sent to our servers.
          This app is <a href="https://github.com/RamenLover88/capypulse" target="_blank" rel="noopener noreferrer" style={{ color: T.primary }}>open source</a> — you can verify this yourself.
        </p>

        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 24, marginBottom: 8 }}>
          Your Industry / Niche
        </label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. AI Health & Mental Health"
          style={{
            width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: T.sans,
            border: `1.5px solid ${T.border}`, borderRadius: 12, background: T.card,
            color: T.text, outline: "none", boxSizing: "border-box",
          }}
        />

        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 24, marginBottom: 8 }}>
          Custom Search Topics (optional, one per line)
        </label>
        <textarea
          value={customTopics}
          onChange={(e) => setCustomTopics(e.target.value)}
          placeholder={"e.g.\nAI therapy chatbot ethics\nwearable health diagnostics\nyouth mental health regulation"}
          rows={4}
          style={{
            width: "100%", padding: "14px 16px", fontSize: 14, fontFamily: T.sans,
            border: `1.5px solid ${T.border}`, borderRadius: 12, background: T.card,
            color: T.text, outline: "none", resize: "vertical", lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMuted, margin: "8px 0 0", lineHeight: 1.5 }}>
          Leave blank to use defaults. These guide the AI when scanning for today's topics.
        </p>

        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 24, marginBottom: 8 }}>
          Target Audience (optional)
        </label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. healthcare founders, AI researchers, general public"
          style={{
            width: "100%", padding: "14px 16px", fontSize: 14, fontFamily: T.sans,
            border: `1.5px solid ${T.border}`, borderRadius: 12, background: T.card,
            color: T.text, outline: "none", boxSizing: "border-box",
          }}
        />

        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 24, marginBottom: 8 }}>
          Writing Tone
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["balanced", "provocative", "data-driven", "storytelling"].map((t) => (
            <button key={t} onClick={() => setTone(t)} style={{
              background: tone === t ? T.primary : T.card,
              color: tone === t ? "#fff" : T.textSecondary,
              border: `1.5px solid ${tone === t ? T.primary : T.border}`,
              borderRadius: 10, padding: "8px 14px", fontSize: 13,
              cursor: "pointer", fontFamily: T.sans, transition: "all 0.2s",
            }}>
              {t}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.textSecondary, letterSpacing: 0, marginTop: 24, marginBottom: 8 }}>
          Quality Level
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "economy", label: "Economy", desc: "Haiku — fast & cheap" },
            { key: "balanced", label: "Balanced", desc: "Sonnet — recommended" },
            { key: "quality", label: "Quality", desc: "Opus for drafts" },
          ].map((p) => (
            <button key={p.key} onClick={() => setModelPreset(p.key)} style={{
              background: modelPreset === p.key ? T.primary : T.card,
              color: modelPreset === p.key ? "#fff" : T.textSecondary,
              border: `1.5px solid ${modelPreset === p.key ? T.primary : T.border}`,
              borderRadius: 10, padding: "7px 14px", fontSize: 13,
              cursor: "pointer", fontFamily: T.sans, textAlign: "left",
            }}>
              <div style={{ fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
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
          <span style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>
            I have X Premium (long-form posts)
          </span>
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>
          Premium users can post long-form content. The first 280 characters serve as the visible hook.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: 36, width: "100%", padding: "18px", fontSize: 16, fontWeight: 600,
          fontFamily: T.sans, background: T.text, color: T.bg, border: "none",
          borderRadius: 10, cursor: "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.02em",
        }}
      >
        Get started
      </button>
    </div>
  );
}
