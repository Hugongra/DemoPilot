import { getSupportedLanguages } from "@/lib/agent/voiceover";

export async function GET() {
  return Response.json({ languages: getSupportedLanguages() });
}
