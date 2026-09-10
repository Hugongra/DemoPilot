import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

function instructionsFor(language?: string) {
  const lang = String(language || "en").toLowerCase();
  if (lang.startsWith("es")) {
    return "Habla en español de forma cálida y conversacional, como una compañera de ventas en una videollamada. Ritmo natural, no leído. Ligera sonrisa en la voz. Frases cortas. No suenes a locutora de anuncio ni a robot.";
  }
  return "Speak in a warm, conversational sales-demo tone, like a live call with a colleague. Natural pacing, slight smile in the voice, short sentences. Not an ad read and not robotic.";
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "coral", language } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const input = String(text).slice(0, 4000);
    const openai = getOpenAI();
    const instructions = instructionsFor(language);

    let buffer: ArrayBuffer;
    try {
      const response = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: voice as "coral" | "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer" | "sage" | "ash",
        input,
        instructions,
        response_format: "mp3",
      });
      buffer = await response.arrayBuffer();
    } catch {
      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "nova",
        input,
        speed: 0.97,
        response_format: "mp3",
      });
      buffer = await response.arrayBuffer();
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
