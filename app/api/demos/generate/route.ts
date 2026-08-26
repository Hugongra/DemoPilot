import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { navigateAndCapture } from "@/lib/agent/navigator";
import { generateScript, generateAudio } from "@/lib/agent/voiceover";
import { compositeVideo, createVideoFromScreenshots } from "@/lib/agent/compositor";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
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
      return Response.json({ error: "Missing demoId or targetUrl" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: demo } = await supabase
      .from("demos")
      .select("id, language, prospect_name, prospect_role, prospect_company, workspace_id")
      .eq("id", demoId)
      .single();

    if (!demo) {
      return Response.json({ error: "Demo not found" }, { status: 404 });
    }

    const language = (demo.language as string) || "en";

    // Phase 1: Navigate with video recording
    await updateDemo(supabase, demoId, { status: "navigating", steps: [] });

    const { steps, narrations, videoPath } = await navigateAndCapture(targetUrl, {
      maxSteps: 6,
      language,
      prospectName: demo.prospect_name as string | undefined,
      prospectRole: demo.prospect_role as string | undefined,
      prospectCompany: demo.prospect_company as string | undefined,
    });

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
      await supabase.storage.from("demo-assets").upload(filePath, steps[i].screenshot, {
        contentType: "image/jpeg", upsert: true,
      });
    }

    // Phase 2: Generate multilingual voiceover script
    await updateDemo(supabase, demoId, { status: "scripting" });
    const script = await generateScript(
      narrations,
      targetUrl,
      language,
      demo.prospect_name as string | undefined
    );
    await updateDemo(supabase, demoId, { script });

    // Phase 3: Generate TTS audio in selected language
    await updateDemo(supabase, demoId, { status: "generating_audio" });
    const audioBuffer = await generateAudio(script, language);

    await supabase.storage.from("demo-assets").upload(
      `demos/${demoId}/voiceover.mp3`, audioBuffer,
      { contentType: "audio/mpeg", upsert: true }
    );

    const tmpAudioPath = path.join(tmpWorkDir, "voiceover.mp3");
    fs.writeFileSync(tmpAudioPath, audioBuffer);

    // Phase 4: Composite final video
    await updateDemo(supabase, demoId, { status: "compositing" });

    let finalVideoPath: string;
    const hasRealVideo = videoPath && fs.existsSync(/* turbopackIgnore: true */ videoPath);

    try {
      if (hasRealVideo) {
        finalVideoPath = await compositeVideo(videoPath, tmpAudioPath);
      } else {
        finalVideoPath = await createVideoFromScreenshots(
          steps.map((s) => s.screenshot), tmpAudioPath
        );
      }
    } catch {
      finalVideoPath = await createVideoFromScreenshots(
        steps.map((s) => s.screenshot), tmpAudioPath
      );
    }

    // Upload final MP4
    const videoBuffer = fs.readFileSync(finalVideoPath);
    await supabase.storage.from("demo-assets").upload(
      `demos/${demoId}/demo.mp4`, videoBuffer,
      { contentType: "video/mp4", upsert: true }
    );

    // Phase 5: Done
    await updateDemo(supabase, demoId, {
      status: "done",
      audio_url: `demos/${demoId}/voiceover.mp3`,
      video_url: `demos/${demoId}/demo.mp4`,
      steps: stepsMeta,
    });

    // Dispatch webhooks
    if (demo.workspace_id) {
      dispatchWebhooks(demo.workspace_id as string, "demo.completed", {
        demo_id: demoId,
        target_url: targetUrl,
        steps: stepsMeta.length,
        language,
      });
    }

    // Cleanup
    try {
      fs.rmSync(tmpWorkDir, { recursive: true, force: true });
      if (videoPath) fs.rmSync(path.dirname(videoPath), { recursive: true, force: true });
      fs.rmSync(path.dirname(finalVideoPath), { recursive: true, force: true });
    } catch { /* ignore */ }

    return Response.json({ success: true, demoId, steps: stepsMeta, script });
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
    } catch { /* ignore */ }

    try { fs.rmSync(tmpWorkDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
