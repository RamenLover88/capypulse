import { T } from "../constants.js";

function SkeletonBar({ width = "100%", height = 14, style = {} }) {
  return (
    <div className="cp-shimmer" style={{
      width, height, borderRadius: 4, background: T.borderLight,
      ...style,
    }} />
  );
}

function SkeletonSection({ title }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.sans }}>
        {title}
      </h4>
      <div style={{ background: T.bg, borderRadius: 12, padding: 16, border: `1px solid ${T.borderLight}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonBar width="90%" />
        <SkeletonBar width="100%" />
        <SkeletonBar width="75%" />
        <SkeletonBar width="85%" />
        <SkeletonBar width="40%" />
      </div>
    </div>
  );
}

export default function DraftSkeleton() {
  return (
    <div style={{ borderTop: `2px solid ${T.borderLight}`, paddingTop: 20 }}>
      {/* Title skeleton */}
      <SkeletonBar width="60%" height={24} style={{ marginBottom: 24 }} />

      <SkeletonSection title="X / Twitter Thread" />
      <SkeletonSection title="LinkedIn" />
      <SkeletonSection title="Obsidian Note" />

      <style>{`
        @keyframes cp-shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .cp-shimmer {
          animation: cp-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
