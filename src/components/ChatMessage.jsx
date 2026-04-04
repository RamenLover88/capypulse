import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { T } from "../constants.js";
import CopyButton from "./CopyButton.jsx";

const mdStyles = `
.cp-md h1, .cp-md h2, .cp-md h3 { font-family: ${T.serif}; color: ${T.text}; margin: 12px 0 6px; }
.cp-md h1 { font-size: 18px; } .cp-md h2 { font-size: 16px; } .cp-md h3 { font-size: 14px; }
.cp-md p { margin: 6px 0; }
.cp-md ul, .cp-md ol { margin: 6px 0; padding-left: 20px; }
.cp-md li { margin: 3px 0; }
.cp-md strong { font-weight: 700; }
.cp-md em { font-style: italic; }
.cp-md code { background: ${T.bg}; padding: 1px 5px; border-radius: 4px; font-family: ${T.mono}; font-size: 12px; }
.cp-md pre { background: ${T.bg}; padding: 10px; border-radius: 8px; overflow-x: auto; }
.cp-md pre code { background: none; padding: 0; }
.cp-md a { color: ${T.primary}; text-decoration: underline; }
.cp-md blockquote { border-left: 3px solid ${T.border}; margin: 8px 0; padding-left: 12px; color: ${T.textSecondary}; }
`;

export default function ChatMessage({ msg, index, isEditing, editText, onEditStart, onEditChange, onEditSave, onEditCancel, loading }) {
  const isUser = msg.role === "user";
  const [hover, setHover] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (isEditing) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ maxWidth: "85%", width: "100%" }}>
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave(index); } }}
            rows={3}
            style={{
              width: "100%", padding: "12px 16px", fontSize: 14, fontFamily: T.sans,
              border: `2px solid ${T.primary}`, borderRadius: 16, background: T.card,
              color: T.text, outline: "none", resize: "vertical", lineHeight: 1.65,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <button onClick={onEditCancel} style={{
              background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "4px 12px", fontSize: 11, color: T.textSecondary, cursor: "pointer", fontFamily: T.mono,
            }}>
              Cancel
            </button>
            <button onClick={() => onEditSave(index)} style={{
              background: T.primary, border: "none", borderRadius: 8,
              padding: "4px 12px", fontSize: 11, color: "#fff", cursor: "pointer", fontFamily: T.mono,
            }}>
              Save & Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isUser && <style>{mdStyles}</style>}
      <div
        style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{
          maxWidth: "85%", position: "relative",
          background: isUser ? T.primary : T.card,
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "12px 16px",
          border: isUser ? "none" : `1px solid ${T.border}`,
          boxShadow: isUser ? "none" : T.shadow,
        }}>
          {isUser ? (
            <p style={{
              margin: 0, fontSize: 14, color: "#fff",
              lineHeight: 1.65, fontFamily: T.sans, whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </p>
          ) : showRaw ? (
            <pre style={{
              margin: 0, fontSize: 12, color: T.text, lineHeight: 1.6,
              fontFamily: T.mono, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content}
            </pre>
          ) : (
            <div className="cp-md" style={{ fontSize: 14, color: T.text, lineHeight: 1.65, fontFamily: T.sans }}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}

          {/* AI message toolbar */}
          {!isUser && (
            <div style={{
              display: "flex", gap: 6, marginTop: 8, paddingTop: 8,
              borderTop: `1px solid ${T.borderLight}`, alignItems: "center",
            }}>
              <button onClick={() => setShowRaw(!showRaw)} aria-label="Toggle raw markdown" style={{
                background: showRaw ? T.primaryLight : T.bg, border: `1px solid ${T.borderLight}`,
                borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                color: showRaw ? T.primary : T.textMuted, cursor: "pointer", fontFamily: T.mono,
              }}>
                {showRaw ? "Rendered" : "Raw"}
              </button>
              <CopyButton text={msg.content} label="" />
            </div>
          )}

          {/* User message edit button */}
          {isUser && hover && !loading && (
            <button
              onClick={() => onEditStart(index, msg.content)}
              aria-label="Edit message"
              style={{
                position: "absolute", top: -14, right: -14,
                background: T.card, border: `1px solid ${T.border}`, borderRadius: "50%",
                width: 36, height: 36, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: T.shadow, color: T.textSecondary,
                padding: 0,
              }}
            >
              ✎
            </button>
          )}
        </div>
      </div>
    </>
  );
}
