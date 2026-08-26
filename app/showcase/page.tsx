"use client";

import { useState } from "react";
import {
  Play, BarChart3, BookOpen, Bot, MonitorPlay, MessageSquare,
  Monitor, Settings, Plus, Trash2, Globe, Eye, CheckCircle2,
  Clock, ExternalLink, Download, Copy, Volume2,
} from "lucide-react";

type Tab = "analytics" | "sessions" | "knowledge" | "agents";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "sessions", label: "Sessions", icon: <MonitorPlay className="h-4 w-4" /> },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen className="h-4 w-4" /> },
  { id: "agents", label: "Agents", icon: <Bot className="h-4 w-4" /> },
];

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  return (
    <div className="min-h-screen bg-stone-50" data-testid="demopilot-dashboard">
      {/* Nav */}
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
            <a href="/live/new" className="flex items-center gap-1.5 rounded-lg bg-warm px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
              <Monitor className="h-3.5 w-3.5" /> New Live Demo
            </a>
            <button className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50">
              <Settings className="h-3.5 w-3.5" /> Settings
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm text-xs font-bold text-white">D</div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Tab bar */}
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1" data-testid="tab-bar">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <div data-testid="sessions-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Sessions</h2>
                <p className="mt-1 text-sm text-stone-500">All demo sessions across every agent</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80">
                <Plus className="h-4 w-4" /> New Demo
              </button>
            </div>
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
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div data-testid="analytics-panel">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900">Analytics</h2>
              <p className="mt-1 text-sm text-stone-500">Conversion rates and engagement across all product demos</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
              {[
                { label: "Total Views", value: "2,847", icon: Eye, color: "text-blue-600 bg-blue-50" },
                { label: "Total Plays", value: "1,923", icon: Play, color: "text-purple-600 bg-purple-50" },
                { label: "Completions", value: "1,421", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                { label: "CTA Clicks", value: "421", icon: ExternalLink, color: "text-warm bg-warm/10" },
                { label: "Avg Completion", value: "74%", icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
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
                  {[40, 65, 45, 80, 60, 90, 70, 85, 55, 75, 50, 88, 62, 78, 92, 68, 83].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-warm/60 to-warm/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-stone-900">Conversion funnel</h3>
                <div className="space-y-3">
                  {[
                    { label: "Viewed demo link", pct: 100 },
                    { label: "Started watching", pct: 82 },
                    { label: "Reached midpoint", pct: 61 },
                    { label: "Completed demo", pct: 44 },
                    { label: "Clicked CTA", pct: 22 },
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
          </div>
        )}

        {/* KNOWLEDGE */}
        {activeTab === "knowledge" && (
          <div data-testid="knowledge-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Knowledge Base</h2>
                <p className="mt-1 text-sm text-stone-500">Product docs, FAQs, and objection playbooks for your AI agents</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-80">
                <Plus className="h-4 w-4" /> Add Knowledge
              </button>
            </div>
            <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold">Import from URL</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input placeholder="https://docs.your-product.com" className="h-10 w-full rounded-lg border border-stone-200 pl-10 pr-4 text-sm text-stone-600" readOnly />
                </div>
                <button className="rounded-lg bg-warm px-5 py-2 text-sm font-semibold text-white">Scrape</button>
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
              {[
                { title: "Product Documentation", type: "document", chars: "24,500", url: null },
                { title: "Pricing & Plans FAQ", type: "faq", chars: "3,200", url: null },
                { title: "Enterprise Objection Playbook", type: "objection", chars: "8,100", url: null },
                { title: "API Reference", type: "url", chars: "45,000", url: "docs.acme.com" },
                { title: "Competitor Comparison Sheet", type: "document", chars: "6,800", url: null },
                { title: "Customer Success Stories", type: "demo_script", chars: "12,400", url: null },
                { title: "Security & Compliance", type: "document", chars: "9,200", url: null },
                { title: "Integration Guide (scraped)", type: "url", chars: "18,600", url: "docs.acme.com/integrations" },
              ].map((k) => (
                <div key={k.title} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="text-sm font-medium text-stone-800">{k.title}</div>
                    <div className="mt-0.5 text-xs text-stone-400">{k.type} · {k.chars} chars{k.url && <> · <span className="text-warm">{k.url}</span></>}</div>
                  </div>
                  <button className="rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AGENTS */}
        {activeTab === "agents" && (
          <div data-testid="agents-panel">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900">Agents</h2>
              <p className="mt-1 text-sm text-stone-500">AI voices available for your product demos — powered by OpenAI TTS</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Nova", voice: "nova", desc: "Warm, engaging female voice. Great for product walkthroughs and onboarding.", langs: ["EN", "ES", "FR", "PT", "JA", "KO", "ZH", "HI"] },
                { name: "Onyx", voice: "onyx", desc: "Deep, authoritative male voice. Ideal for enterprise demos and technical presentations.", langs: ["EN", "DE", "AR"] },
                { name: "Alloy", voice: "alloy", desc: "Neutral, versatile voice. Works well across all demo types and industries.", langs: ["EN", "ES", "FR", "DE", "IT", "PT"] },
                { name: "Echo", voice: "echo", desc: "Clear, professional male voice. Best for concise feature highlights.", langs: ["EN", "ES", "FR", "DE"] },
                { name: "Fable", voice: "fable", desc: "Expressive, storytelling voice. Perfect for narrative-driven product stories.", langs: ["EN", "ES", "FR", "DE", "IT"] },
                { name: "Shimmer", voice: "shimmer", desc: "Bright, energetic female voice. Suited for marketing demos and social content.", langs: ["EN", "ES", "FR", "DE", "IT", "PT", "JA"] },
              ].map((a) => (
                <div key={a.name} className="rounded-xl border border-stone-200 bg-white p-5 hover:shadow-md transition-all">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
                      <Volume2 className="h-5 w-5 text-warm" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">{a.name}</div>
                      <div className="text-xs text-stone-400 font-mono">{a.voice}</div>
                    </div>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-stone-500">{a.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {a.langs.map((l) => (
                      <span key={l} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">{l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center">
              <div className="text-sm font-medium text-stone-500">Custom voice agents — coming soon</div>
              <div className="mt-1 text-xs text-stone-400">Upload your own voice model or fine-tune agent personality and behavior per product.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
