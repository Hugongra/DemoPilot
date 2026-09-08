"use client";

import { motion } from "framer-motion";
import {
  Monitor, MessageSquare, BrainCircuit, BarChart3, Languages,
  Share2, BookOpen, Film, UserCheck, Code2, Mic,
} from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "Live Interactive Demos",
    description:
      "An AI agent navigates your product in real time while the prospect watches. They ask questions — the agent answers and clicks through relevant features.",
    badge: "Core",
  },
  {
    icon: Film,
    title: "Async Video Demos",
    description:
      "Generate polished MP4 walkthroughs from any URL. AI records the browser, writes the script, and adds natural voiceover — ready to share in minutes.",
    badge: "Core",
  },
  {
    icon: UserCheck,
    title: "Prospect Personalization",
    description:
      "Enter name, role, and company. The AI tailors the entire demo to their context — mentioning their pain points, industry, and use case.",
    badge: "Sales",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Q&A",
    description:
      "Prospects type questions during a live demo. The agent understands context, navigates to the answer, and responds with voice.",
    badge: "Sales",
  },
  {
    icon: BookOpen,
    title: "Product Knowledge Base",
    description:
      "Upload docs, FAQs, pricing pages, and objection playbooks. The agent uses this knowledge to give accurate, on-brand answers in every demo.",
    badge: "Sales",
  },
  {
    icon: BrainCircuit,
    title: "GPT-4o Vision Agent",
    description:
      "The AI sees your actual UI, decides what to click, and navigates the most impressive flows — no scripts, no pre-recording, fully autonomous.",
    badge: null,
  },
  {
    icon: BarChart3,
    title: "Conversion Analytics",
    description:
      "Track views, plays, completion rates, CTA clicks, and drop-off points. Know which demos convert and which need improvement.",
    badge: "Marketing",
  },
  {
    icon: Mic,
    title: "AI Voice Agents",
    description:
      "Six built-in OpenAI TTS voices — Nova, Onyx, Alloy, Echo, Fable, Shimmer — each tuned for different demo styles and audiences.",
    badge: null,
  },
  {
    icon: Languages,
    title: "50+ Languages",
    description:
      "Run demos in any language — the agent writes the script and speaks naturally. Sell globally without hiring multilingual reps.",
    badge: null,
  },
  {
    icon: Share2,
    title: "Embed & Share Anywhere",
    description:
      "One-click shareable links. Embed in your website, docs, or email sequences with a single iframe snippet. Auto-tracking included.",
    badge: "Marketing",
  },
  {
    icon: Code2,
    title: "100% Open Source",
    description:
      "Self-host on your infrastructure. No per-seat pricing, no vendor lock-in. You own your data, your demos, and your pipeline.",
    badge: null,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const badgeColors: Record<string, string> = {
  Core: "bg-warm/10 text-warm",
  Sales: "bg-blue-50 text-blue-600",
  Marketing: "bg-purple-50 text-purple-600",
};

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm">
            Built for Sales &amp; Marketing
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
            Every tool your team needs to demo &amp; convert
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Interactive live demos, async video walkthroughs, prospect personalization,
            and conversion analytics — all in one open-source platform.
          </motion.p>
        </div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <motion.div key={f.title} variants={item}
              className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-foreground/20 hover:shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-light text-warm transition-colors group-hover:bg-warm group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                {f.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColors[f.badge] || "bg-stone-100 text-stone-600"}`}>
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
