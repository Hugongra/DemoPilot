import { chromium, type Page, type Browser } from "playwright";
import OpenAI from "openai";

export interface NavStep {
  screenshot: Buffer;
  description: string;
  url: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI agent navigating a web product to create a demo walkthrough.
You see a screenshot of the current page. Decide the SINGLE best next action to showcase the product.

Respond ONLY with valid JSON (no markdown fences):
{
  "action": "click" | "scroll" | "type" | "done",
  "selector": "CSS selector to interact with (for click/type)",
  "text": "text to type (for type action only)",
  "description": "One sentence describing what the user sees on this page and why it matters",
  "narration": "A friendly voiceover sentence for this step of the demo"
}

Rules:
- Explore the most important features (dashboard, key pages, settings)
- After 5-7 steps, set action to "done"
- Keep descriptions concise and marketing-friendly
- Selectors should be specific (use data attributes, aria labels, or unique text)`;

async function screenshotToBase64(page: Page): Promise<string> {
  const buffer = await page.screenshot({ fullPage: false, type: "jpeg", quality: 80 });
  return buffer.toString("base64");
}

async function askGPT4o(screenshotBase64: string, stepNumber: number, totalSteps: number): Promise<{
  action: "click" | "scroll" | "type" | "done";
  selector?: string;
  text?: string;
  description: string;
  narration: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Step ${stepNumber}/${totalSteps}. Analyze the screenshot and decide the next action.${
              stepNumber >= totalSteps ? ' You should wrap up — set action to "done".' : ""
            }`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${screenshotBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function navigateAndCapture(
  targetUrl: string,
  maxSteps = 6,
  onStep?: (step: number, description: string) => void
): Promise<{ steps: NavStep[]; narrations: string[] }> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const steps: NavStep[] = [];
    const narrations: string[] = [];

    for (let i = 1; i <= maxSteps; i++) {
      const screenshotBase64 = await screenshotToBase64(page);
      const screenshot = Buffer.from(screenshotBase64, "base64");

      let gptResponse;
      try {
        gptResponse = await askGPT4o(screenshotBase64, i, maxSteps);
      } catch {
        gptResponse = {
          action: "done" as const,
          description: "Product overview page",
          narration: "And that's a quick look at the product.",
        };
      }

      steps.push({
        screenshot,
        description: gptResponse.description,
        url: page.url(),
      });
      narrations.push(gptResponse.narration);

      onStep?.(i, gptResponse.description);

      if (gptResponse.action === "done") break;

      try {
        switch (gptResponse.action) {
          case "click":
            if (gptResponse.selector) {
              await page.click(gptResponse.selector, { timeout: 5000 });
              await page.waitForTimeout(2000);
            }
            break;
          case "scroll":
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(1500);
            break;
          case "type":
            if (gptResponse.selector && gptResponse.text) {
              await page.fill(gptResponse.selector, gptResponse.text);
              await page.waitForTimeout(1000);
            }
            break;
        }
      } catch {
        // If action fails, continue to next step with a fresh screenshot
        await page.waitForTimeout(1000);
      }
    }

    return { steps, narrations };
  } finally {
    if (browser) await browser.close();
  }
}
