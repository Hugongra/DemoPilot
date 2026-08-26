"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Play, Loader2, ArrowLeft, Languages, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }, { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" }, { code: "hi", name: "Hindi" },
];

export default function NewLiveDemo() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [viewerName, setViewerName] = useState("");
  const [viewerRole, setViewerRole] = useState("");
  const [viewerCompany, setViewerCompany] = useState("");
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (!targetUrl.trim()) return;
    setStarting(true);

    try {
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: targetUrl.trim(),
          language,
          viewer_name: viewerName.trim() || null,
          viewer_role: viewerRole.trim() || null,
          viewer_company: viewerCompany.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/live/${data.sessionId}`);
      }
    } catch { /* ignore */ }
    finally { setStarting(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-md">
        <a href="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to DemoPilot
        </a>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live Demo</h1>
              <p className="text-xs text-muted-foreground">Interactive AI-guided session</p>
            </div>
          </div>

          <p className="mb-6 text-center text-sm text-muted-foreground">
            An AI agent will navigate the product in real-time while you watch and ask questions via chat.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Product URL</label>
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-product.com"
                className="h-12 w-full rounded-lg border border-border px-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Language</label>
              <div className="relative">
                <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-white pl-9 pr-8 text-sm focus:border-foreground focus:outline-none">
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-stone-50 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Personalization (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <input value={viewerName} onChange={(e) => setViewerName(e.target.value)}
                  placeholder="Your name"
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm" />
                <input value={viewerRole} onChange={(e) => setViewerRole(e.target.value)}
                  placeholder="Your role"
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm" />
              </div>
              <input value={viewerCompany} onChange={(e) => setViewerCompany(e.target.value)}
                placeholder="Company name"
                className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm" />
            </div>

            <button onClick={handleStart} disabled={!targetUrl.trim() || starting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-white transition-all hover:opacity-80 disabled:opacity-50">
              {starting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Launching...</>
              ) : (
                <><Play className="h-4 w-4" /> Start Live Demo</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
