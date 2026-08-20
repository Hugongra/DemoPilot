import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateScript(narrations: string[], productUrl: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are a professional SaaS demo script writer. Given a list of step narrations from a product walkthrough, create a polished, flowing voiceover script. Keep it concise, enthusiastic but professional. The script should feel like a real product demo video narration. Output ONLY the final script text, no headers or labels.`,
      },
      {
        role: "user",
        content: `Product URL: ${productUrl}\n\nStep narrations:\n${narrations.map((n, i) => `${i + 1}. ${n}`).join("\n")}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? narrations.join(" ");
}

export async function generateAudio(script: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: script,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
