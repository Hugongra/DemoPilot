import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { event_type, viewer_id, duration_seconds, metadata } = body;

  if (!event_type) {
    return Response.json({ error: "Missing event_type" }, { status: 400 });
  }

  const supabase = await createClient();

  // Insert analytics event
  await supabase.from("demo_analytics").insert({
    demo_id: id,
    event_type,
    viewer_id: viewer_id || null,
    duration_seconds: duration_seconds || null,
    metadata: metadata || {},
  });

  // Increment view count for 'view' events
  if (event_type === "view") {
    const { data: demo } = await supabase
      .from("demos")
      .select("view_count")
      .eq("id", id)
      .single();

    await supabase
      .from("demos")
      .update({ view_count: ((demo?.view_count as number) || 0) + 1 })
      .eq("id", id);
  }

  return Response.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("demo_analytics")
    .select("*")
    .eq("demo_id", id)
    .order("created_at", { ascending: false })
    .limit(500);

  const views = events?.filter((e) => e.event_type === "view").length || 0;
  const plays = events?.filter((e) => e.event_type === "play").length || 0;
  const completes = events?.filter((e) => e.event_type === "complete").length || 0;
  const ctaClicks = events?.filter((e) => e.event_type === "cta_click").length || 0;

  const durations = events
    ?.filter((e) => e.duration_seconds)
    .map((e) => e.duration_seconds as number) || [];
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const completionRate = plays > 0 ? (completes / plays) * 100 : 0;

  return Response.json({
    views,
    plays,
    completes,
    ctaClicks,
    avgDuration: Math.round(avgDuration),
    completionRate: Math.round(completionRate),
    events: events || [],
  });
}
