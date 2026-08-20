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
  Download,
  GripVertical,
  Pencil,
  X,
  Save,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface DemoStep {
  index: number;
  description: string;
  narration: string;
  url: string;
  screenshotUrl: string;
  timestamp: number;
}

interface DemoData {
  id: string;
  status: string;
  target_url: string;
  steps: DemoStep[];
  script: string | null;
  audio_url: string | null;
  video_url: string | null;
  created_at: string;
  error: string | null;
}

export default function DemoViewer() {
  const { id } = useParams<{ id: string }>();
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [editedSteps, setEditedSteps] = useState<DemoStep[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchDemo() {
      try {
        const res = await fetch(`/api/demos/${id}/status`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setDemo(data);
        if (data.script) setEditedScript(data.script);
        if (data.steps) setEditedSteps(data.steps);
      } catch {
        setDemo(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDemo();
  }, [id]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!demo?.video_url) return;
    const videoUrl = `/api/demos/${id}/asset?file=demo.mp4`;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `demopilot-${id}.mp4`;
    a.click();
  }

  // Drag-and-drop reorder
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;

    const newSteps = [...editedSteps];
    const [dragged] = newSteps.splice(dragIdx, 1);
    newSteps.splice(idx, 0, dragged);
    setEditedSteps(newSteps.map((s, i) => ({ ...s, index: i + 1 })));
    setDragIdx(idx);
  }

  function handleDeleteStep(idx: number) {
    const newSteps = editedSteps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, index: i + 1 }));
    setEditedSteps(newSteps);
  }

  async function handleSaveEdits() {
    if (!demo) return;
    setSaving(true);

    try {
      await fetch(`/api/demos/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: editedScript,
          steps: editedSteps,
        }),
      });

      setDemo({
        ...demo,
        script: editedScript,
        steps: editedSteps,
      });
      setEditing(false);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  // Jump video to step timestamp
  function jumpToStep(idx: number) {
    setCurrentStep(idx);
    const step = (editing ? editedSteps : demo?.steps)?.[idx];
    if (videoRef.current && step?.timestamp != null) {
      videoRef.current.currentTime = step.timestamp;
    }
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

  const displaySteps = editing ? editedSteps : demo.steps;
  const step = displaySteps[currentStep];
  const videoUrl = `/api/demos/${id}/asset?file=demo.mp4`;
  const hasVideo = !!demo.video_url;

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
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedScript(demo.script || "");
                    setEditedSteps(demo.steps);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </>
            )}
            <a
              href={demo.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit site
            </a>
            {hasVideo && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg border border-warm bg-warm/5 px-3 py-1.5 text-sm font-medium text-warm transition-colors hover:bg-warm/10"
              >
                <Download className="h-3.5 w-3.5" />
                Download MP4
              </button>
            )}
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
                  <Copy className="h-3.5 w-3.5" /> Share
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Video player - 2/3 width */}
          <div className="lg:col-span-2">
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

              {/* Video or screenshot */}
              <div className="relative aspect-video bg-black">
                {hasVideo ? (
                  <video
                    ref={videoRef}
                    className="h-full w-full"
                    controls
                    muted={muted}
                    src={videoUrl}
                    onTimeUpdate={() => {
                      if (!videoRef.current || !displaySteps.length) return;
                      const time = videoRef.current.currentTime;
                      for (let i = displaySteps.length - 1; i >= 0; i--) {
                        if (time >= (displaySteps[i].timestamp || 0)) {
                          if (i !== currentStep) setCurrentStep(i);
                          break;
                        }
                      }
                    }}
                  >
                    <track kind="captions" />
                  </video>
                ) : step?.screenshotUrl ? (
                  <img
                    src={step.screenshotUrl}
                    alt={step.description}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/50">
                    No media available
                  </div>
                )}
              </div>

              {/* Step navigation bar */}
              <div className="flex items-center gap-3 border-t border-border bg-white px-4 py-2.5">
                <button
                  onClick={() => jumpToStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-stone-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[3.5rem] text-center text-sm font-medium">
                  {currentStep + 1} / {displaySteps.length}
                </span>
                <button
                  onClick={() =>
                    jumpToStep(
                      Math.min(displaySteps.length - 1, currentStep + 1)
                    )
                  }
                  disabled={currentStep === displaySteps.length - 1}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-stone-50 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="flex flex-1 items-center justify-center gap-1">
                  {displaySteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToStep(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStep
                          ? "w-5 bg-warm"
                          : "w-1.5 bg-stone-200 hover:bg-stone-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setMuted(!muted)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-stone-50"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Current step description */}
            {step && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {step.description}
              </p>
            )}
          </div>

          {/* Steps sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Steps list */}
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Steps {editing && "(drag to reorder)"}
              </h3>
              <div className="space-y-1.5">
                {displaySteps.map((s, i) => (
                  <div
                    key={`step-${i}`}
                    draggable={editing}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={() => setDragIdx(null)}
                    onClick={() => jumpToStep(i)}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                      i === currentStep
                        ? "bg-warm/10 text-foreground"
                        : "text-muted-foreground hover:bg-stone-50"
                    } ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    {editing && (
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" />
                    )}
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === currentStep
                          ? "bg-warm text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {s.index}
                    </span>
                    <span className="flex-1 line-clamp-2">
                      {s.description}
                    </span>
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(i);
                        }}
                        className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Script section */}
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Voiceover Script
              </h3>
              {editing ? (
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-border p-3 text-sm leading-relaxed text-foreground/80 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/10"
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/80">
                  {demo.script || "No script generated."}
                </p>
              )}
            </div>

            {/* Audio */}
            {demo.audio_url && (
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audio
                </h3>
                <audio
                  controls
                  className="w-full"
                  src={`/api/demos/${id}/asset?file=voiceover.mp3`}
                >
                  <track kind="captions" />
                </audio>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
