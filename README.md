# 🫧 CapyPulse

A daily content pipeline for niche thought leaders. Scan your industry, discuss with AI, publish to X and LinkedIn.

**Discover → Discuss → Publish** — in one session, every morning.

## What it does

1. **Discover** — Scans the web for trending topics in your niche and surfaces 4 with fresh angles
2. **Discuss** — Chat with an AI thought partner who challenges your thinking, finds data, and helps shape your take
3. **Publish** — Generates platform-ready posts (X + LinkedIn) and an Obsidian note with sources

Unselected topics are logged so you never lose a good idea.

## Why this exists

Most content tools optimize for volume. CapyPulse optimizes for insight.

If you're a thought leader in a specific niche — AI health, climate tech, fintech, whatever — you don't need 50 generic captions. You need one sharp take, grounded in today's news, refined through conversation, ready to post.

## Quick Start

### Option 1: Claude Artifact (zero setup)

Copy the contents of `src/App.jsx` into a Claude.ai conversation and ask Claude to run it as an artifact. No API key, no hosting, no deploy.

### Option 2: Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/capypulse.git
cd capypulse
npm install

# Add your Anthropic API key
cp .env.example .env
# Edit .env and paste your key from https://console.anthropic.com

npm run dev
```

Open `http://localhost:5173` — that's it.

## Configure Your Niche

On first launch, CapyPulse asks for your industry name and optional custom search topics. This is saved to local storage and persists across sessions.

You can also edit the defaults directly in `src/App.jsx`:

```javascript
const DEFAULT_INDUSTRY = "AI Health & Mental Health";

const SEED_TOPICS = [
  "AI mental health therapy chatbot ethics safety",
  "AI wearable health diagnostics personalized medicine",
  // Add your own niche-specific search phrases
];
```

Click the ⚙ Reset button in the app to reconfigure anytime.

## Architecture

```
capypulse/
├── src/App.jsx      ← Single-file React app (~840 lines)
│   ├── Config       ← Industry name, search topics
│   ├── Prompts      ← Discover / Chat / Draft system prompts
│   ├── API layer    ← callClaude() with web search + auth
│   ├── Storage      ← window.storage (artifact) or localStorage (local)
│   └── UI           ← Setup → Discover → Chat → Draft
├── .env.example     ← API key template
├── index.html
├── package.json
└── vite.config.js
```

Key decisions:
- **Single file** — paste into Claude artifacts or fork as a Vite project
- **No database** — browser storage for session logs, Obsidian vault for permanent archive
- **Industry as config** — change your niche without touching prompts
- **Dual environment** — same code runs in Claude artifacts and standalone

## Stack

- React + Vite
- Anthropic Claude API (Sonnet 4, web search tool)
- Fraunces + DM Sans + JetBrains Mono typography

## Roadmap

- [ ] Direct Obsidian integration (write notes via Local REST API)
- [ ] Scheduled daily scans
- [ ] Post history and performance tracking
- [ ] Multi-language post generation
- [ ] Custom prompt templates per platform

## License

MIT — Use it, fork it, make it yours.
