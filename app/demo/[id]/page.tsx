"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Volume2,
} from "lucide-react";

interface DemoStep {
  index: number;
  description: string;
  url: string;
  screenshotUrl: string;
}

interface DemoData {
  id: string;
  status: string;
  target_url: string;
  steps: DemoStep[];
  script: string | null;
  audio_url: string | null;
  created_at: string;
  error: string | null;
}

export default function DemoViewer() {
  const { id } = useParams<{ id: string }>();
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchDemo() {
      try {
        const res = await fetch(`/api/demos/${id}/status`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setDemo(data);
      } catch {
        setDemo(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDemo();
  }, [id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handlePlay() {
    if (!demo?.steps.length) return;

    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setIsPlaying(true);
    setCurrentStep(0);
    audioRef.current?.play();

    const stepDuration = demo.audio_url
      ? ((audioRef.current?.duration || 30) / demo.steps.length) * 1000
      : 4000;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demo.steps.length - 1) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-warm" />
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <h1 className="mb-2 text-2xl font-semibold">Demo not found</h1>
        <p className="text-muted-foreground">
          This demo may have been deleted or the link is invalid.
        </p>
        <a href="/" className="mt-6 text-warm underline">
          Go to DemoPilot
        </a>
      </div>
    );
  }

  if (demo.status !== "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-warm" />
        <h1 className="mb-2 text-2xl font-semibold">Demo is processing…</h1>
        <p className="text-muted-foreground">
          Status: <span className="font-medium capitalize">{demo.status}</span>
        </p>
        {demo.error && (
          <p className="mt-2 text-sm text-red-600">{demo.error}</p>
        )}
      </div>
    );
  }

  const step = demo.steps[currentStep];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-tight"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            DemoPilot
          </a>
          <div className="flex items-center gap-3">
            <a
              href={demo.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit site
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-white transition-all hover:opacity-80"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Share link
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Product URL badge */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-muted-foreground">
            Demo of{" "}
            <span className="font-medium text-foreground">
              {demo.target_url}
            </span>
          </span>
        </div>

        {/* Main viewer */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-stone-50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 rounded-md bg-white px-3 py-1 text-center text-xs text-muted-foreground">
              {step?.url || demo.target_url}
            </div>
          </div>

          {/* Screenshot */}
          <div className="relative aspect-video bg-stone-100">
            {step?.screenshotUrl ? (
              <img
                src={step.screenshotUrl}
                alt={step.description}
                className="h-full w-full object-cover object-top transition-opacity duration-500"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No screenshot available
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="flex items-center gap-4 border-t border-border bg-white px-5 py-3">
            <button
              onClick={handlePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-warm text-white transition-all hover:opacity-80"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>

            {/* Step navigation */}
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[4rem] text-center text-sm font-medium">
              {currentStep + 1} / {demo.steps.length}
            </span>
            <button
              onClick={() =>
                setCurrentStep(
                  Math.min(demo.steps.length - 1, currentStep + 1)
                )
              }
              disabled={currentStep === demo.steps.length - 1}
              className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Step progress dots */}
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {demo.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStep
                      ? "w-6 bg-warm"
                      : i < currentStep
                        ? "w-2 bg-warm/40"
                        : "w-2 bg-stone-200"
                  }`}
                />
              ))}
            </div>

            {demo.audio_url && (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Step description */}
        {step && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        )}

        {/* Script section */}
        {demo.script && (
          <div className="mt-8 rounded-xl border border-border bg-white p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Voiceover Script
            </h3>
            <p className="leading-relaxed text-foreground/80">{demo.script}</p>
          </div>
        )}

        {/* Audio player */}
        {demo.audio_url && (
          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            <audio
              ref={audioRef}
              controls
              className="w-full"
              src={demo.audio_url}
              onEnded={() => setIsPlaying(false)}
            >
              <track kind="captions" />
            </audio>
          </div>
        )}
      </main>
    </div>
  );
}
