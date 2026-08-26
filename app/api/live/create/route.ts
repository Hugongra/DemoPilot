import { createClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

export async function POST(request: Request) {
  const body = await request.json();
  const { target_url, language, viewer_name, viewer_role, viewer_company } = body;

  if (!target_url) {
    return Response.json({ error: "Missing target_url" }, { status: 400 });
  }

  const supabase = await createClient();
  const sessionId = uuid();

  const { error } = await supabase.from("live_sessions").insert({
    id: sessionId,
    target_url,
    status: "waiting",
    language: language || "en",
    viewer_name: viewer_name || null,
    viewer_role: viewer_role || null,
    viewer_company: viewer_company || null,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sessionId });
}
