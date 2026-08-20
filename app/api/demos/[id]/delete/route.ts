import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete storage assets
  const { data: files } = await supabase.storage
    .from("demo-assets")
    .list(`demos/${id}`);

  if (files?.length) {
    await supabase.storage
      .from("demo-assets")
      .remove(files.map((f) => `demos/${id}/${f.name}`));
  }

  // Delete DB record
  const { error } = await supabase
    .from("demos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
