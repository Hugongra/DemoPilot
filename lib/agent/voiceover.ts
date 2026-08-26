import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  it: "Italian", nl: "Dutch", pl: "Polish", ru: "Russian", ja: "Japanese",
  ko: "Korean", zh: "Chinese", ar: "Arabic", hi: "Hindi", tr: "Turkish",
  sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", cs: "Czech",
  ro: "Romanian", hu: "Hungarian", el: "Greek", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", uk: "Ukrainian", bg: "Bulgarian", hr: "Croatian",
  sk: "Slovak", sl: "Slovenian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  ca: "Catalan", gl: "Galician", eu: "Basque", cy: "Welsh", mt: "Maltese",
  sr: "Serbian", mk: "Macedonian", sq: "Albanian", bs: "Bosnian", ka: "Georgian",
  hy: "Armenian", az: "Azerbaijani", kk: "Kazakh", uz: "Uzbek", tl: "Filipino",
  sw: "Swahili", am: "Amharic", ne: "Nepali", bn: "Bengali", ta: "Tamil",
  te: "Telugu", ml: "Malayalam", kn: "Kannada", mr: "Marathi", gu: "Gujarati",
};

export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANG_NAMES).map(([code, name]) => ({ code, name }));
}

export async function generateScript(
  narrations: string[],
  productUrl: string,
  language = "en",
  prospectName?: string
): Promise<string> {
  const langName = LANG_NAMES[language] || "English";
  const personalization = prospectName ? `Address the viewer as ${prospectName} at least once.` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are a professional SaaS demo script writer. Write the script in ${langName}. Keep it concise, enthusiastic but professional. Output ONLY the final script text. ${personalization}`,
      },
      {
        role: "user",
        content: `Product URL: ${productUrl}\n\nStep narrations:\n${narrations.map((n, i) => `${i + 1}. ${n}`).join("\n")}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? narrations.join(" ");
}

type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

const LANG_VOICES: Record<string, TTSVoice> = {
  en: "nova", es: "nova", fr: "nova", de: "onyx", pt: "nova",
  ja: "nova", ko: "nova", zh: "nova", ar: "onyx", hi: "nova",
};

export async function generateAudio(script: string, language = "en"): Promise<Buffer> {
  const voice = LANG_VOICES[language] || "nova";

  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice,
    input: script,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
