"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react";

export default function Hero({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [url, setUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  function handleGenerate() {
    if (!url.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onOpenAuth();
    }, 2000);
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
      {/* Warm gradient background */}
      <div className="pointer-events-none absolute inset-0 warm-gradient-bg opacity-60" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4 text-warm" />
          AI-powered product demos in minutes
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl lg:text-7xl"
        >
          Show your product where you{" "}
          <span className="warm-gradient-text">couldn&apos;t before.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Paste your product URL, and our AI agent navigates it, records a polished
          walkthrough, and delivers a share-ready video — no scripting needed.
        </motion.p>

        {/* URL input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-product.com"
              className="h-14 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-warm px-8 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
          >
            {generating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating…
              </>
            ) : (
              <>
                Generate Demo <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-warm" /> Under 5 min avg
          </span>
          <span className="h-4 w-px bg-border" />
          <span>No code required</span>
          <span className="h-4 w-px bg-border" />
          <span>2,400+ demos created</span>
        </motion.div>
      </div>
    </section>
  );
}
