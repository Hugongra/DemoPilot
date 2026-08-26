"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Plus, Globe, Loader2, Trash2, ExternalLink, Download, Copy, Check,
  Clock, CheckCircle2, AlertCircle, LogOut, Film, ArrowRight,
  Languages, User2, ChevronDown, Eye, BarChart3, BookOpen, Bot,
  MonitorPlay, TrendingUp, MousePointerClick, FileText, Link2,
  Shield, MessageSquare, Volume2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Tab = "analytics" | "sessions" | "knowledge" | "agents";

interface Demo {
  id: string;
  target_url: string;
  title: string | null;
  status: string;
  language: string | null;
  steps: Array<{ index: number; description: string }>;
  script: string | null;
  video_url: string | null;
  audio_url: string | null;
  error: string | null;
  view_count: number;
  created_at: string;
}

interface DemoWithAnalytics extends Demo {
  analytics: {
    views: number;
    plays: number;
    completes: number;
    ctaClicks: number;
    avgDuration: number;
    completionRate: number;
  };
}

interface KnowledgeItem {
  id: string;
  source_type: string;
  title: string;
  content: string;
  source_url: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-stone-100 text-stone-600", icon: <Clock className="h-3 w-3" /> },
  navigating: { label: "Navigating", color: "bg-blue-50 text-blue-600", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  scripting: { label: "Scripting", color: "bg-purple-50 text-purple-600", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  generating_audio: { label: "Audio", color: "bg-amber-50 text-amber-600", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  compositing: { label: "Compositing", color: "bg-indigo-50 text-indigo-600", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  done: { label: "Done", color: "bg-emerald-50 text-emerald-600", icon: <CheckCircle2 className="h-3 w-3" /> },
  error: { label: "Error", color: "bg-red-50 text-red-600", icon: <AlertCircle className="h-3 w-3" /> },
};

const POPULAR_LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }, { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese" },
  { code: "it", name: "Italian" }, { code: "nl", name: "Dutch" },
  { code: "ar", name: "Arabic" }, { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" }, { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" }, { code: "sv", name: "Swedish" },
];

const AGENTS: Array<{ name: string; voice: string; lang: string; description: string }> = [
  { name: "Nova", voice: "nova", lang: "en, es, fr, pt, ja, ko, zh, hi", description: "Warm, engaging female voice. Great for product walkthroughs and onboarding flows." },
  { name: "Onyx", voice: "onyx", lang: "en, de, ar", description: "Deep, authoritative male voice. Ideal for enterprise demos and technical presentations." },
  { name: "Alloy", voice: "alloy", lang: "en, es, fr, de, it, pt", description: "Neutral, versatile voice. Works well across all demo types and industries." },
  { name: "Echo", voice: "echo", lang: "en, es, fr, de", description: "Clear, professional male voice. Best for concise feature highlights." },
  { name: "Fable", voice: "fable", lang: "en, es, fr, de, it", description: "Expressive, storytelling voice. Perfect for narrative-driven product stories." },
  { name: "Shimmer", voice: "shimmer", lang: "en, es, fr, de, it, pt, ja", description: "Bright, energetic female voice. Suited for marketing demos and social content." },
];

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "sessions", label: "Sessions", icon: <MonitorPlay className="h-4 w-4" /> },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen className="h-4 w-4" /> },
  { id: "agents", label: "Agents", icon: <Bot className="h-4 w-4" /> },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  // Sessions state
  const [demos, setDemos] = useState<Demo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [prospectName, setProspectName] = useState("");
  const [prospectRole, setProspectRole] = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<DemoWithAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Knowledge state
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [kbType, setKbType] = useState("document");
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState(false);

  const fetchDemos = useCallback(async () => {
    try {
      const res = await fetch("/api/demos/list");
      if (res.status === 401) return;
      const data = await res.json();
      setDemos(data.demos || []);
    } catch { /* ignore */ }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/demos/list");
      if (!res.ok) return;
      const { demos: demoList } = await res.json();
      const withAnalytics = await Promise.all(
        (demoList || []).filter((d: Demo) => d.status === "done").map(async (demo: Demo) => {
          try {
            const r = await fetch(`/api/demos/${demo.id}/analytics`);
            const analytics = await r.json();
            return { ...demo, analytics } as DemoWithAnalytics;
          } catch {
            return { ...demo, analytics: { views: 0, plays: 0, completes: 0, ctaClicks: 0, avgDuration: 0, completionRate: 0 } } as DemoWithAnalytics;
          }
        })
      );
      setAnalyticsData(withAnalytics);
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  }, []);

  const fetchKnowledge = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      const { items } = await res.json();
      setKnowledge(items || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push("/"); return; }
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/"); return; }
      setUser(u);
      setLoading(false);
    });
    fetchDemos();
    fetchKnowledge();
    const interval = setInterval(fetchDemos, 5000);
    return () => clearInterval(interval);
  }, [router, fetchDemos, fetchKnowledge]);

  useEffect(() => {
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  async function handleCreate() {
    if (!newUrl.trim()) return;
    setCreating(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: demo, error } = await supabase.from("demos").insert({
        user_id: user?.id, target_url: newUrl.trim(), status: "pending", language: newLang,
        prospect_name: prospectName.trim() || null, prospect_role: prospectRole.trim() || null,
        prospect_company: prospectCompany.trim() || null,
      }).select("id").single();
      if (error || !demo) throw new Error("Failed to create");
      setNewUrl(""); setNewLang("en"); setProspectName(""); setProspectRole("");
      setProspectCompany(""); setShowCreate(false); setShowPersonalize(false);
      fetchDemos();
      fetch("/api/demos/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demo.id, targetUrl: newUrl.trim() }),
      });
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/demos/${id}/delete`, { method: "DELETE" });
      setDemos((prev) => prev.filter((d) => d.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  function handleCopyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/demo/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleAddKnowledge() {
    if (!kbTitle.trim() || !kbContent.trim()) return;
    const res = await fetch("/api/knowledge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_type: kbType, title: kbTitle.trim(), content: kbContent.trim() }),
    });
    const { item } = await res.json();
    if (item) { setKnowledge((prev) => [item, ...prev]); setKbTitle(""); setKbContent(""); setShowAddKnowledge(false); }
  }

  async function handleScrapeUrl() {
    if (!kbUrl.trim()) return;
    setScrapingUrl(true);
    try {
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: kbUrl.trim() }),
      });
      const { item } = await res.json();
      if (item) { setKnowledge((prev) => [item, ...prev]); setKbUrl(""); }
    } catch { /* ignore */ }
    finally { setScrapingUrl(false); }
  }

  async function handleDeleteKnowledge(id: string) {
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    setKnowledge((prev) => prev.filter((k) => k.id !== id));
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

  const totalViews = analyticsData.reduce((s, d) => s + (d.analytics?.views || 0), 0);
  const totalPlays = analyticsData.reduce((s, d) => s + (d.analytics?.plays || 0), 0);
  const totalCompletes = analyticsData.reduce((s, d) => s + (d.analytics?.completes || 0), 0);
  const totalCtaClicks = analyticsData.reduce((s, d) => s + (d.analytics?.ctaClicks || 0), 0);
  const avgCompletionRate = analyticsData.length > 0
    ? analyticsData.reduce((s, d) => s + (d.analytics?.completionRate || 0), 0) / analyticsData.length : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top nav */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            DemoPilot
          </a>
          <div className="flex items-center gap-3">
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
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-stone-50">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Tab bar */}
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-white p-1">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-foreground text-white shadow-sm"
                  : "text-muted-foreground hover:bg-stone-50 hover:text-foreground"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="mt-1 text-sm text-muted-foreground">Conversion rates, views, and engagement across all demos</p>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-warm" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {[
                    { label: "Views", value: totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
                    { label: "Plays", value: totalPlays, icon: Play, color: "text-purple-600 bg-purple-50" },
                    { label: "Completions", value: totalCompletes, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                    { label: "CTA Clicks", value: totalCtaClicks, icon: MousePointerClick, color: "text-warm bg-warm-light" },
                    { label: "Avg Completion", value: `${Math.round(avgCompletionRate)}%`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
                      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-white">
                  <div className="border-b border-border px-5 py-3">
                    <h3 className="text-sm font-semibold">Per-Demo Breakdown</h3>
                  </div>
                  {analyticsData.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-muted-foreground">No completed demos with analytics yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="px-5 py-3 text-left font-medium">Demo</th>
                            <th className="px-3 py-3 text-center font-medium">Views</th>
                            <th className="px-3 py-3 text-center font-medium">Plays</th>
                            <th className="px-3 py-3 text-center font-medium">Completions</th>
                            <th className="px-3 py-3 text-center font-medium">CTA Clicks</th>
                            <th className="px-3 py-3 text-center font-medium">Avg Duration</th>
                            <th className="px-3 py-3 text-center font-medium">Completion %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.map((demo) => (
                            <tr key={demo.id} className="border-b border-border/50 hover:bg-stone-50">
                              <td className="px-5 py-3">
                                <a href={`/demo/${demo.id}`} className="font-medium text-foreground hover:underline">
                                  {demo.title || demo.target_url}
                                </a>
                                <p className="mt-0.5 text-xs text-muted-foreground">{new Date(demo.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-3 py-3 text-center">{demo.analytics?.views || 0}</td>
                              <td className="px-3 py-3 text-center">{demo.analytics?.plays || 0}</td>
                              <td className="px-3 py-3 text-center">{demo.analytics?.completes || 0}</td>
                              <td className="px-3 py-3 text-center">{demo.analytics?.ctaClicks || 0}</td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{demo.analytics?.avgDuration || 0}s</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  (demo.analytics?.completionRate || 0) > 50 ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
                                }`}>{demo.analytics?.completionRate || 0}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Sessions</h2>
                <p className="mt-1 text-sm text-muted-foreground">All your product demo recordings</p>
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80">
                <Plus className="h-4 w-4" /> New Demo
              </button>
            </div>

            {showCreate && (
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-medium">Create a new demo</h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://your-product.com"
                      className="h-12 w-full rounded-lg border border-border bg-white pl-11 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
                  </div>
                  <div className="relative">
                    <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select value={newLang} onChange={(e) => setNewLang(e.target.value)}
                      className="h-12 appearance-none rounded-lg border border-border bg-white pl-9 pr-8 text-sm focus:border-foreground focus:outline-none">
                      {POPULAR_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <button onClick={handleCreate} disabled={creating || !newUrl.trim()}
                    className="flex h-12 items-center gap-2 rounded-lg bg-warm px-6 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Generate
                  </button>
                  <button onClick={() => { setShowCreate(false); setNewUrl(""); setShowPersonalize(false); }}
                    className="h-12 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-stone-50">Cancel</button>
                </div>
                <button onClick={() => setShowPersonalize(!showPersonalize)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <User2 className="h-3.5 w-3.5" /> {showPersonalize ? "Hide personalization" : "Personalize for a prospect"}
                </button>
                {showPersonalize && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="Prospect name" className="h-10 rounded-lg border border-border px-3 text-sm" />
                    <input value={prospectRole} onChange={(e) => setProspectRole(e.target.value)} placeholder="Role (e.g., CTO)" className="h-10 rounded-lg border border-border px-3 text-sm" />
                    <input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} placeholder="Company name" className="h-10 rounded-lg border border-border px-3 text-sm" />
                  </div>
                )}
              </div>
            )}

            {demos.length === 0 && !showCreate ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                  <Film className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">No demos yet</h3>
                <p className="mb-6 text-sm text-muted-foreground">Create your first AI-powered product demo</p>
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80">
                  <Plus className="h-4 w-4" /> New Demo
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Demo</th>
                      <th className="px-3 py-3 text-center font-medium">Status</th>
                      <th className="px-3 py-3 text-center font-medium">Language</th>
                      <th className="px-3 py-3 text-center font-medium">Steps</th>
                      <th className="px-3 py-3 text-center font-medium">Views</th>
                      <th className="px-3 py-3 text-center font-medium">Created</th>
                      <th className="px-3 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((demo) => {
                      const cfg = STATUS_CONFIG[demo.status] || STATUS_CONFIG.pending;
                      const stepCount = Array.isArray(demo.steps) ? demo.steps.length : 0;
                      return (
                        <tr key={demo.id} className="border-b border-border/50 hover:bg-stone-50">
                          <td className="px-5 py-3">
                            <p className="font-medium truncate max-w-[250px]">{demo.title || demo.target_url}</p>
                            {demo.error && <p className="mt-0.5 truncate text-xs text-red-500">{demo.error}</p>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase">{demo.language || "en"}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">{stepCount}</td>
                          <td className="px-3 py-3 text-center">
                            {demo.view_count > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />{demo.view_count}</span>}
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                            {new Date(demo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {demo.status === "done" && (
                                <>
                                  <a href={`/demo/${demo.id}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-stone-100 hover:text-foreground" title="View">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                  <a href={`/api/demos/${demo.id}/asset?file=demo.mp4`} download className="rounded-md p-1.5 text-muted-foreground hover:bg-stone-100 hover:text-foreground" title="Download">
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                  <button onClick={() => handleCopyLink(demo.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-stone-100 hover:text-foreground" title="Copy link">
                                    {copiedId === demo.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDelete(demo.id)} disabled={deletingId === demo.id}
                                className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Delete">
                                {deletingId === demo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── KNOWLEDGE TAB ── */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Knowledge Base</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload PDFs, docs, or URLs to give your agents product context</p>
              </div>
              <button onClick={() => setShowAddKnowledge(!showAddKnowledge)}
                className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-80">
                <Plus className="h-4 w-4" /> Add Knowledge
              </button>
            </div>

            {/* URL scraper */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold">Import from URL</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={kbUrl} onChange={(e) => setKbUrl(e.target.value)}
                    placeholder="https://docs.your-product.com/getting-started"
                    onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                    className="h-11 w-full rounded-lg border border-border bg-white pl-11 pr-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                </div>
                <button onClick={handleScrapeUrl} disabled={!kbUrl.trim() || scrapingUrl}
                  className="flex items-center gap-2 rounded-lg bg-warm px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {scrapingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Scrape
                </button>
              </div>
            </div>

            {showAddKnowledge && (
              <div className="rounded-xl border border-border bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold">Add manually</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select value={kbType} onChange={(e) => setKbType(e.target.value)}
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-foreground focus:outline-none">
                    <option value="document">Document</option>
                    <option value="demo_script">Demo Script</option>
                    <option value="faq">FAQ</option>
                    <option value="objection">Objection Playbook</option>
                  </select>
                  <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} placeholder="Title"
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:border-foreground focus:outline-none" />
                </div>
                <textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)}
                  placeholder="Paste your docs, scripts, FAQs, etc."
                  rows={6} className="w-full rounded-lg border border-border bg-white p-3 text-sm focus:border-foreground focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={handleAddKnowledge}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-80">Save</button>
                  <button onClick={() => setShowAddKnowledge(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-stone-50">Cancel</button>
                </div>
              </div>
            )}

            {knowledge.length === 0 && !showAddKnowledge ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                  <BookOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">No knowledge items yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">Add docs, scripts, or scrape URLs to train your agents</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white divide-y divide-border/50">
                {knowledge.map((item) => {
                  const typeIcons: Record<string, React.ReactNode> = {
                    document: <FileText className="h-4 w-4" />, url: <Globe className="h-4 w-4" />,
                    demo_script: <MessageSquare className="h-4 w-4" />, faq: <BookOpen className="h-4 w-4" />,
                    objection: <Shield className="h-4 w-4" />,
                  };
                  return (
                    <div key={item.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-muted-foreground">{typeIcons[item.source_type] || <FileText className="h-4 w-4" />}</span>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.source_type} &middot; {item.content.length.toLocaleString()} chars
                            {item.source_url && <> &middot; <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-warm hover:underline">{new URL(item.source_url).hostname}</a></>}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteKnowledge(item.id)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Agents</h2>
              <p className="mt-1 text-sm text-muted-foreground">AI voices available for your product demos</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AGENTS.map((agent) => (
                <div key={agent.voice} className="rounded-xl border border-border bg-white p-5 transition-all hover:shadow-md">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-light">
                      <Volume2 className="h-5 w-5 text-warm" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{agent.voice}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{agent.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.lang.split(", ").map((l) => (
                      <span key={l} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-stone-600">{l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-stone-50 p-5">
              <h3 className="mb-1 text-sm font-semibold">Custom agents coming soon</h3>
              <p className="text-xs text-muted-foreground">
                Fine-tune agent personalities, upload custom voice models, and configure per-product agent behavior.
                All voices are powered by OpenAI TTS and support 50+ languages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
