import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";

/**
 * Composites a screen recording video with voiceover audio into a final MP4.
 * Adds a subtle DemoPilot watermark.
 */
export async function compositeVideo(
  videoPath: string,
  audioPath: string
): Promise<string> {
  const outputDir = path.join(os.tmpdir(), `demopilot-out-${Date.now()}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "demo.mp4");

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        // Watermark text
        "-vf", "drawtext=text='Made with DemoPilot':fontsize=16:fontcolor=white@0.5:x=w-tw-20:y=h-th-15",
        "-pix_fmt", "yuv420p",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err: Error) => reject(err));

    cmd.run();
  });
}

/**
 * Creates a video from screenshots when video recording isn't available.
 * Each screenshot is shown for a proportional duration synced with audio.
 */
export async function createVideoFromScreenshots(
  screenshots: Buffer[],
  audioPath: string
): Promise<string> {
  const outputDir = path.join(os.tmpdir(), `demopilot-out-${Date.now()}`);
  const framesDir = path.join(outputDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });
  const outputPath = path.join(outputDir, "demo.mp4");

  // Write screenshots as numbered frames
  for (let i = 0; i < screenshots.length; i++) {
    const framePath = path.join(framesDir, `frame-${String(i).padStart(4, "0")}.jpg`);
    fs.writeFileSync(framePath, screenshots[i]);
  }

  // Get audio duration to calculate frame rate
  const audioDuration = await getMediaDuration(audioPath);
  const frameDuration = audioDuration / screenshots.length;
  const frameRate = 1 / Math.max(frameDuration, 0.5);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(framesDir, "frame-%04d.jpg"))
      .inputOptions([`-framerate`, `${frameRate}`])
      .input(audioPath)
      .outputOptions([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        "-vf", "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2,drawtext=text='Made with DemoPilot':fontsize=16:fontcolor=white@0.5:x=w-tw-20:y=h-th-15",
        "-pix_fmt", "yuv420p",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err: Error) => reject(err))
      .run();
  });
}

function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 30);
    });
  });
}
