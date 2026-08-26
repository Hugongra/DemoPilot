"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowRight, Monitor, BarChart3 } from "lucide-react";

const useCases = [
  {
    label: "Live Demo",
    icon: Monitor,
    title: "Prospect opens your demo link",
    description: "An AI agent takes over — navigating your product live while the prospect watches and asks questions in real time.",
    mockContent: (
      <div className="flex h-full bg-stone-950 text-white">
        {/* Browser area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 rounded bg-white/10 px-3 py-1 text-[10px] text-white/50">app.acme.com/dashboard</div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </div>
          </div>
          <div className="flex flex-1 gap-3 p-3">
            <div className="w-14 space-y-2 rounded-lg bg-white/5 p-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-2 w-full rounded bg-white/10" />)}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {["$24.5k", "1,847", "94.2%"].map((v, i) => (
                  <div key={i} className="rounded-lg bg-white/5 p-2">
                    <div className="text-[10px] text-white/40">Metric</div>
                    <div className="text-sm font-semibold text-white">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 rounded-lg bg-white/5 p-2">
                <div className="flex h-full items-end gap-1">
                  {[40, 65, 45, 80, 60, 90, 70, 85, 55, 75].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-warm/60 to-warm/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Chat sidebar */}
        <div className="w-48 border-l border-white/10 flex flex-col">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] font-medium text-white/60">Live Chat</div>
          <div className="flex-1 space-y-2 overflow-hidden p-2">
            <div className="rounded-lg bg-white/5 p-2"><div className="text-[9px] text-warm mb-0.5">Prospect</div><div className="text-[10px] text-white/80">Can you show me the analytics?</div></div>
            <div className="rounded-lg bg-warm/10 p-2"><div className="text-[9px] text-warm mb-0.5">Agent</div><div className="text-[10px] text-white/80">Of course! Let me navigate to the analytics dashboard...</div></div>
            <div className="rounded-lg bg-white/5 p-2"><div className="text-[9px] text-warm mb-0.5">Prospect</div><div className="text-[10px] text-white/80">Does it support custom date ranges?</div></div>
          </div>
          <div className="border-t border-white/10 p-2">
            <div className="rounded-md bg-white/10 px-2 py-1.5 text-[10px] text-white/30">Ask a question...</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Personalize",
    icon: MessageSquare,
    title: "Tailored to each prospect",
    description: "The agent uses prospect name, role, company, and your knowledge base to deliver a demo that speaks directly to their needs.",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="text-xs font-medium text-stone-400">Creating personalized demo for</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">Sarah Chen, VP of Engineering @ Stripe</div>
        </div>
        <div className="flex flex-1 gap-6 p-6">
          <div className="flex-1 space-y-4">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">Agent Script Preview</div>
              <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
                <p>&ldquo;Hi Sarah — let me walk you through how this integrates with your engineering workflow at Stripe...&rdquo;</p>
                <p>&ldquo;Since your team handles high-throughput API requests, I&apos;ll focus on the performance monitoring dashboard...&rdquo;</p>
                <p>&ldquo;The webhook system here is similar to what you already use at Stripe, so the learning curve is minimal...&rdquo;</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Knowledge base: 12 docs loaded &middot; 3 objection playbooks ready
              </div>
            </div>
          </div>
          <div className="w-40 space-y-3">
            <div className="rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-400 mb-1">Role</div><div className="text-xs font-medium">VP Engineering</div></div>
            <div className="rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-400 mb-1">Company</div><div className="text-xs font-medium">Stripe</div></div>
            <div className="rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-400 mb-1">Language</div><div className="text-xs font-medium">English</div></div>
            <div className="rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-400 mb-1">Industry</div><div className="text-xs font-medium">Fintech</div></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Convert",
    icon: BarChart3,
    title: "Track every interaction",
    description: "See which demos convert, where prospects drop off, and push engagement data to your CRM automatically via webhooks.",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-stone-200 px-6 py-3">
          <div className="text-sm font-semibold">Demo Analytics</div>
          <div className="text-xs text-stone-400">Last 30 days &middot; 847 sessions</div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Demo Views", value: "2,847", change: "+23%" },
              { label: "Completion Rate", value: "74%", change: "+8%" },
              { label: "CTA Clicks", value: "421", change: "+31%" },
              { label: "Leads Captured", value: "189", change: "+17%" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-stone-200 p-3">
                <div className="text-[10px] text-stone-400">{m.label}</div>
                <div className="text-lg font-bold text-stone-900">{m.value}</div>
                <div className="text-[10px] font-medium text-emerald-600">{m.change}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-stone-200 p-3">
            <div className="mb-2 text-[10px] font-medium text-stone-400">Conversion Funnel</div>
            <div className="space-y-1.5">
              {[
                { label: "Viewed demo link", pct: 100 },
                { label: "Started watching", pct: 82 },
                { label: "Reached midpoint", pct: 61 },
                { label: "Completed demo", pct: 44 },
                { label: "Clicked CTA", pct: 22 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-24 text-[10px] text-stone-500 text-right">{s.label}</div>
                  <div className="flex-1 h-3 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full rounded-full bg-warm/70" style={{ width: `${s.pct}%` }} />
                  </div>
                  <div className="w-8 text-[10px] font-medium text-stone-600">{s.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 p-2">
            <div className="flex items-center gap-2 text-[10px] text-stone-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Webhooks active: HubSpot &middot; Salesforce &middot; Slack
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function DemoPlayer() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = useCases[activeIdx];

  useEffect(() => {
    const timer = setInterval(() => setActiveIdx((i) => (i + 1) % useCases.length), 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="demo" className="relative py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm">
            How It Works
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
            Demo, personalize, convert
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            An AI agent runs your product demo — live or async — while you focus on closing.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl">

          {/* Tab buttons */}
          <div className="flex border-b border-border">
            {useCases.map((uc, i) => (
              <button key={uc.label} onClick={() => setActiveIdx(i)}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${
                  i === activeIdx ? "bg-warm-light text-warm border-b-2 border-warm" : "text-muted-foreground hover:bg-stone-50 hover:text-foreground"
                }`}>
                <uc.icon className="h-4 w-4" /> {uc.label}
              </button>
            ))}
          </div>

          {/* Mock UI */}
          <div className="relative aspect-video bg-stone-50">
            <AnimatePresence mode="wait">
              <motion.div key={activeIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                className="absolute inset-0">
                {current.mockContent}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Description */}
          <div className="flex items-center justify-between border-t border-border p-6">
            <div>
              <h3 className="text-lg font-semibold">{current.title}</h3>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">{current.description}</p>
            </div>
            <a href="/live/new"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80">
              Try it now <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
