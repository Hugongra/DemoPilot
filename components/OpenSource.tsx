"use client";

import { motion } from "framer-motion";
import { GitBranch, Server, Key, Terminal, Check, ArrowRight, X } from "lucide-react";

const costRows = [
  { feature: "Platform fee", them: "$200–500/mo per seat", us: "$0", highlight: true },
  { feature: "5-min async demo", them: "~$2.50 per demo", us: "~$0.03 (API cost)", highlight: false },
  { feature: "Live 10-min session", them: "~$5.00 per session", us: "~$0.08 (API cost)", highlight: false },
  { feature: "10 seats, 500 demos/mo", them: "$2,000–5,000/mo", us: "$15–40/mo", highlight: true },
  { feature: "Data ownership", them: "Vendor-hosted", us: "Your infrastructure", highlight: false },
  { feature: "Source code", them: "Closed", us: "MIT License", highlight: false },
  { feature: "Custom integrations", them: "Limited to their API", us: "Modify anything", highlight: false },
  { feature: "Self-hosting", them: "Not available", us: "Docker / Vercel / AWS", highlight: false },
];

export default function OpenSource() {
  return (
    <section id="open-source" className="relative py-32 px-6">
      <div className="pointer-events-none absolute inset-0 warm-gradient-bg opacity-40" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm">
            Open Source
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
            Stop paying per demo call
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Closed demo platforms charge per seat and per call. DemoPilot gives your entire
            sales team unlimited AI demos &mdash; you only pay for the API calls you make.
          </motion.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Cost comparison table */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h3 className="mb-5 text-lg font-semibold">Cost comparison</h3>

            <div className="rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-stone-50 text-xs font-semibold text-muted-foreground">
                <div className="px-4 py-2.5"></div>
                <div className="px-4 py-2.5 text-center border-l border-border">Closed platforms</div>
                <div className="px-4 py-2.5 text-center border-l border-border text-warm">DemoPilot</div>
              </div>

              {/* Rows */}
              {costRows.map((row) => (
                <div key={row.feature}
                  className={`grid grid-cols-3 border-t border-border text-xs ${row.highlight ? "bg-warm/[0.03]" : ""}`}>
                  <div className="px-4 py-3 font-medium text-foreground">{row.feature}</div>
                  <div className="px-4 py-3 text-center border-l border-border text-muted-foreground flex items-center justify-center gap-1.5">
                    <X className="h-3 w-3 shrink-0 text-red-400" />
                    <span>{row.them}</span>
                  </div>
                  <div className="px-4 py-3 text-center border-l border-border flex items-center justify-center gap-1.5">
                    <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="font-medium text-foreground">{row.us}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800">Annual savings for a 10-person team</p>
                  <p className="mt-0.5 text-[11px] text-emerald-600">Based on 500 demos/month vs closed platforms</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-2xl font-bold text-emerald-700">~$55k</p>
                  <p className="text-[11px] text-emerald-600">/year saved</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Setup steps */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-2xl border border-border bg-stone-950 p-6 sm:p-8 text-white">
            <h3 className="mb-6 text-lg font-semibold">Deploy in 3 minutes</h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-stone-400">
                  <Terminal className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-sm font-medium"><span className="mr-2 text-warm">1.</span>Clone &amp; install</p>
                  <pre className="overflow-x-auto rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-stone-400">
                    <code>{`git clone https://github.com/\\
  Hugongra/DemoPilot
cd DemoPilot && npm install`}</code>
                  </pre>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-stone-400">
                  <Key className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-sm font-medium"><span className="mr-2 text-warm">2.</span>Add your keys</p>
                  <pre className="overflow-x-auto rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-stone-400">
                    <code>{`cp .env.example .env.local
# Add OpenAI + Supabase keys`}</code>
                  </pre>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-stone-400">
                  <Server className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-sm font-medium"><span className="mr-2 text-warm">3.</span>Start demoing</p>
                  <pre className="overflow-x-auto rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-stone-400">
                    <code>npm run dev</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="https://github.com/Hugongra/DemoPilot" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-all hover:bg-stone-100">
                <GitBranch className="h-4 w-4" /> Star on GitHub
              </a>
              <a href="https://github.com/Hugongra/DemoPilot/fork" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10">
                Fork &amp; Deploy <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Tech stack */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-8 rounded-2xl border border-border bg-white p-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {["Next.js 16", "Supabase", "Playwright", "GPT-4o Vision", "OpenAI TTS", "FFmpeg", "Tailwind CSS"].map((t, i) => (
              <span key={t} className="flex items-center gap-4">
                {i > 0 && <span className="text-border">|</span>}
                <span className="font-medium text-foreground">{t}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
