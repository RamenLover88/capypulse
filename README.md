# CapyPulse

A daily content pipeline for thought leaders. Scan your industry for trending topics, discuss with AI, and generate posts for X and LinkedIn.

**Discover / Discuss / Publish** — one sharp take, every day.

## Try it now

**https://capypulse.vercel.app**

You'll need an Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys).

Your API key stays in your browser only — it is never sent to our servers. This project is fully open source so you can verify this yourself.

## How it works

1. **Discover** — Scans the web for articles published in the last 2 days in your niche. Returns up to 4 trending topics with real sources, verified URLs, and fresh angles.

2. **Discuss** — Chat with an AI thought partner. It challenges your thinking, finds data, pulls perspectives from X/Reddit, and proposes an outline when you're ready.

3. **Publish** — Generates an X thread (or long-form post for Premium users), a LinkedIn post, and an Obsidian note with sources. Everything is editable before you copy.

## Features

- Real source verification (AI checks every URL)
- Markdown rendering in chat with Raw/Copy toggle
- Editable draft outputs with character counts
- Session persistence (resume where you left off)
- Draft history (last 50 saved locally)
- Model selection (Economy / Balanced / Quality, or per-stage Advanced)
- X Premium long-form support with 280-char fold indicator
- User persona config (audience, tone, industry)
- Responsive design (works on mobile)
- Accessibility hardened (ARIA, focus indicators, touch targets)

## Model options

| Preset | Discover | Chat | Draft | Cost/session |
|--------|----------|------|-------|-------------|
| Economy | Haiku | Haiku | Haiku | ~$0.03 |
| Balanced | Sonnet | Sonnet | Sonnet | ~$0.10 |
| Quality | Sonnet | Sonnet | Opus | ~$0.15 |

You can also choose models per stage in Advanced settings.

## Run locally

```bash
git clone https://github.com/RamenLover88/capypulse.git
cd capypulse
npm install
cp .env.example .env
# Edit .env and add your Anthropic API key
npm run dev
```

Open http://localhost:5173.

## Privacy & Security

- Your API key is stored in your browser's localStorage only
- API calls go directly from your browser to Anthropic — no middleman server
- No analytics, no tracking, no cookies
- Fully open source — audit the code yourself

## Stack

- React + Vite
- Anthropic Claude API (Haiku / Sonnet / Opus + web search)
- react-markdown
- Deployed on Vercel (static site, no backend)

## License

MIT
