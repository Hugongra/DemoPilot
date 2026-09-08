"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Users, TrendingUp, Zap, Monitor,
  BarChart3, BookOpen, Bot, MonitorPlay, MessageSquare,
  Loader2,
} from "lucide-react";

export default function Hero({ onOpenAuth }: { onOpenAuth: () => void }) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  function handleTryDemo() {
    setLaunching(true);
    router.push("/demo/self");
  }

  // Animated cursor for the mock dashboard
  const [cursorIdx, setCursorIdx] = useState(0);
  const [clicked, setClicked] = useState(false);

  const cursorPath = [
    { x: 120, y: 80, tab: 1 }, { x: 300, y: 155, tab: 1 }, { x: 500, y: 155, tab: 1 },
    { x: 60, y: 100, tab: 0 }, { x: 350, y: 100, tab: 0 }, { x: 400, y: 230, tab: 0 },
    { x: 60, y: 180, tab: 2 }, { x: 350, y: 130, tab: 2 },
    { x: 60, y: 220, tab: 3 }, { x: 280, y: 180, tab: 3 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setClicked(true);
      setTimeout(() => setClicked(false), 200);
      setCursorIdx((i) => (i + 1) % cursorPath.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const pos = cursorPath[cursorIdx];
  const activeTab = pos.tab;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-8">
      <div className="pointer-events-none absolute inset-0 warm-gradient-bg opacity-60" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-warm" />
          Open source &middot; Interactive product demos &middot; AI-powered
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Your AI sales agent that{" "}
          <span className="warm-gradient-text">demos your product.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          An AI agent navigates your product live, answers prospect questions
          in real time, and delivers personalized interactive demos &mdash; 24/7, in 50+ languages.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button onClick={handleTryDemo} disabled={launching}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-warm px-10 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-70">
            {launching ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Launching agent...</>
            ) : (
              <>Try Demo <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
          <a href="https://github.com/Hugongra/DemoPilot" target="_blank" rel="noopener noreferrer"
            className="flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-white px-8 text-base font-medium text-foreground shadow-sm transition-all hover:bg-stone-50">
            View on GitHub
          </a>
        </motion.div>

        {/* Live platform demo with animated cursor */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
          className="relative mx-auto mt-14 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff6058]" />
                <div className="h-3 w-3 rounded-full bg-[#ffc130]" />
                <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-stone-400 border border-stone-200">
                app.demopilot.dev/dashboard
              </div>
            </div>

            <div className="relative flex" style={{ height: 340 }}>
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-stone-200 bg-stone-50 p-3">
                <div className="mb-4 flex items-center gap-2 px-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900">
                    <div className="h-2.5 w-2.5 border-l-[5px] border-t-[3px] border-b-[3px] border-l-white border-t-transparent border-b-transparent" />
                  </div>
                  <span className="text-xs font-bold">DemoPilot</span>
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
                {activeTab === 1 && <MockSessions />}
                {activeTab === 0 && <MockAnalytics />}
                {activeTab === 2 && <MockKnowledge />}
                {activeTab === 3 && <MockAgents />}
              </div>

              {/* Cursor */}
              <motion.div className="pointer-events-none absolute z-30"
                animate={{ x: pos.x, y: pos.y }}
                transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 8-6 2-3 6-5-16z" fill="white" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                {clicked && <motion.div initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 0.4 }} className="absolute left-1 top-1 h-4 w-4 rounded-full bg-warm/40" />}
              </motion.div>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-warm/5 blur-2xl" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-warm" /> Live &amp; async demos</span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Personalized per prospect</span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Conversion analytics</span>
        </motion.div>
      </div>
    </section>
  );
}

function MockSessions() {
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
          { name: "Sarah Chen", email: "sarah@stripe.com", agent: "Landing page", uc: "Marketing", ucC: "bg-purple-100 text-purple-700", dur: "41m 29s", time: "9m ago" },
          { name: "Omar Bennett", email: "omar@slack.com", agent: "ABM New Hires", uc: "Sales", ucC: "bg-orange-100 text-orange-700", dur: "41m 28s", time: "34m ago" },
          { name: "Priya Costa", email: "priya@cloudline.co", agent: "Blog", uc: "Marketing", ucC: "bg-purple-100 text-purple-700", dur: "41m 27s", time: "58m ago" },
          { name: "Sofia Novak", email: "sofia@northwind.com", agent: "Copilot US", uc: "Sales", ucC: "bg-orange-100 text-orange-700", dur: "7m 29s", time: "1h ago" },
          { name: "Liam Vance", email: "liam@stackform.com", agent: "Copilot EMEA", uc: "Sales", ucC: "bg-orange-100 text-orange-700", dur: "6m 30s", time: "2h ago" },
        ].map((r) => (
          <div key={r.name} className="grid grid-cols-6 gap-2 items-center border-b border-stone-50 px-3 py-2 text-[10px]">
            <div><div className="font-medium text-stone-800">{r.name}</div><div className="text-[8px] text-stone-400">{r.email}</div></div>
            <div className="text-stone-600">{r.agent}</div>
            <div><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${r.ucC}`}>{r.uc}</span></div>
            <div className="flex items-center gap-1 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Completed</div>
            <div className="text-stone-500">{r.dur}</div>
            <div className="text-stone-400">{r.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAnalytics() {
  return (
    <div>
      <div className="mb-3"><div className="text-sm font-semibold text-stone-900">Analytics</div><div className="text-[10px] text-stone-400">Conversion rates across all demos</div></div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[{ l: "Views", v: "2,847" }, { l: "Completions", v: "74%" }, { l: "CTA Clicks", v: "421" }, { l: "Leads", v: "189" }].map((s) => (
          <div key={s.l} className="rounded-lg border border-stone-200 bg-white p-3"><div className="text-[9px] text-stone-400">{s.l}</div><div className="text-base font-bold text-stone-900">{s.v}</div></div>
        ))}
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-3 h-32">
        <div className="flex h-full items-end gap-1">
          {[40, 65, 45, 80, 60, 90, 70, 85, 55, 75, 50, 88].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-warm/60 to-warm/20" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MockKnowledge() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div><div className="text-sm font-semibold text-stone-900">Knowledge Base</div><div className="text-[10px] text-stone-400">Product docs for your agents</div></div>
        <div className="rounded-md bg-stone-900 px-3 py-1.5 text-[10px] font-medium text-white">+ Add</div>
      </div>
      <div className="mb-3 flex gap-2">
        <div className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[10px] text-stone-400">Import from URL...</div>
        <div className="rounded-lg bg-warm px-3 py-2 text-[10px] font-medium text-white">Scrape</div>
      </div>
      <div className="space-y-1.5">
        {["Product Docs", "Pricing FAQ", "Objection Playbook", "API Reference"].map((k) => (
          <div key={k} className="rounded-lg border border-stone-200 bg-white px-3 py-2.5">
            <div className="text-[10px] font-medium text-stone-800">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAgents() {
  return (
    <div>
      <div className="mb-3"><div className="text-sm font-semibold text-stone-900">Agents</div><div className="text-[10px] text-stone-400">AI voices for your demos</div></div>
      <div className="grid grid-cols-2 gap-2">
        {[{ name: "Nova", langs: "EN ES FR PT JA" }, { name: "Onyx", langs: "EN DE AR" }, { name: "Alloy", langs: "EN ES FR DE" }, { name: "Shimmer", langs: "EN ES FR JA" }].map((a) => (
          <div key={a.name} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-1"><div className="h-6 w-6 rounded-md bg-warm/10 flex items-center justify-center"><Bot className="h-3 w-3 text-warm" /></div><div className="text-xs font-semibold">{a.name}</div></div>
            <div className="flex gap-1">{a.langs.split(" ").map((l) => <span key={l} className="rounded bg-stone-100 px-1 py-0.5 text-[7px] font-medium text-stone-500">{l}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
