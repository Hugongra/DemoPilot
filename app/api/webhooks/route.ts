import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    return Response.json({ error: "Missing workspace_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ webhooks: data || [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { workspace_id, name, url, events, secret } = body;

  if (!workspace_id || !name || !url) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      workspace_id,
      name,
      url,
      events: events || ["demo.completed"],
      secret: secret || null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ webhook: data });
}
