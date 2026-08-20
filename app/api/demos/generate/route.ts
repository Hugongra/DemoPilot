import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { navigateAndCapture } from "@/lib/agent/navigator";
import { generateScript, generateAudio } from "@/lib/agent/voiceover";
import { compositeVideo, createVideoFromScreenshots } from "@/lib/agent/compositor";
import fs from "fs";

export const maxDuration = 300;

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

    const { data: demo } = await supabase
      .from("demos")
      .select("id")
      .eq("id", demoId)
      .single();

    if (!demo) {
      return Response.json({ error: "Demo not found" }, { status: 404 });
    }

    // Phase 1: Navigate, record video, and capture screenshots
    await updateDemo(supabase, demoId, {
      status: "navigating",
      steps: [],
    });

    const { steps, narrations, videoPath } = await navigateAndCapture(
      targetUrl,
      6,
      async (stepNum, description) => {
        const currentSteps = steps
          .slice(0, stepNum)
          .map((s, i) => ({
            index: i + 1,
            description: s.description,
            url: s.url,
            timestamp: s.timestamp,
          }));
        await updateDemo(supabase, demoId, { steps: currentSteps });
      }
    );

    const stepsMeta = steps.map((s, i) => ({
      index: i + 1,
      description: s.description,
      narration: s.narration,
      url: s.url,
      timestamp: s.timestamp,
    }));
    await updateDemo(supabase, demoId, { steps: stepsMeta });

    // Upload screenshots
    for (let i = 0; i < steps.length; i++) {
      const filePath = `demos/${demoId}/step-${i + 1}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("demo-assets")
        .upload(filePath, steps[i].screenshot, {
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

    const audioStoragePath = `demos/${demoId}/voiceover.mp3`;
    await supabase.storage
      .from("demo-assets")
      .upload(audioStoragePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    // Write audio to temp file for FFmpeg
    const tmpAudioPath = videoPath.replace(/[^/\\]+$/, "voiceover.mp3");
    fs.writeFileSync(tmpAudioPath, audioBuffer);

    // Phase 4: Composite final video (video + audio → MP4)
    await updateDemo(supabase, demoId, { status: "compositing" });

    let finalVideoPath: string;
    try {
      if (videoPath && fs.existsSync(videoPath)) {
        finalVideoPath = await compositeVideo(videoPath, tmpAudioPath);
      } else {
        finalVideoPath = await createVideoFromScreenshots(
          steps.map((s) => s.screenshot),
          tmpAudioPath
        );
      }
    } catch (err) {
      console.error("Compositing error, falling back to screenshots:", err);
      finalVideoPath = await createVideoFromScreenshots(
        steps.map((s) => s.screenshot),
        tmpAudioPath
      );
    }

    // Upload final MP4
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const videoStoragePath = `demos/${demoId}/demo.mp4`;
    const { error: videoUploadErr } = await supabase.storage
      .from("demo-assets")
      .upload(videoStoragePath, videoBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (videoUploadErr) {
      console.error("Failed to upload video:", videoUploadErr.message);
    }

    // Phase 5: Done
    const { data: audioUrlData } = supabase.storage
      .from("demo-assets")
      .getPublicUrl(audioStoragePath);

    const { data: videoUrlData } = supabase.storage
      .from("demo-assets")
      .getPublicUrl(videoStoragePath);

    await updateDemo(supabase, demoId, {
      status: "done",
      audio_url: audioUrlData.publicUrl,
      video_url: videoUrlData.publicUrl,
      steps: stepsMeta,
    });

    // Cleanup temp files
    try {
      if (videoPath) {
        const tmpDir = videoPath.replace(/[/\\][^/\\]+$/, "");
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      if (finalVideoPath) {
        const outDir = finalVideoPath.replace(/[/\\][^/\\]+$/, "");
        fs.rmSync(outDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }

    return Response.json({
      success: true,
      demoId,
      steps: stepsMeta,
      script,
      audioUrl: audioUrlData.publicUrl,
      videoUrl: videoUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Demo generation error:", error);

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
