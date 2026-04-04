import { T, styleMap } from "../constants.js";

export default function TopicCard({ topic, index, onSelect, selected }) {
  const s = styleMap[topic.style] || styleMap["deep-analysis"];
  const active = selected === index;
  const sources = topic.sources || [];

  return (
    <div
      onClick={() => onSelect(index)}
      style={{
        background: active ? s.bg : "transparent",
        border: active ? `2px solid ${s.color}` : `1px solid ${T.border}`,
        borderRadius: 8, padding: "16px 18px", cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: T.sans }}>
          {s.icon || "+"} {topic.style}
        </span>
      </div>
      <h3 style={{
        fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 6px", lineHeight: 1.3,
        fontFamily: T.serif,
      }}>
        {topic.headline}
      </h3>
      <p style={{
        fontSize: 13, color: T.textSecondary, margin: "0 0 8px", lineHeight: 1.55, fontFamily: T.sans,
      }}>
        {topic.summary}
      </p>
      <p style={{ fontSize: 12, color: s.color, margin: "0 0 8px", fontFamily: T.sans, fontStyle: "italic" }}>
        {topic.angle}
      </p>
      {sources.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 8, marginTop: 4 }}>
          {sources.map((src, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 12, color: T.primary, fontFamily: T.sans, textDecoration: "underline" }}
              >
                {src.title || src.url}
              </a>
              {src.published_date && (
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.sans, flexShrink: 0 }}>
                  {src.published_date}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
