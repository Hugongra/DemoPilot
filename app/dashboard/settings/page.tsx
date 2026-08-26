"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, ArrowLeft, Loader2, Plus, Trash2, Webhook, Users, Palette, Save, Check,
  BookOpen, Globe, FileText, Link2, MessageSquare, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  role: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Create workspace form
  const [wsName, setWsName] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [brandColor, setBrandColor] = useState("#ff6058");

  // New webhook form
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [whName, setWhName] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>(["demo.completed"]);

  // Knowledge base
  interface KnowledgeItem {
    id: string;
    source_type: string;
    title: string;
    content: string;
    source_url: string | null;
    created_at: string;
  }
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [kbType, setKbType] = useState<string>("document");
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [scrapingUrl, setScrapingUrl] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push("/"); return; }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
    });

    fetch("/api/workspaces")
      .then((r) => r.json())
      .then(({ workspaces }) => {
        if (workspaces?.length > 0) {
          const ws = workspaces[0];
          setWorkspace(ws);
          setWsName(ws.name);
          setWsSlug(ws.slug);
          setBrandColor(ws.brand_color || "#ff6058");
          // Fetch webhooks
          fetch(`/api/webhooks?workspace_id=${ws.id}`)
            .then((r) => r.json())
            .then(({ webhooks: whs }) => setWebhooks(whs || []))
            .catch(() => null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch knowledge base
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then(({ items }) => setKnowledge(items || []))
      .catch(() => null);
  }, [router]);

  async function handleCreateWorkspace() {
    if (!wsName.trim() || !wsSlug.trim()) return;
    setSaving(true);

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wsName.trim(), slug: wsSlug.trim().toLowerCase().replace(/\s+/g, "-") }),
    });
    const { workspace: ws } = await res.json();
    if (ws) {
      setWorkspace({ ...ws, role: "owner" });
    }
    setSaving(false);
  }

  async function handleSaveBranding() {
    if (!workspace) return;
    setSaving(true);

    const supabase = createClient();
    if (supabase) {
      await supabase
        .from("workspaces")
        .update({ name: wsName, brand_color: brandColor })
        .eq("id", workspace.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddWebhook() {
    if (!workspace || !whName.trim() || !whUrl.trim()) return;

    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspace.id,
        name: whName.trim(),
        url: whUrl.trim(),
        events: whEvents,
      }),
    });
    const { webhook } = await res.json();
    if (webhook) {
      setWebhooks((prev) => [webhook, ...prev]);
      setWhName("");
      setWhUrl("");
      setShowAddWebhook(false);
    }
  }

  async function handleDeleteWebhook(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("webhooks").delete().eq("id", id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleAddKnowledge() {
    if (!kbTitle.trim() || !kbContent.trim()) return;

    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_type: kbType,
        title: kbTitle.trim(),
        content: kbContent.trim(),
      }),
    });
    const { item } = await res.json();
    if (item) {
      setKnowledge((prev) => [item, ...prev]);
      setKbTitle("");
      setKbContent("");
      setShowAddKnowledge(false);
    }
  }

  async function handleScrapeUrl() {
    if (!kbUrl.trim()) return;
    setScrapingUrl(true);

    try {
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: kbUrl.trim() }),
      });
      const { item } = await res.json();
      if (item) {
        setKnowledge((prev) => [item, ...prev]);
        setKbUrl("");
      }
    } catch { /* ignore */ }
    finally { setScrapingUrl(false); }
  }

  async function handleDeleteKnowledge(itemId: string) {
    await fetch(`/api/knowledge?id=${itemId}`, { method: "DELETE" });
    setKnowledge((prev) => prev.filter((k) => k.id !== itemId));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-warm" />
      </div>
    );
  }

  const ALL_EVENTS = [
    "demo.created", "demo.completed", "demo.viewed", "demo.cta_clicked",
    "live_session.started", "live_session.ended",
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
          <button onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            Settings
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Workspace / Branding */}
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Workspace & Branding</h2>
          </div>

          {!workspace ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Create a workspace to manage team access and branding.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Workspace Name</label>
                  <input
                    value={wsName} onChange={(e) => setWsName(e.target.value)}
                    placeholder="My Company"
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Slug</label>
                  <input
                    value={wsSlug} onChange={(e) => setWsSlug(e.target.value)}
                    placeholder="my-company"
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>
              <button onClick={handleCreateWorkspace} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                  <input value={wsName} onChange={(e) => setWsName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:border-foreground focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border-0" />
                    <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-border px-3 text-sm font-mono focus:border-foreground focus:outline-none" />
                  </div>
                </div>
              </div>
              <button onClick={handleSaveBranding} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50">
                {saved ? <><Check className="h-4 w-4" /> Saved</> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}
              </button>
            </div>
          )}
        </section>

        {/* Team (placeholder) */}
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Team Members</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {workspace
              ? `Workspace: ${workspace.name} · Your role: ${workspace.role}`
              : "Create a workspace first to invite team members."}
          </p>
          {workspace && (
            <p className="mt-2 text-xs text-muted-foreground">
              Invite team members by sharing your workspace slug. RBAC roles: Owner, Admin, Member, Viewer.
            </p>
          )}
        </section>

        {/* Webhooks / CRM */}
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Webhooks (CRM Integration)</h2>
            </div>
            {workspace && (
              <button onClick={() => setShowAddWebhook(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-stone-50">
                <Plus className="h-3.5 w-3.5" /> Add Webhook
              </button>
            )}
          </div>

          {!workspace ? (
            <p className="text-sm text-muted-foreground">Create a workspace to configure webhooks.</p>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Send events to HubSpot, Salesforce, Zapier, or any HTTP endpoint. Events are signed with HMAC-SHA256.
              </p>

              {showAddWebhook && (
                <div className="mb-4 rounded-lg border border-border bg-stone-50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="Webhook name"
                      className="h-9 rounded-lg border border-border bg-white px-3 text-sm" />
                    <input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://hooks.example.com/..."
                      className="h-9 rounded-lg border border-border bg-white px-3 text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_EVENTS.map((evt) => (
                      <label key={evt} className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" checked={whEvents.includes(evt)}
                          onChange={(e) => setWhEvents(
                            e.target.checked ? [...whEvents, evt] : whEvents.filter((x) => x !== evt)
                          )} />
                        {evt}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddWebhook}
                      className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-white hover:opacity-80">
                      Save
                    </button>
                    <button onClick={() => setShowAddWebhook(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-stone-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {webhooks.length === 0 && !showAddWebhook && (
                <p className="text-sm text-muted-foreground">No webhooks configured yet.</p>
              )}

              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{wh.name}</p>
                    <p className="text-xs text-muted-foreground">{wh.url}</p>
                    <div className="mt-1 flex gap-1">
                      {wh.events.map((e) => (
                        <span key={e} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteWebhook(wh.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </>
          )}
        </section>

        {/* Knowledge Base */}
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Product Knowledge Base</h2>
            </div>
            <button onClick={() => setShowAddKnowledge(!showAddKnowledge)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-stone-50">
              <Plus className="h-3.5 w-3.5" /> Add Knowledge
            </button>
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            Feed your AI agent product docs, demo scripts, FAQs, and objection playbooks. This knowledge is used during live demos to give accurate, detailed answers.
          </p>

          {/* URL scraper */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={kbUrl} onChange={(e) => setKbUrl(e.target.value)}
                placeholder="Import from URL (scrapes page content)"
                onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:border-foreground focus:outline-none" />
            </div>
            <button onClick={handleScrapeUrl} disabled={!kbUrl.trim() || scrapingUrl}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-white hover:opacity-80 disabled:opacity-50">
              {scrapingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Import
            </button>
          </div>

          {/* Add knowledge form */}
          {showAddKnowledge && (
            <div className="mb-4 rounded-lg border border-border bg-stone-50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={kbType} onChange={(e) => setKbType(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm">
                  <option value="document">Document</option>
                  <option value="demo_script">Demo Script</option>
                  <option value="faq">FAQ</option>
                  <option value="objection">Objection Playbook</option>
                </select>
                <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)}
                  placeholder="Title"
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm" />
              </div>
              <textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)}
                placeholder="Content (paste your docs, scripts, FAQs, etc.)"
                rows={5}
                className="w-full rounded-lg border border-border bg-white p-3 text-sm focus:border-foreground focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={handleAddKnowledge}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-white hover:opacity-80">
                  Save
                </button>
                <button onClick={() => setShowAddKnowledge(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-stone-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Knowledge items */}
          {knowledge.length === 0 && !showAddKnowledge ? (
            <p className="text-sm text-muted-foreground">No knowledge items yet. Add docs, scripts, or import from URLs.</p>
          ) : (
            <div className="space-y-2">
              {knowledge.map((item) => {
                const typeIcons: Record<string, React.ReactNode> = {
                  document: <FileText className="h-3.5 w-3.5" />,
                  url: <Globe className="h-3.5 w-3.5" />,
                  demo_script: <MessageSquare className="h-3.5 w-3.5" />,
                  faq: <BookOpen className="h-3.5 w-3.5" />,
                  objection: <Shield className="h-3.5 w-3.5" />,
                };
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-muted-foreground">{typeIcons[item.source_type] || <FileText className="h-3.5 w-3.5" />}</span>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.source_type} · {item.content.length.toLocaleString()} chars
                          {item.source_url && <> · <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-warm hover:underline">{new URL(item.source_url).hostname}</a></>}
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
        </section>
      </main>
    </div>
  );
}
