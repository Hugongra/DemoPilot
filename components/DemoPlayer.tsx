"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Maximize2, Volume2 } from "lucide-react";

const demoSteps = [
  {
    title: "Landing Page",
    description: "Agent opens the product URL and identifies the main entry point",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-stone-200 px-6 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff6058]" />
            <div className="h-3 w-3 rounded-full bg-[#ffc130]" />
            <div className="h-3 w-3 rounded-full bg-[#23ffa5]" />
          </div>
          <div className="flex-1 rounded-md bg-stone-100 px-3 py-1 text-xs text-stone-500">
            https://acme-saas.com
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
          <div className="h-6 w-32 rounded bg-stone-200" />
          <div className="h-4 w-48 rounded bg-stone-100" />
          <div className="mt-2 h-10 w-36 rounded-lg bg-stone-900" />
        </div>
      </div>
    ),
  },
  {
    title: "Sign-Up Flow",
    description: "Agent navigates the registration form and fills in test credentials",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-stone-200 px-6 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff6058]" />
            <div className="h-3 w-3 rounded-full bg-[#ffc130]" />
            <div className="h-3 w-3 rounded-full bg-[#23ffa5]" />
          </div>
          <div className="flex-1 rounded-md bg-stone-100 px-3 py-1 text-xs text-stone-500">
            https://acme-saas.com/signup
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
          <div className="h-5 w-28 rounded bg-stone-200" />
          <div className="h-10 w-56 rounded-lg border border-stone-200 bg-stone-50" />
          <div className="h-10 w-56 rounded-lg border border-stone-200 bg-stone-50" />
          <div className="mt-1 h-10 w-56 rounded-lg bg-stone-900" />
        </div>
      </div>
    ),
  },
  {
    title: "Dashboard Tour",
    description: "Agent explores the main dashboard and highlights key metrics",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-stone-200 px-6 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff6058]" />
            <div className="h-3 w-3 rounded-full bg-[#ffc130]" />
            <div className="h-3 w-3 rounded-full bg-[#23ffa5]" />
          </div>
          <div className="flex-1 rounded-md bg-stone-100 px-3 py-1 text-xs text-stone-500">
            https://acme-saas.com/dashboard
          </div>
        </div>
        <div className="flex flex-1 gap-4 p-4">
          <div className="w-16 shrink-0 space-y-3 rounded-lg bg-stone-50 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-full rounded bg-stone-200" />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-stone-50 p-2">
                  <div className="h-2 w-8 rounded bg-stone-200" />
                  <div className="mt-2 h-4 w-12 rounded bg-[#ff6058]/30" />
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-lg bg-stone-50" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Feature Walkthrough",
    description: "Agent demonstrates the core feature with click-by-click recording",
    mockContent: (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-stone-200 px-6 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff6058]" />
            <div className="h-3 w-3 rounded-full bg-[#ffc130]" />
            <div className="h-3 w-3 rounded-full bg-[#23ffa5]" />
          </div>
          <div className="flex-1 rounded-md bg-stone-100 px-3 py-1 text-xs text-stone-500">
            https://acme-saas.com/projects/new
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
          <div className="w-full max-w-xs space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-6">
            <div className="h-4 w-24 rounded bg-stone-200" />
            <div className="h-8 w-full rounded-lg border border-stone-200 bg-white" />
            <div className="h-4 w-20 rounded bg-stone-200" />
            <div className="h-8 w-full rounded-lg border border-stone-200 bg-white" />
            <div className="flex justify-end pt-2">
              <div className="h-8 w-20 rounded-lg bg-[#23ffa5]" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function DemoPlayer() {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = demoSteps[activeStep];

  function next() {
    setActiveStep((s) => (s + 1) % demoSteps.length);
  }

  function prev() {
    setActiveStep((s) => (s - 1 + demoSteps.length) % demoSteps.length);
  }

  return (
    <section id="demo" className="relative py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm"
          >
            See It in Action
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl"
          >
            Watch DemoPilot create a demo
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        >
          {/* Video area */}
          <div className="relative aspect-video bg-stone-50 transition-colors duration-500">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                {current.mockContent}
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-4 left-4 rounded-lg bg-foreground/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              Step {activeStep + 1} of {demoSteps.length}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{current.title}</h3>
              <p className="text-sm text-muted-foreground">{current.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white transition-colors hover:bg-stone-50"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm text-white transition-colors hover:opacity-90"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white transition-colors hover:bg-stone-50"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <div className="mx-2 h-6 w-px bg-border" />
              <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white transition-colors hover:bg-stone-50">
                <Volume2 className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white transition-colors hover:bg-stone-50">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Step tabs */}
          <div className="flex border-t border-border">
            {demoSteps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveStep(i)}
                className={`flex-1 border-r border-border last:border-r-0 px-4 py-3 text-left text-xs font-medium transition-all ${
                  i === activeStep
                    ? "bg-warm-light text-warm"
                    : "text-muted-foreground hover:bg-stone-50 hover:text-foreground"
                }`}
              >
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
