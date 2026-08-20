import { chromium, type Page, type Browser, type BrowserContext } from "playwright";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
import os from "os";

export interface NavStep {
  screenshot: Buffer;
  description: string;
  narration: string;
  url: string;
  timestamp: number;
}

export interface NavigationResult {
  steps: NavStep[];
  narrations: string[];
  videoPath: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI agent navigating a web product to create a compelling demo walkthrough.
You see a screenshot of the current page. Decide the SINGLE best next action to showcase the product.

Respond ONLY with valid JSON (no markdown fences):
{
  "action": "click" | "scroll" | "type" | "done",
  "selector": "CSS selector to interact with (for click/type)",
  "text": "text to type (for type action only)",
  "description": "One sentence describing what the user sees on this page and why it matters",
  "narration": "A friendly, enthusiastic voiceover sentence for this step of the demo"
}

Rules:
- Explore the most visually impressive and important features
- Click on navigation links, buttons, and interactive elements to show different pages
- After 5-7 steps, set action to "done"
- Keep narrations concise, professional, and marketing-friendly
- Selectors should be specific (use data attributes, aria labels, or unique text content)
- Prefer visible, above-the-fold interactive elements
- Avoid clicking on external links, login forms, or cookie banners
- Scroll down to reveal hidden content before clicking`;

async function screenshotToBase64(page: Page): Promise<string> {
  const buffer = await page.screenshot({ fullPage: false, type: "jpeg", quality: 80 });
  return buffer.toString("base64");
}

async function askGPT4o(
  screenshotBase64: string,
  stepNumber: number,
  totalSteps: number
): Promise<{
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

async function animateCursor(
  page: Page,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const steps = 30;
  const duration = 700;
  const stepDelay = duration / steps;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = fromX + (toX - fromX) * ease;
    const y = fromY + (toY - fromY) * ease;
    await page.mouse.move(x, y);
    await page.waitForTimeout(stepDelay);
  }
}

async function injectCursorOverlay(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById("demopilot-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demopilot-cursor";
    Object.assign(cursor.style, {
      position: "fixed",
      top: "0px",
      left: "0px",
      width: "28px",
      height: "28px",
      zIndex: "999999",
      pointerEvents: "none",
      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
    });
    cursor.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3L22 14L14 15L10 23L6 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
    document.body.appendChild(cursor);
    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  });
}

export async function navigateAndCapture(
  targetUrl: string,
  maxSteps = 6,
  onStep?: (step: number, description: string) => void
): Promise<NavigationResult> {
  let browser: Browser | null = null;
  const tmpDir = path.join(os.tmpdir(), `demopilot-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context: BrowserContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      recordVideo: {
        dir: tmpDir,
        size: { width: 1280, height: 800 },
      },
    });

    const page = await context.newPage();
    await page.addStyleTag({ content: "* { cursor: none !important; }" });
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await injectCursorOverlay(page);

    let cursorX = 640;
    let cursorY = 400;
    await page.mouse.move(cursorX, cursorY);
    await page.waitForTimeout(500);

    const steps: NavStep[] = [];
    const narrations: string[] = [];
    const startTime = Date.now();

    for (let i = 1; i <= maxSteps; i++) {
      const timestamp = (Date.now() - startTime) / 1000;
      const screenshotBase64 = await screenshotToBase64(page);
      const screenshot = Buffer.from(screenshotBase64, "base64");

      let gptResponse;
      try {
        gptResponse = await askGPT4o(screenshotBase64, i, maxSteps);
      } catch {
        gptResponse = {
          action: "done" as const,
          description: "Product overview page",
          narration: "And that wraps up our quick tour of the product.",
        };
      }

      steps.push({
        screenshot,
        description: gptResponse.description,
        narration: gptResponse.narration,
        url: page.url(),
        timestamp,
      });
      narrations.push(gptResponse.narration);
      onStep?.(i, gptResponse.description);

      if (gptResponse.action === "done") break;

      try {
        switch (gptResponse.action) {
          case "click":
            if (gptResponse.selector) {
              const element = await page.$(gptResponse.selector);
              if (element) {
                const box = await element.boundingBox();
                if (box) {
                  const targetX = box.x + box.width / 2;
                  const targetY = box.y + box.height / 2;
                  await animateCursor(page, cursorX, cursorY, targetX, targetY);
                  cursorX = targetX;
                  cursorY = targetY;
                  await page.waitForTimeout(200);
                  await element.click();
                  await page.waitForTimeout(2500);
                } else {
                  await page.click(gptResponse.selector, { timeout: 5000 });
                  await page.waitForTimeout(2500);
                }
              } else {
                await page.click(gptResponse.selector, { timeout: 5000 });
                await page.waitForTimeout(2500);
              }
              await injectCursorOverlay(page);
            }
            break;
          case "scroll":
            await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
            await page.waitForTimeout(1500);
            break;
          case "type":
            if (gptResponse.selector && gptResponse.text) {
              const input = await page.$(gptResponse.selector);
              if (input) {
                const box = await input.boundingBox();
                if (box) {
                  await animateCursor(page, cursorX, cursorY, box.x + box.width / 2, box.y + box.height / 2);
                  cursorX = box.x + box.width / 2;
                  cursorY = box.y + box.height / 2;
                }
              }
              await page.fill(gptResponse.selector, "");
              for (const char of gptResponse.text) {
                await page.keyboard.type(char, { delay: 80 });
              }
              await page.waitForTimeout(1000);
            }
            break;
        }
      } catch {
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForTimeout(2000);

    // Get the video path from Playwright's API — must call before page.close()
    const video = page.video();
    await page.close();

    let videoPath = "";
    if (video) {
      try {
        videoPath = await video.path();
      } catch {
        // Video path may not be available
      }
    }

    await context.close();

    // Double-check: if video path is empty, look for webm files in tmpDir
    if (!videoPath || !fs.existsSync(/* turbopackIgnore: true */ videoPath)) {
      const videoFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
      if (videoFiles.length > 0) {
        videoPath = path.join(tmpDir, videoFiles[0]);
      }
    }

    console.log(`[DemoPilot] Video recorded: ${videoPath} (exists: ${videoPath ? fs.existsSync(/* turbopackIgnore: true */ videoPath) : false})`);

    return { steps, narrations, videoPath };
  } finally {
    if (browser) await browser.close();
  }
}
