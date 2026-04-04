import { useState } from "react";
import { T } from "../constants.js";
import CopyButton from "./CopyButton.jsx";

function Section({ title, content, label, mono, showCharCount, onEdit }) {
  const [value, setValue] = useState(content);
  const charCount = showCharCount ? value.length : null;

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.sans }}>
            {title}
          </h4>
          {charCount !== null && (
            <span style={{ fontSize: 10, fontFamily: T.mono, color: charCount > 280 ? T.accent : T.textMuted }}>
              {charCount} chars
            </span>
          )}
        </div>
        <CopyButton text={value} label={title} />
      </div>
      <div style={{ background: T.bg, borderRadius: 12, padding: 16, border: `1px solid ${T.borderLight}` }}>
        <textarea
          className="cp-draft-textarea"
          value={value}
          onChange={(e) => { setValue(e.target.value); onEdit?.(e.target.value); }}
          rows={Math.max(3, value.split("\n").length + 1)}
          style={{
            width: "100%", margin: 0, padding: 0, fontSize: mono ? 12 : 13.5, color: T.text,
            lineHeight: 1.65, fontFamily: mono ? T.mono : T.sans, whiteSpace: "pre-wrap",
            wordBreak: "break-word", background: "transparent", border: "none", outline: "none",
            resize: "vertical", boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

function XPremiumSection({ content, onEdit }) {
  const [value, setValue] = useState(content);
  const foldIdx = value.indexOf("[---FOLD---]");
  const hookLength = foldIdx > -1 ? foldIdx : Math.min(280, value.length);
  const displayText = value.replace("[---FOLD---]", "");

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.sans }}>
            X / Long-form
          </h4>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: hookLength > 280 ? T.accent : T.textMuted }}>
            Hook: {hookLength}/280 chars
          </span>
        </div>
        <CopyButton text={displayText} label="X" />
      </div>
      <div style={{ background: T.bg, borderRadius: 12, border: `1px solid ${T.borderLight}`, overflow: "hidden" }}>
        <textarea
          className="cp-draft-textarea"
          value={value}
          onChange={(e) => { setValue(e.target.value); onEdit?.(e.target.value); }}
          rows={Math.max(5, value.split("\n").length + 1)}
          style={{
            width: "100%", margin: 0, padding: 16, fontSize: 13.5, color: T.text,
            lineHeight: 1.65, fontFamily: T.sans, whiteSpace: "pre-wrap",
            wordBreak: "break-word", background: "transparent", border: "none", outline: "none",
            resize: "vertical", boxSizing: "border-box",
          }}
        />
        {foldIdx > -1 && (
          <div style={{
            margin: "0 16px", padding: "4px 0", borderTop: `2px dashed ${T.accent}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.accent, fontWeight: 600 }}>
              ↑ Visible in timeline (280 chars) — "Show more" below ↓
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DraftOutput({ draft, onDraftChange }) {
  const handleFieldChange = (field) => (value) => {
    onDraftChange?.({ ...draft, [field]: value });
  };

  return (
    <div style={{ borderTop: `2px solid ${T.text}`, paddingTop: 20 }}>
      <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: "0 0 20px", fontFamily: T.serif, letterSpacing: "-0.02em" }}>
        {draft.title}
      </h3>
      {draft.x_thread ? (
        <Section title="X / Twitter Thread" content={draft.x_thread} label="X" showCharCount onEdit={handleFieldChange("x_thread")} />
      ) : (
        <XPremiumSection content={draft.x_post || ""} onEdit={handleFieldChange("x_post")} />
      )}
      <Section title="LinkedIn" content={draft.linkedin_post || ""} label="LinkedIn" onEdit={handleFieldChange("linkedin_post")} />
      <Section title="Obsidian Note" content={draft.obsidian_note || ""} label="Obsidian" mono onEdit={handleFieldChange("obsidian_note")} />
    </div>
  );
}
