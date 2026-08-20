import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { script, steps } = await request.json();

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (script !== undefined) updateData.script = script;
  if (steps !== undefined) updateData.steps = steps;

  const { error } = await supabase
    .from("demos")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
