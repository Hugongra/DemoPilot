import { createClient } from "@/lib/supabase/server";
import { endSession, getSession } from "@/lib/live/session-manager";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);
  const transcript = session?.transcript || [];

  await endSession(id);

  const supabase = await createClient();
  await supabase
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      transcript,
    })
    .eq("id", id);

  return Response.json({ success: true });
}
