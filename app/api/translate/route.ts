import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { texts, language } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "texts is required" }, { status: 400 });
    }

    const lang = String(language || "en").toLowerCase();
    if (lang === "en" || lang.startsWith("en-")) {
      return NextResponse.json({ texts });
    }

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Translate product-demo narration into the requested language. Keep product names (DemoPilot, GPT-4o, Playwright, OpenAI TTS) unchanged. Return JSON: { "texts": string[] } with the same length and order as the input.',
        },
        {
          role: "user",
          content: `Language: ${language}\nTexts: ${JSON.stringify(texts)}`,
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const translated = Array.isArray(parsed.texts) ? parsed.texts : texts;
    if (translated.length !== texts.length) {
      return NextResponse.json({ texts });
    }

    return NextResponse.json({ texts: translated });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ error: "translation failed" }, { status: 500 });
  }
}
