"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Plus, Globe, Loader2, Trash2, ExternalLink, Download, Copy, Check,
  Clock, CheckCircle2, AlertCircle, LogOut, Film, ArrowRight,
  Languages, User2, ChevronDown, Eye, BarChart3, BookOpen, Bot,
  TrendingUp, MousePointerClick, FileText, Link2,
  Shield, MessageSquare, Volume2, Upload, Save, Signal,
  Settings, Columns3, Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Tab = "analytics" | "sessions" | "knowledge" | "agents" | "integrations" | "ab_testing" | "routing";

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
  prospect_name?: string | null;
  prospect_role?: string | null;
  prospect_company?: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  pending: { label: "Queued", color: "text-stone-600", dotColor: "bg-stone-400" },
  navigating: { label: "In progress", color: "text-blue-600", dotColor: "bg-blue-500" },
  scripting: { label: "In progress", color: "text-blue-600", dotColor: "bg-blue-500" },
  generating_audio: { label: "In progress", color: "text-amber-600", dotColor: "bg-amber-500" },
  compositing: { label: "In progress", color: "text-indigo-600", dotColor: "bg-indigo-500" },
  done: { label: "Completed", color: "text-stone-600", dotColor: "bg-emerald-500" },
  error: { label: "Error", color: "text-red-600", dotColor: "bg-red-500" },
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

const USE_CASE_BADGES: Record<string, { label: string; color: string }> = {
  marketing: { label: "Marketing", color: "bg-rose-50 text-rose-600 border-rose-200" },
  sales: { label: "Sales", color: "bg-red-50 text-red-600 border-red-200" },
  product: { label: "Product", color: "bg-purple-50 text-purple-600 border-purple-200" },
  success: { label: "Success", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  support: { label: "Support", color: "bg-blue-50 text-blue-600 border-blue-200" },
};

function getUseCase(demo: Demo): { label: string; color: string } {
  const url = demo.target_url.toLowerCase();
  if (url.includes("blog") || url.includes("marketing") || url.includes("landing")) return USE_CASE_BADGES.marketing;
  if (url.includes("sales") || url.includes("pricing") || url.includes("enterprise")) return USE_CASE_BADGES.sales;
  if (url.includes("docs") || url.includes("api") || url.includes("developer")) return USE_CASE_BADGES.product;
  if (url.includes("support") || url.includes("help")) return USE_CASE_BADGES.support;
  const types = Object.values(USE_CASE_BADGES);
  const hash = demo.id.charCodeAt(0) % types.length;
  return types[hash];
}

function getAgentName(demo: Demo): string {
  const title = demo.title || demo.target_url;
  if (title.includes("Landing") || title.includes("landing")) return "Landing page";
  if (title.includes("Blog") || title.includes("blog")) return "Blog";
  if (title.includes("Pricing") || title.includes("pricing")) return "Copilot US";
  const domain = (() => { try { return new URL(demo.target_url).hostname.replace("www.", "").split(".")[0]; } catch { return "Demo"; } })();
  return domain.charAt(0).toUpperCase() + domain.slice(1) + " agent";
}

function getVisitorInfo(demo: Demo): { name: string; email: string } {
  if (demo.prospect_name) {
    const emailDomain = (() => { try { return new URL(demo.target_url).hostname.replace("www.", ""); } catch { return "company.com"; } })();
    return { name: demo.prospect_name, email: `${demo.prospect_name.toLowerCase().replace(/\s/g, ".")}@${emailDomain}` };
  }
  const domain = (() => { try { return new URL(demo.target_url).hostname.replace("www.", ""); } catch { return "demo.com"; } })();
  return { name: domain, email: demo.target_url };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getDuration(demo: Demo): string {
  const steps = Array.isArray(demo.steps) ? demo.steps.length : 0;
  const seconds = steps * 8 + Math.floor(Math.random() * 30);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "sessions", label: "Sessions", icon: <Play className="h-4 w-4" /> },
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Custom agent state
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentVoice, setAgentVoice] = useState("nova");
  const [agentLang, setAgentLang] = useState("en");
  const [agentPersonality, setAgentPersonality] = useState("");
  const [customAgents, setCustomAgents] = useState<Array<{ name: string; voice: string; lang: string; personality: string }>>([]);

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const TEXT_EXTS = [".txt", ".md", ".csv", ".json", ".html", ".htm", ".xml", ".log", ".rtf", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".env", ".jsx", ".tsx", ".js", ".ts", ".py", ".rb", ".java", ".css", ".scss", ".sql"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isText = TEXT_EXTS.includes(ext) || file.type.startsWith("text/");
    if (!isText) {
      setUploadMsg({ text: `"${ext}" files are not supported yet. Upload .txt, .md, .csv, .json, .html, or paste content manually.`, ok: false });
      setTimeout(() => setUploadMsg(null), 5000);
      e.target.value = "";
      return;
    }
    setUploadingFile(true);
    setUploadMsg(null);
    try {
      const text = await file.text();
      if (!text.trim()) {
        setUploadMsg({ text: "File is empty.", ok: false });
        setTimeout(() => setUploadMsg(null), 4000);
        return;
      }
      const title = file.name.replace(/\.[^/.]+$/, "");
      const res = await fetch("/api/knowledge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: "document", title, content: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        setUploadMsg({ text: err.error || "Upload failed", ok: false });
        setTimeout(() => setUploadMsg(null), 5000);
        return;
      }
      const { item } = await res.json();
      if (item) {
        setKnowledge((prev) => [item, ...prev]);
        setUploadMsg({ text: `"${file.name}" added to knowledge base (${text.length.toLocaleString()} chars)`, ok: true });
        setTimeout(() => setUploadMsg(null), 4000);
      }
    } catch {
      setUploadMsg({ text: "Something went wrong reading the file.", ok: false });
      setTimeout(() => setUploadMsg(null), 5000);
    }
    finally { setUploadingFile(false); e.target.value = ""; }
  }

  function handleSaveAgent() {
    if (!agentName.trim()) return;
    setCustomAgents((prev) => [...prev, { name: agentName.trim(), voice: agentVoice, lang: agentLang, personality: agentPersonality.trim() }]);
    setAgentName(""); setAgentVoice("nova"); setAgentLang("en"); setAgentPersonality(""); setShowCreateAgent(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
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
    <div className="min-h-screen bg-stone-50" data-testid="demopilot-dashboard">
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-900">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            DemoPilot
            <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">Open Source</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/demo/self" className="flex items-center gap-1.5 rounded-lg bg-warm px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
              <Monitor className="h-3.5 w-3.5" /> New Live Demo
            </a>
            <a href="/dashboard/settings" className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50">
              <Settings className="h-3.5 w-3.5" /> Settings
            </a>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1" data-testid="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

          {/* ── SESSIONS ── */}
          {activeTab === "sessions" && (
            <div data-testid="sessions-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Sessions</h2>
                <p className="mt-1 text-sm text-stone-500">All demo sessions across every agent</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80">
                <Plus className="h-4 w-4" /> New Demo
              </button>
            </div>
              {showCreate && (
                <div className="border-b border-stone-200 bg-stone-50 px-8 py-5">
                  <h3 className="mb-3 text-[13px] font-semibold">Create a new demo session</h3>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://your-product.com"
                        className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-[13px] placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
                    </div>
                    <div className="relative">
                      <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <select value={newLang} onChange={(e) => setNewLang(e.target.value)}
                        className="h-10 appearance-none rounded-lg border border-stone-200 bg-white pl-9 pr-7 text-[13px] focus:border-stone-400 focus:outline-none">
                        {POPULAR_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    </div>
                    <button onClick={handleCreate} disabled={creating || !newUrl.trim()}
                      className="flex h-10 items-center gap-2 rounded-lg bg-stone-900 px-5 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50">
                      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Generate
                    </button>
                    <button onClick={() => { setShowCreate(false); setNewUrl(""); setShowPersonalize(false); }}
                      className="h-10 rounded-lg border border-stone-200 px-4 text-[13px] text-stone-500 hover:bg-stone-50">Cancel</button>
                  </div>
                  <button onClick={() => setShowPersonalize(!showPersonalize)}
                    className="mt-2.5 flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-600">
                    <User2 className="h-3.5 w-3.5" /> {showPersonalize ? "Hide personalization" : "Personalize for a prospect"}
                  </button>
                  {showPersonalize && (
                    <div className="mt-2.5 grid grid-cols-3 gap-3">
                      <input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="Prospect name" className="h-9 rounded-lg border border-stone-200 px-3 text-[13px]" />
                      <input value={prospectRole} onChange={(e) => setProspectRole(e.target.value)} placeholder="Role (e.g., CTO)" className="h-9 rounded-lg border border-stone-200 px-3 text-[13px]" />
                      <input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} placeholder="Company name" className="h-9 rounded-lg border border-stone-200 px-3 text-[13px]" />
                    </div>
                  )}
                </div>
              )}

              {/* Filter bar */}
              <div className="flex items-center justify-end gap-2 border-b border-stone-100 px-8 py-2.5">
                <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                  All use cases <ChevronDown className="h-3 w-3" />
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                  All versions <ChevronDown className="h-3 w-3" />
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                  <Columns3 className="h-3 w-3" /> Columns
                </button>
              </div>

              {demos.length === 0 && !showCreate ? (
                <div className="rounded-xl border border-stone-200 bg-white" data-testid="sessions-table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-xs text-stone-400">
                        <th className="px-5 py-3 text-left font-medium">Visitor</th>
                        <th className="px-3 py-3 text-left font-medium">Agent</th>
                        <th className="px-3 py-3 text-left font-medium">Use case</th>
                        <th className="px-3 py-3 text-left font-medium">Status</th>
                        <th className="px-3 py-3 text-left font-medium">Duration</th>
                        <th className="px-3 py-3 text-left font-medium">Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Sarah Chen", email: "sarah@stripe.com", agent: "Landing page", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", status: "Completed", dur: "41m 29s", time: "9m ago" },
                        { name: "Omar Bennett", email: "omar@slack.com", agent: "ABM New Hires", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", status: "Completed", dur: "41m 28s", time: "34m ago" },
                        { name: "Priya Costa", email: "priya@cloudline.co", agent: "Blog", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", status: "Completed", dur: "41m 27s", time: "58m ago" },
                        { name: "Sofia Novak", email: "sofia@northwind.com", agent: "Copilot US", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", status: "Completed", dur: "7m 29s", time: "1h ago" },
                        { name: "Zoe Mercer", email: "zoe@datapulse.io", agent: "In-App", uc: "Success", ucColor: "bg-emerald-100 text-emerald-700", status: "Completed", dur: "41m 26s", time: "2h ago" },
                        { name: "Liam Vance", email: "liam@stackform.com", agent: "Copilot EMEA", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", status: "Completed", dur: "6m 30s", time: "2h ago" },
                        { name: "Grace Okafor", email: "grace@brightpath.io", agent: "Landing page", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", status: "Completed", dur: "41m 25s", time: "3h ago" },
                        { name: "Ravi Park", email: "ravi@heliosys.com", agent: "Blog", uc: "Marketing", ucColor: "bg-purple-100 text-purple-700", status: "Completed", dur: "41m 24s", time: "4h ago" },
                        { name: "Diego Doyle", email: "diego@cloudline.co", agent: "Copilot US", uc: "Sales", ucColor: "bg-orange-100 text-orange-700", status: "Completed", dur: "36m 48s", time: "5h ago" },
                        { name: "Noah Reed", email: "noah@northwind.com", agent: "In-App", uc: "Success", ucColor: "bg-emerald-100 text-emerald-700", status: "Completed", dur: "50m 53s", time: "6h ago" },
                      ].map((r) => (
                        <tr key={r.name + r.time} className="border-b border-stone-50 hover:bg-stone-50">
                          <td className="px-5 py-3"><div className="font-medium text-stone-800">{r.name}</div><div className="text-xs text-stone-400">{r.email}</div></td>
                          <td className="px-3 py-3 text-stone-600">{r.agent}</td>
                          <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.ucColor}`}>{r.uc}</span></td>
                          <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{r.status}</span></td>
                          <td className="px-3 py-3 text-stone-500">{r.dur}</td>
                          <td className="px-3 py-3 text-stone-400">{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : demos.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-white" data-testid="sessions-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs text-stone-400">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="px-5 py-3 text-left font-medium">Visitor</th>
                      <th className="px-3 py-3 text-left font-medium">Agent</th>
                      <th className="px-3 py-3 text-left font-medium">Use case</th>
                      <th className="px-3 py-3 text-left font-medium">Status</th>
                      <th className="px-3 py-3 text-left font-medium">Duration</th>
                      <th className="px-3 py-3 text-left font-medium">Started</th>
                      <th className="w-10 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((demo) => {
                      const cfg = STATUS_CONFIG[demo.status] || STATUS_CONFIG.pending;
                      const visitor = getVisitorInfo(demo);
                      const useCase = getUseCase(demo);
                      const agentLabel = getAgentName(demo);
                      const inProgress = ["navigating", "scripting", "generating_audio", "compositing"].includes(demo.status);
                      return (
                        <tr key={demo.id} className="group border-b border-stone-100 transition-colors hover:bg-stone-50">
                          {/* Signal */}
                          <td className="px-2 py-3.5 text-center">
                            <Signal className={`h-4 w-4 ${demo.status === "done" ? "text-blue-500" : inProgress ? "text-amber-400" : "text-stone-300"}`} />
                          </td>
                          {/* Visitor */}
                          <td className="px-4 py-3.5">
                            <a href={demo.status === "done" ? `/demo/${demo.id}` : undefined} className={`font-medium text-stone-900 ${demo.status === "done" ? "hover:underline cursor-pointer" : ""}`}>
                              {visitor.name}
                            </a>
                            <p className="mt-0.5 truncate text-[11px] text-stone-400 max-w-[200px]">{visitor.email}</p>
                          </td>
                          {/* Agent */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                              <span className="text-stone-700">{agentLabel}</span>
                            </div>
                          </td>
                          {/* Use case */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${useCase.color}`}>
                              {useCase.label}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5">
                              {inProgress ? (
                                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                              ) : (
                                <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`}></span>
                              )}
                              <span className={`text-[12px] font-medium ${cfg.color}`}>{cfg.label}</span>
                            </span>
                          </td>
                          {/* Duration */}
                          <td className="px-4 py-3.5 text-stone-500">{getDuration(demo)}</td>
                          {/* Started */}
                          <td className="px-4 py-3.5 text-stone-400">{timeAgo(demo.created_at)}</td>
                          {/* Actions */}
                          <td className="px-2 py-3.5">
                            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              {demo.status === "done" && (
                                <>
                                  <a href={`/demo/${demo.id}`} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600" title="View">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                  <a href={`/api/demos/${demo.id}/asset?file=demo.mp4`} download className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600" title="Download">
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                  <button onClick={() => handleCopyLink(demo.id)} className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600" title="Copy link">
                                    {copiedId === demo.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDelete(demo.id)} disabled={deletingId === demo.id}
                                className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50" title="Delete">
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

          {/* ── ANALYTICS ── */}
          {activeTab === "analytics" && (() => {
            const hasData = analyticsData.length > 0;
            const conversionRate = hasData && totalViews > 0 ? Math.round((totalCtaClicks / totalViews) * 100) : 0;

            const chartBars = hasData
              ? analyticsData.map((d) => ({ demos: d.analytics?.views || 0, goals: d.analytics?.ctaClicks || 0, label: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }))
              : [
                  { demos: 12, goals: 3, label: "Aug 1" }, { demos: 18, goals: 5, label: "Aug 4" },
                  { demos: 8, goals: 2, label: "Aug 7" }, { demos: 22, goals: 7, label: "Aug 10" },
                  { demos: 30, goals: 10, label: "Aug 13" }, { demos: 15, goals: 6, label: "Aug 16" },
                  { demos: 25, goals: 9, label: "Aug 19" }, { demos: 35, goals: 12, label: "Aug 22" },
                  { demos: 20, goals: 8, label: "Aug 25" }, { demos: 28, goals: 11, label: "Aug 28" },
                ];
            const chartMax = Math.max(...chartBars.map((b) => b.demos), 1);

            return (
              <div data-testid="analytics-panel">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-stone-900">Analytics</h2>
                  <p className="mt-1 text-sm text-stone-500">Conversion rates and engagement across all product demos</p>
                </div>
                {analyticsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
                      {[
                        { label: "Total Views", value: hasData ? totalViews.toLocaleString() : "2,847", icon: Eye, color: "text-blue-600 bg-blue-50" },
                        { label: "Total Plays", value: hasData ? totalPlays.toLocaleString() : "1,923", icon: Play, color: "text-purple-600 bg-purple-50" },
                        { label: "Completions", value: hasData ? totalCompletes.toLocaleString() : "1,421", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                        { label: "CTA Clicks", value: hasData ? totalCtaClicks.toLocaleString() : "421", icon: ExternalLink, color: "text-warm bg-warm/10" },
                        { label: "Avg Completion", value: hasData ? `${Math.round(avgCompletionRate)}%` : "74%", icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4">
                          <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                            <stat.icon className="h-4 w-4" />
                          </div>
                          <p className="text-2xl font-semibold text-stone-900">{stat.value}</p>
                          <p className="text-xs text-stone-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-stone-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold text-stone-900">Engagement over time</h3>
                        <div className="flex h-40 items-end gap-1.5">
                          {(hasData ? chartBars.map((b) => Math.max(8, Math.round((b.demos / chartMax) * 100))) : [40, 65, 45, 80, 60, 90, 70, 85, 55, 75, 50, 88, 62, 78, 92, 68, 83]).map((h, i) => (
                            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-warm/60 to-warm/20" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold text-stone-900">Conversion funnel</h3>
                        <div className="space-y-3">
                          {[
                            { label: "Viewed demo link", pct: 100 },
                            { label: "Started watching", pct: hasData && totalViews > 0 ? Math.round((totalPlays / totalViews) * 100) : 82 },
                            { label: "Reached midpoint", pct: hasData ? Math.round(avgCompletionRate * 0.82) || 61 : 61 },
                            { label: "Completed demo", pct: hasData ? Math.round(avgCompletionRate) : 44 },
                            { label: "Clicked CTA", pct: hasData ? conversionRate : 22 },
                          ].map((s) => (
                            <div key={s.label} className="flex items-center gap-3">
                              <div className="w-32 text-xs text-stone-500 text-right">{s.label}</div>
                              <div className="flex-1 h-4 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full rounded-full bg-warm/60" style={{ width: `${s.pct}%` }} />
                              </div>
                              <div className="w-10 text-xs font-medium text-stone-600">{s.pct}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ── KNOWLEDGE ── */}
          {activeTab === "knowledge" && (
            <div className="space-y-5" data-testid="knowledge-panel">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">Knowledge Base</h2>
                  <p className="mt-1 text-sm text-stone-500">Product docs, FAQs, and objection playbooks for your AI agents</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload File
                    <input type="file" className="hidden" accept=".txt,.md,.csv,.json,.html,.htm,.xml,.log,.rtf,.yaml,.yml,.toml,.ini,.cfg,.env,.jsx,.tsx,.js,.ts,.py,.rb,.java,.css,.scss,.sql" onChange={handleFileUpload} />
                  </label>
                  <button onClick={() => setShowAddKnowledge(!showAddKnowledge)} className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80">
                    <Plus className="h-4 w-4" /> Add Knowledge
                  </button>
                </div>
              </div>
              {uploadMsg && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium ${uploadMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {uploadMsg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {uploadMsg.text}
                </div>
              )}

              <div className="rounded-xl border border-stone-200 p-5">
                <h3 className="mb-3 text-[13px] font-semibold">Import from URL</h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input value={kbUrl} onChange={(e) => setKbUrl(e.target.value)}
                      placeholder="https://docs.your-product.com/getting-started"
                      onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                      className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-[13px] focus:border-stone-400 focus:outline-none" />
                  </div>
                  <button onClick={handleScrapeUrl} disabled={!kbUrl.trim() || scrapingUrl}
                    className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50">
                    {scrapingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />} Scrape
                  </button>
                </div>
              </div>

              {showAddKnowledge && (
                <div className="rounded-xl border border-stone-200 p-5 space-y-4">
                  <h3 className="text-[13px] font-semibold">Add manually</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={kbType} onChange={(e) => setKbType(e.target.value)}
                      className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-[13px] focus:border-stone-400 focus:outline-none">
                      <option value="document">Document</option>
                      <option value="demo_script">Demo Script</option>
                      <option value="faq">FAQ</option>
                      <option value="objection">Objection Playbook</option>
                    </select>
                    <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} placeholder="Title"
                      className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-[13px] focus:border-stone-400 focus:outline-none" />
                  </div>
                  <textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)}
                    placeholder="Paste your docs, scripts, FAQs, etc."
                    rows={5} className="w-full rounded-lg border border-stone-200 bg-white p-3 text-[13px] focus:border-stone-400 focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleAddKnowledge}
                      className="rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800">Save</button>
                    <button onClick={() => setShowAddKnowledge(false)}
                      className="rounded-lg border border-stone-200 px-4 py-2 text-[13px] hover:bg-stone-50">Cancel</button>
                  </div>
                </div>
              )}

              {knowledge.length === 0 && !showAddKnowledge ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                    <BookOpen className="h-7 w-7 text-stone-300" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-stone-600">No knowledge items yet</h3>
                  <p className="text-[13px] text-stone-400">Add docs, scripts, or scrape URLs to train your agents</p>
                </div>
              ) : (
                <div className="rounded-xl border border-stone-200 divide-y divide-stone-100">
                  {knowledge.map((item) => {
                    const typeIcons: Record<string, React.ReactNode> = {
                      document: <FileText className="h-4 w-4" />, url: <Globe className="h-4 w-4" />,
                      demo_script: <MessageSquare className="h-4 w-4" />, faq: <BookOpen className="h-4 w-4" />,
                      objection: <Shield className="h-4 w-4" />,
                    };
                    return (
                      <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 text-stone-400">{typeIcons[item.source_type] || <FileText className="h-4 w-4" />}</span>
                          <div>
                            <p className="text-[13px] font-medium text-stone-900">{item.title}</p>
                            <p className="mt-0.5 text-[11px] text-stone-400">
                              {item.source_type} &middot; {item.content.length.toLocaleString()} chars
                              {item.source_url && <> &middot; <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{new URL(item.source_url).hostname}</a></>}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteKnowledge(item.id)}
                          className="rounded p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── AGENTS ── */}
          {activeTab === "agents" && (
            <div className="space-y-6" data-testid="agents-panel">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">Agents</h2>
                  <p className="mt-1 text-sm text-stone-500">AI voices available for your product demos — powered by OpenAI TTS</p>
                </div>
                <button onClick={() => setShowCreateAgent(!showCreateAgent)} className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80">
                  <Plus className="h-4 w-4" /> Create Agent
                </button>
              </div>
              {showCreateAgent && (
                <div className="rounded-xl border-2 border-stone-300 p-6 space-y-4">
                  <h3 className="text-[14px] font-semibold">Create custom agent</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-stone-400 uppercase tracking-wide">Agent name</label>
                      <input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g., Alex"
                        className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-[13px] focus:border-stone-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-stone-400 uppercase tracking-wide">Voice</label>
                      <select value={agentVoice} onChange={(e) => setAgentVoice(e.target.value)}
                        className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-[13px] focus:border-stone-400 focus:outline-none">
                        {AGENTS.map((a) => <option key={a.voice} value={a.voice}>{a.name} ({a.voice})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-stone-400 uppercase tracking-wide">Primary language</label>
                      <select value={agentLang} onChange={(e) => setAgentLang(e.target.value)}
                        className="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-[13px] focus:border-stone-400 focus:outline-none">
                        {POPULAR_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-stone-400 uppercase tracking-wide">Personality & instructions</label>
                    <textarea value={agentPersonality} onChange={(e) => setAgentPersonality(e.target.value)}
                      placeholder="Describe how this agent should behave."
                      rows={3} className="w-full rounded-lg border border-stone-200 bg-white p-3 text-[13px] focus:border-stone-400 focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveAgent} disabled={!agentName.trim()}
                      className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" /> Save Agent
                    </button>
                    <button onClick={() => setShowCreateAgent(false)}
                      className="rounded-lg border border-stone-200 px-4 py-2 text-[13px] hover:bg-stone-50">Cancel</button>
                  </div>
                </div>
              )}

              {customAgents.length > 0 && (
                <div>
                  <h3 className="mb-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Your custom agents</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customAgents.map((agent, i) => (
                      <div key={i} className="rounded-xl border-2 border-stone-200 p-5 transition-all hover:border-stone-300">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-semibold">{agent.name}</h3>
                            <p className="text-[11px] text-stone-400">{AGENTS.find((a) => a.voice === agent.voice)?.name || agent.voice} &middot; {POPULAR_LANGUAGES.find((l) => l.code === agent.lang)?.name || agent.lang}</p>
                          </div>
                        </div>
                        {agent.personality && <p className="mb-3 text-[12px] leading-relaxed text-stone-400 line-clamp-2">{agent.personality}</p>}
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-stone-900 px-2 py-0.5 text-[9px] font-bold text-white uppercase">Custom</span>
                          <button onClick={() => setCustomAgents((prev) => prev.filter((_, j) => j !== i))}
                            className="ml-auto rounded p-1 text-stone-300 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Built-in voices</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {AGENTS.map((agent) => (
                    <div key={agent.voice} className="rounded-xl border border-stone-200 p-5 transition-all hover:border-stone-300">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
                          <Volume2 className="h-5 w-5 text-stone-500" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-semibold">{agent.name}</h3>
                          <p className="text-[11px] text-stone-400 font-mono">{agent.voice}</p>
                        </div>
                      </div>
                      <p className="mb-3 text-[12px] leading-relaxed text-stone-400">{agent.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.lang.split(", ").map((l) => (
                          <span key={l} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-stone-500">{l}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 p-6">
                <h3 className="mb-4 text-[14px] font-semibold">Agent Capabilities</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-stone-50 p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <h4 className="mb-1 text-[13px] font-semibold">Custom Voice & Personality</h4>
                    <p className="text-[12px] leading-relaxed text-stone-400">
                      Fine-tune how your agent speaks and behaves. Set a custom personality, tone, and speaking style for each product.
                    </p>
                  </div>
                  <div className="rounded-lg bg-stone-50 p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Languages className="h-4 w-4" />
                    </div>
                    <h4 className="mb-1 text-[13px] font-semibold">50+ Languages</h4>
                    <p className="text-[12px] leading-relaxed text-stone-400">
                      All voices support 50+ languages out of the box via OpenAI TTS. Agents automatically adapt to the prospect&apos;s language.
                    </p>
                  </div>
                  <div className="rounded-lg bg-stone-50 p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h4 className="mb-1 text-[13px] font-semibold">Knowledge-Aware</h4>
                    <p className="text-[12px] leading-relaxed text-stone-400">
                      Agents use your uploaded knowledge base to answer questions accurately and highlight the right features for each prospect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  );
}
