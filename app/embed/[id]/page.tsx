"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface DemoData {
  id: string;
  status: string;
  target_url: string;
  steps: Array<{ index: number; description: string; screenshotUrl: string; timestamp: number }>;
  script: string | null;
  audio_url: string | null;
  video_url: string | null;
  custom_cta_text?: string;
  custom_cta_url?: string;
}

export default function EmbedViewer() {
  const { id } = useParams<{ id: string }>();
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`/api/demos/${id}/status`)
      .then((r) => r.json())
      .then(setDemo)
      .catch(() => null);

    // Track embed view
    fetch(`/api/demos/${id}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "embed_view" }),
    }).catch(() => null);
  }, [id]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setMuted(false);
      videoRef.current.muted = false;
    }
    setPlaying(!playing);
  }

  if (!demo || demo.status !== "done") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", height: "100%", background: "#0c0a09", color: "#fff",
        fontFamily: "system-ui, sans-serif", fontSize: 14,
      }}>
        {demo?.status === "error" ? "Demo unavailable" : "Loading demo..."}
      </div>
    );
  }

  const videoUrl = `/api/demos/${id}/asset?file=demo.mp4`;
  const hasVideo = !!demo.video_url;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "#000", overflow: "hidden", fontFamily: "system-ui, sans-serif",
    }}>
      {hasVideo ? (
        <video
          ref={videoRef}
          src={videoUrl}
          muted={muted}
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        >
          <track kind="captions" />
        </video>
      ) : (
        <img
          src={demo.steps[0]?.screenshotUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}

      {/* Play overlay when not playing */}
      {!playing && (
        <div
          onClick={togglePlay}
          style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.3)", cursor: "pointer",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.95)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Play size={28} style={{ marginLeft: 4 }} color="#0c0a09" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "8px 12px", display: "flex", alignItems: "center",
        gap: 8, background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
      }}>
        <button onClick={togglePlay} style={{
          background: "none", border: "none", color: "#fff",
          cursor: "pointer", padding: 4,
        }}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={() => {
          setMuted(!muted);
          if (videoRef.current) videoRef.current.muted = !muted;
        }} style={{
          background: "none", border: "none", color: "#fff",
          cursor: "pointer", padding: 4,
        }}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div style={{ flex: 1 }} />
        {demo.custom_cta_text && demo.custom_cta_url && (
          <a
            href={demo.custom_cta_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              fetch(`/api/demos/${id}/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_type: "cta_click" }),
              }).catch(() => null);
            }}
            style={{
              background: "#ff6058", color: "#fff", padding: "6px 16px",
              borderRadius: 6, fontSize: 13, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {demo.custom_cta_text}
          </a>
        )}
        <a
          href={`/demo/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "rgba(255,255,255,0.6)", fontSize: 11,
            textDecoration: "none",
          }}
        >
          DemoPilot
        </a>
      </div>
    </div>
  );
}
