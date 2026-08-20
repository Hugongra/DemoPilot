import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = new URL(request.url).origin;

  const supabase = await createClient();

  const { data: demo, error } = await supabase
    .from("demos")
    .select("id, status, steps, script, audio_url, video_url, error, target_url, created_at")
    .eq("id", id)
    .single();

  if (error || !demo) {
    return Response.json({ error: "Demo not found" }, { status: 404 });
  }

  const steps = (demo.steps as Array<{ index: number; description: string; url: string }>) ?? [];
  const stepsWithScreenshots = steps.map((step) => ({
    ...step,
    screenshotUrl: `${origin}/api/demos/${id}/asset?file=step-${step.index}.jpg`,
  }));

  const audioUrl = demo.audio_url
    ? `${origin}/api/demos/${id}/asset?file=voiceover.mp3`
    : null;

  return Response.json({
    ...demo,
    steps: stepsWithScreenshots,
    audio_url: audioUrl,
  });
}
