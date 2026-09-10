# DemoPilot

Open-source AI sales agent that demos your product live. The agent navigates a real browser, answers prospect questions in real time, and delivers personalized interactive demos — 24/7, in 50+ languages.

Live site: [https://www.demopilot.tech](https://www.demopilot.tech)

![DemoPilot landing page](docs/landing.png)

## Features

- Live interactive demos with voice Q&A
- Async MP4 walkthroughs from any product URL
- Dashboard: Sessions, Analytics, Knowledge, Agents
- GPT-4o Vision + Playwright + OpenAI TTS
- 50+ languages, self-hostable, no per-seat fee

## Getting Started

```bash
npm install
cp .env.example .env.local
```

Add your OpenAI and Supabase keys to `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 16 · Supabase · Playwright · GPT-4o Vision · OpenAI TTS · FFmpeg
