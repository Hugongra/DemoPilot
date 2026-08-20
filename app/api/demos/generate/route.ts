import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { navigateAndCapture } from "@/lib/agent/navigator";
import { generateScript, generateAudio } from "@/lib/agent/voiceover";
import { compositeVideo, createVideoFromScreenshots } from "@/lib/agent/compositor";
import fs from "fs";
import path from "path";
import os from "os";

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
  const tmpWorkDir = path.join(os.tmpdir(), `demopilot-work-${Date.now()}`);
  fs.mkdirSync(tmpWorkDir, { recursive: true });

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
    await updateDemo(supabase, demoId, { status: "navigating", steps: [] });

    const { steps, narrations, videoPath } = await navigateAndCapture(targetUrl, 6);

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
    const tmpAudioPath = path.join(tmpWorkDir, "voiceover.mp3");
    fs.writeFileSync(tmpAudioPath, audioBuffer);

    // Phase 4: Composite final video
    await updateDemo(supabase, demoId, { status: "compositing" });

    let finalVideoPath: string;
    const hasRealVideo = videoPath && fs.existsSync(videoPath);
    console.log(`[DemoPilot] Compositing: hasRealVideo=${hasRealVideo}, videoPath=${videoPath}`);

    try {
      if (hasRealVideo) {
        finalVideoPath = await compositeVideo(videoPath, tmpAudioPath);
      } else {
        console.log("[DemoPilot] No video recording found, creating from screenshots");
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
    await updateDemo(supabase, demoId, {
      status: "done",
      audio_url: audioStoragePath,
      video_url: videoStoragePath,
      steps: stepsMeta,
    });

    // Cleanup
    try {
      fs.rmSync(tmpWorkDir, { recursive: true, force: true });
      if (videoPath) {
        const videoDir = path.dirname(videoPath);
        if (fs.existsSync(videoDir)) {
          fs.rmSync(videoDir, { recursive: true, force: true });
        }
      }
      const outDir = path.dirname(finalVideoPath);
      if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }

    return Response.json({
      success: true,
      demoId,
      steps: stepsMeta,
      script,
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
      // Ignore
    }

    // Cleanup
    try { fs.rmSync(tmpWorkDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
