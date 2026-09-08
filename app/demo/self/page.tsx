"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play, Loader2, PhoneOff, Volume2, VolumeX, Send, MessageSquare, Mic,
} from "lucide-react";

interface CursorWaypoint {
  x: number;
  y: number;
  delay: number;
  click?: boolean;
}

interface DemoStep {
  url: string;
  scrollTo?: number;
  tabClick?: string;
  narration: string;
  waypoints: CursorWaypoint[];
}

const STEPS: DemoStep[] = [
  {
    url: "/",
    scrollTo: 0,
    narration:
      "Welcome to DemoPilot — the open-source platform that creates interactive AI-powered product demos. Here's our landing page.",
    waypoints: [
      { x: 10, y: 5, delay: 0 },
      { x: 50, y: 28, delay: 1500 },
      { x: 50, y: 40, delay: 3000 },
      { x: 50, y: 73, delay: 4500 },
    ],
  },
  {
    url: "/",
    scrollTo: 0,
    narration:
      "Prospects click Try Demo to start an interactive AI demo instantly. The agent navigates your product live and explains it with voice.",
    waypoints: [
      { x: 42, y: 50, delay: 0 },
      { x: 42, y: 50, delay: 1500, click: true },
      { x: 58, y: 50, delay: 3000 },
      { x: 50, y: 58, delay: 4500 },
    ],
  },
  {
    url: "/",
    scrollTo: 700,
    narration:
      "DemoPilot uses GPT-4o Vision to see your product, Playwright to navigate it, and OpenAI TTS for natural voiceover in 50+ languages.",
    waypoints: [
      { x: 50, y: 10, delay: 500 },
      { x: 22, y: 38, delay: 2000 },
      { x: 55, y: 38, delay: 3500 },
      { x: 22, y: 62, delay: 5000 },
      { x: 55, y: 62, delay: 6500 },
    ],
  },
  {
    url: "/showcase",
    narration:
      "Now let me show you the dashboard. The Sessions tab tracks every demo — visitor name, agent, use case, status, and duration.",
    waypoints: [
      { x: 38, y: 14, delay: 500 },
      { x: 38, y: 14, delay: 1200, click: true },
      { x: 40, y: 30, delay: 2500 },
      { x: 20, y: 40, delay: 4000 },
      { x: 65, y: 40, delay: 5500 },
    ],
  },
  {
    url: "/showcase",
    narration:
      "Each row shows the visitor with their email, the agent that ran the demo, and color-coded use case badges — Marketing, Sales, or Success.",
    waypoints: [
      { x: 15, y: 40, delay: 0 },
      { x: 30, y: 40, delay: 1500 },
      { x: 45, y: 40, delay: 3000 },
      { x: 15, y: 46, delay: 4500 },
      { x: 45, y: 52, delay: 6000 },
    ],
  },
  {
    url: "/showcase",
    tabClick: "tab-analytics",
    narration:
      "Let me click on Analytics. Here you see total views, plays, completions, CTA clicks, and average completion — all key performance indicators.",
    waypoints: [
      { x: 18, y: 14, delay: 0 },
      { x: 18, y: 14, delay: 800, click: true },
      { x: 15, y: 35, delay: 2500 },
      { x: 35, y: 35, delay: 3500 },
      { x: 55, y: 35, delay: 4500 },
      { x: 75, y: 35, delay: 5500 },
    ],
  },
  {
    url: "/showcase",
    narration:
      "Below is the engagement chart and conversion funnel. You can track exactly how demos perform and where prospects drop off.",
    waypoints: [
      { x: 30, y: 60, delay: 0 },
      { x: 40, y: 68, delay: 1500 },
      { x: 70, y: 60, delay: 3000 },
      { x: 70, y: 75, delay: 4500 },
    ],
  },
  {
    url: "/showcase",
    tabClick: "tab-knowledge",
    narration:
      "The Knowledge tab is where you upload product docs, FAQs, and objection playbooks. You can also scrape any URL automatically.",
    waypoints: [
      { x: 58, y: 14, delay: 0 },
      { x: 58, y: 14, delay: 800, click: true },
      { x: 50, y: 35, delay: 2500 },
      { x: 75, y: 35, delay: 3500, click: true },
      { x: 40, y: 52, delay: 4500 },
      { x: 40, y: 62, delay: 5500 },
    ],
  },
  {
    url: "/showcase",
    tabClick: "tab-agents",
    narration:
      "In Agents, you have six built-in AI voices. Nova for warm walkthroughs, Onyx for enterprise, Shimmer for marketing content. Each supports multiple languages.",
    waypoints: [
      { x: 78, y: 14, delay: 0 },
      { x: 78, y: 14, delay: 800, click: true },
      { x: 22, y: 42, delay: 2000 },
      { x: 52, y: 42, delay: 3500 },
      { x: 82, y: 42, delay: 5000 },
      { x: 22, y: 68, delay: 6500 },
    ],
  },
  {
    url: "/",
    scrollTo: 0,
    narration:
      "That's DemoPilot — open source, self-hostable, and completely free. Just bring your OpenAI API key. Ask me anything, or hit End when you're done.",
    waypoints: [
      { x: 50, y: 28, delay: 0 },
      { x: 42, y: 50, delay: 2000 },
      { x: 42, y: 50, delay: 3500, click: true },
      { x: 58, y: 50, delay: 5000 },
    ],
  },
];

const SPANISH_NARRATION = [
  "Bienvenido a DemoPilot — la plataforma open source que crea demos de producto interactivas con IA. Esta es nuestra landing page.",
  "Los prospects pulsan Try Demo para arrancar una demo interactiva al instante. El agente navega tu producto en vivo y lo explica con voz.",
  "DemoPilot usa GPT-4o Vision para ver tu producto, Playwright para navegarlo y OpenAI TTS para una locución natural en más de 50 idiomas.",
  "Ahora te muestro el dashboard. La pestaña Sessions registra cada demo: visitante, agente, caso de uso, estado y duración.",
  "Cada fila muestra al visitante con su email, el agente que hizo la demo y badges de caso de uso: Marketing, Sales o Success.",
  "Voy a Analytics. Aquí ves vistas, reproducciones, completions, clics en CTA y la tasa media de finalización.",
  "Abajo está el gráfico de engagement y el funnel de conversión. Puedes ver cómo rinden las demos y dónde se caen los prospects.",
  "En Knowledge subes docs de producto, FAQs y playbooks de objeciones. También puedes scrapear cualquier URL automáticamente.",
  "En Agents hay seis voces de IA. Nova para walkthroughs cercanos, Onyx para enterprise, Shimmer para marketing. Cada una habla varios idiomas.",
  "Esto es DemoPilot: open source, self-hostable y gratis. Solo necesitas tu API key de OpenAI. Pregúntame lo que quieras, o pulsa End cuando termines.",
];

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  return navigator.language || "en";
}

function langCode(locale: string) {
  return locale.slice(0, 2).toLowerCase();
}

function recorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function cleanTranscript(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isHallucination(text: string) {
  return /^(thanks for watching\.?|thank you\.?|thanks\.?|gracias\.?|gracias por ver\.?|subscribe\.?|music\.?|\[.*\]|\(.*\))$/i.test(text.trim());
}

function transcriptScore(text: string) {
  const t = text.toLowerCase();
  const keys = [
    "analytics", "sessions", "knowledge", "agents", "demo", "dashboard",
    "clica", "clic", "click", "pulsa", "abre", "muestra", "try", "features",
    "analitic", "sesion", "conocimiento", "agente",
  ];
  return keys.reduce((n, k) => n + (t.includes(k) ? 4 : 0), 0) + Math.min(text.length, 100) / 25;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ClickableInfo {
  id: string;
  text: string;
  testid?: string;
  href?: string;
  tag: string;
}

function collectClickables(iframe: HTMLIFrameElement | null) {
  const doc = iframe?.contentDocument;
  const map = new Map<string, HTMLElement>();
  const list: ClickableInfo[] = [];
  if (!doc) return { list, map };

  const nodes = Array.from(
    doc.querySelectorAll<HTMLElement>("a, button, [role='button'], [data-testid]")
  );

  for (const el of nodes) {
    const style = doc.defaultView?.getComputedStyle(el);
    if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) continue;
    const text = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 90);
    const testid = el.getAttribute("data-testid") || undefined;
    if (!text && !testid) continue;
    const id = String(list.length);
    list.push({
      id,
      text: text || testid || el.tagName.toLowerCase(),
      testid,
      href: el.getAttribute("href") || undefined,
      tag: el.tagName.toLowerCase(),
    });
    map.set(id, el);
    if (list.length >= 40) break;
  }

  return { list, map };
}

function findClickable(doc: Document, needle: string) {
  const q = needle.toLowerCase().trim();
  if (!q) return null;
  const nodes = Array.from(doc.querySelectorAll<HTMLElement>("a, button, [role='button'], [data-testid]"));
  return (
    nodes.find((el) => (el.getAttribute("data-testid") || "").toLowerCase() === q) ||
    nodes.find((el) => (el.innerText || "").replace(/\s+/g, " ").trim().toLowerCase() === q) ||
    nodes.find((el) =>
      `${el.innerText || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("data-testid") || ""}`
        .toLowerCase()
        .includes(q)
    ) ||
    null
  );
}

function inferActionFromSpeech(
  text: string,
  list: ClickableInfo[],
  currentUrl: string
): { type: string; elementId?: string; url?: string; clickText?: string; scrollY?: number } | null {
  const t = text.toLowerCase();
  const wantsUi = /click|clic|clica|clique|pulsa|pulse|abre|abrir|open|show|muestra|mu[eé]strame|ve a|vete a|go to|entra|tab|bot[oó]n/.test(t);
  if (!wantsUi) return null;

  const matchList = (re: RegExp) => list.find((el) => re.test(`${el.text} ${el.testid || ""} ${el.href || ""}`.toLowerCase()));

  const pairs: Array<[RegExp, { url?: string; clickText: string; listRe: RegExp }]> = [
    [/analytic|anal[ií]tic/, { url: "/showcase", clickText: "Analytics", listRe: /analytic|tab-analytics/ }],
    [/session|sesion/, { url: "/showcase", clickText: "Sessions", listRe: /session|tab-sessions/ }],
    [/knowledge|conocimiento|docs/, { url: "/showcase", clickText: "Knowledge", listRe: /knowledge|tab-knowledge/ }],
    [/agent|agente|voz|voice/, { url: "/showcase", clickText: "Agents", listRe: /agent|tab-agents/ }],
    [/try demo|probar demo/, { url: "/showcase", clickText: "Try Demo", listRe: /try demo/ }],
    [/github/, { clickText: "GitHub", listRe: /github/ }],
    [/feature|caracter[ií]stic/, { clickText: "Features", listRe: /feature/ }],
    [/how it works|c[oó]mo funciona/, { clickText: "How it works", listRe: /how it works|demo/ }],
    [/get started|empezar|comenzar/, { clickText: "Get Started", listRe: /get started/ }],
  ];

  for (const [re, dest] of pairs) {
    if (!re.test(t)) continue;
    const hit = matchList(dest.listRe);
    if (hit) return { type: "click", elementId: hit.id };
    if (dest.url && currentUrl !== dest.url) {
      return { type: "navigate", url: dest.url, clickText: dest.clickText === "Try Demo" ? undefined : dest.clickText };
    }
    return { type: "click", clickText: dest.clickText };
  }

  const spoken = t.replace(/.*(?:click|clic|clica|clique|pulsa|pulse|abre|abrir|bot[oó]n)\s+(?:en\s+|el\s+|la\s+|de\s+)?/i, "").trim();
  if (spoken.length >= 3) {
    const hit = list.find((el) => el.text.toLowerCase().includes(spoken.slice(0, 24)));
    if (hit) return { type: "click", elementId: hit.id };
  }

  return null;
}

export default function SelfDemoPage() {
  const [locale, setLocale] = useState("en");
  const [localeReady, setLocaleReady] = useState(false);
  const lang = langCode(locale);
  const isEs = lang === "es";

  const [phase, setPhase] = useState<"loading" | "active" | "ended">("loading");
  const [stepIdx, setStepIdx] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("/");
  const [iframeReady, setIframeReady] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: "agent" | "viewer"; text: string }>>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [paused, setPaused] = useState(false);
  const [walkthroughDone, setWalkthroughDone] = useState(false);
  const [narrations, setNarrations] = useState<string[]>(STEPS.map((s) => s.narration));

  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioCache = useRef<Map<number, HTMLAudioElement>>(new Map());
  const mutedRef = useRef(muted);
  const pausedRef = useRef(false);
  const sendingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const waypointTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentUrlRef = useRef("/");
  const onIframeReadyRef = useRef<(() => void) | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const agentSpeakingRef = useRef(false);
  const replyAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number>(0);
  const recordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const prerollRef = useRef<Blob[]>([]);
  const utteranceRef = useRef<Blob[]>([]);
  const inUtteranceRef = useRef(false);
  const noiseFloorRef = useRef(0.012);
  const webSpeechFinalRef = useRef("");
  const webSpeechInterimRef = useRef("");
  const lastAgentTextRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantSpeechRef = useRef(false);
  const recorderMimeRef = useRef("audio/webm");
  const speechStartedAt = useRef(0);
  const silenceStartedAt = useRef(0);
  const walkthroughDoneRef = useRef(false);
  const langRef = useRef(lang);
  const localeRef = useRef(locale);
  const narrationsRef = useRef(narrations);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { sendingRef.current = sending; }, [sending]);
  useEffect(() => { walkthroughDoneRef.current = walkthroughDone; }, [walkthroughDone]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { localeRef.current = locale; }, [locale]);
  useEffect(() => { narrationsRef.current = narrations; }, [narrations]);
  useEffect(() => {
    setLocale(detectLocale());
    setLocaleReady(true);
  }, []);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [transcript]);

  useEffect(() => {
    if (audioReady && iframeReady && phase === "loading") {
      setTimeout(() => setPhase("active"), 400);
    }
  }, [audioReady, iframeReady, phase]);

  const stopAgentAudio = useCallback(() => {
    audioCache.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    if (replyAudioRef.current) {
      replyAudioRef.current.pause();
      replyAudioRef.current = null;
    }
    agentSpeakingRef.current = false;
  }, []);

  const preloadAudio = useCallback(async () => {
    let translated = STEPS.map((s) => s.narration);
    if (isEs) {
      translated = SPANISH_NARRATION;
    } else if (lang !== "en") {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: translated, language: locale }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.texts) && data.texts.length === STEPS.length) {
            translated = data.texts;
          }
        }
      } catch { /* keep English */ }
    }

    setNarrations(translated);
    narrationsRef.current = translated;

    await Promise.allSettled(
      translated.map(async (text, i) => {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice: "nova" }),
          });
          if (!res.ok) return;
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = "auto";
          audioCache.current.set(i, audio);
        } catch { /* continue */ }
      })
    );
    setAudioReady(true);
  }, [isEs, lang, locale]);

  useEffect(() => {
    if (!localeReady) return;
    void preloadAudio();
  }, [preloadAudio, localeReady]);

  const handleIframeLoad = useCallback(() => {
    if (!iframeReady) setIframeReady(true);
    if (onIframeReadyRef.current) {
      setTimeout(() => {
        onIframeReadyRef.current?.();
        onIframeReadyRef.current = null;
      }, 400);
    }
  }, [iframeReady]);

  const playAudio = useCallback((idx: number): Promise<void> => {
    return new Promise((resolve) => {
      if (mutedRef.current || pausedRef.current) { resolve(); return; }
      const audio = audioCache.current.get(idx);
      if (!audio) { resolve(); return; }
      agentSpeakingRef.current = true;
      audio.currentTime = 0;
      audio.volume = 1;
      const finish = () => {
        agentSpeakingRef.current = false;
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    });
  }, []);

  const toPixels = useCallback((xPct: number, yPct: number) => {
    const el = screenRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: (xPct / 100) * rect.width, y: (yPct / 100) * rect.height };
  }, []);

  const startWaypoints = useCallback((step: DemoStep) => {
    waypointTimers.current.forEach(clearTimeout);
    waypointTimers.current = [];

    if (step.waypoints.length > 0) {
      setCursorPos(toPixels(step.waypoints[0].x, step.waypoints[0].y));
    }

    step.waypoints.forEach((wp) => {
      const t = setTimeout(() => {
        setCursorPos(toPixels(wp.x, wp.y));
        if (wp.click) {
          setTimeout(() => { setClicked(true); setTimeout(() => setClicked(false), 300); }, 300);
        }
      }, wp.delay);
      waypointTimers.current.push(t);
    });
  }, [toPixels]);

  const executeIframeActions = useCallback((step: DemoStep) => {
    if (step.scrollTo !== undefined) {
      try {
        iframeRef.current?.contentWindow?.scrollTo({ top: step.scrollTo, behavior: "smooth" });
      } catch { /* cross-origin fallback */ }
    }
    if (step.tabClick) {
      try {
        const el = iframeRef.current?.contentDocument?.querySelector(
          `[data-testid="${step.tabClick}"]`
        ) as HTMLElement | null;
        el?.click();
      } catch { /* cross-origin fallback */ }
    }
  }, []);

  useEffect(() => {
    if (phase !== "active" || walkthroughDone || stepIdx >= STEPS.length) return;
    const step = STEPS[stepIdx];

    const runStep = () => {
      executeIframeActions(step);
      setTimeout(() => startWaypoints(step), 200);
    };

    if (step.url !== currentUrlRef.current) {
      currentUrlRef.current = step.url;
      onIframeReadyRef.current = runStep;
      setIframeSrc(step.url);
    } else {
      runStep();
    }

    return () => waypointTimers.current.forEach(clearTimeout);
  }, [phase, stepIdx, walkthroughDone, executeIframeActions, startWaypoints]);

  useEffect(() => {
    if (phase !== "active" || pausedRef.current || walkthroughDone) return;
    if (stepIdx >= STEPS.length) return;

    const text = narrations[stepIdx] || STEPS[stepIdx].narration;
    lastAgentTextRef.current = text;
    setTranscript((prev) => {
      if (prev.some((e) => e.role === "agent" && e.text === text)) return prev;
      return [...prev, { role: "agent", text }];
    });

    let cancelled = false;
    playAudio(stepIdx).then(() => {
      if (cancelled || pausedRef.current) return;
      if (stepIdx >= STEPS.length - 1) {
        setWalkthroughDone(true);
        return;
      }
      advanceTimerRef.current = setTimeout(() => {
        if (!pausedRef.current) setStepIdx((i) => i + 1);
      }, 1200);
    });

    return () => {
      cancelled = true;
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [phase, stepIdx, playAudio, walkthroughDone, narrations]);

  const moveCursorToElement = useCallback(async (el: HTMLElement) => {
    const screen = screenRef.current;
    const iframe = iframeRef.current;
    if (!screen || !iframe) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    } catch { /* */ }
    await sleep(350);
    const screenRect = screen.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursorPos({
      x: iframeRect.left + r.left + r.width / 2 - screenRect.left,
      y: iframeRect.top + r.top + r.height / 2 - screenRect.top,
    });
    await sleep(550);
  }, []);

  const clickElement = useCallback(async (el: HTMLElement) => {
    await moveCursorToElement(el);
    setClicked(true);
    setTimeout(() => setClicked(false), 320);

    const href = (el.getAttribute("href") || "").toLowerCase();
    if (href.includes("/demo/self")) {
      currentUrlRef.current = "/showcase";
      setIframeSrc("/showcase");
      return;
    }

    el.click();
  }, [moveCursorToElement]);

  const waitForIframe = useCallback((timeout = 2500) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeout);
      onIframeReadyRef.current = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }, []);

  const executeAction = useCallback(async (
    action: { type?: string; elementId?: string; url?: string; clickText?: string; scrollY?: number } | undefined,
    map: Map<string, HTMLElement>
  ) => {
    if (!action || action.type === "none") return false;
    const iframe = iframeRef.current;

    if (action.type === "scroll") {
      try {
        iframe?.contentWindow?.scrollTo({ top: action.scrollY ?? 700, behavior: "smooth" });
      } catch { /* */ }
      return true;
    }

    if (action.type === "click" && action.elementId) {
      const el = map.get(action.elementId);
      if (el) {
        await clickElement(el);
        return true;
      }
    }

    if (action.type === "navigate" && action.url) {
      const target = action.url.includes("/demo/self") ? "/showcase" : action.url;
      if (currentUrlRef.current !== target) {
        const loaded = waitForIframe();
        currentUrlRef.current = target;
        setIframeSrc(target);
        await loaded;
        await sleep(200);
      }
      if (action.clickText) {
        const doc = iframeRef.current?.contentDocument;
        const el = doc ? findClickable(doc, action.clickText) : null;
        if (el) await clickElement(el);
      }
      return true;
    }

    if (action.clickText) {
      const doc = iframe?.contentDocument;
      const el = doc ? findClickable(doc, action.clickText) : null;
      if (el) {
        await clickElement(el);
        return true;
      }
    }

    return false;
  }, [clickElement, waitForIframe]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || sendingRef.current) return;

    setPaused(true);
    pausedRef.current = true;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    stopAgentAudio();

    setMessage("");
    setSending(true);
    sendingRef.current = true;
    setInterimSpeech("");
    setTranscript((prev) => [...prev, { role: "viewer", text }]);

    let didUi = false;
    try {
      const { list, map } = collectClickables(iframeRef.current);
      const res = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: locale,
          url: currentUrlRef.current,
          elements: list,
        }),
      });
      const { reply, action } = await res.json();
      const resolvedAction =
        action?.type && action.type !== "none"
          ? action
          : inferActionFromSpeech(text, list, currentUrlRef.current);

      const uiTask = executeAction(resolvedAction, map).then((ok) => { didUi = ok; });

      if (reply) {
        setTranscript((prev) => [...prev, { role: "agent", text: reply }]);
        lastAgentTextRef.current = reply;
        if (!mutedRef.current) {
          const tts = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reply, voice: "nova" }),
          });
          if (tts.ok) {
            const b = await tts.blob();
            const audio = new Audio(URL.createObjectURL(b));
            replyAudioRef.current = audio;
            agentSpeakingRef.current = true;
            const spoken = new Promise<void>((resolve) => {
              audio.onended = () => resolve();
              audio.onerror = () => resolve();
              audio.play().catch(() => resolve());
            });
            await Promise.all([uiTask, spoken]);
            replyAudioRef.current = null;
            agentSpeakingRef.current = false;
          } else {
            await uiTask;
          }
        } else {
          await uiTask;
        }
      } else {
        await uiTask;
      }
    } catch { /* ignore */ }
    finally {
      setSending(false);
      sendingRef.current = false;
      if (didUi) {
        setWalkthroughDone(true);
        walkthroughDoneRef.current = true;
      } else if (!walkthroughDoneRef.current) {
        setStepIdx((i) => {
          if (i >= STEPS.length - 1) {
            setWalkthroughDone(true);
            walkthroughDoneRef.current = true;
            return STEPS.length - 1;
          }
          return i + 1;
        });
      }
      setPaused(false);
      pausedRef.current = false;
    }
  }, [stopAgentAudio, locale, executeAction]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  function handleSendMessage() {
    void sendMessage(message);
  }

  const tickVadRef = useRef<() => void>(() => {});

  const transcribeBlob = useCallback(async (blob: Blob, hint = "") => {
    const mime = blob.type || recorderMimeRef.current || "audio/webm";
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `speech.${ext}`, { type: mime });
    const form = new FormData();
    form.append("audio", file);
    form.append("language", langRef.current);
    if (hint) form.append("hint", hint);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const data = await res.json();
    return cleanTranscript(String(data.text || ""));
  }, []);

  const isEchoOfAgent = useCallback((text: string) => {
    const agent = lastAgentTextRef.current.toLowerCase();
    const t = text.toLowerCase();
    if (!agent || t.length < 8) return false;
    if (agent.includes(t)) return true;
    const words = t.split(" ").filter((w) => w.length > 3);
    if (words.length < 3) return false;
    const overlap = words.filter((w) => agent.includes(w)).length;
    return overlap / words.length >= 0.7;
  }, []);

  const pickTranscript = useCallback((whisper: string, browser: string) => {
    const w = cleanTranscript(whisper);
    const s = cleanTranscript(browser);
    const wOk = w.length >= 2 && !isHallucination(w) && !isEchoOfAgent(w);
    const sOk = s.length >= 2 && !isHallucination(s) && !isEchoOfAgent(s);
    if (wOk && sOk) return transcriptScore(w) >= transcriptScore(s) ? w : s;
    if (wOk) return w;
    if (sOk) return s;
    return "";
  }, [isEchoOfAgent]);

  const beginUtterance = useCallback(() => {
    if (inUtteranceRef.current || sendingRef.current) return;
    inUtteranceRef.current = true;
    recordingRef.current = true;
    utteranceRef.current = [...prerollRef.current];
    prerollRef.current = [];
    webSpeechFinalRef.current = "";
    setInterimSpeech(webSpeechInterimRef.current || (langRef.current === "es" ? "Te estoy escuchando..." : "Listening..."));
    stopAgentAudio();
    setPaused(true);
    pausedRef.current = true;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, [stopAgentAudio]);

  const endUtterance = useCallback(async () => {
    if (!inUtteranceRef.current) return;
    inUtteranceRef.current = false;
    recordingRef.current = false;
    try { mediaRecorderRef.current?.requestData(); } catch { /* */ }
    await sleep(300);

    const chunks = utteranceRef.current;
    utteranceRef.current = [];
    const mime = recorderMimeRef.current || "audio/webm";
    const blob = chunks.length ? new Blob(chunks, { type: mime }) : null;
    const browserText = cleanTranscript(`${webSpeechFinalRef.current} ${webSpeechInterimRef.current}`);
    webSpeechFinalRef.current = "";
    webSpeechInterimRef.current = "";
    setInterimSpeech(langRef.current === "es" ? "Entendiendo..." : "Transcribing...");

    let whisper = "";
    if (blob && blob.size > 400) {
      try { whisper = await transcribeBlob(blob, browserText); } catch { /* */ }
    }

    const text = pickTranscript(whisper, browserText);
    setInterimSpeech("");
    if (text.length >= 2) {
      await sendMessageRef.current(text);
    } else if (!walkthroughDoneRef.current) {
      setPaused(false);
      pausedRef.current = false;
    }
  }, [transcribeBlob, pickTranscript]);

  const startBrowserSpeech = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || recognitionRef.current) return;
    wantSpeechRef.current = true;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = localeRef.current || "es-ES";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = "";
      let finals = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finals += `${piece} `;
        else interim += piece;
      }
      if (finals.trim()) {
        webSpeechFinalRef.current = `${webSpeechFinalRef.current} ${finals}`.trim();
      }
      if (interim) webSpeechInterimRef.current = interim;
      if (inUtteranceRef.current) {
        setInterimSpeech((webSpeechFinalRef.current + " " + (interim || webSpeechInterimRef.current)).trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") wantSpeechRef.current = false;
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (wantSpeechRef.current) {
        setTimeout(() => startBrowserSpeech(), 250);
      }
    };

    try { recognition.start(); } catch { recognitionRef.current = null; }
  }, []);

  const startContinuousRecorder = useCallback((stream: MediaStream) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;
    const mime = recorderMime();
    recorderMimeRef.current = mime || "audio/webm";
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 })
        : new MediaRecorder(stream);
    } catch {
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        return;
      }
    }
    recorder.ondataavailable = (e) => {
      if (!e.data || e.data.size === 0) return;
      if (inUtteranceRef.current) utteranceRef.current.push(e.data);
      else {
        prerollRef.current.push(e.data);
        if (prerollRef.current.length > 10) prerollRef.current.shift();
      }
    };
    mediaRecorderRef.current = recorder;
    try { recorder.start(200); } catch { /* */ }
  }, []);

  const tickVad = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = performance.now();

    if (!inUtteranceRef.current && !agentSpeakingRef.current) {
      noiseFloorRef.current = noiseFloorRef.current * 0.96 + rms * 0.04;
    }

    const floor = Math.max(0.008, noiseFloorRef.current);
    const threshold = agentSpeakingRef.current ? Math.max(0.04, floor * 5.5) : Math.max(0.018, floor * 2.6);
    const speaking = rms > threshold;

    if (sendingRef.current) {
      vadRafRef.current = requestAnimationFrame(tickVad);
      return;
    }

    if (!inUtteranceRef.current) {
      if (speaking) {
        if (!speechStartedAt.current) speechStartedAt.current = now;
        const hold = agentSpeakingRef.current ? 160 : 70;
        if (now - speechStartedAt.current > hold) {
          beginUtterance();
          silenceStartedAt.current = 0;
        }
      } else {
        speechStartedAt.current = 0;
      }
    } else if (speaking) {
      silenceStartedAt.current = 0;
    } else {
      if (!silenceStartedAt.current) silenceStartedAt.current = now;
      if (now - silenceStartedAt.current > 1100) {
        speechStartedAt.current = 0;
        silenceStartedAt.current = 0;
        void endUtterance();
      }
    }

    vadRafRef.current = requestAnimationFrame(tickVad);
  }, [beginUtterance, endUtterance]);

  useEffect(() => { tickVadRef.current = tickVad; }, [tickVad]);

  const startMic = useCallback(async () => {
    if (streamRef.current) {
      setListening(true);
      setMicError(false);
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      startBrowserSpeech();
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
        },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      startContinuousRecorder(stream);
      startBrowserSpeech();
      setListening(true);
      setMicError(false);
      cancelAnimationFrame(vadRafRef.current);
      const loop = () => { tickVadRef.current(); };
      vadRafRef.current = requestAnimationFrame(loop);
      return true;
    } catch {
      setMicError(true);
      setListening(false);
      return false;
    }
  }, [startBrowserSpeech, startContinuousRecorder]);

  useEffect(() => {
    if (phase !== "active") return;
    void startMic();
    return () => {
      wantSpeechRef.current = false;
      cancelAnimationFrame(vadRafRef.current);
      try { recognitionRef.current?.abort(); } catch { /* */ }
      recognitionRef.current = null;
      try { mediaRecorderRef.current?.stop(); } catch { /* */ }
      mediaRecorderRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      recordingRef.current = false;
      inUtteranceRef.current = false;
    };
  }, [phase, startMic]);

  function handleEnd() {
    wantSpeechRef.current = false;
    cancelAnimationFrame(vadRafRef.current);
    try { recognitionRef.current?.abort(); } catch { /* */ }
    try { mediaRecorderRef.current?.stop(); } catch { /* */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopAgentAudio();
    setPhase("ended");
  }

  const step = STEPS[stepIdx] || STEPS[STEPS.length - 1];
  const caption = walkthroughDone
    ? (isEs
      ? "Tour terminado — pregúntame lo que quieras por voz o chat. Pulsa End cuando acabes."
      : "Tour finished — ask me anything by voice or chat. Hit End when you're done.")
    : (narrations[stepIdx] || step.narration);

  if (phase === "ended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800">
          <PhoneOff className="h-7 w-7 text-stone-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">{isEs ? "Demo terminada" : "Demo complete"}</h2>
        <p className="mb-6 text-sm text-stone-400">
          {isEs ? "Esto es DemoPilot — tu plataforma open source de demos con IA." : "That's DemoPilot — your open-source AI demo platform."}
        </p>
        <div className="flex gap-3">
          <a href="/dashboard" className="rounded-xl bg-warm px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">Get Started</a>
          <a href="/" className="rounded-xl border border-stone-700 px-6 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-800">
            {isEs ? "Volver al inicio" : "Back to Home"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-stone-950">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-2">
            <div className="flex items-center gap-3">
              <a href="/" className="flex h-6 w-6 items-center justify-center rounded bg-white">
                <Play className="h-3 w-3 fill-stone-900 text-stone-900" />
              </a>
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
              </span>
              <span className="text-[11px] text-stone-500">
                {walkthroughDone
                  ? (isEs ? "Pregúntame lo que quieras" : "Ask me anything")
                  : `Step ${Math.min(stepIdx + 1, STEPS.length)} / ${STEPS.length}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {phase === "active" && (
                <button
                  onClick={() => { void startMic(); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    listening
                      ? "bg-warm/20 text-warm"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                  }`}
                >
                  <Mic className={`h-3.5 w-3.5 ${listening ? "animate-pulse" : ""}`} />
                  {listening
                    ? (isEs ? "Escuchando" : "Listening")
                    : (isEs ? "Activar micrófono" : "Enable mic")}
                </button>
              )}
              <button onClick={() => setMuted(!muted)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setShowChat(!showChat)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white lg:hidden">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                onClick={handleEnd}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                <PhoneOff className="h-3.5 w-3.5" /> End
              </button>
            </div>
          </div>

          <div ref={screenRef} className="relative flex-1 overflow-hidden bg-white">
            {phase === "loading" && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-warm" />
                <p className="text-sm text-stone-400">
                  {audioReady
                    ? (isEs ? "Arrancando demo..." : "Starting demo...")
                    : (isEs ? "Preparando la voz del agente..." : "Preparing AI agent voice...")}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {isEs ? `Cargando narración en español (${STEPS.length} pasos)` : `Loading narration for ${STEPS.length} steps`}
                </p>
              </div>
            )}

            {micError && phase === "active" && (
              <button
                onClick={() => { void startMic(); }}
                className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-warm px-4 py-2 text-xs font-semibold text-white shadow-lg"
              >
                {isEs ? "Pulsa para activar el micrófono" : "Click to enable microphone"}
              </button>
            )}

            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={handleIframeLoad}
              className="h-full w-full border-0"
              style={{ pointerEvents: "none" }}
            />

            {phase === "active" && (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-50"
                animate={{ x: cursorPos.x, y: cursorPos.y }}
                transition={{ type: "spring", stiffness: 80, damping: 16, mass: 1 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 8-6 2-3 6-5-16z" fill="white" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                {clicked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.7 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-1 top-1 h-4 w-4 rounded-full bg-warm/50"
                  />
                )}
              </motion.div>
            )}

            {phase === "active" && (
              <div className="absolute bottom-4 left-4 right-4 z-40">
                <motion.div
                  key={walkthroughDone ? "idle" : stepIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto max-w-2xl rounded-xl bg-black/70 px-4 py-3 text-sm text-white/90 backdrop-blur-sm"
                >
                  {caption}
                </motion.div>
              </div>
            )}

            {phase === "active" && (
              <div className="absolute bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
                <div className="flex h-4 w-4 items-center justify-center rounded bg-white">
                  <Play className="h-2.5 w-2.5 fill-stone-900 text-stone-900" />
                </div>
                <span className="text-[10px] font-medium text-stone-300">DemoPilot</span>
              </div>
            )}
          </div>
        </div>

        <div className={`flex w-80 flex-col border-l border-stone-800 bg-stone-900 ${showChat ? "fixed inset-y-0 right-0 z-50" : "hidden lg:flex"}`}>
          <div className="border-b border-stone-800 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-stone-400" /> Chat
            </h3>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {listening
                ? (isEs ? "Micrófono activo — habla cuando quieras" : "Mic is on — just speak your question")
                : (isEs ? "Escribe o activa el micrófono para preguntar" : "Type or enable the mic to ask")}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === "viewer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  entry.role === "viewer" ? "bg-warm text-white rounded-br-sm" : "bg-stone-800 text-stone-200 rounded-bl-sm"
                }`}>{entry.text}</div>
              </div>
            ))}
            {interimSpeech && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-warm/40 px-3 py-2 text-[13px] italic text-white/80">
                  {interimSpeech}
                </div>
              </div>
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-stone-800 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
          <div className="border-t border-stone-800 p-3">
            <div className="flex gap-2">
              <button
                onClick={() => { void startMic(); }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  listening
                    ? "bg-warm/20 text-warm"
                    : "border border-stone-700 bg-stone-800 text-stone-300 hover:text-white"
                }`}
                title={listening ? (isEs ? "Escuchando" : "Listening") : (isEs ? "Activar micrófono" : "Enable mic")}
              >
                <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
              </button>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={listening ? (isEs ? "Escuchando..." : "Listening...") : (isEs ? "Pregunta algo..." : "Ask something...")}
                className="h-10 flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 text-sm text-white placeholder:text-stone-500 focus:border-warm focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm text-white hover:opacity-80 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
