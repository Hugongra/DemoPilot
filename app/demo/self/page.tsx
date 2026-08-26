"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, BarChart3, BookOpen, Bot, MonitorPlay, MessageSquare,
  Monitor, Volume2, VolumeX, Phone, PhoneOff, Mic,
} from "lucide-react";

interface DemoStep {
  tab: number;
  cursorX: number;
  cursorY: number;
  narration: string;
  delay: number;
}

const STEPS: DemoStep[] = [
  { tab: 1, cursorX: 60, cursorY: 140, narration: "Welcome to DemoPilot — the open-source platform for interactive product demos. Let me show you around.", delay: 6000 },
  { tab: 1, cursorX: 300, cursorY: 155, narration: "This is the Sessions tab. Here you see every demo session — who watched, which agent handled it, and whether it converted.", delay: 7000 },
  { tab: 1, cursorX: 500, cursorY: 155, narration: "Sessions are tagged by use case — Marketing, Sales, or Success — so you know how demos are being used.", delay: 6000 },
  { tab: 0, cursorX: 60, cursorY: 100, narration: "Let me show you Analytics.", delay: 2500 },
  { tab: 0, cursorX: 350, cursorY: 100, narration: "Views, completion rates, CTA clicks, and leads captured — everything you need to measure demo ROI.", delay: 6000 },
  { tab: 2, cursorX: 60, cursorY: 180, narration: "Now the Knowledge Base.", delay: 2500 },
  { tab: 2, cursorX: 350, cursorY: 130, narration: "Upload docs, FAQs, and objection playbooks. The agent uses this to answer prospect questions accurately.", delay: 6000 },
  { tab: 2, cursorX: 450, cursorY: 100, narration: "You can also scrape any URL — paste a link and we extract the content automatically.", delay: 5000 },
  { tab: 3, cursorX: 60, cursorY: 220, narration: "Finally, Agents.", delay: 2500 },
  { tab: 3, cursorX: 300, cursorY: 150, narration: "Multiple AI voices — Nova, Onyx, Alloy, Shimmer — each with different personalities and 50+ languages.", delay: 6000 },
  { tab: 3, cursorX: 400, cursorY: 250, narration: "And it's all open source. No per-seat pricing. Self-host it and start running AI demos today.", delay: 6000 },
];

export default function SelfDemoPage() {
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [step, setStep] = useState(-1);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [userText, setUserText] = useState("");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCache = useRef<Map<number, string>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const currentStep = step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const activeTab = currentStep?.tab ?? 1;

  const preloadAudio = useCallback(async () => {
    setLoading(true);
    let loaded = 0;
    const promises = STEPS.map(async (s, i) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: s.narration, voice: "nova" }),
        });
        if (res.ok) {
          const blob = await res.blob();
          audioCache.current.set(i, URL.createObjectURL(blob));
        }
      } catch { /* skip */ }
      loaded++;
      setLoadProgress(Math.round((loaded / STEPS.length) * 100));
    });
    await Promise.all(promises);
    setLoading(false);
  }, []);

  const playStepAudio = useCallback((idx: number) => {
    const url = audioCache.current.get(idx);
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => {});
      setSpeaking(true);
    }
  }, [muted]);

  const playTTS = useCallback(async (text: string): Promise<void> => {
    setSpeaking(true);
    setCaption(text);
    return new Promise<void>(async (resolve) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: "nova" }),
        });
        if (res.ok && audioRef.current) {
          const blob = await res.blob();
          audioRef.current.src = URL.createObjectURL(blob);
          audioRef.current.muted = muted;
          audioRef.current.onended = () => { setSpeaking(false); resolve(); };
          audioRef.current.play().catch(() => { setSpeaking(false); resolve(); });
          return;
        }
      } catch { /* fallback */ }
      setSpeaking(false);
      resolve();
    });
  }, [muted]);

  const advanceStep = useCallback(() => {
    setStep((prev) => {
      const next = prev + 1;
      if (next >= STEPS.length) {
        setSpeaking(false);
        setCaption("Thanks for watching! Click 'Get Started' to try DemoPilot yourself.");
        return prev;
      }
      return next;
    });
  }, []);

  // Play step audio when step changes
  useEffect(() => {
    if (step < 0 || step >= STEPS.length || paused) return;
    const s = STEPS[step];
    setCaption(s.narration);
    playStepAudio(step);
    stepTimeoutRef.current = setTimeout(advanceStep, s.delay);
    return () => { if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current); };
  }, [step, playStepAudio, advanceStep, paused]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

  async function handleStart() {
    await preloadAudio();
    setStarted(true);
    setStep(0);
  }

  function handleEnd() {
    setStarted(false);
    setStep(-1);
    setSpeaking(false);
    setCaption("");
    setUserText("");
    setElapsed(0);
    setPaused(false);
    setRecording(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  async function startRecording() {
    if (recording || processing) return;

    // Pause demo
    setPaused(true);
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    if (audioRef.current) { audioRef.current.pause(); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) { setPaused(false); advanceStep(); return; }
        await processRecording(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setPaused(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  async function processRecording(blob: Blob) {
    setProcessing(true);
    setCaption("Understanding your question...");

    try {
      // Transcribe with Whisper
      const formData = new FormData();
      formData.append("audio", blob, "question.webm");
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
      const { text } = await transcribeRes.json();

      if (!text || text.trim().length < 3) {
        setProcessing(false);
        setPaused(false);
        advanceStep();
        return;
      }

      setUserText(text);

      // Get AI response
      const chatRes = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const { reply } = await chatRes.json();

      setUserText("");
      setProcessing(false);
      await playTTS(reply);
    } catch {
      setProcessing(false);
      await playTTS("Sorry, let me continue with the demo.");
    }

    setPaused(false);
    advanceStep();
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-white">
      <audio ref={audioRef} onEnded={() => setSpeaking(false)} />

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-sm font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
              <Play className="h-3.5 w-3.5 fill-stone-900 text-stone-900" />
            </div>
            DemoPilot
          </a>
          <span className="text-xs text-white/40">Interactive Product Demo</span>
        </div>
        {started && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm/20">
              <Bot className="h-10 w-10 text-warm" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold">DemoPilot Product Demo</h1>
              <p className="mt-2 max-w-md text-sm text-white/50">
                An AI agent will walk you through the platform — navigating the dashboard
                and explaining features with voice. Hold the mic button to ask questions.
              </p>
            </div>
            <button onClick={handleStart} disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-70">
              {loading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Loading audio... {loadProgress}%</>
              ) : (
                <><Phone className="h-4 w-4" /> Join Demo Call</>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Live demo screen */}
            <div className="relative flex-1 p-4">
              <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-white">
                {/* Browser chrome */}
                <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff6058]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ffc130]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-stone-400 border border-stone-200">
                    app.demopilot.dev/dashboard
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                  </div>
                </div>

                <div className="relative flex h-[calc(100%-36px)]">
                  {/* Sidebar */}
                  <div className="w-44 shrink-0 border-r border-stone-200 bg-stone-50 p-3">
                    <div className="mb-4 flex items-center gap-2 px-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900">
                        <Play className="h-2.5 w-2.5 fill-white text-white" />
                      </div>
                      <span className="text-xs font-bold text-stone-900">DemoPilot</span>
                    </div>
                    {[
                      { icon: BarChart3, label: "Analytics", idx: 0 },
                      { icon: MonitorPlay, label: "Sessions", idx: 1 },
                      { icon: BookOpen, label: "Knowledge", idx: 2 },
                      { icon: Bot, label: "Agents", idx: 3 },
                    ].map((item) => (
                      <div key={item.label}
                        className={`mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all ${
                          activeTab === item.idx ? "bg-white text-stone-900 font-medium shadow-sm border border-stone-200" : "text-stone-500"
                        }`}>
                        <item.icon className="h-3.5 w-3.5" /> {item.label}
                      </div>
                    ))}
                    <div className="mt-4 border-t border-stone-200 pt-3">
                      {[{ icon: MessageSquare, label: "Integrations" }, { icon: Monitor, label: "Routing" }].map((item) => (
                        <div key={item.label} className="mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-stone-400">
                          <item.icon className="h-3.5 w-3.5" /> {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden bg-stone-50/50 p-4">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        {activeTab === 1 && <SessionsContent />}
                        {activeTab === 0 && <AnalyticsContent />}
                        {activeTab === 2 && <KnowledgeContent />}
                        {activeTab === 3 && <AgentsContent />}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Animated cursor */}
                  {currentStep && (
                    <motion.div className="pointer-events-none absolute z-30"
                      animate={{ x: currentStep.cursorX, y: currentStep.cursorY }}
                      transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.8 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 3l14 8-6 2-3 6-5-16z" fill="white" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <motion.div initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: [0, 1.5, 0], opacity: [0.5, 0.2, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
                        className="absolute left-1 top-1 h-4 w-4 rounded-full bg-warm/40" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* User speech */}
            {userText && (
              <div className="px-6 pb-1">
                <div className="mx-auto max-w-2xl rounded-xl bg-blue-500/20 px-5 py-2.5 text-center text-sm text-blue-200">
                  <span className="mr-2 text-xs text-blue-400">You:</span>{userText}
                </div>
              </div>
            )}

            {/* Agent caption */}
            {caption && !userText && (
              <div className="px-6 pb-2">
                <div className="mx-auto max-w-2xl rounded-xl bg-white/10 px-5 py-3 text-center text-sm text-white/90 backdrop-blur-sm">
                  {(speaking || processing) && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-warm animate-pulse" />}
                  {caption}
                </div>
              </div>
            )}

            {/* Call controls */}
            <div className="flex items-center justify-center gap-4 border-t border-white/10 py-4">
              {/* Push-to-talk mic */}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={() => { if (recording) stopRecording(); }}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={processing}
                className={`relative flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium transition-all ${
                  recording
                    ? "bg-red-500 text-white scale-105"
                    : processing
                      ? "bg-white/5 text-white/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}>
                <Mic className="h-5 w-5" />
                {recording ? "Listening..." : processing ? "Processing..." : "Hold to talk"}
                {recording && (
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -inset-1 rounded-full border-2 border-red-500/50" />
                )}
              </button>

              <button onClick={() => setMuted(!muted)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20">
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              <button onClick={handleEnd}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-400">
                <PhoneOff className="h-5 w-5" />
              </button>

              <a href="/dashboard"
                className="ml-2 rounded-lg bg-warm px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90">
                Get Started
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SessionsContent() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div><div className="text-sm font-semibold text-stone-900">Sessions</div><div className="text-[10px] text-stone-400">All demo sessions across every agent</div></div>
        <div className="rounded-md bg-stone-900 px-3 py-1.5 text-[10px] font-medium text-white">+ New Demo</div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="grid grid-cols-6 gap-2 border-b border-stone-100 px-3 py-2 text-[9px] font-medium text-stone-400">
          <span>Visitor</span><span>Agent</span><span>Use case</span><span>Status</span><span>Duration</span><span>Started</span>
        </div>
        {[
          { name: "Sarah Chen", email: "sarah@stripe.com", agent: "Landing page", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", dur: "41m 29s", time: "9m ago" },
          { name: "Omar Bennett", email: "omar@slack.com", agent: "ABM New Hires", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", dur: "41m 28s", time: "34m ago" },
          { name: "Priya Costa", email: "priya@cloudline.co", agent: "Blog", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", dur: "41m 27s", time: "58m ago" },
          { name: "Sofia Novak", email: "sofia@northwind.com", agent: "Copilot US", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", dur: "7m 29s", time: "1h ago" },
          { name: "Liam Vance", email: "liam@stackform.com", agent: "Copilot EMEA", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", dur: "6m 30s", time: "2h ago" },
          { name: "Grace Okafor", email: "grace@brightpath.io", agent: "Landing page", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", dur: "41m 25s", time: "3h ago" },
          { name: "Ravi Park", email: "ravi@heliosys.com", agent: "Blog", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", dur: "41m 24s", time: "4h ago" },
        ].map((r) => (
          <div key={r.name} className="grid grid-cols-6 gap-2 items-center border-b border-stone-50 px-3 py-2 text-[10px]">
            <div><div className="font-medium text-stone-800">{r.name}</div><div className="text-[8px] text-stone-400">{r.email}</div></div>
            <div className="text-stone-600">{r.agent}</div>
            <div><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${r.ucColor}`}>{r.uc}</span></div>
            <div className="flex items-center gap-1 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Completed</div>
            <div className="text-stone-500">{r.dur}</div>
            <div className="text-stone-400">{r.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsContent() {
  return (
    <div>
      <div className="mb-3"><div className="text-sm font-semibold text-stone-900">Analytics</div><div className="text-[10px] text-stone-400">Conversion rates across all demos</div></div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[{ l: "Views", v: "2,847", c: "+23%" }, { l: "Completions", v: "74%", c: "+8%" }, { l: "CTA Clicks", v: "421", c: "+31%" }, { l: "Leads", v: "189", c: "+17%" }].map((s) => (
          <div key={s.l} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="text-[9px] text-stone-400">{s.l}</div>
            <div className="text-base font-bold text-stone-900">{s.v}</div>
            <div className="text-[9px] font-medium text-emerald-600">{s.c}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-3" style={{ height: 160 }}>
        <div className="text-[9px] font-medium text-stone-400 mb-2">Engagement over time</div>
        <div className="flex h-[calc(100%-20px)] items-end gap-1">
          {[40, 65, 45, 80, 60, 90, 70, 85, 55, 75, 50, 88, 62, 78, 92].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#ff6058]/60 to-[#ff6058]/20" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KnowledgeContent() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div><div className="text-sm font-semibold text-stone-900">Knowledge Base</div><div className="text-[10px] text-stone-400">Product docs for your agents</div></div>
        <div className="rounded-md bg-stone-900 px-3 py-1.5 text-[10px] font-medium text-white">+ Add</div>
      </div>
      <div className="mb-3 flex gap-2">
        <div className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[10px] text-stone-400">Import from URL...</div>
        <div className="rounded-lg bg-[#ff6058] px-3 py-2 text-[10px] font-medium text-white">Scrape</div>
      </div>
      <div className="space-y-1.5">
        {[
          { title: "Product Documentation", type: "document", chars: "24,500" },
          { title: "Pricing FAQ", type: "faq", chars: "3,200" },
          { title: "Objection Playbook — Enterprise", type: "objection", chars: "8,100" },
          { title: "API Reference (scraped)", type: "url", chars: "45,000" },
          { title: "Competitor Comparison Sheet", type: "document", chars: "6,800" },
          { title: "Customer Success Stories", type: "demo_script", chars: "12,400" },
        ].map((k) => (
          <div key={k.title} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5">
            <div><div className="text-[10px] font-medium text-stone-800">{k.title}</div><div className="text-[8px] text-stone-400">{k.type} · {k.chars} chars</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsContent() {
  return (
    <div>
      <div className="mb-3"><div className="text-sm font-semibold text-stone-900">Agents</div><div className="text-[10px] text-stone-400">AI voices for your product demos</div></div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: "Nova", desc: "Warm, engaging female voice. Great for walkthroughs.", langs: "EN ES FR PT JA KO ZH" },
          { name: "Onyx", desc: "Deep, authoritative. Ideal for enterprise demos.", langs: "EN DE AR" },
          { name: "Alloy", desc: "Neutral, versatile. Works across all industries.", langs: "EN ES FR DE IT PT" },
          { name: "Shimmer", desc: "Bright, energetic. Perfect for marketing demos.", langs: "EN ES FR DE JA" },
        ].map((a) => (
          <div key={a.name} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-[#ff6058]/10 flex items-center justify-center"><Bot className="h-3.5 w-3.5 text-[#ff6058]" /></div>
              <div className="text-xs font-semibold text-stone-900">{a.name}</div>
            </div>
            <div className="text-[9px] text-stone-400 mb-2">{a.desc}</div>
            <div className="flex flex-wrap gap-1">
              {a.langs.split(" ").map((l) => <span key={l} className="rounded bg-stone-100 px-1 py-0.5 text-[7px] font-medium text-stone-500">{l}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-center">
        <div className="text-[10px] font-medium text-stone-500">Custom voice agents — coming soon</div>
      </div>
    </div>
  );
}
