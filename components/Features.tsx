"use client";

import { motion } from "framer-motion";
import {
  Globe,
  BrainCircuit,
  Film,
  Captions,
  Palette,
  Share2,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Paste Any URL",
    description:
      "Just drop your product link. Our agent loads it in a real browser — no SDK integration, no scripts.",
  },
  {
    icon: BrainCircuit,
    title: "AI Agent Navigation",
    description:
      "An intelligent agent clicks through key flows, understands your UI, and picks the best demo path automatically.",
  },
  {
    icon: Film,
    title: "HD Video Recording",
    description:
      "Every interaction is recorded at 1080p with smooth cursor animations and polished transitions.",
  },
  {
    icon: Captions,
    title: "Auto Voiceover & Captions",
    description:
      "AI-generated narration and captions explain each step in a natural, professional tone.",
  },
  {
    icon: Palette,
    title: "Brand Customization",
    description:
      "Add your logo, brand colors, intro slides, and custom CTAs. Make every demo unmistakably yours.",
  },
  {
    icon: Share2,
    title: "One-Click Sharing",
    description:
      "Get a shareable link, embed code, or download the MP4. Push directly to your docs or sales deck.",
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
            What a DemoPilot agent can do for you
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
