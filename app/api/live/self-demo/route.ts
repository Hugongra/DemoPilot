import { v4 as uuid } from "uuid";
import { createLiveSession } from "@/lib/live/session-manager";

const DEMOPILOT_KNOWLEDGE = `
[Product: DemoPilot]
DemoPilot is an open-source platform for interactive product demos, built for sales and marketing teams.

[Core Features]
- Sessions: Track every demo session with visitor name, email, agent used, use case (Marketing/Sales/Success), status (Completed/Handed off), duration, and start time. Similar to a CRM activity log but for demos.
- Analytics: Dashboard showing total views, plays, completions, CTA clicks, and average completion rate. Includes engagement-over-time charts and conversion funnels (viewed → started → midpoint → completed → CTA clicked).
- Knowledge Base: Upload product docs, FAQs, pricing pages, objection playbooks, and demo scripts. Also supports URL scraping to import content automatically. The AI agent uses this knowledge during live demos to give accurate answers.
- Agents: Multiple AI voices powered by OpenAI TTS — Nova (warm, engaging), Onyx (deep, authoritative), Alloy (neutral, versatile), Echo (clear, professional), Fable (expressive, storytelling), Shimmer (bright, energetic). Each supports different languages. 50+ languages total.

[How It Works]
1. Paste any product URL
2. An AI agent (GPT-4o Vision) navigates the product in a real Chromium browser
3. For async demos: records video + generates voiceover script + exports MP4
4. For live demos: streams the browser in real-time while the prospect watches and asks questions
5. The agent answers using the Knowledge Base and responds with voice

[Key Differentiators]
- 100% open source (MIT license)
- Self-hostable on your own infrastructure
- No per-seat pricing — $0 platform fee, only API costs (~$0.03/demo)
- CRM webhooks (HubSpot, Salesforce, Zapier)
- Prospect personalization (name, role, company)
- Embeddable demos via iframe
- Team workspaces with RBAC
- Tech stack: Next.js 16, Supabase, Playwright, GPT-4o Vision, OpenAI TTS, FFmpeg, Tailwind CSS

[Navigation Tips for Demo Agent]
- The dashboard has 4 main tabs: Analytics, Sessions, Knowledge, Agents
- Click on each tab to show its content
- The Sessions tab shows a table of demo sessions with visitor info
- The Analytics tab shows conversion metrics and charts
- The Knowledge tab lets you upload docs and scrape URLs
- The Agents tab shows available AI voices with language support
- There's a "New Live Demo" button in the top nav and a "New Demo" button in Sessions
`;

export async function POST() {
  const sessionId = uuid();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await createLiveSession({
      id: sessionId,
      targetUrl: `${baseUrl}/showcase`,
      language: "en",
      viewerName: "Visitor",
      knowledgeContext: DEMOPILOT_KNOWLEDGE,
    });

    if (session) {
      return Response.json({ sessionId, status: "active" });
    }

    return Response.json({ error: "Failed to create session" }, { status: 500 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to start self-demo" },
      { status: 500 }
    );
  }
}
