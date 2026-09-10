import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const HALLUCINATIONS = /^(thanks for watching\.?|thank you\.?|thanks\.?|gracias\.?|gracias por ver\.?|subscribe\.?|music\.?|\[.*\]|\(.*\))$/i;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = String(formData.get("language") || "").slice(0, 2).toLowerCase();
    const hint = String(formData.get("hint") || "").trim();

    if (!audioFile) {
      return NextResponse.json({ error: "audio file required" }, { status: 400 });
    }

    const prompt = language === "es"
      ? `Conversación en español con el agente de DemoPilot. El usuario pregunta sobre el producto o pide ver pestañas: Analytics, Sessions, Knowledge, Agents, Try Demo, Features, dashboard. Palabras: DemoPilot, clica, abre, muestra, cuánto cuesta, open source.${hint ? ` Posible texto: ${hint}` : ""}`
      : `Spoken question to the DemoPilot demo agent. The user may ask about the product or ask to open Analytics, Sessions, Knowledge, Agents, Try Demo, Features. Words: DemoPilot, pricing, open source, dashboard.${hint ? ` Possible transcript: ${hint}` : ""}`;

    const run = async (model: "gpt-4o-mini-transcribe" | "whisper-1") => {
      return getOpenAI().audio.transcriptions.create({
        model,
        file: audioFile,
        ...(language ? { language } : {}),
        prompt,
        temperature: 0,
      });
    };

    let text = "";
    try {
      const primary = await run("gpt-4o-mini-transcribe");
      text = primary.text?.trim() || "";
    } catch {
      const fallback = await run("whisper-1");
      text = fallback.text?.trim() || "";
    }

    if (text && HALLUCINATIONS.test(text.trim())) text = "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ text: "" }, { status: 200 });
  }
}
