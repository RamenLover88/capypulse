// ─── Environment Detection ───────────────────────────────────────
// API key: prefer .env, fallback to localStorage (set via Setup UI)
const ENV_API_KEY = typeof import.meta !== "undefined" && import.meta.env?.VITE_ANTHROPIC_API_KEY;
export function getApiKey() {
  return ENV_API_KEY || localStorage.getItem("capypulse:api-key") || "";
}
export function setApiKey(key) {
  localStorage.setItem("capypulse:api-key", key);
}
export function hasApiKey() {
  return !!getApiKey();
}
export const IS_LOCAL = true; // Always local for open-source version
export const DEV_MODE = typeof import.meta !== "undefined" && import.meta.env?.VITE_DEV_MODE === "true";

// ─── Config Defaults ─────────────────────────────────────────────
export const DEFAULT_INDUSTRY = "AI Health & Mental Health";

export const SEED_TOPICS = [
  "AI mental health therapy chatbot ethics safety",
  "AI wearable health diagnostics personalized medicine",
  "AI drug discovery clinical trials breakthrough",
  "AI mental health youth emotional dependence",
  "AI health equity access underserved communities",
  "AI burnout workplace mental health wellbeing",
];

// ─── Model Constants ────────────────────────────────────────────
// DEV_MODE=true → all calls use Haiku (cheap, fast, for testing UI)
// DEV_MODE=false → production: Haiku for verification, Sonnet for discover/chat, Opus for draft
export const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: DEV_MODE ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-20250514",
  opus: DEV_MODE ? "claude-haiku-4-5-20251001" : "claude-opus-4-20250514",
};

// ─── Rate Limit Config ──────────────────────────────────────────
export const MAX_RETRIES = 3;
export const BASE_DELAY_MS = 2000;
export const MAX_CHAT_HISTORY = 10;

// ─── Phase Constants ────────────────────────────────────────────
export const PHASE = { SETUP: -1, DISCOVER: 0, CHAT: 1, DRAFT: 2 };

// ─── Fonts & Theme ──────────────────────────────────────────────
export const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";

export const T = {
  bg: "#f5f2ec",
  card: "#fffefa",
  cardHover: "#faf8f3",
  primary: "#2d6a4f",
  primaryLight: "#d8f0e0",
  accent: "#b85c2f",
  accentLight: "#fce8d8",
  text: "#1a1714",
  textSecondary: "#5c574f",
  textMuted: "#7d786f",
  border: "#ddd8cf",
  borderLight: "#eae6df",
  shadow: "0 1px 3px rgba(26,23,20,0.04), 0 6px 16px rgba(26,23,20,0.06)",
  shadowLg: "0 4px 12px rgba(26,23,20,0.06), 0 20px 48px rgba(26,23,20,0.12)",
  serif: "'Fraunces', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const styleMap = {
  "deep-analysis": { color: "#2d6a4f", bg: "#d8f0e0", icon: "+" },
  "hot-take": { color: "#b85c2f", bg: "#fce8d8", icon: "!" },
  "personal-story": { color: "#6b4c8a", bg: "#ece2f5", icon: "~" },
  "data-driven": { color: "#2a6b8a", bg: "#daeef7", icon: "#" },
};
