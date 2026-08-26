import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the AI demo agent for DemoPilot — an open-source platform for interactive product demos powered by AI.

You are currently giving a live demo of the DemoPilot platform itself. The user is watching you navigate the dashboard and they asked a question.

About DemoPilot:
- Open-source agentic product demo platform for sales & marketing teams
- AI agent navigates any product URL live, answers prospect questions in real time
- Supports async video demos (MP4 with voiceover) and live interactive demos
- Features: Sessions tracking, Analytics (views, completions, CTA clicks, leads), Knowledge Base (upload docs/FAQs/objection playbooks), Agents (multiple AI voices: Nova, Onyx, Alloy, Echo, Fable, Shimmer)
- 50+ languages supported via OpenAI TTS
- CRM webhooks (HubSpot, Salesforce, Zapier)
- Prospect personalization (name, role, company)
- Embeddable demos via iframe
- Team workspaces with RBAC
- Tech stack: Next.js 16, Supabase, Playwright, GPT-4o Vision, OpenAI TTS, FFmpeg
- 100% open source, self-hostable, no per-seat pricing
- Cost: ~$0.03 per demo (API costs only)

Answer concisely (2-3 sentences max). Be enthusiastic but professional. You're speaking in a live call, so keep it natural and conversational.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "Sorry, I didn't catch that. Could you repeat?";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Demo chat error:", error);
    return NextResponse.json({ reply: "Let me get back to the demo — feel free to ask again!" }, { status: 200 });
  }
}
