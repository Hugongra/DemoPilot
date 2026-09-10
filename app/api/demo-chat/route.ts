import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const SYSTEM_PROMPT = `You are DemoPilot's live demo agent. You are on a real call with a viewer watching the product in a browser.

They may ask anything about DemoPilot OR tell you to click / open / show a part of the UI. Always answer the actual question they asked. Do not ignore them to continue a canned tour.

Return JSON only:
{
  "reply": "spoken answer in the viewer's language",
  "action": {
    "type": "none" | "click" | "scroll" | "navigate",
    "elementId": "id from the clickable list when type is click",
    "url": "/ or /showcase when type is navigate",
    "clickText": "optional visible label to click after navigate",
    "scrollY": 700
  }
}

How to talk:
- Sound like a real person on a live demo, not a brochure.
- Answer what they said. If they asked a question, actually answer it (2–4 short spoken sentences).
- If they only asked to click/open something, 1 short sentence plus a UI action is enough.
- Mirror their language (Spanish → Spanish, English → English). Use contractions and natural phrasing.
- Never say you are an AI language model. You are the DemoPilot agent.
- Do not repeat the previous agent line.

UI actions:
- If they ask to click / press / open / show / go to a control, you MUST return a UI action, not only talk.
- Prefer type=click and an elementId that exists in the list. Match loosely across languages (analíticas → Analytics).
- Dashboard tabs: Analytics, Sessions, Knowledge, Agents.
- Want the dashboard/platform from the landing page → navigate to /showcase. If they named a tab, set clickText.
- Home/landing → navigate to "/".
- "Try Demo" inside this demo → /showcase, never /demo/self.
- Features / How it works → click that nav link if present, else scroll.
- Get Started → click that button if present.
- Pure Q&A with no UI intent → type=none.
- Never invent elementIds that are not in the list.

Product facts:
DemoPilot is an open-source AI sales agent that demos any product live. Playwright drives a real browser. GPT-4o Vision decides clicks. Voice via OpenAI TTS. Async MP4 walkthroughs or live Q&A. Knowledge base, analytics, 50+ languages, embeddable player. Self-hostable. You only pay API costs (~$0.03 per demo), no per-seat fee. Stack: Next.js, Supabase, Playwright, GPT-4o, OpenAI TTS.`;

export async function POST(req: NextRequest) {
  try {
    const { message, language, url, elements, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const lang = String(language || "en");
    const elementList = Array.isArray(elements) ? elements.slice(0, 50) : [];
    const past = (Array.isArray(history) ? history.slice(-8) : [])
      .map((turn: { role?: string; text?: string }) => ({
        role: (turn.role === "viewer" ? "user" : "assistant") as "user" | "assistant",
        content: String(turn.text || "").slice(0, 400),
      }))
      .filter((m) => m.content.trim());

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 420,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...past,
        {
          role: "user",
          content: JSON.stringify({
            viewerLanguage: lang,
            currentUrl: url || "/",
            clickableElements: elementList,
            viewerSaid: message,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";
    let parsed: {
      reply?: string;
      action?: {
        type?: string;
        elementId?: string;
        url?: string;
        clickText?: string;
        scrollY?: number;
      };
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw };
    }

    const type = parsed.action?.type;
    const action = {
      type: type === "click" || type === "scroll" || type === "navigate" ? type : "none",
      elementId: parsed.action?.elementId ? String(parsed.action.elementId) : undefined,
      url: parsed.action?.url || undefined,
      clickText: parsed.action?.clickText || undefined,
      scrollY: typeof parsed.action?.scrollY === "number" ? parsed.action.scrollY : undefined,
    };

    if (action.type === "click" && action.elementId && !elementList.some((el: { id?: string }) => String(el.id) === action.elementId)) {
      action.type = "none";
      action.elementId = undefined;
    }

    const fallback =
      lang.startsWith("es")
        ? "Claro, dime qué quieres ver o preguntarme y te ayudo."
        : "Of course — ask me anything or tell me what to open.";

    return NextResponse.json({
      reply: parsed.reply?.trim() || fallback,
      action,
    });
  } catch (error) {
    console.error("Demo chat error:", error);
    return NextResponse.json({
      reply: "Sorry, say that one more time?",
      action: { type: "none" },
    });
  }
}
