"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Eye, MousePointerClick, Clock, TrendingUp, ArrowLeft, Loader2, BarChart3, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DemoAnalytics {
  id: string;
  target_url: string;
  title: string | null;
  status: string;
  view_count: number;
  created_at: string;
  analytics: {
    views: number;
    plays: number;
    completes: number;
    ctaClicks: number;
    avgDuration: number;
    completionRate: number;
  };
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [demos, setDemos] = useState<DemoAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const listRes = await fetch("/api/demos/list");
      if (listRes.status === 401) { router.push("/"); return; }
      const { demos: demoList } = await listRes.json();

      const withAnalytics = await Promise.all(
        (demoList || [])
          .filter((d: { status: string }) => d.status === "done")
          .map(async (demo: DemoAnalytics) => {
            try {
              const res = await fetch(`/api/demos/${demo.id}/analytics`);
              const analytics = await res.json();
              return { ...demo, analytics };
            } catch {
              return {
                ...demo,
                analytics: { views: 0, plays: 0, completes: 0, ctaClicks: 0, avgDuration: 0, completionRate: 0 },
              };
            }
          })
      );

      setDemos(withAnalytics);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push("/"); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/");
    });
    fetchAnalytics();
  }, [router, fetchAnalytics]);

  const totalViews = demos.reduce((s, d) => s + (d.analytics?.views || 0), 0);
  const totalPlays = demos.reduce((s, d) => s + (d.analytics?.plays || 0), 0);
  const totalCompletes = demos.reduce((s, d) => s + (d.analytics?.completes || 0), 0);
  const totalCtaClicks = demos.reduce((s, d) => s + (d.analytics?.ctaClicks || 0), 0);
  const avgCompletionRate = demos.length > 0
    ? demos.reduce((s, d) => s + (d.analytics?.completionRate || 0), 0) / demos.length
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-warm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <button onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            Analytics
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Demo Analytics</h1>
        <p className="mb-8 text-sm text-muted-foreground">Track views, engagement, and conversions across all your demos</p>

        {/* Summary stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total Views", value: totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
            { label: "Total Plays", value: totalPlays, icon: Play, color: "text-purple-600 bg-purple-50" },
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

        {/* Per-demo table */}
        <div className="rounded-xl border border-border bg-white">
          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Per-Demo Breakdown</h3>
            </div>
          </div>
          {demos.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No completed demos with analytics yet
            </div>
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
                  {demos.map((demo) => (
                    <tr key={demo.id} className="border-b border-border/50 hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <a href={`/demo/${demo.id}`} className="font-medium text-foreground hover:underline">
                          {demo.title || demo.target_url}
                        </a>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(demo.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center">{demo.analytics?.views || 0}</td>
                      <td className="px-3 py-3 text-center">{demo.analytics?.plays || 0}</td>
                      <td className="px-3 py-3 text-center">{demo.analytics?.completes || 0}</td>
                      <td className="px-3 py-3 text-center">{demo.analytics?.ctaClicks || 0}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {demo.analytics?.avgDuration || 0}s
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          (demo.analytics?.completionRate || 0) > 50
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {demo.analytics?.completionRate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
