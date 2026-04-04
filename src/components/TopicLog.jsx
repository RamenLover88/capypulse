import { useEffect, useRef } from "react";
import { T } from "../constants.js";

export default function TopicLog({ log, onClose, onResume }) {
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

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(45,42,38,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-log-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bg, borderRadius: 20, maxWidth: 560, width: "100%",
          maxHeight: "80vh", overflow: "auto", padding: 28,
          boxShadow: T.shadowLg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 id="topic-log-title" style={{ margin: 0, fontSize: 22, fontFamily: T.serif, color: T.text }}>Topic Log</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", fontSize: 20, color: T.textMuted, cursor: "pointer",
          }}>✕</button>
        </div>
        {(!log || log.length === 0) ? (
          <p style={{ fontFamily: T.sans, fontSize: 14, color: T.textMuted, textAlign: "center", padding: 32 }}>
            No topics logged yet. Scan your first batch to get started.
          </p>
        ) : (
          log.slice().reverse().map((entry, i) => (
            <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMuted }}>
                {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {entry.topics.map((t, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    opacity: t.selected ? 1 : 0.55,
                  }}>
                    <span style={{ fontSize: 11, color: t.selected ? T.primary : T.textMuted, fontFamily: T.mono }}>
                      {t.selected ? "▶" : "·"}
                    </span>
                    <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text, flex: 1 }}>{t.headline}</span>
                    <button
                      onClick={() => onResume(entry.topics, j)}
                      style={{
                        background: T.primaryLight, border: "none", borderRadius: 6,
                        padding: "2px 8px", fontSize: 10, fontWeight: 600, color: T.primary,
                        cursor: "pointer", fontFamily: T.mono, flexShrink: 0,
                      }}
                    >
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
