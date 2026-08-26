import { createClient } from "@/lib/supabase/server";
import { createLiveSession } from "@/lib/live/session-manager";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sessionData } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!sessionData) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Load knowledge base for this user
  let knowledgeContext = "";
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: knowledge } = await supabase
      .from("product_knowledge")
      .select("title, content, source_type")
      .eq("user_id", user.id)
      .limit(10);

    if (knowledge?.length) {
      knowledgeContext = knowledge
        .map((k) => `[${k.source_type}: ${k.title}]\n${k.content}`)
        .join("\n\n---\n\n")
        .slice(0, 8000); // Cap context size
    }
  }

  try {
    await createLiveSession({
      id,
      targetUrl: sessionData.target_url,
      language: sessionData.language || "en",
      viewerName: sessionData.viewer_name || undefined,
      viewerRole: sessionData.viewer_role || undefined,
      viewerCompany: sessionData.viewer_company || undefined,
      knowledgeContext: knowledgeContext || undefined,
    });

    await supabase
      .from("live_sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", id);

    return Response.json({ success: true, status: "active" });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 500 }
    );
  }
}
