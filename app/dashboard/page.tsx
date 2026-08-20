"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Plus,
  Globe,
  Loader2,
  Trash2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Film,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Demo {
  id: string;
  target_url: string;
  status: string;
  steps: Array<{ index: number; description: string }>;
  script: string | null;
  audio_url: string | null;
  video_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-stone-100 text-stone-600", icon: <Clock className="h-3.5 w-3.5" /> },
  navigating: { label: "Navigating", color: "bg-blue-50 text-blue-600", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  scripting: { label: "Scripting", color: "bg-purple-50 text-purple-600", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  generating_audio: { label: "Audio", color: "bg-amber-50 text-amber-600", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  compositing: { label: "Rendering", color: "bg-indigo-50 text-indigo-600", icon: <Film className="h-3.5 w-3.5 animate-pulse" /> },
  done: { label: "Ready", color: "bg-emerald-50 text-emerald-600", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  error: { label: "Error", color: "bg-red-50 text-red-600", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDemos = useCallback(async () => {
    try {
      const res = await fetch("/api/demos/list");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setDemos(data.demos || []);
    } catch {
      // Ignore
    }
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.push("/");
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      setLoading(false);
    });

    fetchDemos();

    // Poll for status updates every 5s
    const interval = setInterval(fetchDemos, 5000);
    return () => clearInterval(interval);
  }, [router, fetchDemos]);

  async function handleCreate() {
    if (!newUrl.trim()) return;
    setCreating(true);

    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: demo, error } = await supabase
        .from("demos")
        .insert({
          user_id: user?.id,
          target_url: newUrl.trim(),
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !demo) throw new Error("Failed to create");

      setNewUrl("");
      setShowCreate(false);
      fetchDemos();

      // Trigger generation
      fetch("/api/demos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, targetUrl: newUrl.trim() }),
      });
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/demos/${id}/delete`, { method: "DELETE" });
      setDemos((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // Ignore
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/demo/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-warm" />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            DemoPilot
          </a>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warm text-xs font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your Demos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create AI-powered product demos from any URL
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            New Demo
          </button>
        </div>

        {/* Create demo form */}
        {showCreate && (
          <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-medium">Create a new demo</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://your-product.com"
                  className="h-12 w-full rounded-lg border border-border bg-white pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !newUrl.trim()}
                className="flex h-12 items-center gap-2 rounded-lg bg-warm px-6 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Generate
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewUrl(""); }}
                className="h-12 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Demos grid */}
        {demos.length === 0 && !showCreate ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
              <Film className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No demos yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first AI-powered product demo
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80"
            >
              <Plus className="h-4 w-4" />
              New Demo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demos.map((demo) => {
              const statusCfg = STATUS_CONFIG[demo.status] || STATUS_CONFIG.pending;
              const isProcessing = !["done", "error"].includes(demo.status);
              const stepCount = Array.isArray(demo.steps) ? demo.steps.length : 0;

              return (
                <div
                  key={demo.id}
                  className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Preview */}
                  <div className="relative aspect-video bg-stone-100">
                    {demo.status === "done" ? (
                      <a href={`/demo/${demo.id}`} className="block h-full w-full">
                        <img
                          src={`/api/demos/${demo.id}/asset?file=step-1.jpg`}
                          alt={demo.target_url}
                          className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all group-hover:opacity-100">
                            <Play className="h-5 w-5 ml-0.5 text-foreground" />
                          </div>
                        </div>
                      </a>
                    ) : isProcessing ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-warm" />
                        <span className="text-xs text-muted-foreground">{statusCfg.label}…</span>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stepCount} steps
                      </span>
                    </div>

                    <p className="mb-1 truncate text-sm font-medium">{demo.target_url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(demo.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {demo.error && (
                      <p className="mt-2 truncate text-xs text-red-500">{demo.error}</p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
                      {demo.status === "done" && (
                        <>
                          <a
                            href={`/demo/${demo.id}`}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                          <a
                            href={`/api/demos/${demo.id}/asset?file=demo.mp4`}
                            download
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
                          >
                            <Download className="h-3 w-3" />
                            MP4
                          </a>
                          <button
                            onClick={() => handleCopyLink(demo.id)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
                          >
                            {copiedId === demo.id ? (
                              <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Share</>
                            )}
                          </button>
                        </>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(demo.id)}
                        disabled={deletingId === demo.id}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === demo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
