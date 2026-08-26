import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: demos } = await supabase
    .from("demos")
    .select("id, target_url, title, status, view_count, created_at")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("created_at", { ascending: false });

  if (!demos?.length) {
    return Response.json({
      totalViews: 0,
      totalPlays: 0,
      totalCompletes: 0,
      avgCompletionRate: 0,
      demos: [],
    });
  }

  const demoIds = demos.map((d) => d.id);

  const { data: events } = await supabase
    .from("demo_analytics")
    .select("demo_id, event_type, duration_seconds")
    .in("demo_id", demoIds);

  const totalViews = events?.filter((e) => e.event_type === "view").length || 0;
  const totalPlays = events?.filter((e) => e.event_type === "play").length || 0;
  const totalCompletes = events?.filter((e) => e.event_type === "complete").length || 0;
  const avgCompletionRate = totalPlays > 0 ? Math.round((totalCompletes / totalPlays) * 100) : 0;

  return Response.json({
    totalViews,
    totalPlays,
    totalCompletes,
    avgCompletionRate,
    demos: demos.map((d) => ({
      ...d,
      views: events?.filter((e) => e.demo_id === d.id && e.event_type === "view").length || 0,
      plays: events?.filter((e) => e.demo_id === d.id && e.event_type === "play").length || 0,
    })),
  });
}
