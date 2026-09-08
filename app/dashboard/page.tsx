"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Plus, Globe, Loader2, Trash2, ExternalLink, Download, Copy, Check,
  Clock, CheckCircle2, AlertCircle, LogOut, Film, ArrowRight,
  Languages, User2, ChevronDown, Eye, BarChart3, BookOpen, Bot,
  TrendingUp, MousePointerClick, FileText, Link2,
  Shield, MessageSquare, Volume2, Upload, Save, Signal,
  Settings, FlaskConical, GitBranch, Columns3,
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

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: React.ReactNode; soon?: boolean }> = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-[18px] w-[18px]" /> },
  { id: "sessions", label: "Sessions", icon: <Play className="h-[18px] w-[18px]" /> },
  { id: "agents", label: "Agents", icon: <Bot className="h-[18px] w-[18px]" /> },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen className="h-[18px] w-[18px]" /> },
  { id: "integrations", label: "Integrations", icon: <Settings className="h-[18px] w-[18px]" />, soon: true },
  { id: "ab_testing", label: "AB testing", icon: <FlaskConical className="h-[18px] w-[18px]" />, soon: true },
  { id: "routing", label: "Routing", icon: <GitBranch className="h-[18px] w-[18px]" />, soon: true },
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

  const sectionTitle: Record<Tab, { title: string; subtitle: string }> = {
    analytics: { title: "Analytics", subtitle: "Track the performance and usage of your agents." },
    sessions: { title: "Sessions", subtitle: "All demo sessions across every agent." },
    agents: { title: "Agents", subtitle: "Configure AI voices and custom agent personalities." },
    knowledge: { title: "Knowledge", subtitle: "Upload docs or URLs to give your agents product context." },
    integrations: { title: "Integrations", subtitle: "Connect CRM, analytics, and third-party tools." },
    ab_testing: { title: "AB testing", subtitle: "Test different agent scripts and measure performance." },
    routing: { title: "Routing", subtitle: "Route prospects to the right agent automatically." },
  };

  return (
    <div className="flex h-screen bg-white">
      {/* ── SIDEBAR ── */}
      <aside className="flex w-56 flex-col border-r border-stone-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900">
            <Play className="h-3.5 w-3.5 fill-white text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">DemoPilot</span>
        </div>

        {/* Workspace */}
        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-lg border border-stone-200 px-3 py-2.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">{displayName}</p>
            <p className="text-[11px] text-stone-400">Open source</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.soon && setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-stone-100 text-stone-900"
                  : item.soon
                    ? "cursor-default text-stone-300"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
              }`}
            >
              {item.icon}
              {item.label}
              {item.soon && <span className="ml-auto rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-400">SOON</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-stone-200 px-4 py-3">
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Content header */}
        <header className="flex items-start justify-between border-b border-stone-200 px-8 py-6">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">{sectionTitle[activeTab].title}</h1>
            <p className="mt-0.5 text-[13px] text-stone-400">{sectionTitle[activeTab].subtitle}</p>
          </div>
          {activeTab === "sessions" && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-stone-800">
              <Plus className="h-3.5 w-3.5" /> New session
            </button>
          )}
          {activeTab === "knowledge" && (
            <div className="flex items-center gap-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[13px] font-medium text-stone-600 transition-all hover:bg-stone-50 ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload File
                <input type="file" className="hidden" accept=".txt,.md,.csv,.json,.html,.htm,.xml,.log,.rtf,.yaml,.yml,.toml,.ini,.cfg,.env,.jsx,.tsx,.js,.ts,.py,.rb,.java,.css,.scss,.sql" onChange={handleFileUpload} />
              </label>
              <button onClick={() => setShowAddKnowledge(!showAddKnowledge)}
                className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-stone-800">
                <Plus className="h-3.5 w-3.5" /> Add manually
              </button>
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                All projects <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                Last 30 days <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-500 hover:bg-stone-50">
                Daily <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
          {activeTab === "agents" && (
            <button onClick={() => setShowCreateAgent(!showCreateAgent)}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-stone-800">
              <Plus className="h-3.5 w-3.5" /> Create Agent
            </button>
          )}
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SESSIONS ── */}
          {activeTab === "sessions" && (
            <div>
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
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                    <Film className="h-7 w-7 text-stone-300" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-stone-600">No sessions yet</h3>
                  <p className="mb-6 text-[13px] text-stone-400">Create your first AI-powered product demo</p>
                  <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-stone-800">
                    <Plus className="h-3.5 w-3.5" /> New session
                  </button>
                </div>
              ) : demos.length > 0 && (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="px-4 py-3 text-left font-medium">Visitor</th>
                      <th className="px-4 py-3 text-left font-medium">Agent</th>
                      <th className="px-4 py-3 text-left font-medium">Use case</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Duration</th>
                      <th className="px-4 py-3 text-left font-medium">Started</th>
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
              )}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === "analytics" && (() => {
            const hasData = analyticsData.length > 0;
            const demoCount = hasData ? analyticsData.length : 0;
            const totalDuration = hasData ? analyticsData.reduce((s, d) => s + (d.analytics?.avgDuration || 0), 0) : 0;
            const durationH = Math.floor(totalDuration / 3600);
            const durationM = Math.floor((totalDuration % 3600) / 60);
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
            const yTicks = [0, Math.round(chartMax * 0.25), Math.round(chartMax * 0.5), Math.round(chartMax * 0.75), chartMax];

            return (
              <div className="px-8 py-6 space-y-6">
                {analyticsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
                ) : (
                  <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                      {[
                        { label: "Total Demo Sessions", value: hasData ? demoCount.toLocaleString() : "0", sub: hasData ? "Sessions in last 30 days" : "No sessions yet", trend: hasData ? "+13.6%" : null },
                        { label: "Total Demo Minutes", value: hasData ? `${durationH}h ${durationM}m` : "0h 0m", sub: hasData ? "Total time spent in demos" : "No data yet", trend: hasData ? "+18.1%" : null },
                        { label: "Goals Reached", value: hasData ? totalCtaClicks.toLocaleString() : "0", sub: hasData ? "Demo goals successfully achieved" : "CTA clicks across demos", trend: hasData ? "+11.1%" : null },
                        { label: "Conversion Rate", value: hasData ? `${conversionRate}%` : "0%", sub: hasData ? "Demos started per page view" : "Views to CTA ratio", trend: hasData ? "+8.3%" : null },
                        { label: "Completion Rate", value: `${Math.round(avgCompletionRate)}%`, sub: hasData ? `${totalCompletes} of ${totalPlays} demos completed` : "Avg demo completion", trend: hasData ? "+2.1%" : null },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-stone-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-medium text-stone-400">{stat.label}</p>
                            {stat.trend && <span className="text-[10px] font-medium text-emerald-600">{stat.trend}</span>}
                          </div>
                          <p className="text-[22px] font-bold text-stone-900 leading-tight">{stat.value}</p>
                          <p className="mt-1 text-[11px] text-stone-400">{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Activity section */}
                    <div>
                      <h2 className="mb-1 text-[15px] font-semibold text-stone-900">Activity</h2>
                      <p className="mb-5 text-[12px] text-stone-400">Demo volume over time and how visitors move toward the goal.</p>

                      {/* Activity Over Time chart */}
                      <div className="rounded-xl border border-stone-200 p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-[13px] font-semibold text-stone-900">Activity Over Time</h3>
                            <div className="mt-2 flex items-center gap-5">
                              <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Demos <span className="font-semibold text-stone-900">{hasData ? demoCount : 22}</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <span className="h-2 w-2 rounded-full bg-red-400"></span> Errors <span className="font-semibold text-stone-900">{hasData ? demos.filter((d) => d.status === "error").length : 1}</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <span className="h-2 w-2 rounded-full bg-blue-400"></span> Avg Duration <span className="font-semibold text-stone-900">{hasData && totalDuration > 0 ? `${Math.round(totalDuration / Math.max(demoCount, 1))}s` : "8m"}</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <span className="h-2 w-2 rounded-full bg-purple-400"></span> Goals Reached <span className="font-semibold text-stone-900">{hasData ? totalCtaClicks : 9}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="flex">
                          {/* Y axis labels */}
                          <div className="flex flex-col-reverse justify-between pr-3 py-1" style={{ height: 200 }}>
                            {yTicks.map((t) => (
                              <span key={t} className="text-[10px] text-stone-400 leading-none">{t}</span>
                            ))}
                          </div>
                          {/* Bars */}
                          <div className="flex-1 border-l border-b border-stone-200">
                            <div className="flex items-end gap-1 px-1" style={{ height: 200 }}>
                              {chartBars.map((bar, i) => {
                                const barH = chartMax > 0 ? (bar.demos / chartMax) * 100 : 0;
                                const goalH = chartMax > 0 ? (bar.goals / chartMax) * 100 : 0;
                                return (
                                  <div key={i} className="group relative flex flex-1 items-end justify-center gap-0.5">
                                    <div className={`w-full max-w-[18px] rounded-t ${hasData ? "bg-emerald-400/70" : "bg-stone-300/50"}`} style={{ height: `${Math.max(barH, 2)}%` }} />
                                    <div className={`w-full max-w-[18px] rounded-t ${hasData ? "bg-purple-400/70" : "bg-stone-200/50"}`} style={{ height: `${Math.max(goalH, 2)}%` }} />
                                    {/* Tooltip */}
                                    <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[11px] shadow-lg group-hover:block">
                                      <p className="font-semibold text-stone-700 mb-1">{bar.label}</p>
                                      <p className="text-stone-500">Demos: <span className="font-medium text-stone-800">{bar.demos}</span></p>
                                      <p className="text-stone-500">Goals: <span className="font-medium text-stone-800">{bar.goals}</span></p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* X axis labels */}
                            <div className="flex border-t border-stone-100 px-1 pt-2">
                              {chartBars.map((bar, i) => (
                                <div key={i} className="flex-1 text-center text-[9px] text-stone-400">{bar.label}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conversion chart */}
                    <div className="rounded-xl border border-stone-200 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-[13px] font-semibold text-stone-900">Conversion Chart</h3>
                          <p className="mt-0.5 text-[11px] text-stone-400">
                            {hasData ? `${conversionRate}% conversion · ${totalCtaClicks} goals reached · ${totalCompletes} completed` : "35.4% conversion · 37 rejected emails · 22 goals reached"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: "Viewed", value: hasData ? totalViews : 100, pct: 100 },
                          { label: "Started playing", value: hasData ? totalPlays : 82, pct: hasData ? (totalViews > 0 ? Math.round((totalPlays / totalViews) * 100) : 0) : 82 },
                          { label: "Completed demo", value: hasData ? totalCompletes : 44, pct: hasData ? Math.round(avgCompletionRate) : 44 },
                          { label: "CTA clicked", value: hasData ? totalCtaClicks : 22, pct: hasData ? conversionRate : 22 },
                        ].map((step) => (
                          <div key={step.label} className="flex items-center gap-4">
                            <div className="w-28 text-right text-[12px] text-stone-500">{step.label}</div>
                            <div className="flex-1 h-7 rounded bg-stone-100 overflow-hidden relative">
                              <div className={`h-full rounded ${hasData ? "bg-emerald-400/40" : "bg-stone-300/40"}`} style={{ width: `${step.pct}%` }} />
                              <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-medium text-stone-600">
                                {step.value.toLocaleString()} ({step.pct}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ── KNOWLEDGE ── */}
          {activeTab === "knowledge" && (
            <div className="space-y-5 px-8 py-6">
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
            <div className="space-y-6 px-8 py-6">
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

          {/* ── COMING SOON PAGES ── */}
          {(activeTab === "integrations" || activeTab === "ab_testing" || activeTab === "routing") && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                {activeTab === "integrations" && <Settings className="h-7 w-7 text-stone-300" />}
                {activeTab === "ab_testing" && <FlaskConical className="h-7 w-7 text-stone-300" />}
                {activeTab === "routing" && <GitBranch className="h-7 w-7 text-stone-300" />}
              </div>
              <h3 className="mb-1 text-lg font-medium text-stone-600">{sectionTitle[activeTab].title}</h3>
              <p className="text-[13px] text-stone-400">{sectionTitle[activeTab].subtitle}</p>
              <span className="mt-4 rounded-full bg-stone-100 px-4 py-1.5 text-[12px] font-medium text-stone-400">Coming soon</span>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
