import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { navigateAndCapture } from "@/lib/agent/navigator";
import { generateScript, generateAudio } from "@/lib/agent/voiceover";

export const maxDuration = 300; // 5-minute timeout for long-running generation

async function updateDemo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  demoId: string,
  data: Record<string, unknown>
) {
  await supabase
    .from("demos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", demoId);
}

export async function POST(request: NextRequest) {
  try {
    const { demoId, targetUrl } = await request.json();

    if (!demoId || !targetUrl) {
      return Response.json(
        { error: "Missing demoId or targetUrl" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify demo exists
    const { data: demo } = await supabase
      .from("demos")
      .select("id")
      .eq("id", demoId)
      .single();

    if (!demo) {
      return Response.json({ error: "Demo not found" }, { status: 404 });
    }

    // Phase 1: Navigate and capture screenshots
    await updateDemo(supabase, demoId, {
      status: "navigating",
      steps: [],
    });

    const { steps, narrations } = await navigateAndCapture(
      targetUrl,
      6,
      async (stepNum, description) => {
        // Update progress in real time
        const currentSteps = steps
          .slice(0, stepNum)
          .map((s, i) => ({
            index: i + 1,
            description: s.description,
            url: s.url,
          }));
        await updateDemo(supabase, demoId, { steps: currentSteps });
      }
    );

    // Store final steps metadata (without screenshot buffers)
    const stepsMeta = steps.map((s, i) => ({
      index: i + 1,
      description: s.description,
      url: s.url,
    }));
    await updateDemo(supabase, demoId, { steps: stepsMeta });

    // Upload screenshots to Supabase Storage
    for (let i = 0; i < steps.length; i++) {
      const path = `demos/${demoId}/step-${i + 1}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("demo-assets")
        .upload(path, steps[i].screenshot, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadErr) {
        console.error(`Failed to upload step ${i + 1}:`, uploadErr.message);
      }
    }

    // Phase 2: Generate voiceover script
    await updateDemo(supabase, demoId, { status: "scripting" });

    const script = await generateScript(narrations, targetUrl);
    await updateDemo(supabase, demoId, { script });

    // Phase 3: Generate TTS audio
    await updateDemo(supabase, demoId, { status: "generating_audio" });

    const audioBuffer = await generateAudio(script);

    // Upload audio to Supabase Storage
    const audioPath = `demos/${demoId}/voiceover.mp3`;
    await supabase.storage
      .from("demo-assets")
      .upload(audioPath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    const { data: audioUrlData } = supabase.storage
      .from("demo-assets")
      .getPublicUrl(audioPath);

    // Phase 4: Mark as done
    await updateDemo(supabase, demoId, {
      status: "done",
      audio_url: audioUrlData.publicUrl,
      steps: stepsMeta,
    });

    return Response.json({
      success: true,
      demoId,
      steps: stepsMeta,
      script,
      audioUrl: audioUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Demo generation error:", error);

    // Try to update demo with error status
    try {
      const { demoId } = await request.clone().json();
      if (demoId) {
        const supabase = await createClient();
        await updateDemo(supabase, demoId, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch {
      // Ignore cleanup errors
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
