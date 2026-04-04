import { getApiKey, MODELS, MAX_RETRIES, BASE_DELAY_MS } from "../constants.js";

export async function callClaude({ messages, system, useSearch = false, maxTokens = 4000, model = MODELS.sonnet, signal }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API key not configured. Please add your Anthropic API key in Settings.");

  const body = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (res.ok) return res.json();

    if ((res.status === 429 || res.status === 529) && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Rate limited (${res.status}). Retrying in ${delay}ms… (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
}

export function extractText(data) {
  if (!data?.content) return "";
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export function stripCites(text) {
  if (typeof text !== "string") return text;
  return text.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/gi, "$1");
}

export function parseJSON(text) {
  if (!text || text.trim().length === 0) throw new Error("Empty response — no text to parse");
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .replace(/^[^[{]*(?=[\[{])/s, "") // strip leading non-JSON text
    .trim();
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  throw new Error("No valid JSON found in response");
}

// Fallback parser for draft responses when JSON parsing fails (e.g. with Haiku)
export function parseDraftResponse(text) {
  // Try JSON first
  try {
    return parseJSON(text);
  } catch {}

  // Fallback: delimiter-based parsing
  const markers = ["X_THREAD", "X_POST", "LINKEDIN_POST", "TITLE", "OBSIDIAN_NOTE"];
  const sections = {};
  for (let i = 0; i < markers.length; i++) {
    const start = text.indexOf(`===${markers[i]}===`);
    if (start === -1) continue;
    const contentStart = start + markers[i].length + 6;
    // Find next marker or end
    let end = text.length;
    for (let j = 0; j < markers.length; j++) {
      if (j === i) continue;
      const nextMarker = text.indexOf(`===${markers[j]}===`, contentStart);
      if (nextMarker !== -1 && nextMarker < end) end = nextMarker;
    }
    const key = markers[i].toLowerCase();
    sections[key] = text.slice(contentStart, end).trim();
  }

  // Map x_post to x_thread if needed
  if (sections.x_post && !sections.x_thread) sections.x_thread = sections.x_post;

  if (sections.x_thread || sections.linkedin_post) return sections;
  throw new Error("Could not parse draft response — neither JSON nor delimiters found");
}
