import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(*)")
    .eq("user_id", user.id);

  const workspaces = memberships?.map((m) => ({
    ...(m.workspaces as unknown as Record<string, unknown>),
    role: m.role,
  })) || [];

  return Response.json({ workspaces });
}

export async function POST(request: Request) {
  const { name, slug } = await request.json();

  if (!name || !slug) {
    return Response.json({ error: "Missing name or slug" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Add owner as member
  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  return Response.json({ workspace });
}
