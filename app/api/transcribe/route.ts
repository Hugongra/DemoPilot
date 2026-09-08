import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      ? `DemoPilot. El usuario habla en español y pide ver o clicar partes del producto. Palabras: DemoPilot, Analytics, Sessions, Knowledge, Agents, Try Demo, Get Started, Features, dashboard, clica, pulsa, abre, muestra.${hint ? ` Posible texto: ${hint}` : ""}`
      : `DemoPilot product demo. The user asks to click or show UI. Words: DemoPilot, Analytics, Sessions, Knowledge, Agents, Try Demo, Get Started, Features, dashboard.${hint ? ` Possible transcript: ${hint}` : ""}`;

    const run = async (model: "gpt-4o-mini-transcribe" | "whisper-1") => {
      return openai.audio.transcriptions.create({
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
