"use client";

import { motion } from "framer-motion";
import {
  Globe,
  BrainCircuit,
  Film,
  Captions,
  Code2,
  Share2,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Paste Any URL",
    description:
      "Drop your product link. The AI agent loads it in a real Chromium browser — no SDK, no scripts, no setup.",
  },
  {
    icon: BrainCircuit,
    title: "GPT-4o Vision Agent",
    description:
      "An AI agent with vision sees your UI, decides what to click, and navigates the most impressive product flows.",
  },
  {
    icon: Film,
    title: "Real Video Recording",
    description:
      "Playwright records the entire browser session with animated cursor movements, then FFmpeg composites the final MP4.",
  },
  {
    icon: Captions,
    title: "AI Voiceover",
    description:
      "GPT-4o writes a professional demo script from the navigation, then OpenAI TTS generates natural voiceover audio.",
  },
  {
    icon: Code2,
    title: "100% Open Source",
    description:
      "Self-host the entire stack. Next.js + Supabase + Playwright + OpenAI. Fork it, extend it, make it yours.",
  },
  {
    icon: Share2,
    title: "Share & Export",
    description:
      "Get a shareable link, edit the script, reorder steps, or download the MP4. Full control over your demos.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm"
          >
            Open-source AI demo platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl"
          >
            Everything you need to ship demos fast
          </motion.h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group rounded-2xl border border-border bg-white p-8 transition-all hover:border-foreground/20 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-warm-light text-warm transition-colors group-hover:bg-warm group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
