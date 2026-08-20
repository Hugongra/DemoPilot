"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  Loader2,
  Monitor,
  FileText,
  Volume2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Film,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DemoStatus =
  | "idle"
  | "creating"
  | "navigating"
  | "scripting"
  | "generating_audio"
  | "compositing"
  | "done"
  | "error";

const STATUS_LABELS: Record<DemoStatus, string> = {
  idle: "",
  creating: "Creating demo…",
  navigating: "AI agent is exploring your product…",
  scripting: "Writing voiceover script…",
  generating_audio: "Generating voiceover audio…",
  compositing: "Creating final video…",
  done: "Demo ready!",
  error: "Something went wrong",
};

const STATUS_ICONS: Record<DemoStatus, React.ReactNode> = {
  idle: null,
  creating: <Loader2 className="h-4 w-4 animate-spin" />,
  navigating: <Monitor className="h-4 w-4" />,
  scripting: <FileText className="h-4 w-4" />,
  generating_audio: <Volume2 className="h-4 w-4" />,
  compositing: <Film className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
};

export default function Hero({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [steps, setSteps] = useState<
    Array<{ index: number; description: string; screenshotUrl?: string }>
  >([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [demoId, setDemoId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  function startPolling(demoId: string) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/demos/${demoId}/status`);
        if (!res.ok) return;
        const data = await res.json();

        setStatus(data.status as DemoStatus);
        if (data.steps?.length) setSteps(data.steps);
        if (data.audio_url) setAudioUrl(data.audio_url);
        if (data.error) setErrorMsg(data.error);

        if (data.status === "done" || data.status === "error") {
          stopPolling();
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }

  async function handleGenerate() {
    if (!url.trim()) return;

    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    setStatus("creating");
    setErrorMsg("");
    setSteps([]);
    setAudioUrl("");

    try {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insert demo record
      const { data: demo, error } = await supabase
        .from("demos")
        .insert({
          user_id: user?.id ?? null,
          target_url: url.trim(),
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !demo) throw new Error("Failed to create demo");

      setDemoId(demo.id);
      setStatus("navigating");

      // Start polling for updates
      startPolling(demo.id);

      // Trigger generation (fire-and-forget, the API will update the DB)
      fetch("/api/demos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, targetUrl: url.trim() }),
      }).catch(() => {
        setStatus("error");
        setErrorMsg("Failed to start generation");
        stopPolling();
      });
    } catch {
      setStatus("error");
      setErrorMsg("Failed to create demo request");
    }
  }

  const isWorking = !["idle", "done", "error"].includes(status);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
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
          Paste your product URL, and our AI agent navigates it, records a
          polished walkthrough, and delivers a share-ready video — no scripting
          needed.
        </motion.p>

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
              disabled={isWorking}
              className="h-14 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isWorking}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-warm px-8 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
          >
            {isWorking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                Generate Demo <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Progress tracker */}
        <AnimatePresence>
          {status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mt-8 max-w-lg"
            >
              <div
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium ${
                  status === "done"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-white/80 text-foreground backdrop-blur-sm border border-border"
                }`}
              >
                {STATUS_ICONS[status]}
                {STATUS_LABELS[status]}
              </div>

              {/* Step progress */}
              {steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-xl border border-border bg-white p-4 text-left shadow-sm"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Steps explored
                  </p>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm/10 text-xs font-bold text-warm">
                          {step.index}
                        </span>
                        <span className="text-muted-foreground">
                          {step.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* View, Download & Share demo when done */}
              {status === "done" && demoId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center"
                >
                  <a
                    href={`/demo/${demoId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-warm px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Demo
                  </a>
                  <a
                    href={`/api/demos/${demoId}/asset?file=demo.mp4`}
                    download={`demopilot-${demoId}.mp4`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-warm bg-warm/5 px-6 py-3 text-sm font-semibold text-warm shadow-sm transition-all hover:bg-warm/10"
                  >
                    <Download className="h-4 w-4" />
                    Download MP4
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/demo/${demoId}`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-stone-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        Link copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy share link
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Audio player when done */}
              {status === "done" && audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Voiceover preview
                  </p>
                  <audio controls className="w-full" src={audioUrl}>
                    <track kind="captions" />
                  </audio>
                </motion.div>
              )}

              {/* Error message */}
              {status === "error" && errorMsg && (
                <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
