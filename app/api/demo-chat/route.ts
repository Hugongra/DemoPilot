import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const SYSTEM_PROMPT = `You are a live product-demo agent controlling a real browser view of DemoPilot.

The viewer can ask questions OR tell you to click, open, show, or go to parts of the UI. You must actually drive the UI when they ask.

Return JSON only:
{
  "reply": "short spoken reply in the viewer's language, 1-2 sentences",
  "action": {
    "type": "none" | "click" | "scroll" | "navigate",
    "elementId": "id from the clickable list when type is click",
    "url": "/ or /showcase when type is navigate",
    "clickText": "optional visible label to click after navigate",
    "scrollY": 700
  }
}

Rules:
- If they ask to click / press / open / show / go to a control, you MUST return a UI action, not only talk.
- Prefer type=click and an elementId that exists in the provided list. Match loosely across languages (e.g. "analíticas" → Analytics).
- Dashboard tabs: Analytics, Sessions, Knowledge, Agents.
- If they want the dashboard/platform and the current page is the landing page, navigate to /showcase. If they also named a tab, set clickText to that tab.
- If they want the landing/home, navigate to "/".
- "Try Demo" inside this demo should navigate to /showcase (the product), never /demo/self.
- Features / How it works → click that nav link if present, otherwise scroll.
- Get Started → click that button if present.
- If they only asked a question with no UI intent, type=none.
- Never invent elementIds that are not in the list.
- Keep reply enthusiastic, natural, and in the viewer's language.

About DemoPilot (for Q&A):
Open-source AI product demos: live interactive demos, async MP4 walkthroughs, prospect personalization, knowledge base, analytics, AI voices, 50+ languages, embeddable player. Next.js, Playwright, GPT-4o Vision, OpenAI TTS. Self-hostable.`;

export async function POST(req: NextRequest) {
  try {
    const { message, language, url, elements } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const lang = String(language || "en");
    const elementList = Array.isArray(elements) ? elements.slice(0, 50) : [];

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 250,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
        ? "Claro, dime qué quieres ver y lo abro."
        : "Of course — tell me what you want to see and I'll open it.";

    return NextResponse.json({
      reply: parsed.reply?.trim() || fallback,
      action,
    });
  } catch (error) {
    console.error("Demo chat error:", error);
    return NextResponse.json({
      reply: "Let me try that again — what should I click?",
      action: { type: "none" },
    });
  }
}
