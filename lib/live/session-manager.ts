import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type OpenAI from "openai";
import { getOpenAI } from "@/lib/openai";

export interface LiveSession {
  id: string;
  targetUrl: string;
  language: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  transcript: Array<{ role: "agent" | "viewer"; text: string; timestamp: number }>;
  status: "active" | "ended";
  viewerName?: string;
  viewerRole?: string;
  viewerCompany?: string;
  knowledgeContext?: string;
  // SSE subscribers
  subscribers: Set<(event: string, data: string) => void>;
  frameInterval?: ReturnType<typeof setInterval>;
}

const sessions = new Map<string, LiveSession>();

export function getSession(id: string): LiveSession | undefined {
  return sessions.get(id);
}

export function getAllSessions(): LiveSession[] {
  return Array.from(sessions.values()).filter((s) => s.status === "active");
}

function broadcast(session: LiveSession, event: string, data: string) {
  for (const send of session.subscribers) {
    try { send(event, data); } catch { /* subscriber gone */ }
  }
}

export function subscribe(
  sessionId: string,
  callback: (event: string, data: string) => void
): () => void {
  const session = sessions.get(sessionId);
  if (!session) return () => {};
  session.subscribers.add(callback);
  return () => { session.subscribers.delete(callback); };
}

export async function createLiveSession(opts: {
  id: string;
  targetUrl: string;
  language?: string;
  viewerName?: string;
  viewerRole?: string;
  viewerCompany?: string;
  knowledgeContext?: string;
}): Promise<LiveSession> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  await page.goto(opts.targetUrl, { waitUntil: "networkidle", timeout: 30000 });

  const session: LiveSession = {
    id: opts.id,
    targetUrl: opts.targetUrl,
    language: opts.language || "en",
    browser,
    context,
    page,
    transcript: [],
    status: "active",
    viewerName: opts.viewerName,
    viewerRole: opts.viewerRole,
    viewerCompany: opts.viewerCompany,
    knowledgeContext: opts.knowledgeContext,
    subscribers: new Set(),
  };

  sessions.set(opts.id, session);

  // Push screenshot frames via SSE at ~5fps
  session.frameInterval = setInterval(async () => {
    if (session.status !== "active") return;
    try {
      const buffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
      const base64 = buffer.toString("base64");
      broadcast(session, "frame", base64);
    } catch { /* page navigating */ }
  }, 200);

  // Generate intro with TTS
  const introText = await generateAgentResponse(
    session,
    `The viewer just joined. Greet them${opts.viewerName ? ` by name (${opts.viewerName})` : ""} and briefly introduce what you see on the page. Be enthusiastic but concise (2 sentences max).`
  );

  session.transcript.push({ role: "agent", text: introText, timestamp: Date.now() });
  broadcast(session, "agent_text", introText);

  // Generate and stream TTS audio
  streamTTS(session, introText);

  return session;
}

async function streamTTS(session: LiveSession, text: string) {
  try {
    const ttsResponse = await getOpenAI().audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    broadcast(session, "audio", audioBase64);
  } catch { /* TTS failed, text-only fallback */ }
}

export async function handleViewerMessage(
  sessionId: string,
  message: string
): Promise<string> {
  const session = sessions.get(sessionId);
  if (!session || session.status !== "active") return "Session is not active.";

  session.transcript.push({ role: "viewer", text: message, timestamp: Date.now() });
  broadcast(session, "viewer_text", message);

  const screenshotBase64 = await session.page
    .screenshot({ type: "jpeg", quality: 60 })
    .then((b) => b.toString("base64"))
    .catch(() => "");

  const response = await processViewerIntent(session, message, screenshotBase64);

  session.transcript.push({ role: "agent", text: response, timestamp: Date.now() });
  broadcast(session, "agent_text", response);

  // Stream TTS for the response
  streamTTS(session, response);

  return response;
}

function buildSystemPrompt(session: LiveSession): string {
  let prompt = `You are a live AI demo agent showing ${session.targetUrl} to a viewer${
    session.viewerName ? ` named ${session.viewerName}` : ""
  }${session.viewerRole ? ` who is a ${session.viewerRole}` : ""}${
    session.viewerCompany ? ` at ${session.viewerCompany}` : ""
  }. Navigate the product and answer questions. Be helpful, concise, and professional. Respond in the language code: ${session.language}.

Rules:
- Keep responses under 2 sentences
- When navigating, explain what you're doing
- If asked about features you can't see, say so honestly
- Use checkpoints: if unsure about a UI state, describe what you see and ask the viewer
- Never guess or fabricate product information`;

  if (session.knowledgeContext) {
    prompt += `\n\nProduct Knowledge Base:\n${session.knowledgeContext}`;
  }

  return prompt;
}

async function processViewerIntent(
  session: LiveSession,
  message: string,
  screenshotBase64: string
): Promise<string> {
  const transcriptContext = session.transcript
    .slice(-10)
    .map((t) => `${t.role}: ${t.text}`)
    .join("\n");

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Conversation so far:\n${transcriptContext}\n\nViewer says: "${message}"\n\nAnalyze the current page screenshot and respond. If the viewer asks to see something, navigate there. Respond with JSON:\n{\n  "action": "click" | "scroll" | "navigate" | "answer",\n  "selector": "CSS selector (for click)",\n  "url": "URL (for navigate)",\n  "response": "Your spoken response to the viewer"\n}`,
    },
  ];

  if (screenshotBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: "low" },
    });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        { role: "system", content: buildSystemPrompt(session) },
        { role: "user", content },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);

      if (parsed.action === "click" && parsed.selector) {
        try {
          await session.page.click(parsed.selector, { timeout: 5000 });
          await session.page.waitForTimeout(1500);
        } catch { /* element not found */ }
      } else if (parsed.action === "navigate" && parsed.url) {
        try {
          await session.page.goto(parsed.url, { waitUntil: "networkidle", timeout: 15000 });
        } catch { /* navigation failed */ }
      } else if (parsed.action === "scroll") {
        await session.page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
        await session.page.waitForTimeout(1000);
      }

      return parsed.response || "Let me show you that.";
    } catch {
      return cleaned || "Let me look into that for you.";
    }
  } catch {
    return "Let me take a closer look at that.";
  }
}

async function generateAgentResponse(session: LiveSession, prompt: string): Promise<string> {
  const screenshotBase64 = await session.page
    .screenshot({ type: "jpeg", quality: 60 })
    .then((b) => b.toString("base64"))
    .catch(() => "");

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: prompt },
  ];

  if (screenshotBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: "low" },
    });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 200,
      messages: [
        { role: "system", content: buildSystemPrompt(session) },
        { role: "user", content },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "Welcome to the demo!";
  } catch {
    return "Welcome! Let me walk you through this product.";
  }
}

export async function endSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.status = "ended";
  if (session.frameInterval) clearInterval(session.frameInterval);
  broadcast(session, "ended", "Session ended");
  session.subscribers.clear();

  try {
    await session.page.close();
    await session.context.close();
    await session.browser.close();
  } catch { /* ignore */ }

  sessions.delete(sessionId);
}
